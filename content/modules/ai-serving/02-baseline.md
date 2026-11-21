---
id: ai-serving-01-baseline
module: ai-serving
order: 2
title: 推論基準與暖機
subtitle: 記下第一組能重跑的基準
status: ready
minutes: 30
level: 3
prereqs:
  - ai-serving-01-vllm
objectives:
  - 固定模型版本、輸入長度、裝置與暖機條件
  - 分別記錄首個詞元 延遲與每秒輸出量
tags:
  - serving
  - baseline
resources:
  - title: vLLM：服務基準的輸入與負載參數
    url: https://docs.vllm.ai/en/stable/cli/bench/serve/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: NVIDIA NIM：串流延遲與吞吐量
    url: https://docs.nvidia.com/nim/benchmarking/llm/metrics
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-01-baseline-warm
    prompt: 比較暖態服務時，暖機樣本怎麼處理？
    answer: 先定規則，另列不混入正式樣本。
    mcq:
      options:
        - 先量全部，再把每輪最慢的一筆當作暖機
        - 兩組各自挑表現最穩定的一筆比較
        - 先定規則，另列不混入正式樣本
        - 將第一次載入時間平均分攤到所有正式請求
      answer: 2
      explain: 排除規則要在看到結果前決定；冷態成本也值得單獨記錄。
  - id: ai-serving-01-baseline-length
    prompt: 為何保留實收詞元數而不只記上限？
    answer: 遇到停止條件可能提早結束。
    mcq:
      options:
        - 輸出上限必定等於本次產量
        - 兩次提示字數相同就能推出實際輸出長度
        - 每個串流事件必定恰好等於一個詞元
        - 遇到停止條件可能提早結束
      answer: 3
      explain: 上限不是承諾，算輸出吞吐要用實際產量。
  - id: ai-serving-01-baseline-window
    prompt: 正式段連續 2.5 秒產出 50 個詞元，整段輸出速率是多少？
    answer: 20 詞元／秒。
    mcq:
      options:
        - 20 詞元／秒
        - 50 詞元／秒
        - 125 詞元／秒
        - 0.05 詞元／秒
      answer: 0
      explain: 看總產量除以觀測時間；倒數是每詞元的秒數。
    interview:
      question: 兩張測速報表差很多，你會先比對什麼？
      points:
        - 固定版本與裝置
        - 核對工作負載
        - 區隔冷暖樣本
      answer: 我先對模型修訂、提示長度、實收輸出和並行度，再看是不是一邊把載入也算進去。若條件不同，我會重做一組配對測試，不會先把差額歸給引擎。
  - id: ai-serving-01-baseline-contract
    prompt: 這次比上次快，但輸出都提早結束，能說引擎加速嗎？
    answer: 不能。先核對停止條件、實收長度與負載，再用同一批工作比較；上限相同不保證實際做了相同工作。
practice:
  - id: ai-serving-01-baseline-p1
    title: 寫一張可重跑的基準卡
    minutes: 10
    kind: code
    steps:
      - 將腳本與 baseline-notes.txt 放在一起
      - 在卡上分列模型、裝置、版本、輸入輸出、暖機規則和兩筆正式結果，未量項填未量
    checks:
      - 首詞欄是 300 與 500 毫秒
      - 正式段是 20 詞元／秒，暖機不混算
---
## 為什麼要學：快了，是哪裡快？
昨天模型等很久才吐字，今天再問一次卻很順。這可能是改善，也可能只是模型已經載入。基準（baseline）是一組能重做的條件和結果，不是一個最快紀錄。要證明換設定有用，先讓另一個人光看紀錄就知道該載入什麼、送哪些提示、從哪個時刻開始算。

## 核心概念：先寫實驗契約
固定模型與詞元化器（tokenizer）的版本、引擎版本、裝置型號和數量、資料型別、請求並行數。保留輸入文本或可重建的產生規則，記下切詞後的實際長度、輸出上限、停止條件與實收詞元數。相同中文字數可能切成不同長度；同樣上限也可能提早停止。少記這些，下一輪很容易變成不同工作。

暖機（warm-up）是在正式計時前，讓指定形狀的輸入走過推論路徑。程序啟動、載入權重、第一次編譯與後續執行不是同一段成本。若問題是使用者早晨第一次開啟有多慢，就另外報冷啟動；若問題是營運中的服務能接多少流量，就在相同暖機條件下比較。不能等看到慢數字之後才把它叫作暖機。

## 範例：把暖機和正式樣本拆開
先標出哪段要暖機、哪段才列入比較。不先劃清界線，同一份資料也能算出互相矛盾的速率。把下面的範例存成 `C:\dev\stackway-lab\serving` 裡的 `baseline.py`。

在該目錄執行：Windows PowerShell 用 `py baseline.py`；macOS／Linux 用 `python3 baseline.py`。

```python
rows = [("warmup", 1.0, 3.0, 20), ("measure", .3, 1.0, 20),
        ("measure", .5, 1.5, 30)]
sample = [r for r in rows if r[0] == "measure"]
print("TTFT_ms", [round(first * 1000) for _, first, _, _ in sample])
print("output_tok/s", sum(r[3] for r in sample) / sum(r[2] for r in sample))
```

這份資料來自人造時間線；時間都是同一用戶端量到的相對秒數。每列代表一筆請求，依序送出且沒有空檔。首詞元延遲（time to first token）取送出到第一個有效詞元；整段輸出速率取正式段產出的總詞元除以正式觀測秒數。它包含這段期間的等待，不是模型吐出相鄰兩詞的瞬間速度。之後在[〈TTFT、TPOT 與吞吐量〉](#/lesson/ai-serving-03-metrics)會細講。

### 同樣條件不等於重複同一句話
設想服務將相同開頭保留在快取。若暖機與正式段總用同一段提示，量到的可能是重複前綴的速度；真實使用者若大多問新問題，這份基準便不具代表性。可事先做兩份題單，一份共用開頭，一份長度相同但內容不同，各自固定順序並重跑。如此即使結果差很多，也能指出是哪種使用方式得益，而非把差異全歸給暖機。

## 常見錯誤
同時改成短提示、換卡、又打開快取，即使變快也無法歸因。比較前先圈出唯一要改的欄位；若要測提示重用，應明訂是否允許相同前綴的快取命中。只抄平均值也會掩蓋偶發停頓，保留逐筆數字及失敗次數。中途超時不是特別快地結束，不能當成成功的短回答。

## 小結
這裡只有兩筆正式樣本，足夠檢查算式，不足以宣稱服務穩定。實機報告應註明負載、測試次數與波動，再交出冷、暖兩欄。若下一輪的模型修訂版或輸入形狀對不上，就保留它作另一組基準，不要硬算改善百分比。
