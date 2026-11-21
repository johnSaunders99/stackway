---
id: fs-react-09-fetching
module: fs-react
order: 9
title: React 資料取得
subtitle: 讓四種請求結果都有畫面
status: ready
minutes: 35
level: 3
prereqs:
  - fs-react-04-effects
objectives:
  - 為載入、空資料、成功與錯誤各定義呈現
  - 在切換查詢時忽略舊請求的結果
tags:
  - react
  - fetching
resources:
  - title: React：使用 Effect 同步
    url: https://react.dev/learn/synchronizing-with-effects
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 看資料取得範例如何忽略失效結果。
  - title: MDN：使用 Fetch API
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: "2026-11-20"
    note: 檢查回應狀態與取消請求。
concepts:
  - id: fs-react-09-fetching-states
    prompt: 空資料應和載入中如何區分？
    answer: 載入中尚無結論，空資料是請求成功且沒有項目；兩者應顯示不同下一步。
    mcq:
      question: 請求已成功回傳空陣列，該顯示什麼？
      options:
        - 這天沒有課
        - 繼續載入中
        - 連線失敗
        - 上一天的清單當今天顯示
      answer: 0
      explain: 已取得明確結果，不應假裝等待、失敗或挪用別的查詢內容。
  - id: fs-react-09-fetching-late
    prompt: 怎麼避免先發後到的舊請求更新當前畫面？
    answer: 清理上一輪時使它失效，成功與失敗回覆更新狀態前都檢查是否仍有效。
    mcq:
      question: 慢的昨天請求比今天晚回來，現在仍選今天。應如何處理舊回覆？
      options:
        - 以最後抵達者覆蓋
        - 兩份一律合成今天的資料
        - 強迫使用者回昨天
        - 忽略它對目前畫面的更新
      answer: 3
      explain: 到達時間不等於使用者最後一次選擇，資料身分要對上目前查詢。
    interview:
      question: 切換課表時偶爾顯示錯日資料，要用什麼實驗定位？
      points:
        - 固定兩個不同延遲
        - 在慢請求完成前切換
        - 檢查最終畫面與兩條回覆分支
      answer: 我會讓昨天慢、今天快，快速切換後等到慢的也完成。如果舊結果能蓋畫面，就替每一輪加清理與有效性檢查，包含失敗路徑。最後再重測空資料，不讓它看起來像一直載入。
  - id: fs-react-09-fetching-http
    prompt: 真正使用 fetch 時，為什麼還要檢查 response.ok？
    answer: 收到 HTTP 錯誤狀態仍可能正常取得 Response，不會自動走網路錯誤分支。
    mcq:
      question: 伺服器回 HTTP 404，哪種判斷可靠？
      options:
        - 只要 promise 完成就算成功資料
        - 保證一定觸發 catch
        - 檢查回應狀態並走錯誤呈現
        - 一律當成空清單
      answer: 2
      explain: 已收到回應不等於請求成功；404 與成功的空清單是不同結果。
  - id: fs-react-09-fetching-cancel
    prompt: 忽略失效回覆是否等於停止網路傳輸？
    answer: 不等於，旗標限制畫面更新；要中止支援取消的工作需另使用取消機制。
practice:
  - id: fs-react-09-fetching-p1
    title: 留一份 4 態與舊回覆的驗收單
    kind: code
    minutes: 16
    steps:
      - 使用教學替身切換今天、空課表、故障並重試
      - 先選慢的昨天，立刻選今天，等超過 2 秒
      - 留下四種畫面的文字與最後顯示的課名
    checks:
      - 空課表不顯示忙碌，重試會再次離開錯誤狀態進入載入
      - 慢回覆到達後仍是今天：權限
---

## 為什麼要學：先問的資料，可能最後才回來
你先看昨天的課表，隨即切到今天。昨天的請求比較慢，最後抵達時如果直接改畫面，標題會寫今天，內容卻悄悄變昨天。另一種常見誤會是用空陣列同時代表「等待中」和「查完沒有課」，讓人等一個根本沒在載入的畫面。這堂用可控制的延遲把兩個問題各自重現，切換時不必碰真正的伺服器。

