---
id: fd-linux-01-setup
module: fd-linux
order: 1
title: WSL 2 與 Ubuntu
subtitle: 知道自己是在哪一側執行指令
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 辨認 Windows、WSL 2 與 Ubuntu 各自的角色
  - 查既有發行版與版本，未獲安裝授權時用範例輸出判讀
tags:
  - linux
  - setup
resources:
  - title: Microsoft：WSL 基本指令
    url: https://learn.microsoft.com/zh-tw/windows/wsl/basic-commands
    kind: doc
    lang: zh-Hant
    minutes: 5
    required: false
    checked: "2026-11-20"
    note: 看如何列出已安裝的發行版與世代。
  - title: Microsoft：安裝 WSL
    url: https://learn.microsoft.com/zh-tw/windows/wsl/install
    kind: doc
    lang: zh-Hant
    minutes: 4
    required: false
    checked: "2026-11-20"
    note: 需要安裝時先看條件，本課不需執行。
concepts:
  - id: fd-linux-01-setup-roles
    prompt: WSL 2 和 Ubuntu 分別扮演什麼角色？
    answer: WSL 2 提供使用 Linux 核心的執行環境，Ubuntu 提供發行版的工具與檔案系統。
    mcq:
      question: 同一台 Windows 上，下列哪個是 Linux 發行版？
      options:
        - Windows Terminal
        - Ubuntu
        - PowerShell
        - WSL 世代欄的數字 2
      answer: 1
      explain: 視窗、shell 與執行環境不是發行版，發行版才提供一套 Linux 使用者工具。
  - id: fd-linux-01-setup-list
    prompt: 清單裡 Ubuntu 顯示 Stopped、VERSION 2 能推出什麼？
    answer: 系統已登記此發行版，目前停止，設定為使用 WSL 2。
    mcq:
      question: 看到 Stopped 應如何判讀？
      options:
        - 已登記但此刻沒有運作
        - 從未安裝過
        - 已損壞而且無法再啟動
        - 它只支援 WSL 1
      answer: 0
      explain: 停止是執行狀態，不能拿來判斷版本、故障或安裝失敗。
    interview:
      question: 一台受管電腦上有人說要重裝 Ubuntu，你會先收集什麼？
      points:
        - 先做唯讀清單查詢
        - 分開記錄發行版、狀態與世代
        - 沒有授權不安裝
      answer: 我會先看系統是否已列出 Ubuntu，也會分開抄它是停止還是執行中、屬於哪一代。沒有可用清單時先記為未確認，不把重裝當成查詢的下一步。
  - id: fd-linux-01-setup-side
    prompt: 想知道目前 Linux 的發行版，該在何處讀什麼？
    answer: 進入已授權環境後讀該側的 /etc/os-release；這與從 Windows 查 WSL 世代不同。
    mcq:
      question: 在 Ubuntu 看到 uname -s 回報 Linux，還不能證明哪件事？
      options:
        - 核心名稱為 Linux
        - 這次指令回報了核心資訊
        - 它並未列出 Ubuntu 發行版版號
        - 該環境一定使用 WSL 2
      answer: 3
      explain: 原生 Linux 也會回報 Linux，世代要從 WSL 清單的版本欄確認。
practice:
  - id: fd-linux-01-setup-p1
    title: 做一張兩側環境識別卡
    kind: read
    minutes: 10
    steps:
      - 在 PowerShell 查既有清單，不能查就用課文樣本
      - 標出名稱、目前狀態、WSL 世代
      - 若已獲准進入 Ubuntu，另外記錄該側回報的核心與發行版
    checks:
      - 識別卡區分 Windows 查詢與 Linux 查詢
      - 把樣本或實測標清楚，沒有把 Stopped 寫成未安裝
---

## 為什麼要學：終端機長得一樣，不代表裡面一樣
同一台 Windows 電腦可以開兩個外觀相同的分頁，其中一個讀得懂 PowerShell，另一個等你輸入 Bash。朋友說「我在 Ubuntu 跑得動」，第一個值得問的不是要裝哪個套件，而是「你是在哪一側執行的？」這堂先盤點已有的環境。即使電腦不能安裝新軟體，你仍可以讀懂盤點結果，不用冒險改工作機。

## 核心概念：主機、執行環境、發行版
Windows 是主機作業系統。適用於 Linux 的 Windows 子系統（Windows Subsystem for Linux，WSL）提供在 Windows 上使用 Linux 環境的方式；第 2 代使用真正的 Linux 核心。Ubuntu 是發行版（distribution），提供命令列工具、套件與自己的檔案系統。終端機（terminal）只是承載互動的視窗，不會因為你換了分頁顏色就把 Windows 變成 Ubuntu。

先把「已安裝」、「目前運作中」和「使用第幾代」分開記。已安裝的發行版可以處於停止狀態，下次進入時再啟動。列出的第幾代是每個發行版各自的設定，不是 Ubuntu 的發行版版本，也不是你安裝的 Windows 版本。有多個發行版時，星號只是預設對象，不等於其他列不能使用。

## 範例：用一個查詢決定下一步
在 Windows PowerShell 任意目錄，例如 `C:\dev\stackway-lab`，只做下面的查詢。不必用系統管理員身分。若系統只顯示使用說明、找不到指令或沒有列出發行版，就不要繼續執行啟動指令，直接判讀下面的教學樣本。

```powershell
wsl.exe --list --verbose
```

假設練習機畫面如下。這段是**範例輸出**，不是要貼進終端機的指令，也不代表你的電腦已經安裝了任何東西。

```text
  NAME      STATE      VERSION
* Ubuntu    Stopped    2
  Debian    Running    1
```

第一列表示系統已登記 Ubuntu、現在未運作、採用第 2 代；第二列表示另一個發行版正在運作，但採用第 1 代。如果只看 Running 就選第二列，會進到不同工具組；如果只看星號又不能證明它此刻在執行。先把自己要用的名稱與版本圈起來。

只有在你有權啟動、也確實看到名為 Ubuntu 的既有環境時，才在 PowerShell 輸入 `wsl.exe -d Ubuntu`。名稱不一樣就用清單上的實際名稱。進入後在 Ubuntu 的 Bash 任意目錄讀這兩個值；已在原生 Ubuntu 上也可直接從這裡開始：

```bash
uname -s
grep '^PRETTY_NAME=' /etc/os-release
```

第一行應是 Linux，第二行說明發行版。第一行本身無法區分原生機器或 WSL 世代。若是從 PowerShell 開進去，可以輸入 `exit` 回上一層，再執行原來的列表指令確認你在哪一側。

## 常見錯誤
沒看到清單就立刻搜尋安裝指令，可能把「這台不能改」變成一次未授權的系統變更。安裝功能、下載發行版與可能的重新開機，都不是盤點的一部分。也不要因為沒有 Ubuntu 就在簡歷或筆記寫成「已建好環境」；能清楚標記判讀自樣本，本身就是可交接的結果。

## 小結
留下「指令在哪側輸入、它查的是誰、哪一欄支持我的結論」三句筆記。下一堂[〈Linux 檔案系統與掛載〉](#/lesson/fd-linux-01-boundary)才會把兩側的檔案位置接起來，你已經知道該從哪個視窗開始。
