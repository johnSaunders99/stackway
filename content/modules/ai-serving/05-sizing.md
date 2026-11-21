---
id: ai-serving-05-sizing
module: ai-serving
order: 5
title: KV 快取容量估算
subtitle: 1000 個位置要留多少顯示記憶體
status: ready
minutes: 35
level: 4
prereqs:
  - ai-serving-02-batching
objectives:
  - 用層數、KV 頭數、頭維度、詞元數與元素位元組推算 K 和 V 容量
  - 區分有效內容、配置浪費與模型權重
tags:
  - serving
  - sizing
resources:
  - title: Transformers：鍵值快取策略
    url: https://huggingface.co/docs/transformers/main/en/kv_cache
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: vLLM：原始分頁注意力設計（歷史說明）
    url: https://docs.vllm.ai/en/stable/design/paged_attention/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-05-sizing-factor
    prompt: 每個位置的公式為什麼要乘 2？
    answer: 分別存鍵與值。
    mcq:
      options:
        - 為了同時計入查詢與鍵，略過值
        - 分別存鍵與值
        - 為了同時預留輸入詞與輸出詞各 1 份
        - 因為每個請求一定要同時放在 2 張卡
      answer: 1
      explain: 鍵和值是 2 份陣列；元素大小另外計。
  - id: ai-serving-05-sizing-heads
    prompt: 分組查詢注意力應用哪個頭數估 KV？
    answer: 實際保留的鍵值頭數。
    mcq:
      options:
        - 查詢頭數，即使多個查詢頭共用鍵值也照算
        - 先將全部注意力頭除以層數
        - 實際保留的鍵值頭數
        - 只用頭維度，不用計算任何頭數
      answer: 2
      explain: 多個查詢頭可共用鍵值；不能依查詢數重算快取。
  - id: ai-serving-05-sizing-round
    prompt: 為何區塊配置要先對每筆長度分別進位？
    answer: 不同請求的未滿尾塊不一定能合用。
    mcq:
      options:
        - 因為每個詞元都要向上進位成一整塊
        - 因為進位可以把尾塊內所有空格算成有效詞元
        - 因為模型權重也跟著每筆序列長度進位
        - 不同請求的未滿尾塊不一定能合用
      answer: 3
      explain: 例中有效 1,024 格，配置 1,040 格，差額要按請求計。
    interview:
      question: 同事用模型檔大小估最大並行數，你會加哪幾筆帳？
      points:
        - 區分權重與快取
        - 由頭數與長度算有效量
        - 加配置與工作空間
      answer: 我會先問每條序列保留多少位置、實際鍵值頭和快取型別。逐筆進位後才加回權重及執行空間，再以尖峰負載確認，不能從權重檔直接推出並行上限。
  - id: ai-serving-05-sizing-ledger
    prompt: 有效快取量和已配置快取量差在哪裡？
    answer: 有效量只計仍要讀的詞元位置；配置量還包含各請求未填滿的尾塊。兩者都不含模型權重。
practice:
  - id: ai-serving-05-sizing-p1
    title: 留下可換長度的容量試算
    minutes: 12
    kind: code
    steps:
      - 儲存腳本與結果
      - 把 2 筆長度改成 512、512，再算有效量和尾塊差額
    checks:
      - 原始輸出為 128、130、2 MiB
      - 改成等長後有效量不變，尾塊差額為 0
---
## 為什麼要學：同一個模型為何第 2 筆就放不下？
模型能載入，只代表權重有地方放。多一段對話，就得替那段對話留解碼狀態。鍵值快取（key-value cache，KV cache）保留舊位置的鍵和值，讓模型生成下一詞時不用把前文重新轉換一次。要回答「還能接幾筆」，應把不隨請求複製的權重和隨著有效序列變長的快取分兩欄。

## 核心概念：從單一位置開始數
先假設每層都有完整因果注意力、所有層形狀相同、沒有跨請求共享，且都留在同一裝置。一個詞元在一層留下 2 份陣列：鍵與值。每份陣列有若干個鍵值頭（KV head），每個頭有固定維度，每個元素再依資料型別佔若干位元組。這樣逐層乘回去，比硬背一個不帶單位的常數可靠，也方便別人逐欄核算。

每位置位元組數等於「2 × 層數 × 鍵值頭數 × 頭維度 × 每元素位元組」。再乘所有存活請求保留的詞元總數，包括已處理的提示與已生成且已快取的位置。查詢頭（query head）可能比鍵值頭多，尤其在分組查詢注意力中；快取的不是查詢，不能用查詢頭數直接代替。

## 範例：2 條序列合計保留 1,024 個位置
先對齊每詞元要用的位元組和可用記憶體，再談能接幾筆。模型權重已占的容量不能再分給快取。把下面的範例存成 `C:\dev\stackway-lab\serving` 裡的 `kv_budget.py`。

在該目錄執行：Windows PowerShell 用 `py kv_budget.py`；macOS／Linux 用 `python3 kv_budget.py`。

```python
layers, kv_heads, width, element = 32, 8, 128, 2
lengths, block = [1000, 24], 16
per = 2 * layers * kv_heads * width * element
used = sum(lengths)
reserved = sum((n+block-1)//block*block for n in lengths)
print("bytes/position", per)
print("live, reserved, slack (MiB)", *(n*per/2**20 for n in
      (used, reserved, reserved-used)))
```

每位置是 131,072 位元組，也就是 128 KiB。總有效量是 128 MiB。區塊（block）每次保留 16 個位置，2 筆要分開向上取整，不能先把長度相加才取整。2 筆尾端的洞加起來有 16 格，於是配置量比有效量多 2 MiB。兩者的差不是權重變大，而是預留的位置成本。

### 用一格檢查量綱
先別拿長序列驗算。假設只保留一個位置，把層數和鍵值頭數都改為 1，頭維度改為 4，每元素 2 位元組。紙上畫鍵的一排 4 格和值的一排 4 格，合計就是 16 位元組。再把層數加倍，應多一整組相同的格子。這個小檢查能分辨是漏算值陣列，還是把每元素位元組誤當成位元；兩種錯誤放進大模型的算式都會產生一串貌似合理的數字。

## 常見錯誤
把權重精度降低，便直接將快取也除以 2；其實兩者可能使用不同資料型別。若模型採滑動視窗，部分層只留最近一段，就要依層的有效長度分開算。若跨卡切分，也要查哪些頭分散、哪些狀態複製，不能把單卡估算一律除以卡數。這張表是說清楚假設，不是替所有模型背書。

## 小結
規劃時把權重、已配置快取和其他工作空間相加，還要留給執行環境與尖峰。不要以為「剩餘顯示記憶體除以每詞位元組」就是可對外承諾的並行度。先算單位、再看長度分布，下一堂[〈分頁注意力與快取配置〉](#/lesson/ai-serving-03-pages)才有依據決定如何配置及回收實體區塊。
