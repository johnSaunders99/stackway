---
id: fd-python-data-01-slice
module: fd-python-data
order: 1
title: 串列切片與複製
subtitle: 抽出最近三筆而不改原稿
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 用起點、終點、步長取得子串列
  - 比較切片複製與指向同一串列的差別
tags:
  - python-data
  - slice
resources:
  - title: Python 教學：串列與切片
    url: https://docs.python.org/zh-tw/3/tutorial/introduction.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Python 教學：資料結構
    url: https://docs.python.org/zh-tw/3/tutorial/datastructures.html
    kind: doc
    lang: zh-Hant
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-data-01-bounds
    prompt: "往右切片 [1:4] 會取哪些索引？"
    answer: "取一、2、3，不包含 4。"
    mcq:
      question: "5 筆資料使用 [1:4] 的結果包含哪些位置？"
      options:
        - "1、2、3、4"
        - "1、2、3"
        - "0、1、2"
        - "2、3、4"
      answer: 1
      explain: "起點包含、終點排除，相鄰區間才不會重疊。"
    interview:
      question: "怎麼確認截取最近 3 筆後的試算不會改原稿？"
      points:
        - "確認是否建立新外層"
        - "改一格並對照原稿"
        - "區分替換外層與修改內層"
      answer: "若每筆是分鐘整數，我用切片取 3 筆，替換一格再印出原稿核對。如果每筆改成小串列，我會再看是否修改到共用的內層，不能只說有切片就安全。"
  - id: fd-python-data-01-tail
    prompt: "2 筆資料使用 [-3:] 會怎樣？"
    answer: "得到含原有 2 筆的新串列，不補值。"
    mcq:
      question: "只有 2 筆的普通串列使用 [-3:] 取最近 3 筆，結果為何？"
      options:
        - "取現有 2 筆"
        - "補一個 0"
        - "一定出現索引錯誤"
        - "回傳最後一筆數字"
      answer: 0
      explain: "切片會配合實際範圍，不檢查業務所需最少筆數。"
  - id: fd-python-data-01-alias
    prompt: "b = a 與 b = a[:] 對外層串列的差別是什麼？"
    answer: "前者共用外層，後者建立新外層但仍引用原項目。"
    mcq:
      question: "a 是普通串列，b = a 與 b = a[:] 對最外層容器有何差異？"
      options:
        - "兩者都複製所有內層"
        - "兩者都只是別名"
        - "等號會產生新的外層"
        - "只有切片建立新外層"
      answer: 3
      explain: "列印值相同不能證明是否同一容器。"
practice:
  - id: fd-python-data-01-p1
    title: "保留原稿與試算的對照腳本"
    kind: code
    minutes: 10
    steps:
      - "存好 slice_days.py，先預測三組數字再執行。"
      - "把最近 3 筆的輸入改成 2 筆，單獨測切片結果。"
      - "在檔尾註解寫出別名與切片改值的差異。"
    checks:
      - "試算有 99，原稿第三格仍是 24。"
      - "步長 2 得到 18 與 30。"
      - "別名改值後原稿第一格變 7。"
---

## 為什麼要學

一份步行紀錄有 5 天的分鐘數。你想在報表只放最近 3 天，還想暫時把其中一天改成估計值。若直接改原串列，原始紀錄也被改了；若逐筆抄寫，今天 5 筆勉強可行，下次 500 筆就很難核對。串列切片（list slicing）讓你用位置描述一段資料，也讓我們分清兩件事：取出一段新串列，與替原來的串列再取一個名字。

## 核心概念

`資料[起點:終點:步長]` 是切片的讀法。索引（index）由 0 開始，正常向右走時包含起點、不包含終點。把它想成兩個項目之間的界線：從第一條選定的界線取到下一條選定的界線之前。這使前後相鄰的兩段能無縫接在一起，不會重複抄到同一個項目。步長省略就是每次前進一格；寫 2 就每隔一個選一個。負索引從尾端倒數，最後一筆是負一。

若往右取而省略終點，就一路取到最後；`[-3:]` 比你先算總筆數再寫兩個索引直觀。切片遇到短串列會取到實際有的範圍，不會補出不存在的紀錄。這和直接以單一索引存取不存在的項目不同。`[:]` 產生新的外層串列，叫淺複製（shallow copy）；單純用等號指定給另一個名稱則沒有建立新容器。兩個變數列印時一模一樣，不代表修改其中之一的效果相同。

## 範例：5 天抄 3 天，不碰原稿

在 `C:\dev\stackway-lab` 新建 `python-data`，把這段存成其中的 `slice_days.py`。在該目錄開 PowerShell 輸入 `py slice_days.py`；macOS 或 Linux 用 `python3 slice_days.py`。沿用[〈Windows 安裝 Python〉](#/lesson/fd-python-01-interpreter)中已確認能啟動 Python 3 的入口，不必為本課安裝另一版。先在紙上畫 5 格，再跑程式比較。

```python
minutes = [12, 18, 24, 30, 36]
recent = minutes[-3:]
recent[0] = 99
print(recent)
print(minutes)
print(minutes[1:5:2])

alias = minutes
alias[0] = 7
print(minutes[0])
print(minutes[:2] + minutes[2:] == minutes)
```

第一行輸出以 99 開頭，原稿第三格卻仍是 24：修改的是新串列中的位置。間隔取樣則從索引 1 開始收 18，接著跳到 3 收 30，到 5 就停。後面的別名（alias）反而使原稿第一格變成 7，因為兩個名字指向同一個串列。最後把索引 2 當作相鄰的切點，拼回來必須與當前原稿相等；若終點也算在內，就會重複一項。

再把最近 3 天的步驟套到只有 2 筆、甚至空的串列，先寫下你預期會有幾筆。若需求是「資料不足 3 天就不能出報表」，那是你另外要寫的數量判斷，不是切片會替你保證的事。切片回答的是位置有哪些，並不懂「3 天才算完整」這條業務規則。

## 常見錯誤

想連最後一筆一起取，卻寫負一當終點；那是停在最後一筆之前。也別把淺複製當成連內層都複製了：若外層每格裝的是可修改的小串列，複製後兩份外層仍可能指向同一個小串列。本例每格是整數，替換格子便足以獨立試算。

## 小結

切片先決定範圍，再決定跨幾格；是否保護原稿要看你改的是哪一層。留下腳本與兩種改值後的輸出，下一次看到兩個看似相同的名稱，就能用實驗分辨是否共用容器。
