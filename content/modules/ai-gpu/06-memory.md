---
id: ai-gpu-03-memory
module: ai-gpu
order: 6
title: 運算量與資料搬移
subtitle: 計算不忙卻跑得慢
status: ready
minutes: 30
level: 3
prereqs:
  - ai-gpu-05-hierarchy
objectives:
  - 估算資料讀寫量與運算量
  - 判斷瓶頸較像頻寬還是計算
tags:
  - gpu
  - bandwidth
resources:
  - title: NVIDIA：CUDA 效能實務
    url: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 選讀頻寬與合併存取的小節。
concepts:
  - id: ai-gpu-traffic-boundary
    prompt: 估算逐元素加法的邏輯流量時，為何要計入輸出？
    answer: 輸出要寫回約定的儲存層級，不能只算讀 2 個來源的成本。
    mcq:
      question: 2 個 32 位元浮點輸入各讀一個數，寫回一個同型別的結果。每個輸出的邏輯流量是多少？
      options:
        - 3 位元組
        - 8 位元組
        - 12 位元組
        - 96 位元組
      answer: 2
      explain: 每個數 4 位元組，3 次存取是 12；96 是位元數。
    interview:
      question: 核心只做幾次乘加卻很慢，你會如何建立可驗的猜想？
      points:
        - 寫出每元素讀寫與運算
        - 說清記憶體邊界
        - 以核心時間與硬體指標交叉檢查
      answer: 我會先算有沒有把中間陣列寫出去又讀回來。若流量大而計算少，就比合併前後結果、裝置流量與耗時；不會只因加法少就斷言是頻寬打滿。
  - id: ai-gpu-fused-intermediate
    prompt: 合併計算在什麼條件下能省掉中間陣列的搬運？
    answer: 同一筆中間結果能就地繼續使用，不必完整寫到全域記憶體再讀回。
    mcq:
      question: 2 趟核心原本將一個 32 位元中間值寫入再讀回。融合後 2 次存取都不需要，每個元素省多少？
      options:
        - 4 位元組
        - 12 位元組
        - 20 位元組
        - 8 位元組
      answer: 3
      explain: 移除的是暫存值的一寫一讀，輸入與最終輸出都還在。
  - id: ai-gpu-effective-bw
    prompt: 有效頻寬和硬體實際傳輸率的分子有何不同？
    answer: 前者用算法需要的邏輯位元組，後者用對應層級實際傳輸的位元組。
practice:
  - id: ai-gpu-06-lab
    title: 交一張 2 趟與一趟的流量帳
    kind: code
    minutes: 10
    steps:
      - 將兩列輸出存為 traffic-notes.txt
      - 畫出中間陣列的寫入與讀取箭頭，改 n 為 2048 後重算
    checks:
      - 原題為 20480 與 12288 位元組，計算皆為 2048 FLOP
      - 元素翻倍，2 張帳各欄皆翻倍
---

## 為什麼要學

把兩個陣列逐項相加，工程師盯著加法單元想辦法，真正花時間的卻可能是把輸入搬到運算單元，再把結果送回去。剖析前先開一張每個元素的「運算與搬運帳單」，能避免花力氣把已經很少的加法再減少一點。

## 先選邊界，再分讀與寫

浮點運算次數（FLOP）是在指定算法下所需的浮點加、乘等操作數，不是秒數。資料型別決定每個元素有幾個位元組：以 32 位元浮點數為例，每個數是 4 位元組。算 `c = a + b` 時，若 3 個陣列分離、輸入各讀一次、結果寫一次，每個輸出就有 1 次加法、8 位元組讀取、4 位元組寫入。不要把寫回當免費。

這是裝置端運算的邏輯流量帳，不含主機搬到裝置的傳輸，也未扣快取命中或加上多餘交易。把帳上位元組數除以實測核心秒數，得到有效頻寬（effective bandwidth）；要講硬體實際搬運量，則要搭配對應記憶體層級的計數器。頻寬以每秒多少位元組表示，和記憶體總容量不同。

## 範例：同一個算式，分 2 趟或一趟

比較先算暫存 t 等於 a 加 b、再將 t 乘 2 寫入 c，以及在一次核心中直接算完。兩者每個結果都做一次加法及一次乘法。若中間陣列真的落到全域記憶體再讀回，分 2 趟就多一次寫與一次讀。

開啟 `C:\dev\stackway-lab\gpu`，將範例另存為 `traffic_bill.py`。把讀取與寫回各算一遍，再除以完成的運算量。別把中間結果的來回搬移從帳上消掉。

在該目錄執行：Windows PowerShell 用 `py traffic_bill.py`；macOS／Linux 用 `python3 traffic_bill.py`。

```python
n, size = 1024, 4
for label, reads, writes in [("two_pass", 3, 2), ("fused", 2, 1)]:
    traffic = (reads + writes) * n * size
    print(label, "FLOP", 2*n, "read_B", reads*n*size,
          "write_B", writes*n*size, "total_B", traffic)
a, b = [1.0, 3.0], [4.0, -2.0]
tmp = [x+y for x, y in zip(a, b)]
assert [2*t for t in tmp] == [2*(x+y) for x, y in zip(a, b)]
```

如果把資料型別改成每個數 2 位元組，請在紙上只更換帳本的元素寬度。帳上的位元組減半，但參與運算的元素數量沒有變；這種比較還沒有驗證數值精度或實際支援的運算速率，所以不能單憑這張表決定更換型別。

### 從帳單換成可量的數

假設另一段工作在約定邊界需要搬 120 MB（十進位），核心實測用時 2 毫秒。先把毫秒換成 0.002 秒，再做除法，得到每秒 60 GB。若只說頻寬為 60 卻不帶單位，讀者很難發現把毫秒當秒造成的 1000 倍錯誤。

若同一計時不只涵蓋核心，還包含等候其他請求的時間，算出來就不是只屬於核心的有效頻寬。把「需要搬多少」與「在哪個範圍計時」寫在同一列，下一位工程師才知道這個偏低數字應該導向記憶體存取調查，還是先去查排隊。

## 常見錯誤

流量減少不能直接當作等比例加速。工作也可能受發送延遲、同步、占用資源或其他核心競爭影響；中間結果若已留在快取，真正到主記憶體的差額也可能比帳上小。若合併後輸出不同，更不能拿來作效能對照。

## 小結

看到算式先問「做幾次、讀幾次、寫幾次」。在大量元素下，每筆工作只算很少卻反覆搬資料，頻寬是值得查的假設。之後[〈Roofline 與算術強度〉](#/lesson/ai-gpu-07-roofline)會把這個直覺變成可以算的兩個上限。
