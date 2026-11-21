---
id: ai-ml-04-loader
module: ai-ml
order: 4
title: Dataset 與批次載入
subtitle: 每輪到底看到了哪些資料
status: ready
minutes: 35
level: 3
prereqs:
  - ai-ml-03-baseline
objectives:
  - 用 Dataset 描述一筆樣本與標籤
  - 用 DataLoader 分批並核對最後一批的形狀
tags:
  - ml
  - loader
resources:
  - title: "PyTorch：資料集與批次載入器"
    url: "https://docs.pytorch.org/tutorials/beginner/basics/data_tutorial.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-sample-batch"
    prompt: "Dataset 與 DataLoader 各負責哪一層？"
    answer: "Dataset 定義單筆如何取出；DataLoader 決定如何取樣、排序與合成批次。"
    mcq:
      question: "要把每批改成 3 筆，主要改哪個設定？"
      options:
        - "DataLoader 的 batch_size"
        - "每筆的標籤值"
        - "特徵欄數"
        - "資料型別"
      answer: 0
      explain: "批次大小改變取樣組合，不改單筆意義。"
    interview:
      question: "如何確認一輪驗證真的看完所有資料？"
      points:
        - "核對單筆欄位與標籤"
        - "數各批實際筆數與尾批形狀"
        - "必要時追蹤樣本識別"
      answer: "我先關閉打散，確認一筆的特徵與標籤配對，再逐批加總實際列數。對小樣本我會列出識別記號核對無漏無重，不會只用批數乘設定大小。"
  - id: "ai-ml-tail-shape"
    prompt: "5 筆資料、每批 2 筆且保留尾批，最後的特徵形狀是什麼？"
    answer: "每筆有 2 欄時尾批為（1，2），仍保有樣本軸與 2 個特徵。"
    mcq:
      question: "哪一組是 3 批實際的樣本數？"
      options:
        - "2、2、2"
        - "1、2、2、1"
        - "2、1"
        - "2、2、1"
      answer: 3
      explain: "尾批不會自動補滿，5 筆都應各計一次。"
  - id: "ai-ml-label-pair"
    prompt: "為什麼不能獨立打亂特徵與標籤？"
    answer: "它們按樣本配對，獨立打亂會讓特徵對到其他樣本的答案。"
    mcq:
      question: "想洗牌又保留對應，該如何做？"
      options:
        - "只打亂標籤"
        - "分別排序特徵及標籤"
        - "以成對的樣本索引一起取資料"
        - "把標籤放入輸入當特徵"
      answer: 2
      explain: "共同索引能改變讀取順序而不拆散配對。"
practice:
  - id: "ai-ml-04-loader-p1"
    title: "留下尾批點名單"
    kind: "code"
    minutes: 12
    steps:
      - "執行 loader.py，在 batches.md 記下每批的兩個形狀與看過的第一欄"
      - "把 drop_last 改為 True 後重跑"
      - "指出哪一筆和哪個標籤消失"
    checks:
      - "保留尾批共看 5 筆，捨棄尾批只看 4 筆"
      - "能指出少了第一欄為 5、標籤為 1 的那筆"
---

## 為什麼要學：有 5 筆工作，為什麼每輪印出 3 行？
把整份資料一次塞進記憶體不一定可行；只看單筆，又無法發揮矩陣運算的好處。資料集（Dataset）和批次載入器（DataLoader）分別解決「一筆是什麼」和「每次拿幾筆」。把它們分開，就能不用改標籤規則，只調整一次處理的資料量。今天用 5 筆可認得的樣本，核對一輪到底有沒有遺漏。

## 核心概念：樣本、批次和一輪
每筆樣本由輸入特徵和正確標籤組成。本例的兩欄是讀取量與寫入量；標籤是工作是否逾時，不放進特徵當作提示。`TensorDataset` 讓同一列索引取出一對資料。它要求各張量的第一軸筆數一致，否則無法保證特徵和標籤一一配對。若日後需要按檔案讀取，才需要自己定義如何按索引取得單筆。

載入器把數筆樣本組成批次（batch）。每筆特徵原本只有 2 個數，疊成批次後會多出樣本軸；標籤原本是單一整數，疊好後是一維。完整走過一次載入器叫一輪（epoch）。批次大小設為 2 是「最多取 2 筆」，不是「保證所有批次剛好都是 2 筆」；尾端不足時是否保留，由設定決定。

## 範例：先保留順序，親自點名
在 `ml-notes` 新增 `loader.py`。用先前的虛擬環境執行：PowerShell 用 `.\.venv\Scripts\python.exe loader.py`，bash 用 `.venv/bin/python loader.py`。第一欄刻意選擇 5 個不同數字，讓你能從輸出追蹤每筆來源。
```python
import torch
from torch.utils.data import TensorDataset, DataLoader

x = torch.tensor([[1, 0], [2, 1], [3, 0], [4, 1], [5, 0]], dtype=torch.float32)
y = torch.tensor([0, 0, 1, 0, 1])
data = TensorDataset(x, y)
print("first", data[0])
loader = DataLoader(data, batch_size=2, shuffle=False, drop_last=False)
seen = []
for xb, yb in loader:
    print(tuple(xb.shape), tuple(yb.shape), yb.tolist())
    seen.extend(xb[:, 0].tolist())
print("seen", seen)
```
前兩批的特徵形狀都是 2 列 2 欄，最後一批只有 1 列，欄數仍然是 2。最後一批標籤形狀是長度 1 的向量，不是少了一個標籤。把每批真正取得的列數加總才是這輪看過的樣本數；用批數乘設定的批次大小會把尾批多算成 2 筆。

### 用尾批檢查下游約定
想像下一段程式要為每筆預測配回原始工作。如果它每次都預留 2 個編號，遇到尾批時便可能多生一個沒有對應工作的結果。解法不是加一筆假的工作來補滿，而是讓下游從這一批的樣本軸讀取實際大小。相同道理也適用於計算整輪的平均：每一批先數真正的筆數，若尾批只含一筆，就不該讓它和含很多筆的批次擁有相同的總權重。

## 常見錯誤
為了讓形狀固定就一律丟棄尾批，在驗證資料尤其危險：少算的恰好可能是稀少的正例。訓練時隨機打散順序能改變每批的組合，但不應分別打亂特徵和標籤，否則樣本會失去對應。除錯時先用固定順序和單一載入程序，看得見每筆從哪裡來，再考慮效率。

檢查最後一批是否仍有對應標籤，比只看第一批的形狀更能找到資料對齊問題。

## 小結
請從兩個層次描述這個輸入：「第幾筆資料回傳什麼」與「一批交給模型時長什麼樣子」。前者決定語意，後者決定形狀；最後一批是檢查兩者有沒有交談清楚的好地方。
