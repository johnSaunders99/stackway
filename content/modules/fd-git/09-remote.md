---
id: fd-git-09-remote
module: fd-git
order: 9
title: Git 遠端與 push
subtitle: 把分支送到第二個練習庫
status: ready
minutes: 30
level: 2
prereqs:
  - fd-git-04-conflict
objectives:
  - 讀出 remote 與上游分支的關係
  - 向自己的練習遠端推送並核對分支指向
tags:
  - git
  - remote
resources:
  - title: Git：push 與上游分支
    url: https://git-scm.com/docs/git-push
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Pro Git：與遠端協同工作
    url: https://git-scm.com/book/zh-tw/v2/Git-%E5%9F%BA%E7%A4%8E-%E8%88%87%E9%81%A0%E7%AB%AF%E5%8D%94%E5%90%8C%E5%B7%A5%E4%BD%9C
    kind: book
    lang: zh-Hant
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-09-alias
    prompt: "遠端名稱 hub 告訴你什麼？"
    answer: "它是本機設定的別名，要查路徑才知道實際目的地。"
    mcq:
      question: "你以 git remote add 建立 hub。只從 hub 這個名稱能確定什麼？"
      options:
        - "一定是 GitHub 網站"
        - "此庫的連線別名"
        - "一定只有讀取權"
        - "目前提交的編號"
      answer: 1
      explain: "別名不是伺服器類型，也不授予權限。"
    interview:
      question: "如何避免把整理好的分支送錯地方？"
      points:
        - "先讀遠端地址"
        - "明確指定分支與接收處"
        - "推完比對兩端編號"
      answer: "我先核對 remote 的路徑與目前分支，明確推到練習收件處。推完向對端查 main 的編號，和我這端比對，而不是只看成功兩個字。"
  - id: fd-git-09-upstream
    prompt: "第一次成功的 git push -u hub main 額外留下什麼？"
    answer: "為本機 main 設定對應的上游分支。"
    mcq:
      question: "與只執行 push 相比，成功的 git push -u hub main 額外建立什麼設定？"
      options:
        - "上游配對"
        - "將 hub 更名為 origin"
        - "設定整個儲存庫的所有分支都追蹤 main"
        - "把尚未提交的工作檔同步到遠端"
      answer: 0
      explain: "配對供後續比較，不會把尚未提交的檔案備份。"
  - id: fd-git-09-remoteproof
    prompt: "如何直接核對對端 main 收到同一筆提交？"
    answer: "對照本地 rev-parse main 與 ls-remote 查得的遠端 main 識別碼。"
    mcq:
      question: "推送後，哪個檢查能證明遠端 main 正指向本機要交付的那筆提交？"
      options:
        - "只核對遠端路徑"
        - "只檢查本機工作目錄是否乾淨"
        - "只看本機 main 的最後一行說明"
        - "向對端查 main，再與本機 main 編號比較"
      answer: 3
      explain: "裸庫沒有工作目錄；地址正確也不代表版本已更新。"
practice:
  - id: fd-git-09-p1
    title: "留下雙端收件紀錄"
    kind: hands-on
    minutes: 13
    steps:
      - "在父目錄建立全新的裸庫。"
      - "在來源庫核對 hub 指向後推送主線。"
      - "把實際路徑、分支與兩端編號記在庫外。"
    checks:
      - "目的地是自己的 trail-hub.git。"
      - "本機顯示上游 hub/main。"
      - "兩端 main 的完整編號相同。"
---

## 為什麼要學

自己的歷史已經整理好，怎麼交到另一個位置，又知道對方收到的是哪一筆？推送（push）會把對端需要的提交等資料送過去，並請對端更新指定的分支。這個動作與分享整個工作資料夾不同：沒有提交的草稿不會被一起寄出。先用同一臺電腦上的空庫當收件處，就能學會方向與核對，不用建立網站帳號。

## 核心概念

遠端（remote）是本庫替另一個儲存庫記下的連線名稱，例如 `hub`；名稱只是別名，必須看對應的路徑才知道真正送到哪裡。上游分支（upstream branch）則是某個本機分支追蹤的遠端分支。記住對方地址和替本機主線配好對照分支，是兩件不同的事。推送時的 `-u` 會在成功時設定這層關係，方便以後查看前後差距。

這次的收件處用裸儲存庫（bare repository）：它有歷史與分支，沒有讓你直接編輯的工作目錄。這種安排適合讓多個工作副本往同一處傳遞提交。不要將目的地指向平常寫作中的非裸儲存庫來推它正檢出的分支；那會同時牽涉工作檔的狀態，並不是今天想模擬的交接方式。

## 範例：用新地址寄一次主線

回到 `C:\dev\stackway-lab`。這堂使用原先的 `trail-notes`，不是上一堂的衝突副本。先確認 `trail-hub.git` 是未用的名稱，再在父目錄執行：

```powershell
git init --bare -b main trail-hub.git
cd trail-notes
git branch --show-current
git remote -v
```

目前應是 `main`，並且尚未設定 `hub`。以下指令中的 `../` 是從工作庫回到同層收件處；確認位置符合練習安排才繼續。請勿把同名的既有遠端改成自己的目的地。macOS 或 Linux 可在對應父目錄使用相同指令。

```powershell
git remote add hub ../trail-hub.git
git remote -v
git push -u hub main
git branch -vv
git rev-parse main
git ls-remote hub refs/heads/main
```

讀取最後兩行的結果：一行是本機 `main` 的完整識別碼，另一行是直接向收件處查來的分支識別碼與名稱。兩個值應相同。`branch -vv` 中的 `hub/main` 則讓你認出配對成功。收件處沒有展開 `sign.txt` 給你點開，並非漏傳；要取得可編輯的副本，可以從它再複製一份，下一堂就這樣模擬另一個工作位置。

可以把這次核對想成對兩個信箱分別點名：一張收據是自己準備寄出的版本，一張是收件處確實掛在主線的版本。如果只在本機印兩次自己的編號，即使答案一樣，也沒有查到另一端。

## 常見錯誤

看到 `origin` 就以為一定是某個網站。它只是複製時常見的預設別名，這次明白取名的 `hub` 同樣可以用。推送遭拒也不表示應該強制覆寫：先確認目的地、目標分支、是否已有別人的提交。若路徑或名稱不是預期的練習庫，停止，不要用覆寫命令試圖清掉錯誤。

## 小結

在筆記留三欄：本機分支、遠端地址、遠端分支。未來有人說「已經傳了」，你可以指出實際接收處與提交編號，而不只是重複一次成功訊息。
