---
id: fd-algo-07-recursion
module: fd-algo
order: 7
title: 遞迴與終止條件
subtitle: 把工作切小，直到答案直接看得出來
status: ready
minutes: 30
level: 2
prereqs:
  - fd-algo-06-linked
objectives:
  - 指出基底案例與縮小規模的步驟
  - 手推呼叫堆疊與回傳順序
tags:
  - algo
  - recursion
resources:
  - title: 'Runestone：遞迴的 3 個條件'
    url: 'https://runestone.academy/ns/books/published/pythonds3/Recursion/TheThreeLawsofRecursion.html'
    kind: book
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '用自己的例子辨認終止與縮小步驟。'
concepts:
  - id: fd-algo-recursion-base
    prompt: '對尾段加總而言，空尾段為什麼可直接回 0？'
    answer: '沒有元素可加，0 是加法的單位值，而且可以在讀取索引前停止。'
    mcq:
      question: '傳入空串列時應先做什麼？'
      options:
        - '先讀 rows[0]'
        - '先向下呼叫'
        - '直接回傳 0'
        - '回傳第一筆'
      answer: 2
      explain: '在空資料上沒有合法索引，加法則有明確的空結果。'
  - id: fd-algo-recursion-progress
    prompt: '這個遞迴每次縮小的是哪個量？'
    answer: '尚未處理的筆數 len(rows)-i，索引每前進一格便減少一筆。'
    mcq:
      question: '哪個呼叫會讓未完成的工作確實縮小？'
      options:
        - 'remaining(rows, i)'
        - 'remaining(rows, i + 1)'
        - 'remaining(rows, 0)'
        - 'remaining(rows, i - 1)'
      answer: 1
      explain: '從合法起點往尾端前進才會達到基底；串列本身不必複製。'
  - id: fd-algo-recursion-stack
    prompt: '基底回傳後，哪一層先完成自己的加法？'
    answer: '最接近基底且仍在等待的那一層先收到結果，然後往外層返回。'
    interview:
      question: '一個線性時間的遞迴，為何仍可能不適合很長的清單？'
      points:
        - '每層等待下一層回傳'
        - '深度隨筆數增加'
        - '可用迴圈減少空間與深度風險'
      answer: '每筆雖只加一次，但最深時所有上一層都還在等，堆疊空間也是線性。若只是單向加總，我會保留同一個累加值改用迴圈，不靠調高遞迴限制。'
practice:
  - id: fd-algo-recursion-lab
    title: '留下三筆資料的回程圖'
    kind: code
    minutes: 10
    steps:
      - '執行 unwind_total.py，把 3 個等待中的加法寫成縮排圖。'
      - '在每一層旁標出收到的 rest 與交回的 result。'
      - '再跑空串列與只有 9 的串列，保存輸出摘要。'
    checks:
      - '回程結果從內往外為 7、8、12。'
      - '空輸入直接回 0，單張回 9，都不會越界。'
---
## 為什麼要學
手上有 3 張分鐘卡，要算出總和。除了用迴圈從左加到右，也可以說：「第一張的分鐘，加上剩餘卡片的總和。」後半句還是同一個問題，只是待處理的卡少了一張。這堂先用你已會加總的題目練習看清呼叫與回傳；之後在[〈排序演算法〉](#/lesson/fd-algo-08-sorting)會把大問題拆成兩個較小的排序問題。

## 核心概念
遞迴 (recursion) 是函式直接或間接呼叫自己。它需要能直接回答的基底案例 (base case)，也需要每次把問題推近這個案例。這裡讓索引代表第一張尚未加進去的卡。當索引等於串列長度，已經沒有剩餘卡片，空的總和為 0。否則留下目前值，請下一層計算從下一個索引開始的總和。

函式呼叫有自己的執行紀錄，放在呼叫堆疊 (call stack) 上。往下呼叫時，上一層還沒完成加法，必須記住自己的位置與接下來要做的事。抵達空尾端回傳 0，是開始逐層結算，不是跳回最外層直接回 0。每層收到下一層的答案，才能把自己的卡加進去，再還給上一層。這是為何進入順序和回傳順序恰好相反。

## 範例：在下樓與上樓各留一條紀錄
在 `C:\dev\stackway-lab\algorithms` 新建 `unwind_total.py`。分開列出往下呼叫與往回傳值的順序。抵達停止條件時，上一層的計算仍在等它的結果。

在該目錄執行：Windows PowerShell 用 `py unwind_total.py`；macOS／Linux 用 `python3 unwind_total.py`。

```python
def remaining(rows, i=0):
    print("enter", i)
    if i == len(rows):
        print("base", i, 0)
        return 0
    rest = remaining(rows, i + 1)
    result = rows[i] + rest
    print("leave", i, result)
    return result

print("total", remaining([4, 1, 7]))
```

在紙上分欄寫「等待什麼」與「拿到什麼」。最外層手中有 4，在等後 2 張；下一層手中有一，等最後一張；再下一層手中有 7，在等空總和。到索引 3 時不要讀 `rows[3]`，因為它已經超出最後位置。基底回 0 後，先完成的是索引 2，拿到 7；索引一隨後得到 8；最後才輪到索引 0 得到 12。你不必把每一層都當成在修改同一個累加器。

本例傳的是同一份串列和新索引，不要把遞迴等同於每次都複製較短的串列。每個位置只計算一次，時間是線性；但在最深處，尚未完成的層數也隨筆數增加，輔助空間同樣是線性。若用 `rows[1:]` 每次切出尾段，還會多出複製成本。規模很大時，這種單向加總改寫成迴圈能避免大量呼叫紀錄。

## 常見錯誤
寫了停止條件卻一直傳同一個索引，相當於一直請別人解同一份工作，永遠到不了基底。把檢查放在讀取當前值之後，空串列一開始就會越界。還有一種錯只在回程浮現：若算出結果卻沒寫 `return`，上一層拿到的不是數字。先用 0 張、一張和 2 張的例子看完整回程，通常比提高遞迴深度限制更有幫助。

## 小結
先把函式的承諾講成一句話，再指出最小工作與每次縮小的量。看程式時追兩條路：進入時問題變小，回傳時答案變完整。兩條路都能手推，才是真的理解遞迴，而不是只會把函式名寫兩次。
