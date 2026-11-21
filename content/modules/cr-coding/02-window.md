---
id: cr-coding-02-window
module: cr-coding
order: 2
title: 滑動視窗
subtitle: 從重算改成滑動視窗
status: ready
minutes: 30
level: 4
prereqs:
  - cr-coding-01-clarify
objectives:
  - 用手算指出相鄰視窗重複的工作
  - 說明縮小視窗仍正確的必要條件
tags:
  - coding
  - sliding-window
resources:
  - title: USACO Guide：雙指標與滑動視窗
    url: https://usaco.guide/silver/two-pointers
    kind: course
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-coding-02-window-update
    prompt: 固定長度的相鄰視窗如何重用舊總和？
    answer: 減掉離窗值，加上入窗值。
    mcq:
      options:
        - 只加入新值
        - 扣掉 2 個端點
        - 扣掉離窗值再加入新值
        - 重新排序後取前幾項
      answer: 2
      explain: 固定長度每次替換一個成員，排序會破壞連續範圍。
  - id: cr-coding-02-window-monotone
    prompt: 非負數加總超出預算後，為什麼可放棄原左端？
    answer: 從同一起點繼續右擴，總和不會降低。
    mcq:
      options:
        - 每次移走的都是最大值
        - 片長已依大小排序
        - 每次超支只會多 1
        - 右擴不會讓總和下降
      answer: 3
      explain: 依據是非負性，不是排序、超支大小或左端值的大小。
    interview:
      question: 如果允許負值，這份滑窗解法還成立嗎？
      points:
        - 指出依賴的單調性
        - 給出會漏解的短例
        - 分清固定窗與可變窗
      answer: 不保證。預算 5 時我會在看見 6 就移掉它，但後面若接負 2，整段其實合法。加減維護總和仍然正確，是「超支即可丟起點」的推論壞了。
  - id: cr-coding-02-window-amortized
    prompt: 縮窗迴圈可能一次執行多次，為何總時間仍是 O(n)？
    answer: 左端不倒退，每個元素只可能被加入與移出各 1 次。
  - id: cr-coding-02-window-fixed
    prompt: 固定長度視窗的加減更新是否要求元素非負？
    answer: 不要求。非負性是此可變窗丟棄超支起點的依據，不是總和更新的依據。
    mcq:
      question: 對含負數的整數串列，仍能直接使用哪種更新？
      options:
        - 超出預算就永遠移掉左端
        - 只對正數更新窗長
        - 固定長度時扣掉離開值再加進新值
        - 固定長度時只加新值
      answer: 2
      explain: 固定窗只是替換成員，不靠單調性；可變窗超支就丟起點才需要額外前提。
practice:
  - id: cr-coding-02-window-p1
    title: 做一份可推翻的視窗追蹤表
    kind: code
    minutes: 12
    steps:
      - 保存程式與 window.md，列出範例每次右移後的左端、總和、最佳值。
      - 再跑預算 5 的 [2,2,8]，最後用 [6,-2] 手算說明適用範圍。
    checks:
      - 8 進入時合法窗為空，不會記錄超支長度。
      - 原始輸出 3；筆記指出含負值範例的正解是 2 而本算法回傳 1。
---

## 為什麼下一段不必從頭加？
你有一串照原順序播放的短片，通勤只剩 5 分鐘。問題是「最多能連看幾部」，不能挑掉中間太長的一部再接下一部。若把所有開始和結束位置都試一遍，許多片長會重複加總。滑動視窗 (sliding window) 讓一段連續範圍帶著自己的總和向前走；移動邊界的理由，比記住雙指標的寫法更重要。

## 固定長度與可變長度不是同一道題
先看固定 2 部：片長依序為 2、1、3，第一窗總和為 3，下一窗可以減掉離開的 2，再加進新來的 3，得到 4。這種更新只需要加減法，數值即使有負數也成立。我們現在求的是總和不超過預算的最長連段，窗的長度未知，必須另找一個決定何時縮窗的條件。

本題約定片長與預算非負。右邊新進來一部，先加片長；若超出預算，左邊持續移除，直到合法才記錄長度。憑什麼永遠丟掉那個左端？當時已超支，再往右加非負數也無法使同一起點的總和下降。這個單調性 (monotonicity) 才是正確的理由，不是因為左右兩端看起來像兩個指標。

## 範例：用一張手算表追蹤兩端
將 `window.py` 存在 `C:\dev\stackway-lab\coding`，執行 `py window.py`；macOS／Linux 用 `python3 window.py`。每列印出右端、合法左端、窗內總和和截至此刻的最佳長度。

```python
def longest(lengths, budget):
    left = total = best = 0
    for right, value in enumerate(lengths):
        total += value
        while total > budget:
            total -= lengths[left]
            left += 1
        best = max(best, right - left + 1)
        print(right, left, total, best)
    return best

print("answer", longest([2, 1, 3, 1, 1], 5))
```

讀到第一個 3 時，總和從 3 變成 6，移出左端的 2 就合法。讀到最後一個 1 時，又得把更早的 1 移走。最長可以看 3 部。若某一部本身就超過預算，迴圈連它也會移出，此時左端等於右端加 1，窗長正好為 0；這比特判第一部來得一致。

### 怎樣知道留下的是最長合法段？
固定一個右端來看。縮窗停止的那一刻，窗內合法；如果再把剛移出的元素放回去，就會回到上一次超支的狀態。曾被更早的右端淘汰的起點，在非負前提下現在也不會變合法。因此目前左端已是對這個右端仍可使用的最早起點，記它的長度才不漏答案。如果先更新最佳值再縮窗，就會把含有超長短片的整段也算進去。你可以在表裡多畫一欄「是否已合法」，用它攔住這種更新順序的錯誤。

## 常見錯誤
把縮窗的 `while` 寫成 `if`，碰到連續幾個小值後加入一個大值，移掉一部可能仍超支。還有一種更難發現的錯：資料改成可正可負的收支，預算為 5，輸入是 6、負 2。這套規則一開始就丟掉 6，卻漏掉總和為 4 的整段。失敗的是判斷條件，不是把右索引再往前或往後挪一格就能修好。

把左界縮到右界之後，檢查空視窗長度；這個極端情況最容易暴露少算或多算一格的邊界。

## 小結
在這個推導裡，每筆資料至多進窗一次、出窗一次，所以兩層迴圈合計仍是線性時間。先能說出何時可以永遠放棄一個起點，再決定要不要用滑動視窗。
