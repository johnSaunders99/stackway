---
id: ai-llm-06-block
module: ai-llm
order: 6
title: 前饋網路、殘差與正規化
subtitle: 注意力算完以後還有哪些步驟
status: ready
minutes: 35
level: 3
prereqs:
  - ai-llm-02-attention
objectives:
  - 畫出一個解碼器區塊內的注意力、MLP 與殘差路徑
  - 區分層正規化與把輸出轉成選詞機率
tags:
  - llm
  - block
resources:
  - title: Attention Is All You Need：模型架構
    url: https://arxiv.org/html/1706.03762v7
    kind: paper
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
    note: 看圖 1 與第 3 節，沿資料流讀區塊。
concepts:
  - id: ai-llm-block-route
    prompt: 先正規化的解碼器區塊如何連起兩條分支？
    answer: 先將注意力分支結果加回輸入，再把前饋分支結果加回剛得到的表示。
    mcq:
      question: 先正規化的區塊用 h 接住第一次殘差加法，尾端是 h 加前饋分支。若前饋輸出全 0，尾端是什麼？
      options:
        - 全 0 向量
        - 最初輸入一定不變
        - 第一次殘差加法的結果
        - 詞表上的均勻機率
      answer: 2
      explain: 0 只會消去該分支的增量，直線上的 h 仍然通過。
    interview:
      question: 你會怎麼向同事畫出一層解碼器，而不把它畫成一條直線？
      points:
        - 指出注意力與前饋的分工
        - 畫出兩條捷徑的起訖
        - 標出正規化與選詞不同
      answer: 我會用 x、h、y 標 3 個接點，分別從 x 和 h 畫繞過子層的線。注意力能取其他位置的值，前饋只改這個位置；詞表分數則留在整串區塊之後。
  - id: ai-llm-mlp-axis
    prompt: 逐位置前饋網路混合的是哪些數值？
    answer: 它混合單一位置的特徵，所有位置共用網路參數。
    mcq:
      question: 去掉所有跨位置操作，只剩逐位置 MLP，位置 1 能直接讀哪裡？
      options:
        - 所有較早位置
        - 每個位置的第 1 維
        - 下一個位置的詞元
        - 位置 1 自己的特徵
      answer: 3
      explain: 共享參數不代表共享輸入，不會自動交換列。
  - id: ai-llm-norm-axis
    prompt: 層正規化與選詞用的 softmax 有何不同？
    answer: 前者調整某位置內特徵的尺度；後者將候選詞分數轉為機率分布。
practice:
  - id: ai-llm-06-lab
    title: 畫出能斷開的區塊
    kind: code
    minutes: 12
    steps:
      - 在 block-notes.txt 以箭頭畫出 x 到 h 到 y 的兩條捷徑
      - 執行範例，再把 delta 設成 2 個 0，比對 y 與 h
    checks:
      - 圖上 2 個加號都有 2 個來源
      - 關閉前饋分支後 y 等於 h，寬度仍為 2
---

## 為什麼要學

你把注意力算完，得到的仍是一排向量，不是下一個詞。打開解碼器（decoder）的架構圖，還有分岔的箭頭、加號、正規化與前饋層。這些不是裝飾：有的運算讓不同位置互通，有的只改同一個位置的特徵，有的則讓舊表示不用繞遠路就傳到下一層。

## 沿一條殘差路徑讀圖

以先正規化的區塊（pre-norm block）為例，記輸入為 x。先做層正規化（layer normalization），再送進因果自注意力，把其輸出加回 x 得到 h。第二段把 h 正規化，送入前饋網路（feed-forward network，常寫作 MLP），其輸出再加回 h。兩次「加回原輸入」就是殘差連接（residual connection），相加兩端的形狀要相容。最初的 Transformer 用後正規化，讀圖要以箭頭為準。

前饋網路對每個位置使用同一組參數，典型做法是先線性轉換、套非線性函式，再投影回原本寬度。它可以混合一列裡的特徵，但不會自行去讀隔壁列。層正規化則在此例針對每列特徵求平均與變異數，調整尺度；它不負責把整個詞表的分數轉成總和為 1 的機率。

## 範例：把 2 次加號留下來

這是單位置、2 個特徵的可執行剖面：只有 1 個可見鍵時注意力權重就是 1，讓值投影取恆等，故注意力分支直接回傳正規化結果。前饋分支用 2 個固定線性映射夾著只留正值的函式。省去訓練與可學習的縮放、偏移，只檢查路徑。

開啟 `C:\dev\stackway-lab\llm`，將範例另存為 `block_path.py`。沿著殘差支路追蹤輸入，而不只看中間變換。相加的位置要求哪兩份資料的形狀能對起來？

在該目錄執行：Windows PowerShell 用 `py block_path.py`；macOS／Linux 用 `python3 block_path.py`。

```python
from math import sqrt
def norm(v):
    mean = sum(v) / len(v)
    scale = sqrt(sum((t - mean)**2 for t in v) / len(v) + 1e-5)
    return [(t - mean) / scale for t in v]

x = [1, 3]
h = [a + b for a, b in zip(x, norm(x))]
u, v = norm(h)
hidden = max(0, v - u)
delta = [hidden, -hidden]
y = [a + b for a, b in zip(h, delta)]
for name, row in [("x", x), ("h", h), ("y", y)]:
    print(name, [round(t, 2) for t in row])
```

特別看 h 的第一個數：原來是 1，注意力分支傳來接近負 1 的修正，兩者相加才接近 0。殘差不是「輸出一定更大」的承諾；分支可以放大、抵銷或完全不動某項特徵。把中間的 h 留在輸出，比只印最末的 y 更容易看見是哪一步做了修正。

### 把正規化沿正確方向做

假設同一句有「進」「站」2 個位置，各有 2 個特徵。為「進」求平均時，只拿「進」這一列的 2 個數，不把「站」也放入分母；下一列再用自己的平均與變異數。這與把整批句子混在一起求統計量不同。例中分母加很小的正數，2 個特徵相等時也不會除以 0。

再拿一個全 0 分支驗圖：如果注意力與前饋兩支都不提供任何修正，這裡先正規化的兩條捷徑會讓輸出等於原輸入。若你畫的圖在這個情況也把輸入清掉，代表至少少畫了一條直線。

## 常見錯誤

圖上的直線不是要把原向量串在尾端，那會讓寬度加倍。另個誤會是把正規化的結果當機率：例中一正一負，並不矛盾。最後選詞前還要用輸出層轉成每個詞元的分數；[〈解碼策略與抽樣〉](#/lesson/ai-llm-07-sampling)會細講怎麼選。

## 小結

讀下一張區塊圖時問三句：這支箭頭是否跨位置？這次加法保留誰？這裡調整的是特徵尺度還是詞的機率？即使區塊採用不同先後順序，也能沿著資料找到答案。
