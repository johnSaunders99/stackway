---
id: fd-python-10-lists
module: fd-python
order: 10
title: 串列的新增、刪除與索引
subtitle: 今天多做了一筆練習
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-09-while
objectives:
  - 以 list 建立、索引、修改、附加與移除項目
  - 分辨索引越界與空串列
tags:
  - python
  - lists
resources:
  - title: "Python 教學：串列的方法"
    url: https://docs.python.org/zh-tw/3/tutorial/datastructures.html
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: "Python 教學：串列與位置"
    url: https://docs.python.org/zh-tw/3/tutorial/introduction.html
    kind: doc
    lang: zh-Hant
    minutes: 4
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-10-lists-index
    prompt: "3 筆紀錄的第二筆用哪個索引？"
    answer: "索引從 0 起算，因此第二筆是 1。"
    mcq:
      question: "對 [8, 12, 20] 讀取索引 1 得到什麼？"
      options:
        - "8"
        - "20"
        - "12"
        - "1"
      answer: 2
      explain: "索引是從 0 起算的位置，不是要搜尋的值。"
  - id: fd-python-10-lists-append-pop
    prompt: "不給位置時，append 與 pop 分別動哪裡？"
    answer: "append 把新值加在尾端；pop() 移除並回傳目前最後的值。"
    mcq:
      question: "在 [8, 12] 後附加 5，再做一次 pop()，它交回什麼？"
      options:
        - "12"
        - "8"
        - "整份串列"
        - "5"
      answer: 3
      explain: "剛附加的 5 位於尾端，是被取走的項目。"
  - id: fd-python-10-lists-empty-list
    prompt: "空串列的長度與第一筆是什麼關係？"
    answer: "空串列的長度為 0，沒有第一筆；讀索引 0 或直接 pop 都會越界。"
    interview:
      question: "畫面沒有練習紀錄時卻出現 IndexError，你會怎麼重現？"
      points:
        - "使用空串列"
        - "區分長度與有效索引"
        - "在讀取或移除前檢查有項目"
      answer: "我會先傳入空串列，看是哪一行假設有第一筆。長度為 0 本身沒有錯；要修的是顯示或移除前先判斷，不是塞一筆假的 0 分鐘進去。"
practice:
  - id: fd-python-10-lists-p1
    title: "留下會校正與撤回一筆資料的清單"
    kind: code
    minutes: 10
    steps:
      - "建立 sessions.py，畫 3 格並標上從 0 開始的位置。"
      - "跑一次範例，對照修改、附加和取走後的結果。"
      - "在程式結尾另寫 sessions = []，印出長度，再用 if len(sessions) > 0: 包住印第一筆的敘述。"
    checks:
      - "原範例取回 5，最後是 [8, 15, 20]。"
      - "空清單能顯示長度 0，不假裝有 1 筆 0 分鐘。"
---

## 為什麼要學：記錄是一列資料，不是一堆名字

若每天練幾次就造幾個名稱，到了第四次，連哪個名字代表最新一筆都要回頭翻。串列（list）把有順序的資料放在一起；你可以說「第二筆記錯了」或「剛才多登了一筆」，不必先替每一次練習發明名稱。本堂做一份能校正中間紀錄、也能撤回最後一筆的分鐘清單。

## 核心概念：位置和內容是 2 件事

用方括號包住項目，其間用逗號分隔。索引（index）是由 0 開始的位置；一列 3 筆的位置是 0、1、2，長度是 3。讀取時在名稱後加方括號與索引；要改那一格，就把這個位置放在指定運算的左邊。和不可變的字串不同，串列可以在原處修改，不必每次把整張清單重新指定。

`append` 將一筆資料附加到尾端，`pop` 不帶位置時從尾端移除一筆，並把移除的值交回。這兩個動作都會改變清單的長度。校正中間的數字卻只需更新既有位置，長度不該變。如果你把校正也當成附加，畫面會多一筆，之後加總就會重算。

## 範例：改第 2 筆，再撤回最後一筆

在 `C:\dev\stackway-lab\python-basics` 新建 `sessions.py`。把串列內容和索引分兩行寫；刪掉某項後重新對齊。索引代表現在的位置，不是永遠不變的編號。

在該目錄執行：Windows PowerShell 用 `py sessions.py`；macOS／Linux 用 `python3 sessions.py`。

```python
sessions = [8, 12, 20]
print(sessions[1])
sessions[1] = 15
sessions.append(5)
removed = sessions.pop()
print(removed)
print(sessions)
print(len(sessions))
```

第一個輸出是 12。第二格校正為 15 以後，原本的第三格 20 仍在原處。附加 5 讓長度從 3 變 4，取走尾端又回到 3，因此最後顯示的清單應是 8、15、20。只看最後長度不能證明什麼都沒有變，還要看中間那格與取回的值。用紙畫格子時，在每格上面寫位置，在格子裡寫值，就不容易把兩者弄反。

若要撤回指定位置也能將索引傳給 `pop`。例如移走第一格之後，後方每筆都向前補一格；先前記住的第三筆位置不一定還有效。問「這筆資料是哪一筆」時，要分清楚自己記的是內容，還是目前這一刻的排列位置。

## 常見錯誤：用長度當最後的位置

3 筆的清單讀取索引 3 會得到 `IndexError`，這是越界，不代表清單本身損壞。空清單用 `[]` 表示，長度是 0，並不是裡面有 1 個 0；兩種情況對平均或計數的意義都不同。如果只在有紀錄時才要讀第一格，可以先用 `if len(sessions) > 0:` 判斷，再把讀取那行縮排放在下面。

挑兩筆分鐘數相同的紀錄，各畫一格。把前面的那筆刪掉後，後面那筆仍然存在，但位置已變；單看留下的數字可能看不出你刪的是哪筆。先指出索引，再說要移除哪一格。

## 小結：問對清單的 3 個問題

先問現在有幾筆，再問要動哪個位置，最後確認這個動作應不應該改變長度。把本次的取回值和最後清單放在一起；下次看到資料少一行時，就能分辨是校正了舊資料，還是真的撤掉了一筆。
