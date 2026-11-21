---
id: fs-browser-01-dom
module: fs-browser
order: 1
title: DOM 節點與文字內容
subtitle: 把陣列變成畫面上的項目
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 以 DOM 方法建立文字節點
  - 依資料量核對清單數目
tags:
  - browser
  - dom
resources:
  - title: "MDN：操作文件中的節點"
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-01-dom-tree
    prompt: "畫面上的清單改變，原本的 HTML 檔也會跟著改寫嗎？"
    answer: "不會。JavaScript 改的是這次載入後的文件物件模型。"
    mcq:
      options:
        - "直接改寫 HTML 檔"
        - "一定也修改資料陣列"
        - "一定會保存到下次開啟"
        - "只改記憶體裡的 DOM"
      answer: 3
      explain: "檔案、資料模型與畫面是不同東西，更新其中之一不會自動同步其他兩者。"
  - id: fs-browser-01-dom-literal
    prompt: "想把含角括號的品名原樣顯示，該怎麼做？"
    answer: "設定節點的 textContent，讓內容依文字而非 HTML 處理。"
    mcq:
      options:
        - "交給 innerHTML 解析"
        - "拼到 HTML 標籤後面"
        - "指定 textContent"
        - "把字串當成選擇器"
      answer: 2
      explain: "要保留原文就不要請瀏覽器把字串解讀成標記。"
  - id: fs-browser-01-dom-attach
    prompt: "createElement 已回傳 li，為什麼頁面上還沒有項目？"
    answer: "建立節點不會自動接到文件；還要把它加入清單。"
    mcq:
      options:
        - "li 必須有 id 才可見"
        - "它尚未接到頁面樹上"
        - "瀏覽器要重新整理才會顯示新節點"
        - "新元素必須先設定 CSS 才可見"
      answer: 1
      explain: "建好物件和把物件接進文件是兩步。"
  - id: fs-browser-01-dom-redraw
    prompt: "同一份資料畫兩次時，如何避免項目變成 2 倍？"
    answer: "重畫整份清單時先取代舊子節點，或逐一更新既有項目；不能只追加。"
    interview:
      question: "清單第一次正確，按重新整理清單後卻多了 1 倍。怎麼縮小問題範圍？"
      points:
        - "先比陣列長度與子元素數"
        - "用相同資料連續重畫"
        - "修正重畫策略而非任意刪除資料"
      answer: "我會先記下資料筆數，再用同一個陣列呼叫兩次繪製。如果陣列沒變、畫面卻加倍，就先看有沒有只 append 而未處理舊節點。修正後同一份資料畫兩次也該一樣。"
practice:
  - id: fs-browser-01-dom-lab
    title: "做一張能重畫的材料清單"
    kind: code
    minutes: 10
    steps:
      - "建立 list.html，加入含有角括號的第三個品名。"
      - "維持連續繪製兩次，將畫面與計數保留在練習檔。"
    checks:
      - "畫面是 3 列，不是 6 列。"
      - "角括號可見；元素檢查器中沒有因品名而多出標記。"
---

## 為什麼要學：清單有幾列，應該由資料決定

假設工具箱有 2 格，資料陣列也有 2 筆。若 HTML 裡另外手寫兩列，拿掉一格時得記得改兩處。這堂要把陣列當成來源，讓程式建出剛剛好的列數。你不必學框架，先看瀏覽器如何把一個字串變成真的畫面。

## 核心概念：先找到家，再把節點接上去

瀏覽器讀入 HTML，會建立文件物件模型（Document Object Model，DOM）。它是一棵節點（node）組成的樹：清單是元素，清單項目也是元素，項目中的文字則可以是文字節點。JavaScript 拿到的是樹上的物件，不是一整張畫面的圖片，所以能只改其中一個地方。

`querySelector` 用選擇器尋找第一個相符的元素，井字號表示依識別名稱查找。`createElement` 建立元素，但此時它尚未接到樹上。指定 `textContent` 會把內容當純文字放入元素；`append` 才把這一列接到指定的父元素。這裡保留字串的原樣正是需求，不是渲染功能不足。

## 範例：把資料畫到一個空清單

在 `C:\dev\stackway-lab` 建立 `browser-lab`，把下面整份內容存成 `list.html`，用 Edge 或 Chrome 開啟。程式放在清單後面，所以執行時已經有清單可找。

```html
<!doctype html>
<meta charset="utf-8">
<title>材料清單</title>
<ul id="parts"></ul><output id="count"></output>
<script>
const items = ["紙膠帶", "<small>木板</small>"];
const list = document.querySelector("#parts");
function render(rows) {
  list.replaceChildren();
  for (const name of rows) {
    const li = document.createElement("li");
    li.textContent = name;
    list.append(li);
  }
  document.querySelector("#count").textContent =
    rows.length + " 筆資料，" + list.children.length + " 個項目";
}
render(items);
render(items);
</script>
```

最後兩行是刻意的檢查，不是手誤。第一次呼叫從空清單開始；第二次雖然畫面上已有資料，仍要得到同樣結果。實際比對的兩個數字一個來自陣列，一個來自清單目前的子元素。若只把兩處都寫成陣列長度，數字即使一致也證明不了畫對了。

### 明明筆數一致，怎麼還可能畫錯？

想像有三種材料，其中兩個名稱相同。只確認每個品名「出現過」，沒辦法看出是不是偷偷少了一列；只確認總數，又看不出順序是否顛倒。這裡的契約其實是陣列的每個位置都對應到一列。因此可以在元素面板展開清單，從上到下比對第一筆、最後一筆和重複品名的兩個位置。再試著用空陣列重畫，畫面應連原本的列都不剩，而不是因為迴圈沒有進入就留下舊菜單。這也解釋為什麼清除舊子節點要放在走訪之前，而不是放在每次建立新列的那一行裡。

## 常見錯誤

有人把程式搬到檔案開頭，結果找不到元素；這時不是陣列空了，而是執行得比清單出現還早。也別為了少寫幾行，把品名拼成 HTML 再塞回頁面，那會讓資料中的角括號取得不同意義。從編輯器改檔後要存檔並重新整理；反過來，在瀏覽器的元素面板改字，只改這一次的樹，不會寫回檔案。

先在原始頁面找文字，再在開發者工具看更新後的節點；改動出現在記憶體中的文件樹，不表示磁碟上的網頁檔也被寫回。

## 小結

資料決定要畫哪些列，文件物件決定列放在哪裡。用空清單、含特殊字元的一列與重畫兩次來測，比只看第一次有沒有字更容易發現問題。
