---
id: fs-ts-01-model
module: fs-ts
order: 2
title: 基本型別與選填欄位
subtitle: 替畫面資料取型別
status: ready
minutes: 25
level: 3
prereqs:
  - fs-ts-01-config
objectives:
  - 描述必填與選填欄位
  - 區分型別宣告與建立值
tags:
  - ts
  - types
resources:
  - title: "TypeScript：常用型別"
    url: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-ts-01-model-alias
    prompt: "只有 type Bin 的宣告，執行時會自動出現什麼資料？"
    answer: "不會出現資料；型別描述可接受的值，建立物件還要寫出實際內容。"
    mcq:
      options:
        - "自動產生空物件"
        - "自動填入空字串"
        - "自動建立所有欄位為 undefined 的樣板"
        - "不會建立物件"
      answer: 3
      explain: "宣告是給檢查器看的，執行所需的值要另外建立。"
  - id: fs-ts-01-model-optional
    prompt: "欄位 note?: string 讓讀取者必須考慮哪種情形？"
    answer: "欄位可省略，讀取時除了字串也可能得到 undefined。"
    mcq:
      options:
        - "一定是空字串"
        - "一定是 null"
        - "讀不到值"
        - "會自動補上預設字串"
      answer: 2
      explain: "問號允許缺欄位，沒有指定替代值。"
    interview:
      question: "有些庫位沒有備註，應該把每個欄位都設成選填嗎？"
      points:
        - "根據用途決定必填欄位"
        - "只讓真的可能缺少者選填"
        - "顯示層處理缺值且保留合法空值"
      answer: "我會讓辨識庫位與計數所需的欄位必填，備註才選填。在呈現時明確處理缺值，再測有備註、沒有備註和數量為 0，避免把不同資料狀態混在一起。"
  - id: fs-ts-01-model-fallback
    prompt: "要在沒有備註時才給提示、卻保留空字串，可用什麼？"
    answer: "用空值合併運算子 ??，不會把合法的空字串誤判成缺值。"
    mcq:
      options:
        - "用 note || 提示字串"
        - "note ?? 提示字串"
        - "強制把 note 當成字串"
        - "移除問號但不改資料"
      answer: 1
      explain: "一般真假判斷會把空字串也視為假；型別斷言不補資料。"
practice:
  - id: fs-ts-01-model-lab
    title: "留下三種資料的庫位標籤"
    kind: code
    minutes: 10
    steps:
      - "在 ts-lab 建立 bins.ts，依正文編譯、執行。"
      - "加入一個數量為 0、備註是空字串的庫位，並用註解寫下預期標籤。"
    checks:
      - "沒有備註的項目顯示未填，空字串則不會被換成未填。"
      - "嘗試拿掉必填的 code，能在編譯時看到錯誤；恢復後可通過。"
---

## 為什麼要學：庫位沒有備註，不等於庫位不存在

假設畫面要列出庫位代碼、數量與一行備註。代碼少了就不知道在說哪一格；數量為 0 仍是一個有效結果；備註卻完全可以不填。如果一股腦把這些欄位都當字串，又用空白代表任何缺漏，往後看到一格空白就得猜它究竟是哪種狀況。

## 核心概念：描述形狀，另外建立值

基本型別（primitive type）像 `string`、`number`、`boolean`，分別描述字串、數字與布林值。物件型別（object type）將欄位名字與允許的型別綁在一起。`type` 宣告替一種形狀命名；真正建立值的是後面那個含具體欄位的物件，而不是型別的名字。

必填欄位（required property）在建立物件時要供應；選填欄位（optional property）則用問號標示。從可能缺少的欄位讀資料時，不宜直接拿來呼叫字串方法。在嚴格檢查下，編譯器會要求你先處理 `undefined`，也就是這次讀取沒有值的可能。誰有責任提供資料、誰有責任提供顯示備案，至此已經分得開來。

## 範例：保留 0，也保留空字串

沿用 `ts-lab`（見[〈tsconfig 與型別檢查〉](#/lesson/fs-ts-01-config)）的設定，將這段存成新的 `bins.ts`。在這個資料夾執行 `.\node_modules\.bin\tsc.cmd -p .`（macOS 或 Linux 用 `./node_modules/.bin/tsc -p .`），通過才執行 `node js/bins.js`。

```ts
type Bin = { code: string; count: number; note?: string };
const bins: Bin[] = [
  { code: "A2", count: 3, note: "待盤點" },
  { code: "B1", count: 0 }
];
function label(bin: Bin): string {
  return bin.code + " | " + bin.count + " | " + (bin.note ?? "未填");
}
for (const bin of bins) console.log(label(bin));
```

方括號表示陣列，`Bin[]` 要求每個元素都符合庫位形狀。`??` 在左邊是 `null` 或 `undefined` 時才取右邊的提示，因此有效數字 0 與空字串不會被當成缺少。先從輸出回推每個字串的來源，再故意去掉一筆的代碼看診斷。你會發現「未填」是展示時加上的字，不是程式偷偷把它寫回資料。

### 紙上盤點：缺一個欄位能否繼續？

拿一張紙分別遮住代碼、數量與備註。遮住代碼，兩筆同樣數量的資料可能無法分辨要貼在哪個庫位；遮住數量，你無法判斷是不需補貨，還是根本沒有盤點；遮住備註，標籤仍可辨識也能計算。這就是三個欄位的必填性不相同的實際理由。再假設輸入傳來的是數字外觀的字串，印在標籤上也許看不出差別，做加總時卻會出問題。欄位型別要照下一位使用者需要做的運算來設計，不能只依照螢幕上最後幾個字長得像什麼來決定。試著說出數量為 0 和從未盤點有何不同。

## 常見錯誤

為了讓錯誤消失，把所有欄位都改成選填，會把本來在建立資料時就看得見的問題推到每一個使用者身上。反過來，遇到可選值就用驚嘆號宣稱「一定有」，編譯器可能不吵了，資料卻沒有因此出現。需要預設值時，在真正能決定預設含義的地方補上它。

## 小結

建模先分清楚「不能缺」、「允許缺」與「有值但剛好是空」。欄位的型別寫在資料入口，缺值的呈現留給標籤；下次別的畫面想顯示不同提示，也不必修改原始庫位。
