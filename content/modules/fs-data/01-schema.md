---
id: fs-data-01-schema
module: fs-data
order: 1
title: 資料庫約束與外鍵
subtitle: 替資料庫守住不變條件
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 選出必填、唯一與外鍵約束
  - 用不合法樣本驗證拒絕發生在資料庫
tags:
  - data
  - constraints
resources:
  - title: "PostgreSQL：資料完整性約束"
    url: "https://www.postgresql.org/docs/current/ddl-constraints.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "Python：sqlite3 連線與交易"
    url: "https://docs.python.org/zh-tw/3/library/sqlite3.html"
    kind: "doc"
    lang: "zh-Hant"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-data-01-schema-required"
    prompt: "每張票必須有場次，外鍵之外還需要什麼？"
    answer: "場次欄位加上 NOT NULL"
    mcq:
      options:
        - "場次欄位加上 NOT NULL"
        - "座號欄位加上預設值"
        - "把場次改成文字欄位"
        - "把票券依場次排序"
      answer: 0
      explain: "外鍵管指向哪一列，必填管能不能沒有值。"
    interview:
      question: "匯入後發現同一席有兩張票，你會怎麼處理？"
      points:
        - "界定同場同座"
        - "先盤點既有衝突"
        - "驗證同場拒絕及跨場允許"
      answer: "我會先列出同場重複的紀錄請營運確認，不任刪一張。清完才加組合唯一約束；用同場與不同場各寫一次，確認沒有連合法的票一起擋掉。"
  - id: "fs-data-01-schema-pair"
    prompt: "座號可以跨場重用，哪個組合應唯一？"
    answer: "場次與座號的組合"
    mcq:
      options:
        - "座號本身"
        - "場次與座號的組合"
        - "場次本身"
        - "建立時間與票價"
      answer: 1
      explain: "僅限制座號會阻止其他場次使用；僅限制場次則每場只能售一張。"
  - id: "fs-data-01-schema-boundary"
    prompt: "已有表單檢查，為什麼仍在資料庫設約束？"
    answer: "匯入程式及其他寫入來源也要遵守同一條規則。"
    mcq:
      options:
        - "只有資料庫能顯示輸入提示。"
        - "設定約束可以自動修好舊資料。"
        - "匯入程式及其他寫入來源也要遵守同一條規則。"
        - "約束會自動建立缺少的場次。"
      answer: 2
      explain: "表單協助及早修正；資料庫才看得到各種來源最終要存的資料。"
  - id: fs-data-01-schema-empty
    prompt: "外鍵會要求每一場都已經售出至少一張票嗎？"
    answer: "不會。這個外鍵從票券指向場次，所以每張票需要有效場次，但新場次可以先沒有票。"
practice:
  - id: "fs-data-01-schema-p1"
    title: "做出會拒收壞票的資料表"
    kind: "hands-on"
    minutes: 12
    steps:
      - "儲存並執行 seats.py"
      - "加入第二個場次並售出相同座號"
      - "在腳本註解留下各次拒絕的原因"
    checks:
      - "原例有 1 張票與 3 次拒絕"
      - "新場次可再售出相同座號"
---

## 為什麼要學：哪 2 張票不能同時存在？

售票頁會把已售座位塗灰，匯入紙本訂位的工具卻看不到那張座位圖。兩邊各寫進一張票，等到驗票才發現撞位。與其要求每個寫程式的人記得先查，不如問：不論哪條路寫入，資料表裡絕不能出現哪種狀態？這就是不變條件。資料庫約束（constraint）把條件寫進表的定義，由資料庫在寫入時執行。

## 核心概念：有沒有、存不存在、是否重複

場次表的主鍵（primary key）識別一場演出。票券的場次欄位加上外鍵（foreign key），表示有填編號時，必須在場次表找得到對象。光加外鍵仍可能留下空值，所以必填條件另用 `NOT NULL`。最後想想唯一性（uniqueness）的範圍：甲場的前排也能是乙場的前排，不能把整個劇場的座號鎖死。

寫出 `UNIQUE(show_id, seat)`，檢查的是兩個值配在一起有沒有重複。即使票券另有自動編號，也不能拿它代替這項規則：兩張不同編號的票，完全可能印著同一個座號。約束應對應業務承諾，而不只是讓表看起來有個鍵。

## 範例：直接寫入，別經過表單

為資料庫約束實驗建立 `C:\dev\stackway-lab\data`。把下列程式存成 `seats.py`，用 `py seats.py` 執行；macOS／Linux 用 `python3 seats.py`。這裡用 Python 內附的 SQLite 在記憶體建表，每次執行都從空表開始。SQLite 要在這條連線先啟用外鍵，否則缺少場次的測例不會照預期失敗。

```python
import sqlite3
db = sqlite3.connect(":memory:")
db.executescript("""
PRAGMA foreign_keys=ON;
CREATE TABLE shows(id INTEGER PRIMARY KEY);
CREATE TABLE tickets(show_id INTEGER NOT NULL REFERENCES shows(id),
                    seat TEXT NOT NULL, UNIQUE(show_id, seat));
INSERT INTO shows VALUES(1);
""")
for row in [(1, "A1"), (1, "A1"), (9, "B1"), (None, "C1")]:
    try:
        db.execute("INSERT INTO tickets VALUES(?, ?)", row)
        print("accepted", row)
    except sqlite3.IntegrityError as err:
        print("rejected", row, str(err))
print(db.execute("SELECT * FROM tickets").fetchall())
```

每次只讓一種條件出錯。第二次寫入的場次存在，但席位已被占用；第三次座號全新，場次卻不存在；最後一次根本沒有場次。末行查詢應只剩第一張。若只數到幾個錯誤而不讀原因，把所有資料都拒絕的壞程式也可能看似安全。

### 再加一場，找出約束是否太嚴

在迴圈之前新增一場演出，讓它有不同的編號；再於清單末尾加入新場次的同名座位。若也被拒絕，就回去看唯一約束括號裡有哪些欄位。另一個方向是試著讓未開票的場次存在：它不該因為票表還沒有對應資料而失敗。外鍵要求每張票指到有效的場次，不要求每個場次一定已經有票。把這兩個合法情境畫在拒絕樣本的旁邊，規則才不會只會說不，卻擋住正常售票。

## 常見錯誤：缺值不等於空字串

必填只代表不能是資料庫的空值，空字串仍是字串。若要禁止沒有字樣的座號，得另外定義什麼算有效，例如去除前後空白後長度要大於 0。試著預測傳入空座號會如何，再決定要不要加上檢查約束（check constraint）。不要沒問清楚格式就禁止所有符號，無障礙席的編碼也可能合法。

## 小結

對每條約束各保留一個應通過和應拒絕的樣本。未來若改成團體訂位，可以拿同一疊樣本討論究竟是哪一種票的規則變了，而不是把所有保護一起拆掉。
