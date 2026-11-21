---
id: fs-data-02-mapper
module: fs-data
order: 2
title: Prisma ORM 與查詢
subtitle: 從物件追到 ORM 產生的查詢
status: ready
minutes: 30
level: 3
prereqs:
  - fs-data-01-schema
objectives:
  - 用 Prisma schema 與 Client 各寫出同一資料實體的對應關係
  - 對照物件關聯與 SQL JOIN
  - 從查詢次數辨認逐筆讀取問題
tags:
  - data
  - orm
resources:
  - title: "Prisma ORM 7：關聯讀取"
    url: "https://www.prisma.io/docs/orm/v7/prisma-client/queries/relation-queries"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "Prisma ORM 7：辨認逐筆查詢"
    url: "https://www.prisma.io/docs/orm/v7/prisma-client/queries/advanced/query-optimization-performance"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-data-02-mapper-relation"
    prompt: "書的 shelfId 和 shelf 有什麼不同？"
    answer: "前者存外鍵，後者描述如何取得關聯物件。"
    mcq:
      options:
        - "兩者都存整筆父列。"
        - "前者存外鍵，後者描述如何取得關聯物件。"
        - "後者一定是文字欄位。"
        - "前者只存在程式記憶體。"
      answer: 1
      explain: "外鍵是實際資料；關聯欄位描述從書走到書架的路。"
    interview:
      question: "書架從 3 架變成 50 架後頁面變慢，你會如何查？"
      points:
        - "比較實際查詢數"
        - "評估批次或聯結"
        - "確認空架仍存在"
      answer: "我會先看是否每多一架就多一次讀書。若是，改用關聯載入或一次取這批架上的書再分組。最後用相同輸入比次數，也確認沒有書的架沒消失。"
  - id: "fs-data-02-mapper-nplus"
    prompt: "書架數增加時，哪個訊號最像逐筆查詢？"
    answer: "相同形狀的子查詢次數隨書架數增加"
    mcq:
      options:
        - "每本書的標題變長"
        - "畫面清單依架號排序"
        - "相同形狀的子查詢次數隨書架數增加"
        - "回傳的第一架沒有書"
      answer: 2
      explain: "辨認逐筆讀取要數對資料庫的呼叫，不能只看回應的大小。"
  - id: "fs-data-02-mapper-shape"
    prompt: "載入關聯是否代表資料庫只收到一條 JOIN？"
    answer: "不一定，要看策略和實際查詢紀錄。"
    mcq:
      options:
        - "一定，因為回傳的是巢狀物件。"
        - "一定，只要使用非同步函式。"
        - "不可能，聯結不能取得關聯資料。"
        - "不一定，要看策略和實際查詢紀錄。"
      answer: 3
      explain: "一次呼叫描述要什麼，不保證底層如何組裝。"
  - id: fs-data-02-mapper-projection
    prompt: "畫面只要每架書的數量，一定要讀回完整的書物件嗎？"
    answer: "不必，可考慮在資料庫按架計數，但仍要保留數量為 0 的書架。"
practice:
  - id: "fs-data-02-mapper-p1"
    title: "留一份關聯讀取的計數紀錄"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 shelves.py"
      - "加入兩個空架再執行"
      - "在腳本註解記下兩次往返數與 Prisma 對應讀法"
    checks:
      - "兩種策略都保留空架"
      - "架數從 2 到 4 時，逐筆查詢從 3 次變 5 次，聯結維持 1 次"
---

## 為什麼要學：畫面只按一次，資料庫忙了幾次？

每個書架下方列出它的書。路由可能短到只有幾行，但如果先查全館書架，接著每架都問一次「這裡有哪些書」，頁面時間就會跟書架數一起長。物件關聯對映（object-relational mapping，ORM）讓你用程式物件描述資料表，不代表它能替你猜出下一個畫面需要的欄位。

## 核心概念：同一條關係的兩面

