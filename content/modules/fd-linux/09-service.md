---
id: fd-linux-09-service
module: fd-linux
order: 9
title: systemd 與服務狀態
subtitle: 開機後是誰把服務叫起來
status: ready
minutes: 30
level: 3
prereqs:
  - fd-linux-04-script
objectives:
  - 辨認 unit 與服務行程的關係
  - 比較啟動狀態和是否設定開機啟動
tags:
  - linux
  - service
resources:
  - title: systemd 手冊：systemctl
    url: https://man7.org/linux/man-pages/man1/systemctl.1.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 對照 is-active、is-enabled 與 status。
concepts:
  - id: fd-linux-09-service-unit
    prompt: 服務單位與它啟動的行程有何不同？
    answer: 單位是受管理的設定與身分；行程是某一次執行實例，停止時單位仍可能存在。
    mcq:
      question: 同一服務重啟後 PID 換了，最合理的解釋是？
      options:
        - 單位名稱一定被改寫
        - 同一單位這次啟動了新的行程
        - 設定檔一定遭刪除
        - 它一定不再受 systemd 管理
      answer: 1
      explain: 行程編號並非服務設定的永久身分。
  - id: fd-linux-09-service-axes
    prompt: active 與 enabled 分別說明哪個時點的事？
    answer: active 描述目前狀態，enabled 描述已建立的啟用關係，不保證未來成功。
    mcq:
      question: 一個服務為 failed、enabled，應怎麼交接？
      options:
        - 已有啟用關係，但這次失敗
        - 它目前一定正常提供服務
        - 它不可能被安排啟動
        - 它一定未安裝
      answer: 0
      explain: 安排與執行結果可以不同，失敗仍要找原因。
    interview:
      question: 值班紀錄寫「已啟用，所以網站正常」，你會如何更正？
      points:
        - 分別查目前與啟用狀態
        - 考慮查詢環境
        - 不把行程存在當成功能健康
      answer: 我會把 enabled 放在啟用設定欄，另外查現在是否 active。即使兩者都有，也只說管理者看到服務運作；要回答網站是否能用，還得做獲准的功能檢查。
  - id: fd-linux-09-service-boundary
    prompt: systemctl 連不到管理介面就代表目標服務故障嗎？
    answer: 不代表，先確認該環境是否由 systemd 管理，再分開看有無單位與服務狀態。
    mcq:
      question: 在 PID 1 不是 systemd 的 WSL 環境，課程應怎麼進行？
      options:
        - 直接寫 cron 已崩潰
        - 提升權限並重新啟動機器
        - 將未知狀態填成 disabled
        - 記下環境限制，改判讀課文工單
      answer: 3
      explain: 沒有管理介面的觀察不足以替一個服務填寫執行或啟用狀態。
practice:
  - id: fd-linux-09-service-p1
    title: 為兩張工單分開填寫現在與開機欄
    kind: read
    minutes: 12
    steps:
      - 確認 PID 1，只有合適環境才查 cron.service
      - 抄兩種狀態，不存在或不適用時保留註記
      - 用甲、乙樣本補上各自下一個待查問題
    checks:
      - 甲可為 active 且 disabled，乙可為 failed 且 enabled
      - 沒有把樣本寫成實機，未做 restart 或 enable
---

## 為什麼要學：機器重開以後還會自己起來嗎？
同事說「我剛剛明明看到它在跑」，你問的卻是「下次開機後會不會被安排啟動」。兩個問題的答案可能剛好相同，也可能完全相反。這堂要交的是一張只有兩欄的狀態卡，不必重新啟動任何東西。會查狀態的人，在看到報告說服務不通時，可以先保留線索，而不是直接重啟把現場改掉。

## 核心概念：管理者、設定單位、實際行程
許多 Linux 系統由 systemd 擔任服務管理者（service manager）。它管理的單位（unit）有名字與種類；副檔名 `.service` 代表服務單位，描述要啟動什麼及如何管理。行程（process）則是某一次真正跑起來的程式，有自己的編號。服務停止時設定仍可能存在；下次再啟動，行程識別碼也不必跟上次一樣，不能把設定名稱和編號當作同一把鑰匙。

`systemctl is-active` 查現在的啟動狀態；`systemctl is-enabled` 查單位的啟用設定。常見的 enabled 表示已建立由對應目標拉起的關係，並不保證下一次一定成功；disabled 也不表示它現在一定停止，仍可能由人手動啟動或由別的單位拉起。有些單位是 static，不提供一般的啟用方式，要看它的相依關係，而不是把所有答案硬塞成是或否。

## 範例：從執行環境開始查，不假定服務一定存在
Windows 用既有的 WSL Ubuntu Bash，原生 Ubuntu 在 Bash 任意目錄也可。先執行第一段，檢查編號 1 的程式名稱；若不是 systemd，就停在這裡，改讀下方樣本。無論哪條途徑都不要為了上課去修改啟動設定。以下選常見的排程服務 cron，它負責按照時間啟動工作，下一堂[〈cron 排程〉](#/lesson/fd-linux-10-schedule)才會寫規則。

```bash
ps -p 1 -o comm=
```

如果結果為 systemd，再讀目前環境。`--no-pager` 讓狀態資訊直接回終端機；關注 `Loaded` 與 `Active` 兩行而不是複製整份紀錄。若提示單位不存在，結論是「查不到這個單位」，不是「已安裝、但目前停用」。

```bash
systemctl --no-pager status cron.service
systemctl is-active cron.service
systemctl is-enabled cron.service
```

判讀兩張假想工單：甲的結果依序是 active、disabled；乙的是 failed、enabled。甲此刻在跑，不能靠這筆啟用設定保證重開後會跑。乙雖有啟用關係，此刻卻失敗，應保留狀態與失敗訊息調查。前一堂的退出碼也用得上：這些查詢可能因未啟動而回非零，不等於你必須取得更高權限才能讀。

## 常見錯誤
在沒有該管理者的環境裡把連不上管理介面的訊息當成服務崩潰；或反過來把 active 當成整個網站健康。服務的行程存在，不代表應用程式已能回答使用者請求。若要確認功能，必須在授權範圍再做實際功能檢查，不能從這兩欄直接推論。

## 小結
狀態卡寫下「當下如何」、「之後是否被安排」以及你是看哪個欄位判斷的。沒有 Linux 時就採用甲乙工單，在卡片上註明樣本。只讀資訊已足以決定下一個要問的問題，不需要改動服務來證明自己會操作。
