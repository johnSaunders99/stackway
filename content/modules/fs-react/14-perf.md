---
id: fs-react-14-perf
module: fs-react
order: 14
title: React 渲染與效能量測
subtitle: 先找到重繪來源，再決定是否快取
status: ready
minutes: 35
level: 3
prereqs:
  - fs-react-13-hooks
objectives:
  - 用 Profiler 比較一次操作前後的提交
  - 解釋哪些元件值得再評估記憶化
tags:
  - react
  - perf
resources:
  - title: React：Profiler 元件
    url: https://react.dev/reference/react/Profiler
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 對照回呼的階段與實際渲染耗時。
  - title: React：memo 與略過渲染
    url: https://react.dev/reference/react/memo
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: "2026-11-20"
    note: 判斷何時值得評估記憶化。
concepts:
  - id: fs-react-14-perf-metric
    prompt: Profiler 的 actualDuration 衡量什麼，不包含什麼？
    answer: 衡量這次為被包子樹渲染所花的時間，不是整段互動延遲或網路耗時。
    mcq:
      question: 紀錄顯示渲染耗時很小，但畫面仍慢，合理結論是？
      options:
        - 使用者一定感覺很快
        - 要另查網路、佈局或其他區段
        - 網路一定沒有延遲
        - 應立刻記憶化每個元件
      answer: 1
      explain: 監測範圍小於完整互動，單一數值不能排除其他瓶頸。
  - id: fs-react-14-perf-comparison
    prompt: 比較有無記憶化，哪些條件該固定？
    answer: 同操作、同資料量與環境，區分掛載和更新，觀察多次可比的提交。
    mcq:
      question: 切換勾選框造成 Rows 換成 StableRows，那一筆適合和什麼比較？
      options:
        - 不要混入單純點計數的更新樣本
        - 直接當成所有更新的平均
        - 只拿來和最慢的一次點擊比
        - 當作網路延遲基準
      answer: 0
      explain: 換型別包含重新掛載的不同工作，不是同一操作。
    interview:
      question: 同事希望直接替所有元件加 memo，你怎樣提出一個小實驗？
      points:
        - 界定同一個互動
        - 量測可疑子樹而非整站臆測
        - 比較多次更新與正確性
      answer: 我先量只動計數時清單那棵子樹。切換記憶化後略過切換本身，再做同樣次數的計數，確認列數與操作結果一致。若差異在波動內，我不會把它寫成加速成果。
  - id: fs-react-14-perf-memo
    prompt: 哪種子元件較值得優先評估 memo？
    answer: 渲染有可量測成本、經常因父層改變而重算且 props 多半不變的元件。
    mcq:
      question: 同樣只按父層計數，哪個對象最值得先量？
      options:
        - 每次都換資料的極短文字
        - 沒有渲染的工具函式
        - 尚未點擊的網路連結
        - 輸入未變卻經常重算的長清單
      answer: 3
      explain: 要先有可能省下的重複渲染，再確認其成本足以抵銷比較開銷。
practice:
  - id: fs-react-14-perf-p1
    title: 交一張可對照的渲染量測卡
    kind: code
    minutes: 16
    steps:
      - 普通版與記憶化版各點計數 3 次，略過掛載和切換
      - 抄錄實際更新耗時及計數與最後一列
      - 寫下是否看出穩定改善，不填預設成績
    checks:
      - 兩組各有 3 個相同操作的更新紀錄
      - 清單仍到 900 且計數正確，結論註明是開發環境的觀察
---

## 為什麼要學：點一下很慢，先量哪一段？
課表頁有個很長的清單，旁邊的計數按鈕跟清單無關。有人提議把所有元件都做記憶化；但如果真正慢在網路或版面配置，花時間改渲染邏輯也救不了這次操作。先問一個能被量測推翻的問題：「只動計數時，這個沒換資料的清單是否仍花很多時間重新計算？」這堂只改一個條件，記下相同操作的前後結果。

## 核心概念：區分計算、提交與使用者感受到的延遲
渲染（render）是 React 計算元件該顯示的內容；提交（commit）是把已算好的更新套用到畫面。元件函式執行不代表瀏覽器重畫整頁。量測元件（Profiler）讓你包住一棵子樹，在它提交時取得回呼。`phase` 區分初次掛載和後續更新，`actualDuration` 是這次為該子樹渲染花的毫秒數，不是整個點擊到畫面亮起的總時間，也不含網路往返。

記憶化（memoization）是利用先前結果，避免在條件沒變時重算。`memo` 包住元件，React 通常可在各項 props 沒變時略過父層帶來的重新渲染，但元件自己的狀態或讀取的 Context 仍可能使它更新。比較本身也有成本；如果元件本來就便宜，或每次都傳新的物件，不能先承諾一定變快。

## 範例：只快取清單，不動計數的行為
在 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）的一般開發預覽（未啟用自動記憶化的編譯器），先保存前一版，再用以下內容作為 `src/App.tsx`。打開開發者主控台，將輸出視為探索資料，不是對正式網站效能的承諾。列數是刻意放大的教學負載，按鈕旁的數字才是這次要改變的資料。

```tsx
import { Profiler, memo, useState, type ProfilerOnRenderCallback } from 'react';
const ids = Array.from({ length: 900 }, (_, i) => i + 1);
function Rows() {
  return <ul>{ids.map(id => <li key={id}>練習 {id}</li>)}</ul>;
}
const StableRows = memo(Rows);
const report: ProfilerOnRenderCallback = (id, phase, ms) =>
  console.log(id, phase, ms.toFixed(2));
export default function App() {
  const [count, setCount] = useState(0);
  const [cached, setCached] = useState(false);
  return <main>
    <label><input type="checkbox" checked={cached}
      onChange={e => setCached(e.currentTarget.checked)} />使用記憶化清單</label>
    <Profiler id="board" onRender={report}>
      <button onClick={() => setCount(n => n + 1)}>計數：{count}</button>
      {cached ? <StableRows /> : <Rows />}
    </Profiler>
  </main>;
}
```

未勾選時按計數 3 次，抄下更新紀錄。勾選後先略過切換本身那筆，再用同樣節奏按 3 次。初次掛載、換元件型別和單純計數不是相同工作，不能湊在一起平均。兩種模式最後一列都應是練習 900，按鈕總計數都不能少。先檢查行為等價，再比較多次量測的典型值，而不挑最漂亮的一筆。

若普通版偶爾也比記憶化版快，不用刪掉那一筆。把它當成量測的自然波動，必要時增加相同條件下的樣本，再看差異是否足以抵銷多一層設計與維護的成本。

## 常見錯誤
只數主控台出現幾行，忽略每次花費，或拿開發模式的數字當所有裝置的正式成績。若差異與波動差不多，寫下「本次未看出穩定改善」就是有效結論；如操作真的卡頓，再調查網路、瀏覽器佈局及繪製，而不是繼續替無關的元件加快取。

## 小結
留一張量測卡：同一操作、同一資料量、兩組耗時、是否保留改法。若清單昂貴又經常收到不相關的父層更新，它值得評估；若資料每次都要換，先找真正花時間的工作。
