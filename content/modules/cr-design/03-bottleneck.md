---
id: cr-design-03-bottleneck
module: cr-design
order: 3
title: 瓶頸識別與擴充
subtitle: 只針對第一個瓶頸擴充
status: ready
minutes: 30
level: 4
prereqs:
  - cr-design-02-api
objectives:
  - 由需求量估算容量缺口
  - 比較加副本與改變資料存取方式
tags:
  - design
  - bottleneck
resources:
  - title: Google SRE：從延遲、流量與飽和度看系統
    url: https://sre.google/sre-book/monitoring-distributed-systems/
    kind: book
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Google SRE Workbook：用具體數量做系統設計
    url: https://sre.google/workbook/non-abstract-design/
    kind: book
    lang: en
    minutes: 12
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-design-03-bottleneck-convert
    prompt: 每秒 120 筆查詢各要 3 次讀取，資料庫需求是多少？
    answer: 每秒 360 次讀取；先統一為資料庫操作數。
    mcq:
      options:
        - 每秒 40 次讀取
        - 每秒 120 次讀取
        - 每秒 240 次讀取
        - 每秒 360 次讀取
      answer: 3
      explain: 240 是假設容量，不是需求；除以 3 則把換算方向顛倒。
  - id: cr-design-03-bottleneck-replicas
    prompt: 應用加倍後資料庫仍只能做每秒 240 次讀取，每筆需 3 次，上限是多少？
    answer: 仍是每秒 80 筆查詢，瓶頸沒變。
    mcq:
      options:
        - 每秒 80 筆
        - 每秒 160 筆
        - 每秒 240 筆
        - 每秒 400 筆
      answer: 0
      explain: 副本提高應用層能力，沒有擴大資料庫能力。
    interview:
      question: 完成量停在每秒 80 筆，你怎麼判斷是需求不足還是飽和？
      points:
        - 比較送入與完成
        - 定位佇列與等待
        - 固定負載改一項再量
      answer: 我會同時看每秒進來幾筆、有沒有逾時，以及哪層等越來越久。若送入 120、資料庫等待持續長，先對照每筆讀取次數，再只改查詢方式重測，不直接加應用副本。
  - id: cr-design-03-bottleneck-cost
    prompt: 把 3 次查詢合為 1 次後，要重新量哪個假設？
    answer: 合併查詢的單次成本與持續處理能力，並確認整體延遲與結果不變。
practice:
  - id: cr-design-03-bottleneck-p1
    title: 寫一張瓶頸改案比較單
    kind: code
    minutes: 12
    steps:
      - 保存 bottleneck.py，把 3 列容量與缺口記入 bottleneck.md，逐欄寫單位。
      - 把合併查詢的資料庫能力改為每秒 90 次，再寫會不會採用，以及還缺哪項量測。
    checks:
      - 原 3 案上限是每秒 80、80、200 筆；新假設下合併案只能達 90 筆。
      - 結論分清模型上限與達標實測，沒有用估算替查詢延遲背書。
---

## 加一台應用伺服器，排隊怎麼還在變長？
報名開放前，測試頁面反應很快。開放後，前端的應用副本 (replica) 只用了一半運算能力，後面的資料庫卻開始排隊。瓶頸 (bottleneck) 是在目前工作負載下最先限制整條路徑的資源；不是看監控圖最高的線就下單。要把需求和能力換成同一單位，並用每一層的等待和完成量檢查假說。

## 從每秒請求換成每秒操作
假設尖峰有每秒 120 筆查詢，每筆都拜訪資料庫 3 次，沒有其他流量。資料庫在能接受的延遲下可持續處理每秒 240 次這種讀取，應用層每秒能服務 200 筆查詢。請求單位和操作單位不能直接比較。資料庫每秒需要做 360 次讀取，差 120 次；換成使用者看到的能力，原設計最多每秒約 80 筆查詢。當入口維持每秒 120 筆，若不拒絕、也沒有逾時，待辦每秒自然增加約 40 筆。

兩個提案都叫「擴充」，買到的卻不同。多開一個應用副本可以處理更多應用運算，卻不會減少每筆資料庫讀取。另一案把可合在一起的資訊用一次查詢取得，若實測這種查詢的單次成本仍近似原本，則需求變成每秒 120 次。這個「若」不能省；把 3 次小查詢合成 1 次全表掃描，操作數雖少，資料庫可能更慢。

## 範例：先把天花板算出來
在 `C:\dev\stackway-lab\design-interview` 存 `bottleneck.py`，執行 `py bottleneck.py`；macOS／Linux 用 `python3 bottleneck.py`。這是穩態估算，不含流量變化與故障餘裕。

```python
for app, reads in [(200, 3), (400, 3), (200, 1)]:
    db_ops = 240
    ceiling = min(app, db_ops / reads)
    print(app, reads, ceiling, max(0, 120 - ceiling))
```

2 個副本不改原始 80 筆的整體上限；減少讀取後，模型預估上限變成 200，這時應用層反而先滿。若活動有大量人同時看最後一席，還要分開看讀取與扣位寫入：快取可以替查詢吸收重複讀取，但已過期的剩餘席次不能拿來核准報名。不能用犧牲上一堂定好的資料權威，來製造一個漂亮的吞吐量。

### 用反證決定下一次量什麼
假如改案後，資料庫等待確實大幅下降，使用者仍然等一樣久，這不是「測試沒意義」，而是瓶頸可能已移動。順著同一筆請求重新量各段耗時，查看回應序列化、網路傳送或其他相依是否接替成為限制。保留改案前的相同負載作對照，才能分清工作只是搬到別處，還是原來對需求的假設本來就不對。

## 常見錯誤
把 1 分鐘平均除以 60 就當尖峰，或只看完成量不看送入量。系統飽和時，完成量可能一直停在同一數字，反而是佇列年齡在增加。做對照時固定查詢內容、資料量與讀寫比例，一次只改一件事，比較整條路徑的尾端延遲、每秒完成數與資料庫等待，而非只報某一行程式快了幾毫秒。

## 小結
好答案不會承諾「加機器一定線性變快」。先說卡在哪、差多少、為何首選會改變那項需求或能力，再說哪個實測結果會讓你換一個方案。
