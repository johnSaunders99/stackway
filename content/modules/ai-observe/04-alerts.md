---
id: ai-observe-04-alerts
module: ai-observe
order: 4
title: 告警條件與處置
subtitle: 讓告警對應到人能做的事
status: ready
minutes: 35
level: 3
prereqs:
  - ai-observe-03-gpu
objectives:
  - 依使用者症狀設定告警條件
  - 為每則告警指定查證與解除方式
tags:
  - observe
  - alerts
resources:
  - title: Google SRE 工作手冊：依服務目標告警
    url: https://sre.google/workbook/alerting-on-slos/
    kind: book
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
    note: 看告警的精確度與反應時間如何取捨。
concepts:
  - id: ai-observe-alert-action
    prompt: 什麼告警條件值得喚醒輪值者？
    answer: 對準使用者影響，有明確分母、時間與可執行的查證及處置，而不是單看資源很忙。
    mcq:
      question: 要針對推論使用者拿不到回覆告警，哪項最直接？
      options:
        - 入口請求的逾時比例持續超標
        - GPU 使用率瞬間變高
        - 模型占用記憶體高於過去 1 週平均
        - 工作者紀錄行數加倍
      answer: 0
      explain: 逾時直接描述使用者症狀，其餘只是可能原因或正常活動。
    interview:
      question: 你會怎麼替入口逾時告警寫一段值班處置？
      points:
        - 寫清時窗與分母
        - 指出下一個查證點及處置條件
        - 用原指標解除
      answer: 我會附入口逾時數及總量，先對照近期發布與排隊。若小流量對照支持新版本退化，才按授權流程回復，並在有請求的連續健康窗確認解除。
  - id: ai-observe-clear-evidence
    prompt: 沒有流量的視窗能否作為恢復證據？
    answer: 不能，沒有足夠觀測；應分清無資料與觀察到健康請求。
    mcq:
      question: 解除條件是連續 2 個有足夠請求的健康窗。已發出告警後連續 2 分鐘沒有樣本，狀態應如何？
      options:
        - 當作連續兩窗全成功
        - 維持告警，不累計健康窗
        - 直接將逾時率填為 0 解除
        - 視為已確認所有請求失敗
      answer: 1
      explain: 無樣本兩種方向都不能證明，另需查流量與監測。
  - id: ai-observe-alert-hysteresis
    prompt: 分開觸發與解除門檻、要求連續視窗，有什麼取捨？
    answer: 降低瞬間波動與反覆切換，但可能延後通知與解除。
  - id: ai-observe-alert-threshold
    prompt: 為什麼要特別測「剛好到達門檻」的視窗？
    answer: 含等號與不含等號會使邊界決策不同；檢查精確邊界能確認手冊與實作一致。
    mcq:
      question: 若須低於 5% 才算健康窗，40 筆中 2 筆逾時，應如何記？
      options:
        - 計作健康窗
        - 樣本數視同為 0
        - 未低於門檻，不累計健康窗
        - 等於 10% 壞窗門檻
      answer: 2
      explain: 2 除以 40 剛好是 5%，不符合嚴格小於 5% 的解除累計條件。
practice:
  - id: ai-observe-04-lab
    title: 重播一張能解除的告警單
    kind: code
    minutes: 13
    steps:
      - 把觸發、解除時刻存入 alert-notes.txt
      - 加上入口症狀、值班角色、第一個查證動作與解除條件，再插入一個無資料窗測試
    checks:
      - 原題只印 FIRE 3 與 CLEAR 8
      - 在 2 個健康窗中間插入無資料窗，不會沿用先前累計解除
---

## 為什麼要學

凌晨收到「GPU 使用率 95%」的通知，服務其實正常；真正開始逾時時，大家已經習慣把通知按掉。告警（alert）的任務不是說有數字變了，而是讓輪值者知道哪種使用者體驗受損、現在能做哪一步，以及如何判斷事情真的恢復。

## 把服務目標寫成可查證的條件

服務水準指標（SLI）是一種可量的體驗，例如在期限內成功的請求數除以有效請求數。服務水準目標（SLO）則說明期望在多長期間內達到什麼水準。長期目標不是單一壞分鐘就已違約；告警條件要能在造成明顯影響時及早行動。本題採教學用的短窗規則，不是所有服務都該照抄的正式門檻。

以固定、不重疊的每分鐘視窗觀察入口逾時比例。每窗至少有 20 筆，連續 2 窗逾時率達 10% 才發出通知；中間若分母不足，不當成連續壞窗。解除用另一條條件：連續 2 個有足夠流量的視窗低於 5%。門檻中間的區帶與連續窗設定能避免警報在邊界反覆開關，代價是至少要等到第二個合格視窗。無資料時不宣告恢復，另查資料收集是否中斷。

## 範例：把規則重播一次
要把單次告警與一段期間的服務承諾分開，可以接著讀[〈服務目標與需求〉](#/lesson/fd-design-01-requirements)：告警提示現在要不要處置，目標用來判斷承諾有沒有履行。


輸入只含總請求數與逾時數。先算這窗的比例，再更新連續次數，只在狀態真的切換時輸出通知。這比每一次檢查都重發同一封訊息容易處置，也能在真正上線前用假資料測試規則。

在 `C:\dev\stackway-lab\observe` 新建 `alert_replay.py`。把短暫尖峰和連續超標分別標在紙上。哪一段應通知值班者，取決於告警條件而非單一最高點。

在該目錄執行：Windows PowerShell 用 `py alert_replay.py`；macOS／Linux 用 `python3 alert_replay.py`。

```python
windows = [(40,1),(40,5),(40,6),(0,0),(40,1),(40,3),(40,1),(40,0)]
active, bad, good = False, 0, 0
for minute, (total, timeout) in enumerate(windows, 1):
    rate = timeout/total if total >= 20 else None
    bad = bad + 1 if rate is not None and rate >= .10 else 0
    good = good + 1 if rate is not None and rate < .05 else 0
    if not active and bad >= 2:
        active = True
        print("FIRE", minute)
    elif active and good >= 2:
        active = False
        print("CLEAR", minute)
```

請把「收到通知後先看最近版本與佇列」和「立刻回復版本」寫成兩行。第一行是任何輪值者都可做的查證；第二行要有影響範圍、授權與回復判準。告警分類再準，也不能代替這些處置前提。

### 演練確認規則有沒有踩線

門檻若寫「達到」就包含等於；寫「低於」則不包含等於。假設某窗有 40 筆，其中 4 筆逾時，剛好達到壞窗門檻；若只有 2 筆逾時，剛好等於解除門檻，仍不能當健康窗。在演練時添上這兩列，即可檢查實作與值班手冊描述是否一致。

若某次告警一直不解除，不應直接降低判準來消紅燈。先看是確有少數使用者仍受影響，還是已沒有足夠樣本。前者需要繼續處置，後者需要新的驗證訊號；等待者應收到不同的交接說明。

## 常見錯誤

不要把單一失敗除以單一請求得到的 100%，與 100 筆中 100 筆失敗視為相同證據。最低流量能抑制小分母噪音，卻可能讓低流量服務完全沒有通知，因此正式規則要補適合的探測或絕對失敗數。也不要把「執行回復」當成「服務已恢復」，一定要回去看原本的使用者指標。

## 小結

告警文字要可執行：哪個入口、哪段時間、逾時幾筆、該先查哪張圖，誰有權採取處置，解除看哪個條件。需要的不是更多紅燈，而是每一盞都能帶人走到下一步。
