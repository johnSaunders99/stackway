---
id: fd-git-02-start
module: fd-git
order: 2
title: Git init 與 clone
subtitle: 空資料夾與既有作品怎麼起步
status: ready
minutes: 25
level: 2
prereqs:
  - fd-git-01-install
objectives:
  - 區分建立新儲存庫與複製歷史
  - 從本機練習庫 clone 到新位置，核對原始檔仍在
tags:
  - git
  - start
resources:
  - title: Git：init 指令
    url: https://git-scm.com/docs/git-init
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Git：clone 指令
    url: https://git-scm.com/docs/git-clone
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-02-origin
    prompt: "手上有既有儲存庫的路徑，怎麼取得含歷史的工作副本？"
    answer: "在父目錄 clone 到新的並排目錄。"
    mcq:
      question: "已有一份本機儲存庫，哪個做法會把原有提交帶進新工作副本？"
      options:
        - "只複製畫面上的文字檔"
        - "在空目錄執行 init"
        - "clone 來源到新目錄"
        - "只新增同名分支"
      answer: 2
      explain: "初始化只建立管理資料；一般文字檔沒有提交關係。"
    interview:
      question: "有人說副本缺了草稿就是複製失敗，你會查什麼？"
      points:
        - "核對兩端目前提交編號"
        - "看來源草稿是否未追蹤"
        - "分清工作檔案與提交"
      answer: "我先比對兩邊目前的提交，再看來源的狀態。如果草稿只有未追蹤記號，副本沒有它正是預期結果，我不會用重複複製來修。"
  - id: fd-git-02-untracked
    prompt: "來源裡未追蹤的草稿會出現在普通 clone 的工作目錄嗎？"
    answer: "不會；它沒有進入來源分支的提交。"
    mcq:
      question: "在來源庫建立 rough.txt 卻沒有提交；普通 clone 後，草稿會在副本裡嗎？"
      options:
        - "會，只要存過檔"
        - "不會，草稿未提交"
        - "會，只要來源在本機"
        - "會，只要草稿在儲存庫根目錄"
      answer: 1
      explain: "本機路徑也依儲存庫歷史展開檔案，不是完整複製工作目錄。"
  - id: fd-git-02-proof
    prompt: "怎麼核對兩個工作副本目前起於同一筆提交？"
    answer: "比對兩邊目前提交的識別碼。"
    mcq:
      question: "兩個目錄各有一份工作副本，怎麼判斷它們目前檢出同一筆提交？"
      options:
        - "核對目前提交編號"
        - "比較目錄名稱"
        - "比較作者設定"
        - "比較開啟檔案的時間"
      answer: 0
      explain: "名稱、時間與作者可能一樣，卻不是同一筆快照。"
practice:
  - id: fd-git-02-p1
    title: "做出一份可核對的本機副本"
    kind: hands-on
    minutes: 12
    steps:
      - "在來源提交 route.txt，留下未提交的 rough.txt。"
      - "從父目錄 clone 到新的同層資料夾。"
      - "打開兩邊檔案並記下兩端短編號。"
    checks:
      - "兩邊都有北門那一行。"
      - "兩端最新提交編號相同。"
      - "只有來源有 rough.txt。"
---

## 為什麼要學

桌上有兩種起點：一張白紙，或一本已經寫過幾頁的筆記。前者要替它開一本帳，後者要連同先前幾頁一起帶走。初始化（init）與複製儲存庫（clone）正好對應這個差別。今天的驗收不是看到兩個同名檔案，而是能在兩個位置讀到同一筆提交，還能證明一邊尚未提交的草稿沒有跟過去。

## 核心概念

在自己的新目錄執行 `git init` 是建立管理資料，不是替現有檔案拍照。就算裡面原本有一頁文字，在你選入並提交前，歷史仍是空的。`git clone 來源 目的地` 則從已有的庫取得歷史，並在新位置展開預設分支的已提交檔案。來源可以是同一臺電腦上的路徑，不一定是網站；目的地用新的名稱最容易核對。不要先在目的地初始化，再想辦法把另一份歷史倒進去。

為了讓差別看得見，我們替上堂的空庫留下第一頁。`add` 把指定檔案當下的內容選入暫存區（staging area），`commit` 把已選的版本記下來。之後在[〈Git 狀態與暫存區〉](#/lesson/fd-git-01-snapshot)與[〈Git add 與 commit〉](#/lesson/fd-git-02-commit)會分別拆開觀察；這裡只用它們製作一個有歷史的起點。上堂的虛構作者要留在來源庫。

## 範例：複製一頁，留下一張草稿

在 `C:\dev\stackway-lab\trail-notes` 用編輯器新增 `route.txt`，寫一行 `gate=north` 後儲存。於該目錄執行：

```powershell
git add -- route.txt
git commit -m "Record the north gate"
git log -1 --oneline
```

把短編號記下來。再用編輯器新增 `rough.txt`，寫下 `draft` 並儲存，但不要選入提交。現在另在上一層 `C:\dev\stackway-lab` 開終端機。確認 `trail-copy` 不存在，才執行：

```powershell
git clone trail-notes trail-copy
git -C trail-copy log -1 --oneline
git -C trail-copy status --short
git -C trail-notes status --short
```

`-C` 的意思是「讓這次 Git 到指定目錄工作」，不會搬動終端機所在位置。在兩個資料夾打開 `route.txt`，內容都應該是北門；來源多了一張草稿，副本卻沒有。不是複製漏檔，而是你要的來源是已提交的歷史。兩處最後的提交編號相同，狀態清單卻不同，這兩個觀察可以同時成立。macOS 或 Linux 在對應的練習父目錄使用同一組指令。

做一個小判斷：若你的目的只是把目前的草稿交給另一臺電腦，取得歷史副本並不會替你交付那份草稿；若目的是接手一份已有來歷的作品，只複製看得見的文字又會丟失來歷。先把想帶走的東西說成「檔案」或「已提交的版本」，就比較不會選錯起手式。

## 常見錯誤

在來源庫裡面建立副本容易把一個庫套進另一個庫；先回父目錄再取得兩個並排的資料夾。若來源沒有第一筆提交，複製空庫也不會變出檔案；先回來源核對歷史。複製不等於搬家，所以不用剪下原始資料夾，也不必為了重做而清空既有目的地，換一個空名稱就好。

## 小結

新作品從初始化起步；接手既有歷史用複製。保留兩個位置，下一堂[〈Git 狀態與暫存區〉](#/lesson/fd-git-01-snapshot)繼續在原來的 `trail-notes` 比對工作檔案與已提交的內容，不在副本裡混著做。
