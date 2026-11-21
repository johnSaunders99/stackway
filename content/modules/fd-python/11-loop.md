---
id: fd-python-04-loop
module: fd-python
order: 11
title: for 迴圈與 range
subtitle: 讓程式走訪清單
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-10-lists
objectives:
  - 用 for 走訪串列，再用 range 產生不含終點的整數序列
  - 用迴圈加總每次練習的分鐘數
  - 對空清單預測總數
tags:
  - python
  - loop
resources:
  - title: "Python 教學：for 陳述式與 range"
    url: https://docs.python.org/zh-tw/3/tutorial/controlflow.html
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-04-loop-item
    prompt: "for minutes in sessions 每輪把什麼交給 minutes？"
    answer: "依串列順序交出該筆的值，不自動交出索引。"
    mcq:
      question: "sessions 是 [8, 15]，第一輪 minutes 是多少？"
      options:
        - "0"
        - "1"
        - "2"
        - "8"
      answer: 3
      explain: "一般走訪拿到項目本身；要的是值時不用先查位置。"
  - id: fd-python-04-loop-range-stop
    prompt: "range(1, 4) 會產生哪些整數？"
    answer: "從一開始到 4 之前，即 1、2、3，不含終點。"
    mcq:
      question: "要產生一到 3 的回合編號，哪個寫法符合？"
      options:
        - "range(1, 4)"
        - "range(1, 3)"
        - "range(3)"
        - "range(0, 4)"
      answer: 0
      explain: "只給 3 會從 0 開始；指定起點 1，終點要留在 4。"
  - id: fd-python-04-loop-accumulate
    prompt: "加總的起始值應在哪裡設定，為什麼？"
    answer: "在迴圈前設為 0，每輪沿用前一輪的總數；空串列也有定義好的 0 總量。"
    interview:
      question: "總分鐘數一直等於最後一筆，你會先檢查哪兩行？"
      points:
        - "總數初始化的位置"
        - "每輪是累加還是取代"
        - "用兩筆不同數字或空資料驗證"
      answer: "我會看是不是每輪都重設為 0，或把目前這筆直接指定給總數。用 8 和 12 筆就能分辨，正確總和是 23；空清單則應保持起始值 0。"
practice:
  - id: fd-python-04-loop-p1
    title: "留下加總軌跡與回合編號"
    kind: code
    minutes: 10
    steps:
      - "建立 total_minutes.py，用紙先列下每輪的總數。"
      - "將清單換成空清單，核對哪些行仍會印出。"
      - "改成 [5, 5, 12]，重跑後保留結果。"
    checks:
      - "原始清單輸出 8、23、43 的累計。"
      - "重複的 5 算 2 次，總數 22；編號不含 4。"
---

## 為什麼要學：逐筆加總不需要自己搬動指標

你手上有一列練習分鐘數，想知道共有多少時間。用上一堂的索引，可以寫第一格加第二格加第三格，但第四筆一出現，算式就過期。比起管理下一格的位置，這題真正想表達的是「每看到一筆，就加進目前的總數」。只要按這句話寫，3 筆、4 筆或 0 筆都能交給同一段程式。

## 核心概念：走訪資料和產生編號是 2 種需求

`for` 迴圈（for loop）逐一取出一組資料的成員。寫成 `for minutes in sessions:`，意思是把目前這筆的值交給名稱 `minutes`，再做縮排內的事。它不是把第一個位置 0 交給你。下一輪會取下一筆，不必像[〈while 迴圈〉](#/lesson/fd-python-09-while)倒數那樣自行更新讓迴圈前進的數字。

如果本來就沒有清單，只需要一串整數編號，用 `range`。一個參數時從 0 開始；兩個參數時，第一個是起點，第二個是**不包含**的終點。因此要讓人看到第一、第二、第三輪，起點是一，停在 4 之前。不要拿產生的編號當成分鐘資料，兩者剛好都是整數，意義卻完全不同。

## 範例：一邊收紀錄，一邊留下小計

在加總前先畫空表，每讀一筆就填上當時的累計值。不靠最後一個答案，你能指出第一次加錯會在哪一輪嗎？把下面的範例存成 `C:\dev\stackway-lab\python-basics` 裡的 `total_minutes.py`。

在該目錄執行：Windows PowerShell 用 `py total_minutes.py`；macOS／Linux 用 `python3 total_minutes.py`。

```python
sessions = [8, 15, 20]
total = 0
for minutes in sessions:
    total = total + minutes
    print(f'小計 {total}')
print(f'總計 {total}')
for number in range(1, 4):
    print(f'回合 {number}')
```

總數像紙上的一個小方格：一開始寫 0，第一筆來了改成 8；下一筆 15 不是把 8 擦掉換 15，而是用 8 加 15，寫 23；再加 20 得到 43。小計在縮排內，總計在外面，否則每處理一筆就會過早宣稱結算。後段編號獨立產生一、2、3，它不負責計算加總。

換成空串列時，沒有人走進第一個迴圈，小計一行都不會出現。但總數早在迴圈前就有起點，所以總計仍會印 0。後面產生編號的迴圈也仍然會跑 3 輪，因為它沒有讀取分鐘清單。藉這個反例可以看出哪些輸出真的依賴資料，不用從名字猜。

## 常見錯誤：每一輪都把累積的成果歸零

若把初始值退錯位置，縮排到本體裡，那麼每輪都像第一次加，最後只剩最後一筆。另一個錯誤是以為 3 筆資料一定有 1 個索引 3，於是硬用編號取值而越界。這題根本不需要位置，直接用取出的分鐘數即可。重複的值也各代表一次紀錄，不應因為 2 筆都是 5 就略過其中一筆。

空清單也值得跑一次。它沒有任何一筆可加入，小計理應留在迴圈開始前的初始值；若連總數都印不出來，再看顯示結果的那行是否縮排到了本體裡。

## 小結：先決定你要的是值還是位置

清單中已經有分鐘就走訪值；只有需要產生一段整數時才用範圍。把小計、總計和編號分開保存，日後對答案不符時，只要尋找第一個和手算不同的小計，就能縮小錯誤所在的那一輪。
