---
id: ai-gateway-03-evaluation
module: ai-gateway
order: 3
title: 檢索評估與回歸
subtitle: 為一次索引改版設評估集
status: ready
minutes: 35
level: 3
prereqs:
  - ai-gateway-02-retrieval
objectives:
  - 建立具預期文件的查詢清單
  - 區分檢索召回與答案正確性
tags:
  - gateway
  - eval
resources:
  - title: "Microsoft Learn：分開評估檢索與生成"
    url: https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-gateway-03-evaluation-recall
    prompt: "一題需要多份文件時如何算 recall@k？"
    answer: "計算預期文件與前 k 筆的相異交集數，除以該題預期文件數。"
    mcq:
      question: "需要 t 和 p，前 2 筆只有 p 與 x，召回是多少？"
      options:
        - "1"
        - "0"
        - "2"
        - "0.5"
      answer: 3
      explain: "必要文件有 2 份，只找回一份；有命中並不等於完整召回。"
    interview:
      question: "索引更新後演示題全答對，你怎麼做發布前檢查？"
      points:
        - "固定題組、快照及 k"
        - "逐題比較必要文件"
        - "另核對答案與引用"
      answer: "我會用相同條件重跑舊版和新版，特別看必須找到 2 份文件的題目，再分別評答案及引用。應拒答題我另列，不拿 0 分母算召回；若某類退步先保留失敗樣本。"
  - id: ai-gateway-03-evaluation-axes
    prompt: "答案正確性與檢索召回為何要分開記？"
    answer: "模型可能猜中未找到的事實，也可能拿到正確資料仍答錯。"
    mcq:
      question: "缺測試文件但答案碰巧含正確天數，怎樣記錄？"
      options:
        - "召回自動滿分"
        - "答案一律算有引用"
        - "答案值可能正確，但該部分缺檢索依據"
        - "索引已證明改善"
      answer: 2
      explain: "回答內容不會改變前 k 筆文件，正確與有據是不同判準。"
  - id: ai-gateway-03-evaluation-empty
    prompt: "應拒答題沒有預期相關文件時如何計分？"
    answer: "召回分母為 0，另評是否按預期拒答，不混入有證據題的平均。"
    mcq:
      question: "文件沒有相關規則，預期集合空白，召回應記？"
      options:
        - "一律 0"
        - "不適用，另列拒答結果"
        - "一律 1"
        - "用文件總數當分母"
      answer: 1
      explain: "沒有相關文件可供找回，不宜用任意值影響平均。"
practice:
  - id: ai-gateway-03-evaluation-p1
    title: "建立一張可重跑的索引回歸成績單"
    kind: code
    minutes: 16
    steps:
      - "跑 compare_index.py，將兩題的預期文件及逐題結果寫入 eval.md"
      - "新增一題人工拒答案例並單列結果"
      - "為 compare-both 寫完整答案判準及一個會被判不完整的答案"
    checks:
      - "平均召回是舊 1、新 0.75"
      - "多文件題列出遺漏的 t"
      - "拒答與生成正確性未混成召回"
---

## 為什麼要學：換了索引，第 1 題答對就算成功嗎？

更新切段規則後，常見問題「測試報表留幾天」答得又快又準；但需要同時引用測試與正式規則的題目，卻少了一半證據。回歸測試（regression test）是把已經做對的重要行為留下可重跑的案例，讓改版時能發現退步。只用展示時剛好答對的那一題，你不知道是哪類問題進步、哪類問題在不知不覺中變差。

## 核心概念：先保存題目與判準，再看新版本

評估集（evaluation set）每題至少保留題目代號、問題、預期相關文件集合及答案判準，也要註明使用哪版文件。挑選單文件、多文件、容易混淆的近似問法，以及資料不足應拒答的題目。預期文件若不是唯一，要明定等價證據如何算；這堂的小題組假設每個指定文件都必要。不要看完新答案才偷偷放寬規則，否則新舊分數不是在同一場考試取得。

前 k 名召回率（recall@k）是預期文件中，有多少出現在檢索結果前 k 筆。若一題需要 2 份證據而只找到一份，召回為 1/2，不是「有命中所以滿分」。答案正確性則依問題和答案判準另評，例如是否分別給出兩種環境的天數。還要區分「數字答對」和「引用支持這個數字」；模型可能剛好猜對，也可能明明收到正確資料卻答錯。

## 範例：先看每題，再看平均

在 `C:\dev\stackway-lab` 新建 `eval-lab`，將以下存成 `compare_index.py` 後執行 `py compare_index.py`；macOS 或 Linux 用 `python3 compare_index.py`。文件 t、p、x 分別是測試規則、正式規則與無關說明，兩版都只看前 2 筆。

```python
gold = {"test-days": {"t"}, "compare-both": {"t", "p"}}
runs = {"old": {"test-days": ["t", "x"], "compare-both": ["t", "p"]},
        "new": {"test-days": ["t", "p"], "compare-both": ["p", "x"]}}
for version, rankings in runs.items():
    scores = []
    for qid, needed in gold.items():
        ranking = rankings.get(qid, [])
        score = len(needed & set(ranking[:2])) / len(needed)
        scores.append(score)
        print(version, qid, score)
    print("mean", sum(scores) / len(scores))
```

舊版 2 題都是 1，新版為 1 和 0.5；逐題平均從 1 降到 0.75。第一題沒有變差並不能保護第二題。若新索引把同一段回傳 2 次，集合交集只會算一次，避免重複段落假裝補齊 2 份文件。程式按題目代號取結果。試著從新版移除第二題：因為從標準題組逐題核對，漏題會以空清單計算，仍占平均的分母。若反過來只掃成功回傳的結果，出錯最多的版本反而可能分數最高。

### 將生成回覆另開一欄

拿第二題問「請分別說明兩種環境期限」。假設答案只有「正式 30 天」，即便正式那條引用正確，整題仍不完整。若候選只含正式文件，答案卻湊出「測試 7、正式 30」，答案值可以正確，但測試那部分沒有檢索證據。對「文件未定義備份保存期」這類應拒答題，預期集合可以是空的，此時召回分母為 0，另記是否合理拒答，不填 0 或滿分混入平均。

## 常見錯誤

不同版本測不同題數、只換其中一版的 k，或把文件庫內容更新和索引演算法改版混在一起，造成差異難以解讀。固定題組、文件快照和 k，再檢查逐題失敗原因。開發時常看的題目也可能被調整到過度貼合；最後保留一組未拿來反覆修改規則的題目做檢查。

## 小結

用召回問證據是否到場，用答案判準問問題是否答全，再用引用核對是否有依據。保留退步的題目和兩版候選，比一個孤單的平均分更能指引修正。
