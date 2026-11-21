# 棧道 Stackway

從零開始、以求職為目標的全端開發（Full-Stack）與 AI 基礎設施（AI Infra）學習工具。在本機執行，進度存在你自己的電腦上。

- 49 個模組、373 堂課（約 194 小時），另有 8 個作品集專案
- 每天可以按時間或堂數決定學多少
- 收工時選隔天的複習方式：閃卡回想、選擇題、面試問答、動手練習或混合
- 用 FSRS 間隔重複演算法安排複習；還有學習地圖、面試題庫、作品集和統計頁

## 第一次使用

需要 [Node.js](https://nodejs.org/)（18 以上，建議用目前的 LTS）。

```powershell
npm install
```

之後每次使用時，按兩下 `啟動棧道.cmd`。它會在需要時自動重新建置，並開啟 http://127.0.0.1:4318 。使用期間請讓命令視窗保持開啟。

完整說明見 [使用說明.md](使用說明.md)，app 裡的「使用說明」頁也有同樣內容。

## 開發

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 開發伺服器 |
| `npm run build` | 建置教材與前端到 `dist/` |
| `npm run check` | 型別檢查、測試、教材驗證與建置檢查 |
| `npm run check:content` | 只驗證 `content/` 的教材格式 |

目錄結構：

- `content/`：教材（YAML + Markdown），包括路線、模組、課程、作品集專案和面試題
- `src/`：前端（Vite + React + TypeScript，Dexie / IndexedDB，ts-fsrs）
- `server/serve.mjs`：本機伺服器，提供 `dist/` 並把進度自動存到 `userdata/`
- `research/`：職缺市場研究與課程設計依據
- `tools/`、`tests/`、`fixtures/`：建置腳本、測試和測試用教材

學習進度存在 `userdata/` 和瀏覽器裡，不會放進 Git。
