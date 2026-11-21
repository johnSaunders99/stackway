---
id: fd-cli-05-errors
module: fd-cli
order: 5
title: 指令錯誤與退出狀態
subtitle: 看懂失敗指令留下的線索
status: ready
minutes: 30
level: 1
prereqs:
  - fd-cli-04-bash
objectives:
  - 分辨找不到指令與找不到檔案
  - 在不提升權限的情況下修正工作目錄
tags:
  - cli
  - stderr
resources:
  - title: "Microsoft Learn：上一個指令的結果與退出碼"
    url: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_automatic_variables
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: "在頁內找 $? 與 $LASTEXITCODE。"
concepts:
  - id: fd-cli-05-errors-which
    prompt: "如何區分找不到指令與找不到輸入檔？"
    answer: "先確認錯誤指的是動作名稱還是傳入的路徑；前者查拼字與工具，後者查位置與檔名。"
    mcq:
      question: "Get-Content 能辨識但找不到 note.txt，先查什麼？"
      options:
        - "重新安裝 PowerShell"
        - "工作目錄與實際檔名"
        - "管理員密碼"
        - "終端機字型"
      answer: 1
      explain: "讀檔指令已經開始執行；失敗的是定位檔案。"
  - id: fd-cli-05-errors-success
    prompt: "PowerShell 的 $? 回答哪一個問題？"
    answer: "剛才那個指令是否成功；應緊接著讀，別先執行另一個指令。"
    mcq:
      question: "要查某次讀檔的成功狀態，應何時讀 $?？"
      options:
        - "列完目錄才讀"
        - "重開分頁再讀"
        - "讀檔之後立刻讀"
        - "任何時候都能還原那次狀態"
      answer: 2
      explain: "中間一次成功的列檔就會改變上一個指令指的是誰。"
  - id: fd-cli-05-errors-exit
    prompt: "$LASTEXITCODE 可以代替所有內建指令的成敗嗎？"
    answer: "不行。對外部程式它保留最近的退出碼，並不會因為每個 PowerShell 內建指令都更新。"
practice:
  - id: fd-cli-05-errors-p1
    title: "寫一張指令失敗的診斷單"
    kind: hands-on
    minutes: 10
    steps:
      - "準備課文的 logs 資料夾與 note.txt，在父目錄先讀一次錯路徑，記下訊息中失敗的對象。"
      - "立即看狀態，對照實際位置後用正確路徑重試；保留兩次結果。"
      - "執行外部程式的退出碼示範，將數字與前面的布林值分欄記錄。"
    checks:
      - "錯路徑是 False，正確路徑是 True，原檔內容相同。"
      - "我能指出哪個值是外部程式留下的數字。"
---

## 為什麼要學：把紅字當作路標

打開一份明明存在的筆記，畫面卻說找不到。這時有兩種很不同的問題：電腦不知道你要它做什麼，或是它知道怎麼做，卻找不到你要讀的對象。兩種都可能印紅字，修法完全不同。先辨認失敗發生在哪個環節，只改那一個條件，就不用靠重裝或到處複製檔案碰運氣。

## 核心概念：訊息說原因，狀態說成敗

PowerShell 接到一行輸入，先辨識指令名稱，再將後面的資料交給它。把 `Get-Content` 拼成不存在的名稱，連讀檔動作都還沒開始；正確的指令配上錯誤路徑，則是已經在找檔。錯誤訊息會因顯示語言不同而異，先找出被點名的是指令名稱、檔名還是存取權限，不必把整段背起來。

上一個指令是否成功可用 `$?` 看，這個值只有真或假。外部程式（不是 PowerShell 本身的內建指令）還能交回數字，叫退出碼（exit code）。通常 0 代表成功，非零的詳細意義要看該工具的說明。`$LASTEXITCODE` 保留最近一次適用的退出碼；即使下一個內建指令執行成功，裡面也可能還是上一個外部程式的數字。

## 範例：同一份筆記，錯路徑與對路徑

在練習區新建 `error-room`，裡面建立 `logs` 子目錄，只在子目錄中存一個 `note.txt`，寫入 `ready`。在 PowerShell 逐行執行。第一個讀檔**預期會失敗**；若反而成功，請檢查父目錄是否已有另一個同名檔，不要刪除它，改用新的空練習區。

```powershell
Set-Location -LiteralPath 'C:\dev\stackway-lab\error-room'
Get-Content -LiteralPath '.\note.txt'
$?
Get-Location
Get-ChildItem -Name
Get-Content -LiteralPath '.\logs\note.txt'
$?
cmd.exe /d /c "exit 7"
$LASTEXITCODE
```

第一個狀態是 `False`；列出目錄後應看到 `logs`，因此從目前位置往下一層讀就能得到 `ready`，緊接著的狀態成為 `True`。最後叫 Windows 內建的另一個指令程式立刻以指定數字結束，顯示 7 是刻意設計的結果，不會關閉正在使用的 PowerShell。這個小實驗將「有沒有印出文字」和「程式是否回報成功」分開看。

在 macOS 或 Linux 的 bash，可在同樣準備好的父目錄依序輸入 `cat ./note.txt`、`echo $?`，再試 `cat ./logs/note.txt`、`echo $?`。這裡的特殊符號讀到上一個指令的數字狀態；預期第一次非零，第二次為 0。原稿若沒有行末換行，`cat` 的最後一個字可能和下一次印出的 0 黏在同一行；退出狀態仍是 0。外觀和 PowerShell 很像，讀出的資料卻不是同一種，寫診斷單時記得一起寫下使用的環境。

## 常見錯誤：多查一步，反而讀到另一個結果

如果讀檔後先列目錄，再看真假值，你測到的是列目錄，不是讀檔。也別照抄課文中的失敗數字當成所有工具共通的錯誤表。要診斷時，保留原指令與緊接著的狀態，另起一行寫下你的推論。檔案不存在和沒有權限是不同訊息，不要為了前者提升整個視窗的權限。

## 小結：只改一個條件再重試

這次沒有移動筆記，也沒改權限。你改的是從父目錄到檔案的路徑，於是同一個讀檔指令得到不同結果。把兩次的位置、對象與輸出放在同一張紙上；下回看到陌生紅字，就從它點名的那一項開始查。
