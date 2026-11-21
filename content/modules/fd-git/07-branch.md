---
id: fd-git-03-branch
module: fd-git
order: 7
title: 分支與合併
subtitle: 在分支試驗兩種寫法
status: ready
minutes: 30
level: 2
prereqs:
  - fd-git-06-ignore
objectives:
  - 建立隔離的試驗分支
  - 畫出合併前後的提交關係
tags:
  - git
  - branch
resources:
  - title: Git：切換分支
    url: https://git-scm.com/docs/git-switch
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Pro Git：分支、合併與衝突
    url: https://git-scm.com/book/zh-tw/v2/%E4%BD%BF%E7%94%A8-Git-%E5%88%86%E6%94%AF-%E5%88%86%E6%94%AF%E5%92%8C%E5%90%88%E4%BD%B5%E7%9A%84%E5%9F%BA%E6%9C%AC%E7%94%A8%E6%B3%95
    kind: book
    lang: zh-Hant
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-07-pointer
    prompt: "建立分支但尚未提交，兩個分支名指向哪裡？"
    answer: "都指向建立分支時的提交。"
    mcq:
      question: "從 main 建立並切到新分支，還沒做任何提交。兩個分支名目前指向什麼？"
      options:
        - "兩個內容相同的新提交"
        - "主線有提交，試驗線是空的"
        - "主線與試驗線各指向不同的父提交"
        - "同一提交"
      answer: 3
      explain: "建立的是新名稱，不是新快照。"
    interview:
      question: "切回主線後牌子消失，你會判斷為遺失嗎？"
      points:
        - "先查目前分支"
        - "看兩個名稱指向"
        - "到試驗提交核對檔案"
      answer: "不會先重做。我先看目前分支與歷史圖；牌子只在試驗線的提交裡，主線還沒接納。從對的分支合併後再讀檔，才知道結果是否正確。"
  - id: fd-git-07-direction
    prompt: "要讓 main 接納 sign-trial，合併時應在哪個分支？"
    answer: "先切到接收端 main，再合併 sign-trial。"
    mcq:
      question: "要把 sign-trial 上的成果合進 main，執行 merge 時應該在哪條分支？"
      options:
        - "sign-trial"
        - "任意分支都相同"
        - "main"
        - "一定要新建第三條分支"
      answer: 2
      explain: "merge 更新目前分支，不會交換兩個名稱。"
  - id: fd-git-07-forward
    prompt: "什麼情況下可用快轉接到試驗分支？"
    answer: "主線目前提交是試驗線目標提交的祖先。"
    mcq:
      question: "要讓 main 快轉到試驗分支的最新提交，兩者須符合哪個條件？"
      options:
        - "兩條線最終檔案內容相同"
        - "主線目前提交是目標提交的祖先"
        - "兩條線來自同一個儲存庫"
        - "只要兩邊沒有修改同一行"
      answer: 1
      explain: "內容不衝突仍可能已經分岔，不能只移動書籤。"
practice:
  - id: fd-git-07-p1
    title: "留下分支圖與可讀的指示牌"
    kind: hands-on
    minutes: 14
    steps:
      - "建立試驗線並提交左轉指示牌。"
      - "切回主線，記下兩個分支各指到哪。"
      - "在主線快轉，畫第二張圖並讀回牌子。"
    checks:
      - "合併前主線沒有 sign.txt。"
      - "合併後兩個名稱在同一提交。"
      - "讀回 turn=left。"
---

## 為什麼要學

入口已有定案，但指示牌的寫法還在試。把整個資料夾複製成「最後版 2」固然能試，之後卻得靠眼力找回有用的修改。分支（branch）能讓兩個名稱先指向同一份起點，再讓其中一個往前走。今天你只需要一個工作目錄，就能在兩種版本之間來回，最後清楚指出哪條線接納了指示牌。

## 核心概念

分支名像貼在提交上的活動書籤。新建分支並不複製一整套檔案；你在目前分支提交，這個名稱才移向新提交。切換（switch）讓工作目錄呈現目標分支的已提交內容。先前沒有選入的修改並不專屬某條線，可能跟著切換，也可能讓 Git 為防覆寫而拒絕；因此試驗前先確認受追蹤檔案乾淨，不要拿分支當暫存未完成工作的魔術袋。

合併（merge）有方向：先切換到要接收結果的分支，再指定要接進來的分支。如果接收端沒有另外往前走，原本的位置是新位置的祖先，書籤可以直接前移，稱為快轉（fast-forward）。這次刻意只允許快轉，方便把結果畫成一條線。若兩邊各走一步，就不再符合這個條件；之後在[〈Git 合併衝突〉](#/lesson/fd-git-04-conflict)會用另一個例子說明如何整合。

## 範例：一面先在試驗線出現的牌子

在 `C:\dev\stackway-lab\trail-notes`，確認目前是 `main`，且狀態除了原有未追蹤草稿外，沒有未提交的修改。先記下主線短編號，然後由此建立並切換到尚未使用的分支。

```powershell
git branch --show-current
git status --short
git log -1 --oneline
git switch -c sign-trial
```

用編輯器在庫根新增 `sign.txt`，僅寫 `turn=left` 並儲存。在同一目錄執行下列指令。切回主線後先停下來：到檔案總管重新整理，指示牌應不在清單上；再看圖，兩個分支名還貼在不同提交。

```powershell
git add -- sign.txt
git commit -m "Add a left turn sign"
git switch main
git log --oneline --graph --decorate --all -5
```

確定要接納左轉方案，才在主線執行：

```powershell
git merge --ff-only sign-trial
git log -1 --oneline --decorate
git show HEAD:sign.txt
```

現在兩個名字應指向同一筆新提交，檔案也回到工作目錄；快轉沒有為同一塊牌子製造第二筆相同內容的提交。macOS 或 Linux 在相同的練習庫可照用以上 Git 指令。把合併前後的箭頭畫在庫外，用提交編號而不是檔名當節點。

圖上若只畫檔案從無到有，你還不能解釋主線何時開始看見它。替兩張圖都加一個小箭頭標出目前分支；切換移的是你看的位置，快轉移的是接收分支的書籤，兩件事會立即分開。

## 常見錯誤

如果在試驗分支上合併主線，不等於主線接納試驗；先查目前分支再下指令。也別因為檔案暫時不見就重新建立它，應先問目前看到的是哪條分支。若快轉被拒絕，代表線路關係與範例不同，先讀圖，別強制移動書籤。

## 小結

隔離的是提交路線，不是另一套磁碟。試驗線留下改動，接收線先不動；確認方向與祖先關係後，主線才可以用快轉取得那份結果。
