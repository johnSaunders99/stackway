---
id: fd-python-05-fstrings
module: fd-python
order: 5
title: f-string 格式化
subtitle: 讓摘要同時印出堂數與時間
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-04-strmethods
objectives:
  - 用大括號把變數嵌入文字
  - 指定小數位數並分辨顯示格式與原始數值
tags:
  - python
  - fstrings
resources:
  - title: "Python 教學：格式化字串常值"
    url: https://docs.python.org/zh-tw/3/tutorial/inputoutput.html
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-05-fstrings-braces
    prompt: "f-string 裡大括號內外各怎麼處理？"
    answer: "大括號內求值後插入結果，括號外是要保留的文字；要在引號前加 f。"
    mcq:
      question: "要讓堂數跟著 lessons 改變，哪個寫法正確？"
      options:
        - "'{lessons} 堂'"
        - "f'{lessons} 堂'"
        - "f'lessons 堂'"
        - "'lessons 堂'"
      answer: 1
      explain: "少了 f 或大括號，名稱就只是一般文字。"
  - id: fd-python-05-fstrings-precision
    prompt: "格式 .1f 的一代表什麼？"
    answer: "以小數表示並顯示小數點後一位；只影響這次產生的文字。"
    mcq:
      question: "值是 6.25，哪個格式一定顯示 2 位小數？"
      options:
        - ".1f"
        - ".0f"
        - ".2f"
        - ".3f"
      answer: 2
      explain: "小數點後的數字指定顯示位數，並非總位數。"
  - id: fd-python-05-fstrings-numeric
    prompt: "為什麼不把格式化的顯示文字拿回去接著算？"
    answer: "f-string 的結果是字串，單位與四捨五入後的顯示不等於原始數值。"
    interview:
      question: "摘要只想顯示一位小數，後續還要用精準的平均值，怎麼安排？"
      points:
        - "保留數值變數"
        - "在顯示時指定格式"
        - "檢查原值與顯示文字"
      answer: "我保留除法得到的數值，只在印出摘要時用 .1f。測試時我會另印一次未格式化的數值，確定不是先截短資料再做後續計算。"
practice:
  - id: fd-python-05-fstrings-p1
    title: "留兩種顯示精度的摘要"
    kind: code
    minutes: 8
    steps:
      - "存好 summary_line.py，圈出固定文字和會改變的欄位。"
      - "將 .1f 改成 .2f，其他不動，對比兩份輸出。"
      - "改成 2 堂共 17 分鐘，再用紙筆驗算。"
    checks:
      - "2 堂 17 分鐘的摘要可顯示 8.50，原值仍為 8.5。"
      - "更動堂數後，輸出不會殘留寫死的 3 堂。"
---

## 為什麼要學：讓數字和單位各站對位置

你想印出一條紀錄：「3 堂課，共 20 分鐘，每堂約 6.7 分鐘。」上一堂可以用加號把兩段文字接起來，但堂數是整數，平均是小數，單位又是文字。若把整句結果手打進去，只要堂數一改就得重寫。比較好的做法是保留一個句子的骨架，把需要計算的數字放進特定位置。

## 核心概念：大括號裡是運算，外面是說明

格式化字串（f-string）在開頭的引號前加英文字母 `f`。一般文字照原樣保留，大括號內可以放變數或運算式（expression），也就是能算出一個值的片段。讀到右大括號時就回到固定文字，所以單位通常放在括號外。自己試著用手遮住括號內的東西，剩下的就是這次報表不隨資料變動的部分。

除法符號 `/` 在這裡算出浮點數。你若要顯示一位小數，可在大括號內的名稱後加上 `:.1f`；冒號分開要顯示的值和格式，點號後的數字指定小數位數，最後的 `f` 表示定點小數格式。開頭引號前的 `f` 和這裡的 `f` 位置不同，作用也不同。格式不會偷偷替原始變數指定新值。

## 範例：同一份平均值有 2 種讀者

分開預測算出的平均值和摘要顯示的小數位數。改顯示格式後，哪個值不該跟著改變？把下面的範例存成 `C:\dev\stackway-lab\python-basics` 裡的 `summary_line.py`。

在該目錄執行：Windows PowerShell 用 `py summary_line.py`；macOS／Linux 用 `python3 summary_line.py`。

```python
lessons = 3
minutes = 20
average = minutes / lessons
line = f'{lessons} 堂，共 {minutes} 分鐘，平均 {average:.1f} 分鐘'
print(line)
print(average)
```

給人看的那一行應出現3 堂、20 與 6.7；下一行是直譯器顯示的原始計算結果，會有更多小數位。改成 2 位小數時，顯示變成 6.67，原值那行沒有跟著改。這兩行不是互相矛盾，一行是閱讀用摘要，一行用來檢查參與計算的數值。

想像把 20 分鐘平均分給 4 堂，原本就是整整 5 分鐘。如果要求 2 位小數，畫面仍會補上 2 個 0。這對一整排要對照的平均值很有用，但不能據此推論系統多測到了兩位精度。若真的要再求總和，使用分鐘數或未格式化的平均，不要從有單位的句子拆數字回來。

## 常見錯誤：畫面印出一對大括號

如果得到的是 `{lessons}` 而不是 3，先找最前面的引號旁是否有 `f`。若只有數字沒有單位，檢查單位是否誤放在大括號內當成程式。再來看你拿去執行下一次運算的是 `average` 還是 `line`；後者即使看起來有數字，仍是整句文字，不是可以繼續除的平均值。

把同一個平均值放進兩種精度的摘要，並排讀給別人聽。顯示位數改變可以影響讀者的判斷，卻不會改變程式下一步拿去運算的值。

## 小結：把精度決定留在顯示的最後一步

先算，再排版。用一筆不能整除和一筆剛好整除的資料測試：兩者都要有合適的位數，改格式時都不能改掉來源數字。這樣一條摘要既好讀，又保留了之後重新計算的可能。
