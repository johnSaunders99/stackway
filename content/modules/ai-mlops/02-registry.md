---
id: ai-mlops-02-registry
module: ai-mlops
order: 2
title: 實驗追蹤與模型登錄
subtitle: 追蹤實驗與登記可發布模型
status: ready
minutes: 30
level: 3
prereqs:
  - ai-mlops-01-lineage
objectives:
  - 區分實驗執行與模型版本
  - 以驗證條件決定是否提升候選版本
tags:
  - mlops
  - registry
resources:
  - title: "MLflow Model Registry：版本與別名"
    url: https://mlflow.org/docs/latest/ml/model-registry/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: "MLflow Tracking：執行、參數與產物"
    url: https://mlflow.org/docs/latest/ml/tracking/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-mlops-02-registry-runversion
    prompt: "執行代號為什麼不能直接當模型版本？"
    answer: "一次執行可能無模型或產生多個產物，版本要定位特定模型及其來源。"
    mcq:
      question: "某次執行只留圖表，如何看待？"
      options:
        - "有代號即可發布"
        - "圖表等於權重"
        - "自動成為最新服務版本"
        - "可保留實驗紀錄，但不能假設有可載入模型"
      answer: 3
      explain: "記錄嘗試與可部署產物是不同條件。"
    interview:
      question: "登錄了分數很高的新版本，你如何決定是否換掉目前模型？"
      points:
        - "核對來源及可載入性"
        - "以同條件檢查必要門檻"
        - "分開別名更新與實際生效"
      answer: "我先確認同一份驗證集、能載入產物且關鍵類別沒退步。通過後記下別名從哪版移到哪版，保留舊版；服務是否真的載入新版本要另外驗證。"
  - id: ai-mlops-02-registry-alias
    prompt: "版本與別名的差異是什麼？"
    answer: "版本定位那份模型；別名可以在審查後改指其他版本。"
    mcq:
      question: "要重查昨天處理請求的模型，最好記哪項？"
      options:
        - "今天別名指向的值"
        - "目前最高分的版本"
        - "最後建立的實驗名稱"
        - "當時實際載入的具體模型版本"
      answer: 3
      explain: "移動中的別名與今天的分數都不能代表昨天生效的內容。"
  - id: ai-mlops-02-registry-gate
    prompt: "高總分版本何時仍不應提升？"
    answer: "必要條件如可載入、同驗證集或關鍵類別門檻未通過時。"
    mcq:
      question: "第 4 版總分 .96、關鍵 .72，關鍵門檻 .85，怎麼決定？"
      options:
        - "不提升並記下關鍵類別未過"
        - "因總分高直接提升"
        - "把門檻改為 .72 免審查"
        - "忽略關鍵類別只看登錄順序"
      answer: 0
      explain: "必要條件不是可用高總分抵銷的加分項。"
practice:
  - id: ai-mlops-02-registry-p1
    title: "做一份模型提升審查單"
    kind: code
    minutes: 14
    steps:
      - "跑範例，在 registry.md 建立版本、來源與未過原因清單"
      - "只將第 4 版關鍵分數改成 .87，重跑並記下新建議"
      - "寫下如果全部不合格要怎麼保住既有指向"
    checks:
      - "原始僅第 3 版合格"
      - "修改後合格集合含 3 與 4"
      - "別名改變未被描述為已發布到流量"
---

## 為什麼要學：最高分那次不一定能發給服務

你打開實驗紀錄，第二次訓練分數最高，但那次只保存圖表，並沒有保存模型。另一個較低分的候選有完整產物，卻在重要類別漏掉許多案例。如果只按分數排序選第一名，服務可能根本載不到檔案，或把最在意的工作做錯。實驗追蹤（experiment tracking）保存嘗試的歷史；模型登錄（model registry）則替可辨認的模型版本連上來源與使用決定。

## 核心概念：執行、版本、別名是不同的指標

一次執行可以只做資料分析，也可能產出幾個不同模型，所以執行代號不是模型版本。登錄時把一個有名字的模型、版本號、固定的產物位置及來源執行對起來。版本應能定位當時那份內容，不能把新版權重偷偷覆寫進舊版的位置。別名（alias）則是一個可以移動的參照，例如「線上採用」今天指向第 3 版，明天可在審查後改指第 4 版。記錄實際使用的版本，就不會只剩一個會移動的名字。

提升（promotion）是依事先同意的條件，改變某一版本的用途，例如由待測成為可發布候選。它不等於已經有流量，也不代表所有服務會立刻重新載入。門檻要在看到結果之前指定，至少檢查產物能取回、驗證資料版本一致，以及關鍵指標過關。不能因為某版整體分數漂亮，就替它臨時調低某個重要類別的要求。

## 範例：最高分的候選被留在原地

在 `C:\dev\stackway-lab` 新建 `registry-lab`，存成 `promote.py` 後執行 `py promote.py`；macOS 或 Linux 用 `python3 promote.py`。這是記憶體裡的登錄清單；3 個版本的分數假設出自同一份凍結的驗證集。

```python
versions = {
    3: ("run-a", True, .91, .88),
    4: ("run-b", True, .96, .72),
    5: ("run-c", False, .97, .93),
}
qualified = []
for version, (run, loadable, overall, critical) in versions.items():
    if loadable and overall >= .90 and critical >= .85:
        qualified.append(version)
print("qualified:", qualified, "alias:", max(qualified) if qualified else "hold")
```

只有第 3 版同時通過。第 4 版整體分數較高，但關鍵類別低於門檻；第 5 版分數看起來更好，卻無可載入的產物。程式中的布林值是演練用已知事實，正式流程要用隔離環境真的載入產物並保留結果。範例只在合格集合中取最新版本當別名建議；沒有合格者應保留既有指向，不能把正式別名真的改成空值。

### 一筆提升紀錄要保留什麼？

寫下舊指向、新指向、變更時間、核准依據和可回復的版本。面試時若被問「這模型哪來的」，你能從別名找到那次部署實際解析的版本，再沿版本回到來源執行。若服務只在啟動時讀取別名，光改登錄不會讓舊程序換版本；是否生效要另看服務回報，之後在[〈模型發布與回復〉](#/lesson/ai-mlops-05-release)會細講。

## 常見錯誤

以為每次訓練完就應直接上線，或使用「最新」當作免審查的代名詞。新的版本號表示登錄順序，不是品質順位。另一個陷阱是只保留獲勝模型，刪掉未入選理由；下次調門檻時就無法知道當初是缺檔、條件不同還是品質未過。

## 小結

追蹤保留嘗試，登錄辨認產物，提升記錄選擇。能說明為什麼某個高分版本沒有被採用，比報出排行榜第一名更接近真正的發布工作。
