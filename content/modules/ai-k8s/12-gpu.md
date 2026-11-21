---
id: ai-k8s-05-gpu
module: ai-k8s
order: 12
title: GPU 裝置外掛與排程
subtitle: 有卡為什麼還是排不到
status: ready
minutes: 35
level: 3
prereqs:
- ai-k8s-11-operators
objectives:
- 說明裝置外掛如何公告擴充資源，與 GPU Operator 管理整套元件的差別
- 核對節點公告的 GPU 資源與工作請求
- 在無卡環境說明待排程是預期結果
tags:
- k8s
- gpu-scheduling
resources:
- title: Kubernetes：排程 GPU 工作
  url: https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/
  kind: doc
  lang: en
  minutes: 8
  required: false
  checked: '2026-11-20'
- title: NVIDIA：GPU Operator 的責任
  url: https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/overview.html
  kind: doc
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-05-gpu-advert
  prompt: 機器插了 GPU，為什麼排程器仍可能看不到可分配的卡？
  answer: 裝置要能被驅動及外掛辨認，並由節點對外公告為擴充資源；硬體清單不等於排程帳本。
  mcq:
    question: GPU 型號標籤存在，但 allocatable 沒有 nvidia.com/gpu，能僅靠標籤滿足請求嗎？
    options:
    - 能，標籤代表至少 1 張可分配
    - 不能，標籤不能代替數量公告
    - 能，只要 CPU 足夠
    - 能，調高記憶體上限就好
    answer: 1
    explain: 標籤是篩選條件，排程仍須有同名資源的可用數量。
- id: ai-k8s-05-gpu-quantity
  prompt: 傳統整卡模式下，同時寫 GPU request 與 limit 時數量應如何填？
  answer: 兩者須相等且為整數；可只寫 limit，系統以相同數量當作 request。
  mcq:
    question: 在整卡示例中，哪一組有效？
    options:
    - 只寫 requests 為 1
    - requests 為 1、limits 為 2
    - 只寫 limits 的 nvidia.com/gpu 為 1
    - limits 為 0.5
    answer: 2
    explain: 此處的擴充資源不能像 CPU 一樣超額配置或要求半張。
- id: ai-k8s-05-gpu-operator
  prompt: GPU Operator 和裝置外掛各負責哪個層次？
  answer: Operator 協調驅動、容器整合、外掛等元件生命週期；外掛向節點註冊裝置，參與公告及分配。
  interview:
    question: 無卡教室的 GPU Pod 一直 Pending，要怎麼驗收這堂練習？
    points:
    - 核對工作請求的完整資源鍵
    - 比對節點公告與已分配量
    - 說明預期待排程及證據界限
    answer: 我先確認它要求哪種卡，再逐節點算同名資源餘額。示例中沒有卡就不該通過；這能驗收排程推理，但不能當成已測過驅動或真的執行了推論。
practice:
- id: ai-k8s-05-gpu-p1
  title: 留下無卡、滿卡、有卡三張排程收據
  kind: hands-on
  minutes: 12
  steps:
  - 在 PowerShell 執行 gpu-fit.ps1，將輸出存成 gpu-fit.txt。
  - 把第三列已承諾量改成 2，再跑一次，標出由可排變不可排的原因。
  - 為收據加上「整卡、無共享、只查 GPU 條件」及下一個要查的節點欄位。
  checks:
  - 原始快照只有 free 符合；改值後 3 台都不符合。
  - 收據沒有把模擬結果寫成實機推論成功。
---

## 為什麼要學：機房有卡，工作仍在排隊

一個推論工作要求 1 張圖形處理器（GPU）。機房盤點表上明明有 2 張，工作卻一直待排程。人的盤點通常是實體總數；排程器看的是節點公告、能分配給工作的種類與數量，以及其中已有多少被別的工作預約。把這幾本帳混為一談，最容易在完全不缺硬體時買錯解法。

## 核心概念：從硬體到工作，中間有幾次交接

傳統裝置外掛（device plugin）在節點上發現並向節點代理程式註冊裝置，也參與容器啟動時的裝置分配。節點因此能在狀態中公告擴充資源（extended resource），例如 `nvidia.com/gpu`。排程器不用猜卡的型號或自己掃描硬體；它比對工作需要的完整資源鍵與節點可分配量。在整卡、沒有共享的例子中，2 張已承諾給別的工作，即使此刻使用率是 0，也沒有剩餘名額。

GPU Operator 是更上層的維運控制器。依平台設定，它能協調驅動、容器執行整合、裝置外掛及監控等元件。它不是每次挑選 Pod 去哪台機器的排程器，也不是多裝一套就會多一張卡。這堂只談外掛公告的傳統整卡模式；分割或共享卡的資源名稱、粒度與隔離條件可能不同，不能把整卡算法直接套上去。

## 範例：逐節點核銷，而不是全叢集加總

工作容器在 `resources.limits` 寫 `nvidia.com/gpu: 1` 就能表達需要 1 張；若同時寫請求，數量要一致，不能只寫請求不寫上限。在 `C:\dev\stackway-lab\k8s` 存成 `gpu-fit.ps1`，用 PowerShell 執行 `.\gpu-fit.ps1`。這是人造的節點快照，不需要顯示卡或叢集。「未公告」在本試算中視同該鍵可分配 0 張。

```powershell
$nodes = @'
node,allocatable,requested
cpu,0,0
busy,1,1
free,2,1
'@ | ConvertFrom-Csv
foreach ($n in $nodes) {
    $left = [int]$n.allocatable - [int]$n.requested
    "$($n.node): left=$left fits=$($left -ge 1)"
}
```

第一台沒有對應資源，第二台公告過但已用完；只有第三台符合這個條件。若工作要求 2 張，不能把不同機器的餘額拼湊成同一個 Pod 的裝置。把第二台和第一台寫成「都沒卡」也太粗略：前者可等待既有工作結束，後者則要先釐清原本是否預期有硬體及其支援元件。

交接時也應把「可分配量」和「尚未被請求的餘額」分欄；看到節點公告 2 張不代表現在還能接 2 份新工作。若使用者另外限定某一種型號，先找出符合標籤的節點，再對那幾台做餘額運算。型號符合但沒有額度，與額度足夠但型號不符，後續能採取的安排不同。

可將下面的容器設定片段存為 `gpu-container.yaml` 與收據並排。它在 Pod 的 `spec.containers` 清單中使用；映像名稱是示意，不必下載或執行。驗收時把完整的 `nvidia.com/gpu` 與節點公告的鍵逐字對照，不要只在兩邊都找得到「GPU」三個字母就算通過。

```yaml
name: worker
image: inference:lab
resources:
  limits:
    nvidia.com/gpu: 1
```

## 常見錯誤

在無卡環境看到工作等待，就移除 GPU 需求，接著把普通容器啟動當成 GPU 驗收成功。那是改了問題。應保留原本條件，指出節點沒有同名資源，待排程才是符合預期的答案。真的上機驗收還要檢查分配後容器能否使用裝置，完成一次有可核對輸出的運算，不能只看排程成功。

## 小結

說「沒排到」時附上資源鍵、逐節點餘額和觀察範圍。判斷出公告缺席、額度已滿或還有容量，比籠統回報「平台不支援 GPU」更有用。