## 核心概念：把目前請求的階段和身分都記清楚
資料取得（data fetching）通常是非同步的：送出後先還給畫面控制權，到結果抵達才更新狀態。載入中表示尚無結論；空資料是成功但沒有項目；成功有資料應畫清單；錯誤則要提供下一步。把這些互斥情況寫成狀態，不要只以字串或清單是否為空作判斷。真實的 `fetch` 在收到 HTTP 錯誤回應時不一定拋出例外，應先看 `response.ok` 再處理內容。

每一次查詢都有自己的生命週期。清理函式可以把**該次**的旗標標為失效；結果抵達後先檢查旗標，失效就不要更新。忽略舊結果不等於真的取消網路傳輸，兩者解決不同問題。若要中止支援取消的請求，還可使用取消控制器（AbortController）；就算節省了傳輸，畫面仍應清楚定義哪個結果有權更新。

## 範例：本機重演後到的舊結果
在 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）將這段完整存入 `src/App.tsx`，先另存上一版。下面的非同步函式是教學替身，不會出網；慢選項、空選項和錯誤選項都有固定結果。畫面會先標示讀取哪個代號，用身分檢查避免切換後還短暫顯示前一份資料。

```tsx
import { useState, useEffect } from 'react';
type Result = { id: string; phase: 'loading'|'ok'|'error'; rows: string[] };
async function read(id: string) {
  await new Promise(resolve => setTimeout(resolve, id === 'slow' ? 1800 : 250));
  if (id === 'broken') throw new Error('unavailable');
  return id === 'empty' ? [] : [id === 'slow' ? '昨天：路徑' : '今天：權限'];
}
export default function App() {
  const [id, setId] = useState('slow');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ id, phase: 'loading', rows: [] });
  useEffect(() => {
    let current = true;
    setResult({ id, phase: 'loading', rows: [] });
    read(id).then(rows => {
      if (current) setResult({ id, phase: 'ok', rows });
    }).catch(() => {
      if (current) setResult({ id, phase: 'error', rows: [] });
    });
    return () => { current = false; };
  }, [id, attempt]);
  return <main><label>課表 <select value={id} onChange={e => setId(e.currentTarget.value)}>
    <option value="slow">昨天（慢）</option><option value="today">今天</option>
    <option value="empty">空課表</option><option value="broken">模擬錯誤</option>
  </select></label>
    {result.id !== id || result.phase === 'loading' ? <p>載入中</p> :
      result.phase === 'error' ? <p>讀取失敗 <button onClick={() => setAttempt(n => n + 1)}>重試</button></p> :
      result.rows.length === 0 ? <p>這天沒有課</p> :
      <ul>{result.rows.map(row => <li key={row}>{row}</li>)}</ul>}
  </main>;
}
```

試著寫一份不看程式也能照做的時間線：先記哪一刻選昨天，再記切到今天的時刻；今天的結果先抵達，最後才收到昨天的回覆。每個時點分別寫下「想看的查詢」與「可以顯示的結果」，會發現資料抵達只是更新的必要條件，不是充分條件。若把延遲交換，昨天先完成也不該造成錯誤。正確做法不靠誰比較快，而是不論回覆順序都只認目前那次操作。測試時不要只在慢結果還沒抵達前截圖，那一刻錯的程式也能顯示正確資料。

## 常見錯誤
只防成功回覆，卻讓舊請求的失敗訊息蓋掉新頁面。應在成功與失敗兩條路都檢查是否仍有效。重試是再發一次，並非保證下次成功；這裡故障情境刻意固定，重試後會從載入回到錯誤，切到今天才會恢復有資料的畫面。

## 小結
先看四種狀態，再從今天切到昨天、立刻切回今天，等超過 2 秒。若仍顯示今天的內容才算通過競速測試。留一份操作順序與最終畫面，接手者不必猜網路速度也能重做。
