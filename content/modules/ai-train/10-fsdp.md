---
id: ai-train-03-fsdp
module: ai-train
order: 10
title: FSDP 與常駐記憶體
subtitle: 模型放不下時該切什麼
status: ready
minutes: 35
level: 3
prereqs:
  - ai-train-09-zero
objectives:
  - 比較 DDP 與 FSDP 的常駐記憶體
  - 說明分片如何增加資料交換
tags:
  - train
  - fsdp
resources:
  - title: PyTorch：FSDP2 分組、分片與預取
    url: https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-03-fsdp-resident
    prompt: FSDP 平時省下的主要是哪一種開銷？
    answer: 每個順位都常駐完整訓練狀態的重複量。
    mcq:
      options:
        - 所有順位讀取資料集的磁碟占用
        - 微批次本身所包含的有效樣本數
        - 每個順位都常駐完整訓練狀態的重複量
        - 當前層做前向所需的全部運算
      answer: 2
      explain: 狀態被分片，計算和交換並沒有消失。
  - id: ai-train-03-fsdp-before
    prompt: 完整分片下，計算某個群組前常需做哪個動作？
    answer: 收集該群組參數。
    mcq:
      options:
        - 先把所有樣本在每個順位重建一遍
        - 先歸約尚未計算的當步梯度
        - 只收集各順位的損失值就能重建參數
        - 收集該群組參數
      answer: 3
      explain: 先備好當前群組需要的參數，不一定一次重建整個模型。
  - id: ai-train-03-fsdp-peak
    prompt: 預取下一組可能提高記憶體峰值的原因是什麼？
    answer: 同時存在當前與下一組完整緩衝。
    mcq:
      options:
        - 同時存在當前與下一組完整緩衝
        - 預取會把所有權重永久改成副本
        - 預取會讓每個參數的元素位寬加倍
        - 預取會自動增加資料平行的全域批次
      answer: 0
      explain: 重疊可改善等待，代價是 2 組暫存可能同時存活。
    interview:
      question: 每卡常駐只要 8 GiB，為什麼 16 GiB 的卡仍不一定夠？
      points:
        - 區分常駐與瞬間
        - 計入活化及重建
        - 檢查預取重疊
      answer: 我會在每層計算前後對照峰值。例中加上當層和活化是 15 GiB，若又預取 3 GiB 就到 18；會先改一項預取或分組設定再量，不直接怪分片失效。
practice:
  - id: ai-train-03-fsdp-p1
    title: 畫出重建與預取的容量峰值
    minutes: 12
    kind: code
    steps:
      - 保存腳本與 3 列估算
      - 畫 16 GiB 界線，註記假設是完整緩衝另外配置
    checks:
      - 3 列情境為 35、15、18 GiB
      - 預取時超過界線，但常駐仍是 8 GiB
---
## 為什麼要學：靜止時放得下，跑到第 3 層卻超量
同一份模型從資料平行換成完整分片，監控顯示起步時每張卡空間變多，訓練卻在某一層耗盡記憶體。完整分片資料平行（Fully Sharded Data Parallel，FSDP）減少平時重複留在各卡的狀態，不代表計算時只需要那一小片。要判斷能不能跑，得分別畫靜止與工作時的帳。

## 核心概念：參數是在使用前才集合
以 PyTorch FSDP2 的完整分片情境為例，各順位平時持有部分參數、梯度及對應最佳化器狀態。要運算某個參數群組時，先以全體收集（all-gather）取得該群組所需的完整參數。若採用計算後重新分片的策略，完整緩衝便可釋放；反向需要參數時還要再次備好。梯度則可經分散歸約（reduce-scatter），讓每人只留要更新的部分。

與 DDP 相比，兩者都可讓不同順位處理不同樣本；不同的是參數平時怎麼保存、運算前後搬哪些資料。FSDP 不是讓一張卡永遠免於持有當前計算需要的權重。分組太大，一次收集的完整權重可能很重；分組太小，反覆啟動通訊與等待也有成本。要找的是對這個模型和拓撲適合的邊界。

## 範例：在常駐帳上疊暫存
在 `C:\dev\stackway-lab\train` 新建 `fsdp_peak.py`。在收集參數的那一步另畫一條記憶體線。平時只保留分片，不代表整步都不會暫時撐高峰值。

在該目錄執行：Windows PowerShell 用 `py fsdp_peak.py`；macOS／Linux 用 `python3 fsdp_peak.py`。

```python
full, ranks, activations = 32, 4, 3
base = full/ranks
for mode, resident, buffers in [("DDP",full,[]),
    ("shard",base,[4]), ("shard+prefetch",base,[4,3])]:
    print(mode,"resident",resident,"scenario GiB",resident+sum(buffers)+activations)
```

這是明訂配置方式的預算模型，不是 PyTorch 配置器的精確公式。假想 4 順位、3 類常駐共 32 GiB；另給活化值 3 GiB。這裡保守假設完整參數緩衝與原有分片同時存在，所以完整緩衝另加，不再減掉自身分片。若預取（prefetch）下一組，使 2 組完整緩衝重疊，尖峰便會增加。實作與時序不同，緩衝重用情形也可能不同。

### 用 2 個時刻做對照
想像模型剛完成一組運算，監控只留下每秒一次的快照，而完整參數在兩次取樣之間就被釋放。你可能只看到低谷而漏掉真正導致配置失敗的那一瞬。可以在同一個代表性更新步記錄配置器的峰值，再用群組邊界標記去配對。如果關閉下一組預取後不再超量但步時拉長，這正是縮短 2 組重疊區間所付的代價，不應將它解讀成訓練正確性退步。

## 常見錯誤
只抄訓練開始前那一行使用量，就向團隊保證一定能跑到最後。應用實際每順位的峰值對照層與步驟，分開看當層重建、下一層預取和活化值。也不要把通訊總時間直接加到整步時間上，部分傳輸可能與計算重疊；記憶體多用一點換得的，可能正是較少的可見等待。

## 小結
先確認 DDP 的瓶頸真的是重複常駐狀態，再試分片粒度與預取。交付結論分成「估計每卡平時保留多少」、「哪個時段可能達峰」與「下一次要觀察什麼」。擁有分片帳本不等於量過實際 FSDP，卻能指明為何一個表面很省的設定還是有風險。
