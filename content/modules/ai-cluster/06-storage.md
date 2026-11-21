---
id: ai-cluster-05-storage
module: ai-cluster
order: 6
title: 叢集儲存與檢查點
subtitle: 同時寫入檢查點的流量尖峰
status: ready
minutes: 40
level: 3
prereqs:
  - ai-cluster-04-fabric
objectives:
  - 估算一輪寫入的總資料量與時間
  - 比較錯開寫入與共用儲存的取捨
tags:
  - cluster
  - storage
resources:
  - title: PyTorch：非同步檢查點與完成通知
    url: https://docs.pytorch.org/tutorials/recipes/distributed_async_checkpoint_recipe.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: PyTorch：一般訓練檢查點的內容
    url: https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-cluster-05-storage-lower
    prompt: 4 份各 2 GiB，共用出口合計 1 GiB/s，理想下限是多少？
    answer: 8 秒。
    mcq:
      options:
        - 2 秒
        - 0.5 秒
        - 8 秒
        - 32 秒
      answer: 2
      explain: 總量 8 GiB 經同一個出口；不能假設每位寫入者各自擁有滿速。
  - id: ai-cluster-05-storage-stagger
    prompt: 本例錯開寫入主要改變了什麼？
    answer: 同時寫入者數與各自完成時刻。
    mcq:
      options:
        - 每一輪必須儲存的資料總量
        - 同一份快照可以混用的訓練步數
        - 共享出口能達到的理論頻寬
        - 同時寫入者數與各自完成時刻
      answer: 3
      explain: 時程調整不等於壓縮資料或提升硬體頻寬。
  - id: ai-cluster-05-storage-publish
    prompt: 何時可將分片版本標成可還原？
    answer: 同一步的必要分片全部完成且驗證通過。
    mcq:
      options:
        - 同一步的必要分片全部完成且驗證通過
        - 只要第一份分片出現
        - 最後一個非同步寫入剛排入佇列時
        - 任意一個順位顯示本機寫入完成時
      answer: 0
      explain: 已發出寫入與已完成不同；不完整版本不能取代上一份可用版本。
    interview:
      question: 怎麼在不降低可還原性的情況下減少儲存尖峰？
      points:
        - 先算總量與共享瓶頸
        - 同一步穩定快照
        - 錯開寫入並驗證完整
      answer: 我會先量每輪總量與有效頻寬，再錯開不同工作的落盤時間。每份快照仍一致，等所有分片完成才公布，且保留上一份可還原版本實際試讀。
  - id: ai-cluster-05-storage-durable
    prompt: 非同步快照的工作已返回，是否可以立刻刪除前一份可用檢查點？
    answer: 不行。要等必要分片完成且可驗證，再公布新版本；把請求排入寫入佇列還不等於已能還原。
practice:
  - id: ai-cluster-05-storage-p1
    title: 畫出寫入高峰與可用時間
    minutes: 14
    kind: code
    steps:
      - 儲存程式與兩種完成時間
      - 標示何時第一組完成，以及何時才能公布完整版本
    checks:
      - 同時寫的峰值為 4、錯開為 2
      - 兩種的最後完成都是第 8 秒
---
## 為什麼要學：每隔 10 分鐘，整個叢集一起慢下來
平常讀資料很順，到了儲存檢查點（checkpoint）的那一步，幾個訓練工作同時停頓。不是每個節點的磁碟都壞了，而可能是大家在同一時刻把大量資料送往共用儲存。要估這種尖峰，先找哪條路徑是共享的，然後算經過它的總資料量，而不是只看單張卡的寫入速度。

## 核心概念：保留的是同一步，不必同一秒寫完
檢查點是某次更新完成後可用來還原的狀態，可能含權重、最佳化器與資料進度。分片檢查點把狀態分成數份，每個工作順位（rank，也就是群組中的行程編號）負責其中一份；之後在[〈資料分片與工作順位〉](#/lesson/ai-train-01-shards)會細講順位。不是所有儲存設計都會由每個順位各寫一整份模型，先列清實際將寫的分片再加總。

若有 4 個寫入者各產生 2 GiB，相同共享出口每秒總共能寫 1 GiB，忽略協定、排隊、同步與索引開銷，最少也要 8 秒。這個下限按總量而非每人各自的容量計算。錯開不同工作的寫入起點可以降低同時競爭，但資料量未減少，最後一個檔案不保證更早完成。當出口還沒飽和，有些並行反而有益。

## 範例：同時寫，還是分批寫？
開啟 `C:\dev\stackway-lab\cluster`，將範例另存為 `checkpoint_io.py`。記下寫入量和每秒可寫入量，再預測保存一次需要多久。檔案夠放，不代表能在時間預算內寫完。

在該目錄執行：Windows PowerShell 用 `py checkpoint_io.py`；macOS／Linux 用 `python3 checkpoint_io.py`。

```python
from fractions import Fraction
for start in ([0,0,0,0], [0,0,4,4]):
    left, end, t, peak = [Fraction(2)]*4, [0]*4, 0, 0
    while any(left):
        active = [i for i in range(4) if start[i]<=t and left[i]>0]
        peak = max(peak,len(active))
        for i in active:
            left[i] = max(0, left[i]-Fraction(1,len(active)))
            if not left[i]:
                end[i]=t+1
        t+=1
    print("peak writers", peak, "finish seconds", end)
```

每個時間格是 1 秒，活動中的寫入者公平分享固定總頻寬。兩種安排都能讓出口持續工作，故最後完成時間相同，但同時競爭的峰值不同。請看完成時刻分布：同時開始的工作彼此拖慢，錯開後先來的一批能較早交付。這是理想化頻寬模型，沒有模擬真實儲存系統的小檔、快取或中繼資料成本。

### 寫出後怎麼知道能用？
做一份清單，讓每個分片都有相同步號、預期大小與完成標記。測試時先看齊不齊，再從最後一份完整版本還原到另一個工作，確認下一步能讀資料並更新。若可能需要跨節點還原，就不能只在原節點仍活著的情況下試讀；那只能證明本機副本還在，不能證明已抵達共用儲存。

## 常見錯誤
錯開「寫出時間」不是讓同一份檢查點混用不同訓練步。應先固定該步狀態，非同步寫出時也要有穩定副本，所有必要分片完成並驗證後才公布可還原。只看到第一份檔案出現就刪除上一版，若中途斷線，可能兩份都不能用。存在節點本機雖可能更快，節點消失時也可能一併失去。

## 小結
容量報告列單次總量、目標層級、有效總頻寬、寫入時窗與還原條件。優先選能在可接受停頓內留下完整檢查點的方法，再用還原演練確認真的能接續；單看寫入速度最高的一行，不足以衡量故障後會丟掉多少進度。
