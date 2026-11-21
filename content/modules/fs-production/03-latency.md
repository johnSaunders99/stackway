---
id: fs-production-03-latency
module: fs-production
order: 3
title: 網頁載入與互動效能
subtitle: 先量再改頁面速度
status: ready
minutes: 35
level: 3
prereqs:
- fs-production-02-render
objectives:
- 在固定條件下量測載入與互動
- 以一項變動解釋前後差異
tags:
- production
- performance
resources:
- title: Chrome 開發者工具：效能錄製與互動時間線
  url: https://developer.chrome.com/docs/devtools/performance/reference
  kind: doc
  lang: en
  minutes: 8
  required: false
  checked: '2026-11-20'
- title: web.dev：互動至下一次繪製
  url: https://web.dev/articles/inp
  kind: article
  lang: en
  minutes: 6
  required: false
  checked: '2026-11-20'
concepts:
- id: fs-production-03-latency-measure
  prompt: 首屏主要內容出現的速度，和按下按鈕後多久看到回饋，是同一個數字嗎？
  answer: 不是。載入與互動是不同使用旅程；LCP 看主要內容繪出，互動要看輸入到後續繪製。
  mcq:
    question: 使用者說「頁面早就開好了，按預約卻要等」，優先錄什麼？
    options:
    - 一次可重現的點擊到畫面更新
    - 只有檔案下載大小
    - 只有 DNS 查詢
    - 首頁的標題字數
    answer: 0
    explain: 載入完成不代表主執行緒能及時處理輸入與繪製。
- id: fs-production-03-latency-control
  prompt: 前後量測為什麼要固定資料、裝置、快取條件與操作？
  answer: 讓差異較能歸因到本次改動；不同條件會把環境差異誤當最佳化成效。
  mcq:
    question: 哪一組前後比較最能支持改動有效？
    options:
    - 手機冷啟動對桌機暖快取
    - 同一裝置與資料、同一操作，各跑多次，只改工作量
    - 換圖片又換資料又換網路
    - 只取修改後最快的一次
    answer: 1
    explain: 公平比較要固定條件並保留波動，同時改多項無法辨認原因。
- id: fs-production-03-latency-scope
  prompt: 單次本機 Performance 錄製，能否證明整站的 INP 已改善？
  answer: 不能。它提供特定互動的診斷線索；真實使用者分布與頁面生命週期的互動仍需另量。
  interview:
    question: 測了 3 次後只有最快那次變快，你如何報告？
    points:
    - 列出所有原始值與條件
    - 避免只挑最佳值
    - 提出可重現的下一個測量
    answer: 我會保留前後各 3 次與中位數。如果差距落在本機波動內，我不宣布改善；我先查操作是否一致，再用效能時間線找延遲在哪一段。
practice:
- id: fs-production-03-latency-p1
  title: 留下有基準的互動量測單
  kind: hands-on
  minutes: 13
  steps:
  - 存檔並開啟 latency.html，在開發者工具固定視窗與 CPU 條件，記錄載入和一次點擊。
  - 將 workMs 從 90 改成 10；修改前後各重整及點擊 3 次，記錄原始值。
  - 在 perf-note.txt 寫下兩組中位數、主要差異、未量到的範圍。
  checks:
  - 有 6 筆點擊處理時間，沒有用程式設定的 90 和 10 代替實測。
  - 我分開記錄載入與互動，沒有宣稱這是全站真實使用者的 INP。
---

## 為什麼要學：工程師說快了，使用者還是在等

預約頁開得很快，點送出後畫面卻停住。若只比較下載時間，可能會花整天壓縮圖片，卻完全沒有碰到按鈕卡住的原因。測效能先選一個能重播的動作：使用者何時開始等，何時看見有意義的回應？明確的起終點能避免拿不同問題的數字互相邀功。

## 核心概念：載入、處理和繪製要分開看

最大內容繪製（Largest Contentful Paint，LCP）觀察視窗中符合條件的最大內容元素何時繪出，不是所有網路請求結束的時刻。互動至下一次繪製（Interaction to Next Paint，INP）則考慮輸入延遲、事件處理及直到下一次繪製的時間。它代表一次頁面造訪裡接近最慢的互動，不是隨便計一個點擊處理函式就得到整頁指標。

瀏覽器的主執行緒（main thread）要處理輸入、執行程式，也參與更新畫面。長時間同步工作即使不碰網路，也可能讓按鈕晚很久才有反應。用開發者工具的效能面板（Performance）可以把互動、程式工作與畫面繪製排在同一條時間線。程式內的碼錶只能證明自己包住的那段時間，不能看到使用者按下去但事件還在等待的那一段。

## 範例：安排一個看得見的短暫停頓

在 `C:\dev\stackway-lab\production` 存成 `latency.html` 並用 Chrome 或 Edge 開啟。這是刻意製造負擔的本機教材，不要放進實際產品。先打開效能面板錄製重新載入，記錄主要內容出現的位置；再錄一次點擊，觀察事件附近的工作。若畫面太小或版本沒有標出 LCP，就記下未取得，不要用整頁載入結束時間代填。

```html
<!doctype html><html lang="zh-Hant"><meta charset="utf-8">
<title>預約量測</title><h1>今天剩下 2 席</h1>
<button id="reserve">確認座位</button><output id="result"></output>
<script>
const workMs = 90;
document.querySelector("#reserve").onclick = () => {
  const start = performance.now();
  while (performance.now() - start < workMs) { /* synthetic work */ }
  const ms = performance.now() - start;
  document.querySelector("#result").textContent = "已確認：" + ms.toFixed(1) + " ms";
};
</script></html>
```

在相同裝置、視窗尺寸、快取與處理器節流設定下，各重載並點 3 次。第一組保留原始工作量，第二組只改 `workMs`，不要同時關掉開發者工具或更換網路條件。把 3 個數字排序取中間值，仍保留全部原始值。若載入沒什麼差別，互動的處理區段卻縮短，恰好說明你修改的是哪一段；沒有變快的項目也值得記下。

記錄時給每一列加上操作名稱，例如「重新載入首屏」或「第一次按確認」。若第二組改測連按十下，測到的已不是同一個問題，即使時鐘與瀏覽器完全相同也不能直接比較。

## 常見錯誤

直接把設定的 90 毫秒填成量測值。它只是忙碌迴圈要求的最低量級，畫面更新、背景工作與計時精度都會影響觀察。另有一種錯誤是把這種人工延遲拿來預測正式網站的百分位數。正式流量有不同裝置、頁面停留長度與操作，本機實驗只能支持「在這組條件下，這個步驟的工作縮短了」。

## 小結

有用的效能報告要能重播：註明操作、條件、修改前後的多次數字，以及不能推論的範圍。先證明你處理了使用者正在等的那段，再談下一個優化。
