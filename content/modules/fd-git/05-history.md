---
id: fd-git-05-history
module: fd-git
order: 5
title: Git log 與 diff
subtitle: 找出哪一次改了計算規則
status: ready
minutes: 30
level: 2
prereqs:
  - fd-git-02-commit
objectives:
  - 用 log 比較兩筆提交的親子關係
  - 分別讀出尚未暫存與已暫存的差異
tags:
  - git
  - history
resources:
  - title: Git：log 與父提交
    url: https://git-scm.com/docs/git-log
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Git：diff 的比較端點
    url: https://git-scm.com/docs/git-diff
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-05-parent
    prompt: "怎麼確認兩筆提交真的是父子關係？"
    answer: "讀子提交記錄的父編號，與候選父提交的編號比較。"
    mcq:
      question: "歷史顯示兩筆提交。哪個方法能確認它們直接相連，而不只是時間相近？"
      options:
        - "選編號較小的當父提交"
        - "比對父編號"
        - "將輸出時間最接近者當父提交"
        - "看兩筆是否改到同名檔"
      answer: 1
      explain: "時間與外觀不是歷史連線，父欄位才是。"
    interview:
      question: "同事說差異是空的，所以昨天沒改計算規則。你怎麼核對？"
      points:
        - "先問比較端點"
        - "用 log 找相鄰版本與親子關係"
        - "以指定兩筆提交和路徑比對"
      answer: "我會先問跑的是哪個 diff。若只比工作檔，空白不足以推論歷史。我會找出兩筆相關提交，再限定規則檔比較，指出確切的新舊數字。"
  - id: fd-git-05-ends
    prompt: "git diff A B 的減號行屬於哪個端點？"
    answer: "是左端 A 有而需移除的舊行。"
    mcq:
      question: "git diff A B 以兩筆提交為端點，內容前加減號中的「減號行」來自哪裡？"
      options:
        - "左端 A"
        - "右端 B"
        - "工作檔一定有的行"
        - "暫存區一定有的行"
      answer: 0
      explain: "兩端都是已提交快照，無須牽涉當前工作檔。"
  - id: fd-git-05-unstaged
    prompt: "25 已選入，30 只儲存，單獨 git diff 會比較什麼？"
    answer: "比較暫存區 25 與工作檔 30。"
    mcq:
      question: "歷史先由 15 改為 20，25 已暫存，30 只存檔。git diff -- pace.txt 會看到哪一段？"
      options:
        - "20 到 25"
        - "15 到 20"
        - "15 到 30"
        - "25 到 30"
      answer: 3
      explain: "20 到 25 要看 cached；15 到 20 是歷史比較。"
practice:
  - id: fd-git-05-p1
    title: "製作一張分鐘規則對照單"
    kind: hands-on
    minutes: 14
    steps:
      - "建立 15 與 20 的兩筆提交並查父編號。"
      - "暫存 25、只儲存 30，在庫外記下三段比較。"
      - "依小結把練習檔回到已提交內容。"
    checks:
      - "第二筆的父編號對得上第一筆。"
      - "筆記連得出 15、20、25、30。"
      - "收尾後沒有受追蹤檔案的未提交變更。"
---

## 為什麼要學

路線板要印出「每段幾分鐘」。昨天是 15，今天有人改成 20，手上又躺著 30 的提案。你要回答的是哪一種「變了」？歷史紀錄（log）指出先後留下哪些決定，差異（diff）才會列出兩個狀態之間哪些行不同。把比較的兩端說清楚，比背一長串選項更能找對問題。

## 核心概念

一筆普通提交除了檔案快照，還記得它緊接著的父提交（parent commit）；平常只有一個父提交，第一筆則沒有。`HEAD` 表示你目前檢出的提交，`HEAD^` 在這條直線歷史中表示它的上一筆。`git log --oneline -2` 由新到舊列出最近兩筆，前面的短編號方便辨識，但不要靠編號大小猜順序。要確認兩筆怎麼接，用帶父編號的歷史輸出。

差異要從左端讀到右端。`git diff A B` 用已指定的兩筆快照當端點，不會跑去讀編輯器裡尚未儲存的字；`git diff --cached` 看目前提交到暫存區；只有 `git diff` 則看暫存區到工作檔。知道端點，就知道一段空輸出只代表「這兩份一樣」，並不等於其他地方都沒有改動。

## 範例：追一行分鐘數

在 `C:\dev\stackway-lab\trail-notes` 新增 `pace.txt`，先只寫 `minutes=15`。以下指令都在這個庫執行。保留原有西門提案與草稿，不要一起選入。先確認上堂提交後暫存區沒有其他變更，再留下基準：

```powershell
git add -- pace.txt
git commit -m "Set the walking interval to fifteen minutes"
```

把同一檔的數字改成 `20`，儲存，再執行下面這組。引號讓父提交的符號原樣交給 Git。macOS 或 Linux 的 bash 也能直接使用這些指令。

```powershell
git add -- pace.txt
git commit -m "Allow twenty minutes for the longer path"
git log -2 --oneline --parents
git diff "HEAD^" HEAD -- pace.txt
```

先遮住提交說明，只讀差異中的減號與加號，應可指出舊規則與新規則。接下來把 20 改成 `25`，儲存並執行 `git add -- pace.txt`；再改成 `30`，只儲存。此時把三個比較並排記下：歷史兩筆是 15 到 20，`git diff --cached -- pace.txt` 是 20 到 25，`git diff -- pace.txt` 是 25 到 30。三段都是真的，只是問題不同。

### 換一個方向讀

把歷史比較的兩端反過來，原本新增的 20 就會變成要拿掉的一行，15 則會成為要放回來的值。這不會修改分鐘數，只是改變你敘述變化的方向。因此把差異貼進交接筆記時，別只寫「看到 15 和 20」，要寫成從哪個版本到哪個版本，接手的人才知道哪個才是新規則。

## 常見錯誤

看到紀錄列在同一頁，就以為相鄰兩行永遠是父子；歷史分岔後未必如此，應以父編號為準。也不要用單獨的 `git diff` 查昨天已提交的修改；工作檔與暫存區若相同就沒有輸出。若看到其他檔名，先用 `-- pace.txt` 限定這一題的路徑，不必把其他人的工作收進來。

先把已提交、已選入、仍在編輯的值各寫一張紙條。讀差異前圈出這次指令拿哪兩張相比；第三張即使不同，也不應出現在這次輸出裡。

## 小結

把本次的三段比較與兩筆短編號寫進庫外筆記。為了讓後面的分支練習有乾淨起點，用編輯器把路線改回已提交的東門、分鐘改回 20 並儲存，再執行 `git add -- pace.txt` 讓暫存區也回到 20。`git status --short` 應只剩先前故意留下的未追蹤草稿。
