---
id: fd-algo-04-search
module: fd-algo
order: 9
title: 二分搜尋與邊界
subtitle: 用邊界查找第一筆符合值
status: ready
minutes: 30
level: 2
prereqs:
  - fd-algo-08-sorting
objectives:
  - 說明二分搜尋要求的排序前提
  - 追蹤兩個元素時左右界如何收斂
tags:
  - algo
  - binary-search
resources:
  - title: 'Python：bisect_left 與左右分區'
    url: 'https://docs.python.org/zh-tw/3/library/bisect.html'
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '對照回傳的插入位置與分區條件。'
concepts:
  - id: fd-algo-search-predicate
    prompt: '什麼條件讓二分法能找第一筆至少達門檻的值？'
    answer: '合格判斷必須先全假再全真，非遞減排序的數值讓這個條件成立。'
    mcq:
      question: '在未排序的分鐘數上直接二分，最主要的問題是什麼？'
      options:
        - '排序只影響速度，不影響答案'
        - '排除一半不再有根據'
        - '只要沒有重複值就仍保證找到'
        - '只要目標有出現就仍保證找到'
      answer: 1
      explain: '只有單調的合格條件才能由中點推論整側。'
  - id: fd-algo-search-shrink
    prompt: '中點太小時，半開區間的左界應如何更新？'
    answer: '設為 mid+1，排除已不合格的中點，並讓區間嚴格縮小。'
    mcq:
      question: '只剩 1 筆且它太小，寫 lo = mid 會怎樣？'
      options:
        - '找到最後一筆'
        - '區間多一筆'
        - '區間不再縮短'
        - '自動回傳長度'
      answer: 2
      explain: '此時 mid 就是 lo，指定原值無法推進。'
    interview:
      question: '你會如何用 2 筆資料證明二分搜尋不會卡住？'
      points:
        - '寫明半開區間'
        - '逐步追蹤太小與合格分支'
        - '觀察區間縮小直到會合'
      answer: '我用 4 和 9 找 8。先把右界從 2 收至一，再讓左界從 0 到一。兩次待查數量都減少，最後交界是一；再找 10，驗證回傳長度而不是讀到越界。'
  - id: fd-algo-search-sentinel
    prompt: '若全部都比門檻小，左界搜尋回傳什麼？'
    answer: '回傳長度作為尾端插入位置；必須先檢查才能取值。'
practice:
  - id: fd-algo-search-lab
    title: '記下三種門檻的邊界軌跡'
    kind: code
    minutes: 10
    steps:
      - '執行 first_at_least.py，先記下 2 筆找 8 時的 lo、hi、mid。'
      - '另測門檻小於全部與等於重複值的案例。'
      - '在回傳位置後加判斷，有該位置才印實際值，否則印 none。'
    checks:
      - '空串列與全不合格都不會越界。'
      - '對 4、9、9、12 找 9 時位置為 1，所有 check 都為 True。'
---
## 為什麼要學
一排已排序的等候分鐘裡，要找第一筆「至少 10 分鐘」。10 分鐘可能出現三次，也可能根本沒有：若最早合格的是 12 分鐘，它仍是答案。單問有沒有 10 不夠，碰到一個 10 就停也不一定回到第一筆。這題尋找的是小於門檻和達到門檻的兩段交界，而不是某個剛好相等的數字。

## 核心概念
二分搜尋 (binary search) 利用判斷由假變真的順序，每次檢查中間位置以排除一部分候選。在非遞減排序的資料中，小於門檻都在左邊，大於等於門檻都在右邊，因此這個前提成立。左界搜尋 (lower bound) 回傳第一個不小於門檻的位置；若所有值都太小，回傳長度，意思是交界在尾端之後，不是最後一個元素。

用半開區間 (half-open interval) `[lo, hi)` 表示還要檢查的元素，包含左端不含右端。開始是 0 到長度；左界以前都已知太小，右界起都已知合格。算中點時用整除。若中點太小，中點本身也不合格，所以左界可跳至中點加 1。若中點合格，不能排除它是第一筆，於是右界設為中點，保存這個已知合格的邊界，再往左查。

## 範例：讓標準函式核對你找到的交界
開啟 `C:\dev\stackway-lab\algorithms`，將範例另存為 `first_at_least.py`。把門檻放在兩個相鄰值之間，再試一次正好等於門檻的情況；兩者能分出「找到某值」和「找到邊界」。

在該目錄執行：Windows PowerShell 用 `py first_at_least.py`；macOS／Linux 用 `python3 first_at_least.py`。

```python
from bisect import bisect_left

def first_at_least(values, target):
    lo, hi = 0, len(values)
    while lo < hi:
        mid = (lo + hi) // 2
        print("range", lo, hi, "mid", mid)
        if values[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo

for values, target in [([4, 9], 8), ([4, 9, 9, 12], 9), ([], 2), ([4, 9], 10)]:
    pos = first_at_least(values, target)
    print("pos", pos, "check", pos == bisect_left(values, target))
```

先只看 2 筆的案例。左界 0、右界 2，中點一的值 9 已合格，因此保留交界一；尚待檢查的是左邊那張 4。第二輪中點 0 太小，左界前進到一，和右界會合，答案是一。若改成查 10，第一輪便能排除 2 筆，回傳 2。呼叫端若真的要讀值，必須先確認位置小於長度，不能把「都不合格」的合法結果拿去當索引。

含重複 9 的案例中，第一次看到相等只代表右端可收，不代表可立即回傳。判斷改成小於等於時會連相等的值都排除，尋找的就變成第一個嚴格大於門檻的位置。兩種搜尋都有用途，但題目這次明寫「至少」，要把相等保留下來。每輪約對半縮小，查詢時間是對數級；這不包含把亂序資料事先整理好的時間。

## 常見錯誤
若中點太小卻寫 `lo = mid`，在只剩一個待查位置時，中點等於左界，區間永遠不變。寫成 `hi = mid - 1` 則混用了含右端的另一種規則，可能跳過正確答案。追查時不必亂改加一減一：畫出左右兩側已證實的條件，並確認每一次更新後待查元素真的變少。

畫一個比清單內每項都大的門檻。此時「插入位置在尾端」是答案，不代表尾端真的有一筆可以讀取的資料。

## 小結
把「找一個值」改問為「第一個合格位置在哪裡」，就能統一處理相等、缺值、重複和空資料。先決定邊界的含義，再選更新式；最後位置有意義，不代表那個位置一定有可讀的元素。
