---
id: fd-python-data-02-tuples
module: fd-python-data
order: 2
title: 元組與拆包
subtitle: 把一個座標拆成兩個變數
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-data-01-slice
objectives:
  - 建立不可直接替換項目的 tuple
  - 用拆包取出兩個值並處理長度不符
tags:
  - python-data
  - tuples
resources:
  - title: Python 教學：資料結構
    url: https://docs.python.org/zh-tw/3/tutorial/datastructures.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-data-02-comma
    prompt: "只有 1 個整數 8 的元組怎麼寫？"
    answer: "用 (8,) 保留逗號。"
    mcq:
      question: "何者是單項 tuple？"
      options:
        - "(8)"
        - "[8]"
        - "(8,)"
        - "{8}"
      answer: 2
      explain: "括號包住整數仍是整數，方括號建立串列。"
    interview:
      question: "你如何避免格式有問題的座標悄悄算出錯誤結果？"
      points:
        - "先查欄位數"
        - "按約定順序命名"
        - "用不對稱座標驗方向"
      answer: "我先拒收不是 2 欄的紀錄，印出實際欄數，再按橫、縱順序拆包。我會用 3 與 7 這種不同值測向右移，確認變的真是第一項。"
  - id: fd-python-data-02-arity
    prompt: "x, y = point 未使用星號時，point 有 3 項會如何？"
    answer: "項目太多，拆包會引發 ValueError。"
    mcq:
      question: "3 個值以 x, y = point 拆包，沒有使用星號，會發生什麼事？"
      options:
        - "自動忽略第三項"
        - "引發 ValueError"
        - "把後 2 項合成串列"
        - "把第三項留到下次"
      answer: 1
      explain: "普通拆包要求數量相符，不會自行截斷。"
  - id: fd-python-data-02-immutable
    prompt: "座標平移為什麼建立新元組？"
    answer: "元組的項目不能直接替換，建立新值也能保留舊點。"
    mcq:
      question: "point 是座標元組。要右移一格並保留原點，為何用 (x + 1, y) 建立結果？"
      options:
        - "因為不能直接改原格子"
        - "因為元組不能讀索引"
        - "因為變數不能重新指定"
        - "因為拆包會刪掉原值"
      answer: 0
      explain: "拆包只是取值，不能原地改格子的是元組本身。"
practice:
  - id: fd-python-data-02-p1
    title: "建立可拒收錯誤欄數的座標腳本"
    kind: code
    minutes: 10
    steps:
      - "執行 points.py，標出成功與略過的兩種輸出。"
      - "加入橫縱顛倒的新點，再預測與實測。"
      - "在檔尾留下單項元組的寫法和反例。"
    checks:
      - "原點 3 與 7 平移成 4 與 7，原點仍在。"
      - "過短和過長各印出欄數。"
      - "能用逗號建立只有 1 項的元組。"
---

## 為什麼要學

路線起點是一個座標，第一格是橫向位置、第二格是縱向位置。把一對值當成不可任意增減欄位的一筆資料，通常比用兩個毫無關聯的變數好讀。元組（tuple）適合表達這種有順序的固定組合；拆包（unpacking）則讓你在使用這筆座標時，把兩個位置換成有意義的名稱，而不是一直猜 0 和一代表哪一軸。

## 核心概念

寫 `point = (3, 7)` 會得到含 2 項的元組。真正把項目分組的是逗號；只有 1 項時要寫 `(3,)`，單純括住一個算式，仍然只會得到那個算式的值。元組可用索引取值、用長度查項目數，卻不允許直接把某個位置替換成別的值。需要移到新座標時，可以用算出的新值建另一個元組，再讓名稱指向它，不會改寫先前的那筆資料。

`x, y = point` 是拆包指定，右邊依順序給左邊各 1 個值：第一項交給橫向名稱，第二項交給縱向名稱。名稱本身沒有神奇辨識能力；若輸入順序相反，程式仍可能順利跑完，卻算錯位置。一般未使用星號的拆包要求數量一樣，多一個或少一個都會出現 `ValueError`。這是輸入值不符要求的例外，之後在[〈Python 例外處理〉](#/lesson/fd-python-tools-02-errors)會細講如何接住它。遇到規格是「只收二維座標」的資料，應在拆之前驗長度，別安靜丟掉第三項來假裝每筆都合格。

## 範例：平移合法點，保留拒收原因

在 `C:\dev\stackway-lab\python-data` 新建 `points.py`。在此用 PowerShell 執行 `py points.py`，macOS 或 Linux 則用 `python3 points.py`。輸入刻意同時包含正常、過短與過長的資料。

```python
points = [(3, 7), (8,), (2, 4, 6)]
for point in points:
    if len(point) != 2:
        print("skip", point, "fields", len(point))
        continue
    x, y = point
    moved = (x + 1, y)
    print("from", point, "to", moved)
```

`continue` 表示這輪到此為止、直接處理下一筆。先看第一筆：拆成 3 與 7，只讓第一項加 1，再把結果組成 4 與 7。列印舊點與新點時，兩組同時存在，這是建立新組合而非修改原格子的證據。第二筆只有 8，第三筆多了一個 6，2 筆都要印出被略過以及實際欄位數，不能有 1 筆被當成有效的移動。

再加一筆 `(7, 3)`，預測平移後是 8 與 3 還是 7 與 4。這個測試專門抓順序錯誤：若程式總是得到兩個數字就算通過，將兩個座標互換也會通過。最後單獨比較 `type((8))` 與 `type((8,))` 的輸出，注意括號看起來很像，型別卻不同。這是在日後看到「整數沒有長度」一類問題時，最便宜的檢查。

## 常見錯誤

把不可變（immutable）誤解成變數不能重新指定。名稱可以指向另一個元組，不能做的是直接替換原元組中的項目。反過來說，若元組的一項本身是串列，不能替換這個項目，不等於該串列的內容也永遠不能改。選元組是表達欄位組合的意圖，不是把所有內部資料封成唯讀。

## 小結

用逗號建立固定順序，用具名變數拆開讀，用長度與已知例子驗收形狀和方向。保留能同時接受好資料、說明壞資料為何不合格的小腳本，會比只跑一組漂亮座標更實用。
