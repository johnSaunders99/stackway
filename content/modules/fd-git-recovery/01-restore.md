---
id: fd-git-recovery-01-restore
module: fd-git-recovery
order: 1
title: Git restore
subtitle: 只還原練習檔，不動分支
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 對照工作目錄與暫存區決定來源
  - 在有備份的練習檔驗證 restore 不新增提交
tags:
  - git-recovery
  - restore
resources:
  - title: Git：restore 指令
    url: https://git-scm.com/docs/git-restore
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 閱讀 DESCRIPTION，核對預設來源與目的地。
concepts:
  - id: fd-git-recovery-01-restore-source
    prompt: 未指定來源的 git restore -- plan.txt 從哪裡取內容？
    answer: 從暫存區更新這個工作檔，不會移動分支。
    mcq:
      question: 提交、暫存、工作檔依序是 30、40、50。一般 restore 後打開檔案會讀到多少？
      options:
        - "40"
        - "30"
        - "50"
        - 最初建立時的 20
      answer: 0
      explain: 省略來源且沒有指定暫存區為目的地時，來源是暫存區，不是上一筆提交。
    interview:
      question: 同事想捨棄最後一次試寫，但保留已暫存的時數，你怎麼幫忙？
      points:
        - 確認單檔兩段差異
        - 另存未記錄的草稿
        - 由暫存還原工作檔並核對歷史
      answer: 我先請對方指出要留下的數字，分別看兩段 diff。先把試寫另存庫外，確定暫存區就是想要的版本，才只還原那個檔，最後核對數字與提交識別碼。
  - id: fd-git-recovery-01-restore-unstage
    prompt: 取消暫存與放棄工作檔的編輯差在哪？
    answer: 取消暫存預設用目前提交更新暫存區；工作檔還在。
    mcq:
      question: 要保留工作檔的 50，只把 plan.txt 從待提交變更移出，選哪一項？
      options:
        - git restore -- plan.txt
        - git add -- plan.txt
        - git commit -m plan
        - git restore --staged -- plan.txt
      answer: 3
      explain: 關鍵是 --staged 指定目的地；一般還原會覆蓋工作檔，加入暫存或提交則朝相反方向走。
  - id: fd-git-recovery-01-restore-diff
    prompt: 哪種差異能預告已暫存的檔案會提交哪些文字變動？
    answer: git diff --cached 比較暫存區與目前提交。
    mcq:
      question: git diff 沒有輸出，但 git diff --cached 有修改，代表什麼？
      options:
        - 三層一定都相同
        - 分支已新增提交
        - 工作檔與暫存相同，但暫存不同於提交
        - 修改只存在工作檔
      answer: 2
      explain: 普通 diff 空白並未比較暫存區和提交；要分開看兩段差異。
practice:
  - id: fd-git-recovery-01-restore-p1
    title: 留下三個時數的還原紀錄
    kind: hands-on
    minutes: 12
    steps:
      - 照範例建種子庫，記下尖端識別碼
      - 把 40 暫存，再將 50 的工作檔另存到庫外
      - 完成還原與取消暫存，把三個位置的時數寫在筆記
    checks:
      - 庫外副本是 50，還原後工作檔是 40
      - 取消暫存後提交與暫存都是 30，工作檔仍是 40
      - 前後尖端識別碼相同
---

## 為什麼要學：我只想拿回剛才那一版
你把課表的時數改對了，已經用 `git add` 收好；送出前又試了一個錯誤數字。現在想留下剛收好的時數，不是回到昨天的提交。兩個動作平常都叫「還原」，來源卻不同。先別關掉編輯器，也別按全部捨棄。這堂要練的是指著一個檔案說清楚：「我要從哪裡，把哪個版本放回哪裡？」

## 核心概念：同一個檔名可以有 3 份內容
工作目錄（working tree）是你此刻開得到的檔案；暫存區（index）是準備放進下次提交的內容；目前提交（HEAD 指向的 commit）是上一次記下的快照。加入暫存不是把檔案鎖住，之後仍可繼續寫。因此編輯器顯示的文字，不一定等於下次提交會收進去的文字。

用 `git diff` 看工作目錄比暫存區多改了什麼，再用 `git diff --cached` 看暫存區比目前提交多改了什麼。兩個指令都沒有輸出，才表示這個已追蹤檔案在這三層一致；這不代表練習庫裡沒有其他未追蹤檔案。`git restore -- 檔名` 預設從暫存區寫回工作目錄；中間的雙連字號表示後面是路徑，不是選項。

## 範例：做一份後面還能複製的種子庫
在自己的 `C:\dev\stackway-lab` 開 PowerShell，確定已用前面 Git 基礎課的本機身分設定完成過提交。以下只建立全新的 `recovery-seed`；若已存在就停止，從自己的既有種子庫核對紀錄，不要重建在舊檔案上。後續課會從它建立私人副本，完全不需要遠端帳號。

```powershell
New-Item -ItemType Directory recovery-seed -ErrorAction Stop
Set-Location recovery-seed
git init -b main
```

這時先確認新庫有可用的提交身分。若先前依[〈Git 安裝與設定〉](#/lesson/fd-git-01-install)只在另一個庫設定過，設定並不會自動帶到這裡；依同一堂課的方法，只在這個新庫補上獲准使用的本機設定，不用變更全域設定，也不用把身分欄抄進練習筆記。確認後再做兩筆提交：

```powershell
Set-Content plan.txt 'time=20' -Encoding ascii
git add -- plan.txt
git commit -m "Set baseline time"
Set-Content plan.txt 'time=30' -Encoding ascii
git add -- plan.txt
git commit -m "Set practice time"
```

在 macOS 或 Linux，先在自己的練習目錄用 `mkdir recovery-seed && cd recovery-seed` 建立並進入空目錄。上述寫檔行分別改成 `printf 'time=20\n' > plan.txt` 與 `printf 'time=30\n' > plan.txt`，其餘 Git 指令相同。先用 `git log --oneline -2` 看見兩筆提交才繼續。

在同一個庫，用編輯器把時數改成 40、儲存並執行 `git add -- plan.txt`，再改成 50 並儲存。用「另存副本」把 50 的版本存到庫外，例如上一層的 `restore-draft.txt`，關閉副本，確認自己正在看原檔。先預測還原後會讀到哪個數字，再逐行執行：

```bash
git diff -- plan.txt
git diff --cached -- plan.txt
git restore -- plan.txt
git show :plan.txt
git show HEAD:plan.txt
```

原檔應讀到 40，冒號開頭取得的暫存內容也是 40，而提交裡仍是 30。這時執行 `git restore --staged -- plan.txt`，是拿目前提交更新暫存區，不是再碰原檔。現在 40 變成未暫存的變更，與剛才相反。

把兩次差異想成兩扇窗：一扇看「還沒挑進清單的改動」，另一扇看「已經挑好、下次會提交的改動」。同一個檔案可以同時出現在兩扇窗裡。若只看到檔名就決定整份重做，很容易同時丟掉對的數字與錯的數字。

## 常見錯誤
把「取消暫存」當成「丟掉草稿」，會選錯目的地。另一個陷阱是對整個目錄操作：即使只打算重做一行，也可能覆蓋別的檔案尚未留下的心血。還原前先看差異、另存想保留的文字，再縮小到單一檔名。Git 不保證能救回從未暫存或提交的字。

## 小結
最後再看最近兩筆紀錄，標題與識別碼應和開始時一致。保留庫外的 50 與練習庫內的 40；後面用本機複製取得的是已提交的 30，不會帶走你的草稿。
