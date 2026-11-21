---
id: fs-services-01-redis
module: fs-services
order: 1
title: Redis 快取與到期時間
subtitle: 快取消失時資料還在嗎
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 用鍵、值與 TTL 描述一次讀取
  - 在快取未命中時回源，區分過期與主動失效
tags:
  - services
  - redis
resources:
  - title: "Redis：鍵的到期時間"
    url: "https://redis.io/docs/latest/commands/expire/"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "Microsoft Learn：快取端讀取模式"
    url: "https://learn.microsoft.com/zh-tw/azure/architecture/patterns/cache-aside"
    kind: "doc"
    lang: "zh-Hant"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-services-01-redis-source"
    prompt: "讀取時快取沒有該鍵，下一步是什麼？"
    answer: "查主要資料來源，有結果再放入快取。"
    mcq:
      options:
        - "立即判定資料已刪除。"
        - "把空字串當成正確結果永久儲存。"
        - "查主要資料來源，有結果再放入快取。"
        - "等到到期時間結束再查同一鍵。"
      answer: 2
      explain: "未命中只表示這層沒有副本，不代表來源沒有資料。"
    interview:
      question: "改價後讀者有時仍看到舊價，你怎麼分辨原因？"
      points:
        - "比較來源和副本"
        - "核對鍵及到期"
        - "區分可接受舊值和成交依據"
      answer: "我先用同一商品核對來源與快取，再看更新後有沒有讓正確鍵失效。展示價若允許短暫落後可以設定期限；結帳仍要回到可信的價格來源。"
  - id: "fs-services-01-redis-ttl"
    prompt: "快取鍵的 TTL 到 0，消失的是什麼？"
    answer: "該鍵對應的快取副本"
    mcq:
      options:
        - "來源資料表的原始列"
        - "所有同類型的鍵"
        - "瀏覽器內所有畫面"
        - "該鍵對應的快取副本"
      answer: 3
      explain: "存活時間限制某個鍵的可用時間，不會連帶刪除主要資料。"
  - id: "fs-services-01-redis-invalidate"
    prompt: "商品剛改價，想縮短看到舊值的時間，先做哪項？"
    answer: "先提交來源的新價格，再讓該商品的快取失效。"
    mcq:
      options:
        - "先提交來源的新價格，再讓該商品的快取失效。"
        - "只改快取不改來源。"
        - "先刪來源避免舊值被看到。"
        - "把存活時間延長。"
      answer: 0
      explain: "先改來源可減少重新載入舊值的機會，但仍要考慮並行讀寫。"
  - id: fs-services-01-redis-zero
    prompt: "價格為 0 和快取未命中，可以共用同一種判斷嗎？"
    answer: "不能；0 可以是真實價格，應另外檢查鍵是否存在且未到期。"
practice:
  - id: "fs-services-01-redis-p1"
    title: "畫出一個價格鍵的生命線"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 prices.py"
      - "把第 6 秒的讀取改成第 5 秒"
      - "加入一次來源改價後立即移除副本的讀取"
    checks:
      - "能指出哪次回源、哪次命中"
      - "到期邊界會讀到新價，原始價格沒有消失"
---

## 為什麼要學：售價變了，舊價在哪裡？

商品頁 1 分鐘被翻看許多次，每次都從資料庫讀同一筆價格未必划算。快取（cache）把可重新取得的答案暫放在較快的位置；Redis 可以用鍵（key）找值（value）。假設商品 7 號的展示價存在鍵 `price:7`。這是副本的位置，不是價格真正的家。把商品名稱拿來當鍵，遇到改名或同名商品，就不再知道讀到誰的價格。

## 核心概念：未命中不是不存在

旁路快取（cache-aside）的讀法是先找副本，命中就用它；未命中才回到主要資料庫，取得結果後補進快取。存活時間（time to live，TTL）到了，鍵不再提供舊值。Redis 的 `SET price:7 80 EX 5` 表示同時存值並設定 5 秒期限；`GET price:7` 讀值，`TTL price:7` 看剩餘秒數。這些是快取操作，不是改商品表的指令。

期限是可以容忍多舊的取捨，不是定時更新：到期後沒人看，就沒有理由立即回源。寫入時想提早讓副本失效（invalidation），可先提交來源交易，再刪除該商品的鍵。下一位讀者負責補新值。先刪再寫可能讓中途的讀取把舊值補回；即使先寫再刪，較早發出的慢查詢仍可能晚到，不能把它說成強一致保證。

## 範例：把等待換成可控制的秒數

為快取與背景工作建立 `C:\dev\stackway-lab\services`。存入 `prices.py`，執行 `py prices.py`；macOS／Linux 用 `python3 prices.py`。不用等鐘走，也不需要一台 Redis；用明確的現在時間檢查邊界。這個模型只模擬讀值與到期，不模擬網路失敗。

```python
source = {"price:7": 80}
cache = {}
def read(key, now):
    pair = cache.get(key)
    if pair is not None and now < pair[1]:
        print(now, "hit", pair[0])
    else:
        value = source[key]
        cache[key] = (value, now + 5)
        print(now, "source", value)
read("price:7", 0)
source["price:7"] = 90
read("price:7", 2)
read("price:7", 6)
source["price:7"] = 95
cache.pop("price:7", None)
read("price:7", 7)
```

第 2 秒看到 80 元不是程式沒做改價，是買家取得的副本還有效。第 6 秒才從來源看見 90 元；最後一次因主動失效，不必再等 5 秒。把兩種刷新原因分別記在圖上，日後才能根據紀錄判斷是期限太長還是忘了讓鍵失效。

### 當副本消失，問應該增加哪個數字

現在把清單當成一次小型營運紀錄：每看一次頁面算一個讀取，每印一次來源才算一次資料庫查詢。第 0 秒與第 6 秒都是回源，原因分別是從未有副本及原副本過期。若工作者重新啟動後整批鍵消失，畫面仍應取得來源價格，但短時間送到資料庫的查詢可能大增。若資料庫此時也無法提供價格，不要把「讀不到」寫成 0 元再保存，否則一次服務故障會變成看似合法的免費商品。這時該顯示暫時無法取得價格，還是允許展示標明時間的舊價，取決於畫面用途，交給產品明定，不由真假值判斷代替。

先說出哪裡才是原始資料，再預測快取失效後第一筆請求會讀哪裡。命中率不能取代正確性檢查。

## 常見錯誤與小結

不要用值的真假判斷是否命中。價格可以是 0，庫存也可以是 0，有值且值為 0 與查不到鍵不同。也別用展示頁的快取決定是否真的成交：庫存與金額若必須正確，在下單交易重新核對。先定義資料遺失時從哪裡重建，再決定什麼適合放進快取。
