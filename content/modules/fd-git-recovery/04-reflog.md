---
id: fd-git-recovery-04-reflog
module: fd-git-recovery
order: 4
title: Git reflog 與復原
subtitle: 找回已經離開分支尖端的提交
status: ready
minutes: 30
level: 3
prereqs:
  - fd-git-recovery-03-reset
objectives:
  - 讀出本機參照移動的先後
  - 用 reflog 找出原位置，在拋棄式庫建立救援分支並檢查內容
tags:
  - git-recovery
  - reflog
resources:
  - title: Git：reflog 指令
    url: https://git-scm.com/docs/git-reflog
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 閱讀 HEAD 紀錄與相對位置記號。
concepts:
  - id: fd-git-recovery-04-reflog-view
    prompt: git log 與 HEAD 的 reflog 各回答什麼？
    answer: 前者看從指定起點可達的提交歷史；後者看這個工作區的 HEAD 曾移到哪裡。
    mcq:
      question: 私人分支移動後目前 log 沒有原尖端，先找哪裡？
      options:
        - 未追蹤檔清單
        - 別台機器的暫存區
        - 目前工作檔的修改時間
        - 本機 HEAD 的 reflog
      answer: 3
      explain: 失去目前祖先關係不代表物件立即消失；本機移動紀錄可能還有識別碼。
  - id: fd-git-recovery-04-reflog-selector
    prompt: HEAD@{1} 是目前提交的父提交嗎？
    answer: 不是，它是這份 HEAD 紀錄的上一個位置，會隨新的參照移動而變。
    mcq:
      question: 想稍後仍精確引用已核對的候選提交，要留下哪個值？
      options:
        - 永遠照抄 HEAD@{1}
        - 目前列表行號
        - 該提交的識別碼
        - 目前工作檔長度
      answer: 2
      explain: 相對記號或列表行號會移動，識別碼才指同一物件。
  - id: fd-git-recovery-04-reflog-rescue
    prompt: 用 git branch 在舊提交上建立名字，會怎樣影響目前工作檔？
    answer: 只建立參照，不會切換工作區；可用新分支名直接查提交內容。
    mcq:
      question: 哪項證據最能證明救援分支已指到含 30 的提交？
      options:
        - 目前編輯器顯示 time=30
        - git show rescued-time:plan.txt 顯示 time=30
        - 分支名稱裡有 rescued
        - 命令沒有印出任何文字
      answer: 1
      explain: 工作目錄可能本來就是 30，查具名提交裡的檔案才是直接證據。
    interview:
      question: 私人分支誤退後怎樣救回一版，又避免再次移動現有分支？
      points:
        - 從本機移動紀錄找候選
        - 核對識別碼與檔案
        - 新建分支並驗證原分支不動
      answer: 我先停手，找重設之前的尖端，不直接猜上一筆。查到正確的時間後用候選識別碼建救援分支，再分別讀兩個分支的檔案，不急著切換或重設。
  - id: fd-git-recovery-04-reflog-limit
    prompt: 為什麼不能把 reflog 當作長期備份？
    answer: 紀錄屬於本機而且可能到期；未提交的工作也未必曾形成可找的提交。
practice:
  - id: fd-git-recovery-04-reflog-p1
    title: 替消失的版本取回名字
    kind: hands-on
    minutes: 14
    steps:
      - 從種子庫另建 rescue-lab，記下原尖端
      - 在副本用 soft 移開，找出 reflog 的候選
      - 建立 rescued-time，在筆記並列兩個分支的名稱、識別碼和檔案內容
    checks:
      - main 的提交是 20，rescued-time 的提交是 30
      - 建立名字之後仍在 main
---

## 為什麼要學：分支上看不到，不代表提交立刻消失
調整私人分支後，你想起剛才那一版有句說明值得留下。翻目前分支的歷史，標題不見了。先不要再做一次重設來猜位置；每移動一次，現場就多一個變數。這堂要找的是「某個已做過的提交」，不是編輯器裡從未儲存的文字。兩種損失看起來都像檔案消失，能用的證據卻不同。

## 核心概念：祖先清單與移動紀錄回答不同問題
`git log` 從指定尖端往父提交走，回答這段歷史包含哪些快照。參照紀錄（reflog）記錄本機參照曾移到哪些位置；`git reflog show HEAD` 以新到舊列出這個工作區的 HEAD 曾指向哪裡。一次切換分支也可能留下紀錄，不必然有新的檔案或提交。先看動作說明，再讀那一列左側的提交識別碼。

`HEAD@{1}` 意思是這份參照紀錄的上一個位置，跟「目前提交的父提交」不是一回事。剛移動完時它很方便，再切一次分支就可能不是你想找的那筆。找出候選之後，抄下識別碼，查內容，再替它命名。這比一直輸入「上一筆」穩當，也不必先打開或改寫目前分支的檔案。

## 範例：先辨認，再建立救援分支
從 `C:\dev\stackway-lab` 的 PowerShell 或其他系統的對應練習目錄開始，讓 `recovery-seed` 保留不動作備份。確認 `rescue-lab` 是新名字，執行第一行，成功後才進到副本。核對最近兩筆分別是 30 與 20 的提交，然後刻意把私人分支移開。

```bash
git clone --no-hardlinks recovery-seed rescue-lab
cd rescue-lab
git log --oneline -2
git reset --soft HEAD~1
git log --oneline -2
git reflog show HEAD
```

最新一列描述剛才的重設，它左邊是**到達的位置**，不是要救的起點。往下看複製完成時那列，這個例子裡就是移動前的尖端。以下用引號包住相對記號，PowerShell 與 Bash 都能把大括號原樣交給 Git。確認兩次查到的內容分別是 30、20，再建立 `rescued-time`；一般事故應用核對過的識別碼，不照抄第幾列。

```bash
git show 'HEAD@{1}:plan.txt'
git show HEAD:plan.txt
git branch rescued-time 'HEAD@{1}'
git show rescued-time:plan.txt
git branch --show-current
```

建立分支只是替舊提交掛上一張不會隨 HEAD 走的標籤，並不會自動切過去；最後仍應顯示 `main`。也別只打開工作檔驗收：在 soft 模式下，工作檔本來就可能是 30，不能證明救回的是正確的歷史版本。

另一個交叉檢查是看提交說明：標題能幫你縮小候選，仍可能有不同提交同名。查到目標檔案才掛上救援名稱，之後就算再切分支或再多做提交，你仍能從這個名稱回頭讀，不必重新猜它在移動紀錄裡排第幾列。

## 常見錯誤
要求同事在另一台機器找「我的上一個 HEAD」沒有根據，本機紀錄不是隨提交推送的共用備份。紀錄也可能到期，失去參照的物件日後可能被清理；不要靠它長期保存作品。若找不到符合的提交，先保留現場與其他副本，不能把沒有證據說成已經救回。

## 小結
交出兩個分支名稱及各自提交裡的時間，再留一句「我用哪個動作找到舊尖端」。這三樣就能把「看見舊數字」和「真的讓舊提交重新有名字」區分開來。
