---
id: cr-design-05-close
module: cr-design
order: 5
title: 設計摘要與未決問題
subtitle: 用 2 分鐘收斂設計
status: ready
minutes: 35
level: 4
prereqs:
  - cr-design-04-outage
objectives:
  - 列出最關鍵的一個取捨
  - 讓未解風險都有驗證方式與優先順序
tags:
  - design
  - summary
resources:
  - title: Azure Well-Architected：架構決策紀錄
    url: https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Atlassian：工程面試中的系統設計與協作
    url: https://www.atlassian.com/company/careers/resources/interviewing/engineering
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-design-05-close-tradeoff
    prompt: 哪一句完整說出非同步通知的取捨？
    answer: 不讓寄送延遲阻塞報名，但須承擔待送與補送。
    mcq:
      options:
        - 使用佇列所以不會失敗
        - 報名不等寄送，但需追蹤補送
        - 採用新框架提升現代化
        - 服務拆成三個方塊
      answer: 1
      explain: 取捨要同時指出買到的能力與付出的新成本。
  - id: cr-design-05-close-risk
    prompt: 要先驗「最後一席能否不超收」，哪個實驗最有區辨力？
    answer: 以兩個獨立請求並行搶最後一席，檢查已提交的有效收據數。
    mcq:
      options:
        - 量通知信的字數
        - 依序讀兩次首頁
        - 並行送件後查有效收據
        - 只確認兩個請求都有回覆
      answer: 2
      explain: 同時性與最後一席是觸發條件；收到回覆不表示交易符合規則。
  - id: cr-design-05-close-status
    prompt: 如何在摘要中區分未驗證假設與測試結論？
    answer: 把預期判準寫成未來式，另列已執行的條件、觀察與結果。
    interview:
      question: 用 2 分鐘結束設計時，你最不願意刪掉哪兩句？
      points:
        - 首選相對替代案的理由與成本
        - 能推翻首選的觀察
        - 下一個實驗和處理方式
      answer: 我會保留「不等寄信讓報名在寄送故障時仍可用，但要負擔補送」，以及「先用最後一席跑併發驗證，若超收就停在這裡修交易」。拿掉這兩句，圖還在，卻沒人知道我怎麼決定。
practice:
  - id: cr-design-05-close-p1
    title: 錄下一份 2 分鐘設計摘要
    kind: explain
    minutes: 15
    steps:
      - 建立 close.md，寫下首選、替代案、代價，並把兩個未決風險依影響排序。
      - 口述一次並記各段秒數，用程式加總；若超時，刪去一段重複介紹後再講一次。
    checks:
      - 保留一項會推翻現案的觀察，每項風險都有實驗、判準與負責角色。
      - 有一次不超過 120 秒的口述紀錄，且未將排定的實驗說成已通過。
---

## 面試快結束了，最後一張白板留下什麼？
前面談過名額、資料庫與通知，面試官說：「剩 2 分鐘，請總結。」把剛畫過的每個方塊再介紹一次，反而把最有價值的判斷藏起來。設計摘要是給下一位做決定的人：用哪種方案守住哪個目標、放棄什麼、哪種證據會改變決定。就算對方沒看過你的圖，也應該知道接下來要先驗哪一件事。

## 用決策紀錄收斂，而非把所有選項列一遍
架構決策紀錄 (architecture decision record, ADR) 可以很短。寫下背景與必要條件，接著用「我們選了甲而不是乙，因為……；代價是……」寫首選。對報名系統而言，核心決定是席次交易提交後立刻回收據，不在回應路徑等待通知。它守住不超收與即時查詢，代價是有些通知會晚到，要維護持久待送清單、補送與狀態說明。「用了佇列」不是理由，非同步也不是免費可靠性。

未決問題不是所有值得知道的事。先列會推翻必要條件、且未有證據的風險。例如最後一席遇併發是否仍只能成功 1 筆，比調整通知信排版重要；若重試寄信可能重複，影響的是通知品質，不應混成席次重複。每個風險配上最小實驗、預期觀察、負責角色和改案條件；只有「再測看看」並沒有安排下一步工作。

## 範例：把 120 秒分給 4 句話
練習用：先用 20 秒說「設計給單場學員，成功即確認，不含付款」。用 35 秒說「席次、收據、待送事件一起提交；信件晚到仍可查席次」。再用 35 秒說「同步寄信也行，但外部寄送故障時會拖累報名，因此我們接受通知延遲」。最後 30 秒說「先用兩個獨立連線同時搶最後一席，只應有 1 張有效收據；若有 2 張，先修交易邊界而非擴充流量」。這是演練腳本，不是已執行的測試報告。

在 `C:\dev\stackway-lab\design-interview` 將下列內容存成 `close.py`，執行 `py close.py`；macOS／Linux 用 `python3 close.py`。用自己試講量到的秒數換掉範例，輸出會指出哪些部分最擠。

```python
parts = {"scope": 20, "decision": 35, "tradeoff": 35, "next": 30}
print("total", sum(parts.values()), "left", 120 - sum(parts.values()))
print("longest", max(parts, key=parts.get))
```

如果超時，先刪重複的元件名稱，保留「為什麼沒選另一案」及失敗時的動作。練習聽眾可以只問一句：「哪個結果出現，你願意改變主意？」若回答是「看情況」，摘要就還缺能區分選項的觀察。若兩種方案都會通過你的測試，就應另設案例，不能把沒有區別的通過當作選案理由。

## 常見錯誤
把預估當實測、把暫時選擇說成唯一正解，或給每個未決問題同樣的優先順序。應清楚標記已讀到的需求、為了估算暫設的數字，以及真正做過的驗證。第一個實驗若失敗，先回到受影響的結論，不必把整張圖全部推倒。

## 小結
讀完摘要，接手的人能說出「先保哪一項、願付什麼代價、明早開始驗什麼」就夠了。白板可以擦掉，這三件事不能跟著消失。
