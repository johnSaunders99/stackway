---
id: fs-browser-08-cancel
module: fs-browser
order: 8
title: AbortController 取消
subtitle: 離開畫面就停止舊請求
status: ready
minutes: 30
level: 3
prereqs:
  - fs-browser-03-fetch
objectives:
  - 傳入 signal 並在取消後辨認拒絕原因
  - 區分使用者取消與應呈現的伺服器錯誤
tags:
  - browser
  - cancel
resources:
  - title: "MDN：AbortSignal 與取消作業"
    url: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: "MDN：使用 Fetch API"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-08-cancel-signal
    prompt: "要讓呼叫端稍後能取消工作，fetch 選項應放入什麼？"
    answer: "傳入 signal 讓作業訂閱取消，擁有 controller 的程式負責發出命令。"
    mcq:
      options:
        - "abort() 的回傳值"
        - "一個布林值 true"
        - "signal"
        - "controller 本身"
      answer: 2
      explain: "控制者和觀察訊號的人是不同角色；傳布林值沒有後續通知。"
  - id: fs-browser-08-cancel-once
    prompt: "取消一筆請求後，要重新讀取應如何使用控制器？"
    answer: "替新一筆工作建立新的控制器；舊訊號已永久處於取消狀態。"
    mcq:
      options:
        - "把 aborted 指定為 false"
        - "建立新的控制器"
        - "等待舊訊號自動重設"
        - "重用同一個已取消的訊號"
      answer: 1
      explain: "取消是單向狀態，不是能反覆切換的暫停鍵。"
  - id: fs-browser-08-cancel-intent
    prompt: "預設 abort() 導致讀取被拒絕，畫面應怎麼區分？"
    answer: "對預設取消辨認 AbortError；有回應但狀態失敗仍走 HTTP 分支。"
    mcq:
      options:
        - "呈現已取消而非服務故障"
        - "將所有錯誤一律隱藏"
        - "一律顯示 HTTP 500"
        - "把取消當成成功的空結果"
      answer: 0
      explain: "使用者取消、HTTP 回應與其他讀取失敗各有不同含義。"
    interview:
      question: "使用者離開查詢後紀錄出現錯誤，怎麼判斷是否需要告警？"
      points:
        - "辨認本次的取消訊號與原因"
        - "保留真實 HTTP 或讀取失敗"
        - "不宣稱伺服器已回復狀態"
      answer: "我會把本地預期的取消和實際失敗分開記。這頁用預設 abort，所以可辨認 AbortError；真正的 HTTP 錯誤照樣顯示。取消讀取不保證對方已經停止處理，更不是撤銷交易。"
  - id: fs-browser-08-cancel-remote
    prompt: "瀏覽器取消讀取，等於撤銷服務端已經做過的事嗎？"
    answer: "不等於。取消通知針對本地仍在進行的作業；遠端是否已執行、是否能撤銷，另有契約。"
practice:
  - id: fs-browser-08-cancel-lab
    title: "驗證能立刻取消，也能重新讀取"
    kind: code
    minutes: 12
    steps:
      - "在 fetch-lab 建立 cancel.html，保留 bins.json 並啟動正文指定的本機服務。"
      - "按立即取消、正常讀取，再將資料檔暫時改名測試缺檔。"
    checks:
      - "立即取消必定顯示已取消；下一次正常讀取會成功。"
      - "缺檔時仍看得到 HTTP 404。"
---

## 為什麼要學：不用的查詢不必繼續等

如果使用者關閉搜尋面板，前一次查詢即使最後成功也沒人要看了。最直覺的做法是把面板藏起來，但這不會告訴讀取程式停止。取消控制器（AbortController）可以把「這份工作不再需要」傳給願意配合的作業，讓程式也能分清楚使用者改變主意與服務本身失敗。

## 核心概念：一個人下令，工作觀察訊號

每次建立控制器，都會有一個取消訊號（AbortSignal）。把 `controller.signal` 放進 `fetch` 的選項，保留控制器給負責這次生命週期的程式。呼叫無參數的 `abort()` 會將訊號標為已取消；尚未完成的讀取通常以名為 `AbortError` 的原因拒絕。若作業早已完成，取消不會讓已產生的結果倒帶。

這是一次性的通知，不是可開關的旗標。重試要拿新的控制器；沿用舊訊號只會讓新工作從一開始就處於取消狀態。另外，訊號也可以帶自訂原因，這堂刻意只用預設原因，所以錯誤判斷有明確前提，不把所有例外都叫作取消。

## 範例：不用拼手速就能看到取消分支

使用上堂的 `fetch-lab` 與含有有效陣列的 `bins.json`，同層新增 `cancel.html`。從此目錄執行 `py -m http.server 8765 --bind 127.0.0.1`（其他系統用 `python3` 取代 `py`），開啟 `http://127.0.0.1:8765/cancel.html`。若服務仍在運作，不用重開。

```html
<!doctype html>
<meta charset="utf-8">
<title>取消查詢</title>
<button id="read">正常讀取</button><button id="stop">送出並立即取消</button><output></output>
<script>
const out = document.querySelector("output");
async function run(cancelNow) {
  const ctl = new AbortController();
  for (const b of document.querySelectorAll("button")) b.disabled = true;
  try {
    const pending = fetch("bins.json", {signal: ctl.signal, cache: "no-store"});
    if (cancelNow) ctl.abort();
    const res = await pending;
    if (!res.ok) throw new Error("HTTP " + res.status);
    const rows = await res.json();
    out.textContent = "已讀取 " + rows.length + " 筆";
  } catch (err) {
    out.textContent = err.name === "AbortError" ? "已取消" : err.message;
  } finally {
    for (const b of document.querySelectorAll("button")) b.disabled = false;
  }
}
document.querySelector("#read").onclick = () => run(false);
document.querySelector("#stop").onclick = () => run(true);
</script>
```

立即取消按鈕會在同一段同步程式中先送再取消，所以測試不仰賴本機檔案載入得夠慢。實際面板可以把控制器留在面板範圍，關閉面板時再呼叫取消。請注意，若回應標頭已到而內容還沒讀完，讀取內容也可能被中止，錯誤處理要能涵蓋這兩段。

### 想像面板真的有關閉按鈕

畫一條從開啟面板、開始讀取、關閉面板到下次重開的時間線。控制器應該跟著這次開啟的工作，而不是永遠掛在整個網站上。第一次關閉發出的通知只該影響第一筆，第二次開啟時拿到一個乾淨的新訊號。若兩個互不相關的面板共用控制器，關掉左邊可能把右邊的工作也停了；反之，如果一個畫面內的多筆讀取全部屬於同一次操作，刻意共用訊號才有意義。命名與保存控制器前，先把「誰有權一次停止哪些工作」說清楚。

## 常見錯誤

用空白的錯誤處理把所有問題都吃掉，取消看似正常，卻連資料檔不存在都不報。另一個誤會是取消等於回收遠端已做的變更；瀏覽器停止等待，不代表伺服器尚未處理請求。若真正的要求是「只有最新搜尋能上畫面」，下一堂[〈請求競爭與過期回應〉](#/lesson/fs-browser-04-race)還需要檢查結果的身分。

## 小結

把控制器交給知道何時不再需要結果的人，把訊號交給執行中的作業。用一次立即取消與一次正常重試來檢查生命週期，再用缺檔確認真正的錯誤沒有一起被藏掉。
