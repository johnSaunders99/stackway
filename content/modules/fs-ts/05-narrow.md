---
id: fs-ts-03-narrow
module: fs-ts
order: 5
title: 型別收窄與 unknown
subtitle: 從 unknown 收窄到可用資料
status: ready
minutes: 30
level: 3
prereqs:
  - fs-ts-02-union
objectives:
  - 為外部資料建立檢查函式
  - 用缺欄位輸入驗證拒絕路徑
tags:
  - ts
  - narrowing
resources:
  - title: "TypeScript：型別收窄"
    url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-ts-03-narrow-unknown
    prompt: "外部值先標 unknown，而不是 any，有什麼好處？"
    answer: "它可以接收未知值，但在證明型別前不能任意讀欄位或呼叫方法。"
    mcq:
      options:
        - "自動檢驗每個欄位"
        - "自動轉為物件"
        - "要求先檢查再使用"
        - "保證沒有 null"
      answer: 2
      explain: "unknown 保留未知性，不會自動驗證；any 則容易略過保護。"
  - id: fs-ts-03-narrow-null
    prompt: "檢查 typeof v === \"object\" 為什麼還要排除 null？"
    answer: "JavaScript 對 null 的 typeof 也是 object，但不能在 null 上讀欄位。"
    mcq:
      options:
        - "完整解析的 JSON 不會保留 null"
        - "null 的 typeof 也是 object"
        - "in 會自動略過 null"
        - "typeof 會把 null 回報為 undefined"
      answer: 1
      explain: "先排除 null，再檢查欄位，才不會在驗證過程本身出錯。"
  - id: fs-ts-03-narrow-predicate
    prompt: "型別述詞宣稱 v is Bin，需要什麼支撐？"
    answer: "函式回傳 true 時應真的檢查到 Bin 承諾的必要形狀與本題約定。"
    mcq:
      options:
        - "執行時逐項檢查"
        - "一個看似合理的函式名"
        - "只確認 JSON 能解析"
        - "在呼叫端加上 as Bin"
      answer: 0
      explain: "編譯器會信任述詞，錯誤的實作會把不合法資料放行。"
    interview:
      question: "外部傳來少欄位的 JSON，為什麼不能直接 as Bin？"
      points:
        - "語法可解析不代表符合領域形狀"
        - "以 unknown 接收並逐項檢查"
        - "拒絕路徑也要有案例"
      answer: "我會先把解析結果當 unknown，再檢查不是 null、必要欄位存在、型別與數量範圍合理。as 只改變編譯器的看法，不能替外部保證。測試除了正常資料，也會給缺欄位、負值和字串數量。"
practice:
  - id: fs-ts-03-narrow-lab
    title: "做一個會拒絕假庫位的入口"
    kind: code
    minutes: 13
    steps:
      - "儲存 gate.ts，加入沒有 count 的物件與 count 是字串的物件。"
      - "把每種輸入與接受或拒絕結果留在程式的案例清單。"
    checks:
      - "合法的 0 被接受；缺 count、負值、字串與 null 都被拒絕。"
      - "錯誤資料沒有讓驗證函式自己拋出例外。"
---

## 為什麼要學：成功解析不代表資料可以使用

收到一段格式正確的 JSON，裡面卻只有庫位代碼，沒有數量。解析器沒有理由抱怨，因為這確實是一個合法物件；盤點畫面卻不能拿不存在的數量計算補貨。把資料轉成 JavaScript 值與確認它符合用途，是入口處的兩道不同關卡。

## 核心概念：未知不是什麼操作都可以

未知型別（unknown）表示「目前不具備證據」，不是壞資料的別名。任何值都能先放進來，但要讀欄位或呼叫方法前，必須先透過控制流程收窄（narrowing）。這和 `any` 很不一樣：後者容易讓後面的使用處略過檢查，等到程式真的走到那條路才失敗。

守衛函式（type guard）把一串證據集中起來。回傳型別寫成 `v is Bin` 是型別述詞（type predicate）：回傳真時，呼叫端可以把這個值當作庫位。這句話很有力量，也有責任；檢查器不會替你證明函式內容確實測了每個必要條件。先列出契約，再逐項寫條件。

## 範例：把未知值送進同一個檢查口

在 `ts-lab`（見[〈tsconfig 與型別檢查〉](#/lesson/fs-ts-01-config)）建立 `gate.ts`，從此目錄執行 `.\node_modules\.bin\tsc.cmd -p .`，其他系統用 `./node_modules/.bin/tsc -p .`；執行 `node js/gate.js`。這次明訂數量必須是大於等於 0 的整數。

```ts
type Bin = { code: string; count: number };
function isBin(v: unknown): v is Bin {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return false;
  return "code" in v && typeof v.code === "string" &&
    "count" in v && typeof v.count === "number" &&
    Number.isInteger(v.count) && v.count >= 0;
}
for (const raw of ['{"code":"A2","count":0}', '{"code":"C1"}',
                    '{"code":"D3","count":-1}', 'null']) {
  const input: unknown = JSON.parse(raw);
  console.log(isBin(input) ? input.code + " " + input.count : "拒絕");
}
```

按照判斷順序唸一遍。先排除不能當資料列的值，再檢查欄位是否存在，最後才問數量的型別與範圍。布林運算會短路，前面已經不成立，後面就不用執行。於是缺欄位的案例只會被拒絕，不會因為執意繼續讀取而出現另一個例外。0 能通過也值得留一筆證據，因為真假判斷常會不小心把它當缺值。

### 最值得保留的反例就在邊界上

假設清單裡另有一筆代碼是空字串。現在的守衛會接受它，因為它只約定代碼為字串，並沒有說不得空白。這不一定是程式錯誤：要先問庫位設計是否真的允許空代碼。如果不允許，就把規則寫成驗證條件，再留一筆空白代碼的反例。相同地，負數不該出現在庫存數量，卻可能是調整數量時的合法差額。不要因為兩個欄位都叫數字，就偷偷套用相同門檻。守衛守的是這一種資料的約定，不是替所有數字與字串決定應該長什麼樣子。

## 常見錯誤

把 `JSON.parse` 的結果斷言（assert）為 `Bin`，不會在執行時多出任何檢查；宣告欄位叫數量，也不會把字串變成數字。此例的字串都是合法 JSON；若來源連語法都不保證，應在解析處另用 `try/catch` 處理語法錯誤，再讓成功解析的值進形狀檢查，不要混為同一種問題。

## 小結

讓未知只活在入口，驗證成功後再讓其他函式享受可靠型別。寫守衛時至少保留一個剛好合法的邊界值和一個剛好缺欄位的反例，才知道門檻設得對不對。
