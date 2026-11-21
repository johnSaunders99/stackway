---
id: ai-gpu-04-kernel
module: ai-gpu
order: 4
title: CUDA 核心函式入門
subtitle: 用一個執行緒處理一個向量元素
status: ready
minutes: 40
level: 3
prereqs:
  - ai-gpu-02-parallel
objectives:
  - 以區塊與執行緒索引求全域索引並檢查界線
  - 手算小向量加法對照 CPU 結果，區分推演與實機驗證
tags:
  - gpu
  - kernel
resources:
  - title: NVIDIA：撰寫 SIMT 核心函式
    url: https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 看索引、區塊與記憶體空間的例子。
concepts:
  - id: ai-gpu-kernel-guard
    prompt: 向量核心為何要在讀取前就檢查全域索引？
    answer: 末塊有超過資料長度的執行緒，無論讀或寫都不應碰越界地址。
    mcq:
      question: 長度 5、每塊 4 條，第二塊哪些塊內編號能讀取？
      options:
        - 只有 0
        - 0 和 1
        - 只有 3
        - 0 至 3 全部
      answer: 0
      explain: 第二塊起點是 4，只有全域索引 4 合法，5 已越界。
    interview:
      question: 會用哪些小測資檢查第一個向量核心？
      points:
        - 測塊寬前後的長度
        - 驗界線與寫入次數
        - 用獨立參考逐元素核對
      answer: 我會測長度剛好整除和多 1 格兩種，記錄誰寫了尾端。CPU 參考值先排掉算式錯誤；接著才在實機檢查核心啟動、完成後的結果和錯誤。
  - id: ai-gpu-kernel-ownership
    prompt: 向量逐元素加法怎麼避免兩條執行緒搶寫同一格？
    answer: 用唯一的全域索引分配輸出，每條只寫自己負責的一格。
    mcq:
      question: 若把全域索引錯寫成只用 threadIdx.x，哪個錯誤最可能？
      options:
        - 所有位置向後移一格
        - 不同區塊搶寫同一批開頭位置
        - 只影響讀取速度不影響結果
        - 只會漏掉預留在尾塊的無效位置
      answer: 1
      explain: 塊內編號在每個區塊都從 0 開始，省掉區塊偏移就會重複。
  - id: ai-gpu-cpu-oracle
    prompt: CPU 推演通過，能否證明硬體上的 CUDA 核心也正確且更快？
    answer: 不能；它核對公式與預期數值，還須真的啟動裝置核心、同步檢錯並另行計時。
practice:
  - id: ai-gpu-04-lab
    title: 寫一份末區塊驗收單
    kind: code
    minutes: 15
    steps:
      - 把每個塊內編號對應的 i 和是否讀寫存成 guard-notes.txt
      - 改塊寬為 2 重跑，同時核對參考向量
    checks:
      - 原配置略過 5、6、7
      - 兩次都得到 9、5、7、19、20，且驗收單註明是 CPU 推演
---

## 為什麼要學

上堂的格子分配可以回答「輪到誰」，這次要填上「輪到時做什麼」。核心函式（kernel）是讓裝置上許多執行緒跑的同一份程式。做向量加法時，每條只取一對元素算一個結果，不在每條裡面再掃過整個向量。先在紙上把責任範圍畫清楚，最後一個區塊才不會越界。

## 先算索引，再動記憶體

對一維 CUDA C++ 核心，`blockIdx.x` 表區塊編號，`blockDim.x` 是塊寬，`threadIdx.x` 是塊內編號。三者組成 `i = blockIdx.x * blockDim.x + threadIdx.x`。核心的參數包含 2 個來源、一個目的地及長度 n，合法範圍是 0 到 n 減 1。條件 `if (i < n)` 要包住讀取和寫回，不是先讀好再判斷要不要寫。

裝置入口可寫成 `__global__ void add(const float* a, const float* b, float* c, int n)`，指標對應已可供裝置存取的陣列。函式內算出 i 後執行 `if (i < n) c[i] = a[i] + b[i];`。主機端用 `add<<<blocks, threads>>>(a, b, c, n)` 提交工作；角括號設定的是區塊數和每塊執行緒數，不是資料長度與結果大小。這些是讀懂原始碼的片段，不是可在 Python 直接執行的命令。

## 範例：讓每個位置留下筆跡

長度 5、塊寬 4，需要 2 塊。從 i 等於 0 一路寫到 7，先預測哪些真的會碰到資料。用不平行的 Python 做索引推演，再用不依賴分塊公式的參考答案逐元素比對，這樣分工出錯時不會拿同一個錯法當裁判。

在 `C:\dev\stackway-lab\gpu` 新建 `guard_add.py`。先挑最後一個有效索引，接著測下一個。用這對鄰居說明邊界判斷保護哪一側，不必為了看索引而租 GPU。

在該目錄執行：Windows PowerShell 用 `py guard_add.py`；macOS／Linux 用 `python3 guard_add.py`。

```python
a, b = [1, 4, 9, 16, 25], [8, 1, -2, 3, -5]
n, width = len(a), 4
out, hits = [None] * n, [0] * n
for block in range((n + width - 1) // width):
    for local in range(width):
        i = block * width + local
        if i < n:
            out[i] = a[i] + b[i]
            hits[i] += 1
        else:
            print("skip", i)
assert hits == [1] * n
assert out == [x + y for x, y in zip(a, b)]
print("CPU index check", out)
```

把未寫入的位置初始化成 None 而不是 0，是為了區分「沒人來過」和「有人寫出數字 0」。如果資料裡本來沒有重複值或 0，你可能看不出這項設計的重要性；試著讓最後一對元素互為相反數，參考答案就真的應該包含 0。

### 別讓參考答案也犯同一個錯

有一個很像對的驗法：先用區塊公式產生兩份結果，再比較兩份是否一樣。若兩份都把塊寬當成區塊數，同一個錯會重演兩次，最後得到一個沒有意義的通過。本例的裁判直接從頭配對來源資料，完全不使用區塊編號；而寫入次數另外計算，防止兩個寫者剛好寫了相同的正確值。

先檢查兩個來源等長、目的地與來源分開，才能把「每格由一條負責」這個條件說清楚。接著挑最後一格，在紙上列出它的區塊、塊內編號、來源值與預期結果。若只有它錯，就看最後一塊；若每一塊的第一格都錯，才去查起點公式。這個分流比一開始就換塊寬有效。

## 常見錯誤

界線寫成小於等於會讓索引 n 進入，整除尺寸剛好沒有這個額外執行緒時，錯誤還可能被掩蓋。也別用「總和相同」取代逐元素比對；把 2 格結果交換後總和依舊相同。用不同的來源值與非整除尺寸，才能讓這些錯誤現形。

## 小結

索引正確、每格一個寫者、結果符合獨立參考，是第一道門檻。主機推演不會驗證驅動、裝置指標、非同步錯誤或實際速度；把「算式通過」與「核心已在 GPU 跑過」分兩欄記。
