---
id: fd-python-09-while
module: fd-python
order: 9
title: while 迴圈
subtitle: 還有幾分鐘就再扣一次
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-03-branch
objectives:
  - 寫出包含起點、條件與更新的 while
  - 用 0 次與多次迭代核對停止條件
tags:
  - python
  - while
resources:
  - title: "Python 教學：用 while 重複執行敘述"
    url: https://docs.python.org/zh-tw/3/tutorial/introduction.html
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: "直接讀「程式設計的第一步」。"
concepts:
  - id: fd-python-09-while-pretest
    prompt: "while 的條件第一次是在何時檢查？"
    answer: "在進入迴圈本體之前，所以起始條件是假時可以完全不執行本體。"
    mcq:
      question: "起始 remaining = 0，條件 remaining >= 5，本體跑幾次？"
      options:
        - "一次"
        - "0 次"
        - "5 次"
        - "直到手動停止"
      answer: 1
      explain: "先問再做，沒有先送一輪。"
  - id: fd-python-09-while-update
    prompt: "倒數迴圈怎麼保證有進展？"
    answer: "每一輪都要更新影響條件的值，並朝條件變假的方向前進。"
    mcq:
      question: "每輪消耗 5 分鐘，哪個更新能往結束前進？"
      options:
        - "remaining = remaining + 5"
        - "remaining = remaining"
        - "remaining = remaining - 5"
        - "remaining - 5 但不指定"
      answer: 2
      explain: "算出差值卻沒有接回名稱，下一輪仍會看見舊值。"
  - id: fd-python-09-while-leftover
    prompt: "想只做完整 5 分鐘回合，為何不寫 remaining > 0？"
    answer: "只剩一到 4 分鐘時仍為正，卻不夠一個完整回合；門檻應是至少 5 分鐘。"
    interview:
      question: "倒數工具偶爾出現負的剩餘分鐘，你會用哪筆資料追？"
      points:
        - "選不是 5 的倍數的輸入"
        - "檢查開跑前門檻"
        - "比對每輪前後的剩餘量"
      answer: "我會拿 12 分鐘手算，完整回合只有 2 次，應剩 2。若剩 2 還進去扣 5，就知道問題在能否進入下一輪，而不是最後顯示的正負號。"
practice:
  - id: fd-python-09-while-p1
    title: "留下回合與餘額的追蹤紙"
    kind: code
    minutes: 10
    steps:
      - "建立 rounds.py，先按紙上推算寫下 12 的每一輪。"
      - "將起點改為 0、5，各自重跑並記錄本體執行的次數。"
      - "用 16 再驗一次，保存程式與紙上餘額。"
    checks:
      - "0 回合不印完成；起點 5 只印一次。"
      - "16 分鐘可做 3 輪，最後剩 1 分鐘。"
---

## 為什麼要學：還能做完整的一輪嗎？

你剩 12 分鐘，每段練習要 5 分鐘。寫 2 次扣 5 確實會剩 2，但是換成 20 分鐘，又得重新數該貼幾行。迴圈（loop）讓同一段動作重複發生，每次開工前重新問「剩下的時間還夠嗎」。這裡的重點不是盡量重複，而是說得清楚為什麼會停止，以及停止後那一點餘額代表什麼。

## 核心概念：起點、條件、更新缺一不可

`while` 後面寫一個真假條件，行尾冒號之後縮排的是每輪要做的事。電腦先檢查條件；若成立，就從頭到尾執行一次縮排區塊，再回去檢查。若不成立，直接跳到縮排之外的下一行。每執行一次本體叫一次迭代（iteration）。先問再做，所以 0 次也是正常答案。

對今天的需求，把起點寫成可用分鐘數，條件寫成「至少還有 5 分鐘」，更新是扣掉已使用的 5 分鐘。如果少了更新，而第一次條件又是真的，電腦就會一直得到相同答案。先用紙把這三件事圈起來，再決定額外要顯示哪些資訊，不要一開始只專心畫倒數的畫面。

## 範例：12 分鐘只能換 2 張完成單

開啟 `C:\dev\stackway-lab\python-basics`，將範例另存為 `rounds.py`。圈出每輪會改變的變數。若把那行拿掉，下一次判斷條件時，程式還有機會自然停下來嗎？

在該目錄執行：Windows PowerShell 用 `py rounds.py`；macOS／Linux 用 `python3 rounds.py`。

```python
remaining = 12
while remaining >= 5:
    remaining = remaining - 5
    print(f'完成一輪，剩 {remaining} 分鐘')
print(f'結束：{remaining}')
```

執行前先寫一列數字：12 可以進入，扣完剩 7；7 仍可以進入，扣完剩 2；2 不足 5，這次只檢查不進入。你會看見 2 行「完成一輪」以及一行「結束」。最後那行沒有縮排，因此不論一次、2 次或 0 次，整個迴圈結束後都會執行一次。若希望印「開始這輪前還有多少」，顯示的位置就應移到扣除之前。

把起點換成 5，這是剛剛好能完成一輪的邊界。若結果變成 0 輪，檢查條件是不是誤寫成嚴格大於。再換成 4，餘額應原封不動，不能先扣再看是否負數。用兩個只差 1 分鐘的例子，比測一大堆剛好整除的數字，更容易看出門檻的含義。

## 常見錯誤：算了新值卻沒有留下

單寫 `remaining - 5` 只會算出差，不會替名稱指定新值。若把更新那行退到迴圈外，本體裡也沒有任何事能改變條件。萬一畫面不停刷出同樣的字，在執行程式的終端機按 Ctrl+C 中斷，再回頭檢查，不需要關掉電腦，也不要靠加一個很大的固定輪數來掩蓋原本的錯。

想像第一次檢查條件時餘額就不夠。程式應直接交回原值；如果仍扣了一輪，要查的是判斷放在哪裡，而不是再補一個神祕的常數。

## 小結：結束也是要驗證的輸出

保留一筆 0 輪、一筆剛好一輪，以及一筆做完有剩的紀錄。只檢查「程式有印字」看不出會不會多扣一次；檢查回合數與最後的餘額，才能確定條件和更新一起完成了你原本想做的事。
