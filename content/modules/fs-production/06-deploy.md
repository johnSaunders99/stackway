---
id: fs-production-06-deploy
module: fs-production
order: 6
title: 全端應用部署
subtitle: 從空環境走完一次預約
status: ready
minutes: 40
level: 4
prereqs:
- fs-production-05-proxy
objectives:
- 畫出反向代理、前端、API 與資料庫的相依關係
- 依序遷移、啟動、驗收與備份，保留零雲端支出的本機路線
tags:
- production
- deploy
resources:
- title: Python 標準函式庫：本機 HTTP 伺服器
  url: https://docs.python.org/zh-tw/3/library/http.server.html
  kind: doc
  lang: zh-Hant
  minutes: 5
  required: false
  checked: '2026-11-20'
- title: Python 標準函式庫：SQLite 連線與備份
  url: https://docs.python.org/zh-tw/3/library/sqlite3.html
  kind: doc
  lang: zh-Hant
  minutes: 8
  required: false
  checked: '2026-11-20'
concepts:
- id: fs-production-06-deploy-order
  prompt: 為什麼先準備資料結構，再讓新版 API 接收預約？
  answer: 新程式依賴特定資料結構；先確認遷移成功能避免服務外觀啟動成功，實際寫入卻失敗。
  mcq:
    question: API 行程能啟動，但資料表還不存在，哪個驗收最容易發現問題？
    options:
    - 只看首頁的標題
    - 只看行程編號
    - 只看程式碼能否編譯
    - 走一次從空位到建立再讀回的流程
    answer: 3
    explain: 能打開靜態頁不會觸碰資料表，必須真的走到依賴它的路徑。
- id: fs-production-06-deploy-constraint
  prompt: 最後一席為何由資料庫限制，而不只靠按鈕停用？
  answer: 不同請求可同時抵達；資料庫約束才是共用寫入邊界，介面提示不能取代它。
  mcq:
    question: 兩個請求想占用同一席，資料庫只允許相同 slot 出現一次，第二次應怎麼回？
    options:
    - 回報衝突，不新增第二筆
    - 先回成功再忽略寫入失敗
    - 建立第二張表保存同一席
    - 把前一筆刪掉
    answer: 0
    explain: 對已滿狀態給明確業務回應，不以成功或覆蓋掩蓋衝突。
- id: fs-production-06-deploy-handoff
  prompt: 交付零雲端支出的部署時，怎麼證明換目錄也能重建？
  answer: 保留程式、靜態檔、啟動目錄、遷移指令及驗收紀錄，資料另做備份，不把原本執行中的環境當作先決條件。
  interview:
    question: 沒有雲端帳單的本機版本可以證明哪些部署能力？
    points:
    - 交代入口到資料庫的依賴
    - 從空資料開始遷移啟動
    - 驗收寫入與備份，界定未驗證項
    answer: 我能示範同一份程式從新目錄啟動、建立一席並讀回，也能留下獨立備份。這不表示我測過公開網域、高可用或雲端負載，那些需要另外的環境。
practice:
- id: fs-production-06-deploy-p1
  title: 從空資料留下一筆預約和一份備份
  kind: build
  minutes: 17
  steps:
  - 在新的 reserve-lab 建立正文的兩個檔案，執行遷移後啟動服務。
  - 從首頁連按兩次預約，再查席位；記錄 201、409 和剩餘 0 席。
  - 停止服務後執行備份，將啟動順序、連接埠及結果寫成 README.md，保留給還原課使用。
  checks:
  - 有 desk.db、獨立的 desk-backup.db、可重建的程式與 README。
  - 第一次預約成功，第二次沒有新增資料；清楚標明是否實測反向代理。
---

## 為什麼要學：在自己的電腦能開，不等於能交付

面試時展示最後一席的預約頁，最有說服力的不是打開昨天留著的分頁，而是換到空目錄，依照說明啟動、建立預約並讀回。這裡做一個零雲端支出的垂直切片：頁面送出請求、API 交給資料庫、結果回到畫面。它不含登入等完整產品功能，只使用一個教學席位，不接觸既有專案資料。

## 核心概念：先畫相依關係，再排啟動順序

完整路線是瀏覽器到反向代理（reverse proxy），代理把首頁交給靜態檔，將 API 路徑轉給服務；服務再讀寫資料庫。沒有代理時，本課的小服務也能提供首頁，讓核心流程不靠額外工具。SQLite 是嵌入式資料庫（embedded database），不用另一個資料庫行程；但資料表仍然要先建立。遷移（migration）準備結構，啟動才開放請求，驗收後再備份。若改部署到已有資料的環境，變更前還須先備份並檢查回復路徑，不可拿空環境的順序照抄。

