---
id: cr-coding-06-backtrack
module: cr-coding
order: 6
title: 回溯搜尋與剪枝
subtitle: 選了又撤回，不要污染下一條路
status: ready
minutes: 35
level: 4
prereqs:
  - cr-coding-03-graph
objectives:
  - 畫出小型組合題的搜尋樹
  - 用終止、撤回與剪枝解釋每個答案為何只出現一次
tags:
  - coding
  - backtrack
resources:
  - title: Python itertools：依位置列舉組合
    url: https://docs.python.org/zh-tw/3/library/itertools.html#itertools.combinations
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-coding-06-backtrack-start
    prompt: 選完第 i 個位置，下一層從哪裡開始才不重複？
    answer: 從 i+1，只建立嚴格遞增的位置序列。
    mcq:
      options:
        - i
        - '0'
        - i+1
        - 最後一個位置
      answer: 2
      explain: 從 i 會重選自己，從 0 會產生排列，直接跳到最後會漏選。
    interview:
      question: 你怎麼證明這棵樹沒有少列，也沒有列兩次？
      points:
        - 位置嚴格遞增
        - 每個合法組合有唯一遞增順序
        - 剪枝只移除不可能分支
      answer: 我把任一組合按位置排好，就得到樹上唯一的一條路。反過來每條走滿的路也確實只選了指定門數。候選數不足才提前返回，所以不會剪掉剛好能湊滿的解。
  - id: cr-coding-06-backtrack-snapshot
    prompt: 為何葉子要存 tuple(path) 而非共用 path？
    answer: 固定當下結果，避免稍後撤回時改到已交付的答案。
    mcq:
      options:
        - 讓下一層從頭開始
        - 讓候選自動排序
        - 省去撤回動作
        - 保留獨立快照
      answer: 3
      explain: 快照和撤回解決不同問題，存快照不會替你清理目前分支。
  - id: cr-coding-06-backtrack-prune
    prompt: 何時可用剩餘數量剪枝？
    answer: 剩餘候選嚴格少於所缺數量；剛好相等還可能有解。
  - id: cr-coding-06-backtrack-zero
    prompt: 選 0 門為什麼是 [()] 而非 []？
    answer: 空選擇本身是一個合法組合；空結果串列則代表沒有任何合法組合。
    mcq:
      question: 有 4 門課，要求恰選 0 門，應列出多少個合法組合？
      options:
        - 0 個，因為沒有課名
        - 1 個，即空組合
        - 4 個，每門各代表一次不選
        - 無法定義，和要求選 5 門相同
      answer: 1
      explain: 不選任何一門便滿足條件，而且只有這一種選法；選得比候選多才是無解。
practice:
  - id: cr-coding-06-backtrack-p1
    title: 畫樹並對照標準函式
    kind: code
    minutes: 14
    steps:
      - 保留 choose.py，畫出從 4 選 2 的前 2 層，標示加入、撤回與剪枝。
      - 用 itertools.combinations 對照正常、選 0 門與選 5 門的結果，將差異或一致記入 choose.md。
    checks:
      - 正常版列出 6 個不同組合，邊界分別是 [()] 與 []。
      - 紙上能指出從 AB 回到 A 再到 AC 時哪一步需要 pop。
---

## 如何讓每一份選課清單只出現一次？
從甲、乙、丙、丁 4 門課挑 2 門，不在意先後。有些人先列所有可能順序，再把重複結果丟掉；但選甲再乙，和選乙再甲，根本不需要走兩遍。回溯搜尋 (backtracking) 的價值在於把可行選擇排成樹，每一條走到底的路都代表一個答案，走回分岔時還能乾淨地換下一條路。

## 搜尋樹只記錄「下一步還能從哪裡選」
假設課程按原位置排列、名稱不重複。根是空清單，第一層表示第一個選擇，第二層表示第二個。挑完第 i 門後，下一層只准從 i 加 1 開始。於是甲乙有路，乙甲從一開始就沒有路；對於任一合法組合，把位置由小到大讀一遍，就能唯一走到它。這同時說明不會重複，也不會漏掉。

狀態分為兩部分：`start` 是本次可以考慮的第一個位置，`path` 是到這裡為止借用的選課清單。當清單長度等於目標就存快照並返回，不再多選。尚未選滿時，如果剩下所有候選加起來也不夠，整個分支可以提前停止，這叫剪枝 (pruning)。判斷能否剪枝靠的是不可能完成的證據，不是某條路「看起來不太好」。

## 範例：走到葉子時，存的是照片不是共用白板
將 `choose.py` 存在 `C:\dev\stackway-lab\coding`，執行 `py choose.py`；macOS／Linux 用 `python3 choose.py`。

```python
def choose(items, k):
    out, path = [], []
    def visit(start):
        if len(path) == k:
            out.append(tuple(path))
            return
        if len(items) - start < k - len(path):
            return
        for i in range(start, len(items)):
            path.append(items[i])
            visit(i + 1)
            path.pop()
    visit(0)
    return out

print(choose("ABCD", 2))
```

拿出紙追第一個分岔：甲放進清單、乙放進清單、存甲乙、拿走乙。此時你仍在甲的分支，只能拿走乙不能把甲也清掉。接下來加入丙才得到甲丙。等甲的所有搭配都走完，才返回根並移走甲。如果在存答案時只放入同一個清單的參照，之後每次撤回都會連已交出的答案一起改掉。

### 剩下的候選剛好夠時
以 4 選 3 為例，根節點若跳過甲、從乙開始，後面只剩丙和丁。雖然已經沒有挑選餘地，乙丙丁卻是合法答案；若從丙開始，之後只剩丁，才真的不夠。這兩條路只差一個位置，剛好能驗證不等號。再把葉子中的顯示名稱換成原始位置，就能核對每條答案裡的位置都嚴格遞增，而不必相信清單看起來好像沒有重複。

## 常見錯誤
剪枝用了「小於等於」而非「小於」，剛好還夠選的分支會被砍掉。還有一個值得先問的邊界：從任意清單選 0 門，答案是包含空組合的一份結果，不是沒有解；要求門數超過總數才是真的沒有解。本例把位置視為不同課程；若允許名稱重複且只認名稱組合，同層還得另處理重複，不能事後才宣稱原寫法支援。

## 小結
畫 2 層樹就能驗證四件事：往下時新增哪個選擇、往上時撤回什麼、何時複製、何種分支確定不可能成功。輸出本身有很多份時，剪枝也不能省掉寫出每份答案的成本。
