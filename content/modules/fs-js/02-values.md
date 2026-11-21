---
id: fs-js-01-values
module: fs-js
order: 2
title: 型別、參照與嚴格相等
subtitle: 看出值與參照的差別
status: ready
minutes: 25
level: 2
prereqs:
  - fs-js-01-variables
objectives:
  - 預測基本型別與物件複製後的結果
  - 用嚴格相等比對空值
tags:
  - js
  - equality
resources:
  - title: MDN：嚴格相等
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-object-identity
    prompt: 兩個欄位完全相同的物件，嚴格相等一定為真嗎？
    answer: 不一定；物件要指向同一個實體才會嚴格相等。
    mcq:
      question: 哪個比較為真？
      options:
        - 分別建立兩個空物件後比較
        - 比較數字 0 和字串 0
        - 把同一個物件指定給兩個名字後比較兩者
        - 比較 null 和 undefined
      answer: 2
      explain: 嚴格比較不代轉型別，物件也不逐欄比內容。
    interview:
      question: 為什麼把一張草稿卡指定給另一個名字，不算備份？
      points:
        - 複製的是參照
        - 兩個名字共用物件
        - 用修改後的可觀察結果佐證
      answer: 我會先改副本的一個屬性，再從原名字讀回。兩邊都變表示我們手上是同一張卡的參照；要隔離修改得另外建立需要更動的資料。
  - id: fs-js-primitive-copy
    prompt: 複製數字後替新名字指定不同數字，原名字如何變化？
    answer: 不變；重新指定只更新左側名字的繫結。
    mcq:
      question: let a = 2; let b = a; b = 5; 此時 a 是多少？
      options:
        - '5'
        - undefined
        - 'null'
        - '2'
      answer: 3
      explain: 指定 b 的新值沒有寫到 a。
  - id: fs-js-missing-strict
    prompt: 讀不到普通物件的屬性，能用嚴格相等當成 null 嗎？
    answer: 不存在的屬性讀到 undefined，與 null 嚴格比較為假。
practice:
  - id: fs-js-b04-02-p1
    title: 交一張值與身分的箭頭圖
    kind: code
    minutes: 10
    steps:
      - 建立 copies.js 並記下三行輸出
      - 畫 minutes 與 draftMinutes 的值，以及 saved 和 draft 指向的物件
      - 新增一個全新同標題物件並測相等
    checks:
      - 兩個分鐘數分別是 20 和 30
      - 共用物件比較為真
      - 新物件即使同標題也為假
---

## 備份了一份草稿，為什麼原稿也變了？

你把尚未送出的課程卡指定給另一個名字，打算只改副本的標題。畫面一更新，原稿也跟著改。偏偏之前複製分鐘數就沒有這個問題。要預測結果，不是去猜資料大不大，而是看等號右側的值是基本值，還是指向某個物件的參照。

## 等號傳值，嚴格相等拿來比較

基本型別 (primitive type) 的例子有數字、字串及布林值。把一個數字指定給另一個變數，兩個名字起初有相同的值；後來替第二個名字指定新的數字，不會把第一個名字一起換掉。物件 (object) 則有身分。變數裡握著的是參照 (reference)，把這個值指定給另一個名字，複製的是參照，沒有自動複製物件內容。

嚴格相等 (strict equality) 用三個等號 `===` 表示，不會為了比較而先把字串轉成數字。兩個一般數字可按值比較；比兩個物件時，則問兩邊是否指向同一個物件。兩張紙正好印著同一句話，不代表它們是同一張紙。反過來，兩個人指同一張紙，就算紙上的字剛改過，兩根手指還是指向同一張。

## 範例：追蹤數字、卡片與缺值

把兩個名稱畫成箭頭。改一處卻有兩個地方一起變時，先查箭頭是否原本就指向同一個物件。把下面的範例存成 `C:\dev\stackway-lab\javascript` 裡的 `copies.js`。

在該目錄的終端機執行 `node copies.js`；各系統指令相同。

```js
let minutes = 20;
let draftMinutes = minutes;
draftMinutes = 30;
const saved = { title: "SQL" };
const draft = saved;
draft.title = "DNS";
console.log(minutes, draftMinutes, saved.title);
console.log(saved === draft, saved === { title: "DNS" });
console.log(0 === "0", null === undefined, saved.note === undefined);
```

第一行結果裡分鐘數各走各的，標題卻讀到改後的內容。第二行特地另外造一個欄位值相同的物件：大括號每執行一次，就產生新的物件，所以這個比較為假。不要靠終端機是否把兩個物件印得一模一樣來判斷它們的身分；觀察指定的方向或直接測試相等比較更明確。

最後一行是三個不同的比較。數字 0 和字串 0 不是同一型別。`null` 常用來明確表示這裡沒有值；`undefined` 則是讀取不存在的普通物件屬性時得到的值。它們都可表達缺值，但嚴格比較不會把其中一個當成另一個。如果需求是「兩種都算缺」，就要照需求涵蓋兩者；之後在[〈空值與物件預設值〉](#/lesson/fs-js-03-objects)會練更簡潔的寫法。

實際追錯時，把修改前後的標題字串各印一次，比只印整個物件容易判讀。你保留的是當時讀到的文字；就算稍後又換標題，也不會回頭改變上一行已取出的字串。

## 常見錯誤

用 `=` 寫條件，本來要問「是不是同一個」，結果卻指定了新值。另一個陷阱是把「重新指定」和「改屬性」混成一個動作。如果把可重綁的副本名字改指新卡，那只是換了手指的方向；真正會被原稿看見的是沿著共享的參照去改原物件的欄位。

## 小結

畫兩行名字和箭頭，先算出物件有幾個，再看修改對準哪裡。要比較缺值則先問清楚資料契約：只判斷明確的空，還是也接受沒有提供的欄位？
