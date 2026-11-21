---
id: ai-design-02-capacity
module: ai-design
order: 2
title: 詞元流量與容量設計
subtitle: 從 token 流量估算服務容量
status: ready
minutes: 30
level: 3
prereqs:
  - ai-design-01-contract
objectives:
  - 以需求分布估算尖峰吞吐與快取空間
  - 標出必須靠實測而非猜測的參數
tags:
  - design
  - capacity
resources:
  - title: Transformers：鍵值快取與記憶體取捨
    url: https://huggingface.co/docs/transformers/en/kv_cache
    kind: doc
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
  - title: vLLM：線上服務基準測試的輸入與指標
    url: https://docs.vllm.ai/en/stable/cli/bench/serve/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-design-02-capacity-mix
    prompt: 每秒 3 筆各 200 個輸入詞元，加上每秒 1 筆 2000 個，入口需要多少？
    answer: 每秒 2600 個輸入詞元；先依各組到達率加權。
    mcq:
      options:
        - 2200 個詞元／秒
        - 650 個詞元／秒
        - 2600 個詞元／秒
        - 4 個詞元／秒
      answer: 2
      explain: 650 是平均每筆長度，4 是每秒請求數，兩者都還不是詞元流量。
  - id: ai-design-02-capacity-resident
    prompt: 估算某瞬間的全長 KV 快取，先數哪一種詞元？
    answer: 數當下仍常駐且未共享的詞元，再乘每詞元儲存量。
    mcq:
      options:
        - 全天所有輸出的詞元
        - 每秒到達的請求數
        - 模型詞彙表的項目數
        - 進行中各序列已保留的詞元
      answer: 3
      explain: 常駐量是存量，不是累計流量；詞彙表大小也不是序列長度。
  - id: ai-design-02-capacity-benchmark
    prompt: 哪種吞吐量適合拿來估卡數？
    answer: 在目標模型、負載分布與延遲限制下量到的可持續吞吐量。
    interview:
      question: 明天長提示的流量倍增，你會先重算什麼，再量什麼？
      points:
        - 分組重算入口與出口
        - 另估同時在場的快取
        - 用混合負載確認延遲與吞吐
      answer: 我會把長組的到達率改掉，保留其他組不動。流量變大不告訴我同時常駐多少詞元，所以我會補抓快照，再重播這個比例，看首詞元和持續輸出是否仍達標。
  - id: ai-design-02-capacity-heads
    prompt: 在全長注意力的 KV 估算中用哪種頭數？
    answer: 用實際儲存鍵和值的鍵值頭數；查詢頭可能更多，但不等於要存更多份鍵值。
    mcq:
      options:
        - 查詢頭數一律相同
        - 鍵值頭數
        - 詞彙表大小
        - 最大同時請求數
      answer: 1
      explain: 頭數決定每個詞元的張量大小；請求數則影響共有多少詞元常駐。
practice:
  - id: ai-design-02-capacity-p1
    title: 製作 2 欄詞元容量表
    kind: code
    minutes: 14
    steps:
      - 保存 capacity.py，把原始與長組倍增後的入口、出口填入 capacity.md。
      - 另列一個 16 條等長常駐序列的快照，寫下公式、單位，以及上線前需實測的參數。
    checks:
      - 2 欄流量分別從 2600、350 變成 4600、550 個詞元／秒。
      - 新快照只把序列數加倍，結果是 2 GiB；表中未將它標為整卡耗用。
---

## 為什麼不能只問每秒幾個請求？
同樣每秒進來 4 個問題，一種只有標題，一種貼了整份報告。按請求數採購會以為 2 天一樣忙。語言模型處理的是詞元 (token)，不是字數，也不是檔案大小；同一句話換斷詞器可能得到不同長度。先用同一個模型的斷詞器量需求，再決定用什麼工作負載測試卡數。

## 分開入口、出口與還留在卡上的內容
預填 (prefill) 讀取輸入，解碼 (decode) 逐步生成輸出。前者影響首詞元時間，後者也影響後續詞元間隔。先把請求按長短分組，每組用「每秒幾筆 × 每筆幾個詞元」算每秒需求，再按階段分別加總。保留長輸入與長輸出是否出現在同一筆的關係；把各欄的高百分位直接相乘，不一定代表真實尖峰。

鍵值快取 (KV cache) 保留進行中序列各層已算過的鍵和值。用傳統全長注意力、各層規格相同、不共享前綴的簡化模型，每個常駐詞元的位元組數是「鍵和值 2 份 × 層數 × 鍵值頭數 × 每頭維度 × 每元素位元組」。這裡用鍵值頭數，不是查詢頭數。先加總同時在場的已保留詞元，再乘單價；已結束且已釋放的請求不必繼續計費。

## 範例：2 種帳不要相除
將 `capacity.py` 存到 `C:\dev\stackway-lab\design`，執行 `py capacity.py`；macOS／Linux 用 `python3 capacity.py`。前兩個輸出是每秒流量，最後一個是某瞬間的快取大小。

```python
groups = [(3, 200, 50), (1, 2000, 200)]
print(sum(rate * inp for rate, inp, out in groups))
print(sum(rate * out for rate, inp, out in groups))
bytes_per_token = 2 * 32 * 8 * 128 * 2
print(8 * 1024 * bytes_per_token / 2**30, "GiB")
```

輸入需求是每秒 2600 個詞元，輸出是 350 個；快照假定同時有 8 條序列各保留 1024 個詞元，快取為 1 GiB。把長組從每秒 1 筆改成 2 筆，入口突然多了 2000，出口只多了 200。快照並沒有跟著改；如果較長的請求留得更久，應另取新的同時在場分布，而不是沿用舊快照。

### 下一張卡值不值得加？
拿相同模型、精度與長短比例，在一種候選配置上逐階增加送入速率。每階記下首詞元、後續間隔、拒絕數與顯示記憶體高水位。只有在延遲目標仍成立時交出的吞吐量，才適合作容量依據。卡上還要放權重、運算暫存與配置區塊，不能拿整卡容量除以剛算出的快取大小。

還可以用單位抓一次錯：把觀察窗從 1 秒拉到 10 秒，總輸入詞元數跟著變成 10 倍，但平均每秒速率不變。某時刻卡上剩多少空間，卻不能用這 10 秒內經手過的總詞元回答；要取當時仍未釋放的序列。

## 常見錯誤
先用短提示跑滿，再宣稱長報告也支援相同人數，漏了工作負載的改變。輸出上限也不等於每筆都會生成那麼長；用上限做保守預留可以，但請標成假設。兩階段會競爭同一組資源，分別量到的最高速率不能當作同時可達。

## 小結
需求表給的是要接下多少工作，快照給的是暫時要放下多少內容；能在指定延遲內完成多少，仍要用同一種混合流量實測。
