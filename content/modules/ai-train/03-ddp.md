---
id: ai-train-03-ddp
module: ai-train
order: 3
title: 資料平行與 DDP
subtitle: 兩份模型怎麼保持相同權重
status: ready
minutes: 35
level: 4
prereqs:
  - ai-train-02-launcher
objectives:
  - 畫出各順位前向、反向、同步與更新的順序
  - 比較每卡批次與全域批次，不把複製誤認成分片
tags:
  - train
  - ddp
resources:
  - title: PyTorch：分散式資料平行與同步點
    url: https://docs.pytorch.org/tutorials/intermediate/ddp_tutorial.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-03-ddp-replica
    prompt: 一般 DDP 每個順位持有什麼？
    answer: 完整模型副本與自己的輸入批次。
    mcq:
      options:
        - 每人只留參數的一個分片
        - 每人只留連續幾層的權重
        - 每人持有完整資料並自動等分每個樣本的特徵
        - 完整模型副本與自己的輸入批次
      answer: 3
      explain: 資料被分配，模型在各順位複製；模型放不下要看別的策略。
  - id: ai-train-03-ddp-batch
    prompt: 每卡 2 筆、2 個資料平行順位、無梯度累積，全域批次是？
    answer: 4 筆。
    mcq:
      options:
        - 4 筆
        - 2 筆
        - 1 筆
        - 8 筆
      answer: 0
      explain: 要數一次參數更新所使用的不重複樣本。
  - id: ai-train-03-ddp-sync
    prompt: 為何同步後各順位不必再傳完整更新後的權重？
    answer: 從相同參數與最佳化器狀態用相同梯度更新。
    mcq:
      options:
        - 2 個順位都對同一批樣本各自計算、無需通訊
        - 從相同參數與最佳化器狀態用相同梯度更新
        - 所有更新只由順位 0 執行，其他順位不用更新
        - 梯度同步時已把更新後的權重一併傳給各順位
      answer: 1
      explain: 相同起點、更新規則與同步梯度才讓各副本維持一致。
    interview:
      question: 2 張卡的損失不同，是 DDP 壞了嗎？
      points:
        - 區分不同輸入與相同參數
        - 比同步梯度和更新
        - 核對批次權重
      answer: 我預期不同資料會算出不同局部損失。會檢查同步後的梯度與一步更新的權重是否一致，再跟同一個全域批次的單機結果比，而不是要求局部損失一樣。
practice:
  - id: ai-train-03-ddp-p1
    title: 保留同步與不同步的第一步
    minutes: 12
    kind: code
    steps:
      - 儲存程式，畫前向、反向、同步、更新
      - 把 2 份樣本串成單批，記下對照值
    checks:
      - 不同步時權重是 0.5、1.5，同步後都是 1
      - 單機對照也是 1
---
## 為什麼要學：2 個人各算一份，不要養成 2 個模型
有一個模型能放進單張卡，但資料很多，希望用 2 張卡一起學。分散式資料平行（DistributedDataParallel，DDP）讓每個順位保留完整模型，各自用不同資料算梯度，再以一致的梯度更新。它解決的是分工，不是讓放不進單卡的模型突然變小。

## 核心概念：從同一組參數走到同一組新參數
先確保各順位的初始參數一致。前向（forward）各自算預測和損失；反向（backward）各自算出參數該往哪裡調的梯度。DDP 通常在反向期間就按桶啟動梯度同步，讓部分通訊和計算重疊；概念上只要記住，最佳化器（optimizer）更新前要拿到群組同意的結果。各自執行相同更新，就不用每次把更新好的整份模型再傳給所有人。

用等大的本機批次且各自取平均損失，2 個局部平均梯度再平均，就等於所有樣本的平均。每卡批次 2、資料平行順位 2、每輪反向後更新一次，這一步全域批次就是 4。若下次要累積多個微批次才更新，才把累積步數算進去。每人拿不同樣本這件事要由取樣安排完成；包上一層 DDP 並不自動替你切輸入。

## 範例：做一次真正的純量參數更新
開啟 `C:\dev\stackway-lab\train`，將範例另存為 `ddp_step.py`。先分開算各順位的本地貢獻，再看同步後更新用的是哪個值。不要把多份模型誤畫成一份被切碎的權重。

在該目錄執行：Windows PowerShell 用 `py ddp_step.py`；macOS／Linux 用 `python3 ddp_step.py`。

```python
w, lr, shards = 0.0, 0.25, [[1,3],[5,7]]
local = [sum(w-y for y in s)/len(s) for s in shards]
avg = sum(local)/len(local)
serial = sum(w-y for s in shards for y in s)/sum(map(len,shards))
print("local grad",local,"without sync",[w-lr*g for g in local])
print("synced weights",[w-lr*avg for _ in shards],"reference",w-lr*serial)
assert avg==serial
```

把每個目標數當成 1 筆樣本，模型只學一個常數，損失是預測誤差平方的一半，對參數的梯度就是預測減目標。局部平均分別為負 2 和負 6，平均為負 4，減去負值會把權重往較大的目標移動。程式同時列出若各自單獨更新會走到哪裡，這是容易看見的錯誤對照。這裡沒有啟動 PyTorch 或多張卡。

### 用不等批次測出隱藏的假設
若 0 號只有 1 筆而梯度是 2，1 號有 3 筆而局部平均是 6，2 個順位直接平均會得到 4。若目標是每筆樣本有相同權重，真正的平均要把各自的平均乘回各自樣本數，合計後除以 4，答案為 5。兩者都能讓模型副本保持一致，卻只有後者符合這個訓練目標。由此可見「各卡結果相同」和「等價於所需的全域批次」要分兩次檢查。

## 常見錯誤
把 2 個順位的模型參數總數加起來，便以為每人只存一半；資料平行複製的是模型，分開的是輸入。另一個陷阱是最後一批大小不同時仍把 2 個平均等權合併，這會讓樣本少的一邊占太高比重。若訓練需要依樣本等權重，應對齊批次或按有效樣本數調整損失權重。

## 小結
驗收時拿同樣 4 筆在單機做一次平均梯度，和兩順位手算的新參數對照。兩邊一致才說明這個步驟等價；每張卡記憶體變小或總執行時間減半，兩者都不是由這個數學等式保證。
