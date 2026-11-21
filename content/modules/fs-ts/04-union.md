---
id: fs-ts-02-union
module: fs-ts
order: 4
title: 聯集型別與狀態
subtitle: 用聯集表示載入狀態
status: ready
minutes: 30
level: 3
prereqs:
  - fs-ts-03-interfaces
objectives:
  - 分別描述等待、失敗、成功
  - 讓狀態決定可讀取的欄位
tags:
  - ts
  - union
resources:
  - title: "TypeScript：型別收窄"
    url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-ts-02-union-variant
    prompt: "載入、成功、失敗三種畫面同一時間只能有一種，適合用什麼表示？"
    answer: "用由三種形狀組成的聯集，每種攜帶自己的必要資料。"
    mcq:
      options:
        - "三個可任意組合的布林旗標"
        - "三個互斥的變體"
        - "所有欄位都改 any"
        - "所有欄位都用空字串"
      answer: 1
      explain: "聯集讓標記與資料一起出現，不用處理互相矛盾的旗標。"
    interview:
      question: "畫面同時顯示轉圈與錯誤，型別設計怎樣幫得上忙？"
      points:
        - "指出獨立旗標可矛盾"
        - "用固定標記連結專屬欄位"
        - "以合法變體測空成功與失敗"
      answer: "我會把狀態改成一個辨識聯集，載入不用攜帶錯誤，成功一定有清單，失敗一定有原因。顯示函式先看標記，再讀分支裡的欄位，這樣不必猜哪個旗標優先。"
  - id: fs-ts-02-union-tag
    prompt: "辨識聯集中的共同 kind 欄位要有什麼特性？"
    answer: "各成員都具備它，且使用能區分成員的字面值。"
    mcq:
      options:
        - "每種成員有不同固定值"
        - "每種成員都是任意 string"
        - "只有成功時才有 kind"
        - "每次讀取都隨機產生"
      answer: 0
      explain: "共同欄位本身不足以區分，值也要能指出是哪種成員。"
  - id: fs-ts-02-union-branch
    prompt: "為何只在 ready 分支能直接讀 rows？"
    answer: "檢查標記後，可能型別收窄到包含 rows 的成員。"
    mcq:
      options:
        - "switch 會自動建立資料"
        - "失敗狀態也保證有 rows"
        - "聯集會複製所有欄位"
        - "該分支已收窄為成功狀態"
      answer: 3
      explain: "檢查改變已知資訊，不會替物件補欄位。"
  - id: fs-ts-02-union-empty
    prompt: "空陣列與錯誤為什麼不用同一個狀態？"
    answer: "空陣列表示取得了合法結果，只是沒有項目；錯誤則表示沒有成功取得可用結果。"
practice:
  - id: fs-ts-02-union-lab
    title: "把查詢頁合法畫面逐一列出"
    kind: code
    minutes: 12
    steps:
      - "建立 view.ts，以範例的三個狀態產生文字。"
      - "再加入一個成功但有項目的狀態，另試故意漏掉 rows 的成功值。"
    checks:
      - "空清單顯示 0 筆，和失敗訊息不同。"
      - "缺 rows 的成功值會被拒絕，恢復完整後編譯可通過。"
---

## 為什麼要學：載入中與失敗不該同時成立

假設畫面用兩個開關，一個代表正在讀取，一個代表失敗。它們可以同時為真，還能在兩者都為假時沒有任何資料。每次顯示都得臨時決定「現在到底是什麼」。如果需求明明只有等待、成功、失敗，不如直接把三種合法狀態寫進型別，不讓不合理的組合有立足之地。

## 核心概念：先選其中一種，再讀屬於它的資料

聯集型別（union type）用直線符號把多種可能連起來，表示值是其中一種，而不是三種都要具備。辨識聯集（discriminated union）更進一步：每種形狀都有同名標記，但用不同的字面值（literal）標出身分。`"ready"` 在型別的位置只接受這一個字，不像 `string` 接受任意字串。

等待時不需要清單，成功時一定有清單，失敗時一定有原因。它們共享 `kind`，所以還不知道狀態時可以先讀它。用條件判斷縮小範圍後，編譯器就知道目前形狀的其他欄位。這個過程叫收窄（narrowing），不會真的搬動或轉換資料；下一堂[〈型別收窄與 unknown〉](#/lesson/fs-ts-03-narrow)會用它檢查還不認識的外部值。

## 範例：讓渲染函式只接合法狀態

將以下內容存成 `ts-lab/view.ts`。從專案資料夾執行 `.\node_modules\.bin\tsc.cmd -p .`（其他系統使用 `./node_modules/.bin/tsc -p .`），通過後執行 `node js/view.js`。

```ts
type View =
  | { kind: "loading" }
  | { kind: "ready"; rows: string[] }
  | { kind: "failed"; reason: string };

function message(v: View): string {
  switch (v.kind) {
    case "loading": return "讀取中";
    case "ready": return v.rows.length + " 筆";
    case "failed": return "失敗：" + v.reason;
  }
}
const cases: View[] = [
  { kind: "loading" }, { kind: "ready", rows: [] },
  { kind: "failed", reason: "找不到檔案" }
];
for (const v of cases) console.log(message(v));
```

結果為 0 筆不是失敗。資料已經回來且符合契約，只是沒有項目；若想讓空結果使用不同文字，請在成功分支檢查長度，別冒用失敗標記。試著把讀取清單長度的那行移到判斷前面，看看編譯器為什麼拒絕。你可以直接指出一個反例：正在等待時物件上根本沒有清單可讀。

### 多一種畫面，從哪裡發現遺漏？

想像產品新增了「使用者已取消」狀態。它既不是等待，也不是失敗，因此可加一個新的標記，不必捏造錯誤原因。若先在聯集中加入這個成員，而展示函式忘了更新，函式承諾的回傳值明明是字串，有一條路卻走到底仍沒有回傳，嚴格檢查就能提醒你。修法是說清楚取消狀態要顯示什麼，不是把回傳型別放寬到什麼都能接受。這個例子說明編譯器能協助的不只是欄位拼字，也包括讓每種合法畫面都能走到一個具體結果。

## 常見錯誤

把三個分支合併成一個大物件，清單與原因一律選填，等於放棄了「標記選擇資料」這層保證。另一個錯誤是把共同標記寫成任意字串；寫錯一個字母也能傳入，判斷就不再完整。保留固定值清單，新增狀態時才知道需要擴充哪些分支。

## 小結

設計狀態不是替每個欄位配上一個開關，而是列出使用者真正可能看到的幾種畫面。能說明空成功與失敗的差別，就能說明為何資料要跟著標記一起走。
