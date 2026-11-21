---
id: fd-network-06-cors
module: fd-network
order: 6
title: 同源政策與 CORS
subtitle: 兩個本機連接埠為何不算同源
status: ready
minutes: 30
level: 2
prereqs:
  - fd-network-05-cookies
objectives:
  - 用協定、主機與連接埠判斷來源
  - 辨識瀏覽器讀取跨來源回應所需的伺服器許可
tags:
  - network
  - cors
resources:
  - title: MDN：跨來源資源共享
    url: https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Guides/CORS
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-network-origin-triple
    prompt: 判斷兩個 HTTP 網址是否同源要比哪三項？
    answer: 比通訊協定、主機與有效連接埠，不比路徑。
    mcq:
      question: 同協定、主機與埠時只改什麼仍同源？
      options:
        - 主機名稱
        - 有效埠號
        - 路徑
        - 通訊協定
      answer: 2
      explain: 路徑指資源，不屬於來源 3 要素。
    interview:
      question: 命令列拿到成功狀態，瀏覽器頁面卻讀不到，你怎麼區分問題？
      points:
        - 先比兩個來源
        - 區分送出與讀回
        - 核對伺服器回應許可
      answer: 我會把頁面與資料的協定、主機、埠並列。若跨來源，再看是否有預檢，以及哪個回應附了允許來源；不會把命令列成功當成瀏覽器已放行。
  - id: fd-network-cors-owner
    prompt: 誰透過 CORS 回應標頭允許跨來源讀取？
    answer: 提供資料的伺服器表達允許的來源，瀏覽器據以限制網頁腳本。
    mcq:
      question: 練習頁想讀另一來源的公開內容，哪一方能表達分享許可？
      options:
        - 發出請求的網頁，在請求標頭自訂許可
        - 用戶端，在網址查詢字串附上允許的來源
        - 命令列工具，用成功狀態替瀏覽器授權
        - 提供資料的伺服器，在回應中宣告允許的來源
      answer: 3
      explain: 許可是資料提供方的決定，不是讀取方自我授權。
  - id: fd-network-cors-read
    prompt: 瀏覽器不讓腳本讀到回應，表示請求沒有送出嗎？
    answer: 不一定；簡單跨來源請求可已送出，讀取回應才受限制。
  - id: fd-network-cors-preflight
    prompt: 預檢與讀取實際回應，時間點有何差別？
    answer: 需要預檢時，瀏覽器先確認允許條件才送正式請求；其他情境可能已送出請求，才在讀取回應時受限。
    mcq:
      question: 某跨來源操作需要預檢，預檢未通過時，什麼推論合理？
      options:
        - 正式請求一定已成功
        - 該正式請求不會因這次預檢而獲准送出
        - 資料服務的 DNS 一定失敗
        - 所有不需預檢的請求也一定未送出
      answer: 1
      explain: 預檢是這次正式操作之前的許可檢查，不能拿結果推論其他請求或名稱解析。
practice:
  - id: fd-network-b04-06-p1
    title: 交一張來源比較單
    kind: hands-on
    minutes: 10
    steps:
      - 執行 origins.py，把三列整理成協定、主機、埠、判斷
      - 加一個只換路徑的候選網址
      - 在筆記寫下跨來源時還缺哪一項證據
    checks:
      - 原始 3 列依序是真、假、假
      - 新增列與原頁同源
      - 我把伺服器許可與自己的程式分開說明
---

## 2 個視窗都打得開，為什麼網頁讀不到？

練習頁和提供資料的程式都放在自己的電腦。你用網址列能看見資料，網頁卻不能把它讀進清單。這裡有兩個不同的動作：讓使用者造訪另一頁，和讓目前這頁的程式讀取另一處的內容。瀏覽器需要區隔不同網站，不讓一個網頁因為你開著它，就能任意讀出其他網站的資料。

## 先算來源，再看誰給許可

對一般 HTTP 網址，來源 (origin) 由通訊協定、主機與有效連接埠組成。三者都相同才是同源；路徑、查詢條件和文章片段不在判準裡。有效連接埠是把預設值也算進去：HTTP 省略埠號相當於 80，HTTPS 省略則是 443。HTTPS 是透過 TLS 保護傳輸的 HTTP，原理見[〈TLS 與 HTTPS〉](#/lesson/fd-network-04-tls)；這裡只需辨認協定是不是一樣。同一台電腦上的兩個不同埠仍然是兩個來源，主機名稱不同也不能只因為指向同一個位址就算同源。

同源政策 (same-origin policy) 限制一個來源的腳本讀取另一個來源的資料。跨來源資源共享 (CORS) 則是伺服器透過回應標頭告知瀏覽器，哪些來源的腳本可讀取特定回應。它不是使用者登入，也不是網路防火牆。某些跨來源請求可先送到伺服器，之後瀏覽器才決定是否讓腳本讀到結果；另一些請求須先通過預檢 (preflight)，瀏覽器才會送正式請求。

## 範例：先別連線，只判斷 3 個候選網址

開啟 `C:\dev\stackway-lab\network`，將範例另存為 `origins.py`。逐一比對通訊協定、主機與連接埠。即使路徑完全一樣，只要來源不同，判斷結果也可能不同。

在該目錄執行：Windows PowerShell 用 `py origins.py`；macOS／Linux 用 `python3 origins.py`。

```python
from urllib.parse import urlsplit

def origin(address):
    u = urlsplit(address)
    default = {"http": 80, "https": 443}[u.scheme]
    return (u.scheme, u.hostname, u.port if u.port is not None else default)

page = "http://127.0.0.1:8000/desk"
for url in ["http://127.0.0.1:8000/list?q=1",
            "http://127.0.0.1:8001/list",
            "https://127.0.0.1:8000/list"]:
    print(origin(url), origin(page) == origin(url))
```

這個程式只切開網址字串，不會啟動兩台伺服器。先看第一列：路徑與查詢都換了，來源仍然相同。第二列只改埠號，第三列只改協定，2 列都不同。輸出 False 的意思只是「跨來源」，不能據此宣布對方一定拒絕讀取；還沒有任何回應可供檢查。這一步只適用於範例中的 HTTP 與 HTTPS 網址，不要用這個小函式推算本機檔案等其他來源。

### 解讀一張回應收據

假設第二列是一般不帶憑證的跨來源 GET，伺服器回了成功狀態，但沒有允許來源的標頭。瀏覽器可以在網路面板看到請求，卻不讓網頁腳本取得內容。若服務確實打算分享，應由提供資料的一方回覆 `Access-Control-Allow-Origin`，例如明列本例練習頁的來源 `http://127.0.0.1:8000`，不含路徑；填成服務自己的 8001 埠，並未允許這一頁讀取。把它加在網頁自己送出的請求裡，不會讓網頁取得許可。

## 常見錯誤

命令列工具能拿到資料，只能證明服務對該工具有回應，不能用來證明瀏覽器會准許網頁讀。遇到問題也不要關掉瀏覽器保護；先保留兩端來源和回應標頭，讓維護服務的人核對預期的讀取對象。

## 小結

先報告是哪一項使兩端跨來源，再分別回答「請求送了嗎」和「腳本可讀嗎」。這樣即使工具顯示成功、畫面仍然空白，你也知道兩個觀察可以同時成立。
