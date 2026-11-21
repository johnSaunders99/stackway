---
id: fd-git-recovery-02-revert
module: fd-git-recovery
order: 2
title: Git revert
subtitle: 已分享的錯誤留一筆反向紀錄
status: ready
minutes: 25
level: 3
prereqs:
  - fd-git-recovery-01-restore
objectives:
  - 用公開歷史的例子解釋反向提交
  - 檢查他人已依賴的原提交仍可找到
tags:
  - git-recovery
  - revert
resources:
  - title: Git：revert 指令
    url: https://git-scm.com/docs/git-revert
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 閱讀說明與中止操作，只處理普通提交。
concepts:
  - id: fd-git-recovery-02-revert-inverse
    prompt: revert 對已分享的提交做了什麼？
    answer: 新增一筆嘗試抵銷指定差異的提交，不改寫原提交。
    mcq:
      question: 改時間的提交已分享，還需讓同事能引用原識別碼，應怎麼做？
      options:
        - 把主線移回父提交並強制同步
        - 新增反向提交
        - 只還原未暫存的工作檔就算修完
        - 移除同事的本機分支
      answer: 1
      explain: 反向提交保留原有祖先；只改工作檔不會留下共用的修正紀錄。
  - id: fd-git-recovery-02-revert-scope
    prompt: 撤銷較早的一筆提交，會一併撤銷所有較晚的提交嗎？
    answer: 不會。它反套指定差異；不相干的後續改動可留下。
    mcq:
      question: 改時間後新增了另一個檔案記教室，撤銷改時間後應看到什麼？
      options:
        - 時間復原且教室仍在
        - 整份目錄回到教室出現前
        - 只有教室被移除
        - 舊時間提交的識別碼改變
      answer: 0
      explain: 目標是改時間的差異，不是拿它的父快照取代目前整棵目錄。
    interview:
      question: 課表時間改錯已分享，後面同事又加了教室。你會怎麼修、怎麼驗？
      points:
        - 鎖定改時間的提交
        - 新增反向提交而非重寫
        - 查時間、教室與舊識別碼
      answer: 我會先看那筆提交究竟碰過什麼，從乾淨工作區反向套用它。最後查的不只時間，也會讀教室檔，並確認同事原來引用的那筆提交還在歷史裡。
  - id: fd-git-recovery-02-revert-conflict
    prompt: 反向套用與後續編輯衝突時，無法決定正確內容怎麼辦？
    answer: 先查狀態與需求；若不繼續，可在進行中的 revert 使用 --abort。
    mcq:
      question: 同一行後來又改過，revert 中途衝突。哪個動作能回到這次嘗試前？
      options:
        - 再對 HEAD 做一次 revert
        - 直接推送
        - 忽略狀態繼續改別檔
        - git revert --abort
      answer: 3
      explain: 中止這一輪才是復原本次操作；再發起一輪不是解決現有衝突。
practice:
  - id: fd-git-recovery-02-revert-p1
    title: 交出一張可追溯的更正單
    kind: hands-on
    minutes: 11
    steps:
      - 從種子庫複製乾淨副本，加一筆教室提交
      - 標出要反向的時間提交，執行範例
      - 筆記留下舊提交和更正提交的識別碼，附上兩個檔案內容
    checks:
      - 歷史共有 4 筆，並非退成 1 筆
      - plan.txt 是 time=20 且 room.txt 是 room=blue
---

## 為什麼要學：改錯的是昨天那一筆
共同課表有兩次變更：先把時間從 20 改成 30，接著另一筆補上教室。後來才發現時間不該改。若拿昨天的資料夾覆蓋今天的版本，教室也會消失。真正要撤銷的是「改時間」這個決定，而不是昨天之後的每件事。在多人已拿到的分支上，更不能假設所有人都會跟你一起倒帶。

## 核心概念：用一筆新提交抵銷一筆舊變更
反向提交（revert）先看目標提交（commit）相對於父提交改了什麼，再嘗試把這份差異反過來套到目前位置。成功後分支尖端多一筆提交，原本的識別碼沒有換掉，別人對舊紀錄的引用仍然成立。這與上一堂把草稿換成暫存內容不同：那是單檔操作，沒有新增任何歷史。

先寫下預期：最後的時間是 20，而且新的教室檔還在。這裡刻意把教室寫在另一個檔案，讓你能分清「抵銷指定變更」和「回復整棵目錄」的差別。不需要多人帳號或網路，只要在私人副本上假設時間提交已經分享，就能測這個選擇。

## 範例：晚一筆提交還留得住嗎？
在 `C:\dev\stackway-lab` 開 PowerShell；macOS 或 Linux 則從含有上一堂 `recovery-seed` 的練習目錄開始。確認目的地 `revert-lab` 不存在，用下列指令複製種子庫，複製成功才進入。後續所有操作都只在新副本內；不必推送。`git status --short` 最初應沒有輸出。

```bash
git clone --no-hardlinks recovery-seed revert-lab
cd revert-lab
git log --oneline -2
git status --short
```

先依[〈Git 安裝與設定〉](#/lesson/fd-git-01-install)確認新副本已有提交用的本機身分。用編輯器在 `revert-lab` 新建 `room.txt`，寫入 `room=blue` 並儲存。以下先加入不相干的教室，才撤銷前一筆。`HEAD~1` 表示目前提交的第一個父提交，並非永久等於「改時間」；一定要在新增教室後，用紀錄核對第二列標題是 `Set practice time` 才執行反向提交。

```bash
git add -- room.txt
git commit -m "Record room"
git log --oneline -3
git revert --no-edit HEAD~1
git log --oneline -4
git show HEAD:plan.txt
git show HEAD:room.txt
```

`--no-edit` 是接受預設提交說明，不是略過建立提交。由新往舊應讀到反向、教室、改時間、起點這 4 筆。若只比最前和最末的時間，兩者看起來一樣；但教室從無到有，證明最後一版並不等於最初的快照。

要核對這次更正實際碰了哪些檔，可以在反向提交成功後看 `git diff --name-only HEAD~1 HEAD`。這兩個位置現在指的是更正前與更正後；輸出應只有課表檔，不含教室檔。把這個結果與兩份檔案的內容一起看，就知道「教室還在」不是更正時把它刪掉又補回來的巧合。

## 常見錯誤
若後面有人把同一行的 30 改成 45，反向套用可能衝突（conflict）：工具無法代替人決定該保留哪個需求。停下來看 `git status`，問清目前正確時間；若尚未確定，就在進行中的反向操作用 `git revert --abort` 回到嘗試前。本例沒有衝突，不需要執行中止指令。工作目錄若有自己的修改，不要靠強制覆蓋清場，換乾淨副本再做。

## 小結
在筆記留三項證據：原本改時間的識別碼、反向提交的識別碼、仍存在的教室。第一個讓同事查得到當時的決定，第二個說明何時反悔，第三個證明你沒有順手刪掉別人的工作。這才是「已修正且歷史可追溯」。
