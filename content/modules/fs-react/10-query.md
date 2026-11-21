---
id: fs-react-10-query
module: fs-react
order: 10
title: TanStack Query 快取
subtitle: 回到同一頁時，哪些資料可以沿用
status: ready
minutes: 35
level: 3
prereqs:
  - fs-react-09-fetching
objectives:
  - 用查詢鍵區分不同請求
  - 比較快取失效、重新取得與保留舊資料的畫面
tags:
  - react
  - query
resources:
  - title: TanStack Query：查詢鍵
    url: https://tanstack.com/query/v5/docs/framework/react/guides/query-keys
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: "2026-11-20"
    note: 看影響查詢結果的變數如何進入鍵。
  - title: TanStack Query：查詢失效
    url: https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: "2026-11-20"
    note: 對照標記失效與背景重新取得。
concepts:
  - id: fs-react-10-query-key
    prompt: 查詢鍵應包含哪些會變的資訊？
    answer: 要包含會改變這份查詢結果的條件，例如路線，避免把不同資料放在同一格。
    mcq:
      question: 同頁可看全端或共同基礎課表，哪個鍵合適？
      options:
        - "['lessons'] 一律共用"
        - "['lessons', track]"
        - 只用按鈕顏色
        - 每次渲染產生新的隨機鍵
      answer: 1
      explain: 路線定義查詢對象；忽略會混用，加入無關或隨機資料會破壞重用。
  - id: fs-react-10-query-fresh
    prompt: staleTime 是資料到期後自動清空的時間嗎？
    answer: 不是，它界定新鮮期間；資料變舊仍可能留在快取。
    mcq:
      question: 某筆快取過了新鮮期但仍被保留，能推出什麼？
      options:
        - 它可以變成可重新取得的舊資料
        - 它的值一定被清空
        - 它一定是錯誤資料
        - 此後永不重讀
      answer: 0
      explain: 變舊說的是更新資格，不是刪除、真偽或永久有效。
  - id: fs-react-10-query-invalidate
    prompt: 讓目前有讀者的查詢失效時，畫面能如何避免閃白？
    answer: 保留已有資料，用背景取得提示表示更新中，結果回來才換成新值。
    mcq:
      question: 已有基礎課表，讓其鍵失效後正在重取，最適合顯示什麼？
      options:
        - 全端快取充當基礎資料
        - 沒有課的空狀態
        - 宣稱最新結果已到
        - 舊基礎資料與背景更新提示
      answer: 3
      explain: 重新取得期間仍有同鍵舊資料，不能拿其他路線或未到的新結果替換。
    interview:
      question: 你怎樣測快取真的沿用，又不會串錯路線？
      points:
        - 為每條路線給可識別結果
        - 在新鮮期內切回
        - 精準失效再觀察背景更新
      answer: 我會記兩條路線各自的批次，新鮮期內切回應讀到原來那批。接著只讓基礎鍵失效，先看舊批次仍在，完成後才看新批次，最後核對全端那格沒有被換掉。
practice:
  - id: fs-react-10-query-p1
    title: 記錄快取重用與失效的兩次畫面
    kind: code
    minutes: 16
    steps:
      - 在個人練習專案加第 5 版套件，跑範例
      - 在 60 秒內依序看基礎、全端、基礎並記批次
      - 讓基礎失效，截下舊資料還在的更新提示，再回全端核對
    checks:
      - 切回基礎先沿用原批次
      - 只有被精準失效的路線換新批次，背景更新期間舊值可讀
---

## 為什麼要學：回到剛才的課表，一定要重等嗎？
你在兩條路線之間切換，每次都先看到空白，明明剛剛才讀過。保留舊結果可以讓畫面更快有內容，但不能把全端課表借給基礎頁面，也不能假裝舊資料永遠最新。這堂把三個決定分開：資料要放在哪一格、這一格多久內算新、知道伺服器資料變了以後要怎麼更新。

## 核心概念：鍵值是快取的地址，不是畫面的標題
TanStack Query 管理來自非同步來源的快取（cache）。查詢鍵（query key）是一個陣列，用來辨認哪一份資料；會改變查詢結果的條件要放入鍵中。以課表為例，路線是條件，按鈕顏色不是。查詢函式（query function）則負責取得內容，兩個條件不同卻共用同一個鍵，會把不同來源的結果寫進同一格。

新鮮期（stale time）表示這段期間可把快取視為新鮮，不等於到期就把資料清空。標記失效（invalidate）會讓符合的查詢變舊，預設情況下目前有使用中的查詢會在背景重新取得。此時已有資料仍可顯示，用另一個提示表達更新中；第一次沒有資料又正在載入，才需要整頁等候。本例只用記憶體快取，不保證重新整理後仍在。

## 範例：在 2 個快取格之間來回
只在自己的 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）根目錄， Windows PowerShell 執行 `npm.cmd install @tanstack/react-query@5`；macOS 或 Linux 用 `npm install @tanstack/react-query@5`。這是本課練習用的套件，不需要加到棧道本身。保留前一版，再把 `src/App.tsx` 換成下列完整內容。程式用本機計數模擬每次成功取得的新批次，沒有連到外部服務。

```tsx
import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
const client = new QueryClient();
let batch = 0;
async function read(track: string) {
  await new Promise(resolve => setTimeout(resolve, 700));
  return track + '：批次 ' + ++batch;
}
function Board() {
  const [track, setTrack] = useState('共同基礎');
  const cache = useQueryClient();
  const key = ['lessons', track];
  const q = useQuery({ queryKey: key, queryFn: () => read(track), staleTime: 60_000 });
  return <main>
    <button onClick={() => setTrack('共同基礎')}>共同基礎</button>
    <button onClick={() => setTrack('全端')}>全端</button>
    <p>{q.isPending ? '初次讀取中' : q.isError ? '讀取失敗' : q.data}</p>
    <button disabled={q.isFetching} onClick={() => cache.invalidateQueries({ queryKey: key, exact: true })}>
      標記本路線失效
    </button>
    {q.isFetching && q.data !== undefined && <small>背景更新中</small>}
  </main>;
}
export default function App() {
  return <QueryClientProvider client={client}><Board /></QueryClientProvider>;
}
```

先等共同基礎載入，再切全端等完成，於 60 秒內回到基礎。標籤與批次應與第一次基礎相同；全端不會把它替換掉。按失效按鈕，先看到舊批次仍在、旁邊出現更新提示，等候後才換成新批次。這比只看最後的數字，更能區分「刪掉重來」和「保留舊畫面更新」。

如果同時要讓所有路線重新確認資料，可另外設計以課表類別為範圍的失效操作；本次按鈕刻意只針對完整鍵值。從使用者角度說，「這一頁已更新」與「所有清單都重新讀取」成本不同，涵蓋範圍也不同。測試後再切到另一條路線看舊批次，才能驗證沒有擴大影響。

## 常見錯誤
每次渲染都建立新的查詢用戶端（QueryClient），讓不同畫面不能穩定共用同一份快取。把它放在元件外或穩定初始化；元件需在同一個提供者下才能讀到它。也不要拿畫面中選取的路線取代查詢鍵；路線狀態回答目前想看什麼，快取回答每個條件曾取回什麼。

## 小結
記下兩條路線第一次的批次，以及手動失效時哪一條變了。兩份資料隔離、舊內容未消失、更新完成後換批次，三件事都成立，快取才真正幫到使用者。
