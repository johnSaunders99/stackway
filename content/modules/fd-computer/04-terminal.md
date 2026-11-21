---
id: fd-computer-04-terminal
module: fd-computer
order: 4
title: 終端機與目前目錄
subtitle: 第一次打開終端機：只問位置，不改東西
status: ready
minutes: 25
level: 2
prereqs:
  - fd-computer-03-editor
objectives:
  - 在 PowerShell 查詢目前位置及目錄內容
  - 分辨提示字元、指令與輸出
tags:
  - computer
  - terminal
resources:
  - title: Microsoft Learn：在 PowerShell 確認目前位置
    url: https://learn.microsoft.com/en-us/powershell/scripting/samples/managing-current-location?view=powershell-7.3
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
    note: 只看取得目前位置的例子。
  - title: Microsoft Learn：Get-ChildItem
    url: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-childitem
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
    note: 找 Name 參數與清單輸出。
  - title: Microsoft Learn：Windows Terminal 概觀
    url: https://learn.microsoft.com/en-us/windows/terminal/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: 看終端機如何承載不同的 shell。
concepts:
  - id: terminal-shell
    prompt: 終端機和 PowerShell 各負責什麼？
    answer: 終端機提供文字互動介面；PowerShell 是解讀並執行這次指令的 shell。
    mcq:
      question: 誰負責解讀 Get-Location？
      options:
        - PowerShell 命令解譯器
        - Windows Terminal 的分頁介面
        - 顯示工作目錄的檔案總管
        - 用來輸入文字的輸入法
      answer: 0
      explain: 終端機承載互動，指令的語法與意義由 shell 處理。
  - id: working-directory
    prompt: 列出的檔名不包含筆記，第一件事該查什麼？
    answer: 先用 Get-Location 確認目前工作目錄，不要立即認定檔案不存在。
    mcq:
      question: 要知道此刻正在查哪一個資料夾，用哪一行？
      options:
        - Get-ChildItem -Name
        - Get-Location
        - notepad.exe
        - explorer.exe
      answer: 1
      explain: 第一步要比較位置。Get-ChildItem -Name 回答該位置有哪些名稱，不回答位置本身。
    interview:
      question: 同伴說在終端機找不到昨天的筆記，你會如何一步步確認？
      points:
        - 先確認同伴預期的資料夾與檔名。
        - 用 Get-Location 核對目前目錄。
        - 比較該位置的名稱清單，不把沒列出當作已刪除。
      answer: 我會先在檔案總管找到預期位置，再用 Get-Location 比對 shell 的位置。相同時才用 Get-ChildItem -Name 比對名稱與副檔名。在別的位置得到空清單，無法證明檔案消失。
  - id: prompt-output
    prompt: 提示字元與指令輸出怎麼分辨？
    answer: 提示字元表示 shell 準備接收指令；輸出是上一次執行後傳回的結果。
    mcq:
      question: 抄寫範例時，哪部分不必當成指令輸入？
      options:
        - 參數前面的連字號
        - Get-Location 中間的連字號
        - 環境顯示的提示字元
        - Get-ChildItem 與參數之間的空白
      answer: 2
      explain: 提示字元是環境顯示的文字；把它一併輸入會影響解析。
practice:
  - id: fd-computer-04-p1
    title: 讓兩個視窗回答同樣的問題
    kind: hands-on
    minutes: 10
    steps:
      - 用檔案總管進入練習資料夾，在位址列輸入 powershell。
      - 先執行 Get-Location，再執行 Get-ChildItem -Name。
      - 把兩個結果分別與位址列、檔案清單對照；若位置不相同，從正確資料夾重開。
    checks:
      - 我指出了提示字元，但沒有把它當成指令輸入。
      - 兩邊顯示的是同一個資料夾，我在名稱清單找到筆記。
---

## 為什麼要學
前三堂都用滑鼠，這次只換一種「問電腦問題」的方式。你不必背一張指令表。今天只問兩個可以用眼睛核對的問題：「我現在站在哪裡？」和「這裡放著什麼？」答案應該和檔案總管一致。能做這個對照，下次看見一大串終端機文字，你就有地方開始讀，而不是把整個視窗都當成錯誤訊息。

## 核心概念
終端機（terminal）是顯示文字、接收輸入的介面；命令解譯器（shell）才負責解讀指令。Windows Terminal 可以開不同種類的分頁，所以看見終端機並不保證裡面跑的是 PowerShell。這堂直接使用 Windows PowerShell。輸入區左邊可能出現以 PS 開頭、以大於符號結尾的一串文字，稱為提示字元 (prompt)。那是電腦等你輸入的記號，不是要一起抄的答案。

每個 shell 有自己的目前工作目錄 (working directory)。想像你和檔案總管是兩位拿著同一張地圖的人，各有自己的「你在這裡」。兩邊都能看同一份筆記，但你在檔案總管換了資料夾，已開啟的 shell 不會因此跟著走。接下來刻意從練習資料夾開一個新視窗，就是為了讓兩邊有相同起點。

## 範例：先問位置，再問檔名
在檔案總管進入 `C:\dev\stackway-lab\desk`。確認右邊看得見 `desk-note.txt` 或你上一堂所用的檔名。以下指令當場輸入，不建立腳本檔。點上方**位址列**，輸入 `powershell`，按 Enter。這是在當前資料夾開啟 Windows PowerShell，不需要系統管理員身分。等到提示字元出現，逐行輸入下面兩個指令；第一行得到答案後再輸第二行。

```powershell
Get-Location
Get-ChildItem -Name
```

第一個指令列出位置。不要比對整串文字是否和別人的畫面一樣；核對磁碟機、`dev` 與最後一段是不是你實際選的路徑，不只看末尾的名字。第二個指令列出此處一般項目的名稱，每個名稱一行；你的文字筆記應該在裡面。它並沒有打開文件，也不會把三行內容印出來。把這兩個答案分別指給檔案總管的位址列與檔名看，這就是你的第一次交叉驗證。

> [!NOTE]
> 若電腦有 macOS 或 Linux 的終端機，同樣兩個「觀察」動作通常寫作下面兩行。這是對照，不需安裝環境。WSL 是能在 Windows 開啟 Linux 環境的工具（詳見[〈WSL 2 與 Ubuntu〉](#/lesson/fd-linux-01-setup)）。如果原本就在用它，且磁碟採預設掛載方式，請在 `/mnt/c/dev/stackway-lab/desk`的 shell 提示字元直接輸入，不必另存檔案。
```bash
pwd
ls -1
```

## 常見錯誤
如果結果列了一堆陌生的檔案，不代表筆記被刪了。先核對第一個指令顯示的位置；若不是練習資料夾，關閉這個視窗，從正確資料夾的位址列再開一次。如果顯示「找不到指令」，檢查是否在 PowerShell、有沒有把範例的提示字元也貼進去、連字號是否為半形。不要用提升權限來處理拼字問題。若電腦政策不允許開啟 shell，保留現狀，先用檔案總管說明這兩個問題的答案，不把未執行說成執行成功。

## 小結
讓視窗停在兩行指令的結果，讀出你所在的位置與找到的檔名。能解釋為什麼「沒有列在這裡」不等於「整台電腦都沒有」，就已具備之後學切換目錄最重要的直覺。
