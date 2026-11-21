---
id: ai-gpu-05-compare
module: ai-gpu
order: 11
title: GPU 計時與暖機
subtitle: 讓兩次量測可以比較
status: ready
minutes: 35
level: 3
prereqs:
  - ai-gpu-10-triton
objectives:
  - 排除暖機與非同步計時的偏差
  - 列出 CPU 路徑不能推論的 GPU 結論
tags:
  - gpu
  - benchmarking
resources:
  - title: PyTorch：CUDA 張量與非同步執行
    url: https://docs.pytorch.org/docs/stable/notes/cuda.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: 看裝置轉移與計時前後的同步條件。
  - title: NVIDIA：CUDA 效能實務
    url: https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 選讀頻寬與合併存取的小節。
concepts:
  - id: ai-gpu-benchmark-fence
    prompt: 主機計時前後各一次同步，各排除什麼問題？
    answer: 前者排除上一輪留下的工作，後者確保本輪完成後才停錶。
    mcq:
      question: 只在起點同步，核心非同步提交後立刻停錶，主要漏了什麼？
      options:
        - 上一輪已清空的工作
        - 原本已排除在計時外的暖機成本
        - 全部主機呼叫成本
        - 本輪交辦後尚未完成的裝置工作
      answer: 3
      explain: 起點乾淨不代表終點已完成，通常只量到提交附近。
    interview:
      question: 兩份 GPU 耗時差 10 倍，先查哪幾個條件才相信比較？
      points:
        - 輸入與輸出一致
        - 冷暖與傳輸邊界相同
        - 終點確實完成並保留多次樣本
      answer: 我先驗同一份輸出，再對齊暖機、傳輸與同步。若一方量提交、另一方量完成，會重做同邊界實驗，而不是先用這兩個數宣稱加速。
  - id: ai-gpu-warm-separate
    prompt: 冷啟動成本在報告中應如何處理？
    answer: 依問題分開量冷啟動與暖機後穩態，不把首次成本混成一般迭代，也不假裝不存在。
    mcq:
      question: 產品每次只啟動一次就結束，哪個報告最有意義？
      options:
        - 另列含初始化的冷啟動延遲
        - 只報充分暖機後最快值
        - 只報裝置事件且排除初始化
        - 把首輪直接當成錯誤刪除
      answer: 0
      explain: 使用者確實要等初始化，穩態結果不能取代冷啟動指標。
  - id: ai-gpu-bench-cpu-limit
    prompt: CPU 參考路徑能為 GPU 計時證明什麼？
    answer: 可驗輸出與實驗流程，不能證明裝置上的速度、同步或加速比。
practice:
  - id: ai-gpu-11-lab
    title: 保留一份穩態計時單
    kind: code
    minutes: 12
    steps:
      - 執行程式，將分支、7 個樣本與中位數存進 timing-notes.txt
      - 標上未計入的步驟，以及若要量冷啟動要把起點移到哪
    checks:
      - 紀錄明示單位為毫秒且驗過整個輸出
      - 若只走 CPU，結論沒有填入 GPU 加速比
---

## 為什麼要學

第一輪比第二輪慢很多，是你把核心改快了，還是第一輪要初始化裝置？另一個常見的假象是程式一提交工作就停錶，把還在 GPU 上排隊的時間整段漏掉。要聲稱快了，首先應該能把計時的起點與終點指給另一個人看。

## 暖機與同步解決不同問題

暖機（warm-up）是在正式取樣前以相同形狀、型別和工作方式跑幾次，讓初始化、首次編譯或快取建立不要混進穩態樣本。這不表示首輪沒有價值：若產品每次都冷啟動，就另外量冷啟動，分開報告。同步（synchronization）則是要確定指定邊界前的工作真的做完，和丟棄首輪不是同一件事。

用主機牆鐘量一段非同步 GPU 工作時，單純把計時器放在呼叫前後通常只涵蓋提交。要量一段獨立工作，可在起錶前等前面的工作清空，提交待測項，再等裝置完成才停錶。此時間含提交與同步成本。若要在指定串流用兩個裝置事件（event）框一段工作，事件的時間差是另一種邊界，讀值前也要確認結束事件已完成。不要把兩種結果貼成同一欄。

## 範例：先做對照，再讀計時

若已有相容的 PyTorch 與 CUDA，範例在裝置上預備好資料，量同一個寫入預先配置輸出緩衝區的加法，不包含主機到裝置的初始搬移。其他環境用 CPU 的相同數學工作示範暖機與多次量測，會標明不是 GPU 成績。

先分清送出工作與工作完成的時間點。若停錶太早，縮短的可能只是主機等候時間。把下面的範例存成 `C:\dev\stackway-lab\gpu` 裡的 `warm_clock.py`。

在該目錄執行：Windows PowerShell 用 `py warm_clock.py`；macOS／Linux 用 `python3 warm_clock.py`。

```python
from statistics import median
from time import perf_counter
try:
    import torch
except ImportError:
    torch = None
gpu = torch is not None and torch.cuda.is_available()
n = 4096
if gpu:
    x = torch.arange(n, device="cuda", dtype=torch.float32)
    y = torch.empty_like(x)
    def work():
        torch.add(x, 1, out=y)
    sync = torch.cuda.synchronize
else:
    x, y = list(range(n)), [0]*n
    def work():
        for i, v in enumerate(x):
            y[i] = v + 1
    def sync():
        pass

for _ in range(3):
    work()
times = []
for _ in range(7):
    sync()
    start = perf_counter()
    work()
    sync()
    times.append((perf_counter()-start)*1000)
values = y.cpu().tolist() if gpu else y
assert values == list(range(1, n+1))
print("GPU wall ms" if gpu else "CPU only ms", times, "median", median(times))
```

若測試對象是整個服務，這裡排除的東西可能剛好是重點。使用者可能得等候排程、輸入搬移與結果回傳，不能把本例的單次運算時間當成服務延遲。比對前先在紙上標出誰按開始、誰看見結果，才知道這張計時單是否適用。

### 把計時外的驗算留在外面

範例在多次取樣之後才把結果帶回來，目的並不是免驗，而是不要把驗算混進每次計時。若某一版在停止計時之前就把整個向量印到螢幕，另一版只交出裝置上的緩衝區，兩個毫秒數描述的是不同終點。

讀 7 個樣本時留意是否有單次特別長；先保留這個樣本以及當時條件，不要先把它刪成漂亮的數字。小工作常受主機排程等因素影響，若要增加每輪工作量來降低量測噪音，兩版都要如此設定，並明說測的是整批而非單次。

## 常見錯誤

只報最快的一次會掩蓋波動；只跑一次又可能把初始化當常態。建議保留原始樣本及中位數。另一個陷阱是兩個版本做不同工作，例如甲含傳輸、乙已經有裝置資料。比較前先驗相同輸出，再固定輸入、批次與計時範圍，記下有哪些階段不計入。

## 小結

留下計時方法，而不只有毫秒數：裝置、工作大小、暖機次數、取樣次數、同步位置與輸出核對。CPU 結果可以教你驗算，但不能推出 GPU 的吞吐、頻寬或加速比。
