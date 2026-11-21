---
id: ai-gpu-05-hierarchy
module: ai-gpu
order: 5
title: GPU 記憶體階層
subtitle: 哪一筆資料值得留在區塊裡
status: ready
minutes: 35
level: 3
prereqs:
  - ai-gpu-04-kernel
objectives:
  - 標示暫存器、共享與全域記憶體的可見範圍
  - 從相鄰執行緒存取模式判斷能否合併讀取
tags:
  - gpu
  - hierarchy
resources:
  - title: NVIDIA：撰寫 SIMT 核心函式
    url: https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 看索引、區塊與記憶體空間的例子。
  - title: NVIDIA：CUDA 效能實務
    url: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 選讀頻寬與合併存取的小節。
concepts:
  - id: ai-gpu-mem-scope
    prompt: 普通 CUDA 區塊中，哪個空間適合同區塊交換資料？
    answer: 共享記憶體可供同區塊成員讀寫；若有讀寫依賴，要有正確同步。
    mcq:
      question: 某值只由一條執行緒在迴圈中累加，最自然的儲存位置是？
      options:
        - 另一條執行緒的暫存器
        - 該執行緒的暫存器
        - 為整個網格設一個共用計數器
        - 每步都搬回主機
      answer: 1
      explain: 私有累加值不需要跨執行緒或裝置傳遞；實際配置由編譯器決定。
    interview:
      question: 兩種寫法都讀 128 位元組，怎麼解釋效能可能不同？
      points:
        - 固定同一 warp 與同一指令
        - 列地址跨幾個區段
        - 區分模型與量測
      answer: 我會把 32 條的地址排成一列，統計用了多少個對齊區段。請求大小相同，不代表送到記憶體的交易一樣，還要用裝置計數器核對。
  - id: ai-gpu-coalesce-group
    prompt: 判斷合併存取應比較哪一組地址？
    answer: 同一 warp 的通道在同一次記憶體指令發出的地址。
    mcq:
      question: 何者直接支持合併讀取的判斷？
      options:
        - 每個執行緒最後都讀相同筆數
        - 不同區塊共用相同變數名稱
        - 同組通道同一指令讀對齊連續位置
        - 單一通道下一輪地址加 1
      answer: 2
      explain: 看同時發出的地址分布，不是總讀取筆數或單一路徑。
  - id: ai-gpu-shared-reuse
    prompt: 什麼樣的資料值得先搬進共享記憶體？
    answer: 區塊內多次重用而能減少較遠層級讀取，且節省量可抵掉載入與同步成本的資料。
  - id: ai-gpu-segment-align
    prompt: 相鄰通道都讀連續元素，起點沒對齊可能多帶來什麼？
    answer: 同樣長度的連續範圍可能多跨一個交易區段。
    mcq:
      question: 每段 32 位元組，連續讀 128 位元組；起點由地址 0 移至 4，會碰到幾段？
      options:
        - 3 段
        - 4 段
        - 5 段
        - 32 段
      answer: 2
      explain: 地址範圍 4 至 131 橫跨第 0 至第 4 段，元素仍連續但不再從段首開始。
practice:
  - id: ai-gpu-05-lab
    title: 畫兩種步幅的足跡
    kind: code
    minutes: 12
    steps:
      - 將兩種步幅的前 4 個地址與區段數記到 segments.txt
      - 把基底改成 4 位元組再跑步幅 1
    checks:
      - 對齊時連續讀占 4 段、步幅 8 占 32 段
      - 整排右移 4 位元組後連續讀跨 5 段
---

## 為什麼要學

同一排執行緒各取一個數，看起來讀的資料量一樣，記憶體系統要跑的趟數卻可能不同。想像店員拿著一份揀貨單：商品都在同一排架上，和每件都在不同排架上，完成相同訂單要走的路不一樣。對 GPU 而言，先認清資料給誰用，再檢查相鄰通道到底取哪些地址。

## 哪個空間可以與誰共享

暫存器（register）適合放單一執行緒正在算的索引或累加值，不能直接拿別條執行緒的私有變數來用。共享記憶體（shared memory）在普通區塊內讓多條執行緒合作，像是共同載入一小片資料，等所有負責載入的成員完成後，再重複取用。全域記憶體（global memory）可供網格裡不同區塊存取，但同一地址可見不等於不同區塊的讀寫次序自動正確。

合併存取（coalescing）看的是同一個 warp 的同一次記憶體指令，各通道的地址能否由少量記憶體交易滿足。若通道取得連續、對齊的元素，常可用較少交易；若相隔很遠，搬來的區段裡可能只有少數位元組有用。某一條執行緒自己下一圈讀得連續，不能代替這個組內視角。

## 範例：把地址塗到區段上

採用教學模型：基底地址 0、元素寬 4 位元組、對齊區段寬 32 位元組。列出 32 個通道同時讀的地址，以整數除法找出碰到幾個不同區段。這裡不模擬快取命中與實際硬體交易。

用位址畫出相鄰執行緒各讀哪裡。比較的是碰到哪些記憶體區段，不只是讀了多少個元素。把下面的範例存成 `C:\dev\stackway-lab\gpu` 裡的 `memory_segments.py`。

在該目錄執行：Windows PowerShell 用 `py memory_segments.py`；macOS／Linux 用 `python3 memory_segments.py`。

```python
for stride in (1, 8):
    addresses = [4 * lane * stride for lane in range(32)]
    segments = {addr // 32 for addr in addresses}
    print("stride", stride, "first", addresses[:4],
          "segments", len(segments), "requested_bytes", 32 * 4)
```

試著從反方向解讀：如果剖析工具顯示讀了很多位元組，不能光靠地址模型判定來自這一行，因為別的指令也在讀。先用範例排除「元素數量不同」這個變因，再回到那條核心函式和那次載入指令，才比較得出資料排列的影響。

### 重用不只是少讀一次

以同一區塊反覆用到的係數為例，若每條執行緒先各讀一份，再各自使用，程式看起來最直白；若改由部分成員負責搬入共享空間，則需要確保讀者等載入者完成才開始算。把同步放在只有部分成員才會進入的條件分支，可能無法讓整塊都到達會合點。請先畫出誰負責寫、誰會讀，以及會合在哪裡，再比較減少的流量是否值得新增的合作成本。

## 常見錯誤

不要因為共享記憶體靠近運算單元，就把每個只讀一次的值都繞進去。搬進搬出、同步與占用空間都有代價。反過來，若同一塊資料被區塊裡多條執行緒反覆使用，先集中載入可能划算；這需要資料重用證據，不是看程式碼出現哪個關鍵字。

## 小結

先問生命週期和可見範圍，再把一次讀取的地址攤開看。能說出「誰真的會再讀這一塊」與「同一時刻鄰居讀哪裡」，才有理由改資料排列或加入共享暫存。
