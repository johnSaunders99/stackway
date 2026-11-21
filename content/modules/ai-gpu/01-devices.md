---
id: ai-gpu-01-devices
module: ai-gpu
order: 1
title: 主機與裝置記憶體
subtitle: 主機與裝置不是同一塊記憶體
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 辨認張量所在裝置
  - 標出一次工作裡的資料搬移
tags:
  - gpu
  - device
resources:
  - title: NVIDIA：CUDA 程式設計模型
    url: https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: 讀主機、執行緒群組與硬體對應。
  - title: PyTorch：CUDA 張量與非同步執行
    url: https://docs.pytorch.org/docs/stable/notes/cuda.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: 看裝置轉移與計時前後的同步條件。
concepts:
  - id: ai-gpu-tensor-residence
    prompt: 如何分辨環境有 GPU 與某個張量正在 GPU 上？
    answer: 可用性是環境層級，張量的 device 才表示該張量實際所在裝置。
    mcq:
      question: CUDA 可用，但 x.device 顯示 cpu，能下哪個結論？
      options:
        - x 已在第一張顯示卡
        - 這個 x 仍在主機端
        - 系統沒有顯示卡
        - x 的資料必定同時存在所有裝置
      answer: 1
      explain: 查到可用不會改變既有張量的位置。
    interview:
      question: 服務常報張量不在同一裝置，你會留下什麼證據？
      points:
        - 印實際輸入與權重裝置
        - 查看轉移的回傳值
        - 在資料流標記進出點
      answer: 我會在運算前比輸入與權重的 device，把搬移前後兩個張量分開記。先讓同一批資料在同一裝置算完，最後才帶回需要的輸出。
  - id: ai-gpu-move-return
    prompt: 為什麼要接住 x.to(target) 的結果？
    answer: 回傳張量才代表目標裝置上的結果，舊變數不會因呼叫而自動重新綁定。
    mcq:
      question: x 在 CPU，單寫 x.to('cuda') 後讀原 x，在哪裡？
      options:
        - 預設 GPU
        - 任意空閒的 GPU
        - CPU
        - 沒有裝置
      answer: 2
      explain: 未賦值不會讓原本的 x 改指向回傳結果。
  - id: ai-gpu-transfer-boundary
    prompt: 若中間有多步 GPU 計算，何時需要搬回主機？
    answer: 等主機消費者真正要讀結果時再搬，避免不必要的來回與等待。
practice:
  - id: ai-gpu-01-lab
    title: 替一次加法開搬運單
    kind: code
    minutes: 9
    steps:
      - 執行範例，把實際輸出與分支名稱存入 device-notes.txt
      - 畫出獨顯路線並標明哪些步驟在自己的環境是推演
    checks:
      - 結果為 4、9
      - 若全在 CPU，搬運單沒有聲稱觀察到主機與 GPU 間的傳輸
---

## 為什麼要學

在有獨立顯示卡的電腦上，CPU 載入一份輸入，不表示 GPU 已能直接拿那份資料開始算。把數字想成一箱貨：你除了要知道箱裡有幾個數、每個數是什麼型別，也要知道箱子放在哪。許多看似算式錯誤的問題，其實是輸入與權重不在同一個裝置。

## 先畫放置位置，再畫跨裝置的箭頭

主機（host）在這裡指 CPU 與它使用的主記憶體；裝置（device）指拿來運算的 GPU。在典型獨立顯示卡與明確複製的模型裡，先在主機整理輸入，搬到裝置，讓運算就地進行，再在確實需要時把結果帶回。即使程式只有一行加法，來回傳輸也可能比加法本身花更多時間。統一記憶體等機制有不同的遷移方式，不代表跨裝置存取沒有成本。

張量（tensor）的形狀描述有幾個元素，裝置屬性則說明它在哪裡。PyTorch 用 `x.device` 看實際張量，用 `torch.cuda.is_available()` 查環境能不能走 CUDA；後者為真不代表既有的 x 已搬走。`x.to(target)` 回傳目標裝置上的張量，應接住回傳值。若本就在目標上且型別相同，不需要因這次呼叫另算一次搬移。

## 範例：核對一箱貨的來回

沿用[〈PyTorch 裝置轉移〉](#/lesson/ai-ml-08-device)的張量觀念。已有 PyTorch 時，程式會印實際裝置；沒有套件時走純 Python，印出明確標示的路線推演，不假裝觀察到顯示卡。兩條路都應得到相同的數值。

為主機和裝置的搬移實驗建立 `C:\dev\stackway-lab\gpu`。建立 `device_trip.py`。用兩欄標記每份資料此刻在主機或裝置。先圈出必須跨界的步驟，再查搬移次數。

在該目錄執行：Windows PowerShell 用 `py device_trip.py`；macOS／Linux 用 `python3 device_trip.py`。

```python
try:
    import torch
except ModuleNotFoundError:
    torch = None
if torch is None:
    data = [3, 8]
    print("plan only: host -> device -> host", [n + 1 for n in data])
else:
    x = torch.tensor([3, 8], device="cpu")
    target = "cuda" if torch.cuda.is_available() else "cpu"
    y = x.to(target)
    z = (y + 1).to("cpu")
    print("observed", x.device, y.device, z.device, z.tolist())
```

如果結果列是三次 cpu，這仍是有用的對照：輸入、運算、輸出都有位置，但沒有裝置邊界需要跨越。若印出 cuda:0，再檢查原來的 x 仍留在 cpu，便能區分「複製得到新張量」與「原位置消失」兩種解讀。

### 只帶回使用者要看的那一部分

假設裝置剛算完一批分數，畫面只要顯示其中最高的那個。第一種路線把所有分數帶回主機，再挑最大值；第 2 種先在裝置挑出最大值，只把那個結果帶回。最後顯示的內容可能完全一致，跨界的資料量卻不同。若這批分數下一步還要在裝置繼續使用，更沒有必要為了顯示而把整批搬來搬去。

請在搬運單上替箭頭寫上用途：哪一步是運算需要，哪一步只為檢查。量正式流程時可以關掉額外的檢查輸出，但驗證數值時仍要留下能和主機路徑比較的結果。

## 常見錯誤

別在每一步都呼叫轉回主機的操作只為了印一個數。若後面仍在 GPU 上算，這樣做可能同時引入傳輸及等候，讓你量到的是觀察動作而非原本的工作。也不要只把模型移上去，卻忘了把這一批輸入放在相容的裝置；模型的設定不會替所有外部張量更改住所。

## 小結

把資料流寫成「哪個張量、哪個裝置、下一個誰要讀」。移動以消費端需要為準；最後交回主機一個結果，與每做一個小步就把中間產物帶回來，是兩種不同的工作負載。
