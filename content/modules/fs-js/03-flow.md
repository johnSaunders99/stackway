---
id: fs-js-03-flow
module: fs-js
order: 3
title: 條件判斷與迴圈
subtitle: 把熟悉的 Python 規則搬到網頁
status: ready
minutes: 30
level: 2
prereqs:
  - fs-js-01-values
objectives:
  - 用 if、for…of 與 while 寫出同一個篩選規則
  - 以空值與 0 比對真假值結果
tags:
  - js
  - flow
resources:
  - title: MDN：迴圈與走訪
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-truth-zero
    prompt: 為何 if (value) 不適合判定分鐘欄有沒有填？
    answer: 0 也是假值；若 0 是合法紀錄，應依資料契約明確比較缺值。
    mcq:
      question: 數字或 null 的清單要保留 0，該用哪個條件？
      options:
        - Boolean(value)
        - value > 0
        - value === null
        - value !== null
      answer: 3
      explain: 後三者會排除 0 或只選到空值。
    interview:
      question: 計數突然少一筆，你會用哪組最小資料測「未填」與「0」？
      points:
        - 放入 0 和 null
        - 先給出預期
        - 核對真假值與明確判斷
      answer: 我只放 0 和 null，預期有 1 筆填過。若結果是 0，我會找是不是直接用值當條件；用明確的缺值比較後，0 就能留下。
  - id: fs-js-loop-for-of
    prompt: for…of 走訪陣列時，變數拿到什麼？
    answer: 每一個元素的值，不是自動給它的索引。
    mcq:
      question: 走訪 [8, 9] 的第一圈拿到什麼？
      options:
        - '8'
        - '0'
        - '2'
        - 整個陣列
      answer: 0
      explain: for…of 直接提供值；索引 0 與長度 2 不是第一個元素。
  - id: fs-js-while-progress
    prompt: 自己維護索引時，如何避免在空白格無限重跑？
    answer: 讓所有會繼續迴圈的路徑都能推進索引或改變停止條件。
practice:
  - id: fs-js-b04-03-p1
    title: 保留一個能翻案的 0 值測試
    kind: code
    minutes: 12
    steps:
      - 存下 count-slots.js 並核對兩種計數
      - 將第一段改成真假值判斷，記下差異再還原
      - 把清單改成只有 0 與 null，再測兩種迴圈
    checks:
      - 原清單的正確結果是 3 筆
      - 最小清單的兩種正確計數都是一
      - while 遇到 null 仍會結束
---

## 0 分鐘，是紀錄還是空白？

今天有 3 段練習，其中一段開始後立刻停止，花了 0 分鐘；另有 1 段根本沒填時間。若程式把兩者一起丟掉，月報就少了一次真實的嘗試。控制流程 (control flow) 的重點是把「哪些資料可以進來」寫成清楚的條件，然後讓每一筆都接受同一個判斷。

## 條件決定做不做，迴圈決定看哪一筆

條件判斷 (conditional) 的寫法是 if 後面用小括號包住條件，大括號包住要執行的敘述；else 是條件不成立時的另一條路。和 Python 用縮排表示區塊不同，這裡要保留大括號。比較用 `!==` 表示嚴格不相等；看到 `v !== null`，可以讀成「這一格不是明確標示的空值」。

迴圈 (loop) 可以逐項取值，也可以自己維護位置。`for…of` 讓一個名字在每一圈代表下一個值，適合從頭看完清單。`while` 會在每次執行前先檢查條件，適合停止點取決於目前狀態的工作。若自己用索引 (index) 走陣列，要從 0 開始，最後一個合法位置比長度小一。之後在[〈陣列與物件屬性〉](#/lesson/fs-js-05-collections)會細講這種按位置取值的資料。

## 範例：2 種走法，數同一批紀錄

開啟 `C:\dev\stackway-lab\javascript`，將範例另存為 `count-slots.js`。先圈出會進入計數的項目，再逐輪追蹤。沒有項目符合時，計數器也應該能交出有意義的答案。

在該目錄的終端機執行 `node count-slots.js`；各系統指令相同。

```js
const slots = [0, null, 15, 25];
let first = 0;
for (const value of slots) {
  if (value !== null) {
    first += 1;
  }
}
let second = 0;
let i = 0;
while (i < slots.length) {
  if (slots[i] !== null) {
    second += 1;
  }
  i += 1;
}
console.log(first, second, Boolean(0), Boolean(null));
```

這份小清單的契約很窄：每一格不是數字就是 null，所以這個條件已足夠。預測時先不要加總分鐘；每遇到合法紀錄，只在紙上畫一槓。0 畫一槓，空白不畫，15 與 25 各一槓，因此 2 個計數都應該是 3。`+= 1` 是把目前數字加 1 再存回；while 裡最後一次遞增負責移動位置，不是計數的另一種寫法。

### 把規則換掉，挑一筆會翻案的樣本

真假值 (truthiness) 是把值放進條件時轉成的布林判斷。最後兩個輸出都是假，正好說明「有沒有填」不等於「當成條件時為真」。把第一段判斷暫時改成 `if (value)`，0 會一起消失，第一個計數變 2。這個反例比再加入十個正數更能測出程式懂不懂需求。

再試一次空清單。前一種走法拿不到第一個元素，後一種走法一開始就不符合索引小於長度的條件，2 個計數都停在 0。空清單、只有 0、只有空值，看似都「沒花時間」，其實是三份筆數不同的輸入；要驗證計數，別只比總分鐘。

## 常見錯誤

把移動位置的敘述放進「有填才做」的大括號，走到空白那格時就再也不會前進。核對 while 時，替每條分支都問一次「下一圈的位置在哪裡」。另一個陷阱是把小於改成小於等於，讓程式多讀一格不存在的值，造成不該有的計數。

## 小結

先用一句話寫出接納條件，再決定用哪種迴圈走遍資料。能用同一個 0 值反例驗出兩種走法的差別，就不是只背會了語法。
