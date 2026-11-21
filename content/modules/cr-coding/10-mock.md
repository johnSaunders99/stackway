---
id: cr-coding-05-mock
module: cr-coding
order: 10
title: 限時解題與口頭驗算
subtitle: 限時題結束前保留檢查時間
status: ready
minutes: 45
level: 4
prereqs:
  - cr-coding-09-practice
objectives:
  - 先交出正確基準解再說明複雜度
  - 用空值、單筆與重複值做口頭測試
tags:
  - coding
  - coding-interview
resources:
  - title: Microsoft Careers：技術面試中的解題與測試
    url: https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-coding-05-mock-order
    prompt: 為什麼第二趟依原輸入而非排序後的順序？
    answer: 題目要最早出現的唯一值，不是數值最小的唯一值。
    mcq:
      options:
        - 降低不同值數量
        - 避免讀到空串列
        - 保留第一個的語意
        - 讓每個值只出現一次
      answer: 2
      explain: 排序可能改變哪個唯一值最先被選到。
  - id: cr-coding-05-mock-sentinel
    prompt: 單筆輸入 [0] 的預期回傳是什麼？
    answer: 回傳 0，數字 0 是合法唯一值，不是查無結果。
    mcq:
      options:
        - 空值 None
        - 布林值 False
        - 空串列
        - 整數 0
      answer: 3
      explain: 以條件真假判斷有無結果會把有效的 0 漏掉，回傳型別也要一致。
  - id: cr-coding-05-mock-cost
    prompt: 2 趟字典解法用什麼換取較少的掃描？
    answer: 以不同值數量的額外空間存頻率，換取預期線性時間。
    interview:
      question: 時間到了，但快版只寫了一半，你如何交接？
      points:
        - 指出已可運作的基準解與測例
        - 區分已完成和未完成
        - 給出快版的成本與待驗邊界
      answer: 我會先展示基準解在空列、0 與全重複時的結果，說明它最壞平方時間。頻率表是我的改進方向，但還沒跑通，我不會把它說成已完成；下一步會先對照原順序案例。
practice:
  - id: cr-coding-05-mock-p1
    title: 做一次 30 分鐘限時交付
    kind: code
    minutes: 30
    steps:
      - 以 4、8、13、5 分鐘分段，保存 mock.py 與 mock-notes.md；沒完成的版本保留並標記。
      - 最後一段只口述測試和成本，記下空列、單筆 0、全重複與多個唯一值的預期。
    checks:
      - 有一份能跑的基準解，或具體記下它未通過哪一筆。
      - 筆記分開空值與 0、最早與最小，並保留快版額外空間的說明。
---

## 剩下 5 分鐘，你要再改快一點還是先驗？
題目是「回傳第一個只出現一次的值；沒有就回傳空值」。你只剩半小時。如果在最後一分鐘才發現自己交的是最小值而非最早出現的值，程式再快也來不及救。模擬面試 (mock interview) 要同時練解題和交付：讓聽者知道你解哪一題、目前到哪裡、哪個答案已能檢查，而不是默默敲到鈴響。

## 切出不可以挪用的驗算時間
先用 4 分鐘確認輸入是可重複的整數串列，空串列也合法；輸出是值，不是索引，查無結果用 `None`。問「第一」按原輸入順序嗎？用 `[8,3,8,2]` 檢查：答案是 3 不是 2。接著用 8 分鐘寫基準解：從左到右逐一數該值在整列出現幾次，第一個次數為 1 的就返回。即使沒有更快解，這時已經有一份可說明的正確答案。

再用 13 分鐘處理重複掃描的成本。第一趟用字典依值累計次數，第二趟仍按輸入順序讀，找到次數為 1 的第一個值。第一趟需要看完整列，因為早期以為唯一的值可能在尾端再次出現。最後 5 分鐘不加功能，只驗邊界和口述複雜度。這是練習時間分配，不是所有公司的固定考法。

## 範例：讓快、慢 2 個版本互相挑錯
在 `C:\dev\stackway-lab\coding` 存 `mock.py`，執行 `py mock.py`；macOS／Linux 用 `python3 mock.py`。請先口述預期，再看程式是否同意。

```python
def slow(xs):
    return next((x for x in xs if xs.count(x) == 1), None)

def fast(xs):
    counts = {}
    for x in xs:
        counts[x] = counts.get(x, 0) + 1
    return next((x for x in xs if counts[x] == 1), None)

for xs, want in [([], None), ([0], 0), ([4,4], None), ([8,3,8,2], 3)]:
    assert slow(xs) == fast(xs) == want
    print(xs, want)
```

這裡的空值是輸出約定，不是把沒有提供輸入與提供空串列視為同一件事。若呼叫端傳來 `None`，本題未定義，應先問要拒絕、轉成空列或交給上游驗證。數字 0 則完全合法，若靠「值是不是真的」判斷有沒有找到，單筆 0 就會被誤判。面試時指出這兩層差別，比宣稱「所有邊界都測過」更可信。

### 面試官中途改了輸出，還剩什麼能用？
若現在改成回傳唯一值的位置，頻率表照樣有用，但第二趟應同時帶著索引，找到時交出索引。這能用一筆短資料立即驗：最早唯一的值是 0，所在位置卻不是 0，兩個版本輸出就不同。用這種改動練口述，你會知道哪些程式是由題意決定、哪些只是實作技巧，而不是每聽到新需求就從第一行重新開始。

## 常見錯誤
先把輸入排序方便找唯一值，會遺失原順序。「用了字典所以是常數時間」也不對；字典查找在通常假設下平均常數時間，但你仍走過全部資料。快版預期時間 O(n)，額外空間依不同值個數成長；慢版最壞 O(n²)，卻不需要頻率表。若當場未完成快版，要明講基準解能跑，而不是把想法當成完成品交差。

計時結束就保留當時的版本；事後想到的修正另記，才看得出有限時間裡真正交付了哪些驗收。

## 小結
練習的結尾不是一句「應該沒問題」。留下一筆會讓常見錯解出錯的資料、兩版的成本，並告訴面試官若再給你時間，下一步會驗哪個假設。
