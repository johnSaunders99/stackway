---
id: fd-design-02-capacity
module: fd-design
order: 2
title: 流量與容量估算
subtitle: 用單位檢查容量估算
status: ready
minutes: 30
level: 3
prereqs:
  - fd-design-01-requirements
objectives:
  - 將每日請求轉成每秒平均與尖峰
  - 以資料大小估算儲存空間
tags:
  - design
  - capacity
resources:
  - title: "Google SRE Workbook：以具體數量設計系統"
    url: https://sre.google/workbook/non-abstract-design/
    kind: book
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-design-02-capacity-rate
    prompt: "怎麼把每日請求換成全天平均每秒速率？"
    answer: "將每日總件數除以 86,400 秒，另列活躍時段與短窗尖峰。"
    mcq:
      question: "864,000 次平均分散一整天是幾 RPS？"
      options:
        - "10"
        - "30"
        - "60"
        - "864"
      answer: 0
      explain: "除以整天秒數是 10；只算 8 小時會得到不同分母。"
    interview:
      question: "每天 864,000 次，能直接決定要買幾台機器嗎？"
      points:
        - "換算平均並另估尖峰"
        - "確認工作組合與單台吞吐"
        - "將儲存另行估算"
      answer: "全天平均是 10 RPS，但交班時可能集中。我會取短窗尖峰，再量單台在該工作組合與目標延遲下能承擔多少。資料空間另按寫入比、單筆大小及保存期算。"
  - id: fd-design-02-capacity-peak
    prompt: "從全天平均能直接推導尖峰嗎？"
    answer: "不能；需要短窗口量測，或明示採用的情境倍率。"
    mcq:
      question: "把平均乘 6 應如何標示？"
      options:
        - "保證不會超過的上限"
        - "尚待短窗紀錄驗證的尖峰假設"
        - "單機實測吞吐"
        - "由全天總量直接求得的實測尖峰"
      answer: 1
      explain: "倍率是模型假設，不是服務保證或壓測結果。"
  - id: fd-design-02-capacity-retention
    prompt: "只改保存期會改變哪一項估算？"
    answer: "在每日新增量固定時，穩態保留的邏輯資料量隨保存天數改變。"
    mcq:
      question: "保存 30 天改 60 天，其餘不變，什麼加倍？"
      options:
        - "全天平均 RPS"
        - "每筆資料大小"
        - "寫入比例"
        - "穩態保留的邏輯資料量"
      answer: 3
      explain: "保存期影響累積筆數，不改變每日請求、單筆大小或寫入占比。"
practice:
  - id: fd-design-02-capacity-p1
    title: "建立能改假設的容量估算單"
    kind: code
    minutes: 14
    steps:
      - "保存 size.py 與一份 capacity.md，寫下每個乘數的單位"
      - "分別只改保存期與尖峰倍率，記下兩組輸出"
      - "列一項未計入空間與一項要量測的流量假設"
    checks:
      - "原始結果為 10 RPS 與 12.96 GB"
      - "保存期加倍不改平均 RPS"
      - "估算沒有宣稱已得到單機容量"
---

## 為什麼要學：一天很多，還是 1 秒很多？

有人說「匯出服務每天有 86 萬多個請求，該加幾台機器？」直接除以機器數還太早。容量估算（capacity estimation）先把業務數量換成工程單位：機器處理的是每秒進來的工作，儲存裝置要承擔的是留下來的位元組。你不必一開始猜中精確答案，但必須讓別人能沿著單位找出最昂貴、最不確定的那一步。

## 核心概念：平均、尖峰和保存期是 3 道題

一天有 24 乘 60 乘 60 秒。每日 864,000 個請求平均是每秒 10 個請求（requests per second，RPS），前提是分母為整天。若使用者只在 8 小時內操作，活躍時段平均就變成每秒 30 個。尖峰是短窗口裡真的同時來了多少，不能由全天平均唯一推得。沒有紀錄前可以做情境估算，例如「先假設尖峰是全天平均的 6 倍」，並把這個倍率排入待驗證清單。

儲存空間看的是留下多少內容，不是傳了多少請求。假設每 4 次請求只有 1 次新增紀錄，每筆 2,000 位元組（byte），保留 30 天。先乘寫入比例，再乘每筆大小及天數；讀取同一筆資料不會憑空多出同樣大的永久紀錄。這裡使用十進位，1 GB 是 10 億位元組，與以 2 的次方換算的 GiB 不同，寫清楚單位才不會差一截。

## 範例：每行都可以檢查單位

在 `C:\dev\stackway-lab` 新建 `capacity-lab`，把下列存為 `size.py`。在該處執行 `py size.py`；macOS 或 Linux 用 `python3 size.py`。試著在按下執行前先估答案是幾十、幾千還是幾百萬。

```python
requests_day = 864_000
avg_rps = requests_day / 86_400
writes_day = requests_day * 0.25
logical_bytes = writes_day * 2_000 * 30
print("avg / assumed peak RPS:", avg_rps, avg_rps * 6)
print("logical GB:", logical_bytes / 1_000_000_000)
```

結果是平均 10、假設尖峰 60 RPS，以及 12.96 GB 的邏輯資料量。這不是採購清單：尚未計入索引、備份、副本與檔案系統開銷。如果要多留一份等大的完整副本，僅這 2 份資料就是 25.92 GB；若備份是壓縮或增量形式，就不能直接再乘一個固定數字。把這些條件列成不同欄位，才知道下次量測要找哪種資料。

### 做一次敏感度檢查

把保存期改成 60 天，空間應加倍，平均請求率則不動。把尖峰倍率改成 12，假設的每秒尖峰加倍，整月邏輯資料量仍不變，因為你並沒有增加每日總量。這兩個小變化可以抓出常見錯位：如果你的估算表改保存期後需要雙倍每秒處理速度，公式很可能把不相干的需求乘在一起。

## 常見錯誤

只用平均值估機器數，沒看服務在尖峰時是否還能維持延遲目標。即使假設尖峰是每秒 60 個，也要知道單台在相同工作內容和目標延遲下的持續吞吐，才能討論台數。別把讀取與寫入視為成本相同；重的匯出和輕的狀態查詢若混在一起，單看請求數尤其容易誤判。

## 小結

先替每個乘數寫上單位，再把實測與推測分色。能說出哪個假設變動只影響儲存、哪個會使尖峰延遲惡化，你就已經有一份可修改而不是只能背誦的容量估算。
