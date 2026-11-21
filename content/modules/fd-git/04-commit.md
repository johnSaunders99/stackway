---
id: fd-git-02-commit
module: fd-git
order: 4
title: Git add 與 commit
subtitle: 記下一個值得保留的改動
status: ready
minutes: 25
level: 2
prereqs:
  - fd-git-01-snapshot
objectives:
  - 用 git add 選擇變更，再用 git commit 建立一筆可檢查的快照
  - 只挑選與本次目的相關的檔案
  - 用一句話解釋這次提交的理由
tags:
  - git
  - commit
resources:
  - title: Git：add 與暫存區
    url: https://git-scm.com/docs/git-add
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Pro Git：從選檔到提交
    url: https://git-scm.com/book/zh-tw/v2/Git-%E5%9F%BA%E7%A4%8E-%E7%B4%80%E9%8C%84%E8%AE%8A%E6%9B%B4%E5%88%B0%E7%89%88%E6%9C%AC%E5%BA%AB%E4%B8%AD
    kind: book
    lang: zh-Hant
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-04-index
    prompt: "普通 git commit 會以哪一份內容建立快照？"
    answer: "以當時的暫存區建立。"
    mcq:
      question: "存檔後沒有再執行 add。一般的 git commit 會以哪份內容製作快照？"
      options:
        - "暫存區"
        - "自上次提交後所有存過的檔案"
        - "工作目錄最新內容"
        - "所有未追蹤檔"
      answer: 0
      explain: "add 之後才存的內容不會偷偷進去。"
    interview:
      question: "怎麼證明西門提案沒有被你提交？"
      points:
        - "提交前核對暫存差異"
        - "讀取提交中的檔案"
        - "與工作檔案對照"
      answer: "我先看選好的差異是北改東，再提交並讀回 HEAD 裡的檔案。歷史是東、磁碟是西；兩份可以各自驗出，草稿也沒被帶進去。"
  - id: fd-git-04-scope
    prompt: "什麼是適合放在一起的一筆變更？"
    answer: "能用一個清楚目的說明，而且可以一起驗收的改動。"
    mcq:
      question: "哪組最能讓接手的人獨立審查？"
      options:
        - "今天碰過的所有檔案"
        - "所有副檔名相同的檔案"
        - "剛好十行的修改"
        - "同一行為與其對應說明"
      answer: 3
      explain: "檔案數、日期、行數都不能代替變更理由。"
  - id: fd-git-04-readback
    prompt: "要讀目前提交裡的 route.txt，而不是磁碟檔案，如何查看？"
    answer: "用 git show HEAD:route.txt。"
    mcq:
      question: "哪個直接印出歷史快照裡的檔案？"
      options:
        - "用編輯器重新開檔"
        - "git status --short"
        - "git show HEAD:route.txt"
        - "git diff --cached"
      answer: 2
      explain: "狀態是摘要，差異是比較；都不是直接取出該版本的文字。"
practice:
  - id: fd-git-04-p1
    title: "交出一筆只有東門的提交"
    kind: hands-on
    minutes: 10
    steps:
      - "先對照兩段差異並預測提交內容。"
      - "提交已經選好的版本，留下簡短理由。"
      - "記下短編號和歷史、磁碟各自的門名。"
    checks:
      - "歷史檔案是 gate=east。"
      - "磁碟上是 gate=west。"
      - "rough.txt 仍未追蹤。"
---

## 為什麼要學

想像接手的人只想弄清楚入口從北門換到哪裡，卻在同一筆歷史看到半張草稿和一個還沒決定的西門提案。提交（commit）之所以有用，不只是它保存檔案，而是你可以把彼此有關的一組決定放在一起。今天要留下的結果很小：歷史確認開放東門，工作檔案仍可保留下一個提案。

## 核心概念

`git add -- 檔名` 選入該路徑當下的內容，`--` 把選項與路徑分開；`git commit -m "說明"` 使用暫存區（staging area）建立新快照，並附上一句可搜尋的說明。它不是把上次提交後做過的每一件事全包進去。對已存在但沒改過的檔案，新的快照仍保有原內容，所以只選一檔不表示專案從此只剩一檔。提交在本機完成，不會替你發送到網站。

選檔以前先用一句話回答：「這次讓什麼事情成為事實？」若一句話得塞進兩個毫無關係的目的，可以分開提交。這與按檔案數量切分不同：修改說明書和它對應的範例，可能就是同一件事；同一檔裡的兩個想法也未必需要一起定案。這堂先用明確路徑與暫存時機來選，不靠大量選取。

## 範例：提交東門，保留西門提案

在 `C:\dev\stackway-lab\trail-notes` 開終端機。先確認上堂的中間成果：以下第一段應該是北門改東門，第二段應該是東門改西門。若不符，依上堂步驟重建這兩段，不要把猜測寫進歷史。

```powershell
git diff --cached -- route.txt
git diff -- route.txt
git status --short
```

不再執行 `add`，直接把目前選好的東門提交。下面的 `show HEAD:route.txt` 是請 Git 讀出目前提交（HEAD）裡這個檔案的內容，而不是打開磁碟上的那一份。macOS 或 Linux 的 bash 同樣在來源庫執行這些 Git 指令。

```powershell
git commit -m "Use the east gate for the marked route"
git show HEAD:route.txt
git log -1 --oneline
git status --short
```

預期歷史顯示 `gate=east`，用編輯器看仍是 `gate=west`，而 `rough.txt` 還是未追蹤。現在你已有反證：若提交的是編輯器最後一次儲存，歷史就應該是西門。把這筆編號及決定原因寫在庫外筆記。保留西門修改給下一堂，不用把狀態整理成全空才算完成。

交接時可以請對方只讀提交說明，試著猜哪個入口已經開放，再讓對方打開快照核對。若說明寫的是西門，檔案卻寫東門，就算每個指令都成功了，這筆紀錄仍然描述錯了決定。

## 常見錯誤

為了讓指令「有效」而在提交前習慣性執行 `git add .`，會把西門和草稿一起選進來，反而破壞本題的目的。遇到沒有可提交的修改，先分辨是尚未儲存、尚未選入，還是檔案其實與上次相同；多打一遍提交指令不會改變這些條件。說明只寫「更新」雖然能成功，回頭卻不知道這筆是正式入口還是試驗。

## 小結

把編輯、選取、確認快照當成三個決定。最後用讀取歷史檔案來驗收，別用「終端機有成功訊息」取代核對真正留下的內容。
