---
id: ai-llm-05-budget
module: ai-llm
order: 10
title: 推論工作負載設計
subtitle: 先定義一組公平的請求
status: ready
minutes: 35
level: 3
prereqs:
  - ai-llm-04-kv
objectives:
  - 固定提示與輸出長度分布
  - 區分模型速度與排隊造成的延遲
tags:
  - llm
  - workload
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
  - id: ai-llm-load-pair
    prompt: 公平比較推論引擎時，為何不只固定平均輸入長度？
    answer: 長短請求的配對、輸出長度與抵達節奏會改變工作量與排隊，應重播同一份逐筆清單。
    mcq:
      question: 要比較兩個引擎，同時控制工作量，哪份輸入最合適？
      options:
        - 各自挑相同數量的熱門題
        - 讓兩組只有平均字數相同
        - 相同提示、輸出條件與抵達時刻的清單
        - 取各自最快的 10 筆成功例
      answer: 2
      explain: 相同筆數或平均字數不能保證詞元、長短混合及到達壓力一致。
    interview:
      question: 新引擎的總延遲上升，要怎麼判斷是否真的算得更慢？
      points:
        - 固定輸入輸出與到達方式
        - 分離等待與服務
        - 保留完成及失敗分母
      answer: 我會重播同一張考卷，逐筆比開始服務到完成。如果這段不變而排隊變長，就先查接單能力和排程；逾時的請求也保留，不只算成功樣本。
  - id: ai-llm-queue-split
    prompt: 如何從抵達、開始與完成時刻分出等待與服務？
    answer: 開始減抵達是等待，完成減開始是服務；三者須為可比較的時間邊界。
    mcq:
      question: 抵達 2、開始 26、完成 34 毫秒，服務花多久？
      options:
        - 24 毫秒
        - 32 毫秒
        - 34 毫秒
        - 8 毫秒
      answer: 3
      explain: 24 是排隊，32 是總延遲，服務只佔末段。
  - id: ai-llm-output-cap
    prompt: 兩組都設相同輸出上限，為什麼仍要記實際詞元數？
    answer: 部分回答會提前結束，解碼步數與實際產量可能不同。
practice:
  - id: ai-llm-10-lab
    title: 留下可重播的迷你考卷
    kind: code
    minutes: 12
    steps:
      - 將兩輪輸出存為 load-notes.txt，標上抵達、輸入、輸出、等待、工作、總時間
      - 用最後一筆驗算 2 段加總
    checks:
      - 兩輪工作時間都是 8、18、8
      - 密集組最後一筆等 24、工作 8，總延遲 32 毫秒
---

## 為什麼要學

甲服務回答「是」只花半秒，乙服務摘要一段長文件要 2 秒。這組資料不能拿來決定要換哪個模型伺服器，因為被比較的工作根本不同。工作負載（workload）是一份可重播的考卷：每筆帶多少輸入、要多少輸出、什麼時候抵達，都先寫好；測試者不應在看到結果後才挑題。

## 固定考卷，把排隊拆出來

輸入長度影響提示處理，已產生的長度也影響後續解碼與快取。只有平均長度不夠：全是中等請求與少數特長文件混合短問題，可能有相同平均值，卻讓短問題在長文件後面等很久。每筆應保存輸入與輸出長度的配對，以及到達順序與間距。輸出上限不是實際輸出長度；遇到提前停止要另外記。

選定量測邊界後，為每筆記抵達、開始服務與完成的時間。開始減抵達是佇列等待（queue wait）；完成減開始是這個服務階段的耗時。2 段之和才是這個邊界內的總延遲。下例只准一個工作者逐筆服務，工作中途不搶占，沒有網路成本。真實服務可能合批交錯，不應把這個簡化模型當 GPU 效能公式。

## 範例：同一套服務突然塞車

用輸入與輸出長度算一個人為的服務毫秒數；對兩份完全相同的題目只改抵達間距。把每筆的等待與工作時間都印出來，比較哪一欄固定、哪一欄改變。

在 `C:\dev\stackway-lab\llm` 新建 `replay_load.py`。先把輸入長度、預期輸出與請求到達方式寫清楚。同一個平均長度並不保證兩批請求有相同負載。

在該目錄執行：Windows PowerShell 用 `py replay_load.py`；macOS／Linux 用 `python3 replay_load.py`。

```python
sizes = [(4, 2), (12, 3), (4, 2)]
def replay(arrivals):
    free = 0
    for t, (inp, out) in zip(arrivals, sizes):
        start = max(t, free)
        work = inp + 2 * out
        free = start + work
        print(t, inp, out, start - t, work, free - t)

replay([0, 30, 60])
replay([0, 1, 2])
```

若把密集組中間那筆較長的題目移到最後，資料總量一樣，短題經歷的等待卻會不同。這就是保留原始順序的理由。若研究問題刻意要測不同排序，應另列一組實驗，別和更換引擎的結果混在同一欄。

### 由慢的那筆反推交付時刻

在密集組裡，第一筆從 0 做到 8。第二筆雖在 1 就到，仍要等到 8 才開工，做到 26。第三筆在 2 抵達，要等到 26 才輪到它。假如你只記每個人從進門到出門的時間，第三筆會看起來比第一筆慢了許多；但工作者真正替 2 筆做事的時間完全相同。

把這組例子寫成測試約定時，也要決定請求怎麼送：到了指定時刻就送，還是一定等上一筆完成才送？後者在服務變慢時會自動放慢出題速度，可能把你本來要觀察的排隊壓力藏起來。

## 常見錯誤

只比較成功返回的請求會藏起逾時，丟掉跑得慢的樣本也會使結果失真。請同時記送出數、完成數、失敗與測試視窗。吞吐量（throughput）要說清楚是每秒完成請求、輸入詞元或輸出詞元；它也不等於單一使用者第一個詞元的等待。

## 小結

留給下一位工程師的不是一句「乙比較快」，而是一份可重跑的考卷及判準。先看同負載下的排隊、服務及失敗，再決定應查算力、調容量，還是改變請求的到達節奏。
