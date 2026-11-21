---
id: fs-js-03-objects
module: fs-js
order: 6
title: 空值與物件預設值
subtitle: 不讓缺少的欄位變成崩潰
status: ready
minutes: 30
level: 2
prereqs:
  - fs-js-05-collections
objectives:
  - 用預設值處理缺欄位
  - 解釋 0 與空字串不等於沒有值
tags:
  - js
  - nullish
resources:
  - title: MDN：空值合併運算子
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-nullish-default
    prompt: 只有缺值才要 15，怎樣保留合法的 0？
    answer: 使用 ??，它只對 null 或 undefined 套用右側預設值。
    mcq:
      question: 若 minutes 為數字 0，哪個運算式結果仍是數字 0？
      options:
        - 'minutes ? minutes : 15'
        - minutes || 15
        - minutes ?? 15
        - 'minutes === 0 ? 15 : minutes'
      answer: 2
      explain: 雙問號只替代缺值。邏輯或、把分鐘當真假值的條件式，以及明確用 15 替換 0 的條件式，在本例都得到 15。
    interview:
      question: 使用者已關閉提醒，重新開頁卻恢復 15 分鐘，怎麼找原因？
      points:
        - 用 0 與缺欄位重現差異
        - 指出真假值問題
        - 區分讀取與寫回
      answer: 我會先查原始設定是不是 0，再用 0 和缺欄位各走一次顯示邏輯。如果讀到 0 卻套了預設，該修缺值判斷，不該把儲存的 0 改成 15。
  - id: fs-js-optional-parent
    prompt: ?. 放在可能缺少的父物件後有何作用？
    answer: 父物件是 null 或 undefined 時停止該段存取，得到 undefined 而非讀取錯誤。
    mcq:
      question: reminder 是 null 時，reminder?.minutes 的結果是什麼？
      options:
        - '0'
        - '15'
        - 空物件
        - undefined
      answer: 3
      explain: 選擇性串連不決定產品預設值，只停止不存在的屬性存取。
  - id: fs-js-default-validation
    prompt: 雙問號會過濾負數或錯誤型別嗎？
    answer: 不會；判斷可接受的型別、範圍是另一個驗證步驟。
practice:
  - id: fs-js-b04-06-p1
    title: 留住 0 與空字串的設定測試
    kind: code
    minutes: 10
    steps:
      - 建立 defaults.js，保留四組輸出
      - 加入 reminder 內有 minutes 為 null 的第五組
      - 用註解寫下空字串的長度，而不是只看空白畫面
    checks:
      - 第一組為 0 而最後新增的一組為 15
      - 空字串長度是 0
      - 讀取不修改原設定
---

## 關掉提醒，不該變成提醒 15 分鐘

設定頁約定：沒有填提醒分鐘數，就使用 15；填 0 則代表關閉。如果你把「沒有值」寫成「不是一個真值」，使用者明明選了 0，存檔後卻又打開提醒。這一課不要急著補上每一個洞，先弄清楚產品允許哪些值，哪些才算缺漏。

## 取值和補值分 2 步

空值合併運算子 (nullish coalescing operator) 寫成兩個問號。`v ?? 15` 在左側是 null 或 undefined 時才取右側，遇到 0、空字串或 false 時會保留原值。邏輯或 (logical OR) 寫成 `||`，左側任何假值都會改用右側；如果合法資料裡包含 0，兩個運算子的用途就不能互換。

有時候缺的不是欄位，是包住欄位的整層物件。`settings.reminder.minutes` 需要先有可讀的 reminder；若它不存在，還沒等到補值，取用下一層就先報錯。選擇性串連 (optional chaining) 的 `?.` 會在它左邊是 null 或 undefined 時停止該段存取，得到 undefined。接著才讓雙問號處理最後的預設值。你保護的是可能缺少的那一層，不必不分青紅皂白在每個點號前都加問號。

## 範例：拿 4 份設定試讀

開啟 `C:\dev\stackway-lab\javascript`，將範例另存為 `defaults.js`。把確實提供的 0 與沒有提供的值並排比較。兩者在布林判斷中可能很像，對資料的意義卻不同。

在該目錄的終端機執行 `node defaults.js`；各系統指令相同。

```js
function readMinutes(settings) {
  return settings.reminder?.minutes ?? 15;
}
for (const settings of [
  { reminder: { minutes: 0 } },
  { reminder: { minutes: 8 } },
  { reminder: null },
  {},
]) {
  console.log(readMinutes(settings));
}
console.log("" ?? "note", ("" ?? "note").length);
```

第一份明確填 0，若這一行印成 15，讀取規則就違反了關閉提醒的約定。第二份有 8 分鐘，不必採用預設。第三份明確表示沒有提醒物件，第四份則完全缺少這個欄位；後兩份雖然來源不同，這個畫面的規格選擇讓它們都顯示 15。最後用字串長度檢查空字串確實被保留，比在終端機裡找看不見的空白可靠。

### 預設值不是輸入驗證

如果資料是字串形式的「8」或負數，雙問號也會讓它通過。因為運算子只回答「值在不在」，不會替你檢查單位、型別和合理範圍。這個範例假設傳進來的設定本身是物件；若連外層都可能是空，應先決定呼叫端的契約，是拒絕這種資料，還是把整份視作未設定。悄悄吃掉所有錯誤，可能讓原本應修的資料問題長期藏起來。

再考慮通知標籤：使用者可能故意留下空字串，意思是「不要顯示標籤」。若只測一個有字的標籤和一份空設定，兩種預設寫法都會過關；真正能區分它們的是這筆刻意留白的資料。

## 常見錯誤

把預設值直接寫回設定，使用者下次就無從區分自己選了 15，還是介面暫時顯示 15。單純讀取和真正儲存應是兩個決定。也不要把「空字串一定無效」當成通則：若副標題允許留白，空字串正是使用者留下的答案。

## 小結

先列出一筆合法 0 值和一筆真的缺值，用這一對資料選運算子。讀取失敗時，再找出是上一層不存在，還是最後一欄需要預設。
