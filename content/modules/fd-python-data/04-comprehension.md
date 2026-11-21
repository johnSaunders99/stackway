---
id: fd-python-data-04-comprehension
module: fd-python-data
order: 4
title: 推導式與篩選
subtitle: 只保留有時數的紀錄
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-data-03-sets
objectives:
  - 把明確的迴圈改寫成串列推導式
  - 對相同輸入比較轉換與篩選的順序
tags:
  - python-data
  - comprehension
resources:
  - title: Python 教學：資料結構
    url: https://docs.python.org/zh-tw/3/tutorial/datastructures.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-data-04-order
    prompt: "含 if 的串列推導式對每筆資料的處理順序是什麼？"
    answer: "取一項、測條件、通過才計算輸出。"
    mcq:
      question: "推導式 [m / 60 for m in minutes if m > 0] 如何處理每一筆資料？"
      options:
        - "取項目再篩選再轉換"
        - "先轉換為小時，再對小時檢查條件"
        - "先轉換全部紀錄，再以原分鐘逐一篩選"
        - "不先測條件，每筆都輸出一個項目"
      answer: 0
      explain: "寫在左端的輸出式只有通過條件才會計算。"
    interview:
      question: "把迴圈改成推導式後，你怎麼證明沒改到規則？"
      points:
        - "同一份輸入跑兩種寫法"
        - "比較順序數量與數值"
        - "加入門檻和重複紀錄"
      answer: "我先保留原迴圈當對照，用同一份資料比較整個串列，不能只比總和。我會加一筆剛好到門檻的和兩筆相同的，確認沒有漏掉等號或去重。"
  - id: fd-python-data-04-count
    prompt: "把不合格項目換成 0，和篩掉它有何差異？"
    answer: "換成 0 仍佔一項，篩掉則不產生該項。"
    mcq:
      question: "未出席的紀錄若改填 0，而不是從串列篩掉，結果有什麼差別？"
      options:
        - "兩者都減少筆數"
        - "兩者都保留筆數"
        - "換成 0 會自動去重"
        - "只有篩掉會省去該項"
      answer: 3
      explain: "不該出席的紀錄若留 0，答案長度與後續平均都可能不同。"
  - id: fd-python-data-04-boundary
    prompt: "要驗證至少 30 分鐘的邊界，哪組最有判別力？"
    answer: "用 29 與 30，確認剛好到門檻會通過。"
    mcq:
      question: "哪組能區分大於與大於等於 30？"
      options:
        - "60 與 90"
        - "0 與負數"
        - "29 與 30"
        - "2 筆 120"
      answer: 2
      explain: "只有包含門檻本身的測例能驗出等號差異。"
practice:
  - id: fd-python-data-04-p1
    title: "保存兩種等價的時數整理腳本"
    kind: code
    minutes: 13
    steps:
      - "執行 hours.py，核對兩份時數和來源。"
      - "改成至少 30 分鐘並加入 29 與 30。"
      - "刻意讓一邊少寫等號，看到差異後修正並存檔。"
    checks:
      - "兩份結果最初都是 0.5、1.5、0.5 小時。"
      - "錯誤條件能使 same 變成 False。"
      - "修正後 same 回到 True 且重複出席仍保留。"
---

## 為什麼要學

三段課程紀錄寫的是分鐘數，0 表示未出席，負數是待修正的錯值。現在要做一份出席時數清單：只收大於 0 的紀錄，再把分鐘換成小時。用迴圈逐步寫出來沒有錯；串列推導式（list comprehension）是同一種工作的緊湊寫法。今天不是比誰寫得最短，而是要能用兩份結果逐項證明：換了寫法，並沒有偷偷改掉「哪些算出席」。

## 核心概念

先用平常的做法想：準備空的答案串列，依序取一筆資料，判斷是否合格，合格才計算要存進去的值。把這三個位置放進推導式，就是 `[輸出運算式 for 項目 in 來源 if 條件]`。左邊第一段寫在最前面，卻不是最先執行；先取項目，再檢查後面的條件，通過才算最前面的輸出。沒有篩選時可以省略整段條件，每筆都會產生一個結果。

篩選（filter）決定一筆紀錄要不要進答案，轉換（transform）決定它進去時長什麼樣。本例的門檻用原本的分鐘數，輸出才換小時。若需求改成「至少半小時」，原單位的門檻是 30 分鐘，不是 0.5 分鐘；寫法可以縮短，單位卻不會自動變對。推導式保留來源被走訪的先後，也不會因為兩個結果相同就自行去重。

## 範例：讓 2 種寫法互相驗收

在 `C:\dev\stackway-lab\python-data` 存成 `hours.py`，於該目錄用 PowerShell 執行 `py hours.py`；macOS 或 Linux 用 `python3 hours.py`。先用手算列出該留下的分鐘，再轉換成時數。

```python
minutes = [0, 30, -5, 90, 30]
by_loop = []
for m in minutes:
    if m > 0:
        by_loop.append(m / 60)

by_rule = [m / 60 for m in minutes if m > 0]
print(by_loop)
print(by_rule)
print("same", by_loop == by_rule)
print("source", minutes)
```

輸出應是半小時、一個半小時、半小時，兩種寫法完全相同。最後又印出來源，讓你看到這不是把分鐘串列就地改寫成時數。重複的半小時很重要，因為它代表 2 次各自有效的出席；若先轉成集合才處理，雖然值看似「更整齊」，次數卻少了。

把條件改為 `m >= 30`，在來源加入 29 與 30，兩個版本都改後再比較；剛好踩到門檻的紀錄要留下，差 1 分鐘的要排除。接著只把其中一份條件改成嚴格大於，看看比較是否能抓到錯誤。這比永遠只檢查「答案看起來差不多」強，因為你有意準備了一筆能讓兩個規則產生不同答案的資料。

## 常見錯誤

把不合格資料輸出為 0，不等於篩掉它：前者保留原本筆數，後者不為那筆建立項目。若業務要完整呈現缺席紀錄，就不該沿用本例的篩選；需求不同，串列長度本來就會不同。當驗證或記錄錯誤原因變成好幾個步驟，保留展開的迴圈通常更容易讀，別為了「像熟手」把每個動作硬塞進同一行。

先用自然語言讀出「從哪裡取、留下什麼、每筆變成什麼」。一旦說不清楚，改回普通迴圈會比硬擠成一行更容易核對。

## 小結

讀推導式先看來源，再看條件，最後回頭讀輸出。留下一份用普通迴圈當對照的腳本；以後把長寫法整理成短寫法時，你就有辦法證明整理的是表達方式，不是規則本身。
