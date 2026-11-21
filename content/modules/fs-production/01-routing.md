---
id: fs-production-01-routing
module: fs-production
order: 1
title: 網址參數與路由狀態
subtitle: 網址是狀態的一部分
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
- 將頁面與參數映射到路由
- 重整與直接進入深層網址後保留相同畫面
tags:
- production
- router
resources:
- title: React Router：路由與動態路徑片段
  url: https://reactrouter.com/start/declarative/routing
  kind: doc
  lang: en
  minutes: 8
  required: false
  checked: '2026-11-20'
- title: MDN：讀取網址查詢參數
  url: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
  kind: doc
  lang: en
  minutes: 4
  required: false
  checked: '2026-11-20'
concepts:
- id: fs-production-01-routing-address
  prompt: 頁面身分與篩選條件通常各適合放在網址哪裡？
  answer: 路徑參數識別資源，查詢參數表達篩選或頁碼；兩者都應能從網址還原。
  mcq:
    question: 哪一種狀態最值得放在可分享的預約網址？
    options:
    - 尚未提交的私密備註
    - 資料庫連線憑證
    - 日期篩選條件
    - 按鈕上一次閃爍的瞬間
    answer: 2
    explain: 篩選會改變讀者應看到的清單；敏感或短暫的介面細節不適合進網址。
- id: fs-production-01-routing-source
  prompt: 用網址作為路由狀態來源，上一頁與重新整理時應從哪裡取得狀態？
  answer: 重新剖析目前網址，而不是依賴剛才點選時才設定的記憶體變數。
  mcq:
    question: 分享連結沒經過首頁按鈕，日期仍須正確，要怎麼做？
    options:
    - 只在首頁按鈕事件存日期
    - 用上一次的全域變數
    - 一律顯示本日，忽略網址
    - 首次載入及導覽後都從網址解析
    answer: 3
    explain: 開新分頁是新的執行環境，記憶體不會把操作流程一起帶過去。
- id: fs-production-01-routing-fallback
  prompt: 為何一般路徑路由在站內能走，重整深層頁卻可能得到 404？
  answer: 重整時伺服器先收到整條路徑；若沒有對前端頁面回送入口檔的規則，前端路由器還沒啟動。
  interview:
    question: 深層連結站內可點，直接貼入卻失敗，你如何分層檢查？
    points:
    - 看文件請求狀態
    - 區分一般路徑與雜湊片段
    - 確認入口載入後的路由比對
    answer: 我先開新分頁貼同一網址，看文件有沒有被送回。若文件本身是 404 就先查伺服器回送規則；若已拿到入口，再查路由參數和預設值，不混成一個問題。
practice:
- id: fs-production-01-routing-p1
  title: 交付一條能在新分頁重建的深層連結
  kind: build
  minutes: 11
  steps:
  - 將範例存為 route.html，在瀏覽器點不同篩選。
  - 複製目前的完整本機位址到新分頁，再重新整理，記下顯示結果。
  - 按上一頁並試一個不存在的路徑，在 route-check.txt 記錄三種情境。
  checks:
  - 新開及重整都能從同一網址顯示相同房間與日期。
  - 不存在的路徑顯示找不到頁面，而不是悄悄選到上一個房間。
---

## 為什麼要學：傳過去的連結，對方看到哪一間？

你在預約頁選了藍色會議室和週五，複製網址後，對方打開卻看見所有房間。這通常不是資料庫出錯，而是畫面只把選取存在記憶體裡。把有意義的瀏覽狀態放進網址，使用者才能重整、加入書籤、用上一頁回到剛才的位置。目標不是把每一個按鍵都存起來，而是保證同一個連結能重建同一個選取。

## 核心概念：路徑回答「哪一個」，查詢回答「怎麼看」

路由（route）把網址對應到頁面。路徑參數（path parameter）適合識別資源，例如 `/rooms/blue` 的房間代號；查詢參數（query parameter）適合描述檢視方式，例如 `day=fri`。日期省略時要有明確預設；房間不存在則要有找不到的結果。把兩者都塞成任意的畫面索引，等清單重新排序，舊書籤就可能指向不同的房間。

在 React Router 可把路徑宣告成 `/rooms/:room`，用 `useParams` 讀房間、用 `useSearchParams` 讀篩選；連結負責改網址，元件依當下網址算畫面。傳統路徑路由使用瀏覽歷史，伺服器必須能對合法的前端深層路徑回送入口檔。雜湊路由（hash routing）把路由放在井字號後，這一段不會隨文件請求傳給伺服器，適合靜態或本機教材。本例把查詢放在片段裡，所以要解析片段內的問號，不是讀 `location.search`。

## 範例：不用開伺服器，也能驗證書籤

為可重開的部署範例建立 `C:\dev\stackway-lab\production`。存成 `route.html`，在檔案總管用瀏覽器開啟。連結先改位址，瀏覽器的 `hashchange` 事件再觸發畫面更新。初次進入也要主動呼叫同一個函式，否則從頭操作正常，新分頁第一次打開卻會空白。

```html
<!doctype html><html lang="zh-Hant"><meta charset="utf-8">
<title>房間預約</title>
<a href="#/rooms/blue?day=fri">藍房・週五</a>
<a href="#/rooms/blue?day=sat">藍房・週六</a>
<p id="view"></p>
<script>
function render() {
  const fragment = location.hash.slice(1) || "/rooms/blue";
  const [path, query] = fragment.split("?");
  const room = /^\/rooms\/(blue|green)$/.exec(path);
  const day = new URLSearchParams(query).get("day") || "all";
  document.querySelector("#view").textContent = !room ? "找不到房間" :
    ["all", "fri", "sat"].includes(day) ? room[1] + " / " + day : "不支援的日期";
}
addEventListener("hashchange", render);
render();
</script></html>
```

先點週五再點週六，用上一頁應回到 `blue / fri`。把井字號後改成 `/rooms/missing`，應顯示找不到房間。這不是要你重新發明框架，而是用可檢查的最小程式看清楚：連結只表達意圖，畫面一律由同一個解析器產生。套回 React 時不要再維護第二份平行的「目前房間」狀態。

挑選狀態時還有一個簡單準則：如果把這個值拿掉，另一個人會不會看到完全不同的一份清單？房間與日期通常會，所以值得放進網址；滑鼠停在哪個按鈕、下拉選單是否展開則不必。清楚區分這兩類狀態，也能讓瀏覽歷史不要充滿對上一頁毫無幫助的細微動作。

## 常見錯誤

為了讓重整不再出錯，把所有不認得的請求都改回首頁，包括 API 的錯誤。結果收到的不是資料，而是狀態成功的 HTML。之後在[〈Caddy 反向代理〉](#/lesson/fs-production-05-proxy)會細講如何分開處理。網址也會出現在書籤與歷史，不要寫入權杖或未送出的私密欄位；可分享的是畫面選取，不是每一份使用者輸入。

## 小結

驗收路由，用沒走過操作流程的新分頁測一次。手上的連結若能自己說清楚要去哪、怎麼看以及找不到時怎麼辦，導覽才算真正可重現。
