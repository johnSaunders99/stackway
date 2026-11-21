---
id: fd-git-01-snapshot
module: fd-git
order: 3
title: Git 狀態與暫存區
subtitle: 工作目錄不是歷史紀錄
status: ready
minutes: 25
level: 2
prereqs:
  - fd-git-02-start
objectives:
  - 讀取 git status，核對新增與修改的檔案
  - 比較修改前後的差異
  - 分辨工作目錄、暫存區與提交
tags:
  - git
  - snapshot
resources:
  - title: Git：status 狀態與短格式
    url: https://git-scm.com/docs/git-status
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Pro Git：記錄已選與未選的變更
    url: https://git-scm.com/book/zh-tw/v2/Git-%E5%9F%BA%E7%A4%8E-%E7%B4%80%E9%8C%84%E8%AE%8A%E6%9B%B4%E5%88%B0%E7%89%88%E6%9C%AC%E5%BA%AB%E4%B8%AD
    kind: book
    lang: zh-Hant
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-03-areas
    prompt: "編輯器剛存的內容在哪裡？"
    answer: "先在工作目錄，未必是暫存區的版本。"
    mcq:
      question: "儲存後還沒執行 Git 指令，改的是哪裡？"
      options:
        - "最新提交"
        - "遠端分支"
        - "一定已進暫存區"
        - "工作目錄"
      answer: 3
      explain: "存檔不會自動選入快照，更不會產生提交。"
    interview:
      question: "為什麼同一檔可以同時已暫存又未暫存？"
      points:
        - "區分三處內容"
        - "說明 add 取當時版本"
        - "各用一種差異確認"
      answer: "我會拿一行實際文字對照。先選入東門，再把檔案改成西門，所以下一筆準備寫東門，磁碟卻是西門。兩個 diff 分別驗出這兩件事。"
  - id: fd-git-03-columns
    prompt: "短格式的 MM 對同一檔表示什麼？"
    answer: "相對目前提交有已暫存變更，相對暫存區也有未暫存變更。"
    mcq:
      question: "git status --short 顯示 MM route.txt，兩個 M 怎麼讀？"
      options:
        - "同一檔案提交了兩次"
        - "發生合併衝突"
        - "兩段比較都有修改"
        - "有 2 個未追蹤檔案"
      answer: 2
      explain: "兩欄是不同基準，不是次數。"
  - id: fd-git-03-cached
    prompt: "想預覽下一筆普通提交的變更，應看哪個差異？"
    answer: "看 git diff --cached，核對暫存區相對目前提交的差異。"
    mcq:
      question: "目前提交是北門、暫存區是東門、工作檔是西門。哪個指令會看到北門改東門？"
      options:
        - "git diff"
        - "git diff --cached"
        - "git diff HEAD"
        - "git log -1 --oneline"
      answer: 1
      explain: "未加參數的差異在比較東門和西門；歷史不含此次選取。"
practice:
  - id: fd-git-03-p1
    title: "留下一張 3 欄版本圖"
    kind: hands-on
    minutes: 10
    steps:
      - "按順序修改、暫存、再修改 route.txt。"
      - "在庫外筆記畫出目前提交、暫存區、工作目錄。"
      - "把兩次 diff 的新舊值標在欄位之間。"
    checks:
      - "三欄依序是北、東、西門。"
      - "短格式可找到 MM route.txt。"
      - "草稿沒有出現在已暫存差異。"
---

## 為什麼要學

你已經按了儲存，為什麼同一個檔案還會在狀態報表裡出現兩次？因為編輯器回答的是「磁碟上現在有什麼」，Git 還要回答「你挑了什麼」和「上次留下什麼」。今天只觀察，不急著提交。你會做出一個很有用的反例：檔名完全相同，下一筆準備記錄的文字卻跟畫面上的不同。

## 核心概念

把已提交的快照（snapshot）、暫存區（staging area）、工作目錄（working tree）排成從左到右的三欄。最左邊是目前提交的內容，中間是準備成為下一筆提交的內容，最右邊是編輯器正在讀寫的檔案。剛提交完，受追蹤的檔案在這三處相符；按下儲存只改最右欄，執行 `git add` 才把指定檔案當下的樣子放到中間。這不是建立一個從此會自動更新的勾選框。

`git status` 是總覽。長格式分組告訴你哪些已選、哪些還沒選；短格式的兩欄要從左往右讀，第一欄相對於目前提交，第二欄相對於暫存區。`M` 表示修改；`??` 是未追蹤檔，不是兩個錯誤。總覽沒有回答「哪個字變了」。要看逐行差異（diff），`git diff` 比較右邊兩欄，`git diff --cached` 比較左邊兩欄；它們各回答一個問題。

## 範例：一個檔案的 3 種內容

回到 `C:\dev\stackway-lab\trail-notes`，別進上堂的副本。在編輯器把 `route.txt` 的 `gate=north` 改成 `gate=east`，儲存。在同一目錄執行以下三行；你會先看到檔案尚未暫存，再看到東門這行如何取代北門。

```powershell
git status
git diff -- route.txt
git add -- route.txt
```

仍在同一檔，把東門改成 `gate=west` 並儲存。先不要再選一次，預測現在三欄各是哪個門，再依序查看：

```powershell
git status --short
git diff --cached -- route.txt
git diff -- route.txt
```

短格式中 `MM route.txt` 表示同一檔既有已選的修改，也有後來未選的修改。帶 `--cached` 的輸出應從北門到東門；不帶的應從東門到西門。差異中的減號是舊行、加號是新行，不是計算數值。前一堂留下的草稿可能還有自己的未追蹤記號，沒有參與這兩次比較。macOS 或 Linux 的 bash 可在相同名稱的庫執行同樣指令。

也可以從反方向讀同一張圖：如果現在就提交，不再碰編輯器，哪一欄會變成新的歷史？答案是東門。若先重新選入再提交，留下的才是西門。先寫下這兩個預測，接著讓下一堂的實驗裁定，不必憑記憶投票。

## 常見錯誤

看見已暫存就以為稍後改的字也會跟進去，會讓提交少一段內容。反過來，看到未追蹤清單就把全部檔案一口氣選入，會讓沒有要分享的草稿混進來。先用檔名限定問題，再決定是要保留中間版本，還是以最新版本取代它。若差異進入分頁顯示，讀完按 `q` 返回，不用關掉終端機。

要讓別人核對暫存區，不只說「我有存檔」；分開指出哪個版本在磁碟上、哪個版本已選入下次提交。

## 小結

狀態看分類，差異看內容。把北、東、西三欄的對照存在庫外；把庫留在這個狀態，下一堂[〈Git add 與 commit〉](#/lesson/fd-git-02-commit)要親眼檢查不再暫存時，哪個門真的進了歷史。
