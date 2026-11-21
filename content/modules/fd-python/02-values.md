---
id: fd-python-02-values
module: fd-python
order: 2
title: Python 值與型別
subtitle: 數字、文字與第一行輸出
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-01-interpreter
objectives:
  - 用 type 分辨 int、float、str、bool，預測運算結果的型別
  - 執行一份只有 print 的程式
  - 比較字串相加與數字相加的結果
tags:
  - python
  - types
resources:
  - title: "Python 教學：用 Python 當計算機"
    url: https://docs.python.org/zh-tw/3/tutorial/introduction.html
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-02-values-type
    prompt: "int、float、str、bool 各表示哪一類值？"
    answer: "依序是整數、浮點數、文字與真假；type 可以顯示實際型別。"
    mcq:
      question: "哪個值的型別是 bool？"
      options:
        - "'True'"
        - "1"
        - "True"
        - "1.0"
      answer: 2
      explain: "引號內是真假拼成的文字；數字可參與判斷，但型別不是 bool。"
  - id: fd-python-02-values-plus
    prompt: "同樣寫加號，怎麼知道是加總還是串接？"
    answer: "先看兩側的型別，兩個數字會相加，兩個字串會接成新字串。"
    mcq:
      question: "print('2' + '5') 印出什麼？"
      options:
        - "7"
        - "2 5"
        - "2+5"
        - "25"
      answer: 3
      explain: "引號把兩邊都變成文字，加號不會自動把它們解讀成數字。"
  - id: fd-python-02-values-display
    prompt: "只看 print 的輸出能區分 30 與 '30' 嗎？"
    answer: "不能。畫面都可能是 30，要查 type 或觀察可執行的運算。"
    interview:
      question: "報表出現 1510 而不是 25，你會先查哪裡？"
      points:
        - "檢查兩個值的型別"
        - "辨別串接與數值運算"
        - "用小例子核對"
      answer: "我會先把兩個值交給 type。如果都是文字，加號只是把 15 和 10 排在一起。我會先用兩個明確的整數做對照，而不是去調整報表排版。"
practice:
  - id: fd-python-02-values-p1
    title: "做一份能分辨四種型別的小程式"
    kind: code
    minutes: 9
    steps:
      - "存好 values.py，先預測每一行，再與實際輸出對照。"
      - "把兩個加法例子的 5 都換成 8，記下不同答案。"
      - "加兩行 print，分別印出帶引號與不帶引號的 30 的型別。"
    checks:
      - "第二輪的加法分別得到 10 和 28。"
      - "我用 type 看見 int 與 str，即使兩個值顯示起來都是 30。"
---

## 為什麼要學：2 筆練習加起來竟然是 25？

如果今天先練 2 分鐘，再練 5 分鐘，總共應該是 7 分鐘。但把兩段文字「2」和「5」連在一起，紙上得到的是「25」。兩個答案都照某個規則算對了，只是代表完全不同的事情。寫第一份程式之前，先認識資料在程式裡是什麼，而不只是它在螢幕上長什麼樣。

## 核心概念：值有種類，符號才有意義

值（value）是程式處理的一份資料。型別（type）說明它是哪一類：整數（int）如 `2`，浮點數（float）如 `2.0`，字串（str）如 `'2'`，布林值（bool）只有 `True` 或 `False`。數學上 2 與 2.0 相等，程式仍能分辨它們的型別。引號是標示文字邊界的寫法，不是文字本身；真假兩個字的英文開頭必須大寫。

`print(...)` 是呼叫一個把結果顯示在畫面上的工具。先算括號裡的內容，再印結果。`type(...)` 則回答裡面那個值的型別，把它放進 `print` 才能在執行程式檔時看見。這種可用名稱和括號呼叫的工具叫函式（function）；之後在[〈函式參數與回傳值〉](#/lesson/fd-python-06-function)會自己寫一個，現在先會使用現成的即可。

## 範例：用同一張紙預測 6 行輸出

用檔案總管在練習區建立 `python-basics`，讓後續的程式檔有固定位置。

先分兩欄記下你以為會看到的型別和結果。看起來都是 2，加引號後還能和整數做同一種加法嗎？把下面的範例存成 `C:\dev\stackway-lab\python-basics` 裡的 `values.py`。程式檔請用 UTF-8 純文字；遇到同名檔先另取檔名，執行指令也要跟著改。

在該目錄執行：Windows PowerShell 用 `py values.py`；macOS／Linux 用 `python3 values.py`。

```python
print(type(2))
print(type(2.0))
print(type('2'))
print(type(True))
print(2 + 5)
print('2' + '5')
```

前四行在顯示的型別名稱中依序含有 `int`、`float`、`str`、`bool`。最後 2 行依序是 7 與 25 的字樣。先不要同時改運算和資料，試著只把最後一行的兩個引號組拿掉；程式碼的形狀幾乎不變，結果卻切換成加總。反過來，保留兩組引號只把數字改成字母，加號仍能接成一段文字，這就排除了它在偷偷做算術的猜想。

再選一筆「不做算術」的資料：座位編號 `'05'`。兩個字元都要保留時，文字比整數更忠實；因為今年碰巧只含數字，就把每個編號都當數量，反而會失去開頭的 0。決定型別時先問資料的用途，不是先問鍵盤上按的是數字還是字母。

## 常見錯誤：以為印得一樣就能交換使用

單獨印 `30` 與 `'30'` 時，兩行看起來沒有差別。不代表數字和文字可以直接混加；試著解釋「2 分鐘加上一個字」要是哪種運算，你會發現意圖不明確。之後在[〈input 與型別轉換〉](#/lesson/fd-python-06-input)會學到何時要明確轉成數字。本堂用半形直引號輸入程式，中文彎引號適合文章，不能代替 Python 的字串界線。

## 小結：寫預測時記得附單位和型別

在兩個答案旁邊分別寫上「整數的和」與「接起來的文字」。下次看到一筆資料印出來像數字，先用型別作證，再決定要加總或串接。這個小動作會在之後處理使用者輸入時，替你省下很多看似合理的錯答案。
