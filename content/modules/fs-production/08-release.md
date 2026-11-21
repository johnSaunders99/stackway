---
id: fs-production-05-release
module: fs-production
order: 8
title: 部署重建與備份還原
subtitle: 用新環境重建並還原應用
status: ready
minutes: 40
level: 3
prereqs:
- fs-production-07-monitor
objectives:
- 從 README 完成部署與回復演練
- 以資料筆數與關鍵流程驗證還原成功
tags:
- production
- restore
resources:
- title: SQLite：線上備份介面
  url: https://www.sqlite.org/backup.html
  kind: doc
  lang: en
  minutes: 6
  required: false
  checked: '2026-11-20'
- title: Python 標準函式庫：透過連線備份 SQLite
  url: https://docs.python.org/zh-tw/3/library/sqlite3.html
  kind: doc
  lang: zh-Hant
  minutes: 5
  required: false
  checked: '2026-11-20'
concepts:
- id: fs-production-05-release-artifacts
  prompt: 重建程式與還原資料分別需要什麼？
  answer: 重建需要可辨識的成品或來源、設定與啟動步驟；資料還原需要可讀的獨立備份以及相容的資料結構。
  mcq:
    question: 只把伺服器和首頁複製到新資料夾再跑遷移，能證明什麼？
    options:
    - 已找回原本所有交易
    - 可建立空環境，不表示舊預約已還原
    - 所有備份都可讀
    - 舊程式一定支援新資料
    answer: 1
    explain: 新資料表可以沒有任何資料，重建和還原必須分開驗收。
- id: fs-production-05-release-isolation
  prompt: 第一次還原演練為什麼使用全新的目標？
  answer: 避免覆蓋現用資料，也排除意外連回原資料庫造成的假成功。
  mcq:
    question: 哪個證據最能排除「讀到舊環境」？
    options:
    - 兩邊使用相同頁面標題
    - 備份檔存在
    - 舊服務已停，從獨立目錄以新還原檔啟動並比對
    - 日期顯示正確
    answer: 2
    explain: 必須驗證讀取來源與實際資料，而不只是檔名、時間或介面。
- id: fs-production-05-release-evidence
  prompt: 還原後筆數相同，為什麼還要測關鍵流程？
  answer: 相同筆數不保證同一筆資料、約束或應用程式相容；還需比對識別值、讀回及關鍵寫入行為。
  interview:
    question: 服務回到上一版，但最新備份早了 1 小時，你怎麼決定下一步？
    points:
    - 分開程式回退與資料還原
    - 說明可能失去的寫入與相容性
    - 先隔離驗證並取得決策
    answer: 我不會為了回退程式就直接換掉資料庫。先查舊程式能否讀現有資料，再在另一個目標測備份能恢復到哪個時間；若會失去這 1 小時的寫入，須明確說出來再決定。
practice:
- id: fs-production-05-release-p1
  title: 從 README 重建並提交一張還原收據
  kind: build
  minutes: 16
  steps:
  - 先確認已有部署課保存的一筆預約備份及 README，停掉原示範服務。
  - 只複製程式、靜態檔與說明至全新的 restore-lab，依正文復原到不存在的 desk.db。
  - 啟動新服務，核對筆數、席號、餘額及重複預約結果；把觀察時間與資料來源存為 restore-receipt.txt。
  checks:
  - 新目錄不靠原本的 desk.db 就能讀回 slot=1 且筆數是 1。
  - 重複預約得到 409，重查仍為 1 筆；原備份及原資料庫未被覆蓋。
---

## 為什麼要學：手上有備份，距離「可以恢復」還差一次演練

桌面上出現一個備份檔，只能證明寫出了一個檔案。它可能來自錯的環境，也可能是空資料庫，甚至能被工具打開但已經不適用這版程式。真正的驗收是離開原本熟悉的目錄，靠交接說明重建服務，再讓指定時間點的資料走完一次關鍵流程。這堂演練只使用前面建立的教學預約，不碰任何在用的資料。

