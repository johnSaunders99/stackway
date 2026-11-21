---
id: ai-gpu-10-triton
module: ai-gpu
order: 10
title: Triton 核心函式
subtitle: 用區塊運算重寫向量加法
status: ready
minutes: 40
level: 3
prereqs:
  - ai-gpu-09-nsight
objectives:
  - 以程式識別碼、範圍和遮罩描述一個資料塊
  - 比對參考輸出，區分 Triton 語言與同名推論伺服器
tags:
  - gpu
  - triton
resources:
  - title: Triton 語言：向量加法
    url: https://triton-lang.org/main/getting-started/tutorials/01-vector-add.html
    kind: doc
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
    note: 逐行對照資料塊的索引、讀取與寫回。
concepts:
  - id: ai-gpu-tile-offset
    prompt: 一個 Triton 程式實例怎麼得到整塊索引？
    answer: 程式編號乘塊寬得起點，加上塊內的範圍產生整排偏移量。
    mcq:
      question: 塊寬 8、程式編號 1、長度 11，哪些偏移可存取？
      options:
        - 1、2、3
        - 8 到 15 全部
        - 8、9、10
        - 0 到 7
      answer: 2
      explain: 起點是 8，索引 11 已等於長度，不能碰。
    interview:
      question: 用 Triton 改寫向量加法後，你怎麼交代正確性證據？
      points:
        - 以非整除長度查尾塊
        - 讀寫都有遮罩
        - 分開 CPU 對照與裝置結果
      answer: 我會先列最後一塊所有偏移，只讓合法項讀寫，再逐元素比參考答案。若沒有相容環境，我會附 CPU 結果並把裝置執行列為待驗，不把它當作核心通過。
  - id: ai-gpu-tile-store
    prompt: 讀取已用遮罩填 0，為何寫回還需要遮罩？
    answer: 填 0 只定義未讀通道的數值，不會使那些通道的輸出地址變合法。
    mcq:
      question: 若移除尾塊的寫回遮罩，最直接的風險是？
      options:
        - 只會改變尾塊的讀值，不影響寫回
        - 無效通道總會自動略過寫回
        - 填 0 會使越界寫入變成合法
        - 寫到輸出陣列界線以外
      answer: 3
      explain: 未遮罩的寫入仍使用所有偏移，即使該通道的讀值為 0。
  - id: ai-gpu-triton-name
    prompt: Triton 語言與同名推論伺服器要怎麼分？
    answer: 語言用來表達、編譯裝置核心；伺服器用來部署模型與接受推論請求。
practice:
  - id: ai-gpu-10-lab
    title: 替最後一塊簽收
    kind: code
    minutes: 15
    steps:
      - 把 2 塊遮罩、最後 3 個結果與執行分支存成 tile-notes.txt
      - 將長度改為 9 再跑，寫下尾塊有效項數
    checks:
      - 長度 11 時尾塊有 3 個有效值，結果 23、26、29
      - 長度 9 時只剩 1 個有效值
---

## 為什麼要學

寫 CUDA 向量加法時，你替每條執行緒寫一個索引。改用 Triton 語言，思考的單位換成一整塊元素：這一份程式實例負責哪一段？段裡有哪些有效位置？資料仍然要正確讀寫，只是你不必手工指定每一條硬體通道負責哪個元素。這裡的 Triton 是撰寫核心的語言，不是用來部署模型的同名推論伺服器。

## 程式編號決定起點，遮罩保護尾端

程式識別碼（program ID）表示網格中這份程式實例的編號。假設塊寬是 8，編號 1 的起點就是 8；將起點加上 `tl.arange(0, B)` 產生的塊內範圍，得到一整排偏移量（offset）。每個偏移量都與總長度比較，結果是一排布林遮罩（mask），不是只問這一整塊要不要跑。

`tl.load` 依地址與遮罩讀回一塊值，`other=0` 指定未讀通道取得的替代數字，`tl.store` 仍要用遮罩才能避免寫到陣列外。讀取時填 0 不會自動保護寫回。以長度 11、每塊 8 為例，第二塊仍產生 8 個偏移量，卻只有 8、9、10 3 處有效。啟動網格要用向上取整，否則最後 3 個合法元素也會一併消失。

## 範例：同一張座位表，2 條驗證路徑

先跑純 Python 的分塊對照。只有在環境已具備相容的 Triton、PyTorch 與 CUDA 時，程式才啟動真實核心；一般 Windows 練習只需第一條路，不必為了本題安裝驅動或工具。保留輸出的分支標記，別把兩種證據混在一起。

在 `C:\dev\stackway-lab\gpu` 新建 `tile_add.py`。用一個不能剛好填滿分塊的長度檢查最後一塊。哪些位置可讀寫，應由有效索引決定，而非整塊大小。

在該目錄執行：Windows PowerShell 用 `py tile_add.py`；macOS／Linux 用 `python3 tile_add.py`。

```python
a = list(range(11))
b = [2*i - 1 for i in a]
n, width = len(a), 8
ref = [x+y for x, y in zip(a, b)]
out = [None] * n
for pid in range((n + width - 1) // width):
    offsets = [pid*width + j for j in range(width)]
    print("tile", pid, [i < n for i in offsets])
    for i in offsets:
        if i < n:
            out[i] = a[i] + b[i]
assert out == ref
print("CPU map OK", out[-3:])

try:
    import torch
    import triton
    import triton.language as tl
except ImportError:
    print("GPU path not run")
else:
    if torch.cuda.is_available():
        @triton.jit
        def add_tile(x, y, z, size, B: tl.constexpr):
            i = tl.program_id(0) * B + tl.arange(0, B)
            valid = i < size
            left = tl.load(x + i, mask=valid, other=0)
            right = tl.load(y + i, mask=valid, other=0)
            tl.store(z + i, left + right, mask=valid)

        x = torch.tensor(a, device="cuda", dtype=torch.float32)
        y = torch.tensor(b, device="cuda", dtype=torch.float32)
        z = torch.empty_like(x)
        add_tile[(triton.cdiv(n, width),)](x, y, z, n, B=width)
        assert z.cpu().tolist() == ref
        print("GPU output OK")
    else:
        print("GPU path not run")
```

這裡的輸入是小整數，就算裝置端用浮點數也可精確表示並逐格核對。換成一般浮點累加時，運算順序與捨入可能導致微小差異，驗收應另定合適的容許誤差；但容許誤差無法替代尾端界線檢查。

### 用一個有效項拆穿 2 種錯法

用長度 9 再看第二塊，只剩起點 8 合法。如果誤用「整塊尾端必須合法」作條件，整塊都不會寫，最後一格就遺失。如果誤用「整塊起點合法」作條件，卻不檢查各通道，後面幾個地址又會越界。這兩個錯法在資料長度剛好整除時都可能看似正確，因此邊界測資比隨手多生一堆大陣列有區辨力。

另一個檢查是交換兩個輸入：加法的結果應相同。這可驗算法的一項性質，但無法找出兩次都漏寫尾端的錯誤，所以它是逐元素對照的補充，不是取代。

## 常見錯誤

不要把塊寬 B 當成硬體的 warp 寬度。Triton 編譯器決定元素如何映射到硬體，B 在此是每份程式實例涵蓋的資料數。也不要只測剛好整除的長度；就算漏掉尾端遮罩，完整區塊的對照也可能看起來正常。

## 小結

保留非整除長度、逐元素參考值與實際執行路徑。能解釋每個偏移量從哪裡來，比背呼叫形式重要；能通過 CPU 分塊對照，比的是索引邏輯，還不是任何 GPU 的速度。
