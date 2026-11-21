---
id: fd-network-03-message
module: fd-network
order: 4
title: HTTP 方法、狀態與標頭
subtitle: 讀一次 HTTP 請求與回應
status: ready
minutes: 30
level: 2
prereqs:
  - fd-network-03-transport
objectives:
  - 從開發者工具找出方法與狀態碼
  - 分辨標頭與回應本文
tags:
  - network
  - http
resources:
  - title: MDN：HTTP 請求與回應
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-network-message-method
    prompt: HTTP 方法和路徑各在說什麼？
    answer: 方法說明要做的動作，路徑指出操作的資源。
    mcq:
      question: 只想取得菜單本文，應選哪個方法？
      options:
        - GET
        - HEAD
        - POST
        - DELETE
      answer: 0
      explain: HEAD 不取本文，POST 讓資源處理提交內容，DELETE 不是讀取。
    interview:
      question: 使用者看到錯誤網頁，你會保留哪些線索？
      points:
        - 方法與路徑
        - 狀態碼
        - 分開記標頭與本文
      answer: 我會先選中那個文件請求，不看旁邊的圖示。記下方法、路徑和狀態，再摘一小段非敏感的本文；有錯誤頁和完全收不到回應是不同狀況。
  - id: fd-network-message-status
    prompt: 收到 404 表示沒有任何 HTTP 回應嗎？
    answer: 不是；404 本身就是回應，表示這次沒有取得指定資源。
    mcq:
      question: 哪項證明已收到 HTTP 回應？
      options:
        - DNS 查到主機位址
        - 回應狀態為 404
        - TCP 連線已建立
        - 瀏覽器正在送出 GET
      answer: 1
      explain: 狀態碼來自回應，其他三項都可能發生在收到回應之前。
  - id: fd-network-header-content
    prompt: Content-Type 與本文怎樣區分？
    answer: Content-Type 是說明資料型別的標頭，本文才是檔案或訊息本身。
    mcq:
      question: Content-Type 是 text/plain，下一步去哪讀菜單內容？
      options:
        - 狀態碼
        - 主機欄位
        - 回應本文
        - 請求方法
      answer: 2
      explain: 型別只描述如何理解本文，不含菜單文字。
practice:
  - id: fd-network-b04-04-p1
    title: 保存正常與缺檔的兩張收據
    kind: hands-on
    minutes: 13
    steps:
      - 建立 menu.txt，啟動本機服務並觀察兩個路徑
      - 在 http-note.md 為每次請求記方法、狀態、型別與本文摘要
      - 停止本機服務
    checks:
      - 同一個埠的紀錄分別是 200 和 404
      - 我沒有把型別當本文，也沒有記到圖示的請求
---

## 畫面寫著「找不到」，是誰說的？

打開一個不存在的檔案，視窗仍然可以顯示一整頁說明。原來「拿到一頁文字」和「拿到想要的檔案」不是同一件事。超文字傳輸協定 (HTTP) 把一次交換分成請求 (request) 和回應 (response)，讓你能分開檢查到底問了什麼、對方怎麼答。

## 拆信：方法、狀態、標頭、本文

請求的方法 (method) 表達想做的事。GET 要求取得資源；HEAD 要的是類似 GET 的回應標頭，不取本文；POST 要伺服器按資源的規則處理送去的內容。路徑則指定對象。光看方法不知道檔名，光看檔名也不知道是要讀還是提交。狀態碼 (status code) 位於回應：2 開頭通常表示成功，4 開頭表示這個請求有問題，5 開頭表示伺服器處理時發生問題。

標頭 (header) 是補充說明的名稱和值，例如回應的 `Content-Type` 告訴讀者本文採用哪種媒體型別。本文 (body) 才是實際要讀的位元組，可能是文字、圖片，也可能沒有。看到檔案長度的數字不等於看到檔案；更不能只憑網頁畫面猜狀態碼。

## 範例：差一個字母的 2 個請求

在 `C:\dev\stackway-lab` 新增空資料夾 `http-sample`。用編輯器在裡面建立 `menu.txt`，只寫一行 `tea`。在這個小資料夾內開 PowerShell 執行下列指令。這個 Python 小工具只分享目前資料夾給本機，別在放有其他檔案的目錄啟動。macOS 或 Linux 在相同練習資料夾用 `python3` 取代 `py`。

```powershell
py -m http.server 8765 --bind 127.0.0.1
```

在瀏覽器按 F12，切到網路 (Network) 面板，再開 `http://127.0.0.1:8765/menu.txt`。點選名稱為 menu.txt 的那一列，從標頭頁籤找出請求方法和回應狀態，到回應頁籤看見茶的英文。第一次直接開啟新檔應可看到 GET 與 200。接著把網址最後一段手動改成 `menus.txt`，多一個字母。即使瀏覽器顯示錯誤說明，這次仍然有回應，而且應該是 404。

若要留下可以打字核對的紀錄，保持第一個視窗開著，在第二個 PowerShell 視窗執行下面兩行；macOS 或 Linux 把 `curl.exe` 改成 `curl`。小寫 i 讓標頭連同本文顯示。看完回第一個視窗按 Ctrl+C 停止。

```powershell
curl.exe -i http://127.0.0.1:8765/menu.txt
curl.exe -i http://127.0.0.1:8765/menus.txt
```

兩個請求走同一個位址與埠，還是同一個資料夾裡的服務在回答；唯一改動的是檔名。把這個對照留下來，之後若有人以為缺檔就是斷線，你可以拿出那份帶有標頭和本文的錯誤回應。如果服務一開始顯示埠已使用，就改用另一個空閒的本機埠，連同兩個網址的埠號一起更換，不要關閉別人的程式。

## 常見錯誤

網路面板可能另外出現圖示請求，請以檔名選列，不要抄最下面一列。若重整時看到 304，代表先前副本仍適用，不是變成另一份檔案。若一開始就連不上，連狀態碼都沒有，先看服務是否仍在第一個視窗執行。之後在[〈網路故障分層判讀〉](#/lesson/fd-network-05-failure)會細講兩者的差別。

## 小結

交一份最短的紀錄：方法加路徑、狀態碼、一個標頭，以及本文的第一行。即使兩個畫面都能顯示文字，這四項也能讓人看出哪一份才是菜單。
