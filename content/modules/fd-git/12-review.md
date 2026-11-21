---
id: fd-git-05-review
module: fd-git
order: 12
title: GitHub 拉取請求
subtitle: 讓同伴能審查一個小改動
status: ready
minutes: 35
level: 2
prereqs:
  - fd-git-11-sshkey
objectives:
  - 寫出含目的與驗證方式的變更說明
  - 以本機差異模擬一次 GitHub 審查
tags:
  - git
  - review
resources:
  - title: GitHub：以提案分支協作
    url: https://docs.github.com/en/get-started/using-github/github-flow
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-12-base
    prompt: "PR 的 base 分支是什麼？"
    answer: "若通過審查，預計接收變更的分支。"
    mcq:
      question: "要把提案分支的修改接進 main，PR 的 base 指的是哪一側？"
      options:
        - "預計接收變更的線"
        - "提出改動的線"
        - "永遠是最近建立的線"
        - "只能是遠端的第一條線"
      answer: 0
      explain: "base 表示合併目標，不由建立時間決定。"
    interview:
      question: "給你一個只有一行差異的 PR，你還希望看到什麼？"
      points:
        - "交代修改目的"
        - "確認沒有夾帶其他檔案"
        - "可重現的舊新值檢查"
      answer: "我想知道多 2 分鐘解決哪個排程問題。我會先看檔名清單，再用說明裡的指令讀兩端值；這能驗證設定，但不能證明真的走過那條路。"
  - id: fd-git-12-three
    prompt: "git diff main...pace-review 從哪裡比到哪裡？"
    answer: "從共同祖先比到右側的 pace-review。"
    mcq:
      question: "執行 git diff main...pace-review 時，比較的起點與終點是什麼？"
      options:
        - "提案分支到工作檔"
        - "暫存區到基底"
        - "提案分支到共同祖先"
        - "共同祖先到提案分支"
      answer: 3
      explain: "三點右側是要檢視的提案，不是在比較暫存區。"
  - id: fd-git-12-evidence
    prompt: "什麼樣的驗證說明能讓審查者重做？"
    answer: "列出可執行的查核方式、比較端點與預期或實際結果。"
    mcq:
      question: "審查者要驗證分鐘數從 22 改為 24。哪份 PR 筆記最能讓對方獨立重做檢查？"
      options:
        - "只寫已完成"
        - "只附變更行數"
        - "列明兩個版本與核對的值"
        - "只顯示分支名稱"
      answer: 2
      explain: "成功訊息與行數都沒有告訴讀者應該讀到哪個值。"
practice:
  - id: fd-git-12-p1
    title: "交付一份可重做的本機 PR 說明"
    kind: hands-on
    minutes: 15
    steps:
      - "在提案線提交 24 分鐘規則，不合併。"
      - "在庫外寫 review-note.md，交代目的、範圍、驗證。"
      - "只靠筆記重做一次，填上查到的兩個值。"
    checks:
      - "基底仍是 22，提案是 24。"
      - "差異清單只有 pace.txt。"
      - "說明區分檔案驗證與未實測的假設。"
---

## 為什麼要學

一行數字由 22 改成 24，任何人都看得出「改了 2 分鐘」。審查者真正想知道的是：為什麼要多給 2 分鐘？其他路段會不會也受影響？拉取請求（pull request，PR）把一條分支的變更整理成可以討論、驗證、再決定是否合併的提案。它不是另一種拼法的 `git pull`，也不是一發出就自動改掉主線。這堂只在本機模擬審查，交出一份能讓別人重做驗證的說明。

## 核心概念

提案有兩端：基底分支（base）是預計接收變更的路線，提案分支（head）是你準備交付的路線。站在審查者的位置看，第一個問題是「這個提案從共同起點帶來了哪些改動」，而不是誰的工作目錄比較新。`git diff main...pace-review` 的三個點表示從這兩條線的共同祖先比到右側提案分支。此處基底沒有再前進，結果看起來和兩端直接相減一樣；保留三點寫法是為了說清楚審查範圍。

好的說明最少讓人找得到三件事：原本遇到的問題、這次明確更動的範圍、怎麼驗收。文字不要只是逐行翻譯差異。看得見的數字可以直接讀，讀者更需要知道為什麼不是維持原值，以及怎樣確認別的規則沒有一起被帶進去。若有尚未實地證實的假設，標成假設，不要用一個檔案檢查冒充現場測量。

## 範例：本機交出一份可審的分鐘調整

在 `C:\dev\stackway-lab\trail-notes` 確認已完成拉取、主線 `pace.txt` 為 `minutes=22`，並用狀態確認沒有其他已暫存變更。從這條主線建立尚未使用的試驗分支：

```powershell
git switch main
git switch -c pace-review
```

情境是「本次練習排程要另外保留 2 分鐘看路標」，不是實測步行時間。用編輯器只把 `pace.txt` 改為 `minutes=24` 並儲存。於庫根執行，bash 也可照用：

```powershell
git add -- pace.txt
git commit -m "Reserve two minutes to read the trail sign"
git diff --name-only main...pace-review
git diff main...pace-review -- pace.txt
git show main:pace.txt
git show pace-review:pace.txt
```

在庫外建立 `review-note.md`。第一段寫保留時間的情境；第二段界定只改一份規則，沒有改入口或指示牌；第三段記錄上面查到的實際舊值、新值與查核指令。請換到審查者的角度，只看這張說明再重做一次。若基底和提案選反，讀到的修改方向就不會符合說明，發現這件事比多寫一句「已測試」有價值。

好用的審查問題不是「你確定嗎」，而是「用哪個版本與哪個檔案，我能再得到同一組數字？」

## 常見錯誤

只寫「看起來正常」沒有可重現的判準；只看差異總行數又無法排除混進一行無關修改。先查檔名清單再讀內容。真正使用 GitHub 時，先推送提案分支，再選對基底與提案、填說明並要求審查；收到意見時可在同一條提案分支補提交，無須為每次修訂另開一個請求。

## 小結

留下提案分支和審查筆記，不必真的上傳、開 PR 或合併。能在不動主線的前提下說清目的、範圍與證據，就是這次本機審查的交付標準。
