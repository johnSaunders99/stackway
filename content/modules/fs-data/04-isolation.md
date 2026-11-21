---
id: fs-data-04-isolation
module: fs-data
order: 4
title: 交易隔離層級
subtitle: 兩個連線讀到的是哪個版本
status: ready
minutes: 35
level: 3
prereqs:
  - fs-data-03-migration
objectives:
  - 用兩條交易的時間線比較兩次讀取
  - 區分隔離保證、鎖與應用程式重試的責任
tags:
  - data
  - isolation
resources:
  - title: "PostgreSQL：交易隔離"
    url: "https://www.postgresql.org/docs/current/transaction-iso.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-data-04-isolation-snapshot"
    prompt: "PostgreSQL 的 Read Committed 下，連續兩次普通 SELECT 看哪個版本？"
    answer: "各讀取該指令開始時已提交的快照，加上本交易自己的變更。"
    mcq:
      options:
        - "兩次永遠只讀交易開始前的資料。"
        - "讀到其他交易尚未提交的改動。"
        - "都必須等所有寫入連線離開。"
        - "各讀取該指令開始時已提交的快照，加上本交易自己的變更。"
      answer: 3
      explain: "交易相同不代表指令共用快照；是否已提交與讀取起點都重要。"
    interview:
      question: "盤點報表上下兩段數字不一致，你先問什麼？"
      points:
        - "問讀取是否同一交易"
        - "對齊讀取與提交時間"
        - "區分一致視圖與寫入鎖"
      answer: "我會先畫出兩段查詢與他人提交的順序。如果報表需要同一張照片，我會在同一筆可重複讀交易裡取數；不會為了讀報表就先鎖住所有寫入。"
  - id: "fs-data-04-isolation-stable"
    prompt: "同筆 PostgreSQL Repeatable Read 交易的普通讀取何時取得共用快照？"
    answer: "第一個非交易控制指令開始時"
    mcq:
      options:
        - "第一個非交易控制指令開始時"
        - "輸入 BEGIN 的那一刻一定取得"
        - "每讀下一列就重新取得"
        - "另一條連線提交時才取得"
      answer: 0
      explain: "BEGIN 宣告邊界，第一次實際查詢可能稍晚才開始。"
  - id: "fs-data-04-isolation-retry"
    prompt: "遇到序列化失敗，安全的重試單位是什麼？"
    answer: "回復後從頭重跑整筆交易及其判斷"
    mcq:
      options:
        - "只重送最後一次寫入"
        - "回復後從頭重跑整筆交易及其判斷"
        - "不回復就直接提交"
        - "無上限重送外部通知"
      answer: 1
      explain: "舊判斷可能依賴過時讀值；重試應有上限，外部副作用另行防重。"
practice:
  - id: "fs-data-04-isolation-p1"
    title: "畫出兩個讀取版本"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 snapshot.py，照輸出畫 A 讀、B 提交、A 再讀的時間線"
      - "把提交移到記錄 first 之前再跑，刪去原位置的提交"
      - "寫下兩種模式何時得出相同值"
    checks:
      - "原例的兩條讀取線分別是 4→7 及 4→4"
      - "指出快照不等於鎖住寫入者"
---

## 為什麼要學：同一份報表，2 次讀取不同

盤點頁上方顯示剩餘數量，下方顯示明細。兩段查詢中間剛好補貨；即使兩段都放在同一筆交易（transaction），也不一定看到同一個世界。隔離層級（isolation level）描述多筆交易同時進行時允許看到哪些變化。本課以 PostgreSQL 的普通查詢為準，不把某個引擎的預設當成所有資料庫的承諾。

## 核心概念：給讀取標出拍照時間

把已提交的資料想成一連串照片。甲先讀時只有數量 4 的照片；乙接著把數量改成 7，在乙提交前，甲不能看到這次改動。乙提交之後，甲下一次讀哪一張？在讀取已提交（Read Committed）下，通常每條普通查詢開始時各取快照（snapshot），因此第二條可以看見 7。不是一條查詢讀到一半就更換版本。

改用可重複讀（Repeatable Read），甲的第一個非交易控制指令確立快照，後續普通讀取沿用它，直到交易結束。甲仍看得到自己在交易內做的修改。乙可以提交，甲卻仍看到 4，兩件事沒有矛盾：穩定的讀取視圖不是不准別人寫入的鎖（lock）。甲結束交易再開新交易，就能取得較新的快照。

## 範例：把可見的提交編號印出來

在 `C:\dev\stackway-lab\data` 存 `snapshot.py`，執行 `py snapshot.py`；macOS／Linux 用 `python3 snapshot.py`。這是以版本清單演算時間線，不是拿 SQLite 假裝測過 PostgreSQL。把每個索引看成一次提交，把第一個索引寫在紙上，再往下讀。

```python
for mode in ("read committed", "repeatable read"):
    versions = [4]
    first = len(versions) - 1
    print(mode, "A1", versions[first])
    versions.append(7)  # B commits after A1
    visible = len(versions) - 1 if mode == "read committed" else first
    print(mode, "A2", versions[visible])
```

要在練習用 PostgreSQL 重播，先在一個獨立測試表放一筆數量 4 的資料。用兩條不同連線，甲以指定層級開始、讀值並保持交易開啟；乙更新同一筆並提交，回到甲再讀才結束。可選的實機對照：只在已有的拋棄式 PostgreSQL 練習資料庫操作。確認表名尚未使用；兩個查詢視窗必須連同一個資料庫、使用不同連線。先在乙以自動提交執行一次建表：`CREATE TABLE sw_iso_lab(n integer NOT NULL);`、`INSERT INTO sw_iso_lab VALUES (4);`。甲依序執行 `BEGIN ISOLATION LEVEL READ COMMITTED;` 與 `SELECT n FROM sw_iso_lab;`，留著交易不結束。乙執行 `UPDATE sw_iso_lab SET n=7;` 並確認已提交。甲再執行同一句查詢，記錄結果才執行 `COMMIT;`。在兩筆交易外把練習表改回 4，然後只換甲的層級為 `REPEATABLE READ` 重播。若兩次讀取各開了新連線，驗到的就不是同一筆交易的隔離效果。

### 換一個提交位置

如果乙改了數字卻一直沒有提交，把甲的兩次讀取都排在乙提交前，兩種層級會得到相同結果。這不能用來證明兩種層級沒有差別，而是你的排法沒有碰到會使它們分歧的時刻。再試把乙的提交放在甲第一次讀之前：兩次都會從新的數字開始。可以區分兩者的例子，一定要讓其他交易的提交落在同一讀者的兩次查詢中間。

## 常見錯誤：把重試縮成最後一行

可序列化（Serializable）要求已成功提交的效果等同某種逐筆順序，不保證每次嘗試都能成功。更新互相衝突也可能讓可重複讀交易失敗。遇到應重試的序列化錯誤，要回復、重新讀取、重新判斷，再決定寫什麼；重送依舊值算好的結果並不等於重做交易。給重試次數設上限，並避免在嘗試途中寄出不可收回的通知。

## 小結

讀取需要穩定畫面，就問快照何時確立；修改需要競爭同一席，就問哪一步仲裁。這是兩個不同的問題，之後在[〈並行交易與重複預約〉](#/lesson/fs-data-04-double)會用最後一席來驗證。
