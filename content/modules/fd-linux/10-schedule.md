---
id: fd-linux-10-schedule
module: fd-linux
order: 10
title: cron 排程
subtitle: 每天固定時間留下完成記號
status: ready
minutes: 25
level: 3
prereqs:
  - fd-linux-09-service
objectives:
  - 解讀 5 欄時間規則並標出下一次執行時間
  - 釐清精簡環境與工作目錄，在拋棄式案例用絕對路徑驗收
tags:
  - linux
  - schedule
resources:
  - title: cron 手冊：個人排程表格式
    url: https://man7.org/linux/man-pages/man5/crontab.5.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 閱讀時間欄位與命令的解讀方式。
concepts:
  - id: fd-linux-10-schedule-fields
    prompt: 個人 crontab 的 5 個時間欄依什麼順序？
    answer: 分鐘、小時、月中日期、月份、星期，接著才是命令。
    mcq:
      question: 15 18 * * * 的下一次在何時？假設現在是同一時區週五 18:16。
      options:
        - 週五 18:30
        - 週六 15:18
        - 週六 18:15
        - 下個月 15 日 18:00
      answer: 2
      explain: 分鐘和小時是指定時刻，不是間隔；今日那次已過。
  - id: fd-linux-10-schedule-environment
    prompt: 為什麼排程工作要明確指定執行檔與輸出位置？
    answer: 排程的搜尋路徑與工作目錄未必和互動分頁相同。
    mcq:
      question: 手動在專案目錄可用，排程找不到輸出，先改善哪一點？
      options:
        - 把執行時間往後改 1 分鐘
        - 使用已核對的絕對路徑
        - 假定永遠繼承目前分頁
        - 一律換成管理者身分
      answer: 1
      explain: 路徑解讀的起點不同才是這個測試要排除的變因。
  - id: fd-linux-10-schedule-evidence
    prompt: 手動在精簡環境中留下記號能證明什麼？
    answer: 證明命令本體在該環境可執行，不能證明排程器在指定時刻真的觸發。
    mcq:
      question: 排程草稿未安裝，手動執行兩次留下 2 行。能寫哪種結果？
      options:
        - 工作本體通過，實際排程未驗證
        - 服務已每天自動執行
        - 關機時也能觸發
        - 使用者排程表已更新
      answer: 0
      explain: 觸發來源是手動；行數不能變成排程已部署的證據。
    interview:
      question: 一個排程沒產出檔案，如何把問題拆成兩個可驗證的假設？
      points:
        - 核對規則、時區與服務
        - 精簡環境測命令本體
        - 分開記錄觸發與產物
      answer: 我先算下一個符合的時刻，再在精簡環境用絕對路徑手動測工作。若檔案能寫出，只能排除這一組命令條件，還得找排程器是否真的有在該時刻觸發。
practice:
  - id: fd-linux-10-schedule-p1
    title: 交付未安裝的排程草稿
    kind: hands-on
    minutes: 11
    steps:
      - 照課文建立 schedule.txt 或寫下等價草稿
      - 算出週五 18:14 與 18:16 這兩種起點的下一次
      - 若有 Ubuntu 手動執行工作兩次並記錄，沒有則標示未測
    checks:
      - 沒有覆蓋現有排程
      - 草稿用完整路徑，2 個下一次時刻差 1 天
      - 樣本預測與手動結果分開標示
---

## 為什麼要學：能手動執行，排程卻沒留下東西
你打算每天傍晚寫下一個完成記號。手動執行成功，不表示排程會在同一個目錄、用同一套環境變數找到同一支程式。更不表示你的筆電關機時仍然有人會替你跑。這堂先寫一份**不安裝的排程草稿**，把時間和工作分開驗收：用時鐘推算下一次，另用精簡環境手動執行命令本體。

## 核心概念：前 5 欄是何時，後面才是做什麼
傳統 cron 是依當地設定時間檢查規則的排程服務。使用者排程表（crontab）的 5 個時間欄依序是分鐘、小時、月中日期、月份、星期；星號表示這個欄位不限制。`15 18 * * *` 是每天 18:15，不是每隔 18 小時 15 分鐘。這堂使用個人排程表格式，不加使用者名稱；系統排程檔的格式另有差別，不能互貼。

以排程所用時區為準，若現在是週五 18:14，下一個符合時間是同日 18:15；若已是週五 18:16，就是週六 18:15。這是對規則的推算，不保證當時機器開著、服務運作或程式成功。要區分排程規則有效、工作真的觸發、工作本身完成這三種證據；時區和設備的休眠狀態也要記在調查筆記裡。

## 範例：做一份能貼進交接單的草稿
Windows 先建立 `C:\dev\stackway-lab\linux`，從 WSL Bash 用 `cd /mnt/c/dev/stackway-lab/linux` 進入；若切換失敗先停下來。原生 Linux 或 macOS 請切到自己練習區的 `linux` 子目錄。

Windows 用既有 WSL Ubuntu 的 Bash；原生 Ubuntu 也可在自己的練習目錄執行。下段在主題目錄建立全新子目錄，將實際絕對路徑寫入草稿。Ubuntu 的 `/bin/date` 顯示時間，`-Iseconds` 讓時間含日期、秒與時區位移。`>>` 表示附加；本例刻意保留每次執行的記號，而不是像前面報告課那樣覆寫結果。

```bash
lab=$(mktemp -d "$PWD/clock.XXXXXX")
printf '15 18 * * * /bin/date -Iseconds >> "%s/marks.log"\n' "$lab" > "$lab/schedule.txt"
cat "$lab/schedule.txt"
```

接著不等到傍晚，在不繼承平常環境的 shell 執行**同一個工作本體**。`env -i` 產生精簡環境；目的地作為參數傳入，`$1` 由內層的 shell 讀取，沒有靠目前工作目錄找檔案。重跑一次會有 2 行，即使恰好在同一秒、文字相同，也是兩次獨立的手動觸發。

```bash
for n in 1 2; do
  env -i /bin/sh -c '/bin/date -Iseconds >> "$1/marks.log"' sh "$lab"
done
wc -l "$lab/marks.log"
cat "$lab/marks.log"
```

如果改成每天上午 9:05，先自己寫出分鐘在前、小時在後的 2 個數字。再想像現在正好是 9:06：同一天不會因為你晚 1 分鐘啟動測試就自動補跑。把規則的下一個符合時刻與補跑政策分開，才能正確回答交接問題。

## 常見錯誤
把整份草稿當成一般 shell 腳本執行，shell 會把分鐘欄誤認成命令。或是只寫相對路徑，結果在別的目錄留下同名檔。也不要用教學草稿覆蓋現有個人排程表，更不用以管理者身分測試。本例避免在排程命令內使用百分號；部分 cron 會把未跳脫的百分號解讀成分行與輸入，不是一般互動式 shell 的意思。

## 小結
交付 `schedule.txt` 與兩行記號，註明這是「工作本體通過手動測試，尚未部署排程」。沒有 Ubuntu 時，可手寫 5 欄與絕對路徑並算出下一次時間，把執行結果欄留為未測。這樣接手者才知道還缺排程器真的觸發過的證據。
