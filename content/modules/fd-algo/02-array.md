---
id: fd-algo-02-array
module: fd-algo
order: 2
title: 陣列與字串走訪
subtitle: 一趟掃描找出最長的連續片段
status: ready
minutes: 30
level: 2
prereqs:
  - fd-algo-01-cost
objectives:
  - 用索引逐字追蹤目前長度與最佳長度
  - 對空字串、單字元與重複字元各驗一次
tags:
  - algo
  - array
resources:
  - title: 'CSES：最長連續相同字元'
    url: 'https://cses.fi/problemset/task/1069'
    kind: interactive
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '用題目的非空輸入練習，另自行補空字串。'
concepts:
  - id: fd-algo-array-suffix
    prompt: 'current 與 best 各代表哪個範圍的長度？'
    answer: 'current 是到目前位置結尾的同值片段；best 是所有已看位置中的最大長度。'
    mcq:
      question: '讀完 RRB，2 個值依序是？'
      options:
        - '2 和 1'
        - '1 和 2'
        - '1 和 1'
        - '2 和 2'
      answer: 1
      explain: 'B 開新段，但先前連續 2 個 R 的紀錄要保存。'
    interview:
      question: '有人回傳最後一段的長度，什麼測資能揭露問題？'
      points:
        - '最長段不在結尾'
        - '指出目前值會重設'
        - '獨立保留最佳值'
      answer: '我會用 RRBRRRB，最後只有 1 個 B，但答案是 3。這能直接區分目前長度與歷史最佳；再試 BRRR，確定落在結尾的最佳也會被記下。'
  - id: fd-algo-array-start
    prompt: '非空序列為什麼從索引 1 開始比較左鄰居？'
    answer: '第 0 個已用來初始化且沒有左鄰居；負一在 Python 會指向尾端。'
    mcq:
      question: '從索引 0 直接比 i-1，非空時會拿誰當左鄰居？'
      options:
        - '永遠報錯'
        - '空字串'
        - '仍是第一個'
        - '最後一個'
      answer: 3
      explain: '負索引可合法從尾端取值，所以這個邊界錯誤很容易漏掉。'
  - id: fd-algo-array-reset
    prompt: '相鄰值不同時，新片段為什麼從一開始？'
    answer: '目前元素本身就是新片段的第一個成員，不能漏算。'
practice:
  - id: fd-algo-array-lab
    title: '做一組順序敏感的測資'
    kind: code
    minutes: 10
    steps:
      - '儲存 longest_run.py 並跑原有案例。'
      - '加入 RRRBB 與 RBRBR，比較總數相同的字串。'
      - '用註解記下兩筆答案以及最後一輪的 current 和 best。'
    checks:
      - '2 筆分別得到 3 與 1，而非相同的字元總數。'
      - '空字串回 0，單字元回 1。'
---
## 為什麼要學
一排設備狀態依序記成字元，你想找持續最久的同一狀態。全日共出現 5 次紅燈，不代表曾連續亮 5 次；中間只要變色就要重新計數。因此要保存的不是每種字元出現幾次，而是「到目前為止連在一起有多長」。這個差異會直接決定需要什麼資料。

## 核心概念
陣列 (array) 的位置以索引 (index) 表示，這堂用 Python 串列和字串當作可按位置讀取的序列。從 0 起算，第 `i` 個位置的左鄰居是 `i-1`。字串可以這樣逐字讀，但不能像串列那樣直接改某個位置。題目只需讀取，兩者可共用同一個走訪思路，不需要先把每個字元複製成另一個清單。

讓 `current` 代表「以眼前這個字元結尾的連續長度」，`best` 代表「已處理範圍中見過的最大長度」。讀下一字元時，如果和前一個相同，就能把舊片段延長一格；若不同，目前這一個本身已經是一段，因此設為一而不是 0。不論哪個分支都更新最佳值。第一個字元沒有左鄰居，所以非空時先用它建立長度一，再從第二個位置開始比較。

## 範例：最佳紀錄與目前紀錄分開保存
逐項記下目前這一段的長度與歷來最長的值。遇到斷點時，哪一欄要歸零，哪一欄不能跟著清掉？把下面的範例存成 `C:\dev\stackway-lab\algorithms` 裡的 `longest_run.py`。

在該目錄執行：Windows PowerShell 用 `py longest_run.py`；macOS／Linux 用 `python3 longest_run.py`。

```python
def longest_run(items):
    if not items:
        return 0
    current = best = 1
    for i in range(1, len(items)):
        if items[i] == items[i - 1]:
            current += 1
        else:
            current = 1
        best = max(best, current)
    return best

for case in ["", "R", "RRBRRRB", "BRRR", [2, 2, 1]]:
    print(repr(case), longest_run(case))
```

拿第三筆從左往右畫短線。前 2 個紅燈把目前長度帶到 2，看到不同字元時目前回到 1，但最佳仍是 2。走到後面第三個連續紅燈，最佳才改成 3。最後的藍燈把目前值打回一；若錯把目前值當作函式答案，這筆就會失敗。第四筆反過來把最長段放在結尾，專門檢查「必須等到遇見下一種字元才結算」的漏洞。

空字串連一個位置都沒有，直接回 0，才不會憑空算出一段；單字元則不進迴圈也要拿到一。最後的整數串列說明這套流程靠的是相鄰元素可比較，而不是靠某個特定字母。每個位置至多和左鄰居比一次，時間是線性；只用 2 個長度和一個位置，不需要把所有片段另外切出來保存。

## 常見錯誤
從 0 開始直接比 `items[i-1]`，在 Python 不一定會報越界：負一索引反而讀到最後一個元素，可能把首尾錯接。只用字元總次數也不行，因為中間中斷的位置已經被捨棄。要追查，挑兩個總數相同、排列不同的字串；如果結果永遠一樣，就該回頭看演算法是否真的使用了相鄰關係。

## 小結
序列掃描的關鍵不是寫出迴圈，而是能替每個保留的值補一句「截至哪裡」。目前值可以重設，歷史最佳值不能跟著歸零。先用空、一個、末段最長三種情形驗收，常見的起點與結尾錯誤就容易浮現。
