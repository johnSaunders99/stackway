---
id: fd-sql-02-model
module: fd-sql
order: 2
title: 資料表與正規化
subtitle: 課名改一次，不要更新每一列紀錄
status: ready
minutes: 30
level: 2
prereqs:
  - fd-sql-01-rows
objectives:
  - 找出重複欄位造成的更新異常
  - 把資料拆成兩張表並標出主鍵及外鍵
tags:
  - sql
  - model
resources:
  - title: Microsoft：資料庫正規化
    url: https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: SQLite：外鍵約束
    url: https://www.sqlite.org/foreignkeys.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-sql-normalization-fact
    prompt: 判斷課名應放在哪張表，要看它依賴什麼？
    answer: 目前正式課名取決於課程身分，不取決於某次練習，因此放課目錄。
    mcq:
      question: 課名複製在 10 筆練習紀錄裡。只改最新一筆的課名，哪件事會發生？
      options:
        - 所有相同課程編號的課名自動一起改
        - 外鍵會自動同步舊文字
        - 同一課程的紀錄可能出現新舊兩種名稱
        - 主鍵一定會拒絕更新課名
      answer: 2
      explain: 同一事實被重複保存，容易出現不一致版本。
    interview:
      question: 舊證書的課名應該跟新目錄一起改嗎？你如何決定？
      points:
        - 釐清當前值或歷史快照
        - 目前課名集中
        - 簽發當時事實可獨立保存
      answer: 我會先問重印要的是當時還是現在。目錄名字只維護一份；若要如實重印已發證書，我會另存簽發時的文字，而不是把所有舊證書跟著改掉。
  - id: fd-sql-key-per-attempt
    prompt: 同一門課的兩筆練習能共用哪個值？
    answer: 可以共用指向課程的外鍵，但各筆練習自己的主鍵要能區分。
    mcq:
      question: 兩次都練課程 7，哪組關係合理？
      options:
        - 兩筆紀錄主鍵也必須相同
        - 每筆都另建一門課
        - 用分鐘數保證識別課程
        - 紀錄編號不同、課程編號相同
      answer: 3
      explain: 一對多允許重複外鍵；主鍵識別每次練習。
  - id: fd-sql-foreign-reference
    prompt: 外鍵約束能防止什麼資料錯誤？
    answer: 啟用約束時，非空的參照值不能指向不存在的目標鍵。
  - id: fd-sql-snapshot-fact
    prompt: 同樣是課名，何時保留另一份文字不是不必要的重複？
    answer: 需要重現簽發當時的名稱時，那是歷史事實，不等同於目前目錄的課名。
    mcq:
      question: 哪個欄位即使和今天的課名字串相同，仍有獨立保存的理由？
      options:
        - 同一目錄頁重複顯示的目前課名
        - 證書簽發時的正式課名
        - 搜尋結果列要顯示的目前課名
        - 練習下拉選單要顯示的目前課名
      answer: 1
      explain: 後續更名時，歷史證書的正確答案可能與目前目錄不同，兩者不是同一個事實。
practice:
  - id: fd-sql-b04-02-p1
    title: 保存一張課表關係圖
    kind: build
    minutes: 12
    steps:
      - 執行 catalog.py，畫出兩張表並圈各自主鍵
      - 從兩筆練習的外鍵各畫箭頭
      - 在腳本副本插入指向不存在課程的紀錄，觀察錯誤後還原
    checks:
      - 兩支箭頭都指課程 7
      - 更名後 2 筆分鐘仍是 20 和 35
      - 外鍵檢查拒絕不存在的課
---

## 一堂課改名，為什麼不該改 20 次？

每完成一次練習就抄下課名與分鐘數。到了月底，「網路入門」改成「網路基礎」，你更新了最近一筆，週報卻把新舊兩個名稱當成兩門課。這叫更新異常 (update anomaly)：同一個事實在多處保存，改了一處卻漏掉其他地方。問題不是手速不夠快，而是一列資料同時想回答「這是什麼課」和「哪次練過它」。

## 先說每張表的一列代表什麼

正規化 (normalization) 是整理資料依賴、減少不必要重複的做法。這個例子裡，正式課名依賴課程身分，不依賴哪一天練習；實際花的分鐘則屬於那一次練習。因此把課目錄拆成一張表，把練習紀錄另放一張表。不是看到兩格碰巧相同就一律拆表，先確認它們是否真的代表同一個事實。

主鍵 (primary key) 在表內唯一識別一列。課程有課程編號，練習也有自己的紀錄編號；即使練同一堂 2 次，仍該是 2 筆不同紀錄。外鍵 (foreign key) 在練習表保存課程編號，指向目錄裡已存在的課。多筆練習可以指向同一門，這是一對多關係。之後在[〈JOIN 與外部連接〉](#/lesson/fd-sql-02-joins)會學會查詢時如何把名字帶回來，現在先確定資料各自有家。

## 範例：改的是一個名字，留下的是 2 段經驗

把容易重複填寫的資料圈起來。試想其中一筆改名，拆表前後各有幾個地方需要跟著更新。把下面的範例存成 `C:\dev\stackway-lab\sql` 裡的 `catalog.py`。

在該目錄執行：Windows PowerShell 用 `py catalog.py`；macOS／Linux 用 `python3 catalog.py`。

```python
import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
PRAGMA foreign_keys = ON;
CREATE TABLE course(id INTEGER PRIMARY KEY, title TEXT NOT NULL);
CREATE TABLE attempt(id INTEGER PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES course(id), minutes INTEGER NOT NULL);
INSERT INTO course VALUES (7, 'Network');
INSERT INTO attempt VALUES (101, 7, 20), (102, 7, 35);
UPDATE course SET title = 'Network basics' WHERE id = 7;
""")
print(db.execute("SELECT id, title FROM course").fetchall())
print(db.execute("SELECT id, course_id, minutes FROM attempt ORDER BY id").fetchall())
db.close()
```

開頭那個 SQLite 設定是讓這個連線確實檢查外鍵。REFERENCES 寫下「這一欄要對得上哪張表的哪個欄位」，NOT NULL 讓每次練習不可缺課程編號。第一行輸出是改名後的目錄；第二行仍保留 2 個不同的紀錄編號、相同的課程編號，以及原本的 20 和 35 分鐘。課名沒有重複存在練習表，所以不用替兩次練習各發一張更名通知。

### 哪種文字反而該保留？

假設需求不是「顯示目前課名」，而是「重印當時發出的證書」。舊證書應保留簽發當時的名稱，不能因目錄改名就跟著變。這時兩份文字表達的是不同時間點的事實，保留歷史快照反而正確。設計之前把「現在」或「當時」寫在需求旁，會比硬背每份文字只能出現一次更有用。

## 常見錯誤

用課名當練習表自己的主鍵，第二次練同一門就無處可放。也別把主鍵與外鍵理解成「重要欄位」和「次要欄位」：一個負責辨認這一列，一個負責參照另一列，工作不同。若參照不存在的課遭到拒絕，先補正編號，不要關掉檢查讓錯誤資料溜過去。

## 小結

先說事實屬於課程還是屬於某次練習，再決定鍵放哪裡。好的切分讓更名只需改一處，同時不抹掉歷史上確實發生過的兩次練習。
