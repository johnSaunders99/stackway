---
id: fd-git-01-install
module: fd-git
order: 1
title: Git 安裝與設定
subtitle: 讓第一個提交留在練習庫
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 從官方來源辨識 Git for Windows 並查版本
  - 區分專案與全域設定，在拋棄式庫使用虛構識別值
tags:
  - git
  - install
resources:
  - title: Git：Windows 安裝方式
    url: https://git-scm.com/install/windows
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Pro Git：初次設定
    url: https://git-scm.com/book/zh-tw/v2/%E9%96%8B%E5%A7%8B-%E5%88%9D%E6%AC%A1%E8%A8%AD%E5%AE%9A-Git
    kind: book
    lang: zh-Hant
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-01-scope
    prompt: "不想影響其他專案時，作者名稱應設在哪個範圍？"
    answer: "設在此儲存庫的 local 範圍。"
    mcq:
      question: "只要練習庫使用虛構名稱，應改哪項？"
      options:
        - "使用者的 global"
        - "本庫的 local"
        - "整臺電腦的 system"
        - "只改 GitHub 個人資料"
      answer: 1
      explain: "網站顯示名稱不決定本機作者；全域與系統設定都超過這個練習庫。"
    interview:
      question: "借用一臺已有其他專案的練習機，你怎麼限定作者設定？"
      points:
        - "先確認所在練習庫"
        - "只寫入 local 範圍"
        - "讀回值與來源"
      answer: "我先確認路徑，只在練習庫設定虛構作者，再用帶來源的查詢讀回名稱。不必改掉其他專案可能用到的全域值。"
  - id: fd-git-01-version
    prompt: "git --version 能證明什麼？"
    answer: "目前的終端機找得到能執行的 Git。"
    mcq:
      question: "新終端機印出 Git 版本號，哪個結論成立？"
      options:
        - "此終端機可執行 Git"
        - "目前已登入 GitHub"
        - "已經建立第一筆提交"
        - "目前位置必定是儲存庫"
      answer: 0
      explain: "即使不在儲存庫、未登入網站，也能查詢版本。"
  - id: fd-git-01-identity
    prompt: "提交作者欄位能當作登入證明嗎？"
    answer: "不能，那是寫進提交的標記，不是遠端驗證。"
    mcq:
      question: "user.name 在此練習扮演什麼角色？"
      options:
        - "用來解鎖遠端寫入權"
        - "用來選擇目前登入的帳號"
        - "用來指定儲存庫擁有者"
        - "用於標記提交作者"
      answer: 3
      explain: "作者欄位與伺服器驗證是兩件事。"
practice:
  - id: fd-git-01-p1
    title: "留下版本與本庫來源的小抄"
    kind: hands-on
    minutes: 10
    steps:
      - "在專用空目錄完成範例。"
      - "另存庫外筆記 setup-notes.txt，記下版本號與顯示的設定來源。"
      - "關閉再開此庫的終端機，重讀兩個值。"
    checks:
      - "筆記有實際版本號。"
      - "來源結尾是本庫的 .git/config。"
      - "讀回來的兩個值都是練習用虛構值。"
---

## 為什麼要學

你把能用的說明書改壞了，手上的檔案卻只剩最新版。版本控制（version control）讓你挑出值得留下的狀態，連同「為什麼改」一起記錄。Git 是做這件事的本機程式；GitHub 是可以分享紀錄的網站。今天不需要帳號，也不必把檔案送出電腦。成功的標準是：你能指出正在用哪個程式，以及它會用什麼身分標示這份練習。

## 核心概念

先在 Windows Terminal 開 PowerShell，輸入 `git --version`。出現版本字串表示這個視窗找得到 Git，不用再裝一次。若無法辨識指令，從下方官方資源進入 Git for Windows 安裝頁，在 Windows「設定 → 系統 → 關於」確認系統類型，再選相符的安裝程式。在自己的練習電腦上安裝，保留可從一般命令列使用 Git 的選項；安裝完成後另開終端機再查版本。受管理的電腦若不允許安裝，請用允許安裝的練習機，不要關閉安全設定。

儲存庫（repository）是 Git 管理歷史的地方。提交（commit）是一筆有說明的快照，之後在[〈Git add 與 commit〉](#/lesson/fd-git-02-commit)會細講怎麼選入內容。快照的作者欄位是文字標記，不是登入憑證。全域設定（global config）通常影響這個作業系統使用者的各個專案，本機儲存庫設定（local config）只影響當前這個庫。你也許已經有其他專案；為了練習留下一筆紀錄，不值得改掉那些專案原來的身分。

## 範例：替練習庫貼標籤

在檔案總管開啟自己的 `C:\dev\stackway-lab`；若尚未建立，可先依[〈資料夾與檔案路徑〉](#/lesson/fd-computer-01-folder)找到根目錄。裡面新建空資料夾 `trail-notes`，用終端機開啟它。若同名資料夾已有內容，不要覆寫；另開一套空白練習目錄。下面第一行建立歷史存放處，`-b main` 指定起始分支的名稱；分支就是替一條開發路線取名，之後在[〈分支與合併〉](#/lesson/fd-git-03-branch)會細講。

```powershell
git init -b main
git config --local user.name "Practice Robot"
git config --local user.email "practice@example.invalid"
git config --show-origin --local --get user.name
git config --local --get user.email
```

最後兩行是讀取，不是再次設定。你應該看到來源指向本庫的 `.git/config`，名稱與信箱是剛才填的虛構值。點開一般檔案清單可能看不到 `.git`，因為它是隱藏的管理目錄；不需要進去編輯。macOS 或 Linux 可在家目錄的 `dev/stackway-lab/trail-notes` 開 bash，使用同一組 Git 指令。把版本與設定來源記在庫外的一張練習筆記，不必列出電腦上的其他設定。

> [!TIP]
> 若版本查詢在新視窗成功、舊視窗失敗，先使用新視窗；兩個視窗啟動時取得的指令搜尋路徑可能不同，這不是儲存庫的問題。

## 常見錯誤

看到版本號，不能推論眼前資料夾就是儲存庫；程式可以在任何地方執行，專案設定卻要在對的庫裡讀。若出現「不在儲存庫內」一類訊息，先看終端機所在位置，不要在家目錄補做初始化。如果身分查詢沒輸出，先查剛才是否漏打設定那一行，而不是改用全域選項掩蓋問題。

## 小結

安裝是讓電腦找到工具，設定是讓這個庫知道怎麼標示未來的提交。現在你有刻意命名的空庫，還沒有任何版本；下一堂[〈Git init 與 clone〉](#/lesson/fd-git-02-start)會留下第一份檔案，再從歷史複製出另一個工作空間。
