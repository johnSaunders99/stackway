---
id: fd-python-05-mapping
module: fd-python
order: 12
title: 字典的讀寫與計數
subtitle: 用字典依類別計數
status: ready
minutes: 35
level: 2
prereqs:
  - fd-python-04-loop
objectives:
  - 用 dict 建立與更新鍵值對，走訪 items 取得鍵和值
  - 選擇適合作為鍵的資料
  - 讓不存在的類別從 0 開始累計
tags:
  - python
  - dictionary
resources:
  - title: "Python 教學：字典與走訪技巧"
    url: https://docs.python.org/zh-tw/3/tutorial/datastructures.html
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-05-mapping-key
    prompt: "字典讀值用的鍵和串列的索引有何差別？"
    answer: "字典以鍵辨認項目，不靠排列中的第幾格；同一鍵只有一個目前值。"
    mcq:
      question: "想以 'read' 找出閱讀筆數，最直接用什麼？"
      options:
        - "以 'read' 當字典的鍵"
        - "用 'read' 當串列位置"
        - "用筆數當唯一類別名"
        - "永遠讀第一筆輸入"
      answer: 0
      explain: "類別文字能穩定辨認要查的那格，位置不代表類別。"
  - id: fd-python-05-mapping-get
    prompt: "counts.get(tag, 0) 在缺鍵時會寫入 0 嗎？"
    answer: "不會。它只回傳替代值 0，直到對 counts[tag] 指定才新增或更新。"
    mcq:
      question: "剛建空字典，單獨讀 counts.get('lab', 0) 後有幾個鍵？"
      options:
        - "一"
        - "0"
        - "2"
        - "讀取必定中斷"
      answer: 1
      explain: "預設值讓讀取有答案，不等於執行了寫入。"
    interview:
      question: "新類別首次出現就計數失敗，要怎麼修而不吞掉舊筆數？"
      points:
        - "區分缺鍵與已有值"
        - "用 get 取得目前筆數或 0"
        - "加一後寫回同一個鍵"
      answer: "我會用一個新類別和一個重複類別測。缺鍵時先把舊筆數視為 0，已存在就沿用舊數；兩種都加一後寫回，這樣不會每輪都把同類重設成一。"
  - id: fd-python-05-mapping-items
    prompt: "怎樣一次走訪每個類別與它的筆數？"
    answer: "用 items() 取得成對的鍵和值，再以兩個名稱分別接住。"
practice:
  - id: fd-python-05-mapping-p1
    title: "做一份依類別點名的小報表"
    kind: code
    minutes: 11
    steps:
      - "存 count_tags.py，先替每個標籤在紙上畫一道記號。"
      - "在輸入尾端加上 lab、rest，再跑一次並核對。"
      - "讓輸入暫時變空，確認沒有憑空出現任何類別列。"
    checks:
      - "新增後 read 與 lab 各 2 筆、rest 一筆。"
      - "相同類別只印一列，筆數加起來等於 5。"
---

## 為什麼要學：該累加的是類別，不是整份總數

今天讀書、實作、再讀書。上一堂的加總能回答共有 3 筆，卻回答不了「讀書占了幾筆」。如果每來一筆就添一個格子，你還得把同類重新整理。比較像點餐的方法，是在紙上每種品項只寫一次名字，再往那一列畫一道記號。字典（dictionary，型別名為 dict）就是用名稱找到要更新的那一格。

## 核心概念：用鍵找值，不用猜它排第幾個

字典把鍵（key）和值（value）配成對。用 `{}` 建立空字典；`{'read': 2}` 則已有一對，冒號左側是類別，右側是筆數。`counts['read']` 依鍵讀值，放在等號左邊則是寫值。同一個鍵不會自己長出第二列，重新指定時它的目前值就會被取代。

鍵要能穩定辨認項目。此處用不會在原處改變的字串當鍵，整數也常見；可以任意增刪的串列不能直接當鍵。別選「目前筆數」當類別的身分，不同類別可能都剛好有 1 筆。題目若改成按日期統計，才應換成日期標記當鍵，筆數仍然放值的那一側。

## 範例：新類別和舊類別走同一條路

開啟 `C:\dev\stackway-lab\python-basics`，將範例另存為 `count_tags.py`。同一個標籤再出現時，先猜字典會多一個鍵還是改掉原有的值。用鍵數和次數兩種結果核對。

在該目錄執行：Windows PowerShell 用 `py count_tags.py`；macOS／Linux 用 `python3 count_tags.py`。

```python
tags = ['read', 'lab', 'read']
counts = {}
for tag in tags:
    old = counts.get(tag, 0)
    counts[tag] = old + 1
for tag, count in counts.items():
    print(f'{tag}: {count}')
```

第一次看到閱讀，字典沒有這個鍵。`get` 在找不到時只交回你指定的 0，不會立刻寫入。下一行才把 0 加一寫回，於是字典真的有了一筆。第三次走訪再看到閱讀時，原值已是一，這一輪寫回 2。結果有 2 列，不是 3 列，2 列的值加起來才是 3 筆輸入。

第二個迴圈裡的 `items()` 交出一對一對的資料；逗號左邊的名稱接類別，右邊接筆數。這和單獨走訪字典、只拿到鍵不同。如果只要查一個不存在的類別，直接用方括號讀可能出現 `KeyError`；有意把未見過的類別當 0 時，才使用明確的預設值，而不是假定所有缺失資料都等於 0。

## 常見錯誤：每次遇到就寫一，不叫計數

兩次閱讀最後仍是一，先查是否直接指定一而沒讀舊值。若明明是同類卻印 2 列，檢查拼字、大小寫和前後空白。字典按照你實際給的鍵分組，不知道兩種叫法對人來說意思相同；有統一需求時，要先決定整理規則，再用[〈字串與字串方法〉](#/lesson/fd-python-04-strmethods)中的工具清理，不能讓程式自行猜測。

換成所有標籤都相同的紀錄。字典應只保留一個鍵，但它對應的次數應反映全部紀錄；這比只檢查有沒有那個鍵更嚴格。

## 小結：用總筆數替分類報表驗收

保留原來的標籤串列與輸出的字典，數一數各列加總是否等於輸入筆數，再點查一個重複類別是否正確。只核對總和還不夠：兩列互相記錯可能剛好抵銷，挑一列與手上的點名記號比對才能抓到。
