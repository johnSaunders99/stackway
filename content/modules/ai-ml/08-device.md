---
id: ai-ml-08-device
module: ai-ml
order: 8
title: PyTorch 裝置轉移
subtitle: 資料和模型要在哪裡相遇
status: ready
minutes: 30
level: 3
prereqs:
  - ai-ml-04-train
objectives:
  - 判斷可用裝置並保留 CPU 路線
  - 將模型和批次移到相同裝置，再確認輸出所在位置
tags:
  - ml
  - device
resources:
  - title: "PyTorch：選擇裝置與移動模型"
    url: "https://docs.pytorch.org/tutorials/beginner/basics/buildmodel_tutorial.html"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-device-fallback"
    prompt: "為什麼要根據執行環境選裝置，而不是寫死 CUDA？"
    answer: "不同環境可用後端不同，明確保留 CPU 路徑能讓相同功能在無 CUDA 時執行。"
    mcq:
      question: "CUDA 探測回 False，這份腳本應怎麼做？"
      options:
        - "選 CPU 繼續核對輸出"
        - "將所有標籤刪除"
        - "仍強制選第一張顯示卡"
        - "跳過整個前向並宣告成功"
      answer: 0
      explain: "沒有可用 CUDA 不表示 CPU 無法做同樣的小型運算。"
    interview:
      question: "腳本在 GPU 主機回報裝置不一致，你會先比對哪些東西？"
      points:
        - "查實際可用後端"
        - "核對權重、輸入及標籤位置"
        - "用輸出裝置和同一小批次驗證"
      answer: "我會印出權重、當批特徵與標籤的實際裝置，尤其檢查是否丟掉張量轉移後的回傳值。最後在同一批上算出損失，也保留 CPU 可以跑的版本。"
  - id: "ai-ml-tensor-to-result"
    prompt: "一般張量呼叫 to 後應使用哪個值？"
    answer: "使用其回傳值，不能一概假設原張量已改變裝置。"
    mcq:
      question: "哪個寫法能確保接下來用到目標裝置的批次？"
      options:
        - "只呼叫 x.to(device) 再忽略回傳"
        - "只列印 device"
        - "只移動模型"
        - "x = x.to(device)"
      answer: 3
      explain: "一般張量的轉移與參數模組的行為不應混為一談。"
  - id: "ai-ml-device-evidence"
    prompt: "怎麼確認運算真的在預定的裝置上？"
    answer: "核對實際權重、輸入、標籤與輸出的 device，而不只看選擇的字串。"
    mcq:
      question: "哪個證據最完整？"
      options:
        - "電腦貼有顯示卡標籤"
        - "只印出 cuda 字串"
        - "列出實際各張量裝置並成功計算損失"
        - "只看作業系統名稱"
      answer: 2
      explain: "硬體存在與設定值都不能單獨證明資料路徑。"
practice:
  - id: "ai-ml-08-device-p1"
    title: "保存 CPU 或 GPU 的裝置收據"
    kind: "code"
    minutes: 10
    steps:
      - "執行範例並把實際裝置與形狀存入 device-note.md"
      - "將 chosen 固定為 CPU 再執行一次"
      - "比較兩次的實際路徑，不推論未量測的速度"
    checks:
      - "兩次都能完成同一批資料"
      - "紀錄列出 4 個張量的位置、輸出形狀與有限損失，不把 CPU 結果冒充 GPU 結果"
---

## 為什麼要學：有顯示卡，不表示程式正在上面跑
同一份訓練腳本在筆電用中央處理器（CPU）測通，換到有圖形處理器（GPU）的電腦後，不能只把模型移過去就算完成。資料所在的裝置（device）也是張量的一部分；哪個裝置儲存權重、哪個裝置儲存輸入，決定運算能否在預定位置發生。本堂不是比速度，而是做一份在沒有顯示卡時仍然成立的裝置收據。

## 核心概念：選了目的地，還要真的搬運
CUDA 是 PyTorch 使用相容 NVIDIA 裝置的一條執行路徑。`torch.cuda.is_available()` 告訴你目前這個 Python 環境是否有可用的 CUDA 路徑，不是列出機器所有硬體的總表。本例若不可用就選 CPU，這是一個刻意保留的正常路徑。其他平台也可能有別的加速後端，這份程式沒有測它們，不應把結果解讀成「這臺機器沒有任何加速能力」。

模型的 `.to(device)` 會遞迴移動已登記的參數與緩衝區；普通張量的 `.to(device)` 則回傳符合要求的張量，來源已符合條件時可能直接回傳原物件。把結果指派回變數，不要只呼叫後就假定原輸入改了位置。分類任務做損失計算時，標籤也要和輸出相容；不能只搬權重與特徵，讓標籤留在另一端。

## 範例：向每個張量詢問位置
在 `ml-notes` 建立 `device_note.py`，PowerShell 執行 `.\.venv\Scripts\python.exe device_note.py`，bash 執行 `.venv/bin/python device_note.py`。只建 2 筆資料，沒有需要下載的訓練集。
```python
import torch
from torch import nn
chosen = torch.device("cuda" if torch.cuda.is_available() else "cpu")
net = nn.Linear(2, 2).to(chosen)
x = torch.tensor([[1., 0.], [0., 1.]]).to(chosen)
y = torch.tensor([0, 1]).to(chosen)
out = net(x)
loss = nn.functional.cross_entropy(out, y)
print("requested", chosen, "weight", net.weight.device)
print("input", x.device, "target", y.device, "output", out.device)
assert net.weight.device == x.device == y.device == out.device
print("shape", tuple(out.shape), "finite", torch.isfinite(loss).item())
```
請核對輸出的實際裝置，而非只看 `requested` 那行。沒有 CUDA 時，每個位置都應為 CPU、輸出仍是 2 列 2 欄，正好說明功能不依賴特定硬體。有 CUDA 時實際裝置可能顯示編號，例如 `cuda:0`；比較的是運算中各張量是否同處，而不是要求原始設定字串與顯示字串逐字相同。隨機初始權重會影響損失，並不影響這次要確認的位置關係。

### 數值不同並不一定是搬運失敗
若你從頭執行兩次這個腳本，模型每次都重新建立，權重也會重新初始化。即使兩次都在同一處理器，預測值也可能不同。想另外測數值一致性時，必須固定權重與輸入，再選擇合理的浮點誤差範圍。這跟本次的裝置一致性是不同驗收項目，不能用有沒有得到同一個小數取代位置檢查。

## 常見錯誤
為每次列印都把完整輸出搬回 CPU，然後以為時間都花在模型運算；搬運和等待也有成本。若要比較效能，必須另外定義計時範圍與同步方式。另一個錯誤是程式直接寫死顯示卡編號，讓沒有該裝置的同事連輸入形狀都無法驗證。先保留可以完成同一任務的 CPU 路線，再擴充硬體選擇。

模型參數和輸入放在不同記憶體，即使看得到 GPU 也不能直接相乘。兩邊的記憶體怎麼分，見[〈主機與裝置記憶體〉](#/lesson/ai-gpu-01-devices)。

## 小結
用「實際權重、輸入、標籤、輸出的位置一致」驗收裝置轉移。成功的 CPU 收據和成功的 GPU 收據都能證明資料路徑正確，但都還不是效能報告。
