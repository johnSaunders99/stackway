---
id: fd-algo-11-heap
module: fd-algo
order: 11
title: 堆積與優先佇列
subtitle: 下一個要處理的是最急的工作
status: ready
minutes: 35
level: 2
prereqs:
  - fd-algo-05-trees
objectives:
  - 用小型堆積追蹤插入與取出最小值
  - 比較堆積和完全排序後反覆取值的成本
tags:
  - algo
  - heap
resources:
  - title: 'Python：heapq 最小堆積'
    url: 'https://docs.python.org/zh-tw/3/library/heapq.html'
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '讀推入、彈出與同優先工作順序。'
concepts:
  - id: fd-algo-heap-root
    prompt: '最小堆積保證哪一個位置，並不保證什麼？'
    answer: '根是全體最小，但整個底層串列不必按名次完全排序。'
    mcq:
      question: '只想查看下一件而不取出，非空堆積應讀哪裡？'
      options:
        - '最後一格'
        - '任意葉節點'
        - '索引 0'
        - '只看索引一'
      answer: 2
      explain: '根最小，其他位置之間不保證全序；讀取不會移除。'
  - id: fd-algo-heap-tie
    prompt: '同優先工作要照到達順序處理，元組第二欄該放什麼？'
    answer: '放唯一且遞增的到達序號，優先數字相同時便先比較序號。'
    mcq:
      question: '用 (priority, label) 取代含序號元組，同分時可能如何？'
      options:
        - '仍保證先來先走'
        - '依標籤字串排序'
        - '依標籤長度而非字母決定'
        - '沒有第三欄就一定無法比較'
      answer: 1
      explain: '元組按欄位比較，沒有序號就沒有先後承諾。'
  - id: fd-algo-heap-choice
    prompt: '什麼工作型態最能發揮堆積的用途？'
    answer: '新工作不斷插入、同時需要反覆取出最小項，不必每次重新整理完整排名。'
    interview:
      question: '離線報表與即時工作排程，都一定要用堆積嗎？'
      points:
        - '確認是否有交錯新增'
        - '只需下一項或全部名次'
        - '比較一次排序與局部調整'
      answer: '若報表資料已齊且要全部排名，我會排序一次。工作排程中新單常在兩次服務之間出現，堆積可在對數級調整後提供新根，不必反覆替整張清單排名。'
practice:
  - id: fd-algo-heap-lab
    title: '把臨時急單放進服務紀錄'
    kind: code
    minutes: 12
    steps:
      - '執行 job_heap.py，保存查看時的數量與後續交付順序。'
      - '在 restore 之後再加入優先數字 2、序號 4、名稱 alpha 的工作。'
      - '重跑並註解為何 alpha 不會排到 index 前面。'
    checks:
      - '首次查看後數量是 3，首次交付 quiz。'
      - '之後依序 restore、index、alpha、notes，同優先由序號決定。'
---
## 為什麼要學
三件工作正在等，突然插入一件更急的。如果每次來單都把整份清單重新排序，才能回答「下一件是誰」，其實做了比問題要求更多的事。優先佇列 (priority queue) 只承諾能按優先順序拿出下一項，不承諾隨時提供所有工作的排名。分清這兩個要求，才知道為何值得另學一種結構。

## 核心概念
最小堆積 (min-heap) 可用串列保存一棵由上往下、同層從左到右填滿的二元樹。每位家長的鍵不大於自己的孩子，沿路往上不會變大，因此根一定是最小值。這個規則沒有要求兩個兄弟彼此排序。Python 的 `heapq` 把根存在索引 0；看 `heap[0]` 只查看，不會取走，取出則用 `heappop` 並讓剩餘元素恢復堆積規則。

加入新工作時，`heappush` 先放在可用位置，再往上調整；彈出根後可用末端元素補根，再往下調整。樹高是對數級，所以在通常的堆積操作模型下，推入與彈出的調整成本是 `O(log n)`，查看根是常數。若本來就有一整批資料，可用 `heapify` 線性建堆，不必假裝任意一個非空串列原本已經符合規則。

## 範例：重播一張臨時插入的急單
先預測下一份取出的工作。不必把堆積的內部陣列看成完整排序；真正保證的是哪一項優先離開。把下面的範例存成 `C:\dev\stackway-lab\algorithms` 裡的 `job_heap.py`。

在該目錄執行：Windows PowerShell 用 `py job_heap.py`；macOS／Linux 用 `python3 job_heap.py`。

```python
import heapq

jobs = []
for seq, (priority, label) in enumerate([(4, "notes"), (2, "quiz"), (2, "index")]):
    heapq.heappush(jobs, (priority, seq, label))

print("peek", jobs[0][2], "count", len(jobs))
print("first", heapq.heappop(jobs)[2])
heapq.heappush(jobs, (1, 3, "restore"))
while jobs:
    priority, seq, label = heapq.heappop(jobs)
    print("serve", priority, label)
```

這裡數字愈小愈急。元素是元組，比較時先看優先數字，相等再看遞增的到達序號，最後才可能看文字。序號不重複，所以同優先時由先來者勝出，不會因為工作名稱字母排前面而插隊。第一次查看與第一次取出都是測驗，差別是查看後仍有 3 筆。急單是第一次服務後才入列，不能倒過來搶走已交出去的工作，卻可以在下一輪先出。

如果全部工作一次到齊、之後不再插入，排序一次再依序讀取也很合理，排序成本通常為 `O(n log n)`，不必每取一筆就重排。堆積的優勢在於新工作與取出交錯時，只調整一條短路徑。不要拿一份剛插完的內部串列當作順序證明；除了根以外，其他位置未必是完整排名，要觀察服務順序就逐次彈出。

## 常見錯誤
對堆積直接 `append` 一件最急工作會讓它留在尾端，根可能從此不是最小。若工作鍵本來是數字愈大愈急，卻仍把它原樣送入最小堆積，服務順序也會顛倒。本例的約定要連同欄位說明保存。空堆積既沒有第 0 格也不能彈出，讀取前要先判斷，這和[〈堆疊與佇列〉](#/lesson/fd-algo-03-queue)中空隊伍的處理相同。

## 小結
只需要下一個最小值，就只維護足以保證根最小的規則；需要完整排名，才取得完整排序。再把同優先時靠什麼決定先後寫成資料的一部分，急單和同分工作都能得到可預測的服務。
