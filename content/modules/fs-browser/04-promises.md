---
id: fs-browser-04-promises
module: fs-browser
order: 4
title: Promise 與錯誤傳遞
subtitle: 前一步失敗，不該繼續顯示成功
status: ready
minutes: 30
level: 3
prereqs:
  - fs-browser-03-callbacks
objectives:
  - 用 then 串接兩個工作並回傳下游 Promise
  - 比較 resolve、reject 與 catch 的執行路徑
tags:
  - browser
  - promises
resources:
  - title: "MDN：使用 Promise"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-04-promises-state
    prompt: "一個等待中的 Promise 若成功確定結果或回報失敗，會落在哪種狀態？"
    answer: "可能履行並帶值，或拒絕並帶原因；一旦確定就不再變更。"
    mcq:
      options:
        - "可以在履行與拒絕之間反覆切換"
        - "每增加一個 then 就回到等待"
        - "履行或拒絕"
        - "必須有人呼叫 then 才會結束等待"
      answer: 2
      explain: "同一個承諾只確定一次；接多個處理函式不會改寫原本的結果。"
  - id: fs-browser-04-promises-chain
    prompt: "then 內啟動第二個非同步工作，怎麼讓下一步等它？"
    answer: "回傳第二個工作的 Promise，讓鏈上的下一步跟隨它的結果。"
    mcq:
      options:
        - "只呼叫但不回傳"
        - "回傳該 Promise"
        - "將啟動第二步的函式本身回傳"
        - "回傳計時器的毫秒數"
      answer: 1
      explain: "下一個 then 只跟隨上一段回傳的值或承諾，不會猜有哪些工作被啟動。"
    interview:
      question: "畫面先顯示已入庫，稍後卻發現入庫失敗。你會查哪一條鏈？"
      points:
        - "第二步是否回傳 Promise"
        - "成功顯示是否接在第二步之後"
        - "拒絕是否能傳到同一個錯誤出口"
      answer: "我會追到取得品號的 then，確認它回傳入庫工作的 Promise。成功畫面只接在入庫之後，然後故意讓入庫拒絕，檢查畫面只顯示失敗，不留下已入庫。"
  - id: fs-browser-04-promises-reject
    prompt: "鏈中一段拒絕，後面的成功處理會怎樣？"
    answer: "沒有在中途恢復時，會跳過成功處理，把拒絕傳往後面的拒絕處理。"
    mcq:
      options:
        - "跳過並往後尋找拒絕處理"
        - "同步重新執行所有步驟"
        - "自動轉成空字串成功"
        - "先顯示成功再處理拒絕"
      answer: 0
      explain: "catch 處理到它的拒絕；若它正常回傳，後續鏈可再次履行。"
practice:
  - id: fs-browser-04-promises-lab
    title: "留一份成功與失敗都可重跑的入庫頁"
    kind: code
    minutes: 12
    steps:
      - "建立 stock.html，分別按正常品號與未知品號。"
      - "替入庫成功訊息加入實際品號，保留可觸發兩種路徑的按鈕。"
    checks:
      - "正常品號得到 A2 的成功訊息。"
      - "未知品號只顯示拒絕原因，不會顯示已入庫。"
---

## 為什麼要學：拿到品號不代表已經入庫

先掃描條碼拿到品號，再去貨架登記入庫。這是兩個各自可能花時間的工作。如果掃描完成就向使用者報喜，工具有可能一邊顯示成功，一邊才發現品號不在貨架名單。這堂要把「前一步完成」變成「下一步現在有資格開始」，而不是把所有事情一口氣呼叫完。

## 核心概念：每一段都交出它的結果

承諾物件（Promise）代表一次作業未來的結果，起初可能仍在等待（pending）；若作業確定結果，就會履行（fulfilled）或拒絕（rejected），但沒有保證每份承諾都會結束等待。本例傳給 `resolve` 的是普通字串，因此會以該值履行；`reject` 則帶出失敗原因。它不是反覆送出多個值的管道，已確定結果後不會再變成另一種結果。

`then` 登記成功後要執行的動作，並回傳新的承諾。動作回傳普通值，下一段就收到那個值；動作回傳另一個承諾，下一段會等它確定。中途拋出錯誤也會讓新承諾拒絕。`catch` 是接拒絕的出口，不需要替每一步各寫一套畫面錯誤處理。

## 範例：2 張按鈕走同一條入庫流程

把下列內容存成 `browser-lab/stock.html` 並開啟。先按一個按鈕，等結果出來再試另一個；這堂只追單次操作。多次操作互相超車，之後在[〈請求競爭與過期回應〉](#/lesson/fs-browser-04-race)會細講。

```html
<!doctype html>
<meta charset="utf-8">
<title>入庫</title>
<button data-code="A2">正常品號</button>
<button data-code="Z9">未知品號</button>
<output id="msg"></output>
<script>
const msg = document.querySelector("#msg");
function stock(code) {
  return new Promise((resolve, reject) => setTimeout(() => {
    if (code === "A2") resolve(code);
    else reject(new Error("找不到貨架"));
  }, 150));
}
for (const button of document.querySelectorAll("button")) {
  button.onclick = () => {
    msg.textContent = "處理中";
    Promise.resolve(button.dataset.code)
      .then(code => { return stock(code); })
      .then(code => { msg.textContent = code + " 已入庫"; })
      .catch(error => { msg.textContent = error.message; });
  };
}
</script>
```

用手指沿著未知品號走一次。取得它本身是成功的，所以會進入第一個成功處理；真正拒絕的是入庫。因為第一段回傳入庫承諾，拒絕會沿著同一條鏈跳過「已入庫」，到最後才轉成給使用者看的文字。錯不在第一步，畫面卻仍只需要一個能理解的失敗出口。

### 把「誰履行了」問完整

成功處理自己也可能做出錯誤判斷。例如品號有值，但庫位名稱拼錯，這時問題是在入庫步驟，不必把掃描也說成失敗。反過來，假如掃描就找不到品號，那麼連入庫工作都不該啟動。你可以先寫兩行預測：掃描失敗時會經過哪些站，入庫失敗時又會經過哪些站。兩條路都能抵達同一個錯誤出口，卻不會留下同樣數目的已完成工作。這是串接比在每段工作末尾自行更新畫面更清楚的地方：每一站只交代自己的結果，最後才決定如何向使用者解釋。

## 常見錯誤

把有大括號的箭頭函式寫成只呼叫 `stock(code)` 而沒有 `return`，這段就回傳 `undefined`，接下來並沒有等入庫，後段的捕捉也接不到那份獨立承諾的拒絕。另外，錯誤出口若正常回傳，就代表這一段已處理；還想讓更外層知道失敗，就要重新拋出，而不是只印訊息。

## 小結

每一段只問兩件事：它等什麼，以及它交出什麼。讓成功文字依賴真正完成的最後一步，再用可重現的失敗輸入確認成功路徑確實被跳過。
