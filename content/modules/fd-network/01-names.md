---
id: fd-network-01-names
module: fd-network
order: 1
title: DNS 與網址解析
subtitle: 網址、網域與位址
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 分出網址的主機、路徑與查詢
  - 說明 DNS 回答什麼而不傳回網頁
tags:
  - network
  - dns
resources:
  - title: MDN：名稱查詢與網頁傳送
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-network-dns-question
    prompt: DNS 位址查詢需要網址中的哪一部分？
    answer: 需要主機名稱；路徑與查詢字串留給後續的資源請求。
    mcq:
      question: 哪個變更會改變要解析的名稱？
      options:
        - 把頁碼從一換成 2
        - 把主機換成另一個網域
        - 把路徑換成首頁
        - 在文章末尾加小節標記
      answer: 1
      explain: 只有主機換了才改變查詢名稱。後三項都保留原主機。
    interview:
      question: 查得到文件網站的位址，為什麼還不能宣布文件正常？
      points:
        - 主機名稱已有解析結果
        - 尚未證明能連到服務
        - 路徑需由服務處理
      answer: 我會先記下這次查的主機與結果，再測文件的請求。即使名稱沒問題，連接埠仍可能沒開，文件也可能搬走。
  - id: fd-network-url-query
    prompt: 路徑與查詢字串怎麼分？
    answer: 路徑指定資源的位置，問號後的查詢字串提供由服務解讀的參數。
    mcq:
      question: 在 /notes?week=2 中，哪部分是查詢內容？
      options:
        - /notes
        - notes?week
        - week=2
        - /notes?week=2
      answer: 2
      explain: 問號分開路徑與查詢，不是名稱的一部分。
  - id: fd-network-resolved-not-served
    prompt: 名稱查到位址後還不能證明什麼？
    answer: 還不知道能否建立連線，也不知道要的資源會不會傳回來。
    mcq:
      question: 查到兩個位址，哪個結論有根據？
      options:
        - 兩篇文件都已下載
        - 兩台服務一定都能連線
        - 之後的答案不會變
        - 這次名稱解析有答案
      answer: 3
      explain: 名稱查詢不測服務，也不保證答案固定。
  - id: fd-network-url-fragment
    prompt: 網址裡的小節標記會隨一般 HTTP 請求送到網站嗎？
    answer: 不會。井字號後面的片段由瀏覽器使用，與問號後面可送給服務的查詢字串不同。
    mcq:
      question: 開啟 /guide?page=2#ports，一般 HTTP 請求的目標會包含哪一段？
      options:
        - /guide#ports
        - /guide?page=2
        - /guide?page=2#ports
        - '只有 #ports'
      answer: 1
      explain: 路徑和查詢字串一起指定要取的資源；片段用於頁內定位。
practice:
  - id: fd-network-b04-01-p1
    title: 留一張網址拆解卡
    kind: hands-on
    minutes: 8
    steps:
      - 在練習資料夾建立 dns-note.md，從資源頁抄下協定、主機、路徑
      - 替這個路徑寫一組假想的頁碼查詢
      - 執行名稱查詢，分開記錄結果與還不知道的事
    checks:
      - 卡上主機欄不含斜線或問號
      - 我能指出改頁碼不會換主機
      - 查詢結果與文件是否可讀分成兩行
---

## 為什麼改了頁碼，不必找另一台主機？

在文件網站翻到第二頁，網址列變了，但你沒有搬到另一個網站。反過來說，網站把服務搬到另一台機器，你的書籤卻可能原封不動。這兩件事並不矛盾：網址同時描述「找誰」和「向它要什麼」，而電腦可以先把前者換成網路能用的位址。

## 把網址拆成 4 個問題

網址 (URL) 開頭的通訊協定 (scheme) 指出要依哪一套規則存取，例如用 HTTPS 取得網頁。HTTPS 在傳輸時用 TLS 保護 HTTP 訊息，之後可用[〈TLS 與 HTTPS〉](#/lesson/fd-network-04-tls)區分加密與名稱查詢。接著是主機名稱 (hostname)，像是 `developer.mozilla.org`。由主機後第一個斜線起算的路徑 (path) 指定資源；問號後面的查詢字串 (query string) 可以帶頁碼或搜尋條件。條件的意思由網站決定，不是每個網站看見 `page=2` 都會翻頁。

網域名稱系統 (DNS) 提供名稱對應的紀錄。要連線時，用戶端通常需要查出主機名稱對應的網際網路位址 (IP address)。名稱解析器可能直接使用先前保留、尚未過期的結果，不必每次都問到管理該網域的伺服器。它不需要你的頁碼，也不會把文章內容送回來。連上位址之後怎麼取得文章，之後在[〈HTTP 方法、狀態與標頭〉](#/lesson/fd-network-03-message)會細講。

## 範例：對同一份文件問 2 種問題

在一般瀏覽器開啟本課延伸資源。觀察網址列的主機名稱，再沿著主機後面的斜線讀出文件的位置。現在不要開新網頁：在 Windows 練習資料夾的 PowerShell 執行下列指令；macOS 或 Linux 已有 nslookup 時指令相同。這一步要連網，不需要建立檔案。

```powershell
nslookup developer.mozilla.org
```

輸出的開頭通常是回答查詢的伺服器，不是你要連的網站；往下看答案區的名稱與位址。結果可能有不只一筆，也可能沿著別名才到位址。別把某一組數字背下來：網路位置、查詢時間與暫存結果都可能影響答案。離線時可以完成網址拆解，把名稱查詢標成「未測」，不要把推測的位址補上去。

### 只換一段，預測哪一步得重做

把文件的路徑抄到紙上，在後面加上 `?page=2`，不用造訪。若改的是問號後面的數字，名稱解析要找的仍是同一個主機。若改的是主機名稱，即使路徑逐字相同，也不能再假定那是同一個網站。還有一種常見的井字號片段 (fragment)：例如文章內的小節位置，是瀏覽器使用的標記，不會隨一般 HTTP 請求送去索取網頁。

## 常見錯誤

把整串網址交給名稱查詢工具，等於把門牌、樓層和購物清單一起交給只負責找地址的人。先圈出主機欄再查。另一個錯誤是看到位址就寫「網站正常」；這只證明這次查得到紀錄，不能證明有程式接待連線，更不能保證那份文件存在。

## 小結

用兩句話留下線索：「我問哪個名稱，查到了什麼」以及「我要向它取哪個資源」。即使明天網站的位址換了，這兩個問題仍然有用。
