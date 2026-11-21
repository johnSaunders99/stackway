---
id: fs-data-03-migration
module: fs-data
order: 3
title: 資料庫遷移與回填
subtitle: 欄位改名時如何不中斷服務
status: ready
minutes: 30
level: 3
prereqs:
  - fs-data-02-mapper
objectives:
  - 排序新增、回填、切換與移除步驟
  - 說明舊版應用何時仍能讀取
tags:
  - data
  - migrations
resources:
  - title: "Prisma：擴充與收縮遷移"
    url: "https://www.prisma.io/docs/guides/data-migration"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-data-03-migration-expand"
    prompt: "新舊程式會短暫共存，欄位改名先做什麼？"
    answer: "先新增可空的新欄，暫時保留舊欄。"
    mcq:
      options:
        - "直接改掉欄名讓兩版同步失敗。"
        - "先把所有讀取切到空的新欄。"
        - "先新增可空的新欄，暫時保留舊欄。"
        - "先把舊欄內容清空再備份。"
      answer: 2
      explain: "先擴充結構，舊程式才能繼續讀寫原來的欄位。"
    interview:
      question: "兩版程式共用一張表，你如何安排改名？"
      points:
        - "擴充而非直接更名"
        - "處理舊版寫入與回填"
        - "保留相容回復窗口"
      answer: "我先留住舊欄，部署同時寫兩欄的過渡版。舊寫入者全退後，以可信的舊值補齊並比對，再切讀取。等觀察期過了、舊版不必再上場才移欄。"
  - id: "fs-data-03-migration-backfill"
    prompt: "回填分批中斷後如何安全繼續？"
    answer: "以穩定的鍵切批，只處理仍待補的列。"
    mcq:
      options:
        - "把新欄全清掉再整張重填。"
        - "無條件用最早的匯出檔覆寫。"
        - "看到一批成功就假設其餘也完成。"
        - "以穩定的鍵切批，只處理仍待補的列。"
      answer: 3
      explain: "可重做很重要；若舊寫入者尚在，補完仍須處理異動並檢查差異。"
  - id: "fs-data-03-migration-contract"
    prompt: "什麼時候才適合移除舊欄？"
    answer: "舊讀寫者已退場、資料核對通過，且不再需要直接退回舊版。"
    mcq:
      options:
        - "舊讀寫者已退場、資料核對通過，且不再需要直接退回舊版。"
        - "新欄建好時。"
        - "第一筆回填成功時。"
        - "新程式第一次啟動時。"
      answer: 0
      explain: "排程、背景工作與回復版本都可能仍依賴舊欄。"
  - id: fs-data-03-migration-window
    prompt: "已切到新欄讀取，為何還保留對舊欄的寫入？"
    answer: "觀察期內若要換回舊讀法，舊欄仍須含最新資料。保留欄名但不更新值並不是可用的回復路徑。"
practice:
  - id: "fs-data-03-migration-p1"
    title: "留一份欄位切換驗收單"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 rename.py"
      - "把範例裡只改舊欄的寫入移到第一批回填之前再重跑"
      - "記下兩次執行的空值數與差異列"
    checks:
      - "指出一筆非空卻過時的新值"
      - "能標出最後可直接退回舊讀版的位置"
---

## 為什麼要學：上線時並不是所有程式一起換班

把目錄的「名稱」改成「標題」，在編輯器裡只是重新命名，對服務中的資料庫卻不一樣。有人正用舊版查名稱，新版已開始寫標題，夜間匯出還在讀舊欄。資料庫遷移（migration）改的是大家共用的結構；回填（backfill）則讓既有資料也符合新結構。看見欄位出現在表裡，不代表裡面已有可用的值。

## 核心概念：擴充、同步、切讀、收縮

先允許新欄留空並保留舊欄，舊程式便不用停下來等待。讓過渡版仍讀舊欄，但把新寫入的名稱在同一筆交易裡寫到兩欄，避免只成功一半。在只會寫舊欄的版本全退場前，舊欄仍是準據；若其間有列被改過，新欄可能不是空值，卻已經過時。要記錄異動或在舊寫入者退場後重新比對，不能只數空值。

資料很多時，按穩定主鍵分批更新，記下每批範圍與成功筆數；中斷可以續跑，不必把所有列長時間鎖住。切讀之前先驗證新舊值一致，並確認新程式寫入時舊欄也能供舊讀者使用。切讀與刪舊欄是兩次決定，中間留一段觀察期。這段期間若新畫面出問題，可以先換回舊讀法，而不必倒回整座資料庫。

## 範例：刻意留下一筆「非空但不對」

在 `C:\dev\stackway-lab\data` 儲存 `rename.py` 再執行 `py rename.py`；macOS／Linux 用 `python3 rename.py`。下例所有階段依序演出，實際服務必須另外確認版本退場；這不是在線上跑完就算遷移成功的指令清單。

```python
import sqlite3
db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE item(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
INSERT INTO item VALUES(1,'blue'),(2,'red');
ALTER TABLE item ADD COLUMN title TEXT;
UPDATE item SET title=name WHERE id=1 AND title IS NULL;
UPDATE item SET name='navy' WHERE id=1;
UPDATE item SET title=name WHERE id=2 AND title IS NULL;
""")
print("missing", db.execute("SELECT count(*) FROM item WHERE title IS NULL").fetchone())
print("different", list(db.execute("SELECT id,name,title FROM item WHERE name IS NOT title")))
db.execute("UPDATE item SET title=name WHERE title IS NOT name")
print("read new", list(db.execute("SELECT id,title FROM item ORDER BY id")))
```

第一個數字是 0，第二行卻列出一筆差異。假設名稱只是改名而沒有改變意思，且舊寫入者已停，最後的修補才合理。若其實是兩個可以各自編輯的欄位，就得先定義誰有權決定衝突，而不能照抄更新式。

### 驗收切讀，不只驗收資料搬完

拿一張紙畫出舊讀者、過渡寫入者及新讀者三條線，沿著時間各放一個問題：新增一筆時兩邊讀到什麼，修改既有列之後又如何？現在假設匯出程式一天只跑一次，它沒出現在最近幾分鐘的查詢紀錄，並不能證明它已經不用舊欄。查明排程與負責人、驗證過完整週期，才能把它從相依清單移除。若無法證明，先留舊欄；它占一點空間，遠比晚上才發現無法出報表容易處理。把「缺資料」和「仍有人要舊欄」分成兩個驗收框，前者歸零並不會自動勾掉後者。

## 常見錯誤與小結

「有備份」不等於「隨時可直接退回舊程式」。還原昨天的備份可能丟掉今天的訂單；保留能與新資料共存的舊讀法，才是這次切換可逆的原因。把最後一次舊版寫入、差異歸零和舊欄移除分別記在時間線上。
