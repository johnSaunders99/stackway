---
id: fd-python-03-branch
module: fd-python
order: 8
title: if、elif 與 else
subtitle: 幫空白輸入留一條路
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-07-bool
objectives:
  - 以低於、等於及高於門檻的輸入逐步追蹤 if、elif、else
  - 將文字轉成數字後再比較
  - 以兩組輸入驗證 if 的兩條路徑
tags:
  - python
  - condition
resources:
  - title: "Python 教學：if 陳述式與縮排"
    url: https://docs.python.org/zh-tw/3/tutorial/controlflow.html
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-03-branch-order
    prompt: "同一串 if、elif 有多個條件為真時執行哪一段？"
    answer: "從上往下選第一個為真的分支，其後同串分支不再執行。"
    mcq:
      question: "若先測 n >= 30，後測 n == 30，輸入 30 會走哪邊？"
      options:
        - "第一個條件"
        - "第二個條件"
        - "兩個條件都執行"
        - "直接進 else"
      answer: 0
      explain: "第一個已包含等於，後面的等於分支不會有機會。"
  - id: fd-python-03-branch-guard
    prompt: "為何先判斷去空白後是否為空，再做 int 轉換？"
    answer: "沒有填值時應走另一條路，避免在決定之前就對空字串做無效轉換。"
    mcq:
      question: "只按 Enter 時，在哪裡呼叫 int 才能避開錯誤？"
      options:
        - "input 之前"
        - "非空分支裡"
        - "空白檢查之前"
        - "空白分支的第一行"
      answer: 1
      explain: "只有非空才嘗試轉；這仍不保證任意文字都是整數。"
    interview:
      question: "讓空白代表略過，還要分辨剛好達標，你會怎麼驗證？"
      points:
        - "先去空白並處理略過"
        - "非空且按約定為整數才轉換"
        - "測 30 及兩側與空輸入"
      answer: "我會先讓空字串離開數字流程；對約定的整數再分低於、等於、高於 30。我至少各試 29、30、31 和空白；不能說這樣已經處理了亂打字母的情形。"
  - id: fd-python-03-branch-indent
    prompt: "Python 怎麼知道哪幾行屬於同一個分支？"
    answer: "冒號引出一組敘述，下一層一致的縮排決定區塊範圍；退回原層就離開。"
practice:
  - id: fd-python-03-branch-p1
    title: "留四張分支收據"
    kind: code
    minutes: 10
    steps:
      - "存 classify_minutes.py，各跑一次空白、29、30、31。"
      - "每次寫出走過的比較與唯一印出的結果。"
      - "把第一個數值比較暫改成 <=，用 30 檢查差異後還原。"
    checks:
      - "四次依序得到略過、未滿、剛好、超過。"
      - "我能說出改為 <= 為何讓剛好那一段被前面攔走。"
---

## 為什麼要學：沒填不是 0，剛好也不是超過

同一份簽到表可能有人按 Enter 略過，有人剛好練了 30 分鐘，也有人多練了一點。上一堂可以算出「達標嗎」的答案，但顯示給人的回覆還是要依情況選。條件分支（conditional branch）就是讓電腦在幾段程式之間選一段，而不是把每一種情況的文字全部印出來。

## 核心概念：問第 1 題、補問、最後接住剩下的人

`if` 後接一個真假條件，末尾加冒號；成立就執行下一層縮排的程式。`elif` 表示「前面都沒選到，再問這個條件」，`else` 不加條件，接住這一串中剩下的情況。屬於同一串的關鍵字要對齊，區塊內通常縮排 4 個空格。把程式往右排不是單純好看，縮排直接決定何時執行。

這裡有兩層決定。外層先問是否真的有輸入，內層才分分鐘數高低。先前的 `strip` 可以把只有空格的回覆整理成空字串。注意題目的範圍：本例接受空白或非負整數文字，不是要處理所有能在鍵盤打出的內容。不要把「不是空白」誤讀成「保證是有效數字」。

## 範例：跟著一筆資料走，不要同時追 4 條路

把落在門檻兩側與剛好等於門檻的輸入各列一筆。逐條檢查哪個條件先成立，不用等整段執行完才猜分類。把下面的範例存成 `C:\dev\stackway-lab\python-basics` 裡的 `classify_minutes.py`。

在該目錄執行：Windows PowerShell 用 `py classify_minutes.py`；macOS／Linux 用 `python3 classify_minutes.py`。

```python
raw = input('分鐘（留空略過）：').strip()
if raw == '':
    print('略過')
else:
    minutes = int(raw)
    if minutes < 30:
        print('未滿')
    elif minutes == 30:
        print('剛好')
    else:
        print('超過')
```

直接按 Enter，外層第一個區塊就完成工作，整數轉換不會執行。輸入 29 時，外層走到非空那邊，內層第一個比較成立。30 的路最值得手算：先確認不是空字串，轉成整數，小於 30 為假，等於 30 為真，於是只印「剛好」。31 則兩次比較都沒通過，由內層最後一段接住。

用紙遮住沒走的區塊，把看得到的敘述從上讀到下。如果把內層第一個比較放寬成小於等於，30 在第一站就被攔下來，即使第二站寫得完全正確，也永遠輪不到它處理 30。這不是漏印一行文字，而是規則的涵蓋範圍重疊，排序讓後一個失去機會。

## 常見錯誤：先轉數字，再想起要檢查空白

若把轉換移到整段最前面，空白測資會先產生錯誤，後面再周全的分支也救不回來。另有一種常見錯誤，是把內層最後的 `else` 對齊外層；先畫兩個決策框，看看它究竟在回答哪一道問題。測試時別只挑一定超過的大數，否則兩種錯誤都可能被藏起來。

把條件從上到下念一遍，碰到第一個成立的就停止。如果先寫最寬鬆的條件，後面較窄的分支還走得到嗎？

## 小結：一條輸入路線，配一張輸出收據

每跑一筆就記「原始文字、碰到哪些判斷、最後一句話」，而不是靠螢幕上曾經看過四種訊息就說測完。四張收據放一起，你能指出空白為什麼不用轉，以及等於門檻為什麼沒有被算成超過。
