---
id: fs-js-01-variables
module: fs-js
order: 1
title: let 與 const 宣告
subtitle: 同一個名字能否重新指定
status: ready
minutes: 30
level: 2
prereqs: []
objectives:
  - 用 let 與 const 各宣告一個區塊變數
  - 區分不能重新指定與物件內容不能修改
tags:
  - js
  - variables
resources:
  - title: MDN：宣告、作用域與資料型別
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Node.js：官方安裝程式
    url: https://nodejs.org/en/download
    kind: tool
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-binding-reassign
    prompt: let 與 const 對重新指定有什麼差別？
    answer: let 的繫結可重新指定；const 宣告時要給值，之後不可重新指定。
    mcq:
      question: 要讓 left 在同一區塊從 25 倒數，哪組宣告與更新可行？
      options:
        - const left = 25; left = left - 1;
        - let left = 25; left = left - 1;
        - let left = 25; let left = left - 1;
        - const left = 25; const left = 24;
      answer: 1
      explain: let 宣告一次後可以重新指定；const 不可換值，重複宣告同一區塊的名字也不可行。
    interview:
      question: 同事說卡片宣告成 const 就不可能被改，你會怎麼示範？
      points:
        - 區分繫結與物件
        - 示範可改屬性
        - 對照不能重新指定
      answer: 我會把改計數和換整張卡寫成兩個小測試。前者改的是同一個物件的欄位，會成功；後者要改 const 的繫結，才會報錯。
  - id: fs-js-const-field
    prompt: const 物件能更新屬性嗎？
    answer: 一般可寫屬性仍可更新；const 限制的是名字不能改指另一個值。
    mcq:
      question: '已宣告 const card = { ticks: 0 }，哪項可執行？'
      options:
        - card = 1
        - 'card = { ticks: 1 }'
        - card.ticks = 1
        - card = null
      answer: 2
      explain: 只有第一項寫入物件屬性，其他都替換名字對應的值。
  - id: fs-js-block-visibility
    prompt: 在單獨的大括號區塊內宣告的 let 名字，外面能直接讀嗎？
    answer: 不能；該宣告只在區塊與可見的內層範圍有效。
practice:
  - id: fs-js-b04-01-p1
    title: 留下計時器的第一筆刻度
    kind: code
    minutes: 9
    steps:
      - 建立 timer.js，先預測三個數再執行
      - 把 step 改為 2 後重跑
      - 在檔案末尾用註解記錄兩次輸出
    checks:
      - 兩次的 duration 都是 25
      - 第二次 left 是 23、ticks 是 2
      - 區塊外沒有直接讀 step
---

## 同樣寫等號，這次是在命名，還是在改值？

做一個倒數讀書計時器：整堂課預定 25 分鐘，每經過 1 分鐘，剩餘時間就要改一次。這兩個數字起初相等，扮演的角色卻不同。把它們取成兩個能讀懂的名字，再選擇允不允許重新指定，比看到數字就一律寫同一種宣告更能表達意圖。

## 宣告先建立名字，指定才換值

變數 (variable) 讓一個名字對應一個值。寫 `let left = 25` 時，let 宣告一個可以重新指定的名字，等號右邊是起始值。之後寫 `left = left - 1`，先讀出右邊目前的值，算完才把結果放回左邊。這不是數學等式，不必在兩邊同時成立。想讓名字一直指向同一個值，改用常數宣告 (const declaration)，而且宣告時就要給起始值。

兩種名字都受區塊作用域 (block scope) 限制：一對大括號可以包住一小段工作，在裡面才宣告的名字不會自動跑到外面。外面已宣告的名字則可以在裡面讀取。之後在[〈作用域與閉包〉](#/lesson/fs-js-04-scope)會細講函式如何保留對外層名字的存取，這裡先分清楚「哪裡用得到」和「可不可以換值」。

## 範例：走過 1 分鐘

先在 PowerShell 試 `node --version`。若找不到指令，在本課的 Node.js 官方下載頁選目前的長期支援版（Long Term Support，LTS），選符合 Windows 系統架構的安裝檔（MSI），不要選原始碼壓縮檔。安裝後開新終端機，再查 `node --version` 與 `npm.cmd --version`；npm 是管理專案套件的工具，今天不必用它裝任何套件。為什麼同一種語言可以在終端機和瀏覽器裡執行，之後在[〈Node.js 執行環境〉](#/lesson/fs-node-01-runtime)會細講。

為JavaScript 計時器建立 `C:\dev\stackway-lab\javascript`。建立 `timer.js`。每讀到一次指定，記下名稱當下指向的值；區分不能重新指定的名稱和不再變動的資料。

在該目錄的終端機執行 `node timer.js`；各系統指令相同。

```js
const duration = 25;
let left = duration;
const card = { label: "reading", ticks: 0 };
{
  const step = 1;
  left = left - step;
  card.ticks = card.ticks + step;
}
console.log(duration, left, card.ticks);
```

Node.js 是能在瀏覽器外執行 JavaScript 的程式；此處只用標準語法，不用安裝套件。若終端機尚未提供 node，也可在空白分頁的開發者工具主控台逐行輸入範例，重新整理空白頁後再從頭試。`console.log` 把結果顯示在終端機或主控台，不會自己改變變數。

先看三個值各有沒有動。預定時間仍為 25，剩餘時間變 24，卡片的計數增加了一次。`card` 是物件 (object)，可把多個具名資料放在一起，點號取出其中一個屬性。改 `card.ticks` 改的是那個物件裡的一格，不是把整張卡換掉；之後在[〈陣列與物件屬性〉](#/lesson/fs-js-05-collections)會專門練習讀寫這些格子。

看程式之前，也可以用紙畫兩格，左格寫預定、右格寫剩餘。複製起始數字不會把兩格綁在一起；右格減一時不用從左格擦掉 1 分鐘。

## 常見錯誤

每次改值又補上 let，像是想再次宣告同名變數；同一區塊不能這樣重複宣告。另一個誤會是把 const 解讀為「整份資料上鎖」。試著在副本最後另加 `card = { ticks: 9 };`，執行會報錯；移除這行，原本改屬性的程式就能照常執行。分開測才看得出原因，不要一次改宣告和屬性名稱。

## 小結

讀每一行指定時問：「等號左側是名字本身，還是物件裡的欄位？」選宣告方式時則問：「這個名字之後需要換成另一個值嗎？」兩個問題不必有同一個答案。
