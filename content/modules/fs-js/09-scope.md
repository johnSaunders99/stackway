---
id: fs-js-04-scope
module: fs-js
order: 9
title: 作用域與閉包
subtitle: 函式記住的是哪一份變數
status: ready
minutes: 30
level: 2
prereqs:
  - fs-js-08-spread
objectives:
  - 追蹤區塊與函式作用域
  - 用閉包保留一次操作的狀態
tags:
  - js
  - closure
resources:
  - title: MDN：閉包與詞彙環境
    url: https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Guide/Closures
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-closure-binding
    prompt: 閉包記住的是外層值的快照，還是對變數的存取？
    answer: 保留對相應詞彙環境中變數的存取，所以能看見後續更新。
    mcq:
      question: 同一個閉包連續加 12 次為何得到一和 2？
      options:
        - 每次都複製最初的 0
        - 兩次更新同一份外層變數
        - 每次呼叫都建立新計數器
        - 函式回傳就自動清空外層
      answer: 1
      explain: 保留同一份變數是第二次能累加的原因。
    interview:
      question: 兩個計數器偶爾一起加，你會先查哪一行？
      points:
        - 查建立與指定的位置
        - 區分別名和新環境
        - 用交錯呼叫驗證
      answer: 我會先找第二個變數是重新呼叫建立函式，還是直接等於第一個函式。交錯呼叫後若從上次的數字接著加，就去查兩條路是否用了同一份環境。
  - id: fs-js-factory-environments
    prompt: 呼叫建立函式兩次和替同一函式取別名差在哪裡？
    answer: 前者可建立兩份獨立環境；別名仍指向同一個已建立的函式。
    mcq:
      question: 哪個動作會為本課計數器開一本新帳？
      options:
        - 把 correct 指定給新名字
        - 再呼叫一次 correct()
        - 再呼叫一次 makeCounter()
        - 把 correct 印到主控台
      answer: 2
      explain: 建立工廠才會執行外層的 count 宣告。
  - id: fs-js-lexical-lookup
    prompt: 內層函式使用的外部名字，依哪個位置尋找？
    answer: 從函式定義時所在的詞彙範圍向外找，先用最近的可見名字。
practice:
  - id: fs-js-b04-09-p1
    title: 做出能解釋的四次計數
    kind: code
    minutes: 10
    steps:
      - 儲存 counters.js，先寫下四個預測再核對
      - 把 alsoCorrect 改成另一次 makeCounter()
      - 在註解畫出修改前後的名字與計數器關係
    checks:
      - 原輸出為 1、2、1、3
      - 獨立建立後最後一次為 1
      - 我能指出哪一行建立新狀態
---

## 2 個計數按鈕，怎麼讓它們各記各的？

想像左邊按鈕記答對次數，右邊記需要再練的次數。如果把數字寫在同一個全域變數裡，按哪個都改到同一份；如果每次點擊才把數字宣告成 0，則永遠只會看到一。要解這個問題，數字得活得比一次點擊久，又不能被所有按鈕共用。

## 沿著定義的位置找名字

作用域 (scope) 是名字在程式碼裡可以被找到的範圍。區塊裡的 let 和 const 只在該區塊及其內層可見；函式的參數與區域名字同樣不會因為別人呼叫了它，就跑到呼叫者的範圍裡。內外都有同名變數時，先找最近的一層。這種從函式被寫下的位置決定往哪裡找名字的規則，稱為詞彙作用域 (lexical scope)。

閉包 (closure) 是函式和它能存取的外層詞彙環境所形成的組合。外層函式已經回傳，內層函式若仍能被呼叫，就還可以讀寫自己對應的那份外層變數。它保留的是對那個變數的存取，不是第一次建立時拍下的一張數值照片。多個函式可以共用同一份環境；反過來，同一段函式程式碼也能在不同次呼叫裡得到不同環境。

## 範例：做 2 個從 0 開始的櫃檯

開啟 `C:\dev\stackway-lab\javascript`，將範例另存為 `counters.js`。分別記下每次呼叫的是哪個計數器。即使兩段程式長得一樣，也可能記得不同的舊值。

在該目錄的終端機執行 `node counters.js`；各系統指令相同。

```js
function makeCounter() {
  let count = 0;
  return () => {
    count += 1;
    return count;
  };
}
const correct = makeCounter();
const retry = makeCounter();
const alsoCorrect = correct;
console.log(correct(), correct(), retry(), alsoCorrect());
```

先分清兩種括號：呼叫 makeCounter 是建立一個計數器，呼叫 correct 才是讓其中一個計數器加 1。兩次建立分別開了兩本帳，第三個名字卻沒有呼叫建立函式，只是指向原來的加一函式。所以由左往右的答案會是一、2、1、3。若把 count 宣告搬到箭頭函式內，每次才重設為 0，結果就全變成一。

### 畫清楚是共用函式，還是再造一份

在紙上畫兩個方框，分別放第一本帳和第二本帳，替三個名字各畫箭頭。第一次呼叫後不要擦掉箭頭，只改第一本帳裡的數字。當你一路走到最後一個名字，就看得出它沒有第三本帳。若再寫一個和 count 同名的外部變數，也不會讓內層自動改去讀它；先前的環境裡已經有更近的名字。

## 常見錯誤

想在外面印出 count 來證明它還活著，卻得到找不到名字的錯誤。能否從外面直接叫出名字，和內層函式能否繼續存取，是不同問題。可透過計數器的回傳值觀察狀態，不需要為了測試把私有狀態搬到全域。另一個錯是每次需要加一時都重新建立計數器，那測到的是許多本新帳的第一頁。

## 小結

決定狀態是否共用，去數建立環境的呼叫次數，不是數畫面上的按鈕數或變數名字數。能解釋最後為何是 3，就能把閉包用在真正需要記憶的地方。
