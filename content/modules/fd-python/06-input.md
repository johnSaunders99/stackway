---
id: fd-python-06-input
module: fd-python
order: 6
title: input 與型別轉換
subtitle: 讀到的 30 分鐘為何不能直接加 10
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-05-fstrings
objectives:
  - 用 input 讀一行並用 type 查看型別
  - 把有效輸入轉成整數並預測空字串轉換的結果
tags:
  - python
  - input
resources:
  - title: "Python 內建函式：input、int 與 type"
    url: https://docs.python.org/zh-tw/3/library/functions.html
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-06-input-input-type
    prompt: "input 收到一行 30 後回傳什麼型別？"
    answer: "即使全是數字字元，結果仍是 str，不含按 Enter 送出的換行。"
    mcq:
      question: "輸入 30 後先印 type(raw)，會看到什麼？"
      options:
        - "int"
        - "float"
        - "str"
        - "bool"
      answer: 2
      explain: "input 收集文字而不猜使用者想拿它做哪種運算。"
  - id: fd-python-06-input-conversion
    prompt: "int('30') 和 '30' + '10' 各代表什麼？"
    answer: "前者把整數文字轉成可運算的數字 30；後者把兩段文字接成 3010。"
    mcq:
      question: "要讓輸入的 30 加 10 而得到 40，該用哪式？"
      options:
        - "raw + '10'"
        - "raw + 10"
        - "int(raw + '10')"
        - "int(raw) + 10"
      answer: 3
      explain: "要先明確轉成數字才做加法；串接後再轉會得到另一個數。"
  - id: fd-python-06-input-empty
    prompt: "只按 Enter 為何不能當成 0 直接轉？"
    answer: "input 回傳空字串，沒有任何整數字元；int 會引發 ValueError，而不是自動補零。"
    interview:
      question: "有人說空白輸入算 0 就好，你會先確認什麼？"
      points:
        - "區分沒有填與真的填 0"
        - "指出直接轉換的結果"
        - "在轉換前決定規則"
      answer: "我會先確認空白代表略過還是真的 0 分鐘。兩者的紀錄意義不同；直接 int 空字串會失敗，所以我會先保留原始文字，等需求確定再決定怎麼分流。"
practice:
  - id: fd-python-06-input-p1
    title: "留下三次輸入的對照紀錄"
    kind: code
    minutes: 8
    steps:
      - "建立 ask_minutes.py，分三次獨立執行，輸入 30、0 與直接按 Enter。"
      - "每次先預測型別及能否得到總數，再看畫面最後一行。"
      - "把三次結果與造成差異的輸入記在紙上。"
    checks:
      - "前兩次輸出 40、10。"
      - "空輸入仍先顯示 str，之後出現 ValueError，不是總數 10。"
---

## 為什麼要學：不改程式也能換今天的分鐘數

前幾堂要改分鐘數時，你得打開程式改那一行。現在想把工具交給一個只知道今天練了多久的人：輸入一個數字，程式幫忙加上 10 分鐘複習。這中間有一條界線，鍵盤送來的是文字，做加法用的是數字；把這兩件事分開，才不會把 30 加 10 算成 3010。

## 核心概念：先讀一行，再決定它是什麼

輸入（input）在這裡指等使用者打一行字。`input('分鐘？')` 會先顯示括號裡的提示，等待按下 Enter，再把打進去的內容交回。提示句不是結果的一部分，按 Enter 送出的行尾也不在字串裡。若畫面停在提示後面，很可能只是等你打字，並不是程式當掉了。

型別轉換（type conversion）是明確要求產生另一種類的值。`int(raw)` 嘗試把文字解讀成整數；`'30'` 能轉，`'30 分鐘'` 不符合這裡要的整數寫法。轉換會交回新的值，原來的文字仍在。先用一個名稱留原稿，再用另一個名稱存結果，日後才能知道失敗究竟發生在接收還是解讀的階段。

## 範例：把看似相同的輸入分開觀察

開啟 `C:\dev\stackway-lab\python-basics`，將範例另存為 `ask_minutes.py`。先打一般整數，再判斷空白輸入是否也能轉成整數。看到畫面上有數字，不等於程式拿到的就是數值。

在該目錄執行：Windows PowerShell 用 `py ask_minutes.py`；macOS／Linux 用 `python3 ask_minutes.py`。

```python
raw = input('練習幾分鐘？ ')
print(type(raw))
minutes = int(raw)
print(minutes + 10)
```

第一次輸入 `30`，應該先看到字串型別，再看到 40。第二次重新啟動，輸入 `0`，別跳過這筆：0 也是合法的整數文字，最後應該是 10。第三次只按 Enter，仍然能印出字串型別，但整數轉換會出現 `ValueError`；這是告訴你「值的內容不適合這次轉換」，程式不會接著印出總數。本次刻意留下錯誤讓你觀察，不需要重裝 Python。

留意三次執行都用了同一個程式。若 30 那筆竟然印出 3010，檢查加號兩邊是否都是字串；若出現不能把文字與整數相加的訊息，可能已算好 `minutes` 卻仍把 `raw` 拿去加 10。該修的是資料穿過界線的地方，不是換成另一種顯示格式讓答案看起來像數字。

## 常見錯誤：把沒填、填 0 和有小數混在一起

在紙本表格上，沒填通常代表不知道，填 0 代表確定沒有。程式也不該代替使用者暗自選一種解讀。輸入 `'3.5'` 不是整數文字，這個轉換不會替你捨去小數。本堂先能看懂哪一行出錯；條件分支是讓程式選擇不同道路的寫法，之後在[〈if、elif 與 else〉](#/lesson/fd-python-03-branch)會學到如何替空輸入留另一條路。

想像別人只交給你一張寫有分鐘的紙。先辨認沒填、填錯、確實是零，再決定能不能加總；請電腦轉型之前也要回答同一個問題。

## 小結：把一次輸入留成 3 種測資

正常的 30、合法的 0、沒有填的空字串，三者各有用途。下次有人說「我輸入數字了」時，先問讀進來的是哪一種值，再用清楚的轉換開始計算。這比猜測使用者按了什麼鍵更可靠。
