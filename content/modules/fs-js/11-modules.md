---
id: fs-js-05-modules
module: fs-js
order: 11
title: ES 模組與匯入匯出
subtitle: 把純函式搬到獨立模組
status: ready
minutes: 35
level: 2
prereqs:
  - fs-js-10-classes
objectives:
  - 建立一組具名匯出與匯入
  - 隔開顯示格式與計算規則
tags:
  - js
  - modules
resources:
  - title: MDN：JavaScript 模組
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-module-named
    prompt: 具名匯入需要對上來源模組的什麼？
    answer: 模組路徑要正確，匯入的名稱要是來源實際匯出的名稱。
    mcq:
      question: Node 已找到 totals.mjs，卻說缺少具名匯出，先比對什麼？
      options:
        - 是否曾先單獨執行 totals.mjs
        - 規則函式是否印出回傳值
        - 入口和規則的檔名是否完全相同
        - 匯出名稱和匯入大括號裡的拼字
      answer: 3
      explain: 模組已被找到；這時應查公開介面名稱。
    interview:
      question: 首頁和週報都要已完成分鐘，如何分檔才不會抄兩次？
      points:
        - 單一純計算匯出
        - 兩個呼叫者各自匯入
        - 格式留在顯示端
      answer: 我會匯出一個接收紀錄並回傳分鐘數字的函式。首頁和週報匯入同一個名稱，各自決定怎麼寫標籤；改版面不需要重測另一套加總規則。
  - id: fs-js-module-path
    prompt: 模組敘述中的 ./totals.mjs 相對於哪裡？
    answer: 相對於包含該匯入敘述的模組所在位置。
    mcq:
      question: 把兩個檔案一起搬到另一個資料夾，為什麼相對匯入仍可成立？
      options:
        - 兩個檔案的相對位置不變
        - Node 會在終端機的起始目錄找所有匯入
        - 匯入只依函式名稱，不依檔案路徑
        - 副檔名相同就會自動互相匯入
      answer: 0
      explain: 相對匯入依模組位置解析，並非全機搜尋。
  - id: fs-js-module-pure
    prompt: 為什麼讓計算模組回傳數字而不是排版後的文字？
    answer: 呼叫者可自行顯示或繼續計算，規則不用依賴畫面的格式。
practice:
  - id: fs-js-b04-11-p1
    title: 交付一個規則檔和兩種顯示結果
    kind: code
    minutes: 12
    steps:
      - 建立 totals.mjs 與 report.mjs，執行入口
      - 在入口多印一行總分鐘換算的小時，不動規則檔
      - 保留空清單的測試輸出
    checks:
      - '入口顯示 minutes: 25、empty: 0'
      - 規則檔沒有 console.log
      - 兩種單位來自同一次的數字結果
---

## 首頁要顯示分鐘，週報只要數字

兩個頁面各抄一份「加總已完成分鐘」的程式，很快就會出現一邊修了另一邊沒修的情形。把計算抽成模組 (module)，讓兩個呼叫者引用同一個定義，比在兩個檔案裡提醒自己保持同步可靠。今天要交付的不是一個資料夾的檔案數，而是一條看得懂的依賴方向：顯示可以依賴計算，計算不必知道顯示方式。

## 一個檔案只公開需要的名字

ES 模組以 export 表示可供其他模組使用的名稱，以 import 宣告這個檔案要從哪裡取得它。具名匯出 (named export) 的名字是介面的一部分；匯入時用大括號選名稱，從正確路徑取得。檔案內沒匯出的其他名字留在模組自己的範圍，不必全掛在全域變數上。分析程式先看入口檔的匯入清單，就能知道計算從哪裡來。

沿用[〈let 與 const 宣告〉](#/lesson/fs-js-01-variables)確認過的 Node.js；它能在瀏覽器外執行 JavaScript。這次副檔名用 `.mjs` 明確表示 ES 模組，不必為這兩個檔案新增套件或修改其他專案設定。相對路徑 (relative path) 的 `./` 表示與寫下這條匯入敘述的檔案同一層，不是依瀏覽器顯示的頁名尋找。檔名和副檔名一起寫全；大小寫也保持一致，不讓搬到另一個系統時才出現找不到檔案。

## 範例：存 2 個檔案，只啟動一個入口

在 `C:\dev\stackway-lab` 建立 `weekly-modules` 資料夾。先把規則存成裡面的 `totals.mjs`。純函式 (pure function) 在這裡只讀傳入的紀錄並交回數字；不印字、不改來源，也不讀外部日期，方便重複測試。

```js
export function completedMinutes(rows) {
  return rows.filter(row => row.done)
    .reduce((sum, row) => sum + row.minutes, 0);
}
```

再把下段存成同層的 `report.mjs`。在該資料夾的終端機執行 `node report.mjs`；PowerShell 與 macOS、Linux 的指令相同。執行入口時會載入它依賴的模組，不用先跑計算檔再切換視窗。

```js
import { completedMinutes } from "./totals.mjs";

const rows = [
  { minutes: 25, done: true },
  { minutes: 40, done: false },
];
const total = completedMinutes(rows);
console.log("minutes:", total);
console.log("empty:", completedMinutes([]));
```

第一行是 25，第二行是 0。現在把顯示單位換成小時：呼叫端拿到數字後才做換算與文字排版，不必改規則所承諾的分鐘單位。若反過來讓計算檔直接回傳含文字的句子，週報下次要再算平均就得先把字串拆回數字，模組邊界反而增加麻煩。

也可以讓兩個入口各準備不同資料：一個只交今天的紀錄，另一個交整週的紀錄。規則檔不應該回頭匯入其中一個入口去找資料，否則換資料範圍或加一個入口，就得連不相干的顯示邏輯一起搬動。

## 常見錯誤

直接執行 totals.mjs，沒有輸出就以為函式沒生效。規則檔只宣告，不負責啟動畫面；看結果要跑入口檔。遇到「沒有該匯出」先核對大括號裡的名稱；遇到「找不到模組」才先看路徑與副檔名。不要一看到匯入錯誤就安裝套件，這裡依賴的是自己剛剛存好的鄰近檔案。

## 小結

把匯出當一個承諾：輸入什麼、輸出什麼、哪個名字可用。只改文字應不必碰計算，改規則則只要維護一份，兩個檔案才真正有分工。
