---
id: fd-cli-03-pipes
module: fd-cli
order: 3
title: PowerShell 管線
subtitle: 把一串檔名縮成一個答案
status: ready
minutes: 25
level: 1
prereqs:
  - fd-cli-02-copy
objectives:
  - 把列出的物件交給篩選指令
  - 預測改變篩選條件後的筆數
tags:
  - cli
  - pipeline
resources:
  - title: "Microsoft Learn：PowerShell 管線如何傳遞物件"
    url: https://learn.microsoft.com/en-us/powershell/scripting/learn/ps101/04-pipelines
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: "看列出、篩選與顯示三個階段。"
concepts:
  - id: fd-cli-03-pipes-object
    prompt: "PowerShell 的檔案物件與印在畫面上的檔名差在哪裡？"
    answer: "物件可以分別讀取名稱、副檔名與長度，不必從畫面文字猜欄位。"
    mcq:
      question: "要依副檔名挑檔，哪個欄位直接回答問題？"
      options:
        - "Length"
        - "DirectoryName"
        - "LastWriteTime"
        - "Extension"
      answer: 3
      explain: "長度、目錄與時間都不是檔案最後的副檔名。"
  - id: fd-cli-03-pipes-filter
    prompt: "Where-Object 留下哪些物件？"
    answer: "只留下符合條件的輸入物件；不會搬動或刪除磁碟上的其他檔案。"
    mcq:
      question: "篩選前有 3 檔，其中 2 檔是 .txt，篩選後磁碟剩幾檔？"
      options:
        - "3 檔"
        - "2 檔"
        - "一檔"
        - "0 檔"
      answer: 0
      explain: "變少的是流向下一段的物件，不是硬碟上的檔案。"
  - id: fd-cli-03-pipes-measure
    prompt: "想知道符合條件的檔案數，計數應放在哪裡？"
    answer: "在列出與篩選之後才計數，否則得到的是未篩選的總數。"
practice:
  - id: fd-cli-03-pipes-p1
    title: "做一張三種副檔名的計數單"
    kind: hands-on
    minutes: 10
    steps:
      - "建立本堂指定的三個檔案，先用紙寫下 txt、md、csv 的預測筆數。"
      - "從列檔開始，每次多接一段，核對篩選後的檔名與最後的 Count。"
      - "換另兩個條件，把實測數填在預測旁。"
    checks:
      - "結果依序是 2、1、0，各有對應的篩選條件。"
      - "最後重新列檔，三個檔名都還在。"
---

## 為什麼要學：要的是筆數，不是 3 頁檔名

你要回答「練習資料夾裡有幾份文字紀錄」，不是要把每一份的內容都看過一遍。只有三個檔案時可以用手指數，換成 300 個就容易重複或漏掉。先讓電腦列出候選，再挑出符合條件的檔案，最後才數。每一段都能獨立看結果，猜錯時也就知道該從哪一段修正。

## 核心概念：管線左側交出什麼，右側就接到什麼

在 PowerShell，管線（pipeline）的符號是直線 `|`。許多內建指令交給下一段的是物件（object），不是畫面已排好欄位的字串。一個檔案物件帶有可分開讀的屬性，例如 `Name` 是檔名，`Extension` 是含開頭句點的副檔名。畫面沒印出某個屬性，不代表物件裡沒有它。

`Where-Object` 逐筆判斷要不要讓物件通過。這裡用的是「屬性、比較方式、要比的值」的短寫法：`Extension -eq '.txt'` 讀作「副檔名等於點加上 txt」。如果我們數的是檔案，就先用 `-File` 排除資料夾；一個恰巧叫 `old.txt` 的資料夾，不該被當成一份文字紀錄。

## 範例：先看成員，再相信總數

在練習區新建空目錄 `pipe-room`。用編輯器新增 `plan.txt`、`done.txt`、`notes.md`，內容各寫一個字即可；開啟副檔名顯示，以免最後一份實際成了 `notes.md.txt`。下面每一行都是完整的查詢，在 PowerShell 逐行執行，觀察每次少了什麼。

```powershell
Set-Location -LiteralPath 'C:\dev\stackway-lab\pipe-room'
Get-ChildItem -File
Get-ChildItem -File | Where-Object Extension -eq '.txt'
Get-ChildItem -File | Where-Object Extension -eq '.txt' | Measure-Object
```

第一行查詢的成員有 3 個。第二行應只看到 2 個以 txt 結尾的檔名。第三行的 `Measure-Object` 把通過的物件計數；看 `Count` 的值 2，不要把終端機輸出的行數算進去，欄位標題也會占一行。現在把條件改成 `'.md'`，先用手指出剩下哪個檔案，再執行最後一行。改成 `'.csv'` 時應為 0，原本三份檔案並沒有消失。

### 碰到 2 個句點的檔名怎麼算？

在紙上另外寫一份 `week.txt.md`，不必真的改目錄。它的名字中間雖然有文字檔的記號，但最後的副檔名是 `.md`，原來的文字檔筆數不會增加。如果需求其實是「名稱的任何地方只要出現這幾個字都算」，要問的就不再是副檔名是否相等。先把口頭問題講精確，再挑屬性；不要調到剛好印出想要的數字就算完成。

## 常見錯誤：有答案，答的卻是另一個問題

若一開始不經篩選就計數，3 是正確數字，卻是全部檔案的總數。也別把 `Name` 等於 `'.txt'` 當成副檔名條件；完整檔名是 `plan.txt`，並不等於 `.txt`。遇到 0 筆，先退回列出全部成員，看所在位置和真實檔名，再檢查句點是否遺漏，而不是新建一批檔案湊數。

可以把管線截在篩選之後執行一次：先看留下的項目，再接上計數，就知道數字的分母是哪批檔案。

## 小結：讓中間結果有地方停

讀一道管線時，用動詞分成「列出、挑選、計數」。如果將來有人改問有幾份筆記，只需要改挑選條件，不必改列檔或計數的方式。留在紙上的三組預測，就是下一次修改條件時可以立即對照的小測資。
