---
id: fs-production-02-render
module: fs-production
order: 2
title: 用戶端與伺服器端渲染
subtitle: 何時需要伺服器端頁面
status: ready
minutes: 30
level: 3
prereqs:
- fs-production-01-routing
objectives:
- 比較 React 用戶端與 Next.js 伺服器端資料取得
- 列出不能送進瀏覽器的設定
tags:
- production
- nextjs
resources:
- title: Next.js：伺服器與用戶端元件的分工
  url: https://nextjs.org/docs/app/getting-started/server-and-client-components
  kind: doc
  lang: en
  minutes: 10
  required: false
  checked: '2026-11-20'
concepts:
- id: fs-production-02-render-boundary
  prompt: 瀏覽器端取得資料與伺服器端先組出內容，第一份 HTML 有何不同？
  answer: 純用戶端取得通常先有外殼，再由 JavaScript 取資料；伺服器可先把首屏的資料內容放進回應。
  mcq:
    question: 哪個觀察最支持這份清單已出現在首份文件中？
    options:
    - 畫面最後看得到項目
    - 瀏覽器快取有 JavaScript
    - 連結能加入書籤
    - Network 的文件回應本身就含清單項目
    answer: 3
    explain: 最終畫面不能區分資料何時抵達，應直接看原始文件回應。
- id: fs-production-02-render-client
  prompt: Next.js App Router 中，需要點擊狀態的按鈕該放在哪個邊界？
  answer: 放在用戶端元件；伺服器元件可讀取資料後，只把互動需要且可公開的屬性傳入。
  mcq:
    question: 哪一段行為需要用戶端元件？
    options:
    - 按鍵後即時更新本機展開狀態
    - 在伺服器讀取不公開設定
    - 在伺服器查資料庫
    - 產生不含互動的標題
    answer: 0
    explain: 瀏覽器事件與本機狀態需要用戶端程式，不能因按鈕需要互動就把整頁的私密邏輯搬過去。
- id: fs-production-02-render-disclosure
  prompt: 伺服器端執行的程式，其資料是否一定對瀏覽器保密？
  answer: 不一定。回傳的 HTML、序列化給用戶端的屬性與公開端點都可被看見，必須先選取可公開欄位。
  interview:
    question: 私密欄位沒有畫在頁面上，但被當成 props 傳給用戶端元件，可以嗎？
    points:
    - 傳入已跨出伺服器邊界
    - 未顯示不等於未傳輸
    - 在伺服器建立最小公開資料
    answer: 不可以。我會先在伺服器挑出按鈕或頁面真的需要的值，再檢查文件與資料回應。只改 CSS 或不在畫面印出，不能把已經送出的欄位收回。
practice:
- id: fs-production-02-render-p1
  title: 留下兩份首屏回應的差別
  kind: hands-on
  minutes: 11
  steps:
  - 儲存並啟動 render.cjs，分別開啟 /server 和 /client。
  - 查看兩份文件的原始回應，再看 /client 後續的 /data 請求。
  - 在 render-notes.txt 記下哪份文件含 seat=2，哪些欄位可以公開；結束後按 Ctrl+C。
  checks:
  - /server 文件已有 seat=2；/client 文件只有外殼及取得資料的指令。
  - 直接讀 /data 只會看到公開數字，不需要任何真實憑證。
---

## 為什麼要學：停用 JavaScript，首屏還剩下什麼？

同樣顯示「剩 2 席」，可能是伺服器在送出文件前就查好了，也可能是瀏覽器先收到空殼，稍後才取得數字。對最後截圖而言沒有差別，對弱網路、錯誤處理與資料邊界卻完全不同。先拆開「哪裡算、何時到、誰能讀」，比爭論哪個框架比較快更能讓你做出合適選擇。

## 核心概念：資料取得位置與後續互動是 2 個問題

