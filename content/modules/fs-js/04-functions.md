---
id: fs-js-04-functions
module: fs-js
order: 4
title: 函式與箭頭函式
subtitle: 同樣的計算換一種寫法
status: ready
minutes: 30
level: 2
prereqs:
  - fs-js-03-flow
objectives:
  - 將有參數與回傳值的函式改寫為箭頭函式
  - 比較區塊函式體與單一運算式的回傳行為
tags:
  - js
  - functions
resources:
  - title: MDN：JavaScript 函式
    url: https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Guide/Functions
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-return-vs-log
    prompt: 印出答案與回傳答案差別在哪裡？
    answer: 列印讓人看見訊息；return 把值交給呼叫端繼續使用。
    mcq:
      question: 已算好 difference，下列哪一行讓呼叫端取得這個數字？
      options:
        - return difference;
        - console.log(difference);
        - difference;
        - return console.log(difference);
      answer: 0
      explain: 計算或印出不等於交回；最後一個選項交回的是列印動作的結果，不是差額。
    interview:
      question: 箭頭函式重排換行後，畫面從 15 變成 undefined，你怎麼查？
      points:
        - 檢查本體是否變區塊
        - 區分顯示與回傳
        - 用同一個輸入比對
      answer: 我先用固定的 25 和 10 呼叫兩個版本，直接看回傳值。若右邊從運算式改成區塊，我會檢查是否少了 return，而不是到畫面補算一次。
  - id: fs-js-arrow-body
    prompt: 箭頭右邊加上區塊大括號後，要如何交回值？
    answer: 明寫 return；單一運算式的隱含回傳不適用於區塊。
    mcq:
      question: 哪個呼叫結果是 6？
      options:
        - ((n) => { n * 2; })(3)
        - ((n) => n * 2)(3)
        - ((n) => { return; })(3)
        - ((n) => console.log(n * 2))(3)
      answer: 1
      explain: 只有運算式本體交回 6；另外三種都回傳 undefined。
  - id: fs-js-call-argument
    prompt: 函式參數與呼叫時的引數如何對應？
    answer: 呼叫時各位置的引數，成為這次呼叫相對位置參數的值。
  - id: fs-js-pass-or-invoke
    prompt: 函式名字後面有沒有呼叫括號，交出去的東西有何不同？
    answer: 只取名字會取得函式本身；加上括號會先執行，再取得這次呼叫的回傳值。
    mcq:
      question: remaining 是計算差額的函式。哪一個值能留到稍後，再換不同引數呼叫？
      options:
        - remaining(25, 10)
        - remaining(0, 0)
        - remaining(10, 5)
        - remaining
      answer: 3
      explain: 前三個值都已經是數字。最後一項才是函式，可在真正需要時提供引數。
practice:
  - id: fs-js-b04-04-p1
    title: 保留三個能互相核對的實作
    kind: code
    minutes: 10
    steps:
      - 建立 remaining.js，先記下兩行結果
      - 去掉 block 的 return 並註解下觀察，再復原
      - 換成用完全部分鐘的輸入測三種函式
    checks:
      - 三種實作同樣回傳 0 而非 undefined
      - 下一次呼叫能直接使用上一次的數字
---

## 計時器顯示了答案，下一行卻拿不到

畫面上看見「剩 15 分鐘」，不代表另一段程式已經拿到數字 15。如果要讓首頁、提醒和週報都能使用同一個計算，必須把計算規則寫成一個可以呼叫、能交回值的單位。函式 (function) 就是這個單位；先學會怎麼交回答案，再比較用哪種外形來寫。

## 從呼叫端走進來，再走出去

宣告函式時，在名稱後的小括號列出參數 (parameter)，也就是這段規則裡用來稱呼輸入的名字。呼叫時在同一位置放入引數 (argument)，也就是這次真的要用的值。程式執行到 return 便把右側結果交還給呼叫端，同一次呼叫後面的敘述就不會再跑。沒有執行到帶值的 return，結果通常是 undefined，不會自動拿最後印出來的東西當答案。

箭頭函式 (arrow function) 把參數放在箭頭左邊，計算放在右邊。右邊只有一個運算式 (expression) 時，算出的值就是回傳值；若用了大括號包成區塊，可以寫好幾行，但要自己寫 return。兩種寫法都能用變數接住結果。下面只比較這個不依賴外部狀態的計算；不是說箭頭函式在所有情況都能替代一般函式。

## 範例：把第 2 堂課的結果送入下一次計算

在 `C:\dev\stackway-lab\javascript` 新建 `remaining.js`。把一組引數代進函式，先預測回傳值，再看哪一行負責把它顯示出來。

在該目錄的終端機執行 `node remaining.js`；各系統指令相同。

```js
function remaining(plan, used) {
  return plan - used;
}
const short = (plan, used) => plan - used;
const block = (plan, used) => {
  const difference = plan - used;
  return difference;
};
const left = remaining(25, 10);
console.log(left, short(25, 10), block(25, 10));
console.log(remaining(left, 5));
```

先讀呼叫端比較容易：左邊的數交給 plan，右邊的數交給 used，名字沒有跨次保留上一次的數字。前三個結果都是 15，最後把 15 當作全新一輪的輸入，再扣 5 得到 10。第一個函式沒有負責印字，呼叫端才有自由選擇要顯示、繼續算，或只把結果留在變數裡。

### 做一次故意失去答案的實驗

只在檔案副本裡刪掉 block 裡的 return 整行。中間的 difference 仍算得出來，第三個輸出卻變成 undefined。即使再加一行列印差額，畫面多了一個 15，呼叫端接到的仍然不是 15。修好時不要在每個呼叫點重新做一次減法，而是讓提供計算的一方履行回傳值的約定。

若要找收到錯誤答案的是哪一層，可以先把呼叫結果接到變數，再印這個變數。這樣印的是函式真正交出來的東西，不是函式半途中順手顯示的數字。

## 常見錯誤

為了整齊，把單行箭頭右側加上大括號，卻忘了補 return。另一種錯是把函式名字本身交給需要數字的地方，少打一對呼叫的小括號。名字代表可以稍後呼叫的函式值；名字後面加括號才是現在就執行。之後在[〈陣列的轉換與篩選〉](#/lesson/fs-js-02-array)會看到把函式本身交給別人呼叫，正是有意義的用法。

## 小結

檢查函式不用先看它有幾行。先寫出一組輸入與期望回傳值，再問計算和顯示各歸誰負責。同一組測資能檢查一般函式與兩種箭頭函式。
