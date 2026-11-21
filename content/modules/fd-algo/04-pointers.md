---
id: fd-algo-04-pointers
module: fd-algo
order: 4
title: 雙指標法
subtitle: 兩端往中間找一對目標值
status: ready
minutes: 35
level: 2
prereqs:
  - fd-algo-02-hash
objectives:
  - 在已排序陣列決定哪個指標該移動
  - 說明每次移動為何不漏掉可行解
tags:
  - algo
  - pointers
resources:
  - title: 'USACO Guide：雙指標'
    url: 'https://usaco.guide/silver/two-pointers'
    kind: course
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: '讀相向移動的雙指標與兩數和例題。'
concepts:
  - id: fd-algo-pointers-small
    prompt: '有序資料兩端和太小，為什麼能排除左端？'
    answer: '右端已是左端最大可能的搭檔，換成範圍內其他值也不會達標。'
    mcq:
      question: '已排序的 1、4、6、9，目標 12，第一步應怎麼做？'
      options:
        - '右端左移'
        - '兩端都移'
        - '停止並回無解'
        - '左端右移'
      answer: 3
      explain: '一配 9 都不足，固定一的其他配法也不會更大。'
  - id: fd-algo-pointers-distinct
    prompt: '為什麼迴圈用 left < right？'
    answer: '必須選兩個不同位置，相遇時只剩同一張卡可選。'
    mcq:
      question: '資料只有 1 張 5，目標 10，應回傳什麼？'
      options:
        - '索引 0、0'
        - '無解'
        - '數值 5、5'
        - '位置 0、1'
      answer: 1
      explain: '不能重複使用同一位置，但兩個不同位置的相同值可以配對。'
  - id: fd-algo-pointers-sorted
    prompt: '什麼輸入條件讓移動一端不會漏掉答案？'
    answer: '區間按數值遞增或非遞減，兩端才提供最小與最大搭檔的界線。'
    interview:
      question: '同事把相向指標直接套到未排序輸入，你怎麼評估？'
      points:
        - '指出排除理由依賴兩端極值'
        - '計入排序成本'
        - '釐清回傳的是原索引還是值'
      answer: '我會先問輸入是否已排序。沒有這個保證，端點不是極值，排除它可能漏解。若改為先排序，要計算排序時間，也得保存原位置，不能把排序後索引直接當答案。'
practice:
  - id: fd-algo-pointers-lab
    title: '為每次移動寫一行理由'
    kind: code
    minutes: 12
    steps:
      - '執行 paired_minutes.py，再用目標 15，保存每一對嘗試索引。'
      - '把每一步排除的端點與原因寫成檔尾註解。'
      - '新增 2 張 5 分鐘卡和一張 5 分鐘卡兩種案例。'
    checks:
      - '目標 15 命中索引 2、3。'
      - '2 張 5 可湊 10，單張 5 不可；程式未重用同一位置。'
---
## 為什麼要學
有一排已依分鐘由小到大排列的練習卡，想挑 2 張剛好填滿一段空檔。暴力嘗試每一對很容易寫，但順序已經提供重要線索：若最短配最長還嫌短，最短那張配別人只會更短。利用這個保證，一次比較就能安全排除一整組配法，而不只是排除眼前這一對。

## 核心概念
雙指標 (two pointers) 在這裡不是記憶體位址，而是兩個索引，分別指向尚未排除範圍的最左與最右元素。先加兩端：等於目標就完成；小於目標時左端必須往右；大於目標時右端必須往左。每次都只移動有理由被排除的那一端，直到兩端相遇。因為要選不同位置，所以條件是左邊嚴格小於右邊，不能讓同一張卡用兩次。

為什麼總和過大時不動較小的左端？固定右端後，目前左端已經是範圍裡最小的搭檔，換任何其他搭檔都不會更小，所以確定的是「右端找不到解」。這個理由依賴數值已經排序，不需要它們為正數，也不怕不同卡片的分鐘剛好相等。若輸入根本未排序，就沒有這種排除保證。

## 範例：每一步都說明哪一端出局
在 `C:\dev\stackway-lab\algorithms` 新建 `paired_minutes.py`。在排好序的數列兩端各放一支筆。總和太大時，說出為何可以跳過其中一端，再移動它。

在該目錄執行：Windows PowerShell 用 `py paired_minutes.py`；macOS／Linux 用 `python3 paired_minutes.py`。

```python
def find_pair(values, target):
    left, right = 0, len(values) - 1
    while left < right:
        amount = values[left] + values[right]
        print("try", left, right, amount)
        if amount == target:
            return left, right
        if amount < target:
            left += 1
        else:
            right -= 1
    return None

print(find_pair([1, 4, 6, 9, 12], 10))
print(find_pair([5], 10))
```

先不看程式跑出的索引，用手遮住兩端以外的數。第一步一加 12 等於 13，太大，12 和其他數相配只會更大或一樣，右端 12 出局。第二步是一加 9，正好 10，所以答案是位置 0 與 3，不是數值一與 9。若把目標改成 15，第一步太小，左端出局；接著 4 配 12 太大，改與 9 相配又太小，最後 6 配 9 才命中。這條路同時會用到兩個移動方向。

每次失敗，候選區間至少少一個位置，最多檢查線性次；只記兩個位置和當次和，輔助空間為常數。若先自行把亂序資料排序，記得把排序時間另算，而且排序後的索引不是原始位置。之後在[〈排序演算法〉](#/lesson/fd-algo-08-sorting)會細講整理順序的成本；如果題目要交出原位置，就得在排序時一併保留它們。

## 常見錯誤
把「和太小」誤解成「把右端往左讓差距縮小」，其實只會讓和更小。另一種錯誤是每次兩端一起向中間，這樣可能跳過本來應保留的搭檔。只有 1 張 5 分鐘卡，目標 10 分鐘是個便宜的測試：若回傳相同位置兩次，就表示迴圈允許兩端重疊，並未遵守選 2 張卡的條件。

## 小結
不要背左加右減，改記每次要證明哪張卡已經不可能有搭檔。證明成立才縮短區間；兩端相遇而尚未命中，就沒有兩個不同位置可選。這個想法比記程式模板更容易帶到其他有順序的搜尋題。
