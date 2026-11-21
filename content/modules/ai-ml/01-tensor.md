---
id: ai-ml-01-tensor
module: ai-ml
order: 1
title: 張量、形狀與資料型別
subtitle: 一筆資料如何變成張量
status: ready
minutes: 35
level: 3
prereqs: []
objectives:
  - 用列與欄解釋張量形狀
  - 驗算一個迷你批次的矩陣乘法
tags:
  - ml
  - tensor
resources:
  - title: "PyTorch：張量屬性與運算"
    url: "https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html"
    kind: "doc"
    lang: "en"
    minutes: 7
    required: false
    checked: "2026-11-20"
  - title: "PyTorch：選擇本機安裝方式"
    url: "https://pytorch.org/get-started/locally/"
    kind: "doc"
    lang: "en"
    minutes: 4
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-tensor-contract"
    prompt: "一批 3 筆、每筆 2 個特徵的張量，形狀如何解讀？"
    answer: "若列為樣本、欄為特徵，形狀是（3，2）；軸的語意由資料安排決定。"
    mcq:
      question: "增加一筆工作但不改特徵定義，形狀會變什麼？"
      options:
        - "（3，3）"
        - "（4，2）"
        - "（2，4）"
        - "（4，1）"
      answer: 1
      explain: "只增加樣本列，不會改變每筆的特徵數。"
    interview:
      question: "你怎麼確認一個批次的計分真的按特徵相乘？"
      points:
        - "替輸入與權重軸命名"
        - "預測輸出形狀"
        - "選一列手算對照"
      answer: "我先確認每列是一件工作，權重順序和特徵欄一致，再預測每件工作只出一個分數。最後手算一列；光看程式沒報錯，抓不到兩欄語意互換。"
  - id: "ai-ml-matmul-inner"
    prompt: "矩陣相乘時，哪兩個維度必須相同？"
    answer: "左矩陣的欄數與右矩陣的列數必須相同，對應項相乘後加總。"
    mcq:
      question: "（3，2）乘（2，1）的輸出形狀為何？"
      options:
        - "（3，1）"
        - "（2，2）"
        - "（1，3）"
        - "（3，2）"
      answer: 0
      explain: "共同的特徵維度被加總，剩下樣本列與輸出欄。"
  - id: "ai-ml-dtype-role"
    prompt: "dtype 告訴你什麼，而 shape 沒有告訴你？"
    answer: "dtype 描述元素的數值表示方式，shape 只描述每個軸的長度。"
    mcq:
      question: "兩個形狀相容的矩陣仍不能相乘，應再核對什麼？"
      options:
        - "變數名稱是否等長"
        - "檔案副檔名是否相同"
        - "列印的小數位數"
        - "運算要求的資料型別"
      answer: 3
      explain: "矩陣乘法還受型別要求約束，列印樣式不影響儲存型別。"
practice:
  - id: "ai-ml-01-tensor-p1"
    title: "保存迷你批次驗算單"
    kind: "code"
    minutes: 10
    steps:
      - "執行 tensors.py 並在 tensor-check.md 抄下形狀、型別與 3 筆分數"
      - "新增一列讀 2 寫 1，先手算再重跑"
      - "在筆記標示哪個軸增加"
    checks:
      - "原始分數依序為 8、6、12"
      - "新增列得到 7，輸出改為 4 列 1 欄"
---

## 為什麼要學：模型看見的是數字擺在哪裡
一批工作送進排程系統，你替每件工作記下「要讀幾個檔案」和「要寫幾個檔案」。人一眼就能看出哪列是哪件工作；模型只看見排好的數值，不知道第一欄是讀還是寫。張量（tensor）是按軸排列、用同一種資料型別存放數值的容器。比起先背運算名稱，更有用的第一步是說清楚每個軸的意思，然後預測算完會剩幾個數。

## 核心概念：在數字旁寫上單位
形狀（shape）列出每個軸有多長。把 3 件工作放在列、2 種特徵放在欄，形狀就是「3 筆乘以 2 個特徵」。一次拿來運算的一小組樣本叫迷你批次（mini-batch）。資料型別（dtype）則說明每個元素用整數還是浮點數等方式表示。工作件數雖然可用整數記錄，與浮點權重相乘前要安排相容的型別；不要等看到錯誤才把所有東西亂轉一遍。

假設每讀一檔算 2 分、每寫一檔算 3 分。權重排成 2 列 1 欄，讓權重的列與輸入的特徵欄一一對應。矩陣乘法（matrix multiplication）用 `@` 表示：取輸入的一列，各欄與對應權重相乘，再把乘積加起來。內側的 2 要對上，外側的 3 和 1 決定結果形狀。這裡的分數來自人指定的規則，還沒有讓模型學習。

## 範例：先用鉛筆，再讓電腦驗算
這次的 PyTorch 要裝到練習專案自己的虛擬環境（virtual environment），不是開新視窗就自動隔離。想先練習辨認直譯器，可回到[〈venv 與 pip 隔離環境〉](#/lesson/fd-python-tools-01-env)。

在 `C:\dev\stackway-lab` 建立 `ml-notes`，在該資料夾執行 `py -m venv .venv` 建立虛擬環境。依延伸資源的本機安裝選擇器選 Windows、Pip 和 CPU，將其安裝指令的 `pip` 或 `pip3` 換成 `.\.venv\Scripts\python.exe -m pip`，其餘選項照頁面。請選擇該頁支援的 Python，不需設定顯示卡。macOS/Linux 用 `python3 -m venv .venv`，以 `.venv/bin/python -m pip` 安裝適用平台的版本。

將下列程式存為同目錄的 `tensors.py`。以 PowerShell 執行 `.\.venv\Scripts\python.exe tensors.py`；bash 用 `.venv/bin/python tensors.py`。後續使用 PyTorch 的練習都沿用這個環境。
```python
import torch
x = torch.tensor([[1, 2], [3, 0], [0, 4]], dtype=torch.float32)
w = torch.tensor([[2], [3]], dtype=torch.float32)
score = x @ w
print(tuple(x.shape), x.dtype, tuple(score.shape))
print(score.tolist())
```
第一件工作的分數是 1 乘 2 加 2 乘 3，得到 8；其餘為 6 和 12。每件工作保有自己的位置，沒有把不同工作的特徵加在一起。若把權重換成一維向量，數值可能看似相同，輸出卻少了最後的單位軸；後續程式若需要每列一欄，兩種形狀不能任意互換。

### 如果檔案的欄位順序改了
假設新的表格先列寫入、再列讀取，但你照舊把第一欄乘以讀取權重。這時輸入形狀不變，型別也相同，連矩陣乘法的結果都有正確的列數；只有拿回原始工作逐筆核對，才會發現第一件工作的意義被對調。把欄名跟形狀一起記下，比只抄兩個數字更有用。

## 常見錯誤
看到兩個軸都等長，就誤以為排列方式一定正確。交換特徵欄與權重順序時，只換其中一邊會算出不同意義的分數，程式未必報錯。此外，逐元素相乘不會自動完成同一列的加總；算矩陣乘法時要確認你用的是哪個運算子。

## 小結
每次進行運算前，先寫「軸的意義、形狀、型別」，最後挑一列手算。數值與形狀都對得上，才算真正看懂這批資料。
