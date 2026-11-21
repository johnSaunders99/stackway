---
id: cr-design-04-outage
module: cr-design
order: 4
title: 故障範圍與降級
subtitle: 面試官抽走一個服務
status: ready
minutes: 35
level: 4
prereqs:
  - cr-design-03-bottleneck
objectives:
  - 界定立即受影響與仍可服務的功能
  - 解釋回復時如何處理積壓
tags:
  - design
  - resilience
resources:
  - title: Azure Architecture Center：用佇列調節負載
    url: https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Google SRE：過載時如何調節請求
    url: https://sre.google/sre-book/handling-overload/
    kind: book
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-design-04-outage-boundary
    prompt: 只有寄送服務中斷、交易已提交時，畫面該如何回應？
    answer: 顯示席次已確認、通知待送，讓學員可查詢原收據。
    mcq:
      options:
        - 已報名，通知待送
        - 已寄達，請查信箱
        - 報名失敗，請立刻重送
        - 撤回所有已確認席次
      answer: 0
      explain: 本次故障影響通知，不改變資料庫已提交的席次。
  - id: cr-design-04-outage-drain
    prompt: 積壓 120 件，每分鐘新增 20、最多送 50，要幾分鐘追平？
    answer: 4 分鐘，因為淨消化率每分鐘只有 30 件。
    mcq:
      options:
        - 2.4 分鐘
        - 4 分鐘
        - 6 分鐘
        - 只要 1 分鐘
      answer: 1
      explain: 用總能力當淨能力會忽略持續到來的通知。
    interview:
      question: 依賴服務回來了，你會讓背景工作把全部積壓一次送出嗎？
      points:
        - 區分下游能力與淨消化率
        - 限速並監看最老等待
        - 處理不明結果與重複
      answer: 我會先確認穩定能送多少，再扣掉新進量估追平時間。分批恢復並看失敗件和最老等待；先前沒收到回覆的事件，要保留同一個識別碼，不能當成一定沒寄過。
  - id: cr-design-04-outage-uncertain
    prompt: 寄送後沒有收到供應端回覆，為何不能直接判為沒寄出？
    answer: 逾時只代表沒有收到確認；外部動作可能已生效，應用同鍵重試或核對。
practice:
  - id: cr-design-04-outage-p1
    title: 寫一張通知故障交班單
    kind: explain
    minutes: 15
    steps:
      - 在 outage.md 列出寄送故障與資料庫故障時，送件、查詢與通知各能承諾什麼。
      - 保存 drain.py 的逐分鐘積壓，另算每分鐘只能送 20 件時的情況並指定下一步。
    checks:
      - 兩種故障的成功畫面不同；沒有從快取核准新名額。
      - 原案例第 4 分鐘追平；降到 20 時不會追平，交班單另有失敗件查核。
---

## 通知系統停了，是誰真的不能報名？
活動開放後，寄送通知的服務沒有回覆。有人提議把整個報名頁切成維護，有人提議忽略寄信錯誤繼續顯示「通知已送達」。兩種做法都擴大了原本的問題。故障範圍 (blast radius) 要用使用者能力表達：哪些人現在不能做哪件事、哪些承諾其實仍可兌現。不是圖上有幾個方塊變成紅色。

## 沿著同步與非同步的分界追
假設席次與待通知事件一起提交，查詢頁直接讀取報名資料。寄送服務壞了，不影響已確認席次，畫面應說「已報名，通知待送」，而不是要求重報。背景工作要有逾時、有限次重試與逐次拉長等待的退避 (backoff)，避免故障服務剛恢復就收到更多請求。相反地，若出問題的是權威資料庫，不能靠舊快取發出新席次；明說暫時無法確認，比多賣後再撤回可靠。

等待中的通知要保存、要能查年齡，也要知道容量上限。若佇列已接近上限，應先告警，與產品約定是否可以暫緩新報名；不能嘴上承諾稍後通知，背後卻默默丟掉事件。故障期間記下新事件進入速率與最老待送事件的年齡；單看佇列長度，會把少量但等很久的通知當成沒有急迫性。

## 範例：恢復服務不等於追平積壓
假設故障時每分鐘新增 20 件通知，停了 6 分鐘，期間完全沒寄。恢復後下游可平穩接受每分鐘 50 件，新通知仍以每分鐘 20 件進入。用 `C:\dev\stackway-lab\design-interview` 裡的 `drain.py` 算追平時間，執行 `py drain.py`；macOS／Linux 用 `python3 drain.py`。

```python
backlog = 20 * 6
for minute in range(1, 7):
    backlog = max(0, backlog + 20 - 50)
    print(minute, backlog)
```

積壓依序是 90、60、30、0。不能把 120 除以 50，因為仍有人報名。也不能把每分鐘 50 當強制送出的數字，一旦待送不足就只送已有的事件。若下游只能接受每分鐘 20 件，積壓將永遠維持，必須談臨時容量、限入或延後次要通知，不是讓工作程式開更多執行緒搶同一個下游。

整個過程可以讓支援角色回答兩個不同的詢問：「我是否已經有席次？」看收據；「為什麼還沒收到通知？」看事件狀態與最老等待。若介面只能回答其中一個，就在交班文件標清楚查詢管道，不讓使用者拿重複報名當作查進度的方法。

## 常見錯誤
下游可能已寄出，卻在回覆前失去連線。重試若不帶同一事件識別碼，收件者可能收到兩封。若供應端支援冪等鍵，就跨次重試保持相同；若不支援，不能宣稱跨系統保證只寄一次，應記錄不明狀態並核對。最後別只因佇列長度歸零就結案：可能是失敗件被移到另處，還要檢查待人工處理清單與實際成功送達的觀測。

## 小結
故障處理有兩條時間線：一條是使用者此刻還能做什麼，另一條是恢復後要多久才能補回欠下的工作。兩條都講得清楚，降級才不是另一種模糊承諾。
