---
id: fd-python-07-bool
module: fd-python
order: 7
title: 比較與布林運算
subtitle: 30 分鐘剛好算不算達標
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-06-input
objectives:
  - 用大小比較建立布林值
  - 用 and、or、not 檢查邊界資料
tags:
  - python
  - bool
resources:
  - title: "Python 內建型別：比較與布林運算"
    url: https://docs.python.org/zh-tw/3/library/stdtypes.html
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-07-bool-boundary
    prompt: "至少 30 分鐘為何不能只用大於？"
    answer: "大於不含等於，剛好 30 會被排除；至少應使用 >=。"
    mcq:
      question: "哪個值最能區分 minutes > 30 與 minutes >= 30？"
      options:
        - "29"
        - "31"
        - "0"
        - "30"
      answer: 3
      explain: "只有剛好相等時兩式才給不同的答案。"
    interview:
      question: "一個「至少 30 分鐘」的標記常少算一天，你會挑哪些資料？"
      points:
        - "比較 29、30、31"
        - "說明等號決定臨界值"
        - "確認比較的是數字"
      answer: "我會先確認拿到整數，再測門檻兩側以及剛好 30。若只有 30 錯，優先看是否把至少寫成嚴格大於；全都錯就要往資料型別或其他條件查。"
  - id: fd-python-07-bool-and-or
    prompt: "兩項都要與至少一項，分別用什麼運算？"
    answer: "在兩側是布林條件時，and 要兩者都真，or 有一個真即可。"
    mcq:
      question: "有空是真、有筆記是假；哪一式為真？"
      options:
        - "有空 or 有筆記"
        - "有空 and 有筆記"
        - "not 有空"
        - "有筆記 and 有空"
      answer: 0
      explain: "只滿足其中一項，足以通過 or，卻不能通過要求兩項的 and。"
  - id: fd-python-07-bool-not
    prompt: "not 用在一個比較結果前做什麼？"
    answer: "反轉那個條件的真假；用括號說清楚要反轉的範圍。"
practice:
  - id: fd-python-07-bool-p1
    title: "做一張邊界真值卡"
    kind: code
    minutes: 9
    steps:
      - "存 threshold.py，以 29、30、31 分別跑一次，寫下三個布林輸出。"
      - "固定 30，只把有筆記改成 False 再跑。"
      - "用自己的話替三行輸出取名，保留對照。"
    checks:
      - "從 29 到 30 時達標由假變真。"
      - "30 且沒有筆記時，完整紀錄為假、提醒為真。"
---

## 為什麼要學：差一個等號，整天都沒被算進去

訂一個規則：「學滿 30 分鐘就達標；達標而且留了筆記才算完整紀錄。」對於 29 和 31 分鐘，大家通常不會吵架；麻煩的是剛好 30。這一堂不讓程式直接宣布成功或失敗，而是先把規則翻成可以檢查的真假問題，找出是哪個條件決定了答案。

## 核心概念：先問小問題，再把答案接起來

比較（comparison）會產生布林值（boolean），也就是真或假。`>` 只問有沒有超過，`>=` 還包含相等；`==` 比較兩個值是否相等，單等號則是把右側值指定給左側名稱。口頭說「滿」、「至少」、「不低於」時，先想到包含邊界，別只看到「大」就寫一個大於符號。

兩個條件都是真假值時，`and` 表示必須兩邊都成立；`or` 是至少一邊成立，兩邊都成立當然也成立。`not` 則反轉一個判斷。把一個長需求拆成能單獨命名的小問題，通常比一行塞滿符號更容易讀。這裡只讓這些運算接真假條件，不把英文字當作可隨便交換位置的裝飾。

## 範例：達標、完整紀錄與需要提醒

在 `C:\dev\stackway-lab\python-basics` 新建 `threshold.py`。讓分鐘數剛好落在門檻上。先別跑程式，圈出哪個比較符號會把邊界值算進去。

在該目錄執行：Windows PowerShell 用 `py threshold.py`；macOS／Linux 用 `python3 threshold.py`。

```python
minutes = 30
has_note = True
met = minutes >= 30
complete = met and has_note
remind = (not met) or (not has_note)
print(met)
print(complete)
print(remind)
```

原始資料下，3 行應是真、真、假。把分鐘數改成 29，筆記仍在，第一行變假，第二行也變假；最後一行因為尚未達標而變真。換成 31 時又回到達標。現在固定分鐘數為 30，只把有筆記改成假；這次變的是完整與提醒，證明有沒有筆記不該改變「至少 30 分鐘」這個單獨的答案。

在紙上畫兩個小方格，一個代表達標，一個代表有筆記。想像收工前檢查：兩格都打勾才完整，但只要有一格沒勾就要提醒。把「其中一格空著」寫成兩格都沒勾才提醒，會漏掉兩種很常見的情況。先用這個實物比喻說通，再回頭讀程式裡的括號。

## 常見錯誤：只選離門檻很遠的數字

如果只測 5 分鐘和 60 分鐘，嚴格大於與大於等於會給出同樣結果，很容易讓錯誤規則混過去。最好各選門檻前一格、當下和後一格。另外，若分鐘數來自鍵盤，先依上堂轉成整數，再和數字比較；兩段文字比較的是字元順序，不能拿來判斷數量大小。

把是否達到分鐘門檻與是否留下筆記各寫成一欄。固定一欄，每次只翻轉另一欄，就能驗證兩個條件各自的作用；若兩欄同時變了，即使最後答案不同，也無法據此指出是哪個條件造成。

## 小結：把每個真假值接回一句人話

留下三行輸出時，不要只寫「真真假」。在旁邊標成達標、完整、提醒，再說哪個門檻或哪個資料改變了它。下一堂[〈if、elif 與 else〉](#/lesson/fd-python-03-branch)要讓程式根據答案走不同道路，現在先確定問題本身問對了。
