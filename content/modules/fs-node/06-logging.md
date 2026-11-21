---
id: fs-node-06-logging
module: fs-node
order: 6
title: 結構化紀錄與請求識別碼
subtitle: 從兩筆並行請求中找回同一趟工作
status: ready
minutes: 30
level: 3
prereqs:
  - fs-node-05-config
objectives:
  - 選擇識別碼、狀態與耗時作為紀錄欄位
  - 關聯同次請求的事件，不記錄密碼或完整權杖
tags:
  - node
  - logging
resources:
  - title: "OpenTelemetry：紀錄與關聯"
    url: https://opentelemetry.io/docs/concepts/signals/logs/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-node-06-logging-correlate
    prompt: "兩筆工作紀錄交錯時，該用什麼認出同一趟請求？"
    answer: "每次進入時建立一個識別碼，讓該次的開始與完成沿用它。"
    mcq:
      options:
        - "記錄行的相鄰位置"
        - "同次請求共用的識別碼"
        - "狀態碼是否相同"
        - "兩列的路徑是否相同"
      answer: 1
      explain: "完成順序會改變，同一狀態也可以屬於許多請求。"
    interview:
      question: "兩筆查詢的結束順序和開始不同，你怎麼算出各自耗時？"
      points:
        - "入口產生並沿用一次性識別碼"
        - "各自保存起點並在完成時記狀態"
        - "依識別碼配對，不用私人內容配對"
      answer: "我會替每筆請求保留自己的識別碼與開始時間，在回應完成事件記狀態和毫秒數。看紀錄時用識別碼挑出同一組，不拿相鄰兩行硬湊，也不把授權標頭或輸入本文當作追蹤線索。"
  - id: fs-node-06-logging-duration
    prompt: "完成事件上的 elapsedMs 應怎麼取得？"
    answer: "從這次請求的開始到完成，以單調時鐘計差並用毫秒表示。"
    mcq:
      options:
        - "本次完成時間減本次開始時間"
        - "把其他請求的時間加總"
        - "只記伺服器啟動時間"
        - "減去最近一筆請求的共用起點"
      answer: 0
      explain: "每筆工作必須保有自己的起點，單位也要固定。"
  - id: fs-node-06-logging-privacy
    prompt: "該選哪組欄位來查某筆請求的耗時，又不必留下私密內容？"
    answer: "留下本機產生的識別碼、事件、狀態與耗時，避免完整標頭、查詢字串與本文。"
    mcq:
      options:
        - "所有標頭與完整權杖"
        - "整份表單與密碼"
        - "使用者帳號取代識別碼"
        - "識別碼、事件、狀態、耗時"
      answer: 3
      explain: "定位單次工作不等於要辨認個人，應只記診斷所需欄位。"
  - id: fs-node-06-logging-finish
    prompt: "服務端留下 finish 紀錄，能證明使用者已讀到內容嗎？"
    answer: "不能。它描述伺服器端交付傳輸的時點，不是用戶端已收到、顯示或讀過的證明。"
practice:
  - id: fs-node-06-logging-lab
    title: "由交錯紀錄還原 2 趟工作"
    kind: code
    minutes: 13
    steps:
      - "在 node-lab 儲存 log.mjs 與 send.mjs，依正文用兩個終端機執行。"
      - "從輸出抄下其中一組 start、finish 到 trace-notes.txt，註記狀態與毫秒數。"
    checks:
      - "每個 ID 有一個開始和一個正常完成；兩筆 ID 不同。"
      - "紀錄沒有完整網址、標頭或本文，我仍能找出較慢的請求。"
---

## 為什麼要學：相鄰的 2 行，不一定是同一個人敲的門

服務同時接到兩筆查詢，終端機先印 2 次開始，再印 2 次完成。若只用「上一行」來配對，可能把快的請求算進慢的那筆。結構化紀錄（structured logging）把一次事件寫成欄位明確的資料；請求識別碼（request ID）則讓分散的幾行仍能被拼回同一趟工作。

## 核心概念：固定欄位，按工作保留起點

用一行 JSON 表示一個事件，固定欄位名稱與資料型別，比在長句子裡找空格可靠。開始時取新的識別碼並保留計時起點；完成時寫同一個碼、狀態與毫秒數。計算間隔用單調時鐘（monotonic clock），不受系統日期往前往後校正影響。本機的 `performance.now()` 就能提供適合取差值的讀數。

請求識別碼不等於使用者身分，也不是權限證明。本例自己產生，不要求使用者提供帳號。只記定位流程需要的資訊；完整網址可能夾帶敏感查詢，標頭與本文也可能含密碼或權杖。與其先全部存下來再想辦法清除，不如從一開始就挑允許的欄位。

## 範例：故意讓 2 筆請求交錯

在 `node-lab` 存入 `log.mjs` 並執行 `node log.mjs`。每次進入處理函式就各自建立識別碼與計時起點。`finish` 是這一端將回應交付傳輸時的事件，不保證使用者已看到畫面。

```js
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
const emit = data => console.log(JSON.stringify(data));
createServer((req, res) => {
  const id = randomUUID(), start = performance.now();
  emit({ id, event: "start" });
  res.once("finish", () => emit({
    id, event: "finish", status: res.statusCode,
    elapsedMs: Math.round(performance.now() - start)
  }));
  setTimeout(() => res.end("ok"), req.url === "/slow" ? 180 : 10);
}).listen(8769, "127.0.0.1", () => console.log("ready 8769"));
```

在同目錄另存 `send.mjs`，開第二個終端機執行 `node send.mjs`。這是同時發出兩筆，而不是在第一筆回來後才送第二筆。

```js
await Promise.all(["slow", "fast"].map(async path => {
  const res = await fetch("http://127.0.0.1:8769/" + path);
  console.log(path, res.status, await res.text());
}));
```

回到服務端，在不同的開始列上各圈一個識別碼，再找帶相同碼的完成列。只比較這兩列的欄位，不期待耗時剛好等於設定的延遲；計時包含排程與產生回應的時間。測完在第一個終端機按 Ctrl+C。若有用戶端提前斷線，正常完成事件不一定出現，不能憑缺一行就補寫成功。

### 看得出哪筆慢，還不能說為什麼慢

一次耗時較長，可以定位到那趟工作，卻無法只憑開始與完成就判定瓶頸在資料庫。這個範例因為自己安排延遲才知道原因；真實服務還要在同一識別碼下觀察讀取或處理階段。若下一次需要加欄位，先寫下想回答的問題，例如是等候較久還是計算較久。只加能區分兩個解釋的觀測，不必為了找慢請求就保存整份內容。

## 常見錯誤

在模組最外層只建立一次識別碼，會讓全部請求擠在同一組；在開始與完成各取一個新碼，又完全串不起來。只保留漂亮的成功碼而不寫單位也不好，後續讀者可能把毫秒理解成秒。欄名本身能說清楚，就不要讓別人猜。

## 小結

診斷的一小組好紀錄就能回答哪一趟、在哪個階段、結果如何、等了多久。能不看私密內容就還原一次交錯工作，是比「記得越多越好」更有用的驗收標準。
