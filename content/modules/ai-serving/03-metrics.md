---
id: ai-serving-03-metrics
module: ai-serving
order: 3
title: TTFT、TPOT 與吞吐量
subtitle: 快收到第一個字不一定快收完
status: ready
minutes: 35
level: 4
prereqs:
  - ai-serving-01-baseline
objectives:
  - 沿串流時間戳分別計算首詞元延遲與後續平均每詞時間
  - 固定輸出長度與並行度，比較每秒詞元與每秒請求
tags:
  - serving
  - metrics
resources:
  - title: NVIDIA NIM：串流延遲與吞吐量
    url: https://docs.nvidia.com/nim/benchmarking/llm/metrics
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: vLLM：服務基準的輸入與負載參數
    url: https://docs.vllm.ai/en/stable/cli/bench/serve/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-03-metrics-first
    prompt: 收到空的串流角色欄位時，能停止首詞計時嗎？
    answer: 不能，應等到首個有內容的詞元。
    mcq:
      options:
        - 可以，首個 HTTP 標頭就是第一詞
        - 要等第一個完整句子才停止計時
        - 以最後詞元到達時刻作為首詞時刻
        - 不能，應等到首個有內容的詞元
      answer: 3
      explain: 首詞量的是讀者等到內容的時間，不是握手耗時。
  - id: ai-serving-03-metrics-gap
    prompt: 4 個詞元從首詞到末詞相隔 600 毫秒，TPOT 是多少？
    answer: 200 毫秒。
    mcq:
      options:
        - 200 毫秒
        - 150 毫秒
        - 600 毫秒
        - 無法計算，必須知道送出時刻
      answer: 0
      explain: 4 個詞之間有 3 個間隔；首詞之前的等待不在這段。
  - id: ai-serving-03-metrics-span
    prompt: 同時送出的請求，系統輸出吞吐量的分母怎麼選？
    answer: 同一批請求的實際觀測秒數。
    mcq:
      options:
        - 各請求耗時相加
        - 同一批請求的實際觀測秒數
        - 只加每筆首詞後的生成時間
        - 把觀測秒數乘以同時連線數
      answer: 1
      explain: 重疊的時間只走過一次，不能依連線重算。
    interview:
      question: 首詞很快但讀者仍覺得慢，你怎麼驗證？
      points:
        - 拆出後續間隔
        - 核對輸出長度
        - 區別單筆與整窗
      answer: 我會先找同長度回答的首末詞時間，看看是不是後續每詞間隔拉長，也檢查事件是否被緩衝在一起。服務總吞吐高，不足以推翻單筆卡頓。
  - id: ai-serving-03-metrics-single
    prompt: 只有 1 個輸出詞元時，為什麼仍有 TTFT 卻沒有 TPOT？
    answer: 送出到第一詞仍有時間差，但沒有任何相鄰輸出詞元的間隔；應記不適用，而不是 0 毫秒。
practice:
  - id: ai-serving-03-metrics-p1
    title: 替兩條串流加上單位
    minutes: 12
    kind: code
    steps:
      - 儲存腳本與 2 筆指標，在紙上標出首末詞
      - 將第二筆縮成 1 詞重算並在紀錄中解釋分母
    checks:
      - 原始 2 筆 TTFT 為 100、400 毫秒，TPOT 為 200、100 毫秒
      - 單詞時 TPOT 顯示 None
---
## 為什麼要學：等開頭與等下文
2 段回答都花了 1 秒。第一段立刻顯示開頭，之後慢慢補字；第二段直到最後才一口氣出現。總時間相同，對正在看畫面的人卻很不一樣。這堂要把串流（streaming）的時間軸剪成可解釋的幾段，再把單筆體感和整台服務的產量分開。

## 核心概念：分子、分母和時鐘
首詞元延遲（time to first token，TTFT）從用戶端送出請求量到收到第一個非空的輸出詞元。剛連上、收到標頭或只收到角色資訊都不算。這個值可能包含傳輸、排隊和處理提示的時間，不是只在量顯示卡。若要拆出排隊，還需要同一筆請求在伺服器的事件紀錄。

後續平均每詞時間（time per output token，TPOT）在本課定義為最後詞元時刻減第一詞元時刻，再除以輸出數減 1。從第一詞到第四詞之間只有 3 個間隔。只有 1 個詞時分母為 0，填不適用，不能填 0 毫秒讓它拉低平均。不同工具可能採最後回應事件而非最後詞元；比較前先對齊端點定義。

## 範例：同一時窗的 2 條串流
開啟 `C:\dev\stackway-lab\serving`，將範例另存為 `stream_metrics.py`。在每筆時間線上標出第一個和最後一個詞元。只有 1 個詞元的那筆，仍能量哪種延遲？

在該目錄執行：Windows PowerShell 用 `py stream_metrics.py`；macOS／Linux 用 `python3 stream_metrics.py`。

```python
traces = [(0, [100, 300, 500, 700]), (0, [400, 500, 600, 700])]
for sent, t in traces:
    print("TTFT_ms", t[0]-sent, "TPOT_ms",
          (t[-1]-t[0])/(len(t)-1) if len(t)>1 else None)
span = (max(t[-1] for _, t in traces)-min(s for s, _ in traces))/1000
print("tok/s, req/s", round(sum(len(t) for _, t in traces)/span, 2),
      round(len(traces)/span, 2))
```

例子假定每個時間戳恰好對應 1 個詞元，時鐘單位是毫秒，2 筆同時送出。請先遮住最後一行，猜哪筆比較早開始、哪筆開始後比較順。2 筆都輸出 4 詞，所以可以把同一個觀測窗內的 8 詞除以秒數，也可以把 2 筆完成的請求除以秒數。詞元吞吐量與請求吞吐量（throughput）分別回答產出多少文字、完成多少件工作。

### 只改一個時間戳，指標會怎麼動？
先在紙上把第一筆的第一個有效詞元向後移 100 毫秒，保持送出時刻、末詞時刻與輸出數不變。讀者等開頭比較久，首詞元延遲上升；後續時間被壓短，平均每詞時間反而下降。整批完成時刻和產量都沒變，兩種吞吐就都不變。這個反例說明三個量不能互相替代：後續數字變漂亮，甚至可能只是起點移晚，而非系統做完同樣工作比較快。

## 常見錯誤
如果一次網路事件包了好幾個詞元，事件數就不是詞元數；沒有逐詞時間戳時，不要假造每個間隔。可以記首個有內容的事件、最後有內容的事件與服務回報的實收詞元數，並說明這是近似。比較兩台服務時，同時固定輸入、輸出分布和並行度，否則產量可能只因其中一邊回答特別長而上升。

## 小結
報告依序寫首詞、後續、整窗產量。有人說「每秒 20 詞」時，先問是單一使用者看到的生成速度，還是所有連線加總。把同時發生的請求時間相加會重算重疊區段，這正是算對單筆卻算錯服務吞吐的常見原因。
