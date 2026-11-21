---
id: fs-ts-03-interfaces
module: fs-ts
order: 3
title: 介面與型別別名
subtitle: 讓兩個函式共用同一種資料形狀
status: ready
minutes: 30
level: 3
prereqs:
  - fs-ts-01-model
objectives:
  - 用 interface 與 type 描述同一物件
  - 區分可選欄位、唯讀欄位與必填欄位
tags:
  - ts
  - interfaces
resources:
  - title: "TypeScript：物件型別"
    url: https://www.typescriptlang.org/docs/handbook/2/objects.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-ts-03-interfaces-shape
    prompt: "呼叫要求有 code 與 count 的函式時，物件一定要以同一個型別名稱宣告嗎？"
    answer: "不必，結構相容即可；型別名稱不是通行證。"
    mcq:
      options:
        - "不必，核對結構"
        - "一定要相同名稱"
        - "一定要用 class 建立"
        - "一定要先加上同名的型別斷言"
      answer: 0
      explain: "重點在欄位的名稱與型別是否符合用途。"
    interview:
      question: "兩個函式都需要庫位資料，你會共用哪種宣告？"
      points:
        - "找出兩個函式真正需要的欄位"
        - "兩種宣告都可描述物件"
        - "區分選填與唯讀的用途"
      answer: "我會先定義一份共用的庫位形狀，代碼必填且唯讀，標籤可省略。單純物件用 interface 或 type 都行；讓兩個函式引用它，比各抄一份欄位再祈禱不會走樣可靠。"
  - id: fs-ts-03-interfaces-readonly
    prompt: "透過 readonly code 的參數寫回 code，會在哪裡被攔住？"
    answer: "在型別檢查時被攔住；readonly 本身不會凍結執行中的物件。"
    mcq:
      options:
        - "等到執行 JavaScript 指派時才攔住"
        - "第一次讀唯讀欄位時"
        - "序列化 JSON 時"
        - "型別檢查時"
      answer: 3
      explain: "readonly 約束這個型別視角的寫入，不是執行時鎖。"
  - id: fs-ts-03-interfaces-choice
    prompt: "為一個字串或數字的聯集取名，要選 interface 還是 type？"
    answer: "用 type；interface 適合描述物件形狀，並非所有型別運算式都能用它表達。"
    mcq:
      options:
        - "只能用 interface"
        - "兩者都只能描述類別"
        - "type"
        - "必須先建立實例"
      answer: 2
      explain: "type 可以命名聯集；描述單純物件時兩種都常見。"
practice:
  - id: fs-ts-03-interfaces-lab
    title: "做兩個共用庫位形狀的函式"
    kind: code
    minutes: 12
    steps:
      - "存入 card.ts 並執行，再把介面版本換成正文給的別名版本。"
      - "暫時在 caption 裡寫入 code 測試診斷，記下位置後還原。"
    checks:
      - "兩種宣告都會得到相同的標籤與數量。"
      - "唯讀欄位不能透過這個參數改寫；缺少 hint 仍能通過。"
---

## 為什麼要學：同一筆資料，不想改 2 份規格

一個函式印庫位標籤，一個函式計算補貨量。若兩邊在參數位置各自手寫全部欄位，將來想替代碼加上不可改寫的限制，總有機會漏改一邊。把共同形狀取一個名字並讓兩個函式引用它，目的不是用更漂亮的語法，而是讓約定只有一份。

## 核心概念：介面與別名都能說明物件

介面（interface）列出物件應具備哪些成員。型別別名（type alias）則是替一段型別運算式取名字，物件也可以是那段運算式。這堂用的是兩者重疊的範圍。TypeScript 採用結構型別（structural typing）：能否交給函式取決於實際結構是否相容，不是取決於你有沒有在建立值時念出指定名稱。

`readonly` 是唯讀欄位，意思是透過這個宣告不能再指派；`?` 是允許缺欄位。兩者回答不同問題。代碼可以必須存在且不許被展示函式改掉；備註可以缺少，卻仍可在其他合法的編輯介面中變動。只用一句「這是不可變物件」無法準確解釋這兩種約束。

## 範例：同一張卡，一份拿來印，一份拿來算

在 `ts-lab`（見[〈tsconfig 與型別檢查〉](#/lesson/fs-ts-01-config)）建立 `card.ts`，依前堂方式從此目錄執行 `.\node_modules\.bin\tsc.cmd -p .`，其他系統用 `./node_modules/.bin/tsc -p .`；接著執行 `node js/card.js`。

```ts
interface Card {
  readonly code: string;
  count: number;
  hint?: string;
}
function caption(card: Card) {
  return card.code + " " + (card.hint ?? "一般格");
}
function missing(card: Card) {
  return Math.max(0, 5 - card.count);
}
const item = { code: "A2", count: 3 };
console.log(caption(item), missing(item));
```

輸出應包含代碼、提示與還差的數量。`item` 並沒有註記 `Card`，它仍能交給兩個函式，因為必填欄位都在而且型別相符。現在只把整段介面宣告換成 `type Card = { readonly code: string; count: number; hint?: string };`，其餘完全不改，再次檢查與執行。你驗證的是兩種寫法在這個物件上的作用，而不是宣稱兩者所有用法都一模一樣。

### 一筆資料可以有不同的使用視角

庫位卡除了代碼與數量，也許還保存上次盤點日期。如果你從變數把一張完整的卡交給顯示函式，函式只需要根據它宣告過的欄位工作，並不需要把其餘欄位刪掉。相反地，若一張卡只有代碼，印標籤也許勉強能做，計算補貨量卻少了關鍵資料。這時不必硬把缺少的數量填成 0；可以重新評估兩個函式是否真的應共用整份宣告，或是拆出較小的基本形狀。共用的理由應該是需求真的重疊，不是兩個東西剛好都被叫作卡片。

## 常見錯誤

把別名和同名介面同時貼進來，會產生重複宣告，不是比較成功。對唯讀欄位的要求也不要誇大：檢查器限制的是此處的使用方式，不會在輸出的 JavaScript 自動凍結物件，更不是替巢狀資料加上深層保護。若程式真的需要執行時防改，必須另外設計。

## 小結

共用形狀是為了避免契約分岔。描述物件時先依專案慣例選一種；若要替多種可能的值取一個名字，別名也能表達聯集。之後在[〈聯集型別與狀態〉](#/lesson/fs-ts-02-union)會把這種用途用在畫面上。
