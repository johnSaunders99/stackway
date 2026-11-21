---
id: fs-node-04-express
module: fs-node
order: 4
title: Express 路由與中介軟體
subtitle: 讓紀錄動作經過兩條路由
status: ready
minutes: 35
level: 3
prereqs:
  - fs-node-03-http
objectives:
  - 用 Express 註冊 GET 路由並回應 JSON
  - 追蹤中介軟體呼叫 next 和直接結束回應的差別
tags:
  - node
  - express
resources:
  - title: "Express：安裝與專案需求"
    url: https://expressjs.com/en/starter/installing.html
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
  - title: "Express：使用中介軟體"
    url: https://expressjs.com/en/guide/using-middleware.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-node-04-express-route
    prompt: "app.get(\"/bins\", handler) 約定了什麼？"
    answer: "符合 GET 方法與 /bins 路徑時，交給這個處理函式。"
    mcq:
      options:
        - "只要同一個連接埠就一定回應"
        - "GET /bins 與 POST /bins 都交給它"
        - "所有以 /bins 開頭的子路徑都交給它"
        - "方法、路徑及處理函式"
      answer: 3
      explain: "路由是配對條件，沒有定義儲存與其他方法的行為。"
  - id: fs-node-04-express-next
    prompt: "中介軟體只印紀錄又沒有回應時，還需要做什麼？"
    answer: "呼叫 next() 把這筆請求交給後面的處理程序。"
    mcq:
      options:
        - "只寫 return"
        - "重開一次 listen"
        - "呼叫 next()"
        - "再送一筆新的 HTTP 請求"
      answer: 2
      explain: "return 只離開函式，不是交棒；next 沿用同一筆請求。"
    interview:
      question: "兩條路由都要記錄請求，維護模式又要擋住其中一條，你如何安排順序？"
      points:
        - "共用紀錄放在路由前並交棒"
        - "維護分支回覆後結束"
        - "用兩條路由核對實際經過順序"
      answer: "我會先註冊共用紀錄，再註冊需要攔截的條件。平常呼叫 next，攔截時直接回明確狀態並返回；各送一次請求，比對是否都有紀錄、被攔的是否沒進到原路由。"
  - id: fs-node-04-express-finish
    prompt: "中介軟體已經直接送出完整 JSON，正常分支應怎麼結束？"
    answer: "停止這條分支，不再交給可能再次送回應的下一棒。"
    mcq:
      options:
        - "一律呼叫 next 再送一次"
        - "送完就返回，不再 next"
        - "再從下一個路由補一次成功回應"
        - "呼叫 next 後才算把 JSON 送出去"
      answer: 1
      explain: "每筆請求只應有一個最終回應，結束與交棒是不同選擇。"
practice:
  - id: fs-node-04-express-lab
    title: "建一個有共用紀錄的雙路由服務"
    kind: build
    minutes: 15
    steps:
      - "在全新的 express-lab 安裝 Express 5，將正文存成 app.mjs 並啟動。"
      - "開啟 /bins、/health 以及 /bins?pause=1，比對每筆的共用紀錄與最終本文。"
    checks:
      - "正常的兩條路由都出現 IN 紀錄並回不同 JSON。"
      - "暫停參數回 503 而不是庫位資料，且程式仍可服務 /health。"
---

## 為什麼要學：不用在每個路口都抄一份紀錄程式

原生伺服器只有一條查詢時，用條件判斷就能分流；等到有庫位、健康檢查與維護模式，每條分支都要印相同的紀錄，複製很容易漏一條。Express 是處理 HTTP 的框架（framework）。它用路由（route）表達「哪種請求要交給哪個函式」，並讓多條路共用前面的流程。

## 核心概念：每一棒要嘛交出去，要嘛結束

中介軟體（middleware）站在請求的處理路徑上，可以讀取請求、決定直接回應，或用 `next()` 交給後面的相符處理函式。`app.use` 依註冊順序加入這些步驟；`app.get` 另外要求方法是 GET 且路徑相符。這些函式拿到的是同一趟請求，不是每一棒自己向伺服器重新發信。

若這一棒只做觀察，例如印出方法和路徑，觀察完就要交棒。若它已決定使用者應該收到什麼，送出回應就該停下。`return` 本身不是 Express 的交棒命令：寫 `return res.json(...)` 是先完成回應再離開函式；光寫 `return`，既不回覆也不交接，用戶端仍然在等。

## 範例：2 條路由共享一道入口

在練習區新建空的 `C:\dev\stackway-lab\express-lab`，從該目錄開啟 PowerShell，依序執行 `npm.cmd init -y`、`npm.cmd install express@5`；macOS 或 Linux 用 `npm`。這會下載本機專案的依賴並更新鎖定檔，不用全域安裝。接著存入 `app.mjs` 並用 `node app.mjs` 啟動。

```js
import express from "express";

const app = express();
app.use((req, res, next) => {
  console.log("IN", req.method, req.path);
  next();
});
app.use("/bins", (req, res, next) => {
  if (req.query.pause === "1")
    return res.status(503).json({ message: "庫位維護中" });
  next();
});
app.get("/bins", (req, res) => res.json({ bins: ["A2"] }));
app.get("/health", (req, res) => res.json({ ok: true }));
app.listen(8767, "127.0.0.1", () => console.log("ready 8767"));
```

在瀏覽器開啟 `http://127.0.0.1:8767/bins`，再換成 `/health`。兩次都會經過最前面的紀錄，但最後的 JSON 不同。把地址改成 `/bins?pause=1`，查詢參數是字串，因此範例與 `"1"` 比較。這次第一棒仍然留下紀錄，第二棒直接送出 503，正常庫位處理不應再被執行。測完在服務的終端機按 Ctrl+C。

### 把中介順序當成可驗證的假設

先在紙上畫三列：一般庫位、健康檢查、暫停中的庫位。每一列都填「經過共用紀錄嗎」、「經過庫位檢查嗎」、「最後由誰回覆」。健康檢查會經過紀錄，但不該被庫位的維護條件擋住，這就是把維護中介掛在庫位路徑而不是整個應用程式的理由。若需求改為全站維護，就要重新決定健康檢查還能不能回答，而不是碰巧把一行程式挪到最上面。把表格中的某一格改成相反結果，再推哪一個註冊位置必須跟著變，會比單看程式排列更容易理解範圍與順序的差別。

## 常見錯誤

在兩條路由之後才註冊共用紀錄，前面若已送出回應就不會再走到它。另一個極端是無論有沒有回應都呼叫 `next`，使後面的路由也想送一次。遇到懸著不動或重複回應，別先改連接埠，沿著當次路徑找是哪一棒既未回覆也未交接，或是哪一棒做了兩件事。

如果處理函式既沒有回應也沒有交給下一步，終端機未必報錯，但用戶端的等待仍不會結束。

## 小結

路由挑選處理者，中介軟體安排共同步驟。用一張順序圖標出每條路徑的最後一棒，比背一串框架函式名更能預測伺服器的行為。
