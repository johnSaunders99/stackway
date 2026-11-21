---
id: fd-sql-01-rows
module: fd-sql
order: 1
title: SELECT 篩選與排序
subtitle: 從資料列選出答案
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 將 SELECT、WHERE、ORDER BY、LIMIT 對應到要看的欄、列、順序與筆數
  - 從小表取出需要的欄位
  - 區分排序、篩選與筆數限制
tags:
  - sql
  - select
resources:
  - title: SQLite：SELECT 的子句與順序
    url: https://www.sqlite.org/lang_select.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-sql-select-shape
    prompt: SELECT 與 WHERE 各決定結果的哪個部分？
    answer: SELECT 決定輸出欄，WHERE 決定哪些資料列符合。
    mcq:
      question: 只讓 30 分鐘內的課程入選，要改哪一段？
      options:
        - SELECT 的輸出欄
        - WHERE 的列條件
        - LIMIT 的筆數
        - ORDER BY 的方向
      answer: 1
      explain: 條件作用於每列；限量不會判斷該列分鐘數。
    interview:
      question: 怎麼驗證「30 分鐘內最長的一堂」不是剛好查對？
      points:
        - 準備超過上限與剛好上限的資料
        - 定義平手規則
        - 手算對照
      answer: 我會放一堂 45 分和 2 堂 30 分，確定排除超時又保留邊界。2 堂平手先約定小 id 勝，再看資料庫第一筆是否跟手算一樣。
  - id: fd-sql-sort-tie
    prompt: 只取第一筆時，為何要替並列的排序值再加第二個鍵？
    answer: 避免平手時結果不明確；可用唯一識別值固定先後。
    mcq:
      question: 2 堂同為 30 分鐘，要固定選小 id 怎麼寫？
      options:
        - ORDER BY minutes DESC
        - ORDER BY id DESC, minutes ASC
        - ORDER BY minutes DESC, id ASC
        - ORDER BY minutes DESC, id DESC
      answer: 2
      explain: 限制結果數量或改顯示欄不能打破平手。
  - id: fd-sql-row-limit
    prompt: LIMIT 2 會保證回傳 2 列嗎？
    answer: 不保證；符合條件的列不足 2 筆時，只回傳實有筆數。
practice:
  - id: fd-sql-b04-01-p1
    title: 留下能解釋平手的短課查詢
    kind: code
    minutes: 10
    steps:
      - 儲存 shortlist.py 並手排 4 筆再跑
      - 將 LIMIT 改為 2，記下先後
      - 再把分鐘上限降為 24，留下結果
    checks:
      - 原查詢選 SQL
      - 取 2 筆是 SQL 再 CSS
      - 無課符合時得到空清單
---

## 30 分鐘的空檔，該翻哪一張課程卡？

清單有課名和分鐘數。你只想知道「30 分鐘以內，哪一堂最長？」這個問題看起來只有一句話，裡面其實有四個決定：看課名或整張卡、哪些課合格、如何決定先後、最後取幾筆。結構化查詢語言 (SQL) 能把這四件事分開寫；資料庫替你找答案，原始清單不會因為只顯示一筆就被刪掉。

## 一列是一筆，一欄是一種資料

在關聯式資料庫 (relational database) 裡，資料表 (table) 有命名的欄 (column)，每一列 (row) 描述一筆紀錄。這裡一列是一堂課，id 是識別數字、title 是課名、minutes 是分鐘數。查詢時先在心裡找來源：FROM 指定讀哪張表；WHERE 是列要留下的條件。SELECT 選出結果要顯示的欄，不必把用來篩選的欄也顯示出來。

排序用 ORDER BY，DESC 代表由大到小，ASC 代表由小到大。LIMIT 決定排序後最多保留幾列。若兩堂剛好同分鐘，還要定義誰在前；否則只取第一筆時，資料庫沒有義務替你維持心目中的先後。書寫順序從 SELECT 開始，不用硬背一條電腦實際執行的固定路線；用這四個問題核對意思比較可靠。

## 範例：用 Python 附帶的 SQLite 問第 1 個問題

為查詢與手算結果建立 `C:\dev\stackway-lab\sql`。建立 `shortlist.py`。先手選符合條件的列，再排出顯示順序。過濾、排序和最後留下幾筆是三個能分別驗算的動作。

在該目錄執行：Windows PowerShell 用 `py shortlist.py`；macOS／Linux 用 `python3 shortlist.py`。

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE lesson(id INTEGER PRIMARY KEY, title TEXT, minutes INTEGER)")
db.executemany("INSERT INTO lesson VALUES (?, ?, ?)",
               [(1, "DNS", 25), (2, "SQL", 30), (3, "CSS", 30), (4, "GPU", 45)])
query = """
SELECT title
FROM lesson
WHERE minutes <= 30
ORDER BY minutes DESC, id ASC
LIMIT 1
"""
print(db.execute(query).fetchall())
db.close()
```

SQLite 是直接在程式內執行的資料庫引擎。冒號包著的 memory 表示這次使用記憶體，不會連上別人的資料庫。前兩個寫入動作只為建好練習材料；建表在[〈資料表與正規化〉](#/lesson/fd-sql-02-model)、新增在[〈SQL 新增、修改與刪除〉](#/lesson/fd-sql-03-write)會細講。執行查詢後取回所有結果，這次只有 1 列一欄。Python 顯示的方括號、括號和逗號是結果容器的外觀，不是課名的一部分。

先把 4 張卡在紙上排一次。45 超過上限，先排除；2 張 30 分鐘並列，以識別數字小的先出，所以答案是 SQL。若改成取 2 筆，第二個應是 CSS，而不是原始清單第一堂 DNS。若把容許上限降到 24，答案則是空清單，不是資料庫出錯。這兩個小改動分別在測筆數與篩選，不需要更動建表程式。

如果需求忽然改成「不管課名，看看各有幾分鐘」，該動的是輸出欄位，不是把篩選取消。把要顯示的資料和用來判斷的資料分開思考，之後讀更長的查詢也比較不會迷路。

## 常見錯誤

看到第一堂回傳就把它稱作最長，但查詢根本沒指定排序；或者用小於 30，不小心把剛好符合上限的 2 堂都濾掉。設計測資時刻意留一筆邊界和 2 筆平手，才能看見這些差異。沒有 ORDER BY 的結果即使每次看起來都一樣，也不構成順序保證。

## 小結

用四個動作重述查詢：選欄、篩列、排序、限量。如果別人讀完就能在 4 張卡上算出同一個答案，你的問題才真的問清楚了。
