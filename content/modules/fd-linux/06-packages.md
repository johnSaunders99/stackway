---
id: fd-linux-06-packages
module: fd-linux
order: 6
title: APT 套件管理
subtitle: 查到套件不等於已安裝
status: ready
minutes: 25
level: 3
prereqs:
  - fd-linux-05-env
objectives:
  - 區分查詢、更新索引、安裝與升級
  - 讀取套件來源與版本，在沒有權限時只做查詢
tags:
  - linux
  - packages
resources:
  - title: Ubuntu：安裝與管理套件
    url: https://ubuntu.com/server/docs/how-to/software/package-management/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: "2026-11-20"
    note: 對照更新索引、安裝與升級的目的。
  - title: APT 手冊：apt-cache 查詢
    url: https://manpages.debian.org/stable/apt/apt-cache.8.en.html
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: "2026-11-20"
    note: 在手冊搜尋 policy，辨別版本來源。
concepts:
  - id: fd-linux-06-packages-installed
    prompt: Installed 和 Candidate 各回答哪個問題？
    answer: 前者是本機已裝版本，後者是按現有索引與規則會選到的版本。
    mcq:
      question: Installed 為 (none)、Candidate 有版號，能確定什麼？
      options:
        - 程式已在執行
        - 現在一定能下載成功
        - 此套件尚未安裝，但本機有候選紀錄
        - 已經剛升級完成
      answer: 2
      explain: 型錄中的候選版本不是安裝收據，也不證明當下連線或權限。
    interview:
      question: 交接單只說搜尋得到某個套件，你會如何補足證據？
      points:
        - 分列已裝與候選
        - 查版本表來源
        - 註明查詢限制且不擅自更新
      answer: 我會在同一台機器查 policy，抄下兩個版本欄，並標註候選依據的本機索引。若未安裝就直寫未安裝，不把候選版當成正在用的版本。
  - id: fd-linux-06-packages-update
    prompt: apt update 會把已安裝的工具都升級嗎？
    answer: 不會，它更新來源索引；升級既有套件是另一個動作。
    mcq:
      question: 若只被授權讀取現有版本資訊，哪個動作合適？
      options:
        - apt update
        - apt-cache policy bash
        - apt install bash
        - apt upgrade
      answer: 1
      explain: 查 policy 不要求這堂課變更索引或安裝內容，其他操作超出盤點範圍。
  - id: fd-linux-06-packages-source
    prompt: 版本表裡的本機 status 路徑能當下載來源嗎？
    answer: 不能。它代表本機安裝紀錄，套件來源索引要看其他對應項。
    mcq:
      question: 只有本機安裝紀錄時，最精確的報告是？
      options:
        - 本機有紀錄，下載來源尚未由此證實
        - 一定由網路最新來源安裝
        - 目前網路一定故障
        - 一定是手動編譯
      answer: 0
      explain: 安裝紀錄本身不提供足以回推來源或網路狀況的證據。
practice:
  - id: fd-linux-06-packages-p1
    title: 寫一張不需管理權限的套件盤點卡
    kind: read
    minutes: 10
    steps:
      - 查 bash 與 ripgrep 的 policy，無 Ubuntu 則用課文樣本
      - 分欄記錄已裝、候選與來源依據
      - 加日期並註明未更新索引
    checks:
      - 沒有把 (none) 寫成已安裝
      - 能區分來源索引與本機 status 紀錄，資料不足時標示不明
---

## 為什麼要學：查得到名稱，還不能說已經裝好
交接文件說需要一個文字搜尋工具。你查到它的套件名稱與最新版號，同事卻問「那是這台正在用的嗎？」套件目錄像書店的型錄，可以列出有得買的書，不能證明書已經在你桌上。這堂的成果是一張盤點卡：本機裝的是什麼版本、這台目前會選哪個版本、候選版本的依據來自哪裡。盤點不需要真的安裝或升級。

## 核心概念：清單和安裝狀態是 2 份資料
套件（package）把程式、相關檔案與版本資訊包在一起；套件來源（repository）提供可取得的套件。Ubuntu 的 APT 是一組管理工具，會依目前設定的來源、本機保留的索引與選擇規則，決定安裝時的候選版本（candidate）。已安裝版本則記在本機的套件資料庫，兩欄可以相同，也可能一欄空白或版號不同。不要只看搜尋結果第一行做結論。

可把常見作業分成四格：查詢只讀現況；`apt update` 取得來源的新索引，沒有替現有程式升級；`apt install` 會安裝指定套件，且可能連帶處理相依套件；`apt upgrade` 則嘗試升級現有套件。後三種不是同一種「更新」，都超出這堂只讀盤點。沒有授權或網路，不需要先補做任何一項才能練判讀。

## 範例：只讀自己這台的候選清單
Windows 從既有 WSL Ubuntu 開 Bash；原生 Ubuntu 也可在任意目錄執行。先查通常已存在的 bash，再查可能沒有安裝的搜尋工具 ripgrep。`policy` 顯示已裝、候選與版本表；標籤可能依語系不同，以下要求英文只為讓筆記欄位容易對照。

```bash
LC_ALL=C apt-cache policy bash ripgrep
```

依序找 `Installed`、`Candidate`、`Version table`。版本表同一個版本下面可能列出多處位置；`/var/lib/dpkg/status` 是本機安裝紀錄，不要把它寫成提供下載的遠端來源。若候選版對應到發行版套件庫的索引，筆記可只寫發行版與套件區段，不必複製內部來源的完整位址。

假設樣本是「搜尋工具：已安裝 (none)、候選 2.1、版本表列出發行版套件庫」，你能推論的是本機尚未安裝這個套件、現有資料可選到 2.1，不能推論連線正常或安裝必定成功。反過來，如果一個名字根本沒有列出，有可能是拼錯、來源未提供或索引不完整；沒有輸出不是「所有機器上都沒有這個工具」。沒有 Ubuntu 時就用這筆明示的教學資料完成盤點卡，不要捏造實測版號。

## 常見錯誤
看到候選版號比已裝版高就擅自升級，或拿指令能否啟動當作套件一定來自 APT 的證明。程式也可能從其他來源安裝，甚至命令名稱可能和套件名不同。先問問題要查的是「shell 找到誰」還是「套件管理工具登記了誰」；前者可回到上一堂的搜尋路徑實驗，後者才看這裡的版本表。

## 小結
在盤點卡加上「以本機既有索引查詢，沒有重新整理」與查詢日期。這個限制很重要：你留下的是可重查的環境觀察，而不是對所有 Ubuntu 機器或網路上最新版本的承諾。
