---
id: fd-algo-12-graphs
module: fd-algo
order: 12
title: 圖的 BFS 與 DFS
subtitle: 沿有環的路線也不會無限繞圈
status: ready
minutes: 35
level: 2
prereqs:
  - fd-algo-11-heap
objectives:
  - 把連線寫成鄰接串列並建立已訪問集合
  - 用 BFS 求無權最短距離，用 DFS 找連通區塊
tags:
  - algo
  - graphs
resources:
  - title: 'Open Data Structures：圖的走訪'
    url: 'https://opendatastructures.org/ods-python/12_3_Graph_Traversal.html'
    kind: book
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: '讀 BFS 距離與 DFS 可達性，對照訪問時機。'
concepts:
  - id: fd-algo-graphs-mark
    prompt: 'BFS 在什麼時候記錄距離，以避免重複排隊？'
    answer: '第一次發現鄰居時就記下距離，再將它排入佇列。'
    mcq:
      question: 'B、C 都能到 D；從 B 首次發現 D 時應怎麼做？'
      options:
        - '等 C 確認後才加入'
        - '每條路都排一次'
        - '立即記距離再排入'
        - '先排入 D，等取出時才首次登記距離'
      answer: 2
      explain: '登記後第二條邊就能辨認已發現的 D。'
  - id: fd-algo-graphs-distance
    prompt: 'BFS 的首次距離代表哪一種最短路？'
    answer: '每條邊都算一步時，首次距離是從起點走到該站的最少邊數。'
    mcq:
      question: '若 2 條路分別 2 段與 3 段，BFS 在本例最小化什麼？'
      options:
        - '車資'
        - '行車時間'
        - '等車時間'
        - '經過的邊數'
      answer: 3
      explain: '無權圖把每條邊同等視為一步，不能推論金額或實際時間。'
  - id: fd-algo-graphs-component
    prompt: '為什麼找全部連通區塊要再掃過所有站點？'
    answer: '一次 DFS 只能列出起點可達的群組；外層需從其餘未訪站另開走訪，包括孤立站。'
    interview:
      question: '從 A 查不到某站，怎麼確認它是另一區，而不是資料漏了？'
      points:
        - '先核對頂點與雙向邊都有登記'
        - '分清不可達與距離 0'
        - '從未訪站探索其區塊'
      answer: '我先確認站點確實存在，連線也在兩端列出。從 A 的距離表缺席只表示 A 到不了；再從該站做一次走訪，看它與哪些站連成一區。空清單仍算單站一區。'
practice:
  - id: fd-algo-graphs-lab
    title: '接一條新路，重算距離與分區'
    kind: code
    minutes: 12
    steps:
      - '儲存 station_routes.py，記下原本 3 組站點。'
      - '在 D 與 E 之間新增雙向連線，保留孤立站 G。'
      - '重跑並把 F 的距離與區塊數變化寫成檔尾註解。'
    checks:
      - '新增後從 A 到 F 為 4 步，原本不可達。'
      - '區塊從 3 組變成 2 組，G 仍是單獨一組。'
---
## 為什麼要學
站點之間多一條連線後，從起點去同一站可能有好幾條路；走錯方向也可能繞回起點。你想知道的是「最少經過幾段連線」，以及「哪些站就算繞路也到不了」。前者需要距離，後者只需要可達性。兩題可共用一份路線資料，但不能用任意一次深度走訪的先後順序去猜最短距離。

## 核心概念
圖 (graph) 用頂點表示站、邊表示連線。鄰接串列 (adjacency list) 只列出每一站直接連到誰，不預先列出所有路徑。本例是無向圖 (undirected graph)，所以每一條邊都登記在兩端；即使孤立站沒有鄰居，也保留它的鍵與空清單。所有連線都當作一步，稱為無權圖 (unweighted graph)。這個假設是求最少邊數的關鍵，不等於每段實際車程都相同。

廣度優先用佇列把起點排在第 0 層。從距離為某數的站第一次發現新鄰居時，它的距離就是該數加 1，立即登記並排隊。之所以能保留第一次，是因為更短的所有層都先處理，不會事後才冒出一條更少步的路。距離字典同時充當已訪標記，避免多條邊將同一站重複送入隊伍。

## 範例：同一張路線圖回答 2 個問題
開啟 `C:\dev\stackway-lab\algorithms`，將範例另存為 `station_routes.py`。畫一條能繞回起點的路。沿途寫下何時標為已訪問，才能解釋走訪為何不會在這條環上打轉。

在該目錄執行：Windows PowerShell 用 `py station_routes.py`；macOS／Linux 用 `python3 station_routes.py`。

```python
from collections import deque

routes = {"A": ["B", "C"], "B": ["A", "D"], "C": ["A", "D"],
          "D": ["B", "C"], "E": ["F"], "F": ["E"], "G": []}

def distances(graph, start):
    dist, queue = {start: 0}, deque([start])
    while queue:
        node = queue.popleft()
        for other in graph[node]:
            if other not in dist:
                dist[other] = dist[node] + 1
                queue.append(other)
    return dist

def components(graph):
    seen, groups = set(), []
    for start in graph:
        if start in seen:
            continue
        group, stack = [], [start]
        seen.add(start)
        while stack:
            node = stack.pop()
            group.append(node)
            for other in graph[node]:
                if other not in seen:
                    seen.add(other)
                    stack.append(other)
        groups.append(sorted(group))
    return groups

print(distances(routes, "A"))
print(components(routes))
```

先追從 A 出發的隊伍。B 與 C 都在一步外，兩邊都能通往 D；先從 B 發現 D 時就登記 2 步，處理 C 時不再送入第二個 D。字典沒出現 E 並非距離 0，而是不可達。0 只屬於起點。若把邊改成不同車資並改問最便宜，先到達的路未必最便宜，不能把相同結論照搬。

連通區塊 (connected component) 指無向圖中彼此可到達、且無法再擴大的那一組站。對某個未訪站做一次深度優先，以堆疊列完可達的同伴，就收成一組。外層還要巡過每個站作為候選起點，所以最後的孤立站不會消失。組內排序只為方便閱讀，不是深度優先的拜訪順序。用鄰接串列走訪本身的工作量與頂點數加上邊數成正比；這裡為展示排序另有成本。

畫圖時，先把沒有任何連線的站點也畫成圓圈，最後才添邊。這可以提醒你，站點清冊與連線清冊是不同的輸入；只從連線推回站點會漏掉孤立站。

## 常見錯誤
若把已訪集合放進外層每一回都重設，就會從同一區塊的另一站重新列一次。只從 A 出發一次，則根本不會看見另外兩區。也不要在回傳距離時用 0 當作找不到的預設值，那會讓無路可走看起來和「已站在目的地」一模一樣。

## 小結
要最少步數，就分層探索並在首次發現時記距離；只要分區，就從每個未訪站收集一整塊。先寫清楚邊有沒有方向、每步的成本是否相同，再選方法，才不會得到計算正確卻答錯問題的路線圖。
