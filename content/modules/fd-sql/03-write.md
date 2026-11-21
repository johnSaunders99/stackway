---
id: fd-sql-03-write
module: fd-sql
order: 3
title: SQL 新增、修改與刪除
subtitle: 只更新這次要更正的一筆
status: ready
minutes: 30
level: 2
prereqs:
  - fd-sql-02-model
objectives:
  - 用 INSERT、UPDATE、DELETE 操作拋棄式樣本
  - 先用相同 WHERE 條件查出將受影響的列
tags:
  - sql
  - write
resources:
  - title: PostgreSQL：用條件更新資料列
    url: https://www.postgresql.org/docs/current/dml-update.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-sql-write-predicate
    prompt: 更正單筆時，為什麼預覽和實際更新應用相同條件？
    answer: 讓預覽對準將被修改的列，再核對主鍵、舊值與影響筆數。
    mcq:
      question: 2 筆都是 20 分鐘，哪個條件更能限定只改第二筆的舊值？
      options:
        - minutes = 20
        - minutes >= 0
        - 省略 WHERE
        - id = 2 AND minutes = 20
      answer: 3
      explain: 後三者無法區分兩筆相同分鐘的紀錄。
    interview:
      question: 更新指令成功執行卻影響 0 列，你會擴大 WHERE 嗎？
      points:
        - 區分執行成功與符合筆數
        - 核對識別值及預期舊值
        - 保留條件
      answer: 我不會先拿掉條件。0 列可能表示那筆不存在或已經改過，我會按編號讀回目前值，再決定要不要發起新的更正。
  - id: fd-sql-delete-row
    prompt: DELETE 和把一欄 UPDATE 成 0 有何不同？
    answer: DELETE 移除整列；UPDATE 只改指定欄位，紀錄身分仍保留。
    mcq:
      question: 想保留練過這件事但更正時間，該選哪項？
      options:
        - 更新該列的分鐘欄
        - 刪除整列
        - 刪除整張表
        - 另插一筆但不改錯誤資料
      answer: 0
      explain: 更新保留同一筆紀錄，新增替身會留下錯誤原件。
  - id: fd-sql-bound-value
    prompt: 問號參數的值由哪裡提供？
    answer: 由呼叫資料庫時獨立傳入的值序列，按位置和預留位置配對。
practice:
  - id: fd-sql-b04-03-p1
    title: 留下只更正一列的操作紀錄
    kind: code
    minutes: 12
    steps:
      - 存下 correct-entry.py，抄下更新前、更新後與刪除後的列
      - 只把預期舊值從 20 改成 19 再執行
      - 註記這一輪為何沒有 updated 行
    checks:
      - 正常時更新一筆，另一筆仍是 20
      - 過期條件沒有覆寫資料
      - 實驗只用記憶體資料庫
---

## 把 20 分鐘改成 25，別順便改了昨天

讀書紀錄有 2 筆 20 分鐘，只有今天那一筆記錯。若把更正寫成「找出所有 20 分鐘，改成 25」，資料庫會很聽話地改錯 2 筆。寫入之前，先確定你選的是要更正的那件事，而不是剛好有相同數字的所有事情。

## 3 種寫入，各自改變什麼？

新增 (INSERT) 是放入一列新資料，列出要填的欄位，再用 VALUES 按相同順序提供值。更新 (UPDATE) 在原本的列上用 SET 指定哪些欄改成什麼；刪除 (DELETE) 則從表裡移除整列，不是只清空某一格。WHERE 篩選這次要影響的列。更新與刪除若沒有條件，並不會貼心地只碰游標所在的那一筆，而可能作用在整張表。

先用 SELECT 和同一個 WHERE 做預覽，確認識別值與舊資料，而不只是數一共有幾列。定位單筆更正時，穩定的主鍵通常比顯示用文字或可重複的分鐘數更可靠。要更正的若是「仍維持舊值的那一筆」，可以在條件裡同時比對編號與預期舊值，免得先前的判斷已失效還硬改。

## 範例：用拋棄式資料走完新增、更正與移除

開啟 `C:\dev\stackway-lab\sql`，將範例另存為 `correct-entry.py`。執行修改前，先說出條件預期選中幾筆；完成後用查詢重新讀取，別只依「沒有出錯」判定資料已正確。

在該目錄執行：Windows PowerShell 用 `py correct-entry.py`；macOS／Linux 用 `python3 correct-entry.py`。

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE entry(id INTEGER PRIMARY KEY, minutes INTEGER NOT NULL)")
db.executemany("INSERT INTO entry(id, minutes) VALUES (?, ?)", [(1, 20), (2, 20)])
where = " WHERE id = ? AND minutes = ?"
target = (2, 20)
preview = db.execute("SELECT id, minutes FROM entry" + where, target).fetchall()
print("before:", preview)
if preview == [(2, 20)]:
    changed = db.execute("UPDATE entry SET minutes = ?" + where, (25, *target))
    print("updated:", changed.rowcount)
print("kept:", db.execute("SELECT * FROM entry ORDER BY id").fetchall())
remove = " WHERE id = ?"
print("remove:", db.execute("SELECT * FROM entry" + remove, (1,)).fetchall())
db.execute("DELETE FROM entry" + remove, (1,))
print("after:", db.execute("SELECT * FROM entry ORDER BY id").fetchall())
db.close()
```

整段只在記憶體執行，重跑會重新建表。問號是參數預留位置 (parameter placeholder)，值由 Python 分開傳入，依出現順序配對，不要把外來文字自己拼進 SQL。這裡共用的是自己寫好的固定條件片段，不是使用者輸入。預覽應只看到第二筆的舊值；實際更新還要看到影響筆數為一，而且第一筆保持 20。最後才另行預覽和移除第一筆，結尾留下第二筆 25 分鐘。

### 讓一次過期更正自然失效

把 target 裡的 20 改成 19，保留建表內容。預覽就找不到符合的列，檢查也不會放行更新。這不代表程式成功地把 19 改掉，反而代表「我的假設和資料不符」。若這是實際的編輯畫面，應重新讀取資料並讓人核對，不要把條件刪掉直到看見有列被改。

預覽時也別只印出分鐘數。2 筆恰好都是 20，你可能拿著同一個數字核對了錯的人選；把識別值留在紀錄裡，才能分清修的是第二次練習，沒被這次更正碰到的是第一次。

## 常見錯誤

誤把刪除整列當成把分鐘改成 0；前者連這筆練過的事實也消失。也不要把人工先查看、幾分鐘後再修改當成多人系統的完整保障，中間可能有別的寫入。這裡只練單一連線；之後在[〈SQL 交易與回復〉](#/lesson/fd-sql-04-txn)會處理必須一起完成的一組寫入。

## 小結

安全的更正能交出三份證據：動手前選中哪一筆、實際影響幾筆、動手後哪一筆保持原樣。不要用「沒有報錯」代替這三個答案。
