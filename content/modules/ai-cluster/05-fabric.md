---
id: ai-cluster-04-fabric
module: ai-cluster
order: 5
title: GPU 互連與網路
subtitle: 多卡慢在計算還是傳輸
status: ready
minutes: 35
level: 3
prereqs:
  - ai-cluster-03-slurm
objectives:
  - 區分單機互連與跨機網路
  - 解釋 InfiniBand 或 RoCE 如何影響集合通訊
tags:
  - cluster
  - networking
resources:
  - title: NVIDIA NCCL：通訊函式庫與互連
    url: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/overview.html
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
  - title: NCCL：區分 InfiniBand 與 RoCE 的網路問題
    url: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/troubleshooting/networking_troubleshooting.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-cluster-04-fabric-path
    prompt: 2 張同型 GPU 放在不同主機，多了哪段必須檢查的路？
    answer: 主機間網卡、鏈路與交換設備。
    mcq:
      options:
        - 只核對單一主機內的 GPU 直連頻寬
        - 主機間網卡、鏈路與交換設備
        - 只核對每張卡的裝置記憶體頻寬
        - 只核對同一個 PCIe 插槽的規格
      answer: 1
      explain: GPU 型號不決定主機間傳輸方式。
  - id: ai-cluster-04-fabric-small
    prompt: 總位元組不變，拆成較多次小傳送，哪項成本會增加？
    answer: 每次啟動的固定延遲累積。
    mcq:
      options:
        - 每個元素佔的位元組數增加
        - 這批有效資料總量必須乘以傳送次數
        - 每次啟動的固定延遲累積
        - 單次實體鏈路的線速必然下降
      answer: 2
      explain: 每次傳送各付一次固定成本，即使資料總量相同。
  - id: ai-cluster-04-fabric-time
    prompt: 最早到集合點的卡等待很久，能證明網卡很慢嗎？
    answer: 不能，要先區分等其他順位與實際搬移。
    mcq:
      options:
        - 能，呼叫區段等同於純傳送時間
        - 能，只要使用同型 GPU 就可忽略抵達時間差
        - 能，最先進入的人一定是最後到達的人
        - 不能，要先區分等其他順位與實際搬移
      answer: 3
      explain: 需要對齊各順位到達及傳輸完成事件。
    interview:
      question: 若跨機步時變長，你會先做哪個可比的實驗？
      points:
        - 固定工作量及訊息
        - 畫拓撲
        - 分開算前置計算與通訊
      answer: 我會固定卡數、每卡批次及梯度量，只改放置方式。先對齊各卡進入集合的時刻，再看都就緒後傳送花多久，才能決定先查資料讀取還是跨機鏈路。
practice:
  - id: ai-cluster-04-fabric-p1
    title: 為兩條路做一份通訊預算
    minutes: 11
    kind: code
    steps:
      - 保存腳本，在結果旁畫單機與雙機路徑
      - 比較 1 次與 64 次傳送，圈出只因次數增加的成本
    checks:
      - 單次的估算傳輸為 4.02 與 16.1 毫秒
      - 跨機拆 64 次後傳輸為 22.4 毫秒
---
## 為什麼要學：加了第 2 台主機，訓練反而慢
在同一台機器用 2 張卡算得很順，換成 2 台各放 1 張，模型與批次都沒變，步驟卻變長。資料在哪條路上走，是這次改動中最容易漏掉的條件。互連（interconnect）是裝置交換資料的路徑；量測要能分清楚是等對方算完，還是雙方都到齊後資料真的搬得慢。

## 核心概念：先沿資料路線畫一圈
單機內可能走 PCIe，某些平台有 NVLink 等高速連結。跨機則還要經過網路介面、鏈路和交換器；同型號 GPU 並不保證相同拓撲（topology）。InfiniBand 是一種高速互連技術；RoCE 是在乙太網路上提供遠端直接記憶體存取（RDMA）的方法。能否走預期路徑仍取決於網卡、主機、驅動與網路配置，不是看到技術名稱就有標稱速度。

集合通訊（collective communication）是多個工作一起交換或彙整資料，例如將各卡同一層的梯度合併，再讓各卡收到結果。在[〈All-reduce 與梯度同步〉](#/lesson/ai-train-02-collective)會逐格算數值。本堂只追一次需要傳遞的位元組，以及幾次不能省掉的啟動等待。NCCL 是負責裝置間通訊的函式庫，會利用可用拓撲；它不替應用程式決定每步要同步哪些資料。

## 範例：同一傳輸量換 2 條路
先把傳輸量與頻寬換成相容單位。算出的秒數只涵蓋模型列出的成本，不能當成叢集上的實測。把下面的範例存成 `C:\dev\stackway-lab\cluster` 裡的 `fabric_time.py`。

在該目錄執行：Windows PowerShell 用 `py fabric_time.py`；macOS／Linux 用 `python3 fabric_time.py`。

```python
def estimate(mib, calls, rate, latency_ms):
    return calls*latency_ms + 1000*mib/rate
for calls in (1,64):
    for path, rate, lat in [("local",16000,.02), ("remote",4000,.10)]:
        transfer = estimate(64,calls,rate,lat)
        print(calls, path, round(transfer,2), "step_ms", round(30+transfer,2))
```

為了能手算，假設沒有重疊，傳輸成本等於各段固定延遲加上資料量除以有效頻寬（bandwidth）。例中已知的是每步經過瓶頸的總量，不是拿模型檔大小當網路流量。大訊息時傳輸時間主要隨資料量變動；若把同樣總量切成很多次，小訊息每次都要付一次固定延遲。這個估算不預測任何特定網卡的實測數字。

### 如果換的是路而不是運算
拿同一個步驟的開始與結束來對照：若前置計算一直是 30 毫秒，只有所有卡都到齊後的區段隨跨機放置而拉長，才和鏈路受限的說法相符。即使如此，這仍未分清是網卡路徑選錯、背景流量競爭或有效頻寬本來就較小。下次保持放置和總傳輸量不變，只改訊息次數，就能再區分固定啟動成本與大塊搬運的影響。

## 常見錯誤
把每秒幾百「位元」直接當成同數量的「位元組」，或把全雙工兩方向的總頻寬拿去除單方向資料。RDMA 可減少資料交換經過主機處理器搬運的負擔；若 RoCE 鏈路發生壅塞，各順位仍可能被慢鏈路拖住。此時要比對同時段的網卡佇列、丟包與延遲，不要把能連線當成已量到穩定頻寬。本例刻意使用 MiB 與 MiB/s；讀規格時要先統一單位。所有卡都卡在通訊呼叫也不代表網路壞掉，最早到集合點的卡可能只是在等最後一位結束前面的計算。

## 小結
在報告寫明卡放在哪些主機、訊息量、次數、計算時間與等待是否能重疊。即使跨機較慢，也先在相同工作量下比較單機與跨機的通訊區段，再提出調整放置或檢查鏈路的理由，不要從總步時直接宣判整個網路有問題。
