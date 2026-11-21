---
id: cr-coding-03-graph
module: cr-coding
order: 5
title: 圖的拓樸排序
subtitle: 怎麼知道所有相依工作都做得完
status: ready
minutes: 30
level: 4
prereqs:
  - cr-coding-04-greedy
objectives:
  - 用入度推演拓樸排序
  - 以未處理節點辨認循環相依
tags:
  - coding
  - topological-sort
resources:
  - title: CSES：課程先後順序
    url: https://cses.fi/problemset/task/1679
    kind: interactive
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-coding-03-graph-indegree
    prompt: 2 個直接前置只完成其中一個，工作能排入 ready 嗎？
    answer: 不能；剩餘入度要降到 0 才能入列。
    mcq:
      options:
        - 可以，已滿足任一條件
        - 不能，還有一票未解
        - 可以，因為已有入邊
        - 取決於工作名稱的排序
      answer: 1
      explain: 此題所有前置都必須滿足，而不是滿足一個就行。
  - id: cr-coding-03-graph-blocked
    prompt: 拓樸排序中途停住，剩餘節點代表什麼？
    answer: 剩餘子圖有環，也可能包含被環阻擋的下游。
    mcq:
      options:
        - 每個剩餘節點都在同一環
        - 所有原始節點都有錯
        - 有環或依賴到環的未完成工作
        - 無環只是佇列太小
      answer: 2
      explain: 環會堵住下游，剩餘清單不能直接當成環路徑。
    interview:
      question: 剩下 3 個工作沒做，是否應移除這 3 個依賴？
      points:
        - 區分環與下游
        - 說明如何找到問題邊
        - 先核對業務含義
      answer: 我會先畫剩餘箭頭。例如建置與測試互等，包裝可能只是等測試。先找一條閉合路徑，和定義工作的人核對哪個前置寫反，不會整批刪掉合法的依賴。
  - id: cr-coding-03-graph-verify
    prompt: 如何驗證一個不同於範例的完整拓樸順序？
    answer: 確認每個節點恰出現一次，且每條邊的起點都比終點早。
  - id: cr-coding-03-graph-isolated
    prompt: 沒有任何連線的獨立工作應何時加入佇列？
    answer: 一開始即可加入，因為它的入度為 0。
    mcq:
      options:
        - 初始化時
        - 所有連線工作完成後才可
        - 永遠不用列出
        - 第一個鄰居完成時
      answer: 0
      explain: 它是節點清單的一部分且沒有前置，也不會有鄰居替它觸發入列。
practice:
  - id: cr-coding-03-graph-p1
    title: 留下正常與互鎖兩張入度表
    kind: code
    minutes: 12
    steps:
      - 保存 order.py，以每次取出的節點為一列，在 order.md 記錄其鄰居扣票前後的值。
      - 加入測試指回建置的邊，分別標記在環內與受阻的工作。
    checks:
      - 正常版每個節點都被處理，文件不因為沒有箭頭而遺失。
      - 異常版只完成 docs，能把 pack 與 build、test 的角色分開。
---

## 排得出前 2 步，不代表整個專案做得完
發布工作有先後順序：先建置才能測試，測試通過才包裝。如果又規定「建置前必須先包裝」，再多執行緒也無法開始。把工作畫成有向圖 (directed graph)，節點代表工作，箭頭從先完成的工作指向後續工作。拓樸排序 (topological sort) 要找的是一列合法順序，不是最短工期，也不要求只有一個答案。

## 把每個尚未解開的條件記成一票
入度 (in-degree) 是指向該節點的邊數。在還沒做任何工作時，入度就是未完成的直接前置數。將所有入度為 0 的節點放進佇列，取出一個表示它完成了；只對從它指出去的鄰居各扣一票。某個鄰居扣到 0 才可以排入，不是「有人完成就輪到我」。一個完全沒有邊的獨立工作一開始也該在佇列裡，所以要從完整節點清單初始化，不只看箭頭。

## 範例：不要把被堵住的人都說成肇因
在 `C:\dev\stackway-lab\coding` 存 `order.py`，執行 `py order.py`；macOS／Linux 用 `python3 order.py`。這裡每條邊都對應一個真實、未重複的依賴，兩端都在節點清單內。

```python
from collections import deque

def plan(nodes, edges):
    after = {v: [] for v in nodes}
    need = dict.fromkeys(nodes, 0)
    for a, b in edges:
        after[a].append(b)
        need[b] += 1
    ready = deque(v for v in nodes if need[v] == 0)
    done = []
    while ready:
        v = ready.popleft()
        done.append(v)
        for w in after[v]:
            need[w] -= 1
            if need[w] == 0:
                ready.append(w)
    return done, [v for v in nodes if need[v] > 0]

tasks = ["build", "test", "pack", "docs"]
edges = [("build","test"), ("test","pack")]
print(plan(tasks, edges))
print(plan(tasks, edges + [("test","build")]))
```

第一輪起跑時建置與文件都自由，兩者先後不影響合法性。加上最後一條邊後，只剩文件可以先完成。建置和測試互相等待；包裝雖然也沒被處理，卻是被上游卡住，不在那個環上。若題目只問能否完成所有工作，比較處理數和節點數即可；若要求列出具體環，剩餘名單不是答案，需再沿著剩下的邊尋找閉合路徑。

### 如何驗算別人列出的順序？
先確認每個節點只出現一次且沒有遺漏，再為每個節點記下它的位置，沿每條邊檢查起點都排在終點以前。這樣就算另一位面試者先做文件，你也不用把自己的輸出當唯一標準答案。只檢查工作數會放過依賴倒置的序列；只檢查已出現的邊會漏掉獨立工作。

試著只改建置和文件在節點清單的先後，再跑沒有環的那組資料。你可能得到不同的第一步，但每條依賴仍被滿足。若產品需要每次畫面順序完全一致，才額外為同時可做的工作訂優先規則；這是顯示或排程政策，不是判斷依賴是否有環的必要條件。

## 常見錯誤
把箭頭畫成「我需要誰」，卻仍然對後者加入度，結果排序會整個反過來。先選一條你明知正確的依賴，大聲讀成「建置完成才測試」，再寫入資料。每個節點進出佇列至多一次，每條邊恰好處理一次，因此時間和儲存量都隨節點數加邊數成長。

輸出長度不足時，先列出仍有入度的節點；它們可能是環上的節點，也可能只是被環擋住的後續工作。

## 小結
入度表是尚缺條件的帳本。帳本無法再銷帳但還有工作時，能確定至少有一個環，不能直接怪罪所有還在等的人。
