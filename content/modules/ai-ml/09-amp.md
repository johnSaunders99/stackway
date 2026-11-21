---
id: ai-ml-09-amp
module: ai-ml
order: 9
title: 自動混合精度訓練
subtitle: 較小的數值格式需要哪些保護
status: ready
minutes: 35
level: 3
prereqs:
  - ai-ml-08-device
objectives:
  - 區分 autocast 與梯度縮放的工作
  - 對照同一批輸入的損失與記憶體，無適用裝置時判讀範例
tags:
  - ml
  - amp
resources:
  - title: "PyTorch：自動混合精度練習"
    url: "https://docs.pytorch.org/tutorials/recipes/recipes/amp_recipe.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-amp-two-jobs"
    prompt: "autocast 和梯度縮放各處理哪個問題？"
    answer: "autocast 為部分運算選擇精度；縮放器保護微小梯度並協調安全更新。"
    mcq:
      question: "哪項是縮放器而非 autocast 的工作？"
      options:
        - "依運算選擇前向精度"
        - "放大損失並在更新前還原梯度比例"
        - "決定資料切分"
        - "永久把所有權重變成 FP16"
      answer: 1
      explain: "選擇前向精度和管理梯度範圍是不同機制。"
    interview:
      question: "團隊問能否靠 AMP 把記憶體減半，你會如何驗證？"
      points:
        - "固定模型、批次及起點"
        - "分別記錄損失和定義清楚的峰值"
        - "區分單步觀察與長程效果"
      answer: "我不會先保證比例。我會用相同批次和權重分別跑，說清楚量的是張量配置還是整卡用量，同時比較損失。單步合理後再測代表性訓練，不拿 CPU 示意資料當 GPU 結果。"
  - id: "ai-ml-amp-controlled"
    prompt: "比較兩種精度的同批損失時，為何要重設起點？"
    answer: "若權重已更新，觀察差異可能來自學習而非數值格式。"
    mcq:
      question: "哪組對照適合觀察精度差異？"
      options:
        - "同一輸入與標籤、同一初始權重"
        - "模型更新後才換精度與資料"
        - "兩種精度使用不同目標"
        - "只比較兩次不相干的紀錄"
      answer: 0
      explain: "必須固定決策以外的因素。"
  - id: "ai-ml-peak-delta"
    prompt: "一次訓練區段的額外張量峰值能代表什麼？"
    answer: "代表該量測範圍內相對起點的配置峰值，不是整卡用量或普遍的節省比例。"
    mcq:
      question: "CPU 路徑印出 illustration only，應怎麼記錄？"
      options:
        - "已實測顯示卡峰值"
        - "已證明 AMP 必然更快"
        - "本機顯示卡用了印出的位元組數"
        - "示意判讀，沒有 GPU 實測"
      answer: 3
      explain: "未執行的裝置路徑不能當成本機量測。"
practice:
  - id: "ai-ml-09-amp-p1"
    title: "交付一份有來源標記的精度對照"
    kind: "code"
    minutes: 12
    steps:
      - "執行腳本並在 precision.md 註明本機量測或示意判讀"
      - "列出兩列的精度、損失、額外峰值及單位"
      - "依數字寫一句哪一項較大及一項無法推出的結論"
    checks:
      - "兩列都是相同定義下的數字"
      - "沒有 GPU 時清楚標記示意，不聲稱量到加速或節省一半"
---

## 為什麼要學：小數用得比較省，梯度還在嗎？
同一批資料若以較少位元表示，部分運算可能用較少記憶體，也可能受益於硬體加速。但數字能表示的範圍和細緻度也會改變。自動混合精度（automatic mixed precision，AMP）的重點是針對不同運算選擇適合的格式，不是把模型和所有資料一律轉成半精度，更不是先答應「用量一定砍半」。

## 核心概念：一個選運算格式，一個保住微小梯度
自動轉型（autocast）在指定區段內，依裝置與運算規則讓部分工作使用較低精度，另一些維持較高精度；本例把模型前向與損失放在該區段。反向則在區段外進行。半精度浮點數（FP16）表示很小的數時可能下溢成 0，參數就可能收不到有用的更新。

梯度縮放（gradient scaling）先放大損失再反向，使微小梯度比較不容易消失。更新前要還原縮放，遇到非有限梯度時跳過不可靠的更新，並調整之後的比例。用函式庫的縮放器管理這件事，不要把放大後的梯度直接當成正常梯度。這是數值保護，不是把學習率調大的捷徑。

## 範例：固定起點，記錄損失和峰值
存為 `ml-notes` 的 `amp_check.py`，PowerShell 用 `.\.venv\Scripts\python.exe amp_check.py`，bash 用 `.venv/bin/python amp_check.py`。同一批與初始權重在 CPU 先建好，兩次獨立建立模型並載回同一起點。CUDA 是讓程式把運算交給相容 NVIDIA GPU 的平台，主機和裝置記憶體的差異見[〈主機與裝置記憶體〉](#/lesson/ai-gpu-01-devices)。無可用 CUDA 時只列印清楚標示的示意紀錄供判讀，不當作本機量測。
```python
import torch
from torch import nn

def compare():
    torch.manual_seed(7)
    base = nn.Linear(256, 256)
    x = torch.randn(32, 256, device="cpu").cuda()
    y = torch.zeros_like(x)
    def one(amp):
        m = nn.Linear(256, 256).cuda()
        m.load_state_dict(base.state_dict())
        opt = torch.optim.SGD(m.parameters(), lr=0.01)
        scaler = torch.amp.GradScaler("cuda", enabled=amp)
        torch.cuda.reset_peak_memory_stats()
        start = torch.cuda.memory_allocated()
        with torch.autocast("cuda", dtype=torch.float16, enabled=amp):
            loss = nn.functional.mse_loss(m(x), y)
        scaler.scale(loss).backward()
        scaler.step(opt)
        scaler.update()
        peak = torch.cuda.max_memory_allocated() - start
        print("measured", "AMP" if amp else "FP32", loss.item(), peak, "bytes")
    one(False)
    one(True)

if torch.cuda.is_available():
    compare()
else:
    print("illustration only: FP32 loss=0.3400 peak_delta=360000 bytes")
    print("illustration only: AMP  loss=0.3402 peak_delta=400000 bytes")
```
本例記錄的是「這一次更新區段額外用到的張量配置峰值」，單位為位元組，並非整張顯示卡的總用量。2 個損失都是更新前的值，不拿已走一步的模型和起始模型相比。示意資料中損失相近，但額外峰值反而變大；對小模型，轉型副本和縮放器也需要空間，不能從權重位數單獨推算整體節省比例。

### 把量測限制也寫入收據
範例不計算執行時間，峰值也只涵蓋指定配置範圍；因此就算看到額外位元組比較少，也不能聲稱訓練提前幾分鐘結束。若要把這張收據交給其他團隊，請附上實際批次大小與量測邊界，讓對方知道這個差值究竟來自什麼工作。

## 常見錯誤
把兩種精度接在同一個已更新的模型上跑，分數差異就混入參數改變。另一個陷阱是把單批損失接近寫成「訓練同樣穩定」。這只是第一個檢查，實際採用仍要觀察多步的有限梯度、驗證品質與代表性工作量。不具備適用裝置時，可以交出有根據的判讀，但不能報告自己量到了加速。

## 小結
把精度策略當成一項待驗證的改動。固定資料、權重和衡量範圍，同時記下數值表現與記憶體，不把硬體宣傳或示意數字當作自己的實驗結果。
