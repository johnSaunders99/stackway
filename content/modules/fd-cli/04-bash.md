---
id: fd-cli-04-bash
module: fd-cli
order: 4
title: bash 與兩種路徑
subtitle: 把 PowerShell 動作翻成 bash
status: ready
minutes: 25
level: 1
prereqs:
  - fd-cli-03-pipes
objectives:
  - 用範例輸出比對 bash 的 pwd、ls 與 PowerShell 找路結果
  - 辨認 Windows 路徑與 Linux 掛載路徑
tags:
  - cli
  - bash
resources:
  - title: "Microsoft Learn：Windows 與 WSL 的檔案路徑"
    url: https://learn.microsoft.com/zh-tw/windows/wsl/filesystems
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: "Ubuntu：在命令列找位置與列目錄"
    url: https://documentation.ubuntu.com/desktop/en/latest/tutorial/the-linux-command-line-for-beginners/
    kind: course
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-cli-04-bash-pwd
    prompt: "bash 中哪個指令回答目前所在的目錄？"
    answer: "pwd 印出位置；ls 則列出該位置裡的項目。"
    mcq:
      question: "要確認 cd 後站在哪裡，應輸入哪一個？"
      options:
        - "pwd"
        - "ls"
        - "cd .."
        - "ls -a"
      answer: 0
      explain: "列出內容不能唯一識別位置，cd .. 還會再移動一步。"
  - id: fd-cli-04-bash-mount
    prompt: "WSL 預設怎麼表示 Windows 的 D 槽？"
    answer: "通常掛載在 /mnt/d，後面再接用斜線分隔的各層目錄。"
    mcq:
      question: "在預設 WSL 中，哪個位置對應 D 槽的 dev？"
      options:
        - "/dev/d"
        - "/mnt/d/dev"
        - "D:/mnt/dev"
        - "/mnt/c/dev"
      answer: 1
      explain: "/mnt 下的小寫磁碟代號決定是哪個 Windows 磁碟；/dev 不是 D 槽。"
  - id: fd-cli-04-bash-shell
    prompt: "單看視窗外觀，能斷定 Linux 指令會用哪一套路徑嗎？"
    answer: "不能。先確認裡面是哪種 shell 和環境；WSL、Git Bash 與原生 macOS 的起點不同。"
practice:
  - id: fd-cli-04-bash-p1
    title: "留一張雙語路線圖"
    kind: explain
    minutes: 9
    steps:
      - "在練習區建立 bash-route 子目錄與 marker.txt，先用 PowerShell 查位置與檔名。"
      - "有 WSL 就執行 bash 對照；沒有就用課文給的起點和觀察值手算。"
      - "在紙上寫出兩個完整地址、同一檔名與上一層位置，標明哪些為實測。"
    checks:
      - "兩端的資料夾順序相同，磁碟的寫法不同。"
      - "我標出了 pwd 與 ls 分別對應哪個問題。"
---

## 為什麼要學：文件寫的是另一種指令語言

你在 Windows 看一份教學，第一步寫 `pwd`，下一步卻是 `cd /mnt/c/dev`。照著貼到每個視窗並不可靠：同一個終端機程式能承載不同的指令解譯器（shell）。先弄清楚教學在問「我在哪裡」還是「裡面有什麼」，再選手邊環境的寫法，比替每個指令死背一個別名更有用。

## 核心概念：同一棟房子可以有 2 種門牌

Bash 是 Linux 常見的 shell。`pwd` 印出工作目錄；`ls` 列出目錄內容；`cd` 切換位置。Windows 的 Linux 子系統（Windows Subsystem for Linux，WSL）讓你在 Windows 內使用 Linux 環境。掛載（mount）是把一個檔案系統接到某個目錄，預設的 WSL 通常把 C 槽接在 `/mnt/c`，所以不需要為了換寫法就複製整份練習。

Windows 完整路徑由磁碟機代號開始，層與層之間慣用反斜線。Linux 的完整路徑由最前面的斜線開始；斜線後的每一段也是一個目錄名稱。符號換了，「上一層」的意思沒換。不要反過來推論每台 Linux 都有 Windows 磁碟，或把 Linux 的根目錄直接當成 C 槽。

## 範例：用一個記號確認是同一個目錄

用檔案總管在練習區新增 `bash-route`，裡面存一份空的 `marker.txt`。先在 Windows 的 PowerShell 執行下面三行。位置應以 `\bash-route` 結尾，清單中應有那份記號檔。用其他磁碟時，把兩側路徑的磁碟代號一起換掉。

```powershell
Set-Location -LiteralPath 'C:\dev\stackway-lab\bash-route'
Get-Location
Get-ChildItem -Name
```

已經有 WSL 且採預設掛載時，在 Ubuntu 的 bash 視窗輸入下列指令；本堂不用安裝。日後需讓 Windows 執行 Linux 工具時，再依[〈WSL 2 與 Ubuntu〉](#/lesson/fd-linux-01-setup)設定。沒有 WSL 就把下列步驟當讀圖題：已知起點在記號檔所在目錄，先在紙上分別填入「位置」與「內容」，再與下一段的觀察值比對。

```bash
cd /mnt/c/dev/stackway-lab/bash-route
pwd
ls
cd ..
pwd
```

第一次 `pwd` 應是 `/mnt/c/dev/stackway-lab/bash-route`；`ls` 應可看見 `marker.txt`；第二次位置最後只剩 `stackway-lab`。若你用原生 macOS 或 Linux，可以在自己的練習目錄開啟終端機，從 `pwd` 那行開始照做，預期的是當地的實際地址，不是出現 Windows 的掛載點。

有個不用再開新視窗的紙上測試：假設你從記號檔的位置退回了練習區，接著只打 `ls`，預期看到的應是子目錄名稱，不是裡面的記號檔。因為列出這層不等於順便打開每個子目錄。若再退一層，兩邊地址都應落在各自代表的 dev 目錄；在紙上把每次移動劃成一格，哪一站漏掉會很明顯。

## 常見錯誤：把長得像的環境當成同一套

Git Bash 是 Git for Windows 隨附的 shell，安裝入口見[〈Git 安裝與設定〉](#/lesson/fd-git-01-install)；它也接受許多相同指令，但 Windows 磁碟常見寫法是 `/c`，不是 WSL 的預設位置。先看分頁開的是什麼程式，不要光看視窗背景顏色。如果切換位置失敗，後面的列檔可能仍然列出舊位置的東西；看到眼熟的檔名不能證明抵達，還要核對完整位置。

## 小結：翻譯動作，不翻譯畫面

紙上畫兩欄，讓「查位置、列內容、回上一層」各占一列。若沒有第二個環境，寫「按範例推得」即可，不把預測當實測。留下兩種寫法與同一個記號，之後換電腦時，就能重新取得當地地址，而不是照抄一條不存在的路。
