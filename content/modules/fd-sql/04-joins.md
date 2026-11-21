---
id: fd-sql-02-joins
module: fd-sql
order: 4
title: JOIN 與外部連接
subtitle: 兩張表怎麼接才不會少算
status: ready
minutes: 25
level: 2
prereqs:
  - fd-sql-03-write
objectives:
  - 找出主鍵與外鍵
  - 用一筆沒有配對的資料比較兩種 JOIN
tags:
  - sql
  - join
resources:
  - title: PostgreSQL：用 2 張表查詢
    url: https://www.postgresql.org/docs/current/tutorial-join.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-sql-join-preserve
    prompt: 要讓沒練過的課仍出現，LEFT JOIN 哪邊應放課目錄？
    answer: 放左側；未配對的左列仍保留，右側欄位補 NULL。
    mcq:
      question: 課目錄 2 門，只有第一門有 2 次練習，左連接回傳幾列？
      options:
        - 3 列
        - 一列
        - 2 列
        - 4 列
      answer: 0
      explain: 第一門有 2 組配對，第二門還保留一列。
    interview:
      question: 進度表漏了還沒練的課，你會怎麼證明修改真的有效？
      points:
        - 保留課目錄的一側
        - 比對主外鍵
        - 測 0 次及 2 次練習
      answer: 我會造 2 門課，一門 2 次、一門 0 次。以課目錄左連接練習表，應看到前者 2 列、後者一列且練習編號為空，再確認後續條件沒把它濾掉。
  - id: fd-sql-join-predicate
    prompt: 為什麼不能直接用課程 id 等於練習 id？
    answer: 它們分別辨認課程與練習，應比對課程主鍵與練習的課程外鍵。
    mcq:
      question: 哪個條件表達「這次練的是這門課」？
      options:
        - c.id = a.id
        - c.id = a.course_id
        - c.title = a.id
        - c.id > a.id
      answer: 1
      explain: 欄位名稱相似不表示語意相同；course_id 才是課程參照。
  - id: fd-sql-outer-filter
    prompt: 左連接後若 WHERE 要求右表 id 大於 0，未配對列會如何？
    answer: 該列的右側 id 是 NULL，不滿足條件，會被篩掉。
practice:
  - id: fd-sql-b04-04-p1
    title: 畫出兩種 JOIN 的結果
    kind: code
    minutes: 10
    steps:
      - 建立 progress-join.py，在執行前把 4 筆來源資料畫成箭頭
      - 列出兩種查詢的結果並圈出多的一列
      - 替第二堂加一次練習再比較
    checks:
      - 起初內部連接 2 列、左外部連接 3 列
      - 新增配對後兩種結果相同
      - 未配對不是 0 號練習
---

## 沒練過的課，也該出現在進度表

課程目錄有網路和資料庫兩堂，練習紀錄卻只有網路的 2 次。你把兩張表接起來想顯示進度，畫面最後只剩網路。這不是資料庫刪掉了一門課，而是查詢只留下「左右都有對象」的組合。做報表前，先問沒配對的那一方究竟應該消失，還是該留下來提醒你。

## 先決定依哪個鍵配對，再決定誰要保留

連接 (join) 讓查詢把來自兩張表的欄位放到同一列。ON 寫配對條件：這裡讓練習的課程外鍵等於課程表的主鍵。不能因為兩欄都叫 id 就直接相等；課程編號識別一堂課，練習編號識別一次練習，是兩種事物。兩表欄位同名時，用表的別名加點號說清楚你指哪一邊。

內部連接 (inner join) 只輸出符合配對條件的組合；一般寫 JOIN 加 ON 就是這個意思。左外部連接 (left outer join) 除了輸出符合的組合，也為沒有配對的左表列保留一列，右表欄位以空值 (NULL) 補上。左邊指的是 FROM 裡先寫下來的那張表，不是畫在筆記左邊的那張。若需求是「每一門課都要出現」，課目錄就應放在需要保留的那一側。

## 範例：同一批資料，只換連接方式

在 `C:\dev\stackway-lab\sql` 新建 `progress-join.py`。找一筆右表沒有配對的資料，手動比較兩種連接的結果。缺少配對不等於左表原本沒有那筆紀錄。

在該目錄執行：Windows PowerShell 用 `py progress-join.py`；macOS／Linux 用 `python3 progress-join.py`。

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE course(id INTEGER PRIMARY KEY, title TEXT);
CREATE TABLE attempt(id INTEGER PRIMARY KEY, course_id INTEGER REFERENCES course(id));
INSERT INTO course VALUES (1, 'DNS'), (2, 'SQL');
INSERT INTO attempt VALUES (10, 1), (11, 1);
""")
for join in ("JOIN", "LEFT JOIN"):
    query = f"""SELECT c.title, a.id FROM course AS c
                {join} attempt AS a ON c.id = a.course_id
                ORDER BY c.id, a.id"""
    print(join, db.execute(query).fetchall())
db.close()
```

程式只在兩個固定關鍵字之間選擇，沒有接受外來的查詢片段。先不要看結果，拿第一堂課去練習表找：它對上 10 號和 11 號，所以兩種查詢各印出 2 列 DNS。再拿第二堂課找一次，找不到任何練習。內部連接不產生列；左外部連接才額外產生 SQL 的那一列，右側的空值在 Python 顯示成 None。這不是識別值 0，也不是一筆真的練習。

### 一堂課不一定只佔一列

一對多連接之後，結果的一列代表一個配對，不再保證代表一門獨立課程。想算完成幾門時，不能拿整份結果的列數直接交差。之後在[〈GROUP BY 與彙總〉](#/lesson/fd-sql-03-groups)會細講如何以正確單位計數。現在先拿紙筆圈出哪兩列其實都在談同一門，這會比盲目去掉重複更有用。

也可以從另一端驗算：若把練習表放在左側，沒有練習的那門課連起始列都不存在，再怎樣保留左列也救不回它。這正是報表該先由課程還是由練習出發的差別。

## 常見錯誤

想保留未練課程，卻在 LEFT JOIN 後用 WHERE 要求右表的練習編號必須大於 0，剛補出的空值列也被篩掉。若需求是限制哪些右表資料可配對，又想保留所有左列，應把該條件加入 ON，再用未配對樣本驗證。

## 小結

先說結果的一列代表什麼，再挑配對鍵和保留側。拿一筆有 2 個配對、一筆完全沒配對的樣本，兩種連接的差異就自己浮現了。
