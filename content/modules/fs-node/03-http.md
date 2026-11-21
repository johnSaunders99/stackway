---
id: fs-node-03-http
module: fs-node
order: 3
title: Node HTTP 伺服器
subtitle: 不用框架也能回應第一筆請求
status: ready
minutes: 35
level: 3
prereqs:
  - fs-node-02-deps
objectives:
  - 以 createServer 接收本機請求並結束回應
  - 對照瀏覽器與伺服器觀察到的方法、路徑及狀態碼
tags:
  - node
  - http
resources:
  - title: "Node.js：http 模組"
    url: https://nodejs.org/api/http.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-node-03-http-pair
    prompt: "createServer 的處理函式何時收到 req 與 res？"
    answer: "有請求抵達時被呼叫，req 提供輸入資訊，res 用來組成這次回應。"
    mcq:
      options:
        - "只有程式啟動時"
        - "只有狀態為 200 時"
        - "每次收到請求時"
        - "瀏覽器讀完內容後"
      answer: 2
      explain: "listen 啟動監聽，處理函式才針對各次請求工作。"
  - id: fs-node-03-http-end
    prompt: "呼叫 res.end 的作用是什麼？"
    answer: "結束這一筆回應的內容，不是關閉整個伺服器。"
    mcq:
      options:
        - "停止監聽所有連線"
        - "完成本次回應"
        - "要求用戶端關閉所有共用連線"
        - "只寫本文，不代表回應已經結束"
      answer: 1
      explain: "伺服器之後仍可處理下一筆請求，兩種生命週期不同。"
    interview:
      question: "瀏覽器一直等，但終端機已經印出收到請求，你會先看哪裡？"
      points:
        - "區分收到請求與完成回應"
        - "檢查各分支是否有 end"
        - "比對方法路徑與實際狀態碼"
      answer: "我會先確認看到的是同一筆方法與路徑，再沿著那條分支找 res.end。只有收到請求的紀錄不代表送完了；我會從瀏覽器網路面板核對狀態與本文，不只看伺服器印了什麼。"
  - id: fs-node-03-http-route
    prompt: "比較路由時為什麼方法與路徑都要看？"
    answer: "同一路徑可以有不同操作，必須確認實作支援該方法與資源。"
    mcq:
      options:
        - "路徑相同不代表操作相同"
        - "相同路徑上的 GET 和 POST 一定可互換"
        - "只比方法就能找出唯一要讀的資源"
        - "GET 一定支援所有路徑"
      answer: 0
      explain: "方法表達操作意圖，路徑辨認目標，兩者不足以互相取代。"
  - id: fs-node-03-http-bind
    prompt: "為什麼本機練習明確監聽 127.0.0.1？"
    answer: "回送位址把服務限制在這台電腦，不必開放給區域網路裡其他裝置。"
practice:
  - id: fs-node-03-http-lab
    title: "留下可重跑的本機收件口"
    kind: build
    minutes: 15
    steps:
      - "在 node-lab 建立 server.mjs，啟動後依序開啟 /bins 與 /missing。"
      - "在瀏覽器網路面板比對方法、路徑、狀態與本文，把結果記入 http-notes.txt，最後按 Ctrl+C。"
    checks:
      - "GET /bins 回 200 與庫位 JSON；GET /missing 回 404。"
      - "第二筆請求不必重啟程式，停止服務後則無法再取得回應。"
---

## 為什麼要學：終端機說開好了，瀏覽器看見什麼？

資料夾裡有一支 JavaScript 檔，不代表別的程式可以向它要資料。你需要一個願意在特定位置等候、收到請求後能回覆的程式。HTTP 伺服器（HTTP server）就是扮演這個角色。先用 Node 內建的模組完成一次往返，往後用框架時才知道它替你省略了哪些步驟。

## 核心概念：先開始監聽，再處理每一次來信

`createServer` 接受處理函式，但建立伺服器物件不等於已開放服務；`listen` 才要求在指定的位址與連接埠（port）監聽。指定 `127.0.0.1` 表示只從本機連入。把它當成一個專用窗口：號碼是窗口位置，路徑（path）與方法（method）則是來到窗口後要求辦哪種事。

每次有 HTTP 請求，處理函式會拿到 `req` 與 `res`。前者讓你看方法與目標，後者讓你設定狀態碼、內容型別與本文。呼叫 `end` 表示這一筆回應不再有更多內容，不是叫伺服器下班。狀態碼是給用戶端使用的訊息，所以找不到資料時，除了寫一句找不到，還得回正確的代碼。

## 範例：一個可查庫位的本機窗口

在練習區的 `node-lab` 存成 `server.mjs` 並執行 `node server.mjs`。這個終端機要保持開著；它沒有回到提示字元，表示正在等待服務，而不是卡在安裝。

```js
import { createServer } from "node:http";

createServer((req, res) => {
  const path = new URL(req.url, "http://127.0.0.1").pathname;
  const known = path === "/bins";
  const status = !known ? 404 : req.method === "GET" ? 200 : 405;
  res.statusCode = status;
  if (status === 405) res.setHeader("Allow", "GET");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const data = status === 200 ? { bins: ["A2"] } : { error: status };
  console.log(req.method, path, status);
  res.end(JSON.stringify(data));
}).listen(8766, "127.0.0.1", () => console.log("ready 8766"));
```

先在瀏覽器開 F12 的「網路」面板，再前往 `http://127.0.0.1:8766/bins`。點文件那筆，核對方法、路徑、狀態與回應本文；再把路徑改成 `/missing`。用終端機對照同一條路徑，不要拿瀏覽器額外要求的網站圖示來比。`pathname` 只取路徑，所以加一個查詢參數並不會改變這個範例的庫位判斷。

### 從兩端拼出一次往返

把紙分成兩欄，左邊代表瀏覽器，右邊代表伺服器。左邊寫「我要庫位」，右邊不可能直接看見使用者手指按了哪個按鍵；它收到的是方法與目標。右邊寫「找得到，這是資料」，左邊也不需要知道伺服器的變數叫什麼；它收到的是狀態、標頭與位元組。這條界線就是除錯的分工：若伺服器紀錄顯示發現的路徑不同，先修請求；若路徑正確但回了錯誤狀態，先看分支；若狀態與本文都對而瀏覽器畫錯，才查呈現。光拿一張空白頁截圖，還不足以選中哪一端。先把問題定位在這條界線的哪一側，再修改對應的程式。

## 常見錯誤

把 `200` 寫在 JSON 的文字中，並不會設定 HTTP 狀態碼；反過來只設狀態碼、忘記結束回應，使用者也可能一直等。若看到位址已使用，先看自己的上一次服務是否仍開著，用那個終端機的 Ctrl+C 正常停止，不要任意結束其他程式。

## 小結

用戶端提出方法與路徑，伺服器決定狀態與本文，雙方各留一筆可核對的證據。測一條存在與一條不存在的路徑，確認它不只會回好消息。
