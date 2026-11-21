---
id: fd-sql-04-txn
module: fd-sql
order: 6
title: SQL 交易與回復
subtitle: 讓兩個寫入一起成功
status: ready
minutes: 30
level: 2
prereqs:
  - fd-sql-03-groups
objectives:
  - 用 BEGIN、COMMIT 與 ROLLBACK 表達不可拆開的操作
  - 說明交易提交前後可見的狀態
  - 模擬中途失敗時應保留的資料
tags:
  - sql
  - transaction
resources:
  - title: SQLite：交易與提交
    url: https://www.sqlite.org/lang_transaction.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-sql-atomic-pair
    prompt: 什麼決定交易裡應該包哪些寫入？
    answer: 由業務上必須一起成功或一起放棄的狀態變更決定。
    mcq:
      question: 扣券與建報名要避免只做一半，哪種分界較好？
      options:
        - 扣券後先提交，再寫報名
        - 先提交報名，再決定是否扣券
        - 同一筆交易中兩步都成功才提交
        - 各自提交，失敗時再用 ROLLBACK 回到兩步之前
      answer: 2
      explain: 任何一個中途提交都讓兩步之間留下已生效的缺口。
    interview:
      question: 如何證明重複報名不會重複扣券？
      points:
        - 安排第二步真正失敗
        - 同一交易裡明確回復
        - 同查兩張表
      answer: 我先成功報一次，再用同一活動讓主鍵拒絕第二次。錯誤分支回復後，我期待仍有 1 張券和一筆報名，而不是只看程式沒有崩潰。
  - id: fd-sql-txn-own-read
    prompt: 同一連線在交易內看得見自己剛更新的值嗎？
    answer: 看得見；這不代表值已提交或其他連線也能看到。
    mcq:
      question: 第二次交易內看到 0，回復後剩一，為什麼合理？
      options:
        - ROLLBACK 也還原了第一次已提交的扣券
        - BEGIN 會先把餘額初始化為 0
        - 讀到 0 表示扣券已正式提交
        - 0 是這次尚未提交的扣券結果
      answer: 3
      explain: 回復撤銷未提交的扣券，前一筆交易仍保留。
  - id: fd-sql-rollback-boundary
    prompt: ROLLBACK 能回到上次 COMMIT 以前嗎？
    answer: 不能用來撤回已提交的交易，只撤回這次未提交的工作。
  - id: fd-sql-txn-error-path
    prompt: 某個寫入失敗，就能假定整筆交易都已回復嗎？
    answer: 不能一概而論。範例明確捕捉約束錯誤並回復，才不會把先前扣券的暫存變更提交。
    mcq:
      question: 範例在 INSERT 遇到重複活動時，為避免只扣券應做什麼？
      options:
        - 忽略錯誤並照常提交
        - 只重印剩餘券數
        - 在同一筆尚未提交的交易中執行 ROLLBACK
        - 先提交扣券，再對那筆提交執行 ROLLBACK
      answer: 2
      explain: 回復的範圍是未提交交易；只處理畫面或先提交都不能保障兩個寫入一起放棄。
practice:
  - id: fd-sql-b04-06-p1
    title: 保留失敗路徑的兩份狀態
    kind: code
    minutes: 12
    steps:
      - 儲存 reserve.py，從輸出圈出第二次交易內與回復後的券數
      - 把第二個活動改成不同名字再跑
      - 用註解記下兩組最終券數及報名數
    checks:
      - 重複活動結果一券一筆
      - 不同活動結果 0 券 2 筆
      - 交易內讀到的 0 不是第一次已提交的結果
---

## 扣掉一張練習券，卻沒有報名紀錄

報名活動要做兩件事：少一張可用券、多一筆報名。若第一個寫入成功，第二個因為重複報名而失敗，學員不應白白少一張券。資料庫交易 (transaction) 讓一組決定一起成立或一起放棄；界線由業務上「哪幾件事不能拆」決定，不是把每一行 SQL 都獨立視為成功就好。

## 從開始、暫存，到採用或放棄

`BEGIN` 開始交易，接下來的寫入屬於同一組。執行交易的連線能讀到自己的修改，即使這些變動尚未提交。`COMMIT` 提交後，結果成為之後交易能看到的已提交狀態；另一個早已開始讀取的交易依隔離方式可能仍保留原先看到的版本。`ROLLBACK` 把這次尚未提交的調整撤回，而不是把資料庫還原成昨天的備份。

原子性 (atomicity) 描述的是整組要嘛成立、要嘛不成立。它不會自動知道哪些業務條件算錯誤，程式仍要檢查券夠不夠、報名是否已存在。某個敘述失敗也不能一律當成整筆交易已經撤回：範例讓程式明確選擇失敗就回復，成功才提交，讓邊界清楚可驗證。

## 範例：讓同一場報名確實失敗一次

開啟 `C:\dev\stackway-lab\sql`，將範例另存為 `reserve.py`。先在紙上劃定這次交易的邊界。如果中間一步失敗，哪些寫入應一起留下，哪些應一起撤回？

在該目錄執行：Windows PowerShell 用 `py reserve.py`；macOS／Linux 用 `python3 reserve.py`。

```python
import sqlite3

db = sqlite3.connect(":memory:", isolation_level=None)
db.executescript("""
CREATE TABLE wallet(id INTEGER PRIMARY KEY, tickets INTEGER NOT NULL);
CREATE TABLE booking(event TEXT PRIMARY KEY NOT NULL);
INSERT INTO wallet VALUES (1, 2);
""")
def tickets():
    return db.execute("SELECT tickets FROM wallet WHERE id = 1").fetchone()[0]

for event in ["lab", "lab"]:
    db.execute("BEGIN")
    try:
        used = db.execute("UPDATE wallet SET tickets = tickets - 1 WHERE id = 1 AND tickets > 0")
        if used.rowcount != 1:
            raise ValueError("no ticket")
        print("inside:", tickets())
        db.execute("INSERT INTO booking VALUES (?)", (event,))
    except (sqlite3.IntegrityError, ValueError):
        db.execute("ROLLBACK")
        print("rolled back:", tickets())
    else:
        db.execute("COMMIT")
        print("committed:", tickets())
print("bookings:", db.execute("SELECT COUNT(*) FROM booking").fetchone()[0])
db.close()
```

程式以明確 SQL 控制交易，避免範例的開始和結束藏在自動行為裡。首次有 2 張券，扣完剩一，寫入活動成功，提交後仍是一。第二次的交易裡暫時讀到 0；接著相同活動違反主鍵唯一條件，進入錯誤分支。回復後重新查到一張券，以及先前成功提交的一筆報名。這兩個數字必須成對核對，只查到剩 1 張，還無法確認預約沒有多寫。

### 在哪裡放分界線？

如果在扣券後就提交，第二次報名失敗時再執行回復，已提交的那張券不會自動回來。若真的要修正已完成的交易，就要設計另一筆受控的更正，而不是假設回復指令能穿過上一次提交。這個範例只處理資料庫裡的券與報名；寄出的通知或寫到別處的檔案不會隨 SQLite 一起撤回。

## 常見錯誤

只測順利報名的路徑，看見成功畫面就以為不可能半套完成。請刻意測兩個輸入相同的事件，再用兩個不同事件當作對照；前者應走一次回復，後者應完成 2 次提交。若把錯誤吞掉卻仍然提交，完整性檢查攔住第二個寫入，也保不住先前扣掉的券。

## 小結

把不可分割的改動寫進同一筆交易，為失敗留出明確出口。檢查的是「券數與報名數是否一起正確」，不只是有沒有跑到最後一行。
