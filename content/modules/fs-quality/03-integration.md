---
id: fs-quality-02-integration
module: fs-quality
order: 3
title: API 與資料庫整合測試
subtitle: 讓 API 真正碰到測試資料庫
status: ready
minutes: 30
level: 3
prereqs:
  - fs-quality-02-component
objectives:
  - 隔開測試資料與個人資料
  - 驗證失敗交易沒有殘留寫入
tags:
  - quality
  - integration
resources:
  - title: "Python：sqlite3 連線與交易"
    url: "https://docs.python.org/zh-tw/3/library/sqlite3.html"
    kind: "doc"
    lang: "zh-Hant"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-quality-02-integration-boundary"
    prompt: "哪個案例真正跨過 API 與資料庫的邊界？"
    answer: "經本機 HTTP 端點送出輸入，再查實際測試資料庫的列。"
    mcq:
      options:
        - "讓資料庫替身永遠回傳成功。"
        - "經本機 HTTP 端點送出輸入，再查實際測試資料庫的列。"
        - "只檢查路由函式有被呼叫。"
        - "只比對回應顏色。"
      answer: 1
      explain: "跨層契約要同時看請求回應與儲存效果。"
    interview:
      question: "API 已回衝突，為什麼還要查資料表？"
      points:
        - "錯誤回應不保證原子性"
        - "核對兩張表與原始樣本"
        - "使用隔離環境"
      answer: "我會先建立一筆有效資料，再用相同外部參照送第二次。除了看衝突回應，還要確認主表沒多一筆、關聯仍指向原本那筆，這樣才證明失敗交易真的回復。"
  - id: "fs-quality-02-integration-rollback"
    prompt: "第二個寫入失敗時應驗證什麼？"
    answer: "回應拒絕，且第一個寫入也沒有留下。"
    mcq:
      options:
        - "只要看到錯誤狀態即可。"
        - "先清空表再檢查是空的。"
        - "回應拒絕，且第一個寫入也沒有留下。"
        - "只確認沒有成功畫面。"
      answer: 2
      explain: "清理前要核對失敗前後狀態，否則殘留會被掩蓋。"
  - id: "fs-quality-02-integration-fixture"
    prompt: "如何降低整合測試誤改個人資料的風險？"
    answer: "程式自行建立隔離資料庫，僅填入固定的虛構樣本。"
    mcq:
      options:
        - "借用最近連線的資料庫。"
        - "先連正式資料庫再決定是否回復。"
        - "將個人資料匯出作唯一樣本。"
        - "程式自行建立隔離資料庫，僅填入固定的虛構樣本。"
      answer: 3
      explain: "由測試掌握資源與初始值，不依賴環境預設連線。"
practice:
  - id: "fs-quality-02-integration-p1"
    title: "產出一張跨層交易收據"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 api-check.py"
      - "保存兩次狀態碼及兩張表內容"
      - "在副本中把第一次 INSERT 後改為立即提交，確認斷言能抓到殘留"
    checks:
      - "原例的 201、409 與兩表列數一致"
      - "改壞的版本雖回 409 仍會驗收失敗"
---

## 為什麼要學：回應說「沒有建立」，資料真的沒增加嗎？

登記借書時，服務先建借閱單，再登記唯一收據號碼。若收據號碼重複，畫面可能正確顯示衝突，資料庫卻多了一張沒有收據的借閱單。整合測試（integration test）要讓真正的元件跨過邊界合作。本課用本機的 HTTP 請求與真實 SQLite 交易，不連個人或正式資料庫；要驗的不只是網頁回應，而是兩筆寫入能否同成同敗。

## 核心概念：先準備一個可辨認的世界

測試固定資料（fixture）應由測試自己建立。讓第一筆合法借閱取得收據，第二筆使用相同號碼但不同借閱單，製造可預測的衝突。每次執行都從新的空庫開始；不要把「測試後刪除所有資料」當作隔離。若連線字串指錯地方，測完再刪會讓失誤更加嚴重，記憶體資料庫則根本沒有開啟既有檔案的途徑。

## 範例：只接 2 個本機請求

在 `C:\dev\stackway-lab\quality` 存成 `api-check.py`，執行 `py api-check.py`；macOS／Linux 用 `python3 api-check.py`。伺服器只綁本機回送位址（loopback），由系統選空埠。單一工作執行緒依序處理兩個請求，主執行緒等它結束才讀結果。這個練習端點只接受指定的測試訊息，不是公開 API。

```python
import sqlite3, threading, http.client
from http.server import BaseHTTPRequestHandler, HTTPServer
db = sqlite3.connect(":memory:", check_same_thread=False)
db.executescript("CREATE TABLE loan(id INTEGER PRIMARY KEY); CREATE TABLE receipt(code TEXT PRIMARY KEY, loan INTEGER);")
class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/loans":
            return self.send_error(404)
        code = self.rfile.read(int(self.headers["Content-Length"])).decode("ascii")
        try:
            with db:
                n = db.execute("INSERT INTO loan DEFAULT VALUES").lastrowid
                db.execute("INSERT INTO receipt VALUES(?,?)", (code,n))
            status = 201
        except sqlite3.IntegrityError:
            status = 409
        self.send_response(status)
        self.end_headers()
with HTTPServer(("127.0.0.1",0), Handler) as server:
    t = threading.Thread(target=lambda: [server.handle_request() for _ in range(2)])
    t.start()
    statuses = []
    for _ in range(2):
        c = http.client.HTTPConnection(*server.server_address, timeout=5)
        c.request("POST", "/loans", body=b"ticket-7")
        r = c.getresponse()
        statuses.append(r.status)
        r.read()
        c.close()
    t.join()
rows = list(db.execute("SELECT * FROM loan")), list(db.execute("SELECT * FROM receipt"))
print(statuses, rows)
assert statuses == [201,409] and rows == ([(1,)], [("ticket-7",1)])
```

兩次都真正進入處理程式，所以資料庫唯一約束會在第二次的第二個寫入拒絕它。例外必須離開交易區塊，連線才會自動回復，然後才把它轉為衝突回應。如果在交易區塊內吞下例外，區塊可能正常結束並提交不完整的借閱單。末行比對的不只是列數，還含首次收據的指向，避免錯把舊列換掉也蒙混過關。

### 刻意把提交線畫錯一次

在練習副本把第一個新增後面加上一次立即提交，收據重複時，服務仍會回同一個衝突狀態。用戶端看起來沒變，資料庫卻多了一筆空借閱。如果驗收只比兩個狀態碼，改壞之後依然會過。比較最後印出的兩張表才看得見：舊收據沒有改號，但主表多了一個沒有任何收據指向的編號。調查這種失敗時先保存當時的兩表與回應，然後找交易邊界；不要一開始就手動清掉多出的列，再試圖從乾淨結果找錯。若測試套件日後要同時執行多個案例，讓各案例握有自己的資料庫與連接埠，也能避免上一個測例的合法收據剛好撞到下一個測例的唯一條件。

## 常見錯誤與小結

不要先清理再核對，更不要用永遠成功的資料庫替身宣稱交易沒問題。相反地，這個測試也不能證明別的資料庫引擎使用相同的鎖行為，或瀏覽器能把衝突顯示清楚。它留下的證據範圍很明確：固定請求走過本機 HTTP 與此資料庫後，成功與失敗各留下預期的資料。
