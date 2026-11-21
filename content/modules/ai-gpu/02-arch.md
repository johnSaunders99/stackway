---
id: ai-gpu-02-arch
module: ai-gpu
order: 2
title: SM 與 warp 執行模型
subtitle: 排好的執行緒由誰真正執行
status: ready
minutes: 35
level: 3
prereqs:
  - ai-gpu-01-devices
objectives:
  - 區分硬體的 SM、warp 與程式中的區塊
  - 用同一個 warp 的分支示例解釋分歧的代價
tags:
  - gpu
  - arch
resources:
  - title: NVIDIA：CUDA 程式設計模型
    url: https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: 讀主機、執行緒群組與硬體對應。
  - title: NVIDIA：撰寫 SIMT 核心函式
    url: https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 看索引、區塊與記憶體空間的例子。
concepts:
  - id: ai-gpu-warp-vs-block
    prompt: 程式區塊、warp 與 SM 各是哪一層？
    answer: 區塊界定執行緒的合作群組，warp 是區塊內的執行分組，SM 是承載區塊的硬體單元。
    mcq:
      question: 一個 64 執行緒的普通區塊，在 NVIDIA GPU 中會如何分組？
      options:
        - 固定占 2 個 SM
        - 形成 64 個 warp
        - 同一區塊內有 2 個 warp
        - 與鄰居區塊湊成 1 個 warp
      answer: 2
      explain: warp 每組 32 條，分組不跨區塊，也不一組獨占一個 SM。
    interview:
      question: 同事說把所有 if 拿掉就能加速，你會如何檢查？
      points:
        - 先對齊 warp 邊界
        - 分辨同組與不同組分支
        - 量實際核心而非只數條件式
      answer: 我會先列出連續 32 條各走哪邊。若每組一致就不把它當組內分歧；若混雜，再看兩邊工作量與剖析結果，不先承諾幾倍加速。
  - id: ai-gpu-warp-split
    prompt: 什麼情況才是 warp 內分歧？
    answer: 同一 warp 的通道走不同控制路徑，執行各路徑時只有部分通道有效。
    mcq:
      question: 區塊有 64 條執行緒，編號 0–31、32–63 各成一個 warp。哪個分法讓 2 組內部都分歧？
      options:
        - 前 32 條走左、後 32 條走右
        - 所有通道走左
        - 所有通道走右
        - 偶數走左、奇數走右
      answer: 3
      explain: 奇偶在每組內交錯；前後半切分則各組內一致。
  - id: ai-gpu-branch-cost
    prompt: 為什麼不能由分歧的人數直接算出耗時？
    answer: 路徑長短、有效指令、等待和排程都影響時間，人數表只顯示可能的浪費。
practice:
  - id: ai-gpu-02-lab
    title: 畫出兩種分組名單
    kind: code
    minutes: 10
    steps:
      - 執行程式，把每組左右人數寫進 warp-notes.txt
      - 把界線從 32 改成 30，預測哪個 warp 改變
    checks:
      - 原本奇偶組都是 16 比 16
      - 改界線後第一組為 30 比 2，第二組仍為 0 比 32
---

## 為什麼要學

排一個 64 人的班表，不等於有 64 個櫃台各自照表服務。CUDA 程式裡有邏輯上的工作編號，GPU 上則有實際挑選工作執行的硬體。若把兩層混成一層，容易看到「開了很多執行緒」就以為每個分支都能免費同時完成。

## 從區塊到硬體上的一組指令

執行緒（thread）是程式看到的一份工作。執行緒按區塊（thread block）分組，同區塊可合作。以一般 CUDA 區塊為例，一個區塊在某個串流多處理器（streaming multiprocessor，SM）上執行；一個 SM 在資源允許時可同時駐留多個區塊。區塊不是硬體，程式也不應假定區塊編號就是 SM 編號。下一堂[〈CUDA 網格、區塊與執行緒〉](#/lesson/ai-gpu-02-parallel)會把這些編號配到資料。

NVIDIA 的 warp 是同一區塊中按線性執行緒編號分組的 32 條執行緒，每條在組內的位置可稱為一條通道（lane）。單指令多執行緒（SIMT）讓同組的有效通道一起處理一條指令。若同一組裡有人走左分支、有人走右分支，執行兩邊路徑時只有相應的通道做有用工作，這叫分支分歧（divergence）。兩個不同 warp 各走不同邊，不屬於同一個 warp 的分歧。

## 範例：同樣各有一半，排列卻不同

同一個區塊有 64 條執行緒。我們只統計每組各有幾條走左與右，不計時、不推論硬體逐週期排程。先猜「前半走左」與「偶數走左」哪個版本會在同組裡出現 2 條路。

先把相鄰執行緒分組，看看最後一組是否填滿；用得到幾個位置與開出幾個位置要分開算。把下面的範例存成 `C:\dev\stackway-lab\gpu` 裡的 `warp_groups.py`。

在該目錄執行：Windows PowerShell 用 `py warp_groups.py`；macOS／Linux 用 `python3 warp_groups.py`。

```python
for label, left in [("half", lambda i: i < 32),
                    ("even", lambda i: i % 2 == 0)]:
    for start in (0, 32):
        n = sum(left(i) for i in range(start, start + 32))
        print(label, start // 32, "left", n, "right", 32 - n)
```

再想一個不滿組的尾端：若同一個區塊只有 33 條執行緒，末組只有 1 條負責資料，其餘位置沒有這個區塊的工作，不會向下一個區塊借人補滿。這是組內有效通道不足，但原因不是這 33 條執行緒中的某個條件式。

### 讀一個會改變決定的對照

若資料本來按類別排好，同組走同一路徑的機會可能較高；若打亂順序，兩類元素總數不變，卻可能讓更多組兩邊都走。這給你一個可測的假設，不代表先排序一定划算。排序本身也得讀寫資料，還可能打亂後續原本連續的讀取。

所以檢討方式不是只截取「重新排列後的核心比較快」，而是比從收到同一份輸入到交出同一份結果的總時間。若整體反而更慢，便可保留這次分組判讀，放棄這項改動，而不必推翻 warp 內分歧的解釋。

## 常見錯誤

看到條件式就刪是錯的。若整組選擇一致，沒有上述的組內分歧；小分支也可能由編譯器轉成帶條件的指令。反過來，分組混雜也不等於總時間一定翻倍：路徑長度、其他等待、實際產生的指令都要看。不要從這張人數表精算加速比。

## 小結

讀執行模型時把三張標籤貼回去：區塊屬於程式的合作範圍，warp 是同區塊的執行緒分組，SM 是承載工作的硬體。先判斷分歧發生在哪組，再問這組是否值得量測。
