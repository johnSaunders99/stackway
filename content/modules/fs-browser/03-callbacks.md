---
id: fs-browser-03-callbacks
module: fs-browser
order: 3
title: 回呼與非同步結果
subtitle: 呼叫結束，結果還沒送回來
status: ready
minutes: 25
level: 3
prereqs:
  - fs-browser-02-events
objectives:
  - 以回呼接收模擬的延遲結果
  - 指出在外層直接回傳結果為何來不及
tags:
  - browser
  - callbacks
resources:
  - title: "MDN：回呼函式"
    url: https://developer.mozilla.org/en-US/docs/Glossary/Callback_function
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-03-callbacks-function
    prompt: "把接收結果的函式交給稍後的工作，該傳什麼？"
    answer: "傳函式本身；加括號是現在就呼叫，交出去的是回傳值。"
    mcq:
      options:
        - "呼叫函式後的結果"
        - "函式本身"
        - "尚未填入品名的外層變數"
        - "setTimeout 傳回的計時器識別碼"
      answer: 1
      explain: "延遲工作需要到時才能呼叫的對象，而非現在算好的值。"
  - id: fs-browser-03-callbacks-return
    prompt: "計時器裡的 return 會把結果交回已經結束的外層函式嗎？"
    answer: "不會。return 只離開當下這次函式呼叫，結果要經由約好的回呼傳出。"
    mcq:
      options:
        - "不會，它只結束這次回呼"
        - "會，只要延遲夠短"
        - "會，只要變數在外層"
        - "會，只要按鈕沒有再按"
      answer: 0
      explain: "外層這次呼叫已返回，回呼不能倒回那個時間點。"
    interview:
      question: "同事把查詢結果寫進區域變數，函式卻一直回傳空值。你會如何重排？"
      points:
        - "先確認外層何時返回"
        - "在完成回呼中使用結果"
        - "用可預期的順序驗證"
      answer: "我會在排程前、函式回來後和回呼裡各留一行紀錄。如果結果最後才到，就把需要結果的畫面更新交給回呼，不讓呼叫端同步讀一個尚未填好的變數。"
  - id: fs-browser-03-callbacks-timing
    prompt: "只要是回呼就一定稍後才執行嗎？"
    answer: "不一定。回呼是接收函式的寫法，執行時機由接收方的契約決定。"
    mcq:
      options:
        - "一定會在下一秒執行"
        - "一定在另一個行程執行"
        - "一定會先執行再交給接收方"
        - "不一定，要看接收方"
      answer: 3
      explain: "陣列的同步走訪也使用回呼；傳入函式不代表排程方式。"
practice:
  - id: fs-browser-03-callbacks-lab
    title: "留下能解釋時序的小頁面"
    kind: code
    minutes: 10
    steps:
      - "儲存 pickup.html 並開啟，將自己預測的三行順序寫在檔案註解中。"
      - "把延遲改成 0 後重新整理，比對先後，再將完成訊息加上品項。"
    checks:
      - "開始、已交件、領到物件依序出現。"
      - "把延遲改成 0，外層訊息仍早於領件訊息。"
---

## 為什麼要學：拿到取件通知，再拆包裹

假設倉庫要查一個格子的品項。交出格號時可以立刻印「已交件」，不能立刻印出還沒找到的品名。寫同步函式時很習慣用回傳值把結果送回上一層；遇到延遲，與其先塞一個空字串等它神奇地更新，不如把「找到之後請做這件事」一起交出去。

## 核心概念：交出動作，不是先執行動作

回呼（callback）是由你提供、由對方呼叫的函式。寫 `show` 是交出函式本身；寫 `show()` 是現在就執行，再把它的結果交出去。同步（synchronous）與非同步（asynchronous）說的是時機，不是語法：走訪陣列時傳入的回呼可以當場執行，計時器的回呼則是安排到稍後執行。

這裡約定 `lookup` 接受格號與一個接收品名的函式。它的責任是啟動查詢，沒有承諾在返回時提供品名。`setTimeout` 排好計時就返回，不會把整個頁面暫停。內側函式仍能使用建立時可見的格號與回呼，即使外層呼叫已經結束；這種保留可見變數的行為叫閉包（closure）。

## 範例：一張會留下先後順序的取件單

在練習區的 `browser-lab` 建立 `pickup.html`，用瀏覽器開啟。`pre` 會保留換行，讓早到與晚到的消息留在同一張單子上。

```html
<!doctype html>
<meta charset="utf-8">
<title>取件單</title><pre id="receipt"></pre>
<script>
const receipt = document.querySelector("#receipt");
function line(text) { receipt.textContent += text + "\n"; }
function lookup(bin, receive) {
  setTimeout(() => receive(bin + "：紙膠帶"), 300);
}
line("開始");
lookup("A2", item => line("領到 " + item));
line("已交件");
</script>
```

先用手指追一次：第一行先寫「開始」，接著安排一個工作；安排完成並不會跳進 `receive`，所以外層接著寫「已交件」。最後才使用先前傳入的函式寫品名。即使把等待設成 0，計時器仍不會插隊打斷目前這段程式；至於瀏覽器如何決定下一個工作，之後在[〈事件迴圈與微任務〉](#/lesson/fs-browser-06-loop)會細講。

### 如果查詢有時很快呢？

同一間倉庫可能剛好記得上次找過的品項，立刻就有答案。那也不表示呼叫端應自行推測這次會不會延遲。你可以約定無論快慢都用接收函式交付結果，讓需要品名的程式只寫在一個位置。試著拿紙畫出兩條線：一條是交件者繼續做自己的下一件事，另一條是倉庫找到資料後通知交件者。兩條線的交會點是通知本身，而不是某個預設秒數。若把更新畫面的敘述移到交會點之前，即使偶爾碰巧顯示正確，也沒有可以依靠的因果關係。

## 常見錯誤

若在計時器回呼裡寫 `return item`，它回到的是這次回呼的呼叫位置，不是幾 100 毫秒前的那個呼叫者。用固定秒數猜資料何時會好也不可靠；這次剛好夠等，不代表下次一樣快。把動作接到完成通知上，程式就不需要猜。

## 小結

看非同步程式時，先在紙上分成「現在就做」與「完成後才做」兩欄。有結果才合法的操作全部放到後者。下一堂[〈Promise 與錯誤傳遞〉](#/lesson/fs-browser-04-promises)會用 Promise 表達相同承諾，也讓多步工作的失敗有一條清楚的路可走。
