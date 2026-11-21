---
id: fd-git-10-pull
module: fd-git
order: 10
title: Git fetch 與 pull
subtitle: 先看別人改了什麼，再合併
status: ready
minutes: 30
level: 2
prereqs:
  - fd-git-09-remote
objectives:
  - 用 fetch 更新遠端追蹤分支而不移動工作分支
  - 比較 pull 的整合結果與手動合併的時機
tags:
  - git
  - pull
resources:
  - title: Git：fetch 與追蹤分支
    url: https://git-scm.com/docs/git-fetch
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Git：pull 與整合方式
    url: https://git-scm.com/docs/git-pull
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-10-tracking
    prompt: "hub/main 是即時查詢出的遠端狀態嗎？"
    answer: "不是，它是本機保存的最近已知位置。"
    mcq:
      question: "沒有連線時 hub/main 代表什麼？"
      options:
        - "本機 main 當下的另一個名字"
        - "直接連到伺服器的即時指標"
        - "本機記得的對端位置"
        - "對端工作目錄尚未提交的狀態"
      answer: 2
      explain: "對端可能已經往前走，要擷取才會更新本機認知。"
    interview:
      question: "想先審查遠端改動、不立刻動工作檔，你的順序是什麼？"
      points:
        - "先擷取"
        - "比較目前提交與追蹤位置"
        - "核對後才整合"
      answer: "我先 fetch，再限定路徑比較 HEAD 與 hub/main。確認分鐘數的理由後，若可快轉就整合剛審過的追蹤位置；分岔時先停下來看圖。"
  - id: fd-git-10-fetch
    prompt: "在本例只執行 git fetch hub，工作分支會怎樣？"
    answer: "仍停在舊版本，追蹤分支可先前進。"
    mcq:
      question: "對端有新提交，本機 main 尚未跟上。只做 git fetch hub，哪個結果正確？"
      options:
        - "立刻合併對端"
        - "本機 main 不動"
        - "自動提交草稿"
        - "推送本機 main"
      answer: 1
      explain: "取得物件與移動自己正在工作的分支是兩步。"
  - id: fd-git-10-ffonly
    prompt: "兩邊各有獨立提交時，pull --ff-only 如何處理整合？"
    answer: "不能快轉就拒絕整合，不會替你丟掉其中一側。"
    mcq:
      question: "本機與對端分岔時，git pull --ff-only 對整合有什麼限制？"
      options:
        - "拒絕非快轉整合"
        - "自動覆寫本機提交"
        - "強制上傳到對端"
        - "總是產生合併提交"
      answer: 0
      explain: "擷取可能已成功，受限制的是後續如何整合。"
practice:
  - id: fd-git-10-p1
    title: "做一張兩個副本的交接紀錄"
    kind: hands-on
    minutes: 14
    steps:
      - "在新副本提交 22 分鐘並推到裸庫。"
      - "在原庫擷取，記下主線與追蹤分支的值。"
      - "只允許快轉地拉取，再記下主線值。"
    checks:
      - "擷取後同時查到 20 與 22。"
      - "擷取時原庫磁碟的檔案仍是 20。"
      - "整合後原庫是 22。"
---

## 為什麼要學

你在一個視窗改規則，另一個視窗還照舊規則工作。若每次想知道有沒有新版本，都要立刻改掉手上的檔案，就無法先判斷這次更新是否適合接進來。擷取（fetch）把對端的新歷史取回本機；拉取（pull）還會嘗試把取得的歷史整合到目前分支。今天用兩個副本扮演交接的兩端，親眼看見「我已經知道新版本」不等於「我現在正在用新版本」。

## 核心概念

遠端追蹤分支（remote-tracking branch）如 `hub/main`，是本機依最近取得的資訊記住的對端位置，不是隨時連線的即時看板。本機 `main` 是你正在推進的線。對端剛有新提交時，你的兩個名字可能都還停在舊處；擷取後追蹤名稱先更新，你的工作分支不會因此跳過去。兩個名字暫時不同正好提供審查空間。

`git pull --ff-only` 先擷取，再只允許快轉整合。在本機主線沒有額外提交、可以直達對端新位置時，它會成功。若兩線已分岔，不能只移動名稱就接成一條線，指令會拒絕這種整合。不要把這當作要關閉的保護；看清楚新提交與你手上的改動，再決定要怎麼整合。

## 範例：在 2 個位置觀察同一行

在 `C:\dev\stackway-lab` 確認 `trail-peer` 尚未使用，執行下列指令。用編輯器在新副本將 `pace.txt` 改為 `minutes=22`，儲存。

```powershell
git clone trail-hub.git trail-peer
cd trail-peer
git config --local user.name "Practice Robot"
git config --local user.email "practice@example.invalid"
```

仍在這個副本把新值送到共用裸庫；`origin` 是這份副本複製時記下的來源別名。原來那一份叫它 `hub`，兩個名稱可以指向同一處。

```powershell
git add -- pace.txt
git commit -m "Allow two more minutes at the crossing"
git push origin main
```

回到原本的 `trail-notes` 終端機，確認目前在 `main` 且受追蹤檔案無修改，才執行下一段。注意是先看兩個版本，再整合，不是把同一段輸出印兩遍。

```powershell
git fetch hub
git show HEAD:pace.txt
git show hub/main:pace.txt
git diff HEAD hub/main -- pace.txt
git pull --ff-only hub main
git show HEAD:pace.txt
```

擷取之後應分別看到 20 與 22，讀取磁碟上的檔案仍是 20；拉取之後主線才顯示 22。若剛才已經看過並確認追蹤分支，也可以在擷取後選用 `git merge --ff-only hub/main` 整合那個已審查的位置，不必再次連線。這是兩種選擇，不要把兩套都當成必做步驟。macOS 或 Linux 的 bash 在同名目錄可使用相同指令。

若同時開著兩個編輯器視窗，請把所在資料夾寫在筆記每一列的最左邊。新副本負責提出 22，原庫負責先看再接；在同一個視窗把指令全做完，會失去兩端不同步的觀察機會。

## 常見錯誤

先拉取才試著重現「擷取後尚未整合」的畫面，會發現兩行早已相同。寫下比較結果再繼續。遇到整合被拒絕時，不要覆寫或丟棄本機提交；先分清是工作檔可能被覆蓋，還是兩條提交路線已分岔，兩者不是同一個問題。

擷取後先讀檔再整合，兩個時點分開記，才能證明是哪一步真的改了工作目錄。

## 小結

擷取把消息帶回來；是否接進自己的工作分支，是另一個決定。留下更新前、擷取後與整合後的觀察紀錄，下一次就能用證據回答檔案是在哪一步改變的。
