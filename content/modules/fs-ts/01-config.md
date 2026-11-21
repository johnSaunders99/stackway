---
id: fs-ts-01-config
module: fs-ts
order: 1
title: tsconfig 與型別檢查
subtitle: 先讓編譯器抓到一個真錯誤
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 為小型專案啟用 strict 並辨識診斷位置
  - 區分型別檢查、輸出 JavaScript 與執行程式
tags:
  - ts
  - config
resources:
  - title: "TypeScript：tsconfig.json"
    url: https://www.typescriptlang.org/docs/handbook/tsconfig-json.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: "TypeScript：在專案內安裝編譯器"
    url: https://www.typescriptlang.org/download/
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-ts-01-config-check
    prompt: "strict 型別檢查是在何時檢查呼叫是否符合宣告？"
    answer: "在開發或建置時檢查原始碼，不需先執行有問題的那條路徑。"
    mcq:
      options:
        - "使用者點按鈕時才檢查"
        - "只有印字時"
        - "檢查原始碼時"
        - "每次讀取網路回應時"
      answer: 2
      explain: "靜態診斷不等於執行階段的資料驗證。"
  - id: fs-ts-01-config-project
    prompt: "要依照指定 tsconfig 檢查整個小專案，應如何呼叫 tsc？"
    answer: "使用 -p 指向設定檔所在資料夾，不另外指定單一原始檔。"
    mcq:
      options:
        - "node tsconfig.json"
        - "tsc -p ."
        - "node main.ts --strict"
        - "tsc --version"
      answer: 1
      explain: "版本查詢與執行程式都不會按專案設定進行完整檢查。"
  - id: fs-ts-01-config-emit
    prompt: "--noEmit 通過後，為何不一定能立刻執行 js/main.js？"
    answer: "只檢查不產生檔案，要先執行有輸出的編譯，並留意是否是舊產物。"
    mcq:
      options:
        - "這次沒有產生 JavaScript"
        - "檢查會把舊的輸出移到別處"
        - "檢查會直接更新原始檔而不是輸出檔"
        - "第一次用 node 讀取時才會自動填好輸出目錄"
      answer: 0
      explain: "沒有診斷只表示檢查通過，不表示已有本次輸出。"
    interview:
      question: "終端機說型別錯誤，旁邊的程式卻還能跑，怎麼解釋？"
      points:
        - "釐清檢查與執行的輸入"
        - "確認是否拿舊輸出執行"
        - "用專案設定重查再產生新檔"
      answer: "我會先看執行的是哪份 JavaScript。noEmitOnError 阻止產生新的錯誤版本，不保證清掉上次輸出。我會先修正原始碼、用相同設定檢查，再執行剛編譯的檔案。"
practice:
  - id: fs-ts-01-config-lab
    title: "保留一組能抓錯也能輸出的專案"
    kind: code
    minutes: 13
    steps:
      - "在新的 ts-lab 建立專案設定與 main.ts，依正文取得型別錯誤。"
      - "移除字串引號，再依序檢查、輸出與執行；在 ts-notes.txt 記下診斷位置。"
    checks:
      - "錯誤位置指向傳錯型別的引數。"
      - "修正後只檢查能通過，另行編譯執行會印出 6。"
---

## 為什麼要學：數字看起來一樣，做起事卻不同

2 份材料每份有 3 張，程式把 2 份相加，卻印出 33。資料進來時是文字，不是數字，JavaScript 依規則把它們接在一起。與其等畫面出錯才找哪個引號多了，不如先把參數該是什麼說清楚，讓 TypeScript 在執行之前發現這個呼叫違反約定。

## 核心概念：設定、檢查、產生、執行

