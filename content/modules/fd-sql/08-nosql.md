---
id: fd-sql-08-nosql
module: fd-sql
order: 8
title: 文件資料庫與鍵值儲存
subtitle: 同一個物件要存成表、文件還是鍵值
status: ready
minutes: 30
level: 2
prereqs:
  - fd-sql-05-index
objectives:
  - 比較關聯式、文件與 Redis 鍵值模型的讀寫模式
  - 為交易紀錄、商品規格與暫存結果各寫一個選擇理由
tags:
  - sql
  - nosql
resources:
  - title: MongoDB：從存取方式設計文件
    url: https://www.mongodb.com/docs/manual/data-modeling/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Redis：鍵與資料型別
    url: https://redis.io/docs/latest/develop/data-types/
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-sql-storage-fit
    prompt: 為何不能只看資料外觀就決定資料庫模型？
    answer: 還要比較主要存取方式、必須一起成立的寫入，以及遺失後能否重建。
    mcq:
      question: 交易明細必須可對帳且不能只寫一半，最直接的設計理由是什麼？
      options:
        - 需要穩定來源、關聯與交易約束
        - 結帳頁通常會一起讀取品名和規格
        - 首頁已能用一個鍵讀到售出數量
        - 規格欄位常新增，應先求形狀彈性
      answer: 0
      explain: 應優先滿足交易與核對需求，而非從顯示外觀決定。
    interview:
      question: 規格頁、交易與暫存要怎麼選，才不是為用工具而用？
      points:
        - 各自描述常見讀法
        - 交易保留正式來源
        - 說出遺失與重算途徑
      answer: 我會先保住可對帳的交易，再看規格是否適合整份讀。熱門數字若重算有成本，才另做有期限的鍵值快取；快取消失時仍應能從交易重建。
  - id: fd-sql-document-embed
    prompt: 什麼條件下適合把規格嵌入商品文件？
    answer: 規格經常和商品一起讀、規模有界，而且是這份商品的資料。
    mcq:
      question: 哪個最適合與商品同放一份文件？
      options:
        - 無上限成長的全店交易史
        - 隨商品頁一起讀的有限規格
        - 所有顧客的清單
        - 每秒更新的全站監控紀錄
      answer: 1
      explain: 共同讀取、有界且屬於同一筆商品，比無關的持續成長資料更合適。
  - id: fd-sql-cache-source
    prompt: 暫存總數過期後，設計要能回答什麼？
    answer: 知道到哪個正式來源重算，並能區分快取沒有值和真正的數字 0。
    mcq:
      question: 快取鍵不存在時，最合理的下一步是什麼？
      options:
        - 把未命中當成售出數字 0
        - 沿用上次畫面上的數字當正式來源
        - 向正式交易資料重算
        - 只把期限設得更長，不重新取值
      answer: 2
      explain: 快取未命中表示暫存沒有答案，不表示正式答案是 0。
  - id: fd-sql-cache-freshness
    prompt: 有設定 TTL 就能保證快取永遠是最新資料嗎？
    answer: 不能；來源可能在期限內先更新，還要考慮失效或容許的落差。
practice:
  - id: fd-sql-b04-08-p1
    title: 寫一張附帶失效條件的模型選擇卡
    kind: explain
    minutes: 12
    steps:
      - 儲存 storage-shapes.py，寫出三個讀取結果
      - 用三句話分別選交易、規格、暫存的模型及理由
      - 在 storage-note.md 註記快取遺失時重算來源，以及哪種需求改變會讓你重新選擇
    checks:
      - 有分清 80 頁與售出 5 本
      - 未命中不是賣出 0 本
      - 沒有把字典實驗當作真實資料庫效能比較
---

## 看一頁商品、記一筆交易、快取一個總數

同一間小店需要三種回答：保存不能只完成一半的交易、展示欄位各不相同的商品規格、快速拿到可以重算的首頁數字。把三件事一律稱為「存一個物件」，就看不出取捨。先問哪一種讀取最常見、哪些更新必須一起成立，以及資料不見時能不能重算，再談資料庫名稱。

## 3 種模型，3 個存取起點

關聯式模型 (relational model) 用表、列和鍵表示事實及其關係，適合需要跨紀錄核對、連接查詢或交易約束的資料。例如訂單與明細有不同身分，結帳時要一起確認與提交。文件模型 (document model) 把一筆資料表示成有欄位、可巢狀的文件。若看一頁商品通常同時讀取品名與規格，可以把有限大小的規格嵌在同一份文件中；茶壺有容量、筆記本有頁數，不必假定每種商品都共享每一個欄位。

鍵值模型 (key-value model) 最直接的讀法是「已知鍵，取出對應的值」。Redis 是可依鍵查值的記憶體資料儲存系統；實際如何讓資料到期，見[〈Redis 快取與到期時間〉](#/lesson/fs-services-01-redis)。它除了字串也支援多種資料結構；若用它來存可重算的暫存結果，可以用鍵表達計算範圍，設定存活時間 (time to live, TTL)，過期後回到正式來源重算。期限不表示內容在期限內一定新鮮；原始資料若先變了，可能要主動讓快取失效。

## 範例：比較同一個商品的 3 條讀取路徑

先寫下實際要問的查詢，再選資料長相。適合整份讀回的文件，不一定適合依不同欄位交叉查找。把下面的範例存成 `C:\dev\stackway-lab\sql` 裡的 `storage-shapes.py`。

在該目錄執行：Windows PowerShell 用 `py storage-shapes.py`；macOS／Linux 用 `python3 storage-shapes.py`。

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE sale(id INTEGER PRIMARY KEY, sku TEXT, quantity INTEGER)")
db.executemany("INSERT INTO sale VALUES (?, ?, ?)", [(1, "P7", 2), (2, "P7", 3)])
catalog = {"P7": {"sku": "P7", "spec": {"pages": 80}}}
cache = {}
key = "sold:P7"
print("page:", catalog["P7"]["spec"])
print("before:", cache.get(key))
total = db.execute("SELECT SUM(quantity) FROM sale WHERE sku = ?", ("P7",)).fetchone()[0]
cache[key] = total
print("cached:", cache[key])
db.close()
```

這裡只有關聯式部分真的透過 SQLite；文件和快取使用 Python 字典示意資料形狀與讀法，沒有安裝 MongoDB 或 Redis，也沒有模擬耐久性或自動過期。產品頁直接讀規格得到 80 頁；快取原先取不到值，才依商品編號回正式交易資料計算總數 5。清空字典不會刪除交易，因為快取不是這個事實唯一的來源。

### 改一個需求，原來的好選擇可能失效

若常見問題改成「所有商品裡哪些規格大於某個門檻」，只拿已知鍵取一份快取就不夠，得重新設計查詢、索引或彙總。若在一份商品文件裡嵌入無限成長的所有歷史交易，平常只是看規格也可能拖著大量不相干的歷史。文件可以採參照，關聯式資料庫也能保存彈性欄位；這不是硬把產品分成三個互斥盒子，而是要說明目前這條讀寫路徑為何適合。

## 常見錯誤

把正式交易只存成會過期的快取鍵，等資料消失才發現無法重建。另一個錯是宣稱文件資料庫一律沒有交易，或把鍵值模型說成只能放純文字；那些都不是選擇這個模型的決定性理由。先列出必要保證，再去核對實際產品提供哪些能力。

## 小結

為三種需求各寫一句「我怎麼讀、怎麼改、少了怎麼辦」。能說出快取遺失後去哪裡重算，比背出三個資料庫品牌更接近實際設計。
