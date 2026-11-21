---
id: fd-linux-01-boundary
module: fd-linux
order: 2
title: Linux 檔案系統與掛載
subtitle: Windows、WSL 與 Linux 路徑
status: ready
minutes: 25
level: 3
prereqs:
  - fd-linux-01-setup
objectives:
  - 辨認目前指令由哪個系統執行
  - 指出同一檔案掛載後的位置
tags:
  - linux
  - wsl
resources:
  - title: Microsoft：跨 Windows 與 Linux 檔案系統工作
    url: https://learn.microsoft.com/zh-tw/windows/wsl/filesystems
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: "2026-11-20"
    note: 比較磁碟的掛載路徑與 Linux 家目錄。
concepts:
  - id: fd-linux-01-boundary-mount
    prompt: WSL 預設掛載的 C 槽位置和 Windows 的 C 槽是什麼關係？
    answer: /mnt/c 是同一個 Windows 磁碟的 Linux 入口，並非同步出來的一份副本。
    mcq:
      question: Windows 的 C 槽練習檔改好儲存，從預設 /mnt/c 對應位置重讀會如何？
      options:
        - 必須再複製一次才看得到
        - 一定要重新安裝 Ubuntu
        - 看到這次儲存的內容
        - 只看得到 Ubuntu 家目錄的副本
      answer: 2
      explain: 掛載路徑指到同一份檔案，與複製後兩份各自修改不同。
    interview:
      question: 你如何向團隊證明這兩個路徑讀到同一次寫入？
      points:
        - 列出完整對照路徑
        - 用新檔寫辨識記號
        - 只改一側並在另一側重讀
      answer: 我會選一個沒有撞名的練習檔，在兩側先讀同一個值。只在 Windows 儲存第二個記號，再從掛載位置重讀；家目錄裡同名的副本不算證據。
  - id: fd-linux-01-boundary-home
    prompt: 把掛載檔複製進 Linux 家目錄後，修改副本會改到原檔嗎？
    answer: 一般複製會產生獨立檔案，之後修改副本不會自動寫回原檔。
    mcq:
      question: 希望刻意比較獨立副本，哪個做法合適？
      options:
        - 只把斜線方向換過來
        - 將檔案複製到家目錄的新檔再編輯
        - 只在同一掛載目錄換工作路徑
        - 在兩側開啟同一掛載檔
      answer: 1
      explain: 不同入口不是副本，明確複製出來才有兩份內容。
  - id: fd-linux-01-boundary-cwd
    prompt: 兩個終端機讀同名檔卻不一致，先檢查什麼？
    answer: 確認 shell、目前目錄與檔案的完整路徑，並核對編輯器已儲存。
    mcq:
      question: 想確認 Ubuntu 分頁目前所在的目錄，使用哪個指令？
      options:
        - pwd
        - uname -s
        - whoami
        - cat /etc/os-release
      answer: 0
      explain: 其他指令辨別核心、使用者或發行版，都沒有回答目前檔案解析的起點。
practice:
  - id: fd-linux-01-boundary-p1
    title: 留下兩個路徑、一個記號的對照圖
    kind: hands-on
    minutes: 10
    steps:
      - 只在自己的新檔寫入 from-windows
      - 用預設掛載路徑讀取，再修改成 second-pass 並重讀
      - 無 WSL 則畫出預期的兩個絕對路徑並註明未實跑
    checks:
      - 兩個路徑對應同一磁碟與檔名
      - 能將掛載位置與家目錄副本畫成不同關係
---

## 為什麼要學：2 個檔名，怎麼證明不是 2 份？
你在檔案總管改了一行筆記，Ubuntu 的編輯器卻沒跟著變。先別複製整個資料夾；兩個視窗都顯示同名檔案，可能是在看兩份獨立副本，也可能只是重新開檔前尚未更新顯示。先拿一個新檔做實驗，只改其中一側，再到另一側讀取同一個記號，答案比猜路徑可靠。

## 核心概念：掛載是一個入口，不是同步作業
檔案系統（filesystem）決定如何命名與尋找檔案。掛載（mount）是把另一個檔案系統接到指定目錄。WSL 的 Ubuntu 在預設設定下，把 Windows 的 C 槽接在 `/mnt/c`，所以 Windows 的 `C:\dev\stackway-lab\linux` 可從 Linux 的 `/mnt/c/dev/stackway-lab/linux` 進入。路徑的開頭、斜線方向不同，指的仍然可以是同一個檔案。D 槽在預設設定下對應 `/mnt/d`。

Linux 的家目錄（home directory）另有用途：`~` 指目前 Linux 使用者的家，通常不在 Windows 的練習目錄裡。從掛載目錄把檔案複製到家目錄，會得到獨立的一份；之後任一邊編輯都不會再同步到另一份。主要用 Linux 工具處理大量小檔時，多半放在 Linux 檔案系統；需要示範同一份檔案的兩種寫法時，再刻意選掛載目錄。

## 範例：讓一個新記號跨過邊界
先用檔案總管建立主題資料夾，再用 Windows PowerShell 切到 `C:\dev\stackway-lab\linux`。下段只建立尚不存在的 `mount-note.txt`；如已存在就換新檔名，兩側都要跟著改。用固定的英文字當內容，讓這個實驗只測路徑，不把編碼混進來。

```powershell
New-Item -ItemType File -Path mount-note.txt -Value 'from-windows' -ErrorAction Stop
Get-Content -LiteralPath mount-note.txt
```

從已授權的 Ubuntu 分頁，在任意目錄讀掛載點，再切進檔案所在目錄。原生 Linux 或 macOS 不會憑空有 Windows 的 C 槽；沒有 WSL 時，用上段產物加上路徑對照圖，註明後半是預測。若掛載路徑不存在，先核對磁碟代號與這台機器的掛載設定，不要自行建立假的掛載目錄。

```bash
cd /mnt/c/dev/stackway-lab/linux && pwd && cat mount-note.txt
```

先看輸出的完整目錄符合預期，並看到 `from-windows`，才在 Windows 編輯器把新檔內容改成 `second-pass` 並儲存。回 **同一個** Ubuntu 分頁再次執行 `cat mount-note.txt`。若這次讀到新值，證明掛載入口看到這次寫入，不需要搬檔或等待同步軟體。這也提醒你，從 Ubuntu 在這裡刪檔同樣會影響 Windows 原檔。

還可以反過來問：如果只是把新文字複製貼到另一個同名檔裡，一次讀到相同內容能證明它們是同一檔嗎？不能。這正是實驗要在確認完整路徑後，再只改一側、從另一側重新讀取的原因。

## 常見錯誤
以為換了終端機就自動換工作目錄，或把 `C:\…` 當成 Bash 的原生路徑。先用 PowerShell 的 `Get-Location` 或 Bash 的 `pwd` 識別目前位置；不要只比檔名最後一段，也不要依賴大小寫不一致恰好能成功的行為。若讀到舊值，核對編輯器是否已儲存，以及是否其實改了家目錄裡的副本。

## 小結
在筆記畫兩條箭頭：兩種絕對路徑都指向同一個記號；另一個箭頭則畫出複製到家目錄後產生的新檔。這張圖也解釋了為什麼下一堂[〈Linux 檔案權限〉](#/lesson/fd-linux-02-rights)會在原生 Linux 檔案系統測執行位元，只將觀察紀錄保存在工作區。
