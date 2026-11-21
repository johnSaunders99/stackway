---
id: fd-git-recovery-03-reset
module: fd-git-recovery
order: 3
title: Git reset 與分支指標
subtitle: 暫存錯了和提交錯了不能混為一談
status: ready
minutes: 30
level: 3
prereqs:
  - fd-git-recovery-02-revert
objectives:
  - 分別追蹤分支、暫存區與工作目錄
  - 用有備份的拋棄式副本比較 soft 與 mixed，不改寫共用歷史
tags:
  - git-recovery
  - reset
resources:
  - title: Git：reset 指令
    url: https://git-scm.com/docs/git-reset
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 比較提交形式的 soft 與 mixed。
concepts:
  - id: fd-git-recovery-03-reset-soft
    prompt: soft reset 在具名分支上只移動哪一層？
    answer: 分支尖端移到目標提交；暫存區與工作目錄維持原樣。
    mcq:
      question: 2 筆提交的時間依序為 20、30，從乾淨的 30 soft reset 到 20。尖端、暫存、工作檔依序是？
      options:
        - 20、20、30
        - 20、20、20
        - 20、30、30
        - 30、20、30
      answer: 2
      explain: 只有書籤移動；原本準備的內容與磁碟文字都留下。
  - id: fd-git-recovery-03-reset-mixed
    prompt: mixed reset 與 soft reset 相比多更新什麼？
    answer: 還會把暫存區更新成目標提交的內容。
    mcq:
      question: 要把上一筆私人提交拆開重新挑檔，想留下磁碟文字但清回目標暫存內容，選哪種模式？
      options:
        - soft
        - mixed
        - hard
        - 反向提交
      answer: 1
      explain: mixed 留工作檔，soft 還留原暫存；hard 則有覆寫工作檔的風險。
    interview:
      question: 同樣是退一筆，兩份副本的磁碟檔案都沒變，怎麼證明 reset 效果不同？
      points:
        - 查尖端位置
        - 比對暫存內容
        - 分別看已暫存與未暫存差異
      answer: 我會先確認兩份尖端都到同一個父提交，再用 git show :plan.txt 查暫存。soft 那份仍能直接提交差異，mixed 那份要重新挑選，不能只靠編輯器畫面判斷。
  - id: fd-git-recovery-03-reset-path
    prompt: 只想把單檔移出暫存，應不應移動分支？
    answer: 不用，指定路徑取消暫存即可，例如 git restore --staged -- plan.txt。
    mcq:
      question: 哪個需求不必退回任何提交？
      options:
        - 讓已暫存的單檔回到尚未暫存
        - 把私人分支指到其父提交
        - 在另一個起點重播私人提交
        - 替共用歷史添加反向提交
      answer: 0
      explain: 取消暫存只調整待交清單；不是搬動書籤、重播或建立提交。
practice:
  - id: fd-git-recovery-03-reset-p1
    title: 畫一張 2 列 3 欄的重設對照
    kind: hands-on
    minutes: 14
    steps:
      - 核對種子庫兩筆提交，複製 soft-lab 與 mixed-lab
      - 照範例各重設一次
      - 將尖端、暫存、工作檔數字和簡短狀態收進筆記
    checks:
      - 2 列分別為 20／30／30 與 20／20／30
      - M 所在欄不同，種子庫仍有 2 筆提交
---

## 為什麼要學：想重寫說明，不等於想丟掉文字
你剛做完一筆尚未分享的提交，才發現應該拆成兩筆。時間的數字寫對了，不想重打；只是想回到「都已暫存」或「還沒挑要送出的檔案」那一刻。這是調整私人分支，不是上一堂對已分享內容加一筆更正。先問有沒有人拿過這段歷史，再問希望檔案留在哪一層。

## 核心概念：搬書籤、換清單、改紙上的字
分支（branch）像記錄目前尖端的書籤；暫存區（index）像下次要交的清單；工作目錄（working tree）是手上正在編輯的版本。在一般已切到具名分支的情況，`git reset 模式 提交` 把該分支移到指定提交。`--soft` 只搬書籤；`--mixed` 還會把暫存區換成目標提交的內容，但不重寫手上的檔案。省略模式時，這個提交形式預設用 mixed。

只是不小心 `add` 了某個檔？用前面學過的 `git restore --staged -- 檔名`，不需要搬分支。相似的 `git reset -- 檔名` 是按路徑更新暫存區，與這堂「給一個提交」的用法不同。兩者不能只靠記住第一個動詞區分，要看後面指定的是路徑還是目的地。

## 範例：用 2 份相同起點作對照
在 PowerShell 的 `C:\dev\stackway-lab`，或其他系統上含有 `recovery-seed` 的練習目錄，確認 `soft-lab`、`mixed-lab` 都還不存在。種子庫保留原始兩筆提交當備份。每次複製都會做出一條自己的本機分支，碰不到種子庫內的工作檔。逐行執行，若複製失敗就停止，不要沿用同名資料夾。

```bash
git clone --no-hardlinks recovery-seed soft-lab
git clone --no-hardlinks recovery-seed mixed-lab
git -C soft-lab log --oneline -2
git -C mixed-lab log --oneline -2
git -C soft-lab reset --soft HEAD~1
git -C mixed-lab reset --mixed HEAD~1
git -C soft-lab status --short
git -C mixed-lab status --short
```

`-C` 指定在哪個目錄做事，省去來回切換；先確認兩份紀錄都是「時間 20，接著時間 30」。移動後兩份分支的尖端都變成 20，但用編輯器打開各自的 `plan.txt` 都仍讀到 30。差別在畫面上那個不起眼的空格：簡短狀態的左欄是暫存差異，右欄是工作檔差異。soft 的 M 在左邊，mixed 的 M 在右邊。

```bash
git -C soft-lab diff --cached -- plan.txt
git -C mixed-lab diff -- plan.txt
git -C soft-lab show :plan.txt
git -C mixed-lab show :plan.txt
```

可以把兩個差異指令交叉做一次：在第一份看尚未暫存的變動，預期沒有輸出；在第二份看已暫存的變動，也預期沒有輸出。兩個空白並非沒有做事，而是查詢的那兩層剛好相等。配合另外兩份有文字的輸出，才足以還原整個三層模型。若兩個副本不是從同一筆開始，就先停下來核對起點，不要比較。

## 常見錯誤
只看磁碟上的檔案會以為兩次沒有差別；只看歷史則會以為改成 30 的工作已經丟了。分別看暫存內容與兩種差異，才能說明下次直接提交會收進什麼。另一個模式 `--hard` 還會改寫工作目錄，可能毀掉未提交的文字；本實驗不需要它，也不要拿共用分支試這些指令。

## 小結
把每份副本寫成「尖端、暫存、磁碟」3 個數字，2 列只有中間欄不一樣。如果你要的是重新挑選此次提交的檔案，選會清出暫存變更的模式；如果連暫存清單都希望保持原樣，則只移動書籤。
