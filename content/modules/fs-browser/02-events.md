---
id: fs-browser-02-events
module: fs-browser
order: 2
title: DOM 事件與表單提交
subtitle: 送出表單後只新增一次
status: ready
minutes: 30
level: 3
prereqs:
  - fs-browser-01-dom
objectives:
  - 區分事件目標與監聽位置
  - 阻止預設提交並保留鍵盤操作
tags:
  - browser
  - events
resources:
  - title: "MDN：表單的 submit 事件"
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-02-events-submit
    prompt: "想讓按按鈕與在輸入欄按 Enter 走同一條新增流程，應監聽什麼？"
    answer: "監聽表單的 submit 事件，把新增寫在同一個處理函式。"
    mcq:
      options:
        - "表單的 submit"
        - "輸入欄的每次 keyup"
        - "文件的每次 click"
        - "輸入欄的每次 change"
      answer: 0
      explain: "送出代表操作意圖；鍵盤與按鈕可以抵達同一條路。"
    interview:
      question: "滑鼠按一下正常，按 Enter 卻換頁；你會怎麼改？"
      points:
        - "綁定 form 的 submit 而非只綁 click"
        - "取消預設提交並處理輸入"
        - "用兩種操作檢查沒有重複新增"
      answer: "我會保留原生表單和提交按鈕，把新增搬到一個 submit 監聽器，先取消導覽。接著用滑鼠和 Enter 各送一筆，檢查資料只增加 2 筆，並移除舊的 click 新增邏輯。"
  - id: fs-browser-02-events-target
    prompt: "事件冒泡到外層時，currentTarget 代表什麼？"
    answer: "代表此刻正在執行監聽器的節點，target 則是事件原本指向的節點。"
    mcq:
      options:
        - "一定是最內層節點"
        - "一定是送出按鈕"
        - "上一個取得焦點的輸入欄"
        - "目前執行監聽器的節點"
      answer: 3
      explain: "監聽位置不一定等於事件來源，冒泡不會讓兩者變成同一概念。"
  - id: fs-browser-02-events-default
    prompt: "preventDefault 在這個 submit 處理函式中阻止什麼？"
    answer: "取消表單預設的提交導覽，不等於阻止事件傳遞或替你驗證所有內容。"
    mcq:
      options:
        - "所有其他監聽器執行"
        - "輸入欄接收鍵盤"
        - "瀏覽器預設提交"
        - "表單產生事件"
      answer: 2
      explain: "取消預設動作後仍需自行決定怎麼更新畫面。"
practice:
  - id: fs-browser-02-events-lab
    title: "做出鍵盤也能使用的收件單"
    kind: code
    minutes: 12
    steps:
      - "在 browser-lab 儲存 entry.html，用按鈕送出一筆，再以 Enter 送出另一筆。"
      - "試送空白，再試著點清單的其中一列，記下頁面下方的事件來源與監聽位置。"
    checks:
      - "2 次有效提交只出現 2 列，空白不新增。"
      - "點列時顯示 LI → UL；按 Enter 後頁面沒有重載。"
---

## 為什麼要學：使用者要的是送出，不是點一下

在待辦清單輸入一行字，手還在鍵盤上，自然會按 Enter。若程式只認得滑鼠點到某個按鈕，鍵盤使用者可能被帶到新頁面，剛加入的資料也沒了。先找出操作代表的意圖，再決定該監聽哪個事件（event），通常比窮舉每種輸入裝置更可靠。

## 核心概念：原本發生在哪裡，現在由誰處理

監聽器（event listener）是事件抵達時才執行的函式。`event.target` 是事件指向的節點，`event.currentTarget` 則是目前執行這個監聽器的節點。許多事件會向外冒泡（bubbling）：點到清單項目，外面的清單也能收到這次點擊。只在外層掛一次監聽器，之後新增的列也能被觀察。

表單的提交（submit）本身是另一個事件，它的目標是表單，不是你剛按的按鈕。瀏覽器原本會根據表單設定提交並導覽；這次只想留在本頁新增一列，所以在提交處呼叫 `preventDefault()`。這不是停止冒泡，也不是叫鍵盤失效，只是由程式接手那個預設動作。

## 範例：留在本頁的收件單

把以下內容存成 `browser-lab/entry.html`，用瀏覽器開啟。輸入欄由標籤包住，按鈕明訂為提交用途，不需要自己攔截 Enter 的按鍵碼。

```html
<!doctype html>
<meta charset="utf-8">
<title>收件單</title>
<form id="entry"><label>項目 <input name="item" required></label>
<button type="submit">加入</button></form>
<ul id="rows"></ul><output id="trace"></output>
<script>
const form = document.querySelector("#entry");
const rows = document.querySelector("#rows");
form.addEventListener("submit", event => {
  event.preventDefault();
  const field = form.elements.namedItem("item");
  const value = field.value.trim();
  if (!value) { field.focus(); return; }
  const row = document.createElement("li");
  row.textContent = value;
  rows.append(row);
  field.value = "";
  field.focus();
});
rows.addEventListener("click", event => {
  document.querySelector("#trace").textContent =
    event.target.tagName + " → " + event.currentTarget.tagName;
});
</script>
```

試著只按空格再送出。原生 `required` 能擋住真正的空欄位，但空格本身仍是字元，所以程式要先去除頭尾空白再判斷。接著在有字的列上點一下，下方顯示的兩個標籤代表不同角色。把這個點擊觀察器拿掉，表單仍應正常新增，因為它沒有負責改變清單。

### 讓 2 種事件各自說一句話

試著預測：游標在輸入欄內按 Enter 時，誰能提供送出的整張表單？答案不是最後一次被滑鼠點到的元素，而是註冊提交監聽器的那張表單。如果以最後點過的地方來猜，鍵盤操作時根本沒有可靠的依據。反過來，清單紀錄想問的是使用者實際點到了哪一列，這時只看監聽位置，答案就永遠是外層清單，失去了想知道的資訊。這兩個案例分別需要不同欄位；要先把問題說完整，再決定取哪個對象。送出後讓焦點回到輸入欄，也是在維持下一次操作的起點，不只是視覺上的整理。

## 常見錯誤

不要同時在按鈕點擊和表單提交裡寫新增。一個手勢可能先產生點擊，再觸發提交；新增兩次不是使用者按太快。也不要以禁用表單預設鍵盤行為來掩蓋重複處理，那會讓另一條正常的操作路徑消失。

## 小結

用提交事件接住意圖，用預設動作控制是否離頁，用目標與監聽位置解釋事件傳遞。最後用滑鼠和鍵盤各走一次，比只測自己習慣的方式更能驗證這份表單。
