---
id: fs-ts-05-contract
module: fs-ts
order: 8
title: API 資料契約與型別
subtitle: 換掉 API 欄位後誰會壞
status: ready
minutes: 35
level: 3
prereqs:
  - fs-ts-07-utility
objectives:
  - 根據編譯訊息找出受影響的呼叫端
  - 保留舊資料直到轉換完成
tags:
  - ts
  - contracts
resources:
  - title: "TypeScript：型別收窄"
    url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: "TypeScript：物件型別"
    url: https://www.typescriptlang.org/docs/handbook/2/objects.html
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-ts-05-contract-boundary
    prompt: "外部欄位改名時，為何在入口加轉接函式？"
    answer: "讓新舊輸入在入口轉成單一內部模型，畫面不必各自猜版本。"
    mcq:
      options:
        - "讓舊用戶端自動升級，不再需要辨識版本"
        - "集中版本差異"
        - "讓展示函式能交替猜測兩種欄名"
        - "略過缺值檢查"
      answer: 1
      explain: "入口吸收差異，內部可以維持同一份約定。"
  - id: fs-ts-05-contract-diagnostic
    prompt: "編譯錯誤能指出哪些舊欄位用法？"
    answer: "能指出納入檢查且具有相關型別的呼叫端；無法保證外部保存的舊資料已更新。"
    mcq:
      options:
        - "有納入型別檢查的使用處"
        - "所有使用者磁碟上的檔案"
        - "所有其他服務的新版本"
        - "每次未知輸入的內容"
      answer: 0
      explain: "靜態範圍有邊界，仍需以新舊實際輸入驗證。"
  - id: fs-ts-05-contract-migration
    prompt: "要同時支援舊格式並保留原始資料，應如何轉換？"
    answer: "辨認版本並驗證必要欄位，建立新模型，不直接覆寫原始資料。"
    mcq:
      options:
        - "直接改寫唯一原件"
        - "無條件把未知欄位改名"
        - "替每個缺欄位都填空字串"
        - "驗證後建新物件"
      answer: 3
      explain: "保留原件可以重跑與比對；空字串可能掩蓋不支援的格式。"
    interview:
      question: "服務要把 label 改叫 title，舊匯出檔還有人會用。你如何安排？"
      points:
        - "界定接受的舊版與新版"
        - "入口驗證轉接、內部維持單一形狀"
        - "保留原件並測兩版與未知版"
      answer: "我會先讓讀取入口同時接受兩種已知版本，轉成同一個內部 title，畫面只讀內部模型。保留原始輸入，拿舊檔、新檔和未知版本測試。確認沒有舊讀者需要支援，再另行決定退場時間。"
practice:
  - id: fs-ts-05-contract-lab
    title: "做一座不改寫原始資料的版本轉接器"
    kind: code
    minutes: 15
    steps:
      - "儲存 bridge.ts，為兩個版本各留一個可重跑案例，再加入未知版。"
      - "把 present 中的 title 暫改為 label，找出診斷位置並修回；保留原始與轉換後輸出。"
    checks:
      - "舊版與新版都得到可讀標籤，未知版被拒絕。"
      - "處理後原始第一筆仍有 label，不會被覆寫成 title。"
---

## 為什麼要學：今天改 API，昨天的檔案不會跟著改

庫位服務準備把顯示名稱從 `label` 改成 `title`，但昨天匯出的備份仍然使用舊名。應用程式介面（application programming interface，API）的資料契約（contract）不只是「我喜歡這個欄位名」；它是在約定哪些資料可進來、對方可以依靠什麼，以及改動會影響誰。

## 核心概念：外面的版本與裡面的模型分開

把讀取入口想成轉接櫃檯。舊單用一個欄名，新單用另一個，櫃檯先確認單子的版本與必要欄位，再開出一張內部統一格式的卡。畫面、排序和列印只處理卡片，沒有必要在每一個畫面都寫一份版本判斷。未來要停收舊單，只需重新評估入口契約，而不是逐頁猜哪裡還留著舊邏輯。

型別檢查能追蹤程式裡受檢查的使用處，不能替你查看世界上所有舊檔案。真實入口先接 `unknown`，以辨識欄位收窄，再建立新物件。保留原件的好處是轉換寫錯時仍能回頭比對，而不是在唯一的那份資料上接連做更多修補。

## 範例：舊單、新單給同一個展示函式

在 `ts-lab`（見[〈tsconfig 與型別檢查〉](#/lesson/fs-ts-01-config)）存成 `bridge.ts`，從此處以 `.\node_modules\.bin\tsc.cmd -p .` 編譯，其他系統用 `./node_modules/.bin/tsc -p .`；通過後執行 `node js/bridge.js`。

```ts
type Item = { title: string };
function adapt(v: unknown): Item | undefined {
  if (!v || typeof v !== "object" || !("version" in v)) return;
  if (v.version === 1 && "label" in v && typeof v.label === "string")
    return { title: v.label };
  if (v.version === 2 && "title" in v && typeof v.title === "string")
    return { title: v.title };
}
function present(item: Item) { return item.title; }
const originals = [{ version: 1, label: "舊格" }, { version: 2, title: "新格" },
                   { version: 3, title: "未知格式" }];
for (const raw of originals) {
  const item = adapt(raw);
  console.log(item ? present(item) : "拒絕", JSON.stringify(raw));
}
```

核對第一行：畫面拿得到名字，原始物件卻仍保有舊欄位。第三筆看起來也有標題，但版本不在已知契約中，拒絕比猜對方的意思更可靠。再故意讓展示函式讀舊欄位，編譯器會把問題指到呼叫鏈內的使用位置，不需要真等某位使用者開啟那張卡。

### 怎樣知道轉接已經完成，而不是只改好畫面？

舊備份能讀是第一關，新資料輸出是另一關。先記下讀舊備份後應顯示的標題，再把得到的內部模型交給原本的展示函式，看它是否和讀新版走同一條路。若畫面顯示正確，卻在轉換時直接把舊檔改寫了，第一關仍少了一個重要保證：失敗時不能重來。因此驗收時還要看來源是否保持原形。對更新程式無法掌握的其他讀者，例如仍在閱讀舊格式的匯入工具，單靠這份編譯結果也不能宣告相容；要先確認它們的輸入約定，再決定何時切換寫出格式。

## 常見錯誤

為了讓兩邊都能通過，讓內部的舊欄與新欄同時選填，反而允許兩欄都缺的狀態，也把轉接責任推給每個畫面。另一個陷阱是剛寫好新版就刪除舊資料，讓驗證與回復都失去基準。保留相容讀取和決定何時停止支援，是兩個不同決策。

## 小結

先指出契約邊界，再用編譯診斷找程式內的影響，用真實形狀的舊版與新版案例找資料面的影響。兩邊都有證據，才算完成一次可交接的欄位演進。
