---
id: ai-serving-03-pages
module: ai-serving
order: 6
title: 分頁注意力與快取配置
subtitle: 快取分頁解決哪種浪費
status: ready
minutes: 35
level: 3
prereqs:
  - ai-serving-05-sizing
objectives:
  - 標示邏輯詞元區塊與實體快取區塊的映射，區分分頁注意力與作業系統換頁
  - 以長短請求模擬配置與回收
  - 分開估算權重與 KV 快取的容量
tags:
  - serving
  - paged-attention
resources:
  - title: vLLM：原始分頁注意力設計（歷史說明）
    url: https://docs.vllm.ai/en/stable/design/paged_attention/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: Transformers：鍵值快取策略
    url: https://huggingface.co/docs/transformers/main/en/kv_cache
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-03-pages-lookup
    prompt: 每塊 4 格，從 0 數的詞元 6 在哪裡？
    answer: 邏輯塊 1、塊內偏移 2。
    mcq:
      options:
        - 邏輯塊 2、塊內偏移 1
        - 實體塊 1、偏移 2，不必讀區塊表
        - 邏輯塊 1、塊內偏移 2
        - 邏輯塊 1、塊內偏移 1
      answer: 2
      explain: 整除找表項，取餘找偏移；實體編號還要查表。
  - id: ai-serving-03-pages-fragment
    prompt: 分頁後哪一種空間仍常未用完？
    answer: 每筆最後一塊的剩餘格。
    mcq:
      options:
        - 每筆一律要保留直到設定上限的連續位置
        - 每次查表都必須多配置一份完整快取
        - 任意兩個實體塊之間都必須預留整塊空間
        - 每筆最後一塊的剩餘格
      answer: 3
      explain: 按固定大小取塊，尾塊可能未填滿。
  - id: ai-serving-03-pages-release
    prompt: 兩筆共用前綴塊，其中一筆結束時該怎麼辦？
    answer: 確認引用都放掉才讓別人覆用。
    mcq:
      options:
        - 確認引用都放掉才讓別人覆用
        - 第一筆結束就回收，不理會其他引用
        - 按實體地址是否連續決定哪些共享塊能回收
        - 等長請求換到下一塊就覆寫它仍會讀的前綴
      answer: 0
      explain: 尚被引用就覆寫，另一筆會讀到不屬於自己的鍵值。
    interview:
      question: 如何證明一個區塊回收器沒有弄亂仍在生成的請求？
      points:
        - 記下存活請求映射
        - 釋放另一筆再重用
        - 回查邏輯位置
      answer: 我會先查長請求跨塊的第一個位置，記住實體編號和偏移，再釋放短請求、配置新請求。長請求要查回原位；若有共享，還要測最後一個引用才回收。
practice:
  - id: ai-serving-03-pages-p1
    title: 追蹤一個跨塊詞元
    minutes: 12
    kind: code
    steps:
      - 儲存腳本與兩張區塊表
      - 圈出被重用的實體塊，另畫長度 5 的有效格與空格
    checks:
      - 新請求重用實體塊 0
      - 長請求的位置 4 仍是實體塊 3、偏移 0
---
## 為什麼要學：記憶體有空，為什麼還要搬？
若每筆對話都要占一整段連續位置，短對話離開後，留下的小洞未必夠下一筆長對話使用。另一種做法是為最大長度一次留好空間，但多數人不會把回答讀到那麼長。分頁注意力（PagedAttention）的出發點，是讓模型看到連續的前文，而實體快取不用跟著排成一條。

## 核心概念：順序在表中，不在地址中
把同一序列從開頭起，每固定數量的詞元切成一個邏輯區塊（logical block）。實體區塊（physical block）來自共用池，每次要再長一塊就從空閒清單拿一塊。每個請求有區塊表，表的第幾項代表它自己的第幾塊，項目裡的編號才指向實體位置。讀第幾詞時，先求整除得到表索引，再用餘數找塊內偏移。

比如每塊 4 格，從 0 編號的位置 4 屬於邏輯塊 1、偏移 0；若表為第三塊接第一塊的實體配置，讀取順序仍以表為準。裝置上的注意力核心依映射讀取鍵值，不是請作業系統把模型頁面換出到硬碟。官方設計頁是早期設計的解說，用來理解此映射，不等於現行每個後端都有相同核心實作。

## 範例：讓一筆短請求把席位還給長請求
開啟 `C:\dev\stackway-lab\serving`，將範例另存為 `page_table.py`。畫一筆請求的邏輯順序，再找每段實際佔用的區塊。位置不相鄰，並不表示詞元的順序亂了。

在該目錄執行：Windows PowerShell 用 `py page_table.py`；macOS／Linux 用 `python3 page_table.py`。

```python
pool, tables = [2, 0, 3, 1], {"long": [], "short": [], "new": []}
def grow(name):
    tables[name].append(pool.pop(0))
grow("long"); grow("short"); grow("long")
print("allocated", tables)
pool = tables.pop("short") + pool
grow("new")
index, offset = divmod(4, 4)
print("after reuse", tables, "token[4]", tables["long"][index], offset)
```

長請求先取得一塊，短請求取得下一塊，長請求成長時只能拿第三塊。短請求結束後，回收的是它表內指向的編號，不是把後面長請求整段搬過來。再讓新請求取一塊，看看物理位置是否重用，以及長請求的第五個詞元是否仍能找回。

### 用 2 張小紙條驗映射
一張紙寫邏輯次序，另一張按實體編號排格子。在每個有效格填上請求代號和詞元位置，先照實體編號讀，再照區塊表讀。前一種可能把新請求插進長句中間，後一種才會還原完整長句。回收時只把短請求畫的格子標為可用，不必抹掉或重排長句；判斷正確的依據是新請求能寫進回收塊，而長句的每個有效位置仍讀出原值。

## 常見錯誤
有區塊表不代表浪費歸零。長度 5 的請求仍占 2 塊共 8 格，尾端還有 3 格未用。若引擎支援前綴共享，回收前還得知道有沒有其他請求引用同一實體塊；本例明訂不共享，才能直接歸還。池用完時，新請求要等待或依服務策略處理，分頁不會把顯示記憶體變大。

## 小結
容量表請寫「模型權重一次，加實體配置格數乘每格快取成本」，而不是把權重也切成每筆一份。分頁改變配置與索引，使不相鄰的空塊也能派上用場；需要注意力讀幾個有效詞元，仍取決於模型和上下文，而非實體編號的距離。
