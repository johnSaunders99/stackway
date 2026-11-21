---
id: fs-data-04-double
module: fs-data
order: 5
title: 並行交易與重複預約
subtitle: 兩個人搶最後一席
status: ready
minutes: 35
level: 3
prereqs:
  - fs-data-04-isolation
objectives:
  - 重播先讀後寫造成的競爭
  - 在交易內驗證剩餘數量不為負
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
  - id: "fs-data-04-double-race"
    prompt: "兩條連線都先讀到剩 1 席，為何可能售出 2 張？"
    answer: "兩次讀取都不是保留，決定與寫入之間可交錯。"
    mcq:
      options:
        - "兩次讀取都不是保留，決定與寫入之間可交錯。"
        - "只要讀取就會把票扣掉。"
        - "交易會自動讓第二個人放棄。"
        - "最後的庫存值是 0 就保證沒有超賣。"
      answer: 0
      explain: "兩個人都寫回 0 也可能各開一張票，不能只查庫存。"
    interview:
      question: "只查庫存不小於 0 夠不夠？你會如何證明不超賣？"
      points:
        - "解釋舊讀值覆寫"
        - "依條件扣位與列數開票"
        - "核對初始數等於剩餘加票數"
      answer: "不夠，兩個舊讀者都寫回 0 也能開出 2 張。我會讓資料庫在有餘額時才扣，同一交易確認扣到才開票。測試同時查庫存和票數，也測開票失敗的回復。"
  - id: "fs-data-04-double-guard"
    prompt: "條件扣位的 UPDATE 影響 0 列代表什麼？"
    answer: "這次沒有扣到符合條件的名額，不應開票。"
    mcq:
      options:
        - "名額已被本次保留。"
        - "這次沒有扣到符合條件的名額，不應開票。"
        - "要略過條件再扣一次。"
        - "交易已自動寄出確認信。"
      answer: 1
      explain: "判斷依據是實際更新的列，而非稍早畫面的數量。"
  - id: "fs-data-04-double-atomic"
    prompt: "扣位成功後，建立預約失敗應怎麼辦？"
    answer: "回復同一筆交易中的扣位與預約。"
    mcq:
      options:
        - "保留扣位並回報成功。"
        - "提交後直接刪整場的票。"
        - "回復同一筆交易中的扣位與預約。"
        - "再查一次名額就可以不回復。"
      answer: 2
      explain: "要讓兩個變更同成同敗，必須共用一個交易邊界。"
  - id: fs-data-04-double-idempotent
    prompt: "有 2 席時，同一筆訂位要求重送兩次，條件扣位能辨識重送嗎？"
    answer: "不能。名額足夠時兩次扣位都可成功，同一意圖仍要用穩定的請求鍵防止重複。"
practice:
  - id: "fs-data-04-double-p1"
    title: "重播同一席的兩種結局"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 last-seat.py 並保存輸出"
      - "把初始席數改成 2"
      - "分別核對票數、剩餘與初始數"
    checks:
      - "原例壞路徑剩 0 卻有 2 張票，好路徑只有 1 張"
      - "能指出第二次扣位在哪一步落空"
---

## 為什麼要學：2 個成功畫面，一個實際座位

只剩最後一席，甲乙同時打開售票頁。兩個頁面都顯示可預約，這是合理的歷史資料，不是替兩人各保留一席。競爭條件（race condition）出現在檢查和行動之間：甲讀到一，乙也讀到一，兩邊各自計算一減 1，把 0 寫回去並各開一張票。庫存沒有變負，承諾卻已超過容量。

## 核心概念：把判斷搬到真正扣位的地方

用條件更新（conditional update）請資料庫在同一個寫入動作完成兩件事：檢查剩餘大於 0，再把目前的數量減 1。不是把畫面上的舊數字減一後交給它。檢查受影響列數（affected rows），一列才代表取得席位，0 列代表此刻沒有符合條件的名額。以 PostgreSQL 的預設隔離為例，競爭同列的更新可能等待，在對方提交後依更新後的列重新檢查條件。

扣位是第一步，開票才完成承諾。兩步在同一筆交易提交；中途不能把「成功」送給前端。若開票失敗要回復扣位，讓下一位真的拿得到票。若產品還承諾「同一請求重送只拿一張」，那是另一個要求，要以請求識別碼的唯一性另外處理，不能指望庫存條件在仍有餘額時替你辨認重送。

## 範例：不靠剛好同時按鍵

在 `C:\dev\stackway-lab\data` 儲存 `last-seat.py`，執行 `py last-seat.py`；macOS／Linux 用 `python3 last-seat.py`。固定兩個讀值都發生在扣位之前，重現危險順序，再將同樣的兩個意圖送給條件更新。這是可重播的交錯，不是測量資料庫鎖等待時間。

```python
import sqlite3
for guarded in (False, True):
    db = sqlite3.connect(":memory:")
    db.executescript("CREATE TABLE stock(n INTEGER CHECK(n>=0)); INSERT INTO stock VALUES(1); CREATE TABLE ticket(who TEXT);")
    reads = [db.execute("SELECT n FROM stock").fetchone()[0] for _ in range(2)]
    for who, seen in zip(("A", "B"), reads):
        with db:
            if guarded:
                ok = db.execute("UPDATE stock SET n=n-1 WHERE n>0").rowcount
            else:
                ok = seen > 0
                if ok:
                    db.execute("UPDATE stock SET n=?", (seen-1,))
            if ok:
                db.execute("INSERT INTO ticket VALUES(?)", (who,))
    print(guarded, db.execute("SELECT n FROM stock").fetchone(), list(db.execute("SELECT who FROM ticket")))
    db.close()
```

第一輪檢查值非負全程都過關，請看票表才會看出錯。第二輪同一筆資料中第一次扣到、第二次扣不到。這時不應回報系統當機，更不應一直重試已售完的場次；前端可重新整理場次並告知這一席剛被訂走。

### 不只測最後一張，也測中途故障

在扣位成功和開票之間畫一條線，假設工作者剛好在此中斷。若拆成兩筆提交，後台會看見少一席卻找不到買家；即使下次成功把剩下的票賣光，這一席也不會自己回來。可以在練習副本裡於開票前故意拋出例外，等例外離開交易區塊後再查數量。回復的證據應是原來的剩餘數和原來的票表都沒變，不只是終端機出現一行錯誤訊息。交錯測試保護兩個買家彼此競爭的情境，故障測試則保護同一個買家走到一半的情境，兩者不能互相取代。

把兩次交易的讀取和寫入畫在同一條時間線，標出哪個判斷真正發生在資料庫內，而不是先前畫面上的猜測。

## 常見錯誤與小結

在單一程式裡加一個「正在處理」變數，只能管到這個程序；另一個服務副本仍看得到自己的空閒變數。判斷要放在所有寫入者都必須通過的地方。驗收時不要只問「有沒有負數」，還要問「加上已開的票，是否仍等於這場原有的席數」。
