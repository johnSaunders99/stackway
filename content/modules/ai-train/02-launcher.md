---
id: ai-train-02-launcher
module: ai-train
order: 2
title: torchrun 啟動與順位
subtitle: 同一支程式如何認出各自的工作
status: ready
minutes: 35
level: 4
prereqs:
  - ai-train-01-shards
objectives:
  - 區分本機順位、全域順位與總行程數
  - 判讀雙行程啟動紀錄，標明 CPU 與多卡實測的不同
tags:
  - train
  - launcher
resources:
  - title: PyTorch：torchrun 的行程與環境變數
    url: https://docs.pytorch.org/docs/2.15/elastic/run.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-02-launcher-local
    prompt: 每機 2 張可見卡且一行程一卡，通常依什麼選本機裝置索引？
    answer: LOCAL_RANK。
    mcq:
      options:
        - WORLD_SIZE
        - 直接用 RANK，不考慮主機數
        - LOCAL_RANK
        - 以行程印出訊息的先後決定卡號
      answer: 2
      explain: 本機裝置編號只在該機的可見範圍有效。
  - id: ai-train-02-launcher-unique
    prompt: 2 台主機各有 1 個 LOCAL_RANK 為 0，哪個欄位可區分全場工作？
    answer: 同一群組的 RANK。
    mcq:
      options:
        - 單看 LOCAL_RANK
        - 同一群組回報的 WORLD_SIZE
        - 單看每台主機的行程總數
        - 同一群組的 RANK
      answer: 3
      explain: 總數與檔名都共用，全域順位才區分同群組的工作。
  - id: ai-train-02-launcher-scope
    prompt: 只讀出兩行環境變數，能證明什麼？
    answer: 工作程式讀到了各自身分。
    mcq:
      options:
        - 工作程式讀到了各自身分
        - 已成功完成一次 GPU 集合操作
        - 已確認每個行程占用不同實體 GPU
        - 已確認兩台節點的通訊路徑可用
      answer: 0
      explain: 啟動、選裝置、集合通訊與訓練正確性要分別驗收。
    interview:
      question: 第二台主機出現無效 GPU 索引，你先核對哪份紀錄？
      points:
        - 對照兩種順位
        - 查每行程可見裝置
        - 分清啟動和運算證據
      answer: 我會把各行程的全域、本機順位和可見裝置數排在一起。若用全域 2 去找本機第三張卡，先修選卡邏輯；兩個行程有啟動不等於多卡通訊已通。
  - id: ai-train-02-launcher-elastic
    prompt: 為什麼不應把某份永久資料綁死在這次的全域順位上？
    answer: 重新會合或改變群組時，全域編號可能重新分派。應另外保存資料身分與分片規則，不用某一輪的順位充當永久身分。
practice:
  - id: ai-train-02-launcher-p1
    title: 保存兩行順位探針結果
    minutes: 12
    kind: code
    steps:
      - 儲存檔案並跑預設 CPU 分支
      - 另畫 2 台各 2 個行程的表，標記誰能寫全場摘要
    checks:
      - 實際輸出標示 cpu-demo，總數同為 2
      - 手繪表有 2 個本機 0 號，只有 1 個全域 0 號
---
## 為什麼要學：同一份程式不是同一個行程
在兩台主機上都出現「我是 0 號」，不一定有行程重複啟動。你可能看的是每台主機自己的 0 號，而不是整場訓練的 0 號。啟動器（launcher）負責開工作行程、交付身分和會合設定；工作程式依這些資料決定讀哪份樣本、使用哪個本機裝置、誰負責寫共同紀錄。

## 核心概念：3 個欄位不要混用
在 torchrun 啟動的工作中，環境變數 `RANK` 是本次群組的全域順位，`LOCAL_RANK` 是該主機內的本機順位，`WORLD_SIZE` 是整個群組的工作行程數。若 2 台各啟動 2 個行程，全域編號共有 4 個，本機編號則可各自從 0 開始。這不是使用者永久身分；重新會合或彈性重啟後，不應假設同一台機器永遠拿到相同全域編號。

採每張可見 GPU 配 1 個行程的慣例時，通常用本機順位選裝置，在該行程可見的裝置範圍內解讀。若用全域順位當裝置索引，第二台可能找不存在的第三張卡。相反地，只准全場一人寫的摘要若用本機順位 0 判斷，多台主機就可能同時動筆。分片、記錄與選裝置，是三個不同問題。

## 範例：先真的開 2 個 CPU 子行程
分開標記全域順位和節點內順位。同一個本地編號可以在不同節點重現，不能直接拿來當全域身分。把下面的範例存成 `C:\dev\stackway-lab\train` 裡的 `rank_probe.py`。

在該目錄執行：Windows PowerShell 用 `py rank_probe.py`；macOS／Linux 用 `python3 rank_probe.py`。

```python
import os, subprocess, sys
keys = ("RANK","LOCAL_RANK","WORLD_SIZE")
if all(k in os.environ for k in keys):
    print(os.environ.get("LAB_SOURCE","launcher-env"), *(os.environ[k] for k in keys))
else:
    children = []
    for r in range(2):
        env = dict(os.environ, RANK=str(r), LOCAL_RANK=str(r),
                   WORLD_SIZE="2", LAB_SOURCE="cpu-demo")
        children.append(subprocess.Popen([sys.executable,__file__],env=env))
    assert all(p.wait()==0 for p in children)
```

直接執行時，父行程以示範設定啟動 2 個子行程，兩行代表不同的真實 CPU 行程，但環境變數是範例指定的，不是實測 torchrun、GPU 或集合通訊。以下 torchrun 指令未在本機驗證；在已安裝相容 PyTorch 的單機環境，同資料夾另執行 `torchrun --standalone --nnodes=1 --nproc-per-node=2 rank_probe.py`，工作程式會直接讀取啟動器交付的變數，不會再開子行程。兩行的印出順序不列為驗收條件。

### 一張跨主機的對照表怎麼畫
假設本次配置恰好在甲機安排全域 0、1 號，在乙機安排全域 2、3 號。圈出乙機的第一個行程：若它要選自己的第一張卡，該填的是本機 0；若它要從 4 份訓練資料中挑所屬那份，該帶的是全域 2。總數 4 告訴取樣器要切幾份，不是裝置索引。下次換一批節點時要重新讀取啟動器提供的值，不將這次畫下來的配置硬寫進程式。

## 常見錯誤
看到有兩行輸出便宣稱多卡訓練成功。此例沒有把張量放上 GPU，也沒有初始化通訊群組；能證明的是啟動和身分傳遞。若環境中已有其他啟動器設定，先在一般終端機執行離線分支，別用殘留的環境變數猜群組成員。要查真正多卡，另外對照每個行程實際選中的裝置與同步結果。

## 小結
留下每個工作行程的來源標籤、全域順位、本機順位與總數。跨節點時再補上不含個人資料的節點代號，才能分出合法重複的本機編號和真正衝突的全域身分。
