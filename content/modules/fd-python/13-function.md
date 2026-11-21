---
id: fd-python-06-function
module: fd-python
order: 13
title: 函式參數與回傳值
subtitle: 讓一個函式只回答一個問題
status: ready
minutes: 35
level: 2
prereqs:
  - fd-python-05-mapping
objectives:
  - 用 def 宣告有參數與 return 的函式，區分回傳值與印出文字
  - 拆開顯示文字與計算邏輯
  - 用相同輸入檢查回傳值是否一致
tags:
  - python
  - function
resources:
  - title: "Python 教學：定義函式"
    url: https://docs.python.org/zh-tw/3/tutorial/controlflow.html
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-06-function-parameter
    prompt: "定義時的參數與呼叫時的引數如何配合？"
    answer: "參數是函式內接值的名稱，引數是這次呼叫交進去的值；本例依位置配對。"
    mcq:
      question: "def left(goal, done) 收到 left(30, 12)，done 是多少？"
      options:
        - "30"
        - "12"
        - "18"
        - "尚未給值"
      answer: 1
      explain: "依位置配對，第一個值給 goal，第二個給 done。"
  - id: fd-python-06-function-return
    prompt: "return 與 print 的用途差在哪裡？"
    answer: "return 把值交回呼叫處並結束這次函式，print 只顯示內容。"
    mcq:
      question: "函式只 print(18) 便走到底，把呼叫結果指定給 x，x 是什麼？"
      options:
        - "18"
        - "'18'"
        - "None"
        - "0"
      answer: 2
      explain: "畫面有 18 不代表呼叫者收到 18；沒有明確回傳值時結果是 None。"
    interview:
      question: "計算函式印出正確分鐘數，下一步卻不能拿它做加法，你怎麼查？"
      points:
        - "區分印出的值和呼叫結果"
        - "檢查是否有 return"
        - "在外層分別計算與顯示"
      answer: "我會把呼叫結果接到名稱再印型別。若是 None，先看是不是只在函式裡 print；我會讓它回傳數字，由呼叫端決定要加總還是附上單位顯示。"
  - id: fd-python-06-function-repeat
    prompt: "怎麼驗證計算函式沒有把前一次的數字帶進來？"
    answer: "用相同輸入重複呼叫，中間穿插另一組案例，比對回傳值而不只看顯示句子。"
practice:
  - id: fd-python-06-function-p1
    title: "留一個可重用的剩餘分鐘計算器"
    kind: code
    minutes: 11
    steps:
      - "建立 minutes_left.py，不改函式先跑三組呼叫。"
      - "新增目標 30、已做 30 及 40 的案例，驗證不會欠負的分鐘。"
      - "在兩筆不同輸入之間重跑同一組，保留數字和顯示文字。"
    checks:
      - "目標 30、已做 12 的兩次結果都是 18。"
      - "剛好與超過目標都回傳數字 0，不是字串或 None。"
---

## 為什麼要學：算剩多少，跟要在哪裡顯示是 2 個工作

同一個剩餘分鐘數，首頁想顯示一句話，報表卻要拿去計算明天的份量。把扣除規則分別貼在兩處，以後一邊修成「最低為 0」，另一邊可能還會出現負數。函式（function）把一個問題取名，讓不同地方能交入資料、取得同一種答案，而不用各自記住算式的細節。

## 核心概念：先約定輸入與回傳，再寫規則

`def` 表示定義，後面是名稱、括號內的參數（parameter）和冒號。下一層縮排寫每次呼叫要做的事。定義本身只是準備好這個工具；到呼叫時才會真的執行。呼叫括號裡送進去的值叫引數（argument），這個例子按位置配對。兩個都是分鐘，順序顛倒也可能照樣執行，所以要讓名字足夠清楚。

`return` 把值交回呼叫的地方，並結束這一次執行。`print` 則把內容顯示給人看，並不把畫面上的數字當成函式的結果。如果一路走到函式末尾都沒有回傳，呼叫者拿到的是 `None`，表示沒有提供一般的結果值。今天先約定：計算工具只回傳數字，顯示的句子留給外面決定。

## 範例：給同一個問題 3 組輸入

在 `C:\dev\stackway-lab\python-basics` 新建 `minutes_left.py`。先寫下呼叫端真正拿到的值，再對照畫面印出的字；即使兩者看起來相同，也不是同一種交付方式。

在該目錄執行：Windows PowerShell 用 `py minutes_left.py`；macOS／Linux 用 `python3 minutes_left.py`。

```python
def minutes_left(goal, done):
    difference = goal - done
    if difference < 0:
        return 0
    return difference

left = minutes_left(30, 12)
print(f'還差 {left} 分鐘')
print(minutes_left(10, 15))
print(minutes_left(30, 12))
```

第一個呼叫把 30 交給目標，把 12 交給已完成，差 18，沒有進到小於 0 的區塊，最後交回 18。下一次差是負 5，提早回傳 0，就不會再跑下方那行。第三次與第一次輸入相同，應拿到相同數字。它不需要知道你上次跑的是哪一天；所需資訊都在這次的兩個引數裡。

試著在紙上替換呼叫的位置，想像 `left = 18`。這個替換對「外層接到的資料」是合理的，而把呼叫換成「畫面上出現 18」就說不通，因為畫面不是可拿來加減的值。這是判斷一段邏輯該回傳還是只顯示的一個實用問法。

## 常見錯誤：不是每條分支都有出口

有時只在負數時寫了回傳，正常情況卻只印一下差值。測超過目標那組看似全對，換成一般輸入才發現拿到空結果。先把分支分成負數、0 和正數，各問它最後交出哪個型別。若呼叫前找不到名稱，也檢查定義是否真的放在第一次呼叫之前，及最後的顯示有沒有意外縮排在函式內。

讓兩次呼叫接收不同的引數，分別保留回傳值，再比較哪一筆還有剩餘時間。只在函式內印字，呼叫端就無法用同樣方式接著比較。

## 小結：把承諾縮成一句能驗證的話

「給目標與已做分鐘，交回不小於 0 的剩餘分鐘。」照這句寫測資，不必比對整段文案，也能知道核心規則是否正確。以後改成印英文或做成網頁，這個計算函式仍然可以保留。