## 核心概念：回退程式不是還原資料

程式回退（rollback）讓服務回到先前的成品與設定；資料還原（restore）把資料重建到備份代表的時間點。舊程式有時可以使用現有資料，這時不必為了回退而放棄新交易。有時新結構已不相容，又不能只換執行檔。先用隔離目標（isolated target）演練，寫明從哪個時間點以後的寫入不在備份中，再談是否切換正式流量。

程式目錄、資料庫與備份應是可分辨的三樣東西。本例維持部署課的 SQLite 檔案式教學，使用 SQLite 備份介面複製一致的資料庫，而不是任意搬一個執行中的資料檔。其他資料庫有自己的備份與還原工具，不能把同一套檔案操作直接移植。保留原備份，使用唯讀連線讀它；若目標已存在便停止，不要讓一次演練變成覆寫事故。

## 範例：不複製舊資料庫，從備份找回一席

先完成[〈全端應用部署〉](#/lesson/fs-production-06-deploy)中的成功預約與備份，保留 `reserve-lab` 裡的 `app.py`、`site`、`README.md` 與 `desk-backup.db`。停止自己先前開的服務及代理，在 `C:\dev\stackway-lab\production` 建立不存在的 `restore-lab`，只將程式、`site` 和 README 複製過去，不要複製 `desk.db`。在新目錄把以下內容存成 `restore.py`。它對應這份 SQLite 備份，不會呼叫任何遠端服務。

```python
import sqlite3
from contextlib import closing
from pathlib import Path

source = Path("../reserve-lab/desk-backup.db").resolve()
target = Path("desk.db")
if not source.is_file():
    raise SystemExit("missing backup")
with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as old:
    rows = old.execute("SELECT slot FROM bookings ORDER BY slot").fetchall()
    if rows != [(1,)]:
        raise SystemExit("unexpected rehearsal snapshot")
    target.touch(exist_ok=False)
    with closing(sqlite3.connect(target)) as new:
        old.backup(new)
        restored = new.execute("SELECT slot FROM bookings ORDER BY slot").fetchall()
        if restored != rows:
            raise SystemExit("restore mismatch; do not start service")
        print("count=", len(restored), "rows=", restored)
```

在 `restore-lab` 的 PowerShell 執行 `py restore.py`，看到 1 筆、席號為 1 後再執行 `py app.py serve`。其他系統則用 `python3`。開啟 `127.0.0.1:4181`，查餘額應為 0；重複預約應得 409，重查餘額依舊是 0。用另一個終端機在新目錄執行以下唯讀查詢確認筆數與席號。收據要記錄實際工作目錄，否則兩份頁面長得相同，很難分辨測的是哪個行程。

```powershell
py -c "import sqlite3; c=sqlite3.connect('file:desk.db?mode=ro',uri=True); print(c.execute('SELECT COUNT(*), MIN(slot) FROM bookings').fetchone()); c.close()"
```

預期是 `(1, 1)`。若來源不是這次練習的指定快照，腳本會在建立目標前停止。若目標已存在，換到另一個全新目錄並重新核對來源；不要刪掉或覆蓋它來讓測試通過。最後在收據寫下備份時間、重建開始及首次驗收成功時間，標明這是本機演練耗時而非正式環境的承諾。

## 常見錯誤

只比較檔案大小或筆數，沒檢查席號與寫入限制，可能把錯場次的資料誤認成成功。另一個陷阱是原服務還在占用同一個埠，新服務根本沒啟動，瀏覽器卻照樣能打開。先看新行程是否啟動成功，再用新目錄查資料；舊環境留著當退路，不要當成驗收對象。

## 小結

能恢復不是一句保證，而是一張有來源、目標、內容與行為的收據。保留原檔、在新目錄重建，並證明那一席仍然不能被重複預約，這才是交得出去的還原紀錄。
