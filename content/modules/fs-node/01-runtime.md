---
id: fs-node-01-runtime
module: fs-node
order: 1
title: Node.js 執行環境
subtitle: 同一份語言不一定有瀏覽器物件
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 辨認官方 Windows 安裝程式與 LTS 標示，確認 node 與 npm 版本
  - 在終端機執行單檔，比較 Node 與瀏覽器的可用物件
tags:
  - node
  - runtime
resources:
  - title: "Node.js：官方下載與 LTS 標示"
    url: https://nodejs.org/en/download
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
  - title: "Node.js：執行環境簡介"
    url: https://nodejs.org/en/learn/getting-started/introduction-to-nodejs
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-node-01-runtime-runtime
    prompt: "Node.js 在這個例子中扮演什麼角色？"
    answer: "它是在瀏覽器之外執行 JavaScript 的執行環境，提供適合本機工作的介面。"
    mcq:
      options:
        - "執行 JavaScript 的環境"
        - "一種不同於 JavaScript 的程式語言"
        - "瀏覽器中的文件樹"
        - "專門下載套件的清單檔"
      answer: 0
      explain: "語言與宿主不同；npm、DOM 也不是執行環境的同義詞。"
  - id: fs-node-01-runtime-host
    prompt: "同一個 typeof document 為何在瀏覽器與 Node 的輸出不同？"
    answer: "document 是網頁環境提供的介面，不是 JavaScript 語言必備的全域物件。"
    mcq:
      options:
        - "兩邊字串語法不同"
        - "一定是腳本副檔名不同造成"
        - "Node 只要切換模組語法就會提供 DOM"
        - "兩邊的宿主介面不同"
      answer: 3
      explain: "語言運算子相同，能找到的名稱由環境決定。"
    interview:
      question: "同一段算數程式在兩處正常，加入 document 就只剩一處能跑，如何解釋？"
      points:
        - "分開語言與環境提供的介面"
        - "用 typeof 在兩邊驗證"
        - "把共用運算與畫面操作分離"
      answer: "我會先用一個純運算函式確認語言行為一致，再比較 document 是否存在。DOM 是瀏覽器提供的，不是兩邊都保證有。我會把計算和更新畫面的程式分開，而不是替伺服器硬造一個頁面。"
  - id: fs-node-01-runtime-lts
    prompt: "新建一般學習專案，如何選官方 Windows 安裝程式？"
    answer: "在官方下載頁選目前 LTS 與適合電腦架構的 Windows Installer，再分別確認 node 與 npm。"
    mcq:
      options:
        - "只挑數字最大的預覽版"
        - "把 npm 版本當作 Node 版本"
        - "依 LTS 標示與系統架構選 MSI"
        - "只依檔名猜架構"
      answer: 2
      explain: "LTS 是維護路線，工具各有版本；單看最大數字不代表適合。"
practice:
  - id: fs-node-01-runtime-lab
    title: "建立自己的執行環境對照單"
    kind: hands-on
    minutes: 12
    steps:
      - "依正文確認官方安裝來源與 LTS 標示，記下 node 和 npm 各自版本。"
      - "執行 runtime.mjs，再於空白頁主控台輸入正文的比較式，留一份 runtime-notes.txt。"
    checks:
      - "Node 的 document 是 undefined；一般網頁主控台則是 object。"
      - "筆記分列 Node 版本、npm 版本與相同的加總結果。"
---

## 為什麼要學：一種語言，不只 1 種工作桌

瀏覽器裡的 JavaScript 能更新按鈕文字；把同一段程式放到終端機，可能立刻找不到 `document`。不是 JavaScript 突然換了一種語法，而是工作桌上的工具不同。執行環境（runtime）除了負責執行語言，還決定程式能向周圍的系統要求哪些服務。

## 核心概念：先確認要用哪個工具

Node.js 可以在沒有網頁的情況執行 JavaScript，適合讀取本機檔案、接收請求或處理一批資料；npm 是隨一般安裝程式附帶的套件管理工具（package manager），版本號不必相同。瀏覽器則提供文件物件模型（DOM）等頁面介面。兩者有部分重疊，例如都能使用計時器；別用「有計時器」當作判斷環境的唯一證據。

先在 PowerShell 輸入 `node --version` 與 `npm.cmd --version`（macOS 或 Linux 用 `npm --version`）。這兩個結果各自代表執行環境和套件管理工具，不必是同一個版號。若少了一個，回到[〈let 與 const 宣告〉](#/lesson/fs-js-01-variables)核對安裝入口。2026 年 11 月最新的 LTS 主線是 26；新專案以官網當時標示的長期支援版為準，不以這個數字當門檻。

若剛變更過環境，請開新終端機再比較這兩個版本。能在舊視窗看到之前的環境不代表安裝失敗，舊視窗可能尚未取得更新後的指令搜尋路徑。先確認目前實際找到的工具，再決定需不需要重新安裝。

## 範例：同時觀察共用語法與專屬物件

在練習區建立 `C:\dev\stackway-lab\node-lab`，把以下內容存成 `runtime.mjs`。副檔名明確表示 JavaScript 模組；在該目錄執行 `node runtime.mjs`。它不會啟動服務，印完就回到提示字元。

```js
const total = [2, 3].reduce((sum, n) => sum + n, 0);
console.log("total", total);
console.log("document", typeof document);
console.log("process", typeof process);
```

另開瀏覽器空白頁，按 F12 進入主控台（console），自行輸入 `[2,3].reduce((s,n)=>s+n,0)` 和 `typeof document`，比較結果。`typeof` 用來查看值的種類，對未宣告的這個名稱也能安全觀察。Node 會算出同樣的總數，但一般單檔執行沒有網頁文件；瀏覽器能找到文件，因為它正在承載一個頁面。

### 從版本輸出讀出有用的線索

若兩條命令中只有一條回報找不到指令，不等於剛寫的腳本有語法錯誤：腳本根本還沒開始跑。先把問題分成「系統是否找到命令」與「程式是否能算對」兩張紙條。前者在空目錄也能驗證，後者要進入放檔案的目錄再測。這樣交接時只需說是哪一步失敗，不必把整部電腦的私人環境資訊貼給別人。

## 常見錯誤

看到大於符號就把終端機指令貼進瀏覽器主控台，兩邊其實在解讀不同的輸入。若不小心只輸入 `node`，你會進入互動式 JavaScript 提示；輸入 `.exit` 返回系統的終端機，再以檔名啟動。不要為了讓 npm 在 PowerShell 執行而放寬整台電腦的安全設定，Windows 可直接用 `npm.cmd`。

## 小結

檢查版本回答「我在用哪個工具」，最小單檔回答「這個環境給了我什麼」。把環境專屬的操作與可共用的資料運算分開，程式才容易在另一張工作桌上重用。