以使用 Prisma ORM 7 的既有專案為例，在 `schema.prisma` 裡，`model Shelf` 有 `id Int @id` 和 `books Book[]`；`model Book` 有 `id Int @id`、`shelfId Int`、`shelf Shelf @relation(fields: [shelfId], references: [id])`。每個欄位在模型中各占一行。書那側的整數會存進資料表；架上的書清單是讀取方向，不是把整排書塞進某個儲存格。模型描述形狀，產生的用戶端（Client）才是應用程式用來查詢的介面。

這裡刻意標明版本：下列是 Prisma ORM 7 的 schema 與產生式 Client 寫法，不與其他主版本的查詢介面混用。在已有此版設定、資料來源及產生器的練習專案，把下面兩個模型加入 `prisma/schema.prisma`（已有同名模型時請用獨立練習副本）。`Shelf` 的陣列指向多本書；`Book` 的外鍵欄位才是資料表實際保存的指標。

```prisma
model Shelf {
  id    Int    @id
  books Book[]
}

model Book {
  id      Int   @id
  shelfId Int
  shelf   Shelf @relation(fields: [shelfId], references: [id])
}
```

在已有對應資料表、重新產生且已初始化用戶端的程式中，`await prisma.shelf.findMany({ include: { books: true } })` 表示書架連同書一併取出。SQL 可以用左聯結（LEFT JOIN）表達同樣的關係；它交回扁平的列，有書的架可能出現多次，空架則在書的欄位得到空值。物件清單會按架組回巢狀結構，空架的書應是一個空陣列。兩邊可呈現相同資訊，輸出外形不必一模一樣。

## 範例：讓查詢自己報數

把 `shelves.py` 放在 `C:\dev\stackway-lab\data`，執行 `py shelves.py`；macOS／Linux 用 `python3 shelves.py`。這個對照實驗實際送出 SQL，不需裝 Prisma，也不把測到的次數冒充 Prisma 的查詢計畫。

```python
import sqlite3
db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE shelf(id INTEGER PRIMARY KEY);
CREATE TABLE book(id INTEGER PRIMARY KEY, shelfId INTEGER);
INSERT INTO shelf VALUES(1),(2);
INSERT INTO book VALUES(10,1),(11,1);
""")
calls = []
db.set_trace_callback(calls.append)
for (s,) in db.execute("SELECT id FROM shelf ORDER BY id"):
    print(s, list(db.execute("SELECT id FROM book WHERE shelfId=?", (s,))))
print("per shelf:", len(calls))
calls.clear()
print(list(db.execute("""SELECT shelf.id, book.id FROM shelf LEFT JOIN book
  ON book.shelfId=shelf.id ORDER BY shelf.id, book.id""")))
print("joined:", len(calls))
```

把迴圈看成兩段路：第一段取清單只走一次；第二段連空架都要跑一趟才知道沒書。這就是常說的 N+1 查詢。另一個選項是先取全架識別碼，再用一次集合查詢取這些架上的書，於程式內分組。它不是一條聯結，但也不用每架問一次。

### 手算一次，再對照紀錄

攤開聯結結果，把第一、二列裡相同的架號圈在一起。它們不是兩個書架，而是一架上有兩本書；第三列的空值也不是一本沒有編號的書，而是一個沒有配對到書的架。現在反過來寫給用戶端的規格：輸出應有幾個架物件？各自的書陣列長度是多少？把答案寫在腳本旁，再不看上例，從樣本寫出模型的關聯欄位和用戶端呼叫，預測兩個陣列的長度分別為 2 和 0。若改成只顯示每架的書本數，可能根本不需要把每本書傳回應用，需求一換，最佳的讀法也跟著換。

## 常見錯誤：一次函式呼叫不等於一次往返

關聯載入可以在資料庫聯結，也可以用多次查詢再組合，會受版本、資料庫及策略影響。在真正的專案開啟查詢紀錄，拿同樣的輸入比對；別把整本書的內文也載入只顯示書名的頁面。若一本書都沒有的架消失，先確認是否誤用了只保留配對成功資料的內聯結，別先怪 ORM 漏資料。

## 小結

模型回答「兩者怎麼連」，呼叫回答「畫面需要什麼」，紀錄才回答「實際做幾次」。保留一次空架的輸出，日後調快查詢時，它會提醒你不要順便改掉清單的意思。
