---
id: fd-algo-05-trees
module: fd-algo
order: 10
title: 樹的 BFS 與 DFS
subtitle: 走訪樹與相鄰節點
status: ready
minutes: 35
level: 2
prereqs:
  - fd-algo-04-search
objectives:
  - 用已拜訪集合避免重複走訪
  - 比較廣度與深度優先的空間需求
tags:
  - algo
  - graphs
resources:
  - title: 'Open Data Structures：二元樹走訪'
    url: 'https://opendatastructures.org/ods-python/6_1_BinaryTree_Basic_Binary.html'
    kind: book
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '讀深度遞迴和用佇列逐層走訪的差異。'
concepts:
  - id: fd-algo-trees-frontier
    prompt: 'BFS 為什麼在同一層還沒做完前不會先處理孩子？'
    answer: '孩子排在佇列尾端，較早排隊的同層節點先取出。'
    mcq:
      question: '根下有 A、B，A 還有 C。鄰居照 A、B 加入，BFS 前 3 個是？'
      options:
        - 'R、A、C'
        - 'R、A、B'
        - 'R、C、A'
        - 'C、A、R'
      answer: 1
      explain: 'C 在處理 A 時才加入隊尾，不能超過已排隊的 B。'
  - id: fd-algo-trees-seen
    prompt: '樹的連線雙向列出時，為何還要辨認來過的節點？'
    answer: '孩子的鄰居含父節點，若不排除來路，程式會沿同一條邊來回。'
    mcq:
      question: '對雙向連結的樹，哪一項能防止沿父子邊反覆拜訪？'
      options:
        - '只檢查鄰居是否等於自己'
        - '只把兄弟節點排序後再加入'
        - '標記已拜訪節點'
        - '走訪結束後才把結果去重'
      answer: 2
      explain: '父節點不是孩子本身；排序鄰居或事後去重，都無法在走訪當下擋住回頭。'
  - id: fd-algo-trees-memory
    prompt: '不計結果與已訪集合時，BFS 和遞迴 DFS 的待辦空間各受什麼影響？'
    answer: 'BFS 受最寬層級影響，遞迴 DFS 受最深路徑影響。'
    interview:
      question: '樹很寬或很深，哪種走訪比較省空間？'
      points:
        - '區分寬度與高度'
        - '說明佇列或呼叫堆疊'
        - '另計已訪集合與輸出'
      answer: '我會先問算哪部分。很寬時廣度可能同時排很多節點；單鏈很深時遞迴堆疊才是負擔。本例還存了全部輸出和已訪集合，不能只比隊伍大小就宣稱整體是常數。'
practice:
  - id: fd-algo-trees-lab
    title: '留下教材樹的兩種路線'
    kind: code
    minutes: 12
    steps:
      - '儲存 tree_walks.py，畫出 R、A、B、C、D 5 個節點。'
      - '在 B 底下加 E，連線兩端都要列出，重跑兩種走訪。'
      - '把兩種結果寫在圖下並圈出首次分歧。'
    checks:
      - 'BFS 在 C 前處理 B，DFS 則先到 C。'
      - '兩種結果都含 6 個不同節點，且沒有重複回到 R。'
---
## 為什麼要學
要列出站內教材，有兩種合理的順序。給導覽畫面時，先列全部第一層，再展開下一層；整理每個單元的內容時，則可能想先做完一整個分支再回來。資料沒變，改變的是下一個輪到誰。用只有 5 個節點的樹來試，這個先後差異一眼就看得出來。

## 核心概念
樹 (tree) 是連通而沒有環的結構；指定根節點 (root) 後，就能談上下層與父子關係。廣度優先搜尋 (breadth-first search，BFS) 用佇列保存已發現但尚未處理的節點，靠先進先出維持由近到遠。深度優先搜尋 (depth-first search，DFS) 則選一個分支一路深入，到盡頭才返回改走下一支；本例用遞迴的呼叫堆疊記住回程位置。

如果表中只記從父到子的連結，真正的樹上每個非根節點只有 1 個入口。但本例為了能由任一節點出發，兩端都列鄰居，子節點也看得見父節點。若不排除來路，雖然原結構沒有環，程式仍能在同一條邊來回。本例用已拜訪集合 (visited set) 做記號：BFS 發現時先標再排入，DFS 進入節點便標再下探。

## 範例：用 2 種順序讀同一棵教材樹
在 `C:\dev\stackway-lab\algorithms` 新建 `tree_walks.py`。畫好樹後只改等待取出的節點順序。兩種走訪可以看過相同的節點，卻在不同時刻到達同一層。

在該目錄執行：Windows PowerShell 用 `py tree_walks.py`；macOS／Linux 用 `python3 tree_walks.py`。

```python
from collections import deque

tree = {"R": ["A", "B"], "A": ["R", "C", "D"],
        "B": ["R"], "C": ["A"], "D": ["A"]}

def breadth(start):
    queue, seen, order = deque([start]), {start}, []
    while queue:
        node = queue.popleft()
        order.append(node)
        for other in tree[node]:
            if other not in seen:
                seen.add(other)
                queue.append(other)
    return order

def depth(node, seen, order):
    seen.add(node)
    order.append(node)
    for other in tree[node]:
        if other not in seen:
            depth(other, seen, order)

print(breadth("R"))
order = []
depth("R", set(), order)
print(order)
```

把根的兩個鄰居依序寫進隊伍，取出左邊的 A 後，才把它的兩個孩子放在尾端。原本就在排隊的 B 不會被插隊，所以廣度結果是根、A、B、C、D。深度版本在 A 看見根時先略過，處理 C 後回到 A 再進 D，最後才返回根改走 B。把根的鄰居順序對調，合法的同層次序可能變，但先廣後深的原則不變。

若只比較走訪途中「尚待執行」的空間，廣度佇列受樹的最大寬度影響，遞迴深度受樹高影響。細長如單鏈的樹，廣度隊伍很短，遞迴卻可能很深；扁寬的樹正好反過來。這份程式另外保留已拜訪集合與完整輸出，兩者都可能存下全部節點，所以不能由隊伍較短就斷言整支程式只用常數空間。

若只保存父到子的連結，你可以不使用已訪集合就正確走訪這棵樹。但那依賴輸入確實是樹，而且箭頭只有向下的方向；不能刪掉保護後繼續用本例的雙向鄰居表。

## 常見錯誤
把 BFS 的取出改為尾端彈出，仍可能走到全部節點，卻不再保證同層優先。只核對節點總數測不出這個問題；要挑一個第一層還沒做完、第二層已經能被發現的例子。每次新走訪要建新的已訪集合，不要把上趟記號直接沿用，否則第二種方法可能還沒出發就以為整棵樹都看過。

## 小結
選走訪方式先看輸出需要分層還是分支，再看樹寬與樹高。之後在[〈圖的 BFS 與 DFS〉](#/lesson/fd-algo-12-graphs)會細講多條路都能通往同一節點時，如何利用首次到達的層數找最少步數。
