---
id: fd-demo-02-paths
module: fd-demo
order: 2
title: 你現在站在哪個目錄？
status: ready
minutes: 20
level: 1
prereqs: [fd-demo-01-files]
objectives:
  - 讀出目前位置
  - 預測相對路徑的終點
tags:
  - 路徑
  - PowerShell
resources:
  - title: 查看目前的位置
    url: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-location?view=powershell-7.5
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: 2026-11-20
concepts:
  - id: paths-cwd
    prompt: 工作目錄有什麼用？
    answer: 它是解讀相對路徑的起點。
    mcq:
      question: 同一條相對路徑指到不同檔案，先比對什麼？
      options:
        - 工作目錄
        - 字型大小
        - 視窗顏色
      answer: 0
      explain: 它是解讀相對路徑的起點。
    interview:
      question: 兩個視窗找不到同一份檔案，怎麼查？
      points:
        - 比較工作目錄
        - 從各自起點走過相對路徑
      answer: 它是解讀相對路徑的起點。
  - id: paths-parent
    prompt: 路徑中的兩個點代表什麼？
    answer: 兩個點代表上一層目錄，不是前一次開過的目錄。
    mcq:
      question: 目前在 study/notes，上一層是哪裡？
      options:
        - notes
        - study
        - 最近去過的位置
      answer: 1
      explain: 兩個點代表上一層目錄，不是前一次開過的目錄。
  - id: paths-list
    prompt: 列出內容與切換目錄有什麼差異？
    answer: 列出內容只查看其中項目；切換才改變工作目錄。
    mcq:
      question: 哪個 PowerShell 指令只是查看項目？
      options:
        - Get-ChildItem
        - Set-Location
        - 重新命名
      answer: 0
      explain: 列出內容只查看其中項目；切換才改變工作目錄。
practice:
  - id: fd-demo-02-paths-p1
    title: 用兩個位置比較同一個名稱
    kind: hands-on
    minutes: 5
    steps:
      - 在 study 資料夾的空白處開啟終端機。
      - 輸入 Get-Location，再輸入 Get-ChildItem。
      - 輸入 Set-Location ..，再比較兩次的位置。
    checks:
      - 能指出剛才的起點
      - 能說明兩個點帶我去了哪裡
---
## 為什麼要學：給電腦一個地址
你知道筆記在自己的資料夾裡，程式卻不懂「就是剛剛那個」。要讓它找到檔案，必須交代一條路。路徑 (path) 就是一連串位置。讀路徑像讀方向說明：先找到起點，再依序走過每一段。
## 核心概念：起點決定終點
終端機 (terminal) 是可以打字下指令的視窗。PowerShell 是理解指令的程式。它隨時有一個工作目錄，也就是目前站的位置。相對路徑 (relative path) 從這裡出發；絕對路徑則從固定的根位置出發，不依賴你目前站在哪裡。
### 兩個點代表上一層
假設你站在 study 裡的 notes 資料夾，上一層就是 study。切換到上一層不會刪除或搬移任何檔案；改變的是後續指令的起點。它也不是瀏覽器的上一頁，而是目錄結構裡上一層的位置。
## 範例：先看位置，再看內容
在自己建立的練習目錄開啟終端機。一次輸入一行，按 Enter，讀完結果再輸入下一行。第一行問「我在哪裡」，第二行問「這裡有哪些東西」。
```powershell
Get-Location
Get-ChildItem
```
在 macOS 或 Linux 的 bash，可以分別輸入下面兩行，回答相同的兩個問題。
```bash
pwd
ls
```
### 預測下一次的清單
先別執行新指令。把紙分成左右兩欄，左邊畫出裝筆記的資料夾，右邊畫出它的上一層。若你要找的是筆記本身，在哪一邊列出內容會直接看見檔名？哪一邊只會看見裝筆記的資料夾？預測完才切換位置，並比較兩次清單。這個過程會把「目前站的位置」從抽象名詞變成能查證的條件。要回到原來的位置，也可以從檔案總管再次開啟該資料夾的終端機。
## 常見錯誤：把畫面清單當成搬移
列出一個資料夾的內容，不會把你送進那個資料夾。若你預期看到筆記，卻只看到裝著它的資料夾，請先對照目前位置，而不是立刻重建同名檔案。名稱含空白時，用一對引號包住整段路徑，才不會被當成分開的參數。
## 小結
你現在有一個便宜又安全的檢查方式：先問位置，再列出內容。看到找不到檔案的訊息，先沿著這兩步確認起點，很多時候並不是檔案消失了。
