---
id: fd-aws-06-rds
module: fd-aws
order: 6
title: RDS 受管資料庫
subtitle: 資料庫有人維護，誰負責還原
status: ready
minutes: 35
level: 3
prereqs:
  - fd-aws-05-s3
objectives:
  - 說明供應商與應用團隊的維護分界
  - 在私有網段標出連線與備份還原的驗收點
tags:
  - aws
  - rds
resources:
  - title: "Amazon RDS：還原至指定時間點"
    url: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "Amazon RDS：從快照還原執行個體"
    url: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_RestoreFromSnapshot.html"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-aws-06-rds-shared"
    prompt: "使用 RDS 後，哪項仍是應用團隊的責任？"
    answer: "設定適當權限與備份保留，驗證還原後資料可用。"
    mcq:
      options:
        - "親自更換代管服務的實體磁碟。"
        - "設定適當權限與備份保留，驗證還原後資料可用。"
        - "自行維修供應商的機房主機。"
        - "要求供應商補寫所有失敗交易。"
      answer: 1
      explain: "代管基礎設施不替應用決定業務資料正確的定義。"
    interview:
      question: "資料庫顯示還原完成，能立刻切換嗎？"
      points:
        - "從私有應用路徑驗證連線"
        - "檢查時間點和業務樣本"
        - "規劃切換與後續寫入"
      answer: "我先保留來源，從測試應用連新端點，檢查該在與不該在的訂單。確認哪些合法資料需補回、誰能寫入，再決定何時切換，不把主控台綠燈當作驗收。"
  - id: "fd-aws-06-rds-restore"
    prompt: "RDS 時間點還原會發生什麼？"
    answer: "建立還原後的新執行個體，不直接覆寫來源。"
    mcq:
      options:
        - "原端點一定立刻指向恢復資料。"
        - "所有應用自動換用新資料庫。"
        - "建立還原後的新執行個體，不直接覆寫來源。"
        - "只回復最後一條 SQL 指令。"
      answer: 2
      explain: "還需核對網路、身分、資料與端點切換。"
  - id: "fd-aws-06-rds-loss"
    prompt: "選擇誤改前的時間點，為何仍須核對後續交易？"
    answer: "誤改後的合法寫入也可能不在那個還原點。"
    mcq:
      options:
        - "備份只保存有錯的資料。"
        - "私有網段不會保存新資料。"
        - "時間點還原只還原表名。"
        - "誤改後的合法寫入也可能不在那個還原點。"
      answer: 3
      explain: "先列出可能缺少的合法變更，才能評估可接受的資料差距。"
  - id: fd-aws-06-rds-backup-check
    prompt: "能在備份清單看到快照，為何還需要還原演練？"
    answer: "清單只說明有備份。演練才檢查還原點是否適合、應用能否連線，以及資料與恢復時間是否達標。"
practice:
  - id: "fd-aws-06-rds-p1"
    title: "留一份還原驗收紀錄"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 restore.py"
      - "圈出應保留的收據及還原後缺少的合法收據"
      - "畫出應用群組至新端點的驗證路徑"
    checks:
      - "原本的來源資料未被覆寫"
      - "新副本少掉較晚交易，驗收單有補回決定"
---

## 為什麼要學：資料庫有人照顧，訂單誰來認？

Amazon RDS 是受管關聯式資料庫（managed relational database）。供應商處理許多底層維護，例如基礎設施與支援的備份機制。可是系統不知道哪張收據代表一筆已成交的訂單，也不知道你能容忍少多少交易。還原成功要由能辨識業務資料的人驗收，不是看到資料庫程序啟動就結束。

## 核心概念：保留多久、回到何時、多久能服務

團隊要選引擎與容量、安排維護窗口、設定備份保留和存取權，並管理結構、查詢與憑證。快照（snapshot）保留一個狀態；在具備自動備份與可還原時間範圍的條件下，時間點還原（point-in-time recovery）能選指定時刻建立新執行個體。新庫有自己的端點（endpoint），來源不會因此被改寫，應用也不會自動改連新庫。

還原前標出問題最早何時出現、哪一刻有可信資料，以及那之後有哪些合法寫入。復原點目標（recovery point objective，RPO）關心可以承受丟失多少時間的變動，復原時間目標（recovery time objective，RTO）關心多久要恢復服務。選較早的安全快照，也許能避開誤改，卻要補更多交易。兩個目標都得與業務先決定，再用演練量出差距。

## 範例：保留來源，另外檢查副本

在 `C:\dev\stackway-lab\aws` 存 `restore.py`，執行 `py restore.py`；macOS／Linux 用 `python3 restore.py`。用 SQLite 的記憶體備份複製一個已知狀態，比對兩個資料庫；並沒有重播 RDS 交易日誌或量測雲端還原時間。

```python
import sqlite3
src, safe, restored = [sqlite3.connect(":memory:") for _ in range(3)]
src.executescript("CREATE TABLE receipt(id INTEGER PRIMARY KEY, cents INTEGER); INSERT INTO receipt VALUES(1,800);")
src.backup(safe)
src.executescript("UPDATE receipt SET cents=0 WHERE id=1; INSERT INTO receipt VALUES(2,300);")
safe.backup(restored)
for label, db in [("source",src), ("restore",restored)]:
    print(label, list(db.execute("SELECT * FROM receipt ORDER BY id")))
```

新庫的第一筆金額正確，但後來那筆合法收據不在裡面。原庫仍在，不要急著刪除或覆寫；記下需核對並補回的訂單，避免補兩次。正式演練還要在私有子網路從應用群組連到新資料庫埠，核對服務身分，確認讀寫權限與連線設定都適用於新端點。

### 試算一次資料差距與停機時間

假設 10:00 保存的狀態可信，10:05 發生誤改，10:10 才有人回報。選 10:00 的資料不是承諾後面 10 分鐘什麼都沒發生，而是要把這段時間的合法收據逐一找出。另一條時間線從停止受理開始，包含等待新庫、核對資料、切換連線與重新開放；只量建立新庫那一段會低估實際中斷。把兩條線畫成上下兩列，圈出前者缺的是哪些資料，後者花掉的是哪些時間。若演練只能完成前半段，寫清楚還未驗證哪一步，而不把它報成整站已恢復。

## 常見錯誤與小結

高可用的備援能在主機故障時接手，不代表能消除已寫入的錯誤金額；同步的副本也可能忠實保留同一錯誤。驗收單請列「應該存在」「不該再錯」「需要補回」三種例子。用資料說服自己選對時點，再安排停止舊寫入與切換，而不是拿備份檔名當保證。切換後再從應用讀一次已知收據，避免只驗到管理工具手上的連線。
