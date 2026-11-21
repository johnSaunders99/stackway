---
id: fd-sql-03-groups
module: fd-sql
order: 5
title: GROUP BY 與彙總
subtitle: 把明細變成一列一組
status: ready
minutes: 30
level: 2
prereqs:
  - fd-sql-02-joins
objectives:
  - 以分組查詢統計每週次數
  - 比較 COUNT 欄位與 COUNT 全列
tags:
  - sql
  - aggregate
resources:
  - title: SQLite：COUNT、SUM 等彙總函式
    url: https://www.sqlite.org/lang_aggfunc.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-sql-count-null
    prompt: COUNT(*) 與 COUNT(minutes) 遇到缺值時有何差別？
    answer: 前者計所有列，後者只計 minutes 不為 NULL 的列，數字 0 仍算。
    mcq:
      question: 一組分鐘是 20、NULL、0，兩種 COUNT 依序是多少？
      options:
        - 2 與 1
        - 3 與 2
        - 3 與 3
        - 2 與 2
      answer: 1
      explain: 有 3 列、2 個已知數字；0 不能當空值。
    interview:
      question: 某週顯示 0 分鐘，你會如何區分真的 0 和根本沒填？
      points:
        - 保留總筆數
        - 計已知欄位
        - 分開解讀總和與空值
      answer: 我會把總筆數、已填分鐘的筆數及總和並列。若已填筆數是 0，應顯示缺資料；若有人填過 0，就保留它是已知紀錄的事實。
  - id: fd-sql-group-grain
    prompt: GROUP BY week 之後，結果一列代表什麼？
    answer: 代表來源中出現的一個週別及其組內統計。
    mcq:
      question: 想把多筆明細收成每週一列，主要靠哪一段？
      options:
        - ORDER BY week
        - LIMIT 1
        - GROUP BY week
        - WHERE week = 'W1'
      answer: 2
      explain: 排序僅調先後，限量則丟列，都不是分組。
  - id: fd-sql-sum-unknown
    prompt: 一組分鐘全部是 NULL 時，SUM 和已填次數各為何？
    answer: SUM 是 NULL，COUNT(minutes) 是 0；沒有已知值可加不是已知總和 0。
  - id: fd-sql-empty-group
    prompt: 某週沒有任何來源列，單純 GROUP BY week 會產生 0 筆統計的那一列嗎？
    answer: 不會。要顯示沒有紀錄的週，須另提供完整週別清單，保留週別再連接紀錄。
    mcq:
      question: 要讓整週未練也出現在週報，哪個做法能提供缺少的那 1 週？
      options:
        - 把 COUNT(minutes) 改成 COUNT(*)
        - 把排序改成降冪
        - 把 SUM 的結果缺值改顯示 0
        - 以完整週別清單為左側，連接練習紀錄
      answer: 3
      explain: 只換計數、排序或顯示格式不能創造原本不存在的組；先提供完整週別才有列可保留。
practice:
  - id: fd-sql-b04-05-p1
    title: 交付一份標清楚分母的週報
    kind: code
    minutes: 10
    steps:
      - 建立 week-groups.py，逐週手算三個指標
      - 再替第 2 週加入一筆已知 0 分鐘並重跑
      - 留下新舊第 2 週結果
    checks:
      - 第 1 週是 3 筆、2 筆已填、總和 20
      - 第 2 週從一筆未填變 2 筆一筆已填
      - 總和由空值變成 0
---

## 這週到底練了幾次？先決定算哪一種「次」

一週有 3 筆練習紀錄，其中一筆忘了填分鐘。要回答「有幾次練習」，這一筆當然算；要回答「有幾次知道花多久」，它卻不該算。若只挑一個數字叫作次數，之後用它算平均就可能得出另一個問題的答案。把明細摺成週報時，先替每個數字取一個說得出用途的名字。

## 每組回一列，每個函式問一個問題

彙總函式 (aggregate function) 把多列的值變成一個結果。`COUNT(*)` 計算列數，`COUNT(minutes)` 只計算該欄不是空值 (NULL) 的列，`SUM(minutes)` 加總已知的分鐘。0 是一個已知的數字，既不等於空值，也不該因為沒有花時間就從已填筆數裡消失。如果整組都是空值，COUNT 欄位的結果是 0，SUM 則是空值，代表沒有任何已知數字可供加總。

分組 (GROUP BY) 指定把哪些列歸成一組。依週分組就是週別相同的資料進同一組，每組再各自計算，不是把所有列排在同一週旁邊而已。排序 (ORDER BY) 只決定輸出先後，本身不會減少列數。週報裡若要顯示一個欄位，問自己它是分組鍵，還是由組內資料算出的值；不要隨便把某一天的明細標題當成整週的標題。

## 範例：先手畫 2 個籃子

把明細按群組分堆後再計算。結果是一組一列，而不是每筆明細旁都多了一份相同的小計。把下面的範例存成 `C:\dev\stackway-lab\sql` 裡的 `week-groups.py`。

在該目錄執行：Windows PowerShell 用 `py week-groups.py`；macOS／Linux 用 `python3 week-groups.py`。

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE log(week TEXT, minutes INTEGER)")
db.executemany("INSERT INTO log VALUES (?, ?)",
               [("W1", 20), ("W1", None), ("W1", 0), ("W2", None)])
query = """
SELECT week, COUNT(*) AS entries, COUNT(minutes) AS measured, SUM(minutes) AS total
FROM log
GROUP BY week
ORDER BY week
"""
for row in db.execute(query):
    print(row)
db.close()
```

這裡的週別是教學標籤，不拿它推算跨年的日曆。把第 1 週 3 張卡放一疊，先數 3 張，再翻面看有寫數字的只有 2 張；20 加 0 得到 20。第 2 週只有 1 張，但翻面沒有分鐘，於是結果依序是 1、0、空值。Python 會把資料庫的空值印成 None。保留這個差異，週報才有辦法在該顯示「尚未填寫」時，不誤寫成「這週沒花時間」。

### 換個分母，答案就變了

假設第 1 週要顯示「已填時間的平均」，分母是 2，不是 3；分子 20 除以 2 等於 10。若需求改成「未填也一律視作 0」，那是新的產品決定，不是資料庫原先的意思。另一個邊界是完全沒有紀錄的第 3 週：來源裡沒這一組，分組不會平白造出一列 0；要顯示每週，即使沒有紀錄，也需要提供完整週清單再做外部連接。

若有人在畫面上把空值一律顯示成 0，即使 2 週的數字看起來相同，意思也可能不同。把已填次數一起帶給畫面，就能分清楚真正的 0 與查不到時間。

## 常見錯誤

把左外部連接補出的占位列也用 COUNT(*) 當成一次練習。要計算真正配對到的練習，通常計算右側不為空的主鍵。另一個錯是用 WHERE minutes 大於 0 清理資料，連合法 0 值也被刪掉，報表就答不了「填過幾次」。

## 小結

先問一列明細代表什麼，接著問一列週報代表什麼。總筆數、已填筆數和已知分鐘分開保留，讀者才知道這個週報還缺多少資訊。
