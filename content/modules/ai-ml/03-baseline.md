---
id: ai-ml-03-baseline
module: ai-ml
order: 3
title: 分類基準與準確率
subtitle: 先建立不用神經網路的基準
status: ready
minutes: 30
level: 3
prereqs:
  - ai-ml-02-split
objectives:
  - 算出多數類別預測的準確率
  - 解釋為何高準確率仍可能漏掉目標
tags:
  - ml
  - baseline
resources:
  - title: "Google 機器學習速成課：準確率、精確率與召回率"
    url: "https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall?hl=zh-tw"
    kind: "course"
    lang: "zh-Hant"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-majority-reference"
    prompt: "多數類別基準怎麼選出固定答案？"
    answer: "計數訓練集各類別，選最多的一類；固定規則後再到獨立資料評估。"
    mcq:
      question: "決定固定猜哪一類，應數哪裡的標籤？"
      options:
        - "最終測試集"
        - "挑出最容易的一批"
        - "只數剛猜對的樣本"
        - "訓練集"
      answer: 3
      explain: "不能先讓評估資料決定要評估的規則。"
    interview:
      question: "你會怎麼回應「準確率達到 90%，可以上線」？"
      points:
        - "提供同切分的簡單基準"
        - "檢查正例的分子分母"
        - "連結實際漏判成本"
      answer: "我會先讓永遠猜準時的規則跑同一批資料。如果它也有90%，卻抓不到任何逾時，那這個分數不足以支持上線；還要比較模型真正多抓到幾筆、付出多少誤報。"
  - id: "ai-ml-accuracy-denominator"
    prompt: "準確率的分母是什麼？"
    answer: "被評估的全部樣本數，分子是預測與標籤相符的筆數。"
    mcq:
      question: "10 筆有 9 筆準時，全猜準時的準確率是多少？"
      options:
        - "10%"
        - "0%"
        - "90%"
        - "100%"
      answer: 2
      explain: "對 9 筆不代表逾時那筆也猜對。"
  - id: "ai-ml-minority-miss"
    prompt: "為何失衡資料的高準確率不保證警示有用？"
    answer: "猜常見類別就能答對很多筆，少數但關鍵的正例可能完全被漏掉。"
    mcq:
      question: "哪項最直接揭露本例的問題？"
      options:
        - "準時樣本有 9 筆"
        - "真正逾時的 1 筆中抓到 0 筆"
        - "總共有 10 筆"
        - "程式只用整數"
      answer: 1
      explain: "只有按正例單獨計數才能看出完全沒報中。"
practice:
  - id: "ai-ml-03-baseline-p1"
    title: "做出一張可比較的基準卡"
    kind: "code"
    minutes: 11
    steps:
      - "執行 baseline.py，將規則與兩個分數的分子分母存入 baseline.md"
      - "保留訓練段不動，讓驗證段改為 8 筆準時與 2 筆逾時再算一次"
      - "寫一句變化原因"
    checks:
      - "2 次都猜 0，準確率從 90% 變為 80%"
      - "2 次抓到的逾時數都為 0"
---

## 為什麼要學：答對 90%，卻一次都沒報警
機房紀錄裡，大部分工作都準時。有人展示一個準確率很高的逾時分類器，準備用它通知值班人員。你可以先問一個便宜又有力的問題：「如果每次都說準時，也能答對多少？」基準（baseline）是一個在相同條件下可重現的簡單方法。它不必聰明，卻能幫你判斷複雜模型的成績究竟有沒有意義。

## 核心概念：選規則與評分要用不同資料
本課做二元分類（binary classification）：標籤 1 表示逾時，0 表示準時。多數類別基準（majority baseline）只看訓練標籤的計數，選最多的那類，之後不管收到什麼特徵都猜它。若剛好平手，要事先寫好固定規則，而不是問測試集哪邊比較多。規則確定後，才帶到沒拿來選規則的資料上打分。

準確率（accuracy）是猜對的筆數除以全部筆數。在類別失衡時，答對很多筆可能只是因為常見類別太多。對值班人員來說，另一個直接的問題是：真正逾時的幾筆，有幾筆被抓到？之後在[〈混淆矩陣與分類評估〉](#/lesson/ai-ml-05-evaluate)會用精確率與召回率區分不同代價。現在先保留分子、分母，不要把所有資訊壓成一個百分比。

## 範例：同時印出答對幾筆、抓到幾筆
在練習區 `ml-notes` 存成 `baseline.py`，PowerShell 執行 `py baseline.py`，bash 用 `python3 baseline.py`，不需額外套件。把訓練段和驗證段分開列，是為了讓你看得出「猜哪邊」的決策來自何處。
```python
train = [0, 0, 1, 0, 0, 1]
valid = [0] * 9 + [1]
guess = int(train.count(1) > train.count(0))
pred = [guess] * len(valid)
correct = sum(y == p for y, p in zip(valid, pred))
caught = sum(y == 1 and p == 1 for y, p in zip(valid, pred))
print("guess", guess, "correct", correct, "/", len(valid))
print("accuracy", correct / len(valid), "caught", caught, "/", sum(valid))
```
訓練段有 4 筆準時、2 筆逾時，因此固定猜 0。驗證段答對 9 筆，準確率是 0.9；但唯一逾時的工作沒有被標出。請注意最後一行的分母：二元標籤只有 0 和 1，將它們加總恰好得到實際逾時筆數，不是驗證樣本總數。若這批完全沒有逾時，應記「這批無法評估能抓到多少」，而非聲稱全部都抓到了。

### 用絕對筆數說明改進
假設另一個方法也答對 9 筆，但它報中了那筆真正的逾時，另外對一筆準時工作發了多餘提醒。兩個方法的準確率相同，對值班流程卻有不同意義。若只交出百分比，同事無從決定要不要用多一次打擾換取少漏掉一次事故。

## 常見錯誤
拿新模型在某一週的分數，去和簡單規則在另一週的分數比較。若第二週逾時比例較高，即使兩邊都固定猜準時，準確率也會變；不是模型一定進步或退步。公平比較要保留相同資料切分、樣本與標籤定義。另一個陷阱是為了擊敗基準，不斷回頭挑測試集裡最好看的那一段，這不再是一項獨立評估。

## 小結
保存一條不用神經網路也能跑的基準，並寫清楚它在哪些情況會完全失靈。新模型要爭取的不是漂亮數字，而是在相同的工作條件下多找到真正重要的案例。
