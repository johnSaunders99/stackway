---
id: fs-browser-05-await
module: fs-browser
order: 5
title: async 與 await
subtitle: 等待一筆資料，再決定下一步
status: ready
minutes: 30
level: 3
prereqs:
  - fs-browser-04-promises
objectives:
  - 將一段 Promise 鏈改寫為 async 函式
  - 用 try/catch 捕捉等待時的拒絕並區別平行與依序等待
tags:
  - browser
  - await
resources:
  - title: "MDN：async 函式"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: "MDN：使用 Promise"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-05-await-wrap
    prompt: "async 函式直接 return 一個數字時，呼叫者拿到什麼？"
    answer: "拿到會以該數字履行的 Promise，而非同步取得的數字。"
    mcq:
      options:
        - "原始數字"
        - "計時器編號"
        - "會在稍後直接變成數字的變數"
        - "Promise"
      answer: 3
      explain: "async 改變函式的回傳契約，即使函式內沒有等待也是如此。"
  - id: fs-browser-05-await-caught
    prompt: "要在當地 try/catch 處理拒絕，怎麼使用這份 Promise？"
    answer: "在 try 區塊內 await 它，讓拒絕以拋出錯誤的方式進入 catch。"
    mcq:
      options:
        - "只在 try 內建立而不等待"
        - "只檢查它是否存在"
        - "在 try 內 await"
        - "直接 return 該 Promise，但不在 try 內 await"
      answer: 2
      explain: "排程成功不等於稍後不會拒絕，try 必須包住能觀察到拒絕的位置。"
  - id: fs-browser-05-await-parallel
    prompt: "兩筆獨立查詢都要成功才可顯示，如何讓它們重疊等待？"
    answer: "先發出兩筆，以 Promise.all 收集，再 await 組合結果。"
    mcq:
      options:
        - "等完第一筆才呼叫第二筆"
        - "一起發出，以 Promise.all 等待"
        - "只等第一筆就顯示"
        - "把兩個函式物件放進陣列但不呼叫"
      answer: 1
      explain: "並行要真的啟動工作；傳函式本身不會開始查詢。"
    interview:
      question: "拿到格號才查庫存，還要查一個不相依的時段。哪些能重疊？"
      points:
        - "庫存依賴格號，不能提早使用"
        - "獨立時段可與前段一起開始"
        - "收集需要的結果並處理拒絕"
      answer: "我會保留格號到庫存的先後，把獨立查時段的工作和那條鏈一起交給 Promise.all。都成功才組畫面；其中一筆拒絕就走錯誤畫面，也不假設其餘工作被自動取消。"
  - id: fs-browser-05-await-order
    prompt: "Promise.all 收到的值按什麼順序排列？"
    answer: "全部履行時，值依輸入成員的位置排列；較快完成不會把它移到陣列前面。"
practice:
  - id: fs-browser-05-await-lab
    title: "把組裝標籤的鏈改成可讀的等待順序"
    kind: code
    minutes: 12
    steps:
      - "在 browser-lab 儲存 label.html，比對鏈式與 await 兩種寫法。"
      - "讓 slot 改為拒絕，重新整理並保存顯示失敗的截圖或觀察文字。"
    checks:
      - "兩個版本正常時皆產生 A2 / 上午。"
      - "slot 拒絕時會看到原因，不會把 Promise 物件當成標籤。"
---

## 為什麼要學：流程圖從左到右，程式也能這樣讀

你要印一張取貨標籤，上面是格號與時段。若好幾個步驟都寫成巢狀回呼，看程式的人很難指出哪一步先失敗。非同步函式（async function）讓我們用接近一般敘述的順序安排工作，不用改變上一堂的承諾物件（Promise）契約。

## 核心概念：等待的是這段函式，不是整個頁面

`async` 寫在函式宣告前面；這樣的函式呼叫後總會交回承諾。`await` 放在需要結果的地方：如果作業還沒完成，此函式後半段暫停，把控制權還給呼叫者。等結果確定，履行值成為這個運算式的值；若被拒絕，等待處就像拋出錯誤，可以交給附近的 `try/catch`。

不是看見兩個等待就一定要改成並行。若第二筆的查詢條件就是第一筆的結果，提早送沒有意義；若兩筆互不相依，而且畫面需要兩者，可以先一起發出，再用 `Promise.all` 等整組。回來的陣列按傳入順序排，不按誰先跑完排，這樣才知道哪一欄是格號。

## 範例：保留輸出，換掉流程寫法

存成 `browser-lab/label.html` 並開啟。兩個版本都呼叫相同的假資料來源，便於對照。`pair` 裡的兩個函式呼叫才是真正開始工作，`await` 本身不是開始按鈕。

```html
<!doctype html>
<meta charset="utf-8">
<title>取貨標籤</title><pre id="labels"></pre>
<script>
const later = (v, ms) => new Promise(ok => setTimeout(() => ok(v), ms));
const bin = () => later("A2", 80);
const slot = () => later("上午", 20);
const pair = () => Promise.all([bin(), slot()]);
const chainLabel = () => pair().then(parts => parts.join(" / "));
async function awaitLabel() {
  const parts = await pair();
  return parts.join(" / ");
}
async function draw() {
  const panel = document.querySelector("#labels");
  for (const make of [chainLabel, awaitLabel]) {
    try { panel.textContent += (await make()) + "\n"; }
    catch (error) { panel.textContent += error.message + "\n"; }
  }
}
draw();
</script>
```

先猜哪個時段會印在前面。時段雖然先有值，最後的字串仍是格號在前。想測失敗時，把 `slot` 的函式本體換成 `Promise.reject(new Error("時段未開放"))`。兩個版本都應把拒絕交給畫面的錯誤處理；這是在比改寫前後的行為，不是比誰少打一行字。

### 依賴改變，程式的順序也要改

如果改需求為「每個庫位有各自的取貨時段」，原來的時段查詢就不能在知道庫位之前發出。先取得格號，再把它當成時段查詢的引數，這樣的依序等待才反映真正的資料流。若只是想讓等候的使用者先看到格號，另一個做法是格號回來就先畫，時段回來再補齊，不必假裝兩件事都已經完成。這不是哪個關鍵字一定比較好的問題，而是畫面允許半成品嗎？用一句話寫下每一小塊資訊可以在什麼條件下顯示，通常就能判斷該分別等待還是收齊才顯示。

## 常見錯誤

忘記等待就把函式回傳值接在字串後面，看到的是物件的文字表示，不是未來的值。在 `try` 內只啟動作業卻不等待，稍後的拒絕也不一定由這個 `catch` 接到。另一個誤解是整組拒絕就以為其他工作已停止；收集結果不等於取消，之後的[〈AbortController 取消〉](#/lesson/fs-browser-08-cancel)才會處理停止需求。

## 小結

改寫前後保留相同的輸入、成功值與失敗路徑。能指著程式說出「這行需要上一步」、「那兩筆可以同時開始」，比把每個呼叫都加上等待更重要。
