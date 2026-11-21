---
id: fs-production-07-monitor
module: fs-production
order: 7
title: 部署監控與健康檢查
subtitle: 服務能連上，但使用者能完成預約嗎
status: ready
minutes: 35
level: 4
prereqs:
- fs-production-06-deploy
objectives:
- 區分行程存活與使用流程成功
- 記錄錯誤率、延遲與請求量，為小規模發布訂停止條件
tags:
- production
- monitor
resources:
- title: Google SRE：監控與黃金訊號
  url: https://sre.google/sre-book/monitoring-distributed-systems/
  kind: book
  lang: en
  minutes: 7
  required: false
  checked: '2026-11-20'
- title: Google SRE：小規模發布的觀察與判斷
  url: https://sre.google/workbook/canarying-releases/
  kind: book
  lang: en
  minutes: 7
  required: false
  checked: '2026-11-20'
concepts:
- id: fs-production-07-monitor-layers
  prompt: 健康端點回成功，與預約流程可用相差哪一段證據？
  answer: 存活只證明行程能回答；預約還需可寫入、能讀回並符合業務約束，要用隔離資料做流程檢查。
  mcq:
    question: 首頁是 200，但送出預約後沒有紀錄，最能找出落差的檢查是什麼？
    options:
    - 在隔離環境建立教學預約並讀回
    - 多查幾次首頁
    - 只看記憶體是否固定
    - 記錄啟動時間
    answer: 0
    explain: 使用者需要完成寫入，首頁與行程指標都沒經過這條路。
- id: fs-production-07-monitor-denominator
  prompt: 錯誤率為何要和請求量一起報？
  answer: 相同失敗數可能代表很不一樣的比例；樣本過少時也不足以判定發布穩定。
  mcq:
    question: 同一段時間有 2 次系統失敗、共 40 個請求，失敗率是多少？
    options:
    - 2%
    - 5%
    - 20%
    - 50%
    answer: 1
    explain: 分母是同一視窗、同一群組的請求，2 除以 40 得到 0.05。
- id: fs-production-07-monitor-gate
  prompt: 為什麼發布前就要寫好停止條件？
  answer: 避免看到結果才改標準；需先說明觀察群組、視窗、最低樣本、門檻以及不符合時的動作。
  interview:
    question: 新版本只有 2 筆請求且 0 失敗，你會擴大發布嗎？
    points:
    - 指出樣本不足
    - 保留觀察視窗與請求數
    - 持續觀察或安全暫停而非自動放大
    answer: 我不會只看 0 錯誤就放大。先看基準與新版本的流量是否可比，再等到預先約定的樣本數；若關鍵流程已壞，則直接停止，不等漂亮的平均數。
practice:
- id: fs-production-07-monitor-p1
  title: 留下可解釋放行或停止的發布收據
  kind: hands-on
  minutes: 13
  steps:
  - 將 gate.cjs 存檔並執行，留下三組輸出及各自的動作。
  - 把 canary 的失敗改成正常但維持慢請求，重新判讀延遲門檻。
  - 在 release-gate.txt 記下視窗、請求量、失敗率、尾端延遲及一項流程檢查。
  checks:
  - 原始結果有 HOLD、STOP、PASS 三種，樣本不足不會被算成 PASS。
  - 我能指出預期滿額不等於伺服器錯誤，也沒將此門檻宣稱為通用標準。
---

## 為什麼要學：行程還在，不代表預約成功

發布後有人說服務很健康，因為首頁回應成功；另一個人卻按不下最後一席。兩人可能都沒看錯，只是看的層次不同。行程存活（liveness）確認程式還能應答，就緒（readiness）表示它目前適合接收請求，端到端流程（end-to-end journey）才真正走過使用者需要的步驟。這些檢查互補，不能只挑最容易通過的那個交差。

## 核心概念：先說明看哪一群，再談數字

每個觀察視窗記錄請求量、系統失敗數與延遲。錯誤率等於失敗數除以同視窗的總請求量；沒有流量是缺乏證據，不是 0 風險。把業務結果和系統故障分開：本例已滿回 409 是正確拒絕，寫入失敗卻回 500 才是系統錯誤。如果產品關心突然大量滿額，可以另外追業務比例，而不是把每份正確拒絕都叫做程式崩潰。

逐步發布（canary release）先讓小部分流量接觸新版，跟條件相近的舊版比較，再決定是否擴大。平均延遲容易蓋過少數等很久的請求；第 95 百分位數（p95）可以描述尾端。本例使用最近名次法：把延遲從小到大排好，取從 1 起算、位置為樣本數乘以 0.95 後向上取整的值。只有幾筆時尾端非常不穩定，別以精確的小數位掩飾樣本不足。

## 範例：3 張視窗收據，一個決策函式

在 `C:\dev\stackway-lab\production` 存成 `gate.cjs`，以 PowerShell 執行 `node gate.cjs`。每組都是同一個 5 分鐘視窗、同一預約 API 的合成紀錄，數字單位為毫秒。先寫政策：少於 20 筆暫不擴大；否則若系統失敗率超過2%或 p95 超過 300 毫秒就停止。這是練習門檻，不是正式產品的服務承諾。

```js
function gate(label, rows) {
  const n = rows.length;
  if (!n) return console.log(label, "n=0 HOLD");
  const ms = rows.map(r => r[1]).sort((a,b) => a-b);
  const pct = 100 * rows.filter(r => r[0] >= 500).length / n;
  const p95 = ms[Math.ceil(.95 * n) - 1];
  const result = n < 20 ? "HOLD" : pct > 2 || p95 > 300 ? "STOP" : "PASS";
  console.log(label, { n, pct, p95, result });
}
const normal = Array.from({length:18}, () => [201, 80]);
gate("early", [[201, 80], [409, 65]]);
gate("canary", [...normal, [201, 410], [500, 450]]);
gate("baseline", [...normal, [409, 70], [201, 90]]);
```

第一組數量不夠，留在觀察；第二組 20 筆有 1 筆系統失敗，失敗率5%，尾端也超標；第三組的衝突符合設計，不算系統故障。現在只修正第二組的 500，不改耗時，發布仍應停止。這能驗證你的閘門沒有只看狀態碼。實際的小規模發布還要把合成預約放在專用測試資料上，不要定時占用真實使用者的名額。

若要把這個門檻放進交接文件，請寫出停止後由誰保留新版紀錄、由誰確認舊版仍服務，不要只剩下一格紅燈而沒有下一步。樣本太少時則標註暫不判定，不要把它算進成功批次。

## 常見錯誤

把舊版整天的平均值跟新版剛啟動的前幾秒比較，沒有分開視窗與版本。又或者預約流程已確認損壞，仍等流量湊滿才處理；明確的關鍵功能故障應直接停止擴大並保留證據。停止發布也不一定等於立刻還原資料庫，資料相容性與回復方案要另外評估。

## 小結

監控不是讓圖表永遠綠色，而是讓人知道下一步該等、該停，還是可以小心擴大。交付一張包含群組、時間、分母和動作的收據，就能讓下一位維運者接著判斷。
