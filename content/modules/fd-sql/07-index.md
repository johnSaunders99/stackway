---
id: fd-sql-05-index
module: fd-sql
order: 7
title: 索引與 EXPLAIN
subtitle: 索引不是免費的捷徑
status: ready
minutes: 35
level: 2
prereqs:
  - fd-sql-04-txn
objectives:
  - 預測哪一個查詢會受益
  - 用執行計畫檢查是否掃描整張表
tags:
  - sql
  - index
resources:
  - title: SQLite：閱讀查詢計畫
    url: https://www.sqlite.org/eqp.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-sql-plan-evidence
    prompt: 執行計畫能證明什麼，不能直接證明什麼？
    answer: 能看出規劃器打算採用的存取策略，不能據此推出實測延遲或加速倍數。
    mcq:
      question: 同一個查詢從掃描改成用索引搜尋，哪個結論有證據？
      options:
        - 一定快 10 倍
        - 寫入不受影響
        - 每個查詢都會用它
        - 規劃的存取方式不同
      answer: 3
      explain: 計畫不是計時結果，也不能代表別的查詢。
    interview:
      question: 主管問「建了索引快幾倍」，手上只有前後計畫時怎麼答？
      points:
        - 報告掃描或搜尋的差別
        - 確認答案不變
        - 說明仍需公平計時
      answer: 我能證明這個查詢開始用指定索引、拿到的分鐘沒變。要講快幾倍，還得固定資料量、查詢及快取條件量測，並估算寫入維護成本。
  - id: fd-sql-index-choice
    prompt: 哪一類查詢較值得先評估欄位索引？
    answer: 常用該欄定位少量符合資料的查詢，比每次讀完整張表更可能受益。
    mcq:
      question: 哪個需求最貼近 log_code 的設計？
      options:
        - 從大量紀錄依指定 code 找一筆分鐘
        - 不加條件讀出所有欄位
        - 選出 minutes 小於 10 分鐘的所有列
        - 按 minutes 由大到小取 10 筆
      answer: 0
      explain: 索引依 code 組織，先用對應且能縮小範圍的條件驗證。
  - id: fd-sql-index-maintenance
    prompt: 多建一個索引，寫入端可能付出什麼？
    answer: 占額外空間，相關的新增、更新與刪除也可能需要維護索引。
practice:
  - id: fd-sql-b04-07-p1
    title: 保存同一查詢的前後計畫
    kind: code
    minutes: 12
    steps:
      - 儲存 route-plan.py，抄下兩份 plan 與 answer
      - 圈出表名、存取方式和索引名
      - 寫一句為何這份結果還不能當作加速倍數
    checks:
      - 兩次答案同為 43
      - 能指出哪一份提到 log_code
      - 沒有把計畫數字當毫秒
---

## 同一本簿子，找一個編號和讀每一頁

有 10000 筆練習紀錄。若你要從第一筆讀到最後一筆做總結，直接翻完整份可能很合理；若只要找罕見的一個代碼，每次翻完整份就浪費。索引 (index) 類似另外維護的一份有序查找結構，可以由特定欄位的值縮小候選範圍。但它不是每種問題的捷徑，也不是加上去就能保證使用者感覺變快。

## 查詢要什麼結果，計畫怎麼取得

SQL 查詢描述你要的資料，查詢規劃器 (query planner) 選取得資料的方式。逐一檢查整張表是一種掃描 (scan)；沿著索引找符合條件的區段是一種搜尋 (search)。若索引已包含需要回傳的欄，可能連回表取值都省下。若多數列都要讀，額外繞索引再回表的成本卻不一定划算。比較之前要先固定查詢、資料和期望結果。

執行計畫 (query plan) 是資料庫打算怎麼走，不是實際花費毫秒的收據。SQLite 用 EXPLAIN QUERY PLAN 查看高階策略；不同資料庫使用的指令與輸出名稱可能不同，不要把某個產品的文字標籤背成通用規則。閱讀時先看目標表，再看是掃過全部還是根據條件搜尋，以及有沒有明列索引名字。

## 範例：查詢不改，只新增一份索引

在 `C:\dev\stackway-lab\sql` 新建 `route-plan.py`。把兩次查詢的答案與取得答案的路線分開比。新增索引的目標是改進找法，而非改變該找到的資料。

在該目錄執行：Windows PowerShell 用 `py route-plan.py`；macOS／Linux 用 `python3 route-plan.py`。

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE log(id INTEGER PRIMARY KEY, code TEXT, minutes INTEGER)")
db.executemany("INSERT INTO log VALUES (?, ?, ?)",
               ((i, f"C{i:05}", i % 50) for i in range(10000)))
query = "SELECT minutes FROM log WHERE code = ?"
key = ("C05993",)
def inspect():
    for row in db.execute("EXPLAIN QUERY PLAN " + query, key):
        print("plan:", row[-1])
    print("answer:", db.execute(query, key).fetchall())

inspect()
db.execute("CREATE INDEX log_code ON log(code)")
inspect()
db.close()
```

範例特別用 code 查，不用已經是整數主鍵的 id，免得一開始就在走主鍵捷徑。每筆的分鐘由編號除以 50 的餘數決定，所以目標的答案是 43。觀察第一份計畫是否寫掃描 log，第二份是否提到使用 log_code 搜尋符合的 code。這個樣本是 10000 筆裡挑一筆；兩次答案應一樣，差在取得答案的路線。不同引擎版本的標點或細節可能變化，不必逐字相等。

### 代價是誰付的？

建立索引時要讀資料並產生額外結構，之後每次新增、刪除，或改動該索引欄位，都可能需要維護它。資料變多時它也會占用額外空間。若工作幾乎全是寫入，卻為每個可能搜尋的欄位都建索引，讀取的好處可能抵不過維護費。先拿常見查詢與其選擇性作理由，再用有代表性的資料測實際時間。

## 常見錯誤

看到 SEARCH 就報告快了 10 倍。計畫沒有量測這個倍數；快取和資料分布都會影響結果。反過來，看到 SCAN 也不必一律修，像查詢本來就需要每一列時很合理。先說清楚這一版證明了「策略改變、結果相同」，若要宣稱延遲改善，需另外設計公平的計時。

## 小結

一份可信的索引建議包含三樣東西：要服務的具體查詢、前後兩份計畫、預期增加的寫入或空間成本。先證明走法，再談速度。
