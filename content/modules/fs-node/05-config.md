---
id: fs-node-05-config
module: fs-node
order: 5
title: 環境設定與啟動驗證
subtitle: 少了必要設定就清楚說明原因
status: ready
minutes: 25
level: 3
prereqs:
  - fs-node-04-express
objectives:
  - 用環境變數指定連接埠並檢查範圍
  - 缺少必要值時停止啟動，不把私密值記入錯誤訊息
tags:
  - node
  - config
resources:
  - title: "Node.js：讀取環境變數"
    url: https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-node-05-config-string
    prompt: "從 process.env 讀到的連接埠通常是什麼型別？"
    answer: "存在時是字串；缺少時是 undefined，使用前要檢查再轉數字。"
    mcq:
      options:
        - "字串或 undefined"
        - "自動轉好的整數"
        - "一定是布林值"
        - "無論是否設定都會是字串"
      answer: 0
      explain: "環境設定是文字入口，不能因欄位叫 PORT 就當成數字。"
  - id: fs-node-05-config-port
    prompt: "本例要求固定服務埠 1 到 65535，哪個輸入應拒絕？"
    answer: "含多餘文字、非整數、缺值或超出範圍都不符合此設定契約。"
    mcq:
      options:
        - "18768"
        - "443"
        - "65535"
        - "18768demo"
      answer: 3
      explain: "只解析開頭數字會誤放行尾隨文字；另需檢查範圍。"
  - id: fs-node-05-config-startup
    prompt: "缺少必要設定時，何時最適合報錯？"
    answer: "在開始監聽或處理工作之前；指出欄名與修正條件，不輸出私密值。"
    mcq:
      options:
        - "第一位使用者操作很久後"
        - "把所有環境變數印出後"
        - "啟動驗證時"
        - "等到第一次真的要使用該值時"
      answer: 2
      explain: "早失敗能縮小影響；紀錄問題欄名已足以提示修正。"
    interview:
      question: "服務啟動失敗時如何兼顧可診斷與資料保護？"
      points:
        - "先驗必要值與格式再監聽"
        - "顯示設定名與接受條件"
        - "不回顯值或列印整包環境"
      answer: "我會先把字串驗成固定範圍的整數。若失敗就用非零狀態結束，指出哪個欄位需要怎樣設定，不印原值。合法之後才監聽；若那時才報位址被占用，便是另一類問題。"
practice:
  - id: fs-node-05-config-lab
    title: "留下三條啟動結果"
    kind: code
    minutes: 11
    steps:
      - "建立 start.mjs，從新的專用終端機先測沒有 LAB_PORT，再測 18768x。"
      - "設定為 18768 後開啟本機頁面，保留三筆觀察而非整份環境內容。"
    checks:
      - "缺值與不合法值都在監聽前失敗，訊息不回顯輸入值。"
      - "合法值才啟動服務，開啟首頁會顯示 ready。"
---

## 為什麼要學：換一個位置，不應改寫整支服務

同一份程式在兩個練習目錄執行，第一份已經占用原本的連接埠，第二份希望換個位置。若號碼寫死在程式裡，就得為每次啟動改檔。環境變數（environment variable）讓啟動程式的人提供設定，而不用動程式碼；相對地，程式有責任檢查收到的設定是否合理。

## 核心概念：字串是輸入，數字才是設定

Node 透過 `process.env` 讀取行程環境。`LAB_PORT` 是這個練習專用的名稱，不去改其他服務也可能使用的通用名稱。沒有設定時讀到 `undefined`；即使畫面上看起來像數字，有設定時拿到的仍是字串。先驗格式、再轉數字、最後驗範圍，是三個有順序的決定。

本例要求固定連接埠，允許 1 到 65535，刻意不接受表示由系統選埠的 0。啟動驗證（startup validation）應在監聽之前完成，失敗就以非零狀態結束。錯誤只需說哪個設定不合規則與應該如何修；不應傾印整份環境，也不需要把可能誤貼到欄位裡的私密字串照抄出來。

## 範例：缺、錯、對，分 3 次啟動

在 `node-lab` 新增 `start.mjs`。開一個新的專用 PowerShell，先確認這次練習尚未設定 `LAB_PORT`，直接執行 `node start.mjs`。只在這個練習終端機設定以下變數；關閉分頁就不會影響下次新開的工作環境。

```js
import { createServer } from "node:http";
const raw = process.env.LAB_PORT;
if (raw === undefined || raw === "") {
  console.error("Missing LAB_PORT: use an integer from 1 to 65535");
  process.exitCode = 1;
} else if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 65535) {
  console.error("Invalid LAB_PORT: use an integer from 1 to 65535");
  process.exitCode = 1;
} else {
  const port = Number(raw);
  createServer((req, res) => res.end("ready"))
    .listen(port, "127.0.0.1", () => console.log("ready", port));
}
```

在同一終端機輸入 `$env:LAB_PORT = '18768x'` 再執行一次，預期是格式不合法。接著改成 `$env:LAB_PORT = '18768'` 並執行，這次才在瀏覽器前往 `http://127.0.0.1:18768/`。macOS 或 Linux 可用單次命令 `LAB_PORT=18768x node start.mjs` 與 `LAB_PORT=18768 node start.mjs`。確認看到正常本文後以 Ctrl+C 停止服務。

### 用邊界值區分規則與環境

如果只測一個合法號碼和一個亂碼，很容易漏掉範圍的兩端。紙上另列負數、0、最大值加 1 與帶小數點的文字，逐一指出是哪個條件會攔下來，不需要真的在每個位置都啟動網路服務。接著選一個格式正確卻已被占用的位置思考：這次驗證函式應該通過，因為文字與數字都合規，失敗的是後面的系統資源取得。若兩種錯誤都寫成「請填正確數字」，使用者就會一直修改沒有錯的欄位。提示能導向對的下一步，也是這個小入口要驗收的功能。找得到失敗層級，才知道要換號碼還是修正輸入。

## 常見錯誤

只用 `parseInt` 會接受一些尾端還有文字的輸入；把空字串直接轉成數字又可能得到 0，看起來像有設定。也不要把選好的數字直接當成保證：它通過格式與範圍檢查，仍可能因為位址被用掉而無法監聽。兩種失敗處理的是不同責任，應該分開診斷。

## 小結

設定是一筆來自程式外的資料，和網路輸入一樣要守住邊界。把缺少、不合法、有效分開測，才知道服務是真的能依不同環境啟動，而不是剛好符合你自己的電腦。
