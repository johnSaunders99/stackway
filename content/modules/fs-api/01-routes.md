---
id: fs-api-01-routes
module: fs-api
order: 1
title: REST 資源與路由
subtitle: 從使用情境決定路由
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 把新增與查詢分成不同 HTTP 動作
  - 用具體例子寫下請求與回應
tags:
  - api
  - routing
resources:
  - title: "MDN：HTTP 請求方法"
    url: "https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Reference/Methods"
    kind: "doc"
    lang: "zh-Hant"
    minutes: 6
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-api-method-path"
    prompt: "路由為什麼不能只看路徑？"
    answer: "同一路徑可依方法對應不同操作，如 GET 讀集合、POST 在集合建立項目。"
    mcq:
      question: "要讀清單而不改變它，選哪個約定？"
      options:
        - "POST 加集合路徑"
        - "GET 加集合路徑"
        - "每次讀取前先新增"
        - "GET 時自動建立新筆數"
      answer: 1
      explain: "讀取不應帶來使用者要求以外的新增效果。"
    interview:
      question: "你怎麼讓網頁與手機共用新增待辦的介面？"
      points:
        - "定義集合與方法"
        - "由服務配發識別碼"
        - "交代如何查到新資源"
      answer: "我會先約定 POST 到待辦集合，由服務建立並回傳新項目與位置；兩種用戶端都用 GET 讀同一個位置，不必知道彼此的按鈕或畫面名稱。"
  - id: "fs-api-resource-location"
    prompt: "建立回應裡的 Location 有什麼用？"
    answer: "指出新資源的位置，呼叫端可依它查詢剛建立的項目。"
    mcq:
      question: "新增成功後，要查剛新增的單筆，應跟隨什麼？"
      options:
        - "回應提供的資源位置"
        - "猜目前最大編號"
        - "再送一次新增"
        - "改查固定第一筆"
      answer: 0
      explain: "猜號碼或重送都可能拿到不對的資料。"
  - id: "fs-api-collection-item"
    prompt: "集合和單筆的回應形狀為什麼要分開定義？"
    answer: "集合裝多筆，可為空陣列；成功的單筆查詢描述一個物件。"
    mcq:
      question: "空的待辦清單最符合此例契約的結果是什麼？"
      options:
        - "成功與虛構的第一筆"
        - "自動新增測試項目"
        - "回傳上一筆物件"
        - "成功與空陣列"
      answer: 3
      explain: "不存在的成員與存在但為空的集合是兩件事。"
practice:
  - id: "fs-api-01-routes-p1"
    title: "留下可重播的路由契約"
    kind: "code"
    minutes: 10
    steps:
      - "執行範例並建立一筆"
      - "把方法、路徑、狀態碼和回應形狀記入 routes.md"
      - "連續讀清單兩次，比較筆數後關閉服務"
    checks:
      - "建立回應的位置能查到同一編號"
      - "連讀 2 次仍是 1 筆"
---

## 為什麼要學：2 個按鈕不需要 2 套語言
待辦清單上有「新增」和「查看」兩個按鈕。若網頁說「存資料」、手機說「加入項目」，後端是不是要懂每個畫面的按鈕名稱？不用。應用程式介面（API）約定交換資料的方式；REST 的一個重要想法，是先指出資源（resource），再用 HTTP 方法表達要對它做什麼。今天替兩個畫面共用的待辦清單寫這份約定。

## 核心概念：先圈名詞，再選動作
這裡的資源是待辦項目，`/tasks` 表示集合，`/tasks/1` 表示其中一筆。路由（route）用方法與路徑配對處理程式；同樣是集合路徑，`GET` 讀清單，`POST` 把新項目交給伺服器建立。讀取不應偷偷新增資料，否則重新整理頁面就可能多出一筆。回應不只是一段文字，還包含狀態碼、標頭和內容；之後在[〈HTTP 狀態與錯誤格式〉](#/lesson/fs-api-02-status)會仔細區分失敗原因。

先做一個很小的約定：新增的是固定名稱的示範項目，這次不接收表單欄位。成功時伺服器配發編號，並在 `Location` 標頭告知新資源的位置，讓呼叫端不用猜下一筆的編號。清單暫存在記憶體，關掉程式就會消失；目的是看請求如何配到處理程式，不是建立資料庫。

## 範例：對同一個集合先寫再讀
在 `C:\dev\stackway-lab` 的新資料夾 `api-notes` 把以下內容存為 `routes.mjs`。程式用 Node.js 內建的 HTTP 伺服器，只聽本機，沒有額外套件。請先找出哪一行會改變清單，再啟動它。
```js
import { createServer } from 'node:http';
const tasks = [];
createServer((req, res) => {
  const send = (status, data, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify(data));
  };
  if (req.url === '/tasks' && req.method === 'POST') {
    const task = { id: tasks.length + 1, title: 'read' };
    tasks.push(task);
    return send(201, task, { Location: '/tasks/' + task.id });
  }
  if (req.url === '/tasks' && req.method === 'GET') return send(200, tasks);
  const task = tasks.find(t => '/tasks/' + t.id === req.url);
  if (req.method === 'GET' && task) return send(200, task);
  send(404, { code: 'NOT_FOUND' });
}).listen(18731, '127.0.0.1');
```
在檔案所在資料夾執行 `node routes.mjs`，終端機繼續等待表示伺服器正在工作。開第二個 PowerShell 視窗送出以下請求；macOS/Linux 的 bash 把 `curl.exe` 改成 `curl`，其餘相同。
```powershell
curl.exe -i -X POST http://127.0.0.1:18731/tasks
curl.exe -i http://127.0.0.1:18731/tasks/1
curl.exe -i http://127.0.0.1:18731/tasks
```
先看新增回應中的位置，再把它和第二行查詢路徑相對照。最後一個回應是陣列，而單筆查詢回的是物件。再讀清單一次，不應多出項目；完成後在第一個視窗按 Ctrl+C 停止。

### 拿契約核對真實交流
把瀏覽器畫面暫時想成看不到程式碼的另一組人。他們從建立回應學到的是「此刻有一筆新資源」以及「要去哪裡查」，而不是服務內部用陣列還是資料表。假如明天把儲存方式換成資料庫，只要這個位置、方法與回應形狀不變，畫面不必跟著重寫。這就是把內部實作和可依賴的介面分開的好處。

## 常見錯誤
把方法忽略、只用路徑分派，結果可能按「查看」也觸發寫入。另一個盲點是只試集合，不試新增回應給的位置，等到畫面要開詳細頁才發現沒有單筆路由。本例只接受列出的精確路徑，沒有處理搜尋參數或完整的錯誤分類；不要把示範的後備回應當成所有 API 的規定。

## 小結
設計路由時先寫下「對哪個資源、做什麼、成功後可去哪裡讀」。只憑這三句，另一個畫面的開發者就該能重播你的新增與查詢流程。
