---
id: ai-train-06-nccl
module: ai-train
order: 6
title: NCCL 集合通訊
subtitle: 同一批卡為什麼有人一直等
status: ready
minutes: 35
level: 4
prereqs:
  - ai-train-05-gather
objectives:
  - 辨認通訊群組、資料型別與集合操作的一致條件
  - 把 NCCL 的裝置通訊責任和訓練框架的工作區分開
tags:
  - train
  - nccl
resources:
  - title: NCCL：集合操作的輸入與輸出
    url: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: NVIDIA NCCL：通訊函式庫與互連
    url: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/overview.html
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-06-nccl-group
    prompt: 同一群組只有 1 個順位進入第二次集合操作，最該防範哪種結果？
    answer: 呼叫無法配對，造成等待或錯誤。
    mcq:
      options:
        - 自動把缺席順位的梯度補零
        - 自動縮小原群組，依目前成員繼續
        - 呼叫無法配對，造成等待或錯誤
        - 保證回傳已參與者的局部和
      answer: 2
      explain: 集合要配對，函式庫無法自動補出缺席順位的梯度。
  - id: ai-train-06-nccl-type
    prompt: 兩個 all-reduce 元素數相同、型別不同，該如何判斷？
    answer: 合約不一致，應先修正呼叫。
    mcq:
      options:
        - 元素數相同就可略過型別檢查
        - 不同型別會自動轉為較高精度再歸約
        - 只看群組名稱即可判斷輸入匹配
        - 合約不一致，應先修正呼叫
      answer: 3
      explain: 型別也是資料解讀契約，不能只用數量判斷。
  - id: ai-train-06-nccl-role
    prompt: 安排哪些梯度要在何時同步，主要是哪一層的工作？
    answer: 訓練框架與應用邏輯。
    mcq:
      options:
        - 訓練框架與應用邏輯
        - 由 NCCL 依張量長度自動判定訓練語意
        - 由裝置驅動判斷反向傳播中哪些參數相依
        - 由網路拓撲決定哪個梯度屬於哪個參數
      answer: 0
      explain: NCCL 執行被要求的裝置通訊，不替使用者定義訓練語意。
    interview:
      question: 訓練停住時，你怎麼區分集合不匹配與某人來得太晚？
      points:
        - 依群組與序號對齊
        - 核對型別、操作、數量
        - 追最晚的前置步驟
      answer: 我先比各順位最後進入的操作和欄位。若不同，先找分支或張量問題；若相同但某人晚到，會沿那個順位回看資料載入與計算，而不是直接怪通訊函式庫。
practice:
  - id: ai-train-06-nccl-p1
    title: 保存一份集合合約比對紀錄
    minutes: 12
    kind: code
    steps:
      - 儲存程式，分別標明型別不同、缺席和一致
      - 再只改元素數，記錄第一個分歧
    checks:
      - 前兩例都在第二筆分歧但原因不同
      - 2 份完全一樣時輸出 None
---
## 為什麼要學：數值還沒傳，程式已經等不到對方
2 張卡的訓練在同一步停住，沒有立即顯示哪個張量出錯。這時先別調網路頻寬。把各順位準備呼叫的操作逐筆排在一起，可能會發現一邊在做加總、另一邊卻在收集。NVIDIA 集合通訊函式庫（NCCL）負責裝置間的傳輸與歸約，不理解你的訓練迴圈，也不會推測某一邊「本來想」做什麼。

## 核心概念：先對齊合約，再量效率
通訊群組（communicator）定義哪些順位參加；同一群組的每個順位要以匹配的順序參與集合操作。以本例的加總 all-reduce 而言，元素數、資料型別、歸約種類要一致，緩衝區要容納對應結果。形狀相同不等於資料語意相同：兩邊即使都是 4 個浮點值，若梯度對應不同參數，也可能不報錯卻得到無意義的和。

訓練框架建立群組、安排反向計算與通訊順序，NCCL 依呼叫執行並利用裝置互連。它不決定資料怎樣洗牌、梯度是否該平均或哪個順位先寫檢查點。若只有 0 號做記錄，應把「列印」放進只在 0 號執行的條件，而非把所有人都要參與的通訊也一起包進去。

## 範例：比對一份不會真的掛住的呼叫紀錄
開啟 `C:\dev\stackway-lab\train`，將範例另存為 `collective_contract.py`。把各順位的呼叫次序排成平行的兩列。核對同一步的操作與形狀，再判斷是否真是網路問題。

在該目錄執行：Windows PowerShell 用 `py collective_contract.py`；macOS／Linux 用 `python3 collective_contract.py`。

```python
from itertools import zip_longest
first = ("g0","sum","float32",4)
left = [first,("g0","gather","float32",2)]
for right in ([first,("g0","gather","float16",2)],[first],left):
    mismatch = next(((i,a,b) for i,(a,b) in
                     enumerate(zip_longest(left,right),1) if a!=b),None)
    print("first mismatch", mismatch)
```

每個項目都包含群組代號、操作、資料型別和元素數，歸約運算寫在操作名稱裡。用補空值的迭代方法很重要：若某個順位完全沒走到第二次呼叫，普通的成對走訪會在短的一側結束而漏掉問題。這個檢查只是讀兩份本機教學清單，不向 GPU 發出錯誤呼叫。

### 2 份日誌都顯示成功，數字還會錯嗎？
會。假設兩層權重形狀一樣，0 號先處理甲層再處理乙層，1 號恰好反過來。從函式庫看，兩次都是相同型別、相同長度的求和，所以可能順利完成；從模型看，卻把甲的梯度加到乙上面。可為每次呼叫再附上固定參數名稱或分桶次序，只比對用途，不必印出整份訓練張量。這是在呼叫得以配對後還要再做的一層語意檢查。

## 常見錯誤
相同呼叫很慢，不一定是合約不一致。還可能是其中一位尚未讀完資料，所以其他人提早進入等待。比對時記操作序號與進入、完成事件，先找第一個分歧，再看相符操作的耗時。使用非同步裝置時，主機函式返回也不一定代表資料傳完，量效能要以實際完成邊界為準。

## 小結
故障筆記留群組、每順位序號、操作、型別及元素數，必要時補張量用途。先排除根本配不上的呼叫，再查同樣操作在什麼鏈路上慢。把相符紀錄印出來只代表通訊前提看來一致，不代表跑過真正的 NCCL。
