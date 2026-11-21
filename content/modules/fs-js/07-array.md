---
id: fs-js-02-array
module: fs-js
order: 7
title: 陣列的轉換與篩選
subtitle: 篩選、映射與累計
status: ready
minutes: 25
level: 2
prereqs:
  - fs-js-03-objects
objectives:
  - 用陣列方法產生新清單
  - 比較轉換前後原資料是否改變
tags:
  - js
  - arrays
resources:
  - title: MDN：陣列的走訪與轉換方法
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-filter-membership
    prompt: 只保留符合條件的紀錄應用哪個方法？
    answer: filter 依回呼的判斷決定保留哪些元素。
    mcq:
      question: 需要留下完整的已完成課程物件，要選什麼？
      options:
        - map 成真假值
        - reduce 成數字
        - join 成字串
        - filter
      answer: 3
      explain: 只有篩選同時保留原元素形狀並可能減少筆數。
    interview:
      question: 如何讓週報在沒有完成任何課的日子仍算得正確？
      points:
        - 先依完成條件篩選
        - 加總給明確起始值
        - 用空結果測試
      answer: 我會讓標題來自篩過的清單、加總從 0 開始，再把所有 done 都設成假跑一次。期望是空清單和 0 分鐘，原始課表仍有 3 筆。
  - id: fs-js-map-shape
    prompt: map 把 2 筆課程映射為標題，結果形狀如何？
    answer: 包含兩個標題值的新陣列，每筆輸入各對應一個輸出。
    mcq:
      question: 2 筆課程經 map(row => row.title) 得到什麼？
      options:
        - 兩個標題的陣列
        - 一個標題字串
        - 兩個真假值
        - 只剩已完成物件
      answer: 0
      explain: 映射按回傳值轉換元素，不自動篩選或合併。
  - id: fs-js-reduce-seed
    prompt: 累計分鐘時為什麼給 reduce 起始值 0？
    answer: 它指定數字起點，也讓空陣列回傳 0。
    mcq:
      question: 空陣列以 0 起始加總，結果為何？
      options:
        - 因為沒有資料而拋出錯誤
        - '0'
        - 空陣列
        - undefined
      answer: 1
      explain: 沒有元素可更新累計值，結果保留起始 0。
  - id: fs-js-filter-alias
    prompt: 篩選後改其中一筆物件屬性，會影響來源嗎？
    answer: 可能會，新的陣列並沒有深層複製裡面的物件。
practice:
  - id: fs-js-b04-07-p1
    title: 做一份可重算的週報
    kind: code
    minutes: 10
    steps:
      - 建立 weekly.js，先核對標題、總數和原始筆數
      - 把全部 done 都改成 false，再算空週報
      - 保留兩組預期值在程式註解
    checks:
      - 一般情境是 DNS、CSS 共 35 分
      - 空週報是 0 分
      - 兩次原始長度都為 3
---

## 把明細做成週報，不要改掉明細

本週清單同時有已完成和待學的課。首頁只想列已完成的標題，週報還要計算這幾堂的總分鐘數。如果直接把原清單裡沒完成的項目刪掉，首頁看起來對了，明天的學習計畫卻少了資料。這次的工作是從一份來源組出幾種答案，不是把來源改成其中一份答案。

## 用輸出的形狀選方法

篩選 (filter) 問每一筆「要留下嗎」，得到可能變短、順序不變的新陣列。映射 (map) 問每一筆「要轉成什麼」，在本課的連續陣列中，每筆輸入對應一筆輸出。歸納 (reduce) 則讓各筆資料輪流更新一個累計值，最後交出一個結果。這三個方法都接受回呼函式 (callback)：你把規則交給方法，方法在走訪元素時替你呼叫，不是要你先執行一次再交出答案。

一個簡單的辨別法是讀變數名字。若你想要「完成課程清單」，每筆仍是課程，先篩；若想要「完成課名清單」，課程要變成字串，再做映射；若只要「總分鐘」，輸出不是清單，改用累計。知道每一步手上的形狀，就不會太早丟掉下一步還需要的分鐘欄位。

## 範例：一份資料，2 個出口

在 `C:\dev\stackway-lab\javascript` 新建 `weekly.js`。在每一步旁註記「筆數是否改變」與「單筆長相是否改變」，用這兩個問題辨認篩選和轉換。

在該目錄的終端機執行 `node weekly.js`；各系統指令相同。

```js
const lessons = [
  { title: "DNS", min: 20, done: true },
  { title: "SQL", min: 30, done: false },
  { title: "CSS", min: 15, done: true },
];
const finished = lessons.filter(row => row.done);
const titles = finished.map(row => row.title);
const total = finished.reduce((sum, row) => sum + row.min, 0);
console.log(titles.join(", "), total);
console.log(lessons.length, finished.length);
```

先手算：第一和第三筆符合，兩個標題依原順序留下，總和是 35。累計函式的第一個參數是上一圈交下來的結果，第二個才是目前這筆。起始值 0 先和 20 相加，再交給下一圈加 15。若今天沒有任何完成項目，從 0 開始的空清單總和仍是 0，不會因為找不到第一筆就失敗。

### 新容器不等於新內容

篩選得到的是另一個陣列，可它裡面的課程仍可能和原陣列指向同一個物件。範例只讀取屬性，所以兩邊都沒改。若回呼裡順手把 `row.done` 改掉，或事後用 finished 裡的物件改標題，原清單也會看見。之後在[〈解構與展開語法〉](#/lesson/fs-js-08-spread)會細講需要隔離修改時該怎麼複製。

看最後一行不應只看成 3 和 2。前 3 筆是整週資料，後 2 筆才是可以顯示的子集合；明天重開首頁時仍要能從原清單找到那一筆未完成課，才符合一開始的使用情境。

## 常見錯誤

用 map 回傳真假值，以為結果只剩符合的項目，實際得到的是一排真假值。另一個錯是省略 reduce 的起始值，讓第一筆物件被當成原本預期的數字。除了看一般日子的週報，也要測「一堂都沒完成」的那一天，這時才看得出空集合的規則有沒有定清楚。

## 小結

先寫下輸出形狀：少幾筆、換內容，還是折成一個值。把原始資料保留在旁邊，週報就能重算，明天的清單也不會憑空少一堂。
