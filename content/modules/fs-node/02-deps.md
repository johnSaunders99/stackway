---
id: fs-node-02-deps
module: fs-node
order: 2
title: npm 與套件鎖定
subtitle: 重新安裝也要得到相同依賴
status: ready
minutes: 30
level: 3
prereqs:
  - fs-node-01-runtime
objectives:
  - 辨認 package.json 的 scripts 與 dependencies
  - 用鎖定檔說明 npm install 與 npm ci 的使用時機
tags:
  - node
  - deps
resources:
  - title: "npm：package.json 欄位"
    url: https://docs.npmjs.com/cli/v11/configuring-npm/package-json
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: "npm：使用鎖定檔重建依賴"
    url: https://docs.npmjs.com/cli/v11/commands/npm-ci
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-node-02-deps-manifest
    prompt: "package.json 的 scripts 與 dependencies 分別寫什麼？"
    answer: "scripts 記錄命名指令，dependencies 記錄執行依賴的套件與版本要求。"
    mcq:
      options:
        - "前者記解析樹，後者記輸出結果"
        - "前者是指令，後者是套件需求"
        - "前者記套件需求，後者記啟動命令"
        - "兩者都記已解析的確切安裝結果"
      answer: 1
      explain: "需求清單不等於解析後的確切安裝樹，也不負責保存執行結果。"
  - id: fs-node-02-deps-lock
    prompt: "package-lock.json 比版本範圍多說了什麼？"
    answer: "記錄一次解析出的依賴樹，包括間接依賴與取得套件所需的資訊。"
    mcq:
      options:
        - "實際解析出的依賴樹"
        - "所有環境都能執行的保證"
        - "每位使用者的安裝路徑"
        - "source code 中實際匯入過哪些函式"
      answer: 0
      explain: "鎖定的是解析結果，不保證不同平台或執行環境的行為完全相同。"
  - id: fs-node-02-deps-ci
    prompt: "清單與鎖定檔不一致時，npm ci 怎麼做？"
    answer: "停止並回報不一致，不會擅自重寫鎖定檔來配合新需求。"
    mcq:
      options:
        - "猜一個新版本繼續"
        - "只忽略間接依賴"
        - "自動更新兩個檔案"
        - "失敗並要求先同步"
      answer: 3
      explain: "ci 是重建既定結果，改依賴的步驟應由維護者另行完成。"
    interview:
      question: "乾淨環境不能重建同事電腦上的版本，你會先核對什麼？"
      points:
        - "確認清單與鎖定檔成對"
        - "使用相容 Node、npm 與安裝選項"
        - "重建用 ci，改依賴才更新鎖定檔"
      answer: "我會先核對兩份檔案是否來自同一次變更，並比對執行環境和安裝選項。重建時用 ci，不讓環境自行選新版；若需求真的變了，才在開發環境更新並交付兩份檔案。"
practice:
  - id: fs-node-02-deps-lab
    title: "做一個不靠第三方套件也能重建的專案"
    kind: build
    minutes: 12
    steps:
      - "在空白 lock-lab 建立 package.json 與 summary.mjs，依正文產生鎖定檔。"
      - "執行 ci 與命名指令，分別打開兩個 JSON 檔，將它們回答的問題寫入 lock-notes.txt。"
    checks:
      - "命名指令印出 5，ci 沒有要求重選版本。"
      - "我能指出 scripts 的入口，以及鎖定檔中根套件的紀錄。"
---

## 為什麼要學：同一份程式，明天還要裝得回來

收到專案時通常不會收到整個套件目錄，因為那是能重建的材料。真正要交接的是兩張表：專案需要哪些東西，以及上次把這些需求解析成了哪個組合。光留「大概是這個版本」不夠，光留裝好的資料夾也很難判斷當初為什麼要裝。

## 核心概念：需求清單對照實際採用的結果

`package.json` 是專案描述檔（manifest）。`scripts` 把常用命令取名字，`dependencies` 描述程式運作需要的套件與版本要求。開發才需要的工具則可放在 `devDependencies`。若需求允許一段版本範圍，不同時間重新解析，符合條件的最新組合可能不同；直接依賴的套件也可能再依賴其他套件。

鎖定檔（lockfile）`package-lock.json` 記錄解析結果，而不是另一份手寫願望清單。`npm install` 適合開發時新增或調整依賴，會依需要同步鎖定檔；在已有相符鎖定檔時，也不是每次都拋棄它選新版本。`npm ci` 則要求既有的清單與鎖定檔一致，會先移除專案中既有的 `node_modules` 再依鎖定結果重建。只在能重新安裝的專用資料夾使用，不把手寫作品放在套件目錄裡。

## 範例：沒有第三方依賴也有可重建的入口

在練習區建立全新的空資料夾 `C:\dev\stackway-lab\lock-lab`。把下段保存成 `package.json`；名稱使用一般小寫識別字，`private` 表示這不是要發布的套件。空的依賴清單是刻意的，這次不用下載任何第三方程式。

```json
{
  "name": "lock-lab", "version": "1.0.0", "private": true,
  "scripts": { "summary": "node summary.mjs" },
  "dependencies": {}
}
```

同目錄新增 `summary.mjs`。再從這個目錄開啟 PowerShell，執行接在下方的命令；macOS 或 Linux 把 `npm.cmd` 換成 `npm`。

```js
const counts = [2, 3];
console.log(counts.reduce((a, b) => a + b, 0));
```

```powershell
npm.cmd install --package-lock-only --ignore-scripts --no-audit --no-fund
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd run summary
```

第一條只產生或同步鎖定檔，第二條依鎖定結果重建，第三條才真正執行你取名的命令。開啟鎖定檔找根套件的紀錄，再打開描述檔找執行入口。這個例子沒有間接套件，所以清單很短；之後在[〈Express 路由與中介軟體〉](#/lesson/fs-node-04-express)加入套件時，就能看到增加一項需求如何帶來多筆解析結果。

### 要重建，還是要改版？

想像兩張工單，一張說昨天能跑、今天要在乾淨目錄重現；另一張說要引入新的套件。前者需要可比較的條件，不該同時改需求；後者本來就需要產生新的解析結果，不能要求舊的鎖定檔先知道你的決定。把這兩張工單分開做，發生問題時才分得出是環境不符，還是這次變更本身帶來的差異。

## 常見錯誤

遇到重建失敗就刪掉鎖定檔，等於丟掉重要線索，可能暫時裝得起來卻換了一整套版本。先比對兩份檔案是否同步、環境版本與安裝選項是否一致。也不要把成功安裝誤當成功執行；要再跑專案命令確認入口、程式檔與預期結果相符。

## 小結

改需求時更新清單與鎖定檔，重建時遵守既定結果。看得懂命名指令如何接到本機檔案，比只記住「每次都打哪一條」更能解決交接問題。
