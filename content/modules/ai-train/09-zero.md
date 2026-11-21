---
id: ai-train-09-zero
module: ai-train
order: 9
title: ZeRO 分片階段
subtitle: 最佳化器、梯度、參數要切到哪一步
status: ready
minutes: 35
level: 4
prereqs:
  - ai-train-08-pp
objectives:
  - 區分 ZeRO 3 階段依序分片的狀態
  - 用記憶體與通訊方向比較純資料平行和完整分片
tags:
  - train
  - zero
resources:
  - title: DeepSpeed：ZeRO 的 3 個分片階段
    url: https://www.deepspeed.ai/tutorials/zero/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: PyTorch：FSDP2 分組、分片與預取
    url: https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-09-zero-stage
    prompt: ZeRO 階段 2 比階段 1 多分片哪一類？
    answer: 梯度。
    mcq:
      options:
        - 參數
        - 梯度
        - 活化值
        - 已更新的完整模型權重
      answer: 1
      explain: 階段 1 已切最佳化器狀態；到階段 3 才再切參數。
  - id: ai-train-09-zero-resident
    prompt: 本例 4 順位、階段 3，3 類常駐狀態合計每卡多少？
    answer: 8 GiB。
    mcq:
      options:
        - 32 GiB
        - 14 GiB
        - 8 GiB
        - 20 GiB
      answer: 2
      explain: 3 類合計 32 GiB 都可均分時，每卡估 8 GiB，不是峰值。
  - id: ai-train-09-zero-trade
    prompt: 階段 3 為何需要額外留意通訊？
    answer: 使用分片參數的層要及時取得完整所需權重。
    mcq:
      options:
        - 因為分片後每張卡都必須永久儲存完整參數
        - 因為開啟階段 3 就一定把所有狀態卸載到主機
        - 因為階段 3 不再允許任何計算與通訊重疊
        - 使用分片參數的層要及時取得完整所需權重
      answer: 3
      explain: 平時少留副本，換成計算前後有額外的資料交換。
    interview:
      question: 你會如何選擇 ZeRO 階段，而不只回答「開最高」？
      points:
        - 拆開三種狀態
        - 估常駐與峰值
        - 比較交換成本
      answer: 我先看是哪欄占滿。如果只切最佳化器就有足夠餘裕，會先試階段 1；若參數也放不下才評估階段 3，並量重建峰值與步時，不拿理想均分當作實測。
  - id: ai-train-09-zero-offload
    prompt: 分片和卸載是同一項容量策略嗎？
    answer: 不是。分片改變不同順位各留哪部分狀態；卸載改變狀態放在哪種裝置或儲存層。可以組合，但前者不必然包含後者。
practice:
  - id: ai-train-09-zero-p1
    title: 保存一張逐階分片帳本
    minutes: 12
    kind: code
    steps:
      - 儲存腳本，標出每階首次被切的欄
      - 把假想常駐預算設成每卡 15 GiB，找最低可行階段
    checks:
      - 常駐估算依序為 32、20、14、8 GiB
      - 15 GiB 門檻先通過的是階段 2，仍須另驗峰值
---
## 為什麼要學：同一筆狀態被存了幾次？
2 張卡都放了一份模型，還各自保留梯度與最佳化器的歷史資料。如果記憶體被這些重複狀態占滿，單純減少輸入批次未必夠。0 冗餘最佳化器（Zero Redundancy Optimizer，ZeRO）讓資料平行的順位分擔狀態的保存責任。這不是把樣本再切小，而是在問「不用計算時，誰有必要留著這份資料？」

## 核心概念：每提高一階，多切一種狀態
參數（parameter）是模型目前的權重；梯度（gradient）是這一步要用的調整方向；最佳化器狀態（optimizer state）則可能包含動量等歷史量。以純資料平行為起點，每人都留完整三類。階段 1 切最佳化器狀態，每人只為自己負責的參數片段保留對應歷史；階段 2 延續前一步，再切梯度；階段 3 再把參數也切分。有累積關係，不是三種互斥檔案格式。

哪些資料要重建，取決於何時及在哪裡做計算。若各人只保留部分最佳化器狀態，它就只負責那部分更新，其餘順位仍需要一致的更新結果。若連參數也分片，計算某層前便要取得這層需要的權重，之後可釋放暫時組出的全量。這些交換會使用通訊時間及緩衝空間，分得越多不等於每一步越快。

## 範例：每一張卡的常駐帳
開啟 `C:\dev\stackway-lab\train`，將範例另存為 `zero_ledger.py`。把參數、梯度與最佳化器狀態分成三欄。每換一個分片階段，先圈出新增被分攤的是哪一欄。

在該目錄執行：Windows PowerShell 用 `py zero_ledger.py`；macOS／Linux 用 `python3 zero_ledger.py`。

```python
total = dict(params=8,grads=8,optim=16)
threshold = dict(params=3,grads=2,optim=1)
for stage in range(4):
    local = {k:v/(4 if stage>=threshold[k] else 1) for k,v in total.items()}
    print("stage",stage,local,"resident GiB",sum(local.values()))
```

這份教具把整體參數、梯度、最佳化器狀態分別假定為 8、8、16 GiB，平均分在 4 個資料平行順位。逐列看哪一欄第一次下降，比只記最後總數容易。例如階段 2 的參數仍是完整 8 GiB，不能把 3 項都除以 4。這裡的數字是給定條件，不是所有最佳化器都剛好使用 2 倍參數容量。

### 逆推是卡在哪一欄
若有人說「已開第 2 階，為什麼每張卡仍有完整權重」，先把帳本的參數欄單獨蓋住，再問哪一階才該看見這欄下降。第 2 階省的是梯度與最佳化器，不是參數，這個觀察本身正符合設計。反過來，若原本最大的是反向運算保留的活化值，就算三種狀態都成功均分，也可能只省到總尖峰的一小部分；這時要重新找最大的欄，而不是繼續增加順位。

## 常見錯誤
把常駐總數等同可開機訓練的顯示記憶體下限。還有活化值、重建當層的暫存、通訊緩衝、精度轉換與分配器開銷；分片難以均分時也會有對齊差額。把狀態卸載到主機是另一項可組合的選擇，不是打開某個分片階段就必然發生的動作。

## 小結
先將記憶體拆成三欄，再挑最簡單且可能滿足容量的階段。若階段 1 已足夠，就沒有單靠「階段較高」選 3 的理由；反過來，若完整參數根本載不下，需要評估分片與臨時重建的峰值，並在代表性工作上量通訊成本。
