---
id: ai-ml-05-evaluate
module: ai-ml
order: 10
title: 混淆矩陣與分類評估
subtitle: 用混淆矩陣找出代價最高的錯
status: ready
minutes: 35
level: 3
prereqs:
  - ai-ml-09-amp
objectives:
  - 由 4 個計數算出精確率與召回率
  - 依漏判成本選擇判斷門檻
tags:
  - ml
  - metrics
resources:
  - title: "Google 機器學習速成課：準確率、精確率與召回率"
    url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall?hl=zh-tw"
    kind: "course"
    lang: "zh-Hant"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-confusion-axes"
    prompt: "漏判與誤報分別對應哪 2 格？"
    answer: "實際正卻沒報是 FN，實際負卻有報是 FP，先標清楚正類與兩軸。"
    mcq:
      question: "一筆真的逾時卻沒有通知，應計在哪裡？"
      options:
        - "FP"
        - "TP"
        - "FN"
        - "TN"
      answer: 2
      explain: "漏掉正例，不是對負例誤報。"
    interview:
      question: "值班人員希望少漏警示，你會直接把門檻降到最低嗎？"
      points:
        - "定義正類與錯誤成本"
        - "比較同一驗證集的計數"
        - "保留測試資料做確認"
      answer: "我先問少漏一筆值多少額外通知，在相同驗證集上比較幾個門檻的誤報、漏判與成本。選好後固定門檻再測，避免只為了某次驗證結果調整。"
  - id: "ai-ml-precision-recall-base"
    prompt: "精確率與召回率的分母怎麼分？"
    answer: "精確率以所有警示為分母，召回率以所有實際正例為分母。"
    mcq:
      question: "報了 5 筆，其中 3 筆真的逾時，精確率為多少？"
      options:
        - "5 除以 3"
        - "3 除以 5"
        - "3 除以總樣本"
        - "誤報數除以漏判數"
      answer: 1
      explain: "問題從已發出的警示出發，所以分母是 5。"
  - id: "ai-ml-threshold-cost"
    prompt: "如何根據代價在候選門檻間做選擇？"
    answer: "用同一驗證集計算各門檻的誤報與漏判，依成本加權比較，再固定門檻測試。"
    mcq:
      question: "漏判每筆 5、誤報每筆 1，2 次漏判與 1 次誤報的成本是多少？"
      options:
        - "11"
        - "3"
        - "7"
        - "15"
      answer: 0
      explain: "兩種錯誤分別計價後相加，不是只比錯誤筆數。"
practice:
  - id: "ai-ml-05-evaluate-p1"
    title: "交一份門檻選擇單"
    kind: "code"
    minutes: 12
    steps:
      - "執行 thresholds.py，在 threshold-note.md 寫下 4 格標籤、計數、2 個比率與成本"
      - "改算誤報每次 5、漏判每次 1 的總成本"
      - "說明選擇是否改變"
    checks:
      - "原設定選 0.3"
      - "互換代價後 2 個成本為 7 與 10，應改選 0.7"
---

## 為什麼要學：多發一則提醒，還是漏掉一場壅塞？
同樣是猜錯，通知一筆其實準時的工作，和漏掉一筆真正的逾時，代價往往不同。只看準確率無法告訴值班人員哪種錯比較多。混淆矩陣（confusion matrix）把真實標籤和預測結果交叉計數，讓你先看清楚錯在哪裡，再決定警示門檻，而不是憑感覺選一個看起來居中的數字。

## 核心概念：先說清楚哪一類算「正」
本例把逾時當正類，發出警示表示預測為正。真的逾時也發了警示是真陽性（TP）；其實準時卻打擾人是假陽性（FP）；真的逾時卻沒報是假陰性（FN）；準時且沒報是真陰性（TN）。不要死背矩陣的左上角是哪個數，不同圖可能把列和欄對調；先標出哪一軸是真實、哪一軸是預測，再讀每格代表的事件。

精確率（precision）問的是「已報出來的警示裡，有多少是真的」，分母為 TP 加 FP。召回率（recall）問的是「真的逾時裡，有多少收到警示」，分母為 TP 加 FN。兩者雖然分子相同，面對的是不同群體。若分母為 0，代表這批資料無法回答該問題，要明示未定義，而不是用一個漂亮的百分比填空。

## 範例：用同一組分數試 2 個門檻
在 `ml-notes` 儲存 `thresholds.py`，PowerShell 執行 `py thresholds.py`，bash 用 `python3 thresholds.py`。資料代表驗證集，其中分數越高表示越值得報警，不必假設它已經是可靠的機率。等於門檻也列為正類，讓邊界行為固定下來。
```python
rows = [(0.9, 1), (0.8, 0), (0.6, 1), (0.5, 0), (0.3, 1), (0.1, 0)]
def ratio(n, d):
    return round(n / d, 3) if d else None

for t in (0.7, 0.3):
    tp = fp = fn = tn = 0
    for s, y in rows:
        if s >= t and y: tp += 1
        elif s >= t: fp += 1
        elif y: fn += 1
        else: tn += 1
    print(t, (tp, fp, fn, tn), ratio(tp, tp + fp), ratio(tp, tp + fn), 5 * fn + fp)
```
假設漏掉一次的處理成本是 5，誤報一次是 1。高門檻有 1 次誤報與 2 次漏判，成本為 11；降到 0.3 則有 2 次誤報、沒有漏判，成本為 2。在這份資料、這個代價和這 2 個候選之間，應選較低門檻。若改成誤報非常昂貴，結論不一定成立，沒有永遠最好的門檻。

### 用處理量核對矩陣
每筆工作只會落在 4 格中的一格，因此 4 個計數的總和必須等於這次評估的樣本數。另一個核對方式是把報警的 2 格相加，看看會送出多少通知，並確認值班人員是否真有能力處理。即使漏判成本很高，實際通知量仍是部署前需要另外確認的限制，不會從準確率自動讀出來。

## 常見錯誤
看到召回率變高就推論精確率一定下降。降低門檻會增加或維持報警筆數；多報的是正例還是反例，要看跨過門檻的那幾筆才能決定。本例低門檻的精確率反而從1/2 變成 3/5。另一個錯誤是調完門檻就把同一份驗證分數當最終成績；應固定門檻後，再到保留的測試資料上報告表現。

## 小結
使用門檻之前，先寫正類定義、兩種錯誤的代價與實際計數。這能把「這模型分數好嗎」改成可討論的決策：「多發幾則通知，換少漏幾筆工作，是否值得？」
