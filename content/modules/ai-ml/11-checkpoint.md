---
id: ai-ml-06-checkpoint
module: ai-ml
order: 11
title: 檢查點儲存與載入
subtitle: 明天能否接著昨天訓練
status: ready
minutes: 35
level: 3
prereqs:
  - ai-ml-05-evaluate
objectives:
  - 辨認模型權重與最佳化器狀態
  - 重新載入後比對固定輸入的輸出
tags:
  - ml
  - checkpoint
resources:
  - title: "PyTorch：儲存與載入檢查點"
    url: "https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html"
    kind: "doc"
    lang: "en"
    minutes: 9
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-checkpoint-contract"
    prompt: "推論用的權重和續訓用的檢查點有何不同？"
    answer: "推論需相容結構與模型狀態；續訓還要恢復最佳化器、進度及任務依賴的其他狀態。"
    mcq:
      question: "使用動量時只存權重，最可能漏掉什麼？"
      options:
        - "本次輸入的欄數定義一定消失"
        - "所有模型參數"
        - "執行檔的副檔名"
        - "前面更新留下的動量緩衝"
      answer: 3
      explain: "權重可重現當下前向，卻不包含最佳化器的歷史。"
    interview:
      question: "你會如何驗收一份聲稱可以續跑的檢查點？"
      points:
        - "相容的新模型與最佳化器"
        - "固定輸入、模式核對當下預測"
        - "同批再走一步並說明隨機狀態限制"
      answer: "我先重建物件並載回模型、最佳化器和步數，用固定輸入比對當下輸出。接著兩邊用同一批更新一次。若流程有打散或隨機層，還要把相關狀態列入還原條件。"
  - id: "ai-ml-restore-probe"
    prompt: "如何確認新模型真的讀回正確權重？"
    answer: "建立相容的新物件載入狀態，用固定輸入與一致模式比較輸出。"
    mcq:
      question: "哪個證據比檔案存在更直接？"
      options:
        - "副檔名正確"
        - "檔名有日期"
        - "重載模型對固定輸入得到相符輸出"
        - "資料夾有更新時間"
      answer: 2
      explain: "只有實際重載並比較才能驗到取用路徑。"
  - id: "ai-ml-next-step-probe"
    prompt: "為什麼還要比較恢復後的下一步？"
    answer: "當下前向不會用到最佳化器歷史，下一步相符才有關於續訓狀態的證據。"
    mcq:
      question: "兩個模型當下輸出相同，接著如何測動量有否正確恢復？"
      options:
        - "只看當下兩個輸出"
        - "相同批次各更新一步再比對"
        - "改用不同資料後比時間"
        - "只印檢查點檔名"
      answer: 1
      explain: "固定資料的更新步驟會用到最佳化器狀態。"
practice:
  - id: "ai-ml-06-checkpoint-p1"
    title: "保留可驗收的檢查點"
    kind: "code"
    minutes: 13
    steps:
      - "在新的 resume-lab 資料夾執行範例並保留 step-1.pt"
      - "把步數、兩次比較的布林值與各自驗證的事情記在 restore-check.md"
      - "如需重跑，改用另一個全新練習資料夾"
    checks:
      - "讀回的步數是 1，兩次比較均為 True"
      - "筆記能區分模型狀態與最佳化器狀態"
---

## 為什麼要學：昨天訓練到哪一步，今天怎麼證明？
你想把模型帶到另一個程序做預測，或是工作中斷之後接著訓練。兩件事都需要保存資料，但要存的東西不同。檢查點（checkpoint）是某個時間點的狀態紀錄，不是「資料夾裡有個檔案」的同義詞。今天親自用一個全新模型讀回檔案，再問它同一道題，核對重載的到底是不是昨天那組參數。

## 核心概念：輸出一致，和下一步一致，不是同一關
模型狀態字典（state dictionary）保存具名參數與持久緩衝區，通常不包含定義網路結構的程式碼。載入端須先建立相容的模型，再把狀態放回去。只做推論時，還要用評估模式（evaluation mode）處理會隨訓練模式改變行為的層，並關閉不需要的梯度追蹤。兩者是不同開關，不能只做其中一個就當作兩件事都完成。

接續訓練時，還要存最佳化器狀態。以帶動量（momentum）的梯度下降為例，它保有之前梯度留下的累積方向；僅載回相同權重，當下預測可能一致，下一步卻走向不同位置。另存已完成步數，好讓紀錄與迴圈從正確位置繼續。若要精確重現帶隨機性或打散資料的訓練，還要處理隨機狀態、資料進度與其他會變動的元件。

## 範例：讓新物件回答固定的一題
在 `ml-notes` 中建立本課專用的新資料夾 `resume-lab`，把程式存成 `resume.py`，於該資料夾執行。PowerShell 用 `..\.venv\Scripts\python.exe resume.py`，bash 用 `../.venv/bin/python resume.py`。檔案以專屬建立模式開啟，若同名檔已存在就停止，不覆蓋昨天的成果。
```python
import torch
from torch import nn
torch.manual_seed(9)
x, y = torch.tensor([[2.]]), torch.tensor([[4.]])
def make():
    m = nn.Linear(1, 1)
    return m, torch.optim.SGD(m.parameters(), lr=0.05, momentum=0.9)
def step(m, opt):
    m.train()
    opt.zero_grad()
    (m(x) - y).square().mean().backward()
    opt.step()
def probe(m):
    m.eval()
    with torch.no_grad():
        return m(x).clone()

m, opt = make()
step(m, opt)
expected = probe(m)
with open("step-1.pt", "xb") as f:
    torch.save({"model": m.state_dict(), "opt": opt.state_dict(), "step": 1}, f)
saved = torch.load("step-1.pt", map_location="cpu", weights_only=True)
other, opt2 = make()
other.load_state_dict(saved["model"])
opt2.load_state_dict(saved["opt"])
print("restored step", saved["step"], "same output", torch.allclose(expected, probe(other)))
step(m, opt)
step(other, opt2)
print("same next output", torch.allclose(probe(m), probe(other)))
```
第一次比較在重建後、再訓練前進行，測的是相同輸入能否重現預測。第二次比較讓原模型和重載模型各走同一步，連帶檢查動量是否接上。兩者都用容許微小浮點差異的比較，而不是比較檔案大小或檔名。這個例子在 CPU、固定輸入與簡單線性模型上執行，不能因此宣稱所有硬體的任意訓練都能逐位元重現。

### 一個只看權重會錯過的對照
若把兩個模型都停在載回後，動量資料就算漏載，當下的固定輸入也可能得到完全一樣的數值。把「當下」與「下一步」分成兩列寫下，可以提醒接手的人：前一列是推論能用的證據，後一列才開始測到續訓。

## 常見錯誤
只在原模型上讀回，可能它本來就還保有正確權重，錯誤的載入路徑因此沒被發現。用全新的模型物件比較，才能真的走過還原步驟。不要任意載入來源不明的檢查點；範例只讀剛才親手產生的檔案，限制載入模式也不等於信任任何外來檔案。

## 小結
保留一個能回答的固定問題，比只保留一張「儲存成功」畫面可靠。若要交付續跑能力，就在當下輸出之外，再驗證恢復後的第一步。