型別（type）描述允許的值與操作，靜態檢查（static checking）是根據原始碼判斷它們是否相容。`tsc` 是編譯器（compiler），可以檢查 TypeScript 並輸出 JavaScript；Node.js 則是執行程式的環境；編譯器與執行環境為何分工，見[〈Node.js 執行環境〉](#/lesson/fs-node-01-runtime)。執行得動、通過型別檢查、已產生新檔案，這是三個不同的判斷。

在練習區新建 `C:\dev\stackway-lab\ts-lab`，從該空目錄開啟 PowerShell。若找不到 Node.js，回到[〈let 與 const 宣告〉](#/lesson/fs-js-01-variables)完成一次安裝。隨附的 npm 是套件管理工具；這裡先用它把編譯器放進專案，依賴清單和鎖定檔見[〈npm 與套件鎖定〉](#/lesson/fs-node-02-deps)。以下只把編譯器裝到練習專案，不更動全域工具。macOS 或 Linux 將 `npm.cmd` 換成 `npm`。

```powershell
npm.cmd init -y
npm.cmd install --save-dev typescript
```

在這個資料夾存入 `tsconfig.json`。`strict` 開啟嚴格檢查，`include` 選這一層的原始檔，`outDir` 指定輸出資料夾。每個檔案各有自己的名稱範圍，後面幾堂可以留下作品而不必反覆覆寫。`types` 留空，這些範例不需要額外的型別套件。

```json
{
  "compilerOptions": {
    "strict": true, "target": "ES2022", "module": "NodeNext",
    "moduleDetection": "force", "rootDir": ".", "outDir": "js",
    "types": [], "noEmitOnError": true
  },
  "include": ["*.ts"]
}
```

## 範例：先安排一次可解釋的失敗

新增 `main.ts`。冒號後的 `number` 是對呼叫者的要求，不是自動轉換函式。最後一行的錯誤是刻意保留的測試，先別改。

```ts
function double(n: number) { return n + n; }
console.log(double("3"));
```

在 `ts-lab` 執行 `.\node_modules\.bin\tsc.cmd -p . --noEmit`；macOS 或 Linux 用 `./node_modules/.bin/tsc -p . --noEmit`。看診斷指向的檔名、行與欄，讀出意思：函式要數字，呼叫的地方卻給字串。把 `"3"` 改成 `3` 後重查；通過時通常沒有輸出，不代表多了一個檔案。

接著用同一條命令拿掉 `--noEmit`，才會產生 `js/main.js`；從原目錄執行 `node js/main.js` 應印出 6。打開產物找找看，參數上的型別標記已經不在。記下這個檢查與執行順序，下堂課會沿用它。

### 把那個 33 解開來看

若把第一版程式當一般 JavaScript 執行，引號使加號左右都拿到字串，得到的是兩個字元接在一起。正確修法取決於輸入從哪裡來：如果你自己寫下固定數量，就應該從呼叫處給數字；如果實際來自文字輸入欄，應該在入口先確認文字代表合法數字，再轉換後呼叫。把函式參數放寬，讓字串也能通過，雖然畫面上的紅線消失了，原來「數量要加總」的承諾卻失守了。先說明這筆資料該代表什麼，再決定要改值還是改型別。

## 常見錯誤

不要只改輸出的檔案；下次編譯會把它換掉。也不要把最末次執行成功當成這次原始碼沒問題：編譯失敗並不會自動移除上次成功產生的舊檔。先讓檢查通過，再輸出與執行，才知道目前看到的是哪一版。

## 小結

即使沒有開嚴格模式，這次明確傳錯引數也會得到診斷；別用它來判斷嚴格模式是否啟用。想單獨看到嚴格模式的效果，可以暫時拿掉參數的 `: number`，沒有其他資訊能推論它時，會多出參數隱含為 `any` 的診斷。看過後把註記放回來。

遇到診斷，先找位置，再核對值與宣告，不要直接關掉嚴格檢查。編譯器提供的是程式內可推論的保證，外部資料是否真的守約，之後在[〈型別收窄與 unknown〉](#/lesson/fs-ts-03-narrow)會細講。
