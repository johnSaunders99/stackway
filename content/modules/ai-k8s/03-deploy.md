---
id: ai-k8s-03-deploy
module: ai-k8s
order: 3
title: Deployment 與副本
subtitle: 刪掉一個副本後誰會補回來
status: ready
minutes: 35
level: 3
prereqs:
- ai-k8s-01-desired
objectives:
- 辨識 replicas、selector 與範本的關係
- 追蹤滾動更新時新舊 ReplicaSet 的副本數
tags:
- k8s
- deploy
resources:
- title: Kubernetes：Deployment 的更新策略
  url: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
  kind: doc
  lang: en
  minutes: 10
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-03-deploy-match
  prompt: Deployment 的 selector 必須和哪一組標籤相符？
  answer: 必須選得到自己 Pod 範本的標籤；部署物件本身的名稱不能代替這個條件。
  mcq:
    question: 哪項改動會使新宣告的 selector 與範本不相容？
    options:
    - 只把範本內 app 的值改成別的名稱
    - 在範本增加非必要的 team 標籤
    - 把副本從 2 改為 3
    - 修改部署物件的說明註記
    answer: 0
    explain: selector 要求的鍵值必須存在於範本，額外的標籤不妨礙相符。
- id: ai-k8s-03-deploy-rollout
  prompt: 改副本數和改 Pod 範本，哪個會觸發 Deployment 的新版本推出？
  answer: 改範本，例如改映像，會觸發推出；只改副本目標是擴縮，不會因此建立新範本版本。
  mcq:
    question: 保持同一份範本，只把 replicas 從 2 改成 4，代表什麼？
    options:
    - 一定產生新映像
    - 擴充同一版本
    - 修改 Service 的標籤
    - 每個 Pod 的容量加倍
    answer: 1
    explain: 副本數決定份數，不改程式內容、單份資源或服務選取條件。
- id: ai-k8s-03-deploy-availability
  prompt: 為什麼更新中要分開看新舊副本數與可用數？
  answer: 建立新物件不保證它已就緒；舊副本何時能縮取決於策略和可用狀態。
  interview:
    question: 更新時看到新 Pod 已建立但舊 Pod 還在，你會判定失敗嗎？
    points:
    - 看更新策略
    - 分開新副本與可用副本
    - 根據事件找停滯原因
    answer: 不一定。若不允許降低可用數，舊副本要等新副本能服務才退。我會查新副本的就緒狀態與事件，不會只為了讓數字好看就移除舊副本。
practice:
- id: ai-k8s-03-deploy-p1
  title: 保存 2 代副本的交接紀錄
  kind: hands-on
  minutes: 12
  steps:
  - 建立示範 YAML 並標出 selector 和範本中成對的 app 鍵。
  - 在 rollout.txt 列出正文交接過程的舊版數、新版數、新版可用數。
  - 再寫一列「新版始終無法就緒」並指出哪個動作不應發生。
  checks:
  - 起點和終點都是 2 個可用副本，中途有 1 列共 3 個。
  - 我能指出新版已建立但不能縮掉舊版的那一列。
---

## 為什麼要學：新版本還不會接客，舊版本該走了嗎？

同一個服務有 2 份。只把副本全部關掉再開新版，數量最終會回到 2，但中間每個請求都可能失敗。部署物件（Deployment）讓你描述一份可替換的工作範本，再交由控制器逐步交接。讀更新的重點不只是映像標籤改了沒有，而是新舊兩組在何時各自承擔流量。

## 核心概念：認清範本、歸屬與份數

`replicas` 是目標份數；選取條件（selector）描述要管理哪一群 Pod；`template` 是建立每個 Pod 的範本。範本有自己的標籤（label），必須滿足選取條件。最上層 `metadata.name` 是部署物件的名字，不拿來代替範本標籤。同一個應用可以附加版本標籤供觀察，但用來認出整個服務的標籤應跨版本保持穩定。

部署控制器協調副本集（ReplicaSet），副本集再管理各個 Pod。修改範本中的映像是換版本；調整份數是同一版本的擴縮。滾動更新（rolling update）能限制暫時多出的份數以及容許不可用的份數。多出的名額需要真實容量；如果新副本排不上去，再完美的交接策略也不會憑空提供機器。

## 範例：把更新畫成 4 個時刻

在 `C:\dev\stackway-lab\k8s` 存為 `reader-deploy.yaml`。它是可閱讀的完整宣告，本課不需要套用到叢集。在 PowerShell 用 `Select-String -Path reader-deploy.yaml -Pattern 'app: reader'` 找出認領條件與範本標籤，應有 2 行。範例映像僅用來標示版本。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: reader
spec:
  replicas: 2
  selector:
    matchLabels: {app: reader}
  strategy:
    type: RollingUpdate
    rollingUpdate: {maxSurge: 1, maxUnavailable: 0}
  template:
    metadata:
      labels: {app: reader}
    spec:
      containers:
        - {name: web, image: "nginx:stable"}
```

假設舊版 2 個都可用，把範本換成另一個已核准的固定映像。先在紙上寫「舊 2、新 0」。允許多 1 個，就可以到「舊 2、新 1、新可用 0」。此時舊版不能少，因為容許缺少的可用數是 0。等新版可用才縮舊版，再一次補新、等可用、縮舊，直到「舊 0、新 2、新可用 2」。這是一條可能的路徑，不是每次查詢都會剛好看見每一步；終止中的容器也可能暫時占用資源。

換個角度當值班者：如果 2 組各有 1 個可用，外加 1 個還在等待，你會先追哪一組？先核對等待的 Pod 來自哪個範本，才知道這是舊版原有故障，還是新版尚未準備完成。請把「期望總量、分代數量、目前可用量」分成三欄。有人問能否下線一台機器時，這三欄比單一總數更能回答風險，不會把正在準備的備用位置當作可以交付的容量。

想比對 Deployment 欄位且已有 kubectl，可在本機預演；以下只輸出宣告，不部署副本：

```powershell
kubectl create deployment reader --image=nginx:stable --replicas=2 --dry-run=client -o yaml
```

比對產物的副本數、選取條件與範本標籤。這個指令沒有指定本課的更新策略，因此不能期待它產生完全相同的檔案。

## 常見錯誤

用相同映像標籤覆蓋遠端內容，卻期待叢集看到內容改了就自動推出。若範本字面上沒有變化，不能據此期待新版本交接。正式交付用不可變的映像摘要或受控版本標籤，回頭才辨認得出當時是哪個成品。另一個陷阱是在更新中手改副本集份數；上層部署仍有自己的目標，可能再次調整它。

## 小結

把部署讀成三個問題：它認領誰、每份長什麼樣、換版時能不能少一份。檔案能回答前兩題，最後一題要把策略和實際可用狀態放在一起看。