## 範例：在空目錄完成最後一席

在 `C:\dev\stackway-lab\production` 新建未使用過的 `reserve-lab` 及其 `site` 子目錄。以下分別存為 `site/index.html` 和 `app.py`。資料表讓同一席只能有 1 筆資料；席位已滿回 409 衝突，不用瀏覽器的按鈕狀態冒充寫入保證。

```html
<!doctype html><html lang="zh-Hant"><meta charset="utf-8">
<title>最後一席</title><h1>最後一席</h1>
<button id="book">預約</button> <a href="/api/slots">查看餘額</a>
<output id="out"></output>
<script>
document.querySelector("#book").onclick = async () => {
  const r = await fetch("/api/reserve", {method:"POST"});
  document.querySelector("#out").textContent = r.status + " " + await r.text();
};
</script></html>
```

```python
import json
import sqlite3
import sys
from contextlib import closing
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

db = Path("desk.db")

class Desk(BaseHTTPRequestHandler):
    def send(self, code, kind, data):
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.end_headers()
        self.wfile.write(data)

    def reply(self, code, data):
        self.send(code, "application/json", json.dumps(data).encode())

    def do_GET(self):
        if self.path == "/":
            self.send(200, "text/html; charset=utf-8", Path("site/index.html").read_bytes())
        elif self.path == "/api/slots":
            with closing(sqlite3.connect(db)) as con:
                count = con.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]
            self.reply(200, {"left": 1 - count})
        else:
            self.reply(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/api/reserve":
            return self.reply(404, {"error": "not found"})
        try:
            with closing(sqlite3.connect(db)) as con, con:
                con.execute("INSERT INTO bookings(slot) VALUES (1)")
        except sqlite3.IntegrityError:
            return self.reply(409, {"error": "full"})
        self.reply(201, {"slot": 1})

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "migrate":
        with closing(sqlite3.connect(db)) as con, con:
            con.execute("CREATE TABLE IF NOT EXISTS bookings(slot INTEGER PRIMARY KEY CHECK(slot = 1))")
    elif mode == "serve" and db.is_file():
        HTTPServer(("127.0.0.1", 4181), Desk).serve_forever()
    elif mode == "backup" and db.is_file():
        target = Path("desk-backup.db")
        target.touch(exist_ok=False)
        with closing(sqlite3.connect(db)) as src, closing(sqlite3.connect(target)) as dst:
            src.backup(dst)
    else:
        raise SystemExit("use migrate, then serve or backup")
```

先關閉上一堂自己啟動的示範服務，以免占用 4181。在 `reserve-lab` 的 PowerShell 輸入 `py app.py migrate`，再輸入 `py app.py serve`。在瀏覽器開 `127.0.0.1:4181`，先查餘額應為 1，回首頁按預約兩次，依序得到 201 與 409，再查餘額為 0。用 `Ctrl+C` 停止自己這個行程，執行 `py app.py backup` 留下獨立備份。macOS 或 Linux 用 `python3` 代替 `py`。備份命令會拒絕覆蓋同名檔案，重做請另外建立新的練習目錄。

若已有 Caddy，可把上一堂的 Caddyfile 複製到這份 `reserve-lab`，從此處啟動它，再從 4180 首頁走同一流程。要重現「還有 1 席」的起點請另開新的教學目錄；不要為了重測清空已保存的資料。沒跑代理就在 README 寫「直連已驗，代理未驗」，兩者都能說清楚入口關係，但證據不同。

這個教學伺服器逐一處理請求。連按兩次能證明已占用時不能又成功，卻不是同時抵達的壓力測試。在作品集裡保留這項區別：資料庫約束可以在這裡看見，真正的多使用者競爭仍應在相應的服務模型與隔離環境驗收。部署檢查不必重新證明每一層，但不能把簡單示範寫成已測項目。

## 常見錯誤

首頁一直能開，就跳過讀回；或備份程式正常結束，就宣告資料已經可回復。前者沒測到資料表，後者沒做還原。把本次寫入的席號、成功與衝突狀態及備份檔名記在 README，之後在[〈部署重建與備份還原〉](#/lesson/fs-production-05-release)會用同一份資料驗證。

## 小結

部署的交付物包括程式、明確工作目錄、資料結構與可重播的驗收步驟。能從空資料走到一筆正確預約，再把這筆資料帶走，才不是只能在原桌面展示的作品。
