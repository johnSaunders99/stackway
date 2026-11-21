---
id: ai-llm-03-phases
module: ai-llm
order: 8
title: 提示處理與逐步解碼
subtitle: 首個詞元為何等待較久
status: ready
minutes: 30
level: 3
prereqs:
  - ai-llm-07-sampling
objectives:
  - 把提示處理與逐步解碼分成兩段
  - 區分首詞元延遲與後續產生速度
tags:
  - llm
  - prefill
resources:
  - title: NVIDIA：推論基準測試概觀
    url: https://docs.nvidia.com/nim/benchmarking/llm/overview
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: 從請求條件看延遲與吞吐量。
  - title: NVIDIA：語言模型推論指標
    url: https://docs.nvidia.com/nim/benchmarking/llm/metrics
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: 核對首個詞元與後續間隔的起訖點。
concepts:
  - id: ai-llm-prefill-boundary
    prompt: 第一個輸出詞元怎麼來，為什麼不必先做一連串解碼？
    answer: 已知提示經提示處理得到最後位置分數，可以直接選第一個新詞元；後續才依新詞逐步推進。
    mcq:
      question: 只變長提示、要求同樣長的輸出，首先直接改變哪段工作量？
      options:
        - 讀取已知輸入的提示處理
        - 要求產出的步數
        - 固定每次輸出 1 個詞元時的單步產量
        - 要求返回的串流事件數（每詞元一事件）
      answer: 0
      explain: 已知輸入變多直接增加提示處理量；後續每步讀的歷史也可能受影響，但所需輸出步數未變。
    interview:
      question: 總耗時增加，但回覆開始後仍很順。你如何量出差異？
      points:
        - 同一時鐘記送出與第一詞
        - 分開後續間隔
        - 不能單憑 TTFT 指認模型
      answer: 我會留下送出、首詞與後續抵達時間。如果間隔沒變，就去看服務端的進隊和出隊時間，確認是排隊還是提示處理，而不先調解碼。
  - id: ai-llm-ttft-clock
    prompt: 使用者端的首詞元延遲從哪裡量到哪裡？
    answer: 從送出請求到收到第一個有內容的詞元，包含沿途等待。
    mcq:
      question: 送出後排隊 180 毫秒，再過 60 毫秒收到第一個詞元，TTFT 是多少？
      options:
        - 60 毫秒
        - 240 毫秒
        - 180 毫秒
        - 120 毫秒
      answer: 1
      explain: 使用者在排隊時也在等，不能只算模型工作的部分。
  - id: ai-llm-gap-count
    prompt: 4 個輸出詞元有幾個後續間隔？
    answer: 有 3 個相鄰間隔，首詞元延遲要另算。
  - id: ai-llm-stream-chunk
    prompt: 串流片段能否一律當成單一詞元來量間隔？
    answer: 不能。一個片段可能沒有內容或含多個詞元；無逐詞時間時只能報片段間隔。
    mcq:
      question: 每個非空片段可能含 1 至 4 個詞元，用戶端只存片段抵達時刻。能直接報哪項？
      options:
        - 每個詞元的精確生成時刻
        - 服務端純解碼耗時
        - 每次合批的大小
        - 相鄰非空片段的抵達間隔
      answer: 3
      explain: 片段邊界可觀測，片段內的每詞元時刻無法從這份紀錄還原。
practice:
  - id: ai-llm-08-lab
    title: 交一張串流時間收據
    kind: code
    minutes: 10
    steps:
      - 把範例時間點與間隔抄成 stream-notes.txt
      - 將每個抵達時間一起往後移 100 毫秒，再算一次
    checks:
      - 原本首詞 240 毫秒，後續平均 40 毫秒
      - 整串後移只讓 TTFT 增加 100 毫秒
---

## 為什麼要學

服務改版後，第一個字晚了半秒出現，之後文字卻仍順順地往外跑。如果只拿整段回答的字數除以總秒數，會以為生成每一步都變慢。使用者其實經歷兩段不同的等待，第一段連「開始回答」都看不到，第二段才是已經開始以後的流暢感。

## 提示能一起讀，未來的詞卻得等

提示處理（prefill）讀入已知的詞元序列。已經知道整段輸入，就能在同一層並行處理不同位置，同時維持只能看前綴的因果規則。最後位置的輸出用來選第一個新詞元。逐步解碼（decode）則用選好的新詞推進下一步；第二個新詞尚未選出以前，不能把它當成已知輸入先算第三個。不同請求可交錯服務，單一請求仍有這條前後依賴。

使用者端的首詞元延遲（time to first token，TTFT）從送出請求量到收到第一個有內容的詞元。它也包含排隊、傳輸、分詞等成本，不等於提示處理花費。後續的詞元間隔（inter-token latency，ITL）看相鄰輸出之間相隔多久。要報平均，第一個到最後一個之間有 N 減 1 段，不是 N 段。

## 範例：把一條串流拆成 2 段
這裡量一次請求的開始與後續間隔。多筆請求一起出現時，延遲和整體輸出速率要分開算，見[〈TTFT、TPOT 與吞吐量〉](#/lesson/ai-serving-03-metrics)。


這是合成的用戶端時間戳記，單位是毫秒，假設每次事件恰好帶一個詞元。第一筆事件不是請求送出的時刻。分別計算首詞元延遲與後續間隔，並用總時間反算一次作核對。

在時間線標記「送出、收到第一個有效詞元、收到最後詞元」。每段等待該從哪個標記起算？把下面的範例存成 `C:\dev\stackway-lab\llm` 裡的 `stream_clock.py`。

在該目錄執行：Windows PowerShell 用 `py stream_clock.py`；macOS／Linux 用 `python3 stream_clock.py`。

```python
sent = 1000
arrivals = [1240, 1280, 1310, 1360]
gaps = [b - a for a, b in zip(arrivals, arrivals[1:])]
ttft = arrivals[0] - sent
print("first_ms", ttft, "gaps_ms", gaps)
print("mean_gap_ms", sum(gaps) / len(gaps) if gaps else None)
assert ttft + sum(gaps) == arrivals[-1] - sent
```

假設另一個端點不串流，要到最後才一次傳回答案。此時用戶端能看到的是整段回答完成時間，不能從這一筆資料硬拆出內部第一個詞元或解碼間隔。若要比較兩個端點，先選兩邊都能觀察的邊界，或在服務端補上相同事件。

### 讓 2 個瓶頸各留下一個指紋

將提示換成較長的文件、限定仍然只答幾個詞元，是觀察提示處理的對照；把提示固定、觀察更長回答的後續間隔，則較能看出解碼過程的變化。兩組都要記服務是否同時處理別的請求，因為他人進隊也可能讓第一段變長。

若手邊只有一筆用戶端資料，不妨先把你「看不到」的界線畫成虛線：看不到何時出隊，就不能用首詞元時間直接減出模型時間。這樣的紀錄比虛構一個精確分段更有用，因為它指出下一次應補的事件。

## 常見錯誤

有些串流先回狀態或空片段，不應算作第一個有內容的輸出。也別把一次網路傳來的片段直接等同一個詞元：一個封包可能合併數個詞元。若只有片段時間戳記，就誠實標成片段間隔；只有 1 個輸出詞元時，後續平均根本沒有定義。

## 小結

用兩把尺回答兩個問題：多久開始回答、開始後等多久才有下一個詞元。若只有第一把尺惡化，先分開查排隊與提示處理，別用改善解碼速度來代替診斷。
