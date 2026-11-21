---
id: ai-llm-02-attention
module: ai-llm
order: 5
title: 因果注意力遮罩
subtitle: 下一個位置可以看見什麼
status: ready
minutes: 30
level: 3
prereqs:
  - ai-llm-04-qkv
objectives:
  - 畫出因果遮罩遮住的格子
  - 區分模型參數與單次請求的中間結果
tags:
  - llm
  - attention
resources:
  - title: 動手學深度學習：注意力分數
    url: https://d2l.ai/chapter_attention-mechanisms-and-transformers/attention-scoring-functions.html
    kind: course
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 讀縮放點積與遮罩的算例。
  - title: Attention Is All You Need：模型架構
    url: https://arxiv.org/html/1706.03762v7
    kind: paper
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
    note: 看圖 1 與第 3 節，沿資料流讀區塊。
concepts:
  - id: ai-llm-mask-direction
    prompt: 因果自注意力中第 i 列可讀哪些鍵？
    answer: 在列為查詢、欄為鍵的定義下，允許 j ≤ i，排除未來的鍵。
    mcq:
      question: 因果遮罩的列是查詢、欄是鍵，從 0 編號。列 1 要預測詞元 2，應保留哪些鍵？
      options:
        - 只有 0
        - 0、1
        - 1、2
        - 0、1、2
      answer: 1
      explain: 列 1 可以使用自己；欄 2 是還沒看到的答案。
    interview:
      question: 如何檢查批次算完整句時沒有偷看答案？
      points:
        - 說清楚列與欄方向
        - 只擾動未來位置
        - 比對先前各列輸出
      answer: 我會先畫第一列能看到的欄，再固定前綴只改末詞，關閉隨機因素後比前幾列。若前列變了，就查遮罩方向、套用時機及函式庫的真假語意。
  - id: ai-llm-mask-score
    prompt: 為什麼不能把未來鍵的分數改為 0 就當作排除？
    answer: softmax 中 0 分的指數是 1，仍會分走權重。
    mcq:
      question: 希望未來位置獲得 0 權重，何者可行？
      options:
        - 將原分數乘 0
        - 把禁用鍵的值改為 0 就算完成
        - 正規化前移除禁用項
        - 先算普通平均再扣一個常數
      answer: 2
      explain: 要讓禁用項不影響分子與分母，僅清零值仍會稀釋合法來源。
  - id: ai-llm-request-state
    prompt: 投影矩陣和本次算出的鍵有何不同？
    answer: 投影矩陣是模型參數，本次的鍵是輸入經投影後的中間結果。
  - id: ai-llm-aligned-target
    prompt: 因果遮罩已經正確，為什麼還要檢查訓練目標的對齊？
    answer: 該位置應預測下一個詞元；若目標是已可見的當前詞元，模型可能照抄輸入。
    mcq:
      question: 列 1 已讀到「列車、即將」，教材接著是「到站」。這列該拿哪個詞評分？
      options:
        - 列車
        - 即將
        - 到站
        - 整個前綴的平均向量
      answer: 2
      explain: 遮罩控制能讀什麼，目標控制要答什麼；兩件事都需對準。
practice:
  - id: ai-llm-05-lab
    title: 用擾動測試查遮罩
    kind: code
    minutes: 10
    steps:
      - 將程式印出的三角形畫進 mask-notes.txt
      - 比較兩次各列的數值，再寫出若拿掉等號會失去什麼
    checks:
      - 第一列（從 0 算）可見符號為 ++.
      - 改末值後前 2 列平均仍為 2 和 3，只有末列改變
---

## 為什麼要學

教模型把「列車 即將 到站」往後接時，教材裡明明已經有「到站」。若模型在「即將」的位置可以偷看下一格，練習分數就算漂亮，也沒有學到上線時要做的事。因果遮罩（causal mask）不是把答案塗黑給人看，而是規定每個查詢位置有哪些鍵能參與這次注意力。

## 先定義橫軸，再畫三角形

把查詢位置寫在列、鍵位置寫在欄，兩軸都從 0 起算。第 i 列可以使用第 j 欄的條件是 j 小於或等於 i。等號很重要：模型用「截至目前這格的內容」預測下一格，不是在同一格猜同一個詞。訓練目標向前對齊一格，與注意力矩陣的對角線是 2 件事。

在縮放點積的分數上，把不可見位置排除後才對剩下的鍵做 softmax。常見概念寫法是把禁用分數設為負無窮大；取指數後它沒有重量。若只是把分數填 0，它仍會得到非零的指數值。可平行算完整段提示的所有列，因為每一列的可見限制已經單獨套好；平行計算不等於可讀取未來。

## 範例：讓未來的值大得離譜

為了只看可見性，假設所有可見鍵的分數相等，於是加權結果就是可見值的算術平均。程式在混合前直接挑合法欄位，效果等同排除禁用分數，而不是用 0 值去稀釋平均。

選一個中間位置，遮住它右側的詞元。核對可讀範圍時，要把還沒生成的資訊排除在外。把下面的範例存成 `C:\dev\stackway-lab\llm` 裡的 `visible_prefix.py`。

在該目錄執行：Windows PowerShell 用 `py visible_prefix.py`；macOS／Linux 用 `python3 visible_prefix.py`。

```python
def inspect(values):
    for i in range(len(values)):
        keep = [j <= i for j in range(len(values))]
        visible = [v for j, v in enumerate(values) if keep[j]]
        print("".join("+" if b else "." for b in keep),
              round(sum(visible) / len(visible), 2))

inspect([2, 4, 6])
inspect([2, 4, 600])
```

反過來試：改第一個值而不是最後一個。這次後面每列都可受到影響，並不是資料洩漏，因為每個後來的位置本來就允許回看開頭。兩種方向放在一起，能把「完全不看別人」和「只看已知前綴」區分開來。

### 用 3 個詞驗對角線

把位置 0、1、2 分別標成「列車」「即將」「到站」。第一列只有「列車」可見，這列輸出的分數可以拿來預測「即將」；第二列已讀到「即將」，這次要預測「到站」。因此訓練時拿來評分的正確答案可以存在教材裡，但不能出現在該列可讀的輸入範圍裡。

若把輸入與評分目標對在同一格，就算三角形畫對，模型也可能靠照抄目前詞元取得好分數。查錯時把教材的兩排詞逐欄寫出來，一排是可讀到哪裡，一排是要答哪個詞，再看注意力的圖。

## 常見錯誤

不同函式庫的布林遮罩有時以真表示保留，有時以真表示排除；畫對三角形仍可能接反。用一個會暴露錯誤的測試：只改最後一個值，前幾列絕不能跟著動。若改成全 0 測資，偷看了未來也不容易從結果察覺。填補不同句長的遮罩是另一項限制，不能取代先後順序。

## 小結

權重矩陣等模型參數（parameter）在一般推論中共用；這次提示投影出的鍵、值與混合結果則屬於這次輸入。遮罩的形狀常可重用，但不會把別人的提示變成可讀的上下文。
