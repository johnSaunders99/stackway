---
id: cr-search-01-sample
module: cr-search
order: 1
title: 職缺條件拆解
subtitle: 讀懂一份職缺到底在找誰
status: ready
minutes: 25
level: 4
prereqs: []
objectives:
  - 分開日常工作、硬條件與加分項
  - 摘出地區、年資與可接受替代經驗
tags:
  - search
  - job-description
resources:
  - title: "Virginia Tech：區分必要與偏好資格"
    url: https://faculty.vt.edu/academic-personnel/recruitment/dual-career-program/job-search-tips.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-search-01-sample-class
    prompt: "如何區分日常工作與必要資格？"
    answer: "動詞描述入職後要做的事，必要資格則是明示進入職位的條件。"
    mcq:
      question: "「維護每日匯出」最直接代表什麼？"
      options:
        - "必須有匯出工具證照"
        - "入職後的任務"
        - "指定工作地點"
        - "至少 1 年年資"
      answer: 1
      explain: "任務可以指引作品選擇，但不自動成為特定證照或年資要求。"
    interview:
      question: "你如何判斷這個報表職缺值得投？"
      points:
        - "說出日常任務"
        - "核對硬條件與替代證據"
        - "確認實際到班條件"
      answer: "我先看能否配合每週到臺中 2 天，再拿 SQL 診斷作品對照日常工作。若走專案替代年資，我會確認對方怎麼評估；不會因為沒有加分的容器經驗就放棄。"
  - id: cr-search-01-sample-either
    prompt: "如何記錄「1 年或同等專案」？"
    answer: "保留替代關係，另確認哪些證據算同等，不將兩項變成必須同時滿足。"
    mcq:
      question: "哪份筆記忠於原文？"
      options:
        - "年資與專案皆必須有"
        - "年資或相當專案，專案認定方式待確認"
        - "所有專案都保證符合"
        - "無經驗者一律不收"
      answer: 1
      explain: "「或」是替代路徑，並不代表任意專案都能抵免。"
  - id: cr-search-01-sample-unknown
    prompt: "公告未寫輪值頻率時應怎麼處理？"
    answer: "標記未知並提出確認問題，不自行補為有或沒有。"
    mcq:
      question: "「需配合輪值」未列時段，你會記什麼？"
      options:
        - "每日都需夜班"
        - "頻率、夜間與否待問"
        - "確定沒有夜班"
        - "只算技能加分"
      answer: 1
      explain: "沒有細節就不能推算頻率，且輪值會影響能否接受這份工作。"
practice:
  - id: cr-search-01-sample-p1
    title: "留下一張匿名職缺解讀卡"
    kind: explain
    minutes: 12
    steps:
      - "將練習公告改寫成 job-card.md，分日常、必要、加分、工作安排"
      - "圈出年資條款的替代關係"
      - "補一個待確認問題與暫時決定"
    checks:
      - "必要條件能指回原句"
      - "沒有把容器當硬門檻"
      - "有地點、到班日數和年資替代方式"
---

## 為什麼要學：職缺公告不是技能購物清單

看到 Python、SQL、容器、輪值同時出現在一份職缺，你可能想等全部學完再投。先別數關鍵字：有些詞在描述入職後的工作，有些才是真的篩選條件。職務說明（job description）最值得摘下來的不是工具清單，而是團隊請這個人來解決哪件事，以及有哪些條件會讓這份工作根本不合適。

## 核心概念：用 4 種標記讀同一段話

第一遍只看動詞。「維護報表匯出、定位失敗原因」描寫的是日常工作；它暗示你可以拿失敗案例解說，但沒說一定要有哪張證照。第二遍找「必須」「至少」「或具同等經驗」等限定語，把整段連同例外一起留下。第三遍另列「若具備更佳」的加分項。最後把地點、到班頻率、輪值與年資獨立記錄；技術符合不代表工作安排也可行。

遇到語意不明的句子保留疑問。「需配合輪值」沒有說每天夜間待命，也沒有承諾完全沒有夜班。與其在筆記填上自己喜歡的答案，不如寫「頻率與時段未載，初談時確認」。你得到的是一個可以採取下一步的決策，而不是一個看似精確的適配分數。

## 範例：將一則虛構職缺拆成可查核的筆記

練習公告如下：「維護每日報表匯出並說明失敗原因。必須能寫 SQL 查詢。需有 1 年相關經驗，或能展示相當的專案實作。每週到臺中辦公室 2 天，容器部署經驗尤佳。」先遮住後面的解析，用自己的話寫出工作、必要、加分與待問。這是練習情境，不代表任何現有職缺。

在 `C:\dev\stackway-lab` 新建 `job-read`，存下 `read_job.py`，在該處執行 `py read_job.py`；macOS 或 Linux 用 `python3 read_job.py`。這是一張人工摘要卡，不是根據字詞自動判定錄取的工具。

```python
card = {"daily": "diagnose report failures", "required": "SQL",
        "experience": "1 year OR equivalent project",
        "onsite": "Taichung, 2 days/week", "preferred": "containers"}
for field, value in card.items():
    print(f"{field}: {value}")
```

把輸出與原文逐句對照。只有容器缺經驗，但能出示查詢與診斷案例，也能配合地點，就有理由準備投遞。反過來，若完全無法到現場，即使其他工具全會，這仍是實際衝突。若對方只寫「同等經驗」，證明材料的形式並不明確：可以準備可重跑專案，卻不能直接寫成招募方已經承認它等同 1 年工作。

## 常見錯誤

截一張工具標籤圖就開始排幾個月的課，往往漏掉地區或必須輪值等關鍵條件。另一個錯誤是把沒寫的要求當作沒有，例如沒寫遠端就算完全遠端。整理時讓每個必要條件都能指回原句；其餘推論用不同欄位標記。練習只保存匿名情境和職責，用不到聯絡人的姓名或信箱。

## 小結

讀完職缺應能做出三選一：有證據可投、欠一項資訊要問，或有明確衝突暫不投。缺少加分項和不符硬條件是兩回事；先讀準，再決定哪個作品值得拿出來。