用戶端渲染（client-side rendering，CSR）可以先回一份應用程式外殼，再由瀏覽器中的 React 取得公開 API 資料並更新畫面。它要處理載入、失敗與重新取得。伺服器端渲染（server-side rendering，SSR）則可以先將資料組成 HTML，讓首份文件已有可讀內容；若資料取得很慢，首份結果也可能等更久。把工作搬到伺服器並不保證每次都較快。

Next.js 的 App Router 預設讓頁面使用伺服器元件（Server Component），可在那裡讀取伺服器資源。需要點擊事件、本機狀態的局部才標為用戶端元件（Client Component），入口檔用 `'use client'`。用戶端元件不等於「第一次一定沒有 HTML」：框架也可先產生它的初始預覽，在瀏覽器接上互動（hydration）。區分元件邊界與渲染時機，就不會看見伺服器有 HTML 便推論整頁都沒有用戶端程式。

## 範例：用瀏覽器檢查第 1 個回應

在 `C:\dev\stackway-lab\production` 存成 `render.cjs`，用 PowerShell 執行 `node render.cjs`。在瀏覽器網址列輸入 `127.0.0.1:4177/server` 和 `127.0.0.1:4177/client`。這是用 Node 標準函式庫對照兩條資料路徑的實驗，不是 Next.js 執行環境；它讓你不安裝框架也能觀察同一個差別。

```js
const http = require("node:http");
const publicData = { seats: 2 };
http.createServer((req, res) => {
  const send = (type, body, code = 200) => {
    res.writeHead(code, { "Content-Type": type + "; charset=utf-8" });
    res.end(body);
  };
  if (req.url === "/data") return send("application/json", JSON.stringify(publicData));
  if (req.url === "/server") return send("text/html", "<p>seat=" + publicData.seats + "</p>");
  if (req.url === "/client") return send("text/html",
    "<p id='v'>loading</p><script>fetch('/data').then(r=>r.json()).then(d=>document.querySelector('#v').textContent='seat='+d.seats)</script>");
  send("text/plain", "not found", 404);
}).listen(4177, "127.0.0.1");
```

在開發者工具的網路面板（Network）重新整理，再點最上層文件看回應本文。伺服器頁直接有完整數字；用戶端頁只有載入文字及取得資料的程式，要看另一筆請求才有公開席數。若只檢查元素面板，得到的是 JavaScript 更新後的結果，無從證明內容原本在哪裡。預約按鈕需要互動，不代表查詢資料庫的連線資訊也必須來到瀏覽器。

把兩條路徑畫在同一張紙上，數數使用者必須等待幾次來回，並標出哪一端有資格連資料庫。若內容完全公開且不常變，還可以預先產生頁面；若是登入後的個人畫面，則要把要求權限的資料留在通過授權的查詢裡。選擇位置是為了適合資料條件，不是替所有頁面套一條公式。

### 對照到真正的 Next.js 頁面

若手邊已有使用 App Router 的 Next.js 練習專案，可把下列檔案另存為全新路徑 `app/seat-demo/page.jsx`（使用 `src/app` 的專案則放該處）。它是伺服器元件；資料取得可換成伺服器端查詢。這裡即使資料提供端有內部欄位，也只輸出席數，沒有為了展示一個數字而把整筆物件傳給瀏覽器。沒有 Next.js 專案不必另外安裝，前面的兩個文件回應已足夠驗收本課。

```jsx
async function readSummary() {
  return { seats: 2, internalBatch: "lab-only" };
}
export default async function SeatDemo() {
  const { seats } = await readSummary();
  return <p>seat={seats}</p>;
}
```

## 常見錯誤

把整筆資料直接序列化給用戶端，然後只在介面挑幾欄顯示。沒有畫出來的欄位仍可能出現在傳輸資料中；資料庫密碼、內部權杖及使用者無權看的欄位都應留在伺服器。反過來，只讓瀏覽器看見公開資料仍不能取代寫入端的授權檢查。驗收邊界時，要看實際傳了什麼，而不是只看檔案放在哪一層。

## 小結

需要首屏內容就考慮伺服器先準備；需要互動就留一個小而明確的用戶端邊界。用原始文件與後續請求來證明你的設計，不要從畫面長相猜測。
