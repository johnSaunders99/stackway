---
id: fs-ts-04-generic
module: fs-ts
order: 6
title: 泛型函式與容器
subtitle: 讓容器保留元素型別
status: ready
minutes: 35
level: 3
prereqs:
  - fs-ts-03-narrow
objectives:
  - 寫出可重用的泛型函式
  - 比較泛型與 any 的保護差異
tags:
  - ts
  - generics
resources:
  - title: "TypeScript：泛型"
    url: https://www.typescriptlang.org/docs/handbook/2/generics.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-ts-04-generic-relation
    prompt: "泛型函式的 T 替呼叫端保住什麼？"
    answer: "保住輸入與輸出之間的型別關係，同一個函式可以依不同呼叫推論不同元素型別。"
    mcq:
      options:
        - "輸入值的深層複本"
        - "執行時一定有資料"
        - "所有型別的共同方法全集"
        - "輸入與輸出的型別關係"
      answer: 3
      explain: "泛型描述關係，不是複製資料或保證非空。"
    interview:
      question: "你會寫兩個取首筆函式，還是寫一個泛型？"
      points:
        - "說明輸入輸出之間的固定關係"
        - "保留呼叫端具體型別"
        - "明示空陣列的結果"
      answer: "兩種陣列的演算法完全相同，我會用一個型別參數串起元素與回傳值，讓呼叫者保留數字或字串的工具提示。空陣列沒有首筆，所以回傳型別也保留 undefined，不靠 any 矇混過去。"
  - id: fs-ts-04-generic-empty
    prompt: "回傳第一個元素時為何要額外考慮 undefined？"
    answer: "一般陣列可以是空的，元素型別本身不能保證至少有一個元素。"
    mcq:
      options:
        - "元素型別已經包含所有可能的長度"
        - "回傳值一定是 null"
        - "空陣列沒有第一筆"
        - "選用串連會替空陣列補值"
      answer: 2
      explain: "型別參數代表元素種類，不代表陣列長度。"
  - id: fs-ts-04-generic-any
    prompt: "把輸出型別改成 any 後，數字上誤呼叫字串方法會怎樣？"
    answer: "檢查器可能放過，執行到該呼叫才出錯。"
    mcq:
      options:
        - "自動把數字轉文字"
        - "可能把錯誤延到執行時"
        - "編譯器自動補實作"
        - "只讓檢查更嚴格"
      answer: 1
      explain: "any 放棄關係，不能用能通過編譯證明呼叫安全。"
practice:
  - id: fs-ts-04-generic-lab
    title: "交出保留元素型別的取樣函式"
    kind: code
    minutes: 14
    steps:
      - "存入 first.ts，在數字與字串陣列上各呼叫一次。"
      - "加入空陣列案例，再試著對數字結果呼叫 toUpperCase，觀察錯誤後還原。"
    checks:
      - "三種輸入各得到預期結果，空陣列的替代文字可見。"
      - "即使已排除缺值，數字仍不能呼叫字串專用方法。"
---

## 為什麼要學：不需要為紙膠帶和數量各寫一次取首筆

取清單的第一筆，不管清單裝的是品名、數量還是庫位物件，步驟都相同。但呼叫者接下來能做的事不同：品名可以轉大寫，數量可以格式化小數位。若為了共用程式，把結果一律放寬成任何型別，反而弄丟了原本已經知道的消息。

## 核心概念：替「同一種」留一個位置

泛型（generic）可以用型別參數（type parameter）表達不同位置之間的關係。`function first<T>` 裡的 `T` 像一個待填的型別名稱；這次傳入字串陣列，這次的 `T` 就可以推論為字串。另一行傳入數字陣列，並不會把先前的字串改成數字，每次呼叫各自推論。

參數 `readonly T[]` 表示可讀取元素，不應由這個函式改寫陣列；回傳 `T | undefined` 說的是有第一筆就維持該元素型別，沒有就明確交回缺值。這份宣告描述的是約定，不會在執行時製造一個叫 `T` 的值。不能因為使用了尖括號，就假設每種元素都能做字串操作。

## 範例：同一支函式，3 個不一樣的呼叫

把以下內容存為 `ts-lab/first.ts`。在專案目錄用 `.\node_modules\.bin\tsc.cmd -p .`（其他系統為 `./node_modules/.bin/tsc -p .`）檢查並編譯，再以 `node js/first.js` 執行。

```ts
function first<T>(rows: readonly T[]): T | undefined {
  return rows.length === 0 ? undefined : rows[0];
}
const part = first(["tape", "box"]);
const qty = first([3, 7]);
const empty = first<string>([]);
console.log(part?.toUpperCase(), qty?.toFixed(1), empty ?? "沒有首筆");
```

在編輯器把游標停在 `qty` 上，它應該仍是數字或缺值。`?.` 是選用串連（optional chaining），值為空時不呼叫方法，因此可以安全處理空清單。它不是萬用許可證：就算允許缺值，數字有值時仍不能使用字串的方法。空清單這次明寫元素型別，因為沒有任何元素可供推論。

想比較 `any` 的代價，可以只在心中換掉回傳型別。呼叫端看起來能做更多事，卻不再從型別系統得知哪些事其實做不到。這和使用 `unknown` 也不同：未知型別會要求呼叫端重新證明；泛型則把原本的證據從輸入端帶到輸出端，不必在每個地方重查一次。

### 替換一種你沒有預先想到的元素

假設清單裝的是物件，裡面有代碼和數量。用同一個函式取首筆，呼叫端只要排除缺值，就仍可讀取物件上的代碼。函式不必知道代碼叫什麼，因為它的工作是取位置，不是理解每種物件。若你想在函式內直接印出代碼，需求就變了：不是每一種元素都可以接受。先辨別演算法到底只在意位置，還是在意元素具備某個欄位，才知道是否該另外限制型別參數。

## 常見錯誤

函式若答應一定回傳 `T`，卻允許呼叫端傳空陣列，就寫下了無法履行的約定。即使目前的檢查設定沒有指出某次越界讀取，也該按真實行為設計回傳型別。另一個錯誤是先把陣列宣告成 `any[]`，此時來源資訊已經流失，泛型無法憑空救回。

## 小結

不是所有函式都需要型別參數。當演算法不依賴元素種類，但結果的種類必須跟著輸入走，才是泛型真正省下重複、又不犧牲檢查的地方。
