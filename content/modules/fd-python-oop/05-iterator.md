---
id: fd-python-oop-05-iterator
module: fd-python-oop
order: 5
title: 可迭代物件與迭代器
subtitle: 下一筆從哪裡接著讀
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-oop-04-dataclass
objectives:
  - 以 iter 與 next 逐步取得資料
  - 辨識耗盡狀態與重新取得迭代器的差異
tags:
  - python-oop
  - iterator
resources:
  - title: 'Python 教學：迭代器'
    url: 'https://docs.python.org/zh-tw/3/tutorial/classes.html#iterators'
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '從 for 對照 iter、next 與結束訊號。'
concepts:
  - id: fd-python-oop-iterator-source
    prompt: '串列和它的迭代器各自保存什麼？'
    answer: '串列保存元素，從它取得的迭代器保存這一趟讀取的位置。'
    mcq:
      question: '對同一串列分別呼叫 iter 兩次，再各讀一次會怎樣？'
      options:
        - '各讀一半'
        - '各取得第一個元素'
        - '第二支讀第二個'
        - '清單少 2 筆'
      answer: 1
      explain: '這是兩趟獨立的進度，不是在清單上刪除元素。'
  - id: fd-python-oop-iterator-end
    prompt: '手動讀取時，如何區分 0 與耗盡？'
    answer: '用 next 的結束訊號或不會與資料重複的替代值，不能用資料本身的真假。'
    mcq:
      question: '整數資料可能含 0，哪種做法能正確識別耗盡？'
      options:
        - '把 0 視為結束'
        - '檢查原清單是否變空'
        - '把負數視為結束'
        - '對 next 使用非整數結束標記'
      answer: 3
      explain: '資料值與讀取是否成功是兩件事，原清單的長度也不代表剩餘量。'
  - id: fd-python-oop-iterator-consume
    prompt: 'list(cursor) 之後同一支迭代器還能讀到什麼？'
    answer: '它已被讀完；除非重新從可重讀來源取得新的迭代器，否則沒有下一筆。'
    interview:
      question: '預覽一筆後交給迴圈，為什麼少印一筆？'
      points:
        - '預覽已經消費第一筆'
        - 'for 從當前位置接手'
        - '保留預覽值或從來源重讀'
      answer: '我會先看預覽是否使用 next。如果後面拿的是同一支迭代器，它就從第二筆繼續。我可以先處理已讀值再處理其餘資料；若來源是串列，也能另外開一趟。'
practice:
  - id: fd-python-oop-iterator-lab
    title: '做一份 2 支書籤的讀取紀錄'
    kind: code
    minutes: 10
    steps:
      - '執行 minute_cursor.py，標記每個消費資料的動作。'
      - '將 other 改為直接指向 first，另存共用版本再執行。'
      - '把兩版本第一行與最後一行的輸出寫成註解。'
    checks:
      - '獨立版本第一行為 5 5，共用版本為 5 0。'
      - '兩版本原始清單都仍含 3 筆。'
---
## 為什麼要學
你要先預覽第一筆分鐘數，確認格式正常，再把剩下的資料交給迴圈。明明原清單還有 3 筆，迴圈卻只印出後 2 筆。資料沒有被刪掉；真正改變的是「下一次要讀哪裡」。把資料來源和讀取位置分開想，就能解釋為何同一段迴圈有時可以重跑，有時一筆都讀不到。

## 核心概念
可迭代物件 (iterable) 是可以向它取得迭代器的物件。串列是常見例子。迭代器 (iterator) 除了能被迭代，還會記住這一趟的進度。把 `iter` 想成向資料來源要一個讀取工具，把 `next` 想成請這個工具交出下一筆並前進。不要把它想成按索引取值：讀了第一筆，下一次就不會回到第一筆，也不用自己把索引加 1。

走到最後一筆之後，再呼叫沒有預設值的 `next`，會收到 `StopIteration` 例外，意思是這一趟結束。例外是程式發出的特殊訊號，之後在[〈Python 例外處理〉](#/lesson/fd-python-tools-02-errors)會細講。`for` 已懂得把這個訊號當成正常結束；手動讀取時，也可以用 `next(cursor, "end")` 指定讀不到時要回傳的替代值。本例的資料都是整數，所以文字標記不會與合法值混淆。

## 範例：同一串資料，2 支獨立的書籤
手動讀到最後一項後再多取一次。知道沒有下一項，和碰巧讀到值為 0，是完全不同的結果。把下面的範例存成 `C:\dev\stackway-lab\timers` 裡的 `minute_cursor.py`。

在該目錄執行：Windows PowerShell 用 `py minute_cursor.py`；macOS／Linux 用 `python3 minute_cursor.py`。

```python
minutes = [5, 0, 8]
first = iter(minutes)
other = iter(minutes)
print(next(first), next(other))
print(next(first))
print(list(first))
print(next(first, "end"))
print(list(other))
print(minutes)
```

先在紙上並排寫兩次 5、0、8，各用一根手指指向 5。第一次列印從兩支迭代器分別取一筆，因此兩邊都得到 5。第二次只移動第一根手指，讀到 0。`list(first)` 不是偷看，而是把這支迭代器剩餘的每筆收進新串列，得到只含 8 的清單。此時第一趟已經耗盡，替代值才會登場。

另一支的下一筆仍是 0。它可以收出 0 和 8，原始串列則始終印出 3 個數字。把第二行改成先從串列取迭代器、再令其他名字指向同一支，重新畫箭頭：兩根手指現在該合成一根。對串列重新呼叫 `iter` 可以開始新的一趟，對迭代器本身呼叫則得到它自己，並不會倒帶。想重讀前應該問手上拿到的是來源還是已經用過的讀取工具。

## 常見錯誤
不要用「這個值是不是真的」判斷讀完沒。0 是有效的分鐘數，如果以真假值控制結束，最後的 8 也看不到。另一個陷阱是在每次呼叫 `next` 前都重新對串列做 `iter`；那不是逐筆讀，而是反覆拿新書籤讀第一筆。要維持進度就保存同一支，要彼此獨立就從可重讀的來源各取一支。

想從頭重讀時，要先問手上拿的是可重新走訪的資料，還是已走到尾端的游標。

## 小結
遇到短少一筆的現象，先查是哪個動作已經消費資料。預覽、轉串列、迴圈都會讓迭代器前進。原清單、這一趟的位置以及替代值分別負責三件事，不該用同一個真假判斷把它們混在一起。
