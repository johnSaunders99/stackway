---
id: ai-cluster-01-inventory
module: ai-cluster
order: 1
title: 裝置驅動與 GPU 管理
subtitle: 一張卡不是一個完整執行環境
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 辨識驅動、裝置外掛與 GPU Operator 的責任
  - 比對宣告容量與工作可見容量
tags:
  - cluster
  - inventory
resources:
  - title: Kubernetes：宣告與排程 GPU
    url: https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: NVIDIA GPU Operator：元件分工
    url: https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/overview.html
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-cluster-01-inventory-plugin
    prompt: 誰把可供分派的裝置登記給節點代理程式？
    answer: 裝置外掛。
    mcq:
      options:
        - 主機驅動直接把每張卡設為 Pod 的資源請求
        - 裝置外掛
        - 由排程器掃描每個容器內的可見裝置自行登記
        - 應用程式框架在模型載入後公布節點容量
      answer: 1
      explain: 驅動讓主機能交談；外掛將裝置以平台能排程的資源公布。
  - id: ai-cluster-01-inventory-limit
    prompt: 節點 allocatable 為 4，能直接斷言剩 4 張空卡嗎？
    answer: 不能，還要看已分配資源。
    mcq:
      options:
        - 能，可配置量已扣除所有執行中的申請
        - 能，它就是每個容器可見的剩餘數
        - 不能，還要看已分配資源
        - 能，只要節點仍健康就不用看已分派量
      answer: 2
      explain: 可配置量是上限，不是即時餘額。
  - id: ai-cluster-01-inventory-visible
    prompt: 工作已獲配 1 張但容器顯示 0 張，下一步優先查哪裡？
    answer: 分配到容器可見裝置之間的執行環境。
    mcq:
      options:
        - 先調大模型輸入上限，以免容器查不到卡
        - 只看節點總卡數，只要大於 0 就忽略工作視角
        - 把工作要求改為整台節點的卡數再判斷
        - 分配到容器可見裝置之間的執行環境
      answer: 3
      explain: 已有分配證據，應沿下一段追查，而不是從模型大小猜起。
    interview:
      question: 平台有 4 張卡，容器只看見 1 張，是故障嗎？
      points:
        - 核對綁定與申請
        - 分清節點和容器視角
        - 再測實際工作
      answer: 我會先看這筆工作要求並獲配幾張。若獲配 1 張且能在那張卡上完成小運算，看到 1 張是合理隔離，不會要求把整台節點暴露給它。
  - id: ai-cluster-01-inventory-operator
    prompt: GPU Operator 和 Kubernetes 排程器各負責哪件事？
    answer: 前者協調驅動、外掛等 GPU 軟體元件；後者依資源請求與節點條件決定工作落點。管理元件不等於替每筆工作選卡。
practice:
  - id: ai-cluster-01-inventory-p1
    title: 製作三層裝置盤點單
    minutes: 10
    kind: code
    steps:
      - 保存腳本，在盤點單分列主機、可配置、已分配和可見
      - 替 A、B 各寫出下一份要取的證據
    checks:
      - 不把 A 的未分派寫成容器 0 卡
      - 能解釋 C 為何不是少了 3 張
---
## 為什麼要學：機房有卡，工作卻說找不到
一台節點插了 4 張卡，排程畫面也看得到 GPU，容器裡卻看不到可用裝置。這三個敘述不必互相矛盾：它們量的是不同層。盤點不是抄一個總數，而是把「主機認得到、平台能分派、這筆工作用得到」各自對到一份證據，找出第一個對不上的位置。

## 核心概念：每一層回答一個問題
驅動程式（driver）讓作業系統能與實體裝置溝通。裝置外掛（device plugin）向節點代理程式登記可供分派的裝置，讓 Kubernetes 能以擴充資源（extended resource）排程，例如整卡模式下的 `nvidia.com/gpu`。容器執行環境還要能把獲配裝置及必要介面交給工作，模型程式才有機會使用。

GPU Operator 是用來協調安裝與維護驅動、外掛、容器工具等元件的控制器，不是替每一筆工作選節點的排程器。採用主機既有驅動時，管理方式也可能不同。先看該叢集的設定，再談哪個元件負責修；看不到卡不等於要在每個應用容器內自行安裝主機驅動。

在節點狀態中，容量（capacity）與可配置量（allocatable）不是同義詞。後者是可供工作配置的上限，不是扣掉正在使用量後的剩餘格。就算全節點有 4 張卡，一個只要求 1 張的容器通常也只應看到分配給它的裝置。這裡只看整卡，下一堂[〈MIG 分割與時間切片〉](#/lesson/ai-cluster-02-sharing)才處理一張卡對多個名額。

## 範例：在盤點表上找第 1 個斷點
為節點清冊建立 `C:\dev\stackway-lab\cluster`。建立 `inventory.py`。把硬體存在、驅動可見和排程可用拆成不同欄位。哪一欄有值，都不能單獨替其他欄位簽收。

在該目錄執行：Windows PowerShell 用 `py inventory.py`；macOS／Linux 用 `python3 inventory.py`。

```python
rows = [("A",4,0,0,None), ("B",4,4,1,0), ("C",4,4,1,1)]
for node, host, allocatable, assigned, visible in rows:
    if host and not allocatable:
        next_check = "registration/health"
    elif assigned and visible != assigned:
        next_check = "runtime/device mapping"
    else:
        next_check = "counts match"
    print(node, next_check)
```

第一列要看主機到外掛登記這段，第二列要看分配後的容器裝置映射與執行環境；第三列數量符合這筆工作，不代表整台卡都在它手上。這些是人工提供的快照，沒有查詢真實叢集，也沒有量運算正確性。下一步的證據應和失配層相符，而不是一律要求重新部署。

### 判讀一張沒有餘額的表
假設可配置總量是 4，2 個執行中的工作分別獲配 2 和 1。新工作要求同節點 2 張，就算畫面上的可配置量仍寫 4，它也不能靠剩下的 1 張啟動。這時已有工作的容器可見量完全正常，重裝驅動不會多出一個名額。把需求也寫在快照上，才能分辨這是一筆合法的等待，而不是裝置遺失。

## 常見錯誤
把排隊中的工作當成「已分配但看不到卡」。應先確認工作已被排程、已有裝置分配，才有容器內可見量可查。若尚未分派，就查資源請求、型號標籤與節點條件；若已有分派且數量吻合，模型仍不能跑，才核對框架與驅動相容性。

## 小結
留下同一時刻、同一節點、同一工作對應的資源名稱和數量。推理到哪一層就停在哪一層；「看到 1 張」能證明可見性，不等於這張卡已成功完成過模型推論。
