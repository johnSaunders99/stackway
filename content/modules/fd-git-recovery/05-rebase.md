---
id: fd-git-recovery-05-rebase
module: fd-git-recovery
order: 5
title: Git rebase 基礎
subtitle: 把自己的改動接在新起點
status: ready
minutes: 30
level: 3
prereqs:
  - fd-git-recovery-04-reflog
objectives:
  - 畫出 rebase 前後的提交識別碼
  - 用私人練習分支比較 merge，不改寫已分享的歷史
tags:
  - git-recovery
  - rebase
resources:
  - title: Git：rebase 指令
    url: https://git-scm.com/docs/git-rebase
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 看基本提交圖與重播過程。
concepts:
  - id: fd-git-recovery-05-rebase-parent
    prompt: 為什麼重播後的提交常有新識別碼？
    answer: 提交身分包含父提交資訊；相同差異若接上不同父提交，會形成不同提交。
    mcq:
      question: 教室那一行沒變，重播後識別碼卻變了，本例最直接的原因是？
      options:
        - 父提交從舊起點變成日期提交
        - 房間名稱重新編碼
        - 檔案一定產生衝突
        - Git 隨機刷新全部舊識別碼
      answer: 0
      explain: 即使最後檔案文字或標題一樣，新的父關係已不同。
  - id: fd-git-recovery-05-rebase-merge
    prompt: 兩線已分岔時，普通合併如何保留來路？
    answer: 以有兩個父提交的新提交接起兩線，原提交不必重寫。
    mcq:
      question: 哪個檢查能分辨本例的合併尖端與重播尖端？
      options:
        - 只比較 room.txt 的文字
        - 只計算工作檔數量
        - 只看最後一次開檔時間
        - 查看各尖端的父提交識別碼數量
      answer: 3
      explain: 兩者的檔案樹可以完全相同，但本例合併尖端有兩個父提交。
    interview:
      question: 兩個分支最終 diff 為空，為什麼整合方式仍然值得討論？
      points:
        - 分清檔案樹與提交圖
        - 比較父關係
        - 依是否分享決定整合方式
      answer: 我會把兩張提交圖畫給同事看。檔案相同只說明結果一致；合併保留兩條來路，重播把我的改動接上新父提交。如果有人已經從舊提交開工，我不會擅自要大家換起點。
  - id: fd-git-recovery-05-rebase-shared
    prompt: 選擇重播前，要確認誰依賴原提交？
    answer: 確認是否只是自己的未分享工作；別人已據此開發就不能單方面重寫。
    mcq:
      question: 團隊已從舊尖端分支，哪個預設處理最不影響他人的歷史？
      options:
        - 重播後要求所有人無條件覆蓋
        - 刪掉團隊引用的分支再說
        - 保留舊提交，用合併整合新的主線
        - 只更換提交標題當作已整合
      answer: 2
      explain: 合併保留兩邊原識別碼；擅自重寫迫使協作者調整起點。
practice:
  - id: fd-git-recovery-05-rebase-p1
    title: 保存兩張整合圖
    kind: hands-on
    minutes: 15
    steps:
      - 建立 integrate-lab，在 topic 加教室、main 加日期
      - 留 original-topic，分別做合併與重播
      - 抄圖圈出兩筆 Add room，再比對尖端差異與父提交
    checks:
      - merge-demo 與 topic 的檔案差異為空
      - 合併尖端有 2 個父提交，重播尖端有 1 個
      - 原教室提交仍由 original-topic 指到
---

## 為什麼要學：2 條私人開發線要怎麼接起來？
你從一份課表分出私人草稿，新增教室的同時，主線也補上上課日期。整合完希望兩個檔案都在，但同樣的檔案不一定代表同樣的歷史。有人需要保留兩邊各自工作的分岔紀錄；有人只想讓自己尚未分享的一筆修改像是從最新主線開始。這個選擇取決於誰依賴原來的提交，而不是哪張圖比較整齊。

## 核心概念：保留 2 個來路，或重播自己的差異
合併（merge）在兩線已分岔的這個例子裡會做一筆有兩個父提交的新提交，把雙方接起來。重訂基底（rebase）則取出私人線上獨有的改動，在新起點依序重新套用。在這裡，改動內容和標題可以完全沒變，但父提交換了，重做出來的是另一個提交，識別碼也不同。它不是把原來那一顆提交搬去別處。

先在紙上畫同一個出發點往左右各走一步；左端寫日期、右端寫教室。若把右邊變成接在左端之後，新教室版本的父提交應該是日期那一筆。若把兩端合併，新終點則會有兩條線可以往回走。下面以同一個已備份的起點實作兩種整合，讓比較不受檔案內容影響。

## 範例：在私人副本比較 2 張圖
從 Windows PowerShell 的 `C:\dev\stackway-lab` 或其他系統的練習目錄開始，先確認沒有 `integrate-lab`。複製上一堂系列的種子庫，成功後才進入，確認工作目錄乾淨。使用編輯器在指定分支新建檔案；這些步驟不會推送，也不需要碰任何真正的團隊分支。

```bash
git clone --no-hardlinks recovery-seed integrate-lab
cd integrate-lab
git switch -c topic
```

先依[〈Git 安裝與設定〉](#/lesson/fd-git-01-install)確認新副本的提交身分；種子庫的本機設定不會自動帶過來。在 `integrate-lab` 新建 `room.txt`，寫入 `blue`。執行下段後會回到 `main`；剛才的檔案暫時看不見是合理的，因為它只在私人線上。`original-topic` 留作比較，也是能再回到整合前的保險。

```bash
git add -- room.txt
git commit -m "Add room"
git branch original-topic
git switch main
```

現在新建同層的 `day.txt`，寫入 `Monday`。先讓一條比較線合併，再讓 `topic` 重播；兩者都讀同一筆主線日期，不修改 `main` 的既有歷史。

```bash
git add -- day.txt
git commit -m "Add day"
git switch -c merge-demo original-topic
git merge --no-edit main
git switch topic
git rebase main
git log --graph --oneline --decorate --all
git diff merge-demo topic
```

若你把日期和教室畫成同一條原始直線，就無法用這次實驗比較分岔的兩種結局。可以先在開始整合前停下來，確認從共同起點向外各多了一筆，再把整合後的新線條用另一種顏色補上去。

## 常見錯誤
最後的差異沒有輸出，證明兩個尖端的檔案相同，不代表歷史相同。用 `git show -s --format=%P merge-demo` 看合併提交的兩個父識別碼，再把目標換成 `topic` 看重播後的單一父提交。若別人已從舊版教室開始工作，單方面重寫再強迫同步會讓對方的起點不同，本課不這樣做。若私人重播遇到看不懂的衝突，在進行中用 `git rebase --abort` 回到嘗試前，先釐清兩邊需求。

## 小結
在圖上圈出兩筆標題相同的教室提交，沿線找到各自的父提交。你要能用圖解釋：改動可以相同，識別碼卻不同；合併可以留下兩條來路，不必要求任何人放棄舊的歷史。
