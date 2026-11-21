---
id: fs-services-02-jobs
module: fs-services
order: 2
title: 背景工作與佇列
subtitle: 寄送工作失敗能否重新執行
status: ready
minutes: 35
level: 3
prereqs:
  - fs-services-01-redis
objectives:
  - 分辨生產者、佇列與工作者
  - 用工作識別碼處理重複投遞，界定何時重試或留下失敗紀錄
tags:
  - services
  - jobs
resources:
  - title: "BullMQ：可安全重做的工作"
    url: "https://docs.bullmq.io/patterns/idempotent-jobs"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "BullMQ：失敗工作與退避"
    url: "https://docs.bullmq.io/guide/retrying-failing-jobs"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-services-02-jobs-ack"
    prompt: "工作進入佇列後，前端可以宣告什麼？"
    answer: "工作已受理，可以用識別碼查進度。"
    mcq:
      options:
        - "外部收件者一定已收到通知。"
        - "背景工作無須確認成功。"
        - "失敗時系統一定能自行修正。"
        - "工作已受理，可以用識別碼查進度。"
      answer: 3
      explain: "受理與完成是兩個不同承諾。"
    interview:
      question: "寄送成功後工作者在確認前中斷，重跑該怎麼辦？"
      points:
        - "承認投遞可重複"
        - "固定業務鍵及持久化結果"
        - "釐清外部寄送邊界"
      answer: "我不會只在記憶體記已寄。若供應端接受防重鍵，就沿用同一鍵並保存回條；若沒有這種保證，狀態不明時先對帳，不會當成一定沒寄就重送。"
  - id: "fs-services-02-jobs-key"
    prompt: "同一份收據重試時，應沿用什麼？"
    answer: "代表同一次寄送意圖的識別碼"
    mcq:
      options:
        - "代表同一次寄送意圖的識別碼"
        - "每次新建的隨機投遞碼作唯一憑據"
        - "目前的重試秒數"
        - "工作者所在主機名稱"
      answer: 0
      explain: "投遞可以有多次，但要辨認的是同一項業務效果。"
  - id: "fs-services-02-jobs-retry"
    prompt: "哪種錯誤適合有上限的退避重試？"
    answer: "短暫的服務忙碌"
    mcq:
      options:
        - "已確認缺少必要欄位"
        - "短暫的服務忙碌"
        - "工作引用不存在且不會再建立的範本"
        - "不支援的工作種類"
      answer: 1
      explain: "重試只對可能自行恢復的狀況有幫助。"
  - id: fs-services-02-jobs-durable
    prompt: "工作者為何不能只用記憶體集合記住已完成工作？"
    answer: "程序重啟或換另一台就可能找不到集合。要跨重試辨認同一效果，須依賴持久化結果或外部服務的防重契約。"
practice:
  - id: "fs-services-02-jobs-p1"
    title: "保留一份重送紀錄"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 worker.py"
      - "再加入一筆不同收據的工作"
      - "把每次投遞與實際產生的收據各列一欄"
    checks:
      - "同一鍵投遞 2 次只產生一張收據"
      - "新增的不同鍵不會被誤擋"
---

## 為什麼要學：按鈕需要等收據寄完嗎？

使用者結帳後要一張收據。若請求一直等待寄送服務，外部稍慢，畫面就像沒反應；再按一次可能變成兩次寄送。背景工作（background job）把漫長的工作移出請求，前端拿到可查詢的工作編號，不必守著原來那條連線。縮短等待不代表工作消失，而是把責任明確交出去。

## 核心概念：誰交件、誰保管、誰完成

生產者（producer）寫入工作內容和識別碼，佇列（queue）保存待處理項目，工作者（worker）取件、執行、成功後確認。工作內容應描述意圖，例如「為訂單 7 的這次結帳產生收據」。不要把當時整個瀏覽器畫面當成工作內容。確認要等結果有可靠的落點；若先確認再寫收據，工作者在中間中斷就可能把工作弄丟。

反過來，先寫再確認也有空窗：收據寫好了，確認沒送達，佇列可能重新投遞。冪等性（idempotency）是同一次意圖重做，最終效果仍只有 1 次。工作編號要跨重試保持固定；用持久化的唯一鍵保護結果。若真正的副作用在外部寄送服務，單靠本機資料表去重不夠，還需要對方接受同一防重鍵，或能依回條查詢並對帳。

## 範例：讓第 2 次投遞真的跑到工作者

在 `C:\dev\stackway-lab\services` 存 `worker.py`，執行 `py worker.py`；macOS／Linux 用 `python3 worker.py`。這裡把「產生收據」縮為資料庫內的一次寫入，用固定清單扮演佇列；沒有寄信，也沒有聲稱能保證外部服務只寄一次。

```python
import sqlite3
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE receipt(job TEXT PRIMARY KEY, amount INTEGER)")
for job, amount in [("checkout-7", 80), ("checkout-7", 80)]:
    with db:
        added = db.execute("INSERT INTO receipt VALUES(?,?) ON CONFLICT(job) DO NOTHING",
                           (job, amount)).rowcount
    print(job, "created" if added else "already done")
print(list(db.execute("SELECT * FROM receipt")))
```

2 次投遞都有處理紀錄，但最後只有 1 張收據。把佇列長度當成銷售筆數就會算錯。這裡兩筆金額相同是有意的：若同一鍵突然帶來不同金額，應標記衝突請人核對，而不是默默當成正常重送。

### 「不再重試」也要讓人看得懂

把同一次任務分成受理、第一次嘗試、再次嘗試與最後結果 4 列。前端查進度只要看同一個工作編號，不該因為換了工作者就找不到原工作。若服務回報短暫忙碌，紀錄下次可嘗試的時間；若範本根本不存在，紀錄哪個範本有問題並停止。工作修好後人工重播時，應沿用原本的意圖鍵，才不會把一次故障補救變成第二張收據。注意範例刻意把副作用放在資料庫內；若把資料庫換成工作者自己的記憶體集合，重新啟動就忘光，剛才證明的範圍也跟著縮小。

## 常見錯誤與小結

重試不是把所有例外送回佇列。服務暫時忙碌可以逐次延長等待（backoff），設定總次數上限；必要欄位缺少，重跑不會生出欄位。記下失敗原因、最後一次嘗試及業務識別碼，讓修好的人能重播正確工作。判斷系統是否可靠，既要問失敗後有沒有再試，也要問成功後再試會不會多做一份。
