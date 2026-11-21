---
id: ai-train-05-gather
module: ai-train
order: 5
title: 收集與分散歸約
subtitle: 結果要每人一份，還是各拿一片
status: ready
minutes: 35
level: 4
prereqs:
  - ai-train-02-collective
objectives:
  - 用 2 個順位手推 all-gather 與 reduce-scatter
  - 比較各順位輸入、輸出與 all-reduce 的關係
tags:
  - train
  - gather
resources:
  - title: NCCL：集合操作的輸入與輸出
    url: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-05-gather-gather
    prompt: 順位 0 拿 [10,20]、一拿 [30,40]，all-gather 後每人拿到什麼？
    answer: '[10,20,30,40]。'
    mcq:
      options:
        - '[40,60]'
        - '[10,20,30,40]'
        - 只有自己的原片段
        - 只有 0 號收到 [10,20,30,40]
      answer: 1
      explain: 收集依順位拼接，不歸約也不排序。
  - id: ai-train-05-gather-slice
    prompt: 完整加總為 [11,22,33,44]，兩順位等分後順位一拿什麼？
    answer: '[33,44]。'
    mcq:
      options:
        - '[11,22]'
        - 整個 [11,22,33,44]
        - '[33,44]'
        - '[22,44]'
      answer: 2
      explain: 按順位分派連續等長切片；不是隔一格取一個。
  - id: ai-train-05-gather-compose
    prompt: 加總 reduce-scatter 後再 all-gather，數值語意等同哪項？
    answer: 加總 all-reduce。
    mcq:
      options:
        - 只在根順位保留加總
        - 不經加總直接 all-gather 原輸入
        - 把各順位的原始向量交換位置
        - 加總 all-reduce
      answer: 3
      explain: 先分掉的完整和再拼回，於是每人都有全份和。
    interview:
      question: 設計一個分片更新時，怎麼決定要不要再做 all-gather？
      points:
        - 確認下一步所需範圍
        - 區分收集與歸約
        - 核對每順位輸出
      answer: 若下一步只更新各自的那段梯度，我會停在分散歸約。若後續每個順位都要全層參數，再對參數切片做全體收集，不把不需要的完整陣列長期留著。
  - id: ai-train-05-gather-root
    prompt: gather 和 all-gather 在誰持有完整結果這件事上有何不同？
    answer: gather 通常只在指定根順位重建完整結果；all-gather 要讓每位參與者都有按順位排列的完整結果。
practice:
  - id: ai-train-05-gather-p1
    title: 畫出三種集合輸出的形狀
    minutes: 12
    kind: code
    steps:
      - 保存腳本，畫 2 個順位的輸入與輸出
      - 將順位一最後一個梯度改為 50，推算哪一片先改變
    checks:
      - 原始切片是 [11,22]、[33,44]
      - 改值後只有第二片末格變成 54，重建後 2 人都看到 54
---
## 為什麼要學：先問下個步驟需要哪一份資料
假設 2 張卡各有一小段數值。你說要「同步」，同事卻不知道是把它們接起來、逐格相加，還是只把相加後的一半交給各人。選集合通訊前，把每個順位的輸入和預期輸出寫成兩列。只要畫清楚「誰最後持有什麼」，就不必靠背相似的英文名稱。

## 核心概念：收集不算數，歸約才算數
全體收集（all-gather）把各順位提供的資料按順位次序拼接，完整結果出現在每個順位。若 0 號拿前半參數、1 號拿後半，下一步兩人都需要整組，便可用它。這裡的輸入是不同切片，並沒有把 2 個值相加，也沒有按數值大小排序。

分散歸約（reduce-scatter）先在邏輯上對等長向量做逐元素歸約，再讓各順位只拿對應的結果切片。假如 2 人各自估算同一組 4 個參數的梯度，而且後續只負責更新其中 2 個，便適合這種輸出。本課用加總與等分，長度必須能切成相同大小；真實通訊演算法未必要先建立一份完整中間陣列。

## 範例：2 步組成完整的加總
先畫出各順位呼叫前後各持有幾份資料，用形狀和持有者來分辨收集、歸約及分散。把下面的範例存成 `C:\dev\stackway-lab\train` 裡的 `collective_shapes.py`。

在該目錄執行：Windows PowerShell 用 `py collective_shapes.py`；macOS／Linux 用 `python3 collective_shapes.py`。

```python
parts = [[10,20],[30,40]]
print("all-gather on each rank", parts[0]+parts[1])
grads = [[1,2,3,4],[10,20,30,40]]
total = [sum(col) for col in zip(*grads)]
shards = [total[:2],total[2:]]
for r, shard in enumerate(shards):
    print("rank",r,"reduce-scatter",shard,"after gather",sum(shards,[]))
assert sum(shards,[]) == total
```

先遮住輸出，對照兩組輸入，問自己第一行需要動用加法嗎？第二行先算和，再用順位當切片編號。若下一步改成每個人都要完整的和，就把這些切片再做全體收集；得到的數值等同對原始長向量做加總 all-reduce。相等的是輸出語意，並不保證每個後端真的分兩次呼叫或花相同時間。

### 換一個數，看改動傳到哪裡
只把順位一的最後一個輸入從 40 換成 50。先歸約的結果只有最後一格增加 10，這格屬於後半，故順位 0 的局部輸出應完全不動。再收集一次後，兩人的完整副本才都看得見這個改動。若第一步兩邊的局部輸出都跟著變，可能是測試把完整的和誤當成切片；若第二步只有一人看得到，則要查是否只做了有根順位的收集，而不是全體收集。

## 常見錯誤
看到名稱有 scatter 就把原始輸入切給別人，忘記它還要跨順位歸約。另一個錯誤是把 gather 和 all-gather 混在一起：前者通常只讓指定根順位收到收集結果，後者要求全員都拿到。檢查不能只看 0 號列印的一行，另一個順位持有全份還是半份，才是這題真正要驗的條件。

## 小結
畫表時同時註記輸入長度、輸出長度和欄位順序。下一步若要重建一層參數，需要的是拼起有序的分片；若只更新自己負責的梯度部分，先歸約後分片便可能免去不需要的常駐副本。這個選擇會在[〈FSDP 與常駐記憶體〉](#/lesson/ai-train-03-fsdp)用到。
