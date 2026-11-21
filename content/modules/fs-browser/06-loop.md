---
id: fs-browser-06-loop
module: fs-browser
order: 6
title: 事件迴圈與微任務
subtitle: 為三行輸出排出先後順序
status: ready
minutes: 35
level: 3
prereqs:
  - fs-browser-05-await
objectives:
  - 分辨同步堆疊、工作與微任務
  - 手推一段含計時器與已完成 Promise 的輸出
tags:
  - browser
  - loop
resources:
  - title: "MDN：深入理解微任務與事件迴圈"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-06-loop-stack
    prompt: "同步函式還沒返回時，計時器能插進來執行同一頁的 JavaScript 嗎？"
    answer: "不能；目前這段同步工作會先執行到能交回控制權。"
    mcq:
      options:
        - "不能，先跑完目前這段"
        - "能，只要延遲為 0"
        - "能，只要先登記"
        - "能，只要函式夠短"
      answer: 0
      explain: "延遲到期是有資格排工作，不是立即中斷堆疊。"
  - id: fs-browser-06-loop-micro
    prompt: "已履行 Promise 的 then 回呼排到哪裡？"
    answer: "排為微任務，在目前這段同步執行結束後的微任務檢查點處理。"
    mcq:
      options:
        - "目前函式的第一行"
        - "與計時器共用的工作佇列末端"
        - "等到下一次繪製以後才新增的工作"
        - "微任務佇列"
      answer: 3
      explain: "已經有值也不代表 then 回呼會當場執行。"
    interview:
      question: "同一段程式先設計時器，再接已履行的 Promise，誰先留下紀錄？"
      points:
        - "先寫出同步行的順序"
        - "區分微任務與計時器工作"
        - "不要用登記順序當作跨佇列順序"
      answer: "我會先把同步輸出全寫完。then 排到微任務，這輪同步工作結束後先執行；計時器是之後的工作。因此計時器先登記，也不會在這個例子裡搶在 then 前面。"
  - id: fs-browser-06-loop-timer
    prompt: "延遲 0 毫秒的計時器保證什麼？"
    answer: "它安排稍後有機會執行的工作，不保證精準的執行時間。"
    mcq:
      options:
        - "回呼會先於已排入的微任務"
        - "一定在同一毫秒內完成"
        - "不會在目前同步敘述中插隊"
        - "登記時就取得處理器"
      answer: 2
      explain: "瀏覽器要等有機會處理工作，延遲是門檻而非預約時刻。"
practice:
  - id: fs-browser-06-loop-lab
    title: "交出事件迴圈的紙上紀錄"
    kind: code
    minutes: 14
    steps:
      - "建立 order.html，先在旁邊的 order.txt 寫下預測再開啟。"
      - "在 then 的回呼中再加一個 queueMicrotask 記錄 E，重新預測並核對。"
    checks:
      - "原版是 A、D、C、B，修改後是 A、D、C、E、B。"
      - "我能區分哪兩行同步執行，沒有用毫秒數猜微任務先後。"
---

## 為什麼要學：同時都說「稍後」，為什麼還有順序？

按下按鈕時，先設一個不延遲的計時器，再請一個已完成的承諾執行下一步。如果只按程式碼從上讀到下，可能猜計時器先響；如果只看哪個步驟等得最短，也猜不出來。要預測這種輸出，必須分開看正在做的事，以及稍後等在哪裡的事。

## 核心概念：桌上、便條、下一份公文

呼叫堆疊（call stack）記著目前哪個函式正等另一個函式回來。同步呼叫一個函式，就是疊上去；返回則拿掉。瀏覽器的事件迴圈（event loop）讓一份工作（task）有機會開始，例如處理按鈕或計時器。它不能在任意兩行同步程式之間搶走主線去跑另一個計時器。

微任務（microtask）是另一種等待方式。已履行的承諾登記成功處理時，處理函式會排成微任務，不會立即擠進呼叫堆疊。這個例子裡，目前腳本跑完後，瀏覽器會先處理微任務到佇列清空，再有機會開始計時器的工作。如果微任務又排了微任務，也要把它考慮進去。

## 範例：先蓋住畫面，自己排一次

在 `browser-lab` 建立 `order.html`，存好後先不要開。拿紙畫三欄，分別寫「同步輸出」、「微任務」、「計時器工作」，每讀一行只把該放的記號放到一欄。

```html
<!doctype html>
<meta charset="utf-8">
<title>先後紀錄</title><pre id="order"></pre>
<script>
const out = document.querySelector("#order");
const mark = x => { out.textContent += x + "\n"; };
mark("A");
setTimeout(() => mark("B"), 0);
Promise.resolve().then(() => mark("C"));
mark("D");
</script>
```

開啟頁面核對。當你讀到最後一行同步程式，紙上已經真的輸出 2 個記號，另外兩欄只是待辦。現在才輪到微任務欄留下它的字，然後計時器的工作才補上最後的字。若將兩行登記的敘述對調，仍應得到一樣的順序；這是用一個小改動區分「依登記順序」和「依排程位置」兩種解釋。

### 不靠時鐘辨別 2 種排法

先問手上的記號有沒有真正落到紙上。呼叫同步函式就立刻留下字；把一個函式交給計時器，留下的只是「稍後要做」的便條。若在微任務裡追加新的微任務，新的便條不是放回同步欄，也不是變成計時器工作，而是排在已經等候的微任務後面。用這個規則就能預測練習裡新增的那個記號。不要再加一個計時器去讀螢幕上的時間當裁判：數字即使一樣，也不能說明兩個步驟在相同位置執行，更不代表瀏覽器在中間一定畫過一幀。

## 常見錯誤

設定 0 毫秒不是向瀏覽器索取精準的時鐘。若主線還在跑大量計算，時間到了也無法插隊；把計算包進承諾的成功處理也不會自動搬到背景執行。更不要讓微任務無限產生新的微任務，否則後面的使用者操作可能一直得不到機會。

## 小結

手推並不是記口訣，而是替每個動作找到隊伍。先標出哪一行真的印字、哪一行只登記工作，再劃掉已完成的項目；同樣的方法也能用來解釋上一堂等待之後的畫面更新。
