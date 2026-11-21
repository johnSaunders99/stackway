---
id: ai-ml-04-train
module: ai-ml
order: 7
title: 訓練迴圈與參數更新
subtitle: 一次訓練迴圈裡發生什麼
status: ready
minutes: 35
level: 3
prereqs:
  - ai-ml-06-autograd
objectives:
  - 標出前向、損失、反向與更新的順序
  - 比較同批資料更新前後的損失
tags:
  - ml
  - gradient
resources:
  - title: "PyTorch：最佳化迴圈"
    url: "https://docs.pytorch.org/tutorials/beginner/basics/optimization_tutorial.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-train-order"
    prompt: "一個獨立批次的參數更新，主要步驟應如何排列？"
    answer: "清除舊梯度、前向並計算損失、反向求梯度、由最佳化器更新。"
    mcq:
      question: "哪一步真正把梯度用在參數上？"
      options:
        - "before.backward()"
        - "opt.zero_grad()"
        - "印出損失"
        - "opt.step()"
      answer: 3
      explain: "反向只產生梯度，清除和列印都不會學習。"
    interview:
      question: "你怎麼找出「訓練有跑、參數沒動」卡在哪一步？"
      points:
        - "用固定批次記錄更新前數字"
        - "查梯度與最佳化器步驟"
        - "重做前向並比對權重"
      answer: "我會先用可手算的小批次看損失和梯度，再比較 step 前後同一參數。如果梯度存在但權重沒變，會查最佳化器是否拿到該參數、是否執行更新，而不先怪資料太少。"
  - id: "ai-ml-matched-loss"
    prompt: "為何更新前後要用同一批比較損失？"
    answer: "固定資料才能把差異歸因於這步的參數變動，而非樣本難度不同。"
    mcq:
      question: "哪個做法能得到更新後的損失？"
      options:
        - "再印一次 before"
        - "改用另一份標籤"
        - "重用相同資料做新的前向"
        - "只讀梯度"
      answer: 2
      explain: "舊損失不會自行重算，換資料也無法公平比較。"
  - id: "ai-ml-sgd-sign"
    prompt: "SGD 遇到負梯度時，這個參數會往哪裡走？"
    answer: "在正學習率、無動量與其他修正的本例中，減去負值會使參數增加。"
    mcq:
      question: "權重 0、梯度負 10、學習率 0.1，下一個權重是什麼？"
      options:
        - "負 1"
        - "1"
        - "10"
        - "0.1"
      answer: 1
      explain: "更新是舊權重減去學習率乘梯度，不是直接加梯度。"
practice:
  - id: "ai-ml-04-train-p1"
    title: "做一張單步更新收據"
    kind: "code"
    minutes: 12
    steps:
      - "執行 step.py，在 step-note.md 列出初始權重、2 筆預測、梯度和新權重"
      - "將學習率改為 0 再從頭執行"
      - "把兩次更新後的損失放在一起"
    checks:
      - "學習率 0.1 時損失為 10 到 2.5"
      - "學習率 0 時梯度仍存在但損失維持 10"
---

## 為什麼要學：算出了梯度，模型為什麼還沒變？
昨天的實驗做了反向傳播，參數仍停在原位。訓練迴圈（training loop）就是把「預測、衡量、找方向、移動」接在一起，對每批資料重複執行。今天讓一個權重從 0 出發，學著把輸入乘以 2。只更新一次就停下來，檢查是不是真的往目標走，不讓長長的訓練紀錄淹沒了第一步。

## 核心概念：把工作分配給正確的角色
模型負責前向運算，損失函式負責把預測與標籤的差距轉成純量，自動微分負責求導，最佳化器（optimizer）才負責改動可訓練參數。隨機梯度下降（SGD）在這個沒有動量的例子中，把參數減去「學習率乘以梯度」。學習率決定每次跨多遠；正梯度使參數往小的方向走，負梯度則讓它增加。方向對了也不代表步幅一定合適。

每批開始前清除原有梯度，再做前向、算損失、反向、更新。更新完以**同一批輸入與標籤**重算損失，才能把差異歸於參數變動。若改拿另一批資料，損失可能只因題目較容易而變小。比較時不用再累積梯度，以不追蹤梯度的區段做第二次前向即可。

## 範例：手算一次，再看一步的紀錄
將內容存成 `ml-notes` 裡的 `step.py`。PowerShell 執行 `.\.venv\Scripts\python.exe step.py`，bash 用 `.venv/bin/python step.py`。線性層只有 1 個權重，沒有偏差，初始值刻意設為 0。
```python
import torch
from torch import nn
model = nn.Linear(1, 1, bias=False)
with torch.no_grad():
    model.weight.zero_()
x, y = torch.tensor([[1.], [2.]]), torch.tensor([[2.], [4.]])
opt = torch.optim.SGD(model.parameters(), lr=0.1)
loss_fn = nn.MSELoss()
opt.zero_grad(set_to_none=True)
before = loss_fn(model(x), y)
before.backward()
g = model.weight.grad.item()
opt.step()
with torch.no_grad():
    after = loss_fn(model(x), y)
print("loss", before.item(), after.item(), "grad", g, "weight", model.weight.item())
```
均方誤差（mean squared error）先把每筆的差平方，再取平均。0 權重時 2 筆都猜 0，平方差是 4 與 16，平均 10。導數為負 10，學習率 0.1 讓權重變成 1；更新後猜 1 與 2，平方差 1 與 4，平均 2.5。先說清楚哪個張量是預測、哪個是標籤，才不會把輸入本身拿來當作目標。

### 用第 2 種學習率檢查你的解讀
假如權重仍從相同位置起步，但把學習率設為 0，前向和反向都照常發生，最後的更新量才變成 0。這個對照能分辨「沒有梯度」與「收到梯度但沒有移動」。再想像學習率大到跨過理想權重，移動後離目標可能比原來還遠。由此可以看出，只有更新前的梯度方向，不足以保證選定步幅之後的損失一定變小。 想判斷一步是否合適，仍得把新參數帶回原來的問題，重新計算同一種誤差。

## 常見錯誤
再次列印舊的 `before`，不會看到更新後的損失；它記的是當時那次前向的結果。忘了 `opt.step()` 則會有梯度卻完全沒有參數更新。若自己的資料上損失升高，先核對資料、初始權重和學習率，不要把「這個受控例子下降」誤當每一批、每一步都必定下降的保證。

## 小結
能交接的紀錄不是一句「有跑訓練」，而是同一批資料在更新前後的損失、這步用的梯度與新權重。這些數能互相驗算，才證明訓練迴圈的各段真的接在一起。
