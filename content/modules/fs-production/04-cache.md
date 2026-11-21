---
id: fs-production-04-cache
module: fs-production
order: 4
title: 應用快取與失效
subtitle: 快取遇到舊資料
status: ready
minutes: 35
level: 3
prereqs:
- fs-production-03-latency
objectives:
- 設計快取鍵及失效時機
- 說明寫入成功但快取未更新的後果
tags:
- production
- cache
resources:
- title: Microsoft Learn：旁路快取與失效順序
  url: https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside
  kind: doc
  lang: en
  minutes: 8
  required: false
  checked: '2026-11-20'
concepts:
- id: fs-production-04-cache-identity
  prompt: 為什麼不能把所有可用席數都存在同一個 seats 鍵？
  answer: 快取鍵需涵蓋會改變結果的範圍，例如房間、日期或授權範圍，否則不同查詢可能取得彼此的結果。
  mcq:
    question: 同一房間可按不同日期查詢餘額，哪個鍵較合理？
    options:
    - 只用 seats
    - 包含房間與日期的規格化鍵
    - 只用日期
    - 使用每次隨機的數字
    answer: 1
    explain: 要讓等價查詢重用結果，也要避免不同結果互相命中；隨機鍵則失去重用價值。
- id: fs-production-04-cache-aside
  prompt: 旁路快取未命中時，應向誰取得值？
  answer: 向權威資料來源查詢，再把結果存入快取；未命中不代表資料為 0。
  mcq:
    question: Map 裡沒有這個鍵，資料庫其實還有 2 席，該回傳什麼？
    options:
    - 一定回 0
    - 回最近一個房間的數字
    - 回源讀取後得到的 2
    - 建立一筆新預約
    answer: 2
    explain: 未命中是缺少副本，不是業務資料不存在，更不該觸發寫入。
- id: fs-production-04-cache-invalidation
  prompt: 更新成功之後為何仍有人看到舊數字？
  answer: 快取副本不會隨來源自動改變；要失效或更新受影響的鍵，並了解並行與多個實例仍可能有短暫落差。
  interview:
    question: 快取顯示最後 1 席，能直接依它確認預約嗎？
    points:
    - 快取用於顯示
    - 最終寫入以資料庫條件為準
    - 寫入後處理失效與可接受的過期時間
    answer: 不能。我會讓資料庫在交易裡確認還有名額，再讓相關快取失效。過期時間只限制舊提示可能存在多久，不能拿來保證不會超賣。
practice:
- id: fs-production-04-cache-p1
  title: 保留一次看得見的舊資料
  kind: code
  minutes: 12
  steps:
  - 存成 cache.cjs 並執行，記錄先命中舊值再失效的輸出。
  - 加一個不同日期的來源鍵，先讀取，再只讓原日期失效。
  - 在 cache-note.txt 寫出兩個鍵、哪些讀取回源，以及不可用快取承諾的事。
  checks:
  - 同一鍵能重現 miss=2、hit=2、miss=1 的順序。
  - 另一日期不會因原日期的失效而被當成同一份結果。
---

## 為什麼要學：剛訂走最後一席，清單為什麼沒更新？

清單每次重整都查資料庫，有人決定先把結果保留一會兒。讀取變快了，代價是資料多出另一份。若寫入成功卻沒有處理舊副本，上一頁仍可能說有空位。學快取（cache）的第一個問題不是選哪個產品，而是這個數字由誰說了算，以及你願意讓別人看到多舊的數字。

## 核心概念：鍵決定可否共用，來源決定真相

旁路快取（cache-aside）先以快取鍵（cache key）查副本。命中（hit）直接回傳；未命中（miss）則讀權威資料來源，把結果放入快取再回應。鍵要包含所有會改變答案的維度，如房間、日期、座位類別。若不同使用者看到的內容不同，還要包含授權範圍，或乾脆不共用那份結果。權限檢查不能靠「應該不會猜到別人的鍵」。

失效（invalidation）是讓舊副本不再被使用。常見起點是先提交來源的寫入，成功後移除受影響的鍵，下次讀取才會回源。存活時間（time to live，TTL）讓副本過一段時間失效，可以限制殘留時間，卻不能保證來源一改所有讀者就立即得到新值。若讀值為 0 也可能是有效答案，判斷是否命中要用「有沒有鍵」，不能把數字真假當作存在與否。

## 範例：故意少做一步，親眼看到舊席數

在 `C:\dev\stackway-lab\production` 把下列程式存成 `cache.cjs`，於 PowerShell 執行 `node cache.cjs`。兩個 `Map` 分別代替權威資料與快取，只存在於本次行程的記憶體中，沒有連到外部服務。把房間與日期組成固定順序的鍵，同一個問題才會回到同一個位置。

```js
const key = (room, day) => JSON.stringify([room, day]);
const k = key("blue", "fri");
const store = new Map([[k, 2]]);
const cache = new Map();
function read(k) {
  if (cache.has(k)) return "hit=" + cache.get(k);
  if (!store.has(k)) return "not found";
  const n = store.get(k);
  cache.set(k, n);
  return "miss=" + n;
}
console.log(read(k));
store.set(k, 1);
console.log(read(k));
cache.delete(k);
console.log(read(k));
```

第二次讀仍是 2，並不是資料庫寫入失敗，而是讀取路徑根本沒問來源。等舊鍵移除才重新取得 1。另設一個週六的鍵，先讀一次，再移除週五，週六仍應命中：失效應該針對受影響的答案，不必每次把整站快取都清空。若另外存了跨日期的摘要，改一筆後也要考慮摘要鍵，那是另一份受影響的答案。

如果寫入沒有成功，就不能把代表新狀態的資料放進快取。否則使用者看到的是根本不存在的席位變更。把「來源已提交」當作後續處理的分界，也方便寫測試：一次測成功如何失效，一次測寫入失敗時沒有向讀者承諾新結果。

## 常見錯誤

這個單行程範例步驟依序執行；真實系統的並行讀取可能在失效前讀到舊值、在失效後才把舊值寫回去，多個服務實例也可能有各自的副本。不要把這段教學當強一致性保證。最終預約須由資料庫的交易或條件寫入確認席位；快取只能讓清單好讀，不能充當最後一席的裁判。

## 小結

給每份快取寫一張小卡：這是誰的答案、什麼時候讀來源、發生哪個寫入就失效、能容忍多舊。這些決策清楚之後，才值得增加額外的快取服務。
