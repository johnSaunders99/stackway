---
id: fd-demo-03-values
module: fd-demo
order: 3
title: 讓程式讀出你的筆記
status: ready
minutes: 25
level: 1
prereqs: [fd-demo-02-paths]
objectives:
  - 辨認文字值與名稱
  - 追蹤兩行程式的執行順序
tags:
  - Python
  - 變數
resources:
  - title: Python 的數字與文字
    url: https://docs.python.org/3/tutorial/introduction.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: 2026-11-20
concepts:
  - id: values-name
    prompt: 變數名稱與文字值有什麼不同？
    answer: 變數名稱用來找到目前的值；引號內寫的是文字本身。
    mcq:
      question: 哪個表示一段文字，而不是變數名稱？
      options:
        - '"note"'
        - note
        - print
      answer: 0
      explain: 變數名稱用來找到目前的值；引號內寫的是文字本身。
  - id: values-print
    prompt: print(note) 做了什麼？
    answer: 先取得 note 目前的值，再把它顯示出來；這不會自動儲存檔案。
    mcq:
      question: 在螢幕上顯示值，應使用哪個動作？
      options:
        - 重新命名檔案
        - print
        - 切換目錄
      answer: 1
      explain: 先取得 note 目前的值，再把它顯示出來；這不會自動儲存檔案。
  - id: values-order
    prompt: 同一個名稱改指向新值後，下一次讀到什麼？
    answer: 依序執行時，下一次讀到最近指派的值，不會改寫先前已顯示的輸出。
    mcq:
      question: 先指派 A 再指派 B，最後顯示哪個？
      options:
        - B
        - A
        - AB
      answer: 0
      explain: 依序執行時，下一次讀到最近指派的值，不會改寫先前已顯示的輸出。
    interview:
      question: 畫面上為什麼同時看得到兩個不同的值？
      points:
        - 說出兩次指派的順序
        - 輸出留下當時的值
      answer: 依序執行時，下一次讀到最近指派的值，不會改寫先前已顯示的輸出。
practice:
  - id: fd-demo-03-values-p1
    title: 預測兩行不同的輸出
    kind: hands-on
    minutes: 5
    steps:
      - 先在紙上預測兩次 print 的結果。
      - 在 Python 互動環境依序輸入範例，或用紙逐行模擬。
      - 只改第二次的文字，指出哪一行輸出會變。
    checks:
      - 能分辨名稱與有引號的文字
      - 兩次預測都有對照實際值或逐行紀錄
    solution: 第一次顯示 **first**，第二次顯示 **second**。改動第二次指派只會影響後面的輸出。
---
## 為什麼要學：讓動作可以重做
筆記的標題可以手動輸入，也可以交給程式重複顯示。程式不是一次猜出所有答案，而是逐行解讀我們交代的動作。先學會預測很短的程式，比一開始就照著打很多行更有用。
## 核心概念：替值取一個名字
在 Python 裡，把一段文字放在一對引號中，就得到字串 (string)。變數 (variable) 是一個名稱，可以用它找到值。等號在這裡表示指派：先讀右邊的值，再讓左邊的名稱指向它，而不是要求左右兩邊原本就相等。
## 範例：同一個名稱，兩次輸出
如果已經有 Python，可以在互動環境逐行執行。沒有也不必安裝：畫兩欄，左邊記錄名稱現在的值，右邊記錄螢幕多出哪一行。
```python
note = "first"
print(note)
note = "second"
print(note)
```
第一行並沒有要求顯示，所以輸出欄是空的。走到第二行，程式找到名稱所指的文字，把它呈現在螢幕上。走到第三行，名稱的對應改變，先前留在畫面上的那一行卻不會跟著重寫。
### 小實驗：在名稱兩旁加上引號
試著把最後一行改成顯示引號內的 note。這次你看到的會是名稱的四個字母，不是變數所指向的值。比較這兩種情形，比背下「引號可有可無」之類不準確的口訣可靠得多。
### 用紙追一次錯誤
假如不小心把第一行移到最後，第一次顯示時，名稱還沒有對應的值。此時最有用的問題不是猜輸出，而是問程式究竟能不能走到那裡。逐行模擬時，一遇到找不到的名稱就停下來，把它圈起來；別偷偷拿後面那行的值來補。
## 常見錯誤：把顯示當作儲存
將結果顯示在畫面上，並不代表建立了文字檔案。要在關閉環境後保留程式，需要另外儲存程式碼；要保留輸出，也需要有意識地記錄。輸入程式時使用半形引號，書寫文章常見的彎引號不會被當成相同的語法。
## 小結
逐行追蹤時，把「目前的值」與「已經顯示的文字」分開。只要你能說出下一行會讀到哪個值，就已經在用工程師除錯時需要的思考方式。
