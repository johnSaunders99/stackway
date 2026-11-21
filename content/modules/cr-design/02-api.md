---
id: cr-design-02-api
module: cr-design
order: 2
title: API 邊界與資料流
subtitle: 從一條使用流程畫出資料流
status: ready
minutes: 30
level: 4
prereqs:
  - cr-design-01-frame
objectives:
  - 標出資料權威來源與寫入邊界
  - 追蹤回應以前必須完成的步驟
tags:
  - design
  - dataflow
resources:
  - title: Azure Architecture Center：設計資源與 HTTP 回應
    url: https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design
    kind: doc
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-design-02-api-authority
    prompt: 通知還沒到，查詢頁應以哪裡判定是否已錄取？
    answer: 讀取已提交且屬於該學員的報名紀錄。
    mcq:
      options:
        - 信件寄送歷史
        - 瀏覽器上一頁的按鈕狀態
        - 已提交的報名列
        - 通知佇列長度
      answer: 2
      explain: 信件與畫面都可能延遲，佇列數量也不代表某人的席次。
  - id: cr-design-02-api-atomic
    prompt: 哪組動作要一起提交，才不會扣了位卻找不到報名與待送通知？
    answer: 條件式扣位、建立報名列與新增待通知事件。
    mcq:
      options:
        - 先寄出信再扣位
        - 建立畫面截圖和記錄點擊
        - 把寄信服務的回覆當作交易紀錄
        - 扣位、報名、待通知事件
      answer: 3
      explain: 資料庫能原子保存待送事實，無法撤回已送到外部的信。
    interview:
      question: 如果通知服務今天停機，你的 POST 還能回成功嗎？
      points:
        - 先定義成功是取得席次
        - 交易提交才回覆
        - 待送事件可補送且能查詢
      answer: 可以，前提是成功指席次已確認。我會把扣位、報名和待通知事件放在同一筆資料庫交易，提交後才回收據。學員不用等信就可查紀錄，寄信失敗則由背景工作補送。
  - id: cr-design-02-api-retry
    prompt: 提交成功但回覆丟失時，同內容重送應取得什麼？
    answer: 同身分同操作範圍內，以原請求識別碼取回原收據，不重扣席次。
  - id: cr-design-02-api-debit
    prompt: 兩個請求同時搶最後一席，為什麼先讀餘額再各自寫入不夠？
    answer: 兩者可能讀到同一份舊餘額；應以條件式扣位或鎖保護，並與報名資料一同提交。
    mcq:
      question: 有兩個不同請求同時要最後一席，什麼能守住不超收？
      options:
        - 各自在畫面重新讀一次剩餘席次
        - 替兩封通知使用不同識別碼
        - 以條件更新或鎖保護扣位並一同提交報名
        - 在送出按鈕上顯示倒數
      answer: 2
      explain: 兩個合法請求也可能撞在同一個餘額；顯示與通知無法讓資料庫的決定具排他性。
practice:
  - id: cr-design-02-api-p1
    title: 畫出送件與重送的泳道圖
    kind: build
    minutes: 13
    steps:
      - 在 flow.md 用學員、入口、資料庫、通知工作四欄，畫一次成功與一次回覆丟失。
      - 執行 flow.py，把收據和事件數寫在兩條路徑旁，圈出可以回成功的位置。
    checks:
      - 同鍵回原收據，另一個鍵為 full，只有 1 個通知事件。
      - 圖上待通知事件在交易內，實際寄送在交易外，沒有把依序模擬當作併發測試。
---

## 一個成功畫面，靠哪一筆紀錄兌現？
把報名頁關掉再開，畫面仍然要能回答「我有沒有名額」。如果答案只放在剛才寄出的通知裡，通知延遲時，系統自己都無法確認。應用程式介面 (API) 是呼叫端能依賴的行為契約；資料流則說明為了兌現這個契約，資料會經過誰、最後由誰說了算。兩張圖應當能沿著同一筆報名對起來。

## 先找到權威來源，再畫箭頭
假設一場活動只有一種名額，學員從自己的畫面送出報名。伺服器先驗證身分並檢查該學員有權看這場，再進入同一筆交易 (transaction)：扣除仍有餘額的席次、建立報名紀錄，並留下待通知事件。寫不完整就全部撤回。資料庫中已提交的報名列是權威來源 (source of truth)，通知信或畫面上的快取不是。最後一席必須用有條件更新或鎖保護；先讀出還有 1 席再分開寫，兩人可能都看到同一個舊值。

建立端點接收活動與請求識別碼，學員身分從已驗證的連線取得，不由畫面任意指定。成功可回 201 與報名識別碼，名額用完回 409；查詢端點只讀取這位學員自己的紀錄。通知工作在交易提交後非同步處理，通知失敗不把已確認的席次改成未錄取。若在資料庫提交後才另行嘗試發送事件，中間中斷可能永遠不通知；先把待送事件和報名一起寫入，再由背景工作取出，就能恢復這段工作。

## 範例：模擬回覆在途中不見
在 `C:\dev\stackway-lab\design-interview` 存 `flow.py`，執行 `py flow.py`；macOS／Linux 用 `python3 flow.py`。它只演示同一位學員、同一活動、同一內容的**依序**重送，不是多連線資料庫實作。

```python
receipts, events = {}, []
def submit(key):
    if key in receipts:
        return receipts[key]
    if len(receipts) >= 1:
        return "full"
    receipts[key] = "confirmed:R1"
    events.append("notify:R1")
    return receipts[key]
print(submit("try-A"), submit("try-A"), submit("try-B"), events)
```

第一次回覆若丟失，第二次用同一識別碼查回原收據，只排 1 次通知；另一個新請求才是滿額。正式服務還要把識別碼的唯一性綁在身分和操作範圍，記住原輸入；同一識別碼夾帶不同內容不能直接回成功。資料庫的唯一限制處理併發撞鍵，和條件式扣位一起才守得住契約。

畫圖時用實線表示成功回應以前一定完成的事，虛線表示稍後可做的事。在每條線旁寫入傳的是請求識別碼、報名收據還是待送事件；若兩條線的資料意義不同，就算目的地是同一台機器，也不要合成一根沒有標籤的箭頭。

## 常見錯誤
用「寫入成功才寄信」當作交易完整性的證明，忽略程序可能在兩步之間中斷。或把所有外部呼叫塞進交易，以為信寄出去也可一起撤回。兩者都混淆了資料庫能原子處理的範圍。把通知留在可補送的資料裡，另行監看，而不是讓外部寄送服務決定報名成功與否。

## 小結
請指著圖說完一條句子：哪一步完成後可以向使用者承諾席次，哪一步可以稍後再做，以及對方重送時哪裡能找回原來的結果。
