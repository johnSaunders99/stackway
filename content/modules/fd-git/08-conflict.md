---
id: fd-git-04-conflict
module: fd-git
order: 8
title: Git 合併衝突
subtitle: 讀懂兩份修改為何衝突
status: ready
minutes: 30
level: 2
prereqs:
  - fd-git-03-branch
objectives:
  - 在練習副本指出衝突兩側的意圖
  - 合併後比對實際結果而非只消除標記
tags:
  - git
  - merge
resources:
  - title: Git：合併與衝突處理
    url: https://git-scm.com/docs/git-merge
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
  - id: fd-git-08-sides
    prompt: "一般 merge 的衝突標記中，HEAD 那一段來自哪裡？"
    answer: "目前接收合併的分支。"
    mcq:
      question: "合併衝突檔中，從 <<<<<<< HEAD 到分隔線的文字來自哪一側？"
      options:
        - "目前檢出的分支"
        - "併入的分支"
        - "一律是較新的提交"
        - "一定是共同祖先"
      answer: 0
      explain: "標記描述方向，不按時間或字數排名。"
    interview:
      question: "合併工具提供接受左邊或右邊，你會怎麼選？"
      points:
        - "先查兩邊要改進什麼"
        - "編寫可同時滿足需求的結果"
        - "讀回內容逐項驗收"
      answer: "我不先選按鈕。我對照兩筆改動，這裡橋是位置，上坡是警告；我合成一句指示，選入後再讀回，確認兩個線索都還在。"
  - id: fd-git-08-resolve
    prompt: "改好衝突檔後，怎麼告訴 Git 已完成內容選擇？"
    answer: "儲存並用 git add 選入解好的檔案。"
    mcq:
      question: "你已手動整合衝突檔並存檔。哪一步把解好的版本選入，供稍後提交？"
      options:
        - "只關閉編輯器"
        - "再執行同一個 merge"
        - "重新建立分支"
        - "儲存後 git add 該檔"
      answer: 3
      explain: "刪標記與儲存只改工作檔，還要選入。"
  - id: fd-git-08-verify
    prompt: "如何驗收本例除了沒有標記，還保住兩邊意圖？"
    answer: "讀回合併提交的牌子，逐項核對橋與坡度。"
    mcq:
      question: "兩個分支分別補上「橋邊左轉」與「轉後上坡」。合併之後哪種證據能證明兩項提醒都在？"
      options:
        - "只看退出碼"
        - "只看分支數量"
        - "核對橋與上坡兩個線索"
        - "只看檔案行數"
      answer: 2
      explain: "成功提交一行也可能只剩一個線索。"
practice:
  - id: fd-git-08-p1
    title: "保留一筆有兩個父提交的解答"
    kind: hands-on
    minutes: 15
    steps:
      - "在新副本按範例讓兩條線各改同一行。"
      - "解釋兩段文字的意圖，編成一句並提交。"
      - "記下兩個父編號與讀回的牌子。"
    checks:
      - "發生衝突的是 sign.txt。"
      - "最終只 1 行，無衝突標記且有兩個線索。"
      - "新的合併提交列出兩個父編號。"
---

## 為什麼要學

「左轉」太模糊了。一份修訂補上在哪裡轉，另一份補上轉彎後的坡度。兩邊都改同一行，若只保留字數較多的一邊，另一個重要提醒就不見了。合併衝突（merge conflict）是 Git 無法替你判斷兩個意圖要怎麼共存，不是有人把儲存庫弄壞。本堂不在原本的主線試錯，另做一個可保留的本機副本。

## 核心概念

Git 可以拿共同祖先（merge base）的版本與兩邊的新版本比較。不同地方各自修改時常能自動整合；同一行被改成兩種內容時，就可能留下衝突標記。一般合併下，上段從 `<<<<<<< HEAD` 開始，是目前分支的版本；`=======` 是分隔；下段到 `>>>>>>>` 為止，是要併入的版本。這些符號不是程式語法，不要把它們當成最終文字。

解決衝突分三步：先找兩邊原本想保住的行為，再把檔案編成你真正要交付的版本，最後選入並完成合併提交。Git 知道你標記哪個檔「已解決」，卻不知道指示是否正確。比起把左右兩行照單全收，一句人看得懂、能同時驗收兩個條件的指示更有意義。

## 範例：在副本合成 2 個線索

在 `C:\dev\stackway-lab` 確認目的名稱未使用，執行下列指令。副本有提交歷史，但不繼承來源庫的本機作者設定，因此在副本內重新指定虛構值。後續一律在 `sign-merge` 的終端機操作。

```powershell
git clone trail-notes sign-merge
cd sign-merge
git config --local user.name "Practice Robot"
git config --local user.email "practice@example.invalid"
git switch -c landmark
```

把 `sign.txt` 唯一的那行改成 `turn=left at bridge`，儲存後選入並提交，再回主線：

```powershell
git add -- sign.txt
git commit -m "Identify the bridge turn"
git switch main
```

把主線的同一行改為 `turn=left uphill`，儲存。執行下面這段，最後一行回報衝突是本次刻意設計的觀察點；此時應停下來檢查，而不是再執行一次合併。

```powershell
git add -- sign.txt
git commit -m "Warn about the uphill section"
git merge landmark
```

在編輯器看兩段標記，將整份檔案改為單行 `turn=left at bridge, then uphill`；存檔後逐行執行：

```powershell
git add -- sign.txt
git diff --cached -- sign.txt
git commit -m "Keep both the bridge landmark and slope warning"
git show HEAD:sign.txt
git log -1 --oneline --parents
```

macOS 或 Linux 可在對應父目錄用相同指令。最後一行應列出兩個父提交；讀回的牌子則要同時提到橋與上坡。一項是歷史證據，另一項才證明人真的拿到完整指示。

若想更仔細地審查，可在選入前分別讀取主線與地標分支中的牌子，先不看衝突標記，只用日常語言各寫一句需求。回頭檢查合成的那一行，應該能分別指出哪幾個字滿足哪一條需求；單看最後那筆提交的說明則沒有這份保證。

## 常見錯誤

直接按「接受目前修改」可能讓橋的位置消失；只勾選接受兩邊也可能產生兩個互相競爭的欄位。若還沒準備好決定，在本次由乾淨狀態開始的練習合併中，可用 `git merge --abort` 放棄尚未完成的合併，再查狀態。不要在混有其他工作或已經提交後，把它當成一般復原鍵。

## 小結

完成的定義不是畫面上不再有紅字，而是最終內容保住兩個意圖，且這筆整合確實連回兩側。保留副本與結果，下一堂[〈Git 遠端與 push〉](#/lesson/fd-git-09-remote)回原來的庫練習分享。
