---
id: ai-k8s-01-pods
module: ai-k8s
order: 1
title: Pod 與容器生命週期
subtitle: 服務的最小排程單位是什麼
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
- 讀取 Pod 宣告中的容器與映像
- 用階段與容器狀態區分正在排程、啟動中與執行中
tags:
- k8s
- pods
resources:
- title: Kubernetes：Pod 與共用資源
  url: https://kubernetes.io/docs/concepts/workloads/pods/
  kind: doc
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
- title: Kubernetes：Pod 階段與容器狀態
  url: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
  kind: doc
  lang: en
  minutes: 8
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-01-pods-unit
  prompt: Kubernetes 排程的是單一容器還是 Pod？
  answer: 排程器把整個 Pod 指派給同一個節點；裡面的容器不能拆到不同節點。
  mcq:
    question: 同一個 Pod 有兩個一般容器，哪一件事必須成立？
    options:
    - 兩者使用同一個映像
    - 兩者共用根檔案系統
    - 兩者在同一個節點
    - 兩者一定同時就緒
    answer: 2
    explain: 共用的是排程位置與網路等資源，不是映像、根目錄或啟動進度。
- id: ai-k8s-01-pods-phase
  prompt: 看到 Pending 時，怎麼分辨還沒排到節點與已排到但無法啟動？
  answer: 先看 spec.nodeName 或 PodScheduled 條件，再讀容器的 waiting.reason 與事件。
  mcq:
    question: Pod 已有 nodeName，容器顯示 ImagePullBackOff，下一步要看什麼？
    options:
    - 再買一個節點
    - 提高 Service 的連接埠
    - 縮短應用程式回應時間
    - 映像名稱與拉取事件
    answer: 3
    explain: 它已經有節點，問題發生在建立容器之前；應用程式還沒開始服務。
  interview:
    question: 同事說「它是 Pending，一定是機器不夠」。你會給什麼證據？
    points:
    - 先查節點指派
    - 檢查等待原因與事件
    - 分開已知與未知
    answer: 我會先看有沒有 nodeName。有節點又有映像拉取失敗的事件，我會查映像來源；沒有節點才看排程事件。不會只憑 Pending 就擴充機器。
- id: ai-k8s-01-pods-identity
  prompt: 容器重新啟動與建立替代 Pod，各會怎麼影響 Pod 的 UID？
  answer: 同一個 Pod 內重啟容器不換 Pod UID；替代 Pod 是新物件，即使同名也有新 UID。
practice:
- id: ai-k8s-01-pods-p1
  title: 留下一張 Pod 判讀卡
  kind: hands-on
  minutes: 10
  steps:
  - 把範例存成 pod-card.ps1，在 PowerShell 執行。
  - 保留第一次輸出；將 nodeName 留空，並將 containerStatuses 的清單改成空陣列；用「尚未指派」描述第二張卡。
  - 在卡片旁各寫一句「下一個要看的證據」。
  checks:
  - 第一張卡有 pool-a 與 ImagePullBackOff，沒有把問題誤判成缺節點。
  - 第二張清楚標記未指派，並寫明應查排程事件。
---

## 為什麼要學：同樣是沒回應，程式可能還沒開始跑

你交出一個能在 Docker 本機執行的映像，搬到叢集後卻看不到任何應用程式日誌。先別改程式。Kubernetes 不是直接找機器執行一行指令，而是先接受一份物件宣告，再讓不同元件接手。映像寫錯、找不到合適的機器、程式啟動後退出，都會讓使用者等不到回應，但應該找的證據完全不同。

## 核心概念：先看工作單位，再讀 2 層狀態

一座叢集（cluster）包含可執行工作的節點（node）。排程器（scheduler）挑選節點時，搬動的單位是 Pod。最簡單的 Pod 只有一個容器（container）；有時會把需要緊密合作的輔助容器放在一起。它們共用網路位址，可經由本機連線互通，但不會自動共享所有檔案。希望能分別擴充的兩個服務，通常不該放在同一個 Pod。

物件的 `metadata` 辨識它是誰，`spec` 表達要跑什麼，`status` 是系統觀察到的情形。依序讀 `spec.containers` 內的名稱及映像，再找 `spec.nodeName`。有節點名稱代表工作已指派，不代表映像已下載。節點上的代理程式（kubelet）還要準備容器並啟動它。日後即使重建了一個同名 Pod，也要用唯一識別碼（UID）分辨是不是原來的物件。

Pod 階段（phase）像是信封上的摘要。`Pending` 包含等待排程及準備容器；`Running` 也不是保證所有容器都已能接客。往內讀容器狀態（state），才看得到等待、執行或終止及其原因。命令列摘要有時顯示 `ImagePullBackOff`，這是容器等待再次拉取映像的原因，不是另一種 Pod 階段。能否接流量之後在[〈啟動、就緒與存活探針〉](#/lesson/ai-k8s-03-probes)會細講。

## 範例：不必先建叢集，也能判讀一張快照

為Pod 狀態快照建立 `C:\dev\stackway-lab\k8s`。將下列內容存為 `pod-card.ps1`，以 PowerShell 在該目錄執行 `.\pod-card.ps1`。這是教學快照，省略與判讀無關的欄位；不會讀取你的叢集。先遮住最後一行，試著預測先查排程還是先查映像。

```powershell
$pod = @'
{"metadata":{"name":"reader"},"spec":{"nodeName":"pool-a","containers":[{"name":"web","image":"reader:demo"}]},"status":{"phase":"Pending","containerStatuses":[{"state":{"waiting":{"reason":"ImagePullBackOff"}}}]}}
'@ | ConvertFrom-Json
$reason = if (-not $pod.spec.nodeName) { 'not assigned' }
          elseif ($pod.status.containerStatuses.Count -gt 0) {
              $pod.status.containerStatuses[0].state.waiting.reason
          }
"$($pod.spec.containers[0].image) | $($pod.spec.nodeName) | $($pod.status.phase) | $reason"
```

這張卡的關鍵不是背下錯誤字串，而是排除一個猜測：已經分到節點，因此再等排程並不會修好映像。下一份有用的證據是事件中的拉取失敗說明，據此區分名稱不存在或來源暫時無法連線。若沒有節點，也沒有容器狀態可讀，就應該回頭查排程事件，而不是假設程式崩潰。

假如第二次看見相同名稱、不同識別碼，要另開一列紀錄，不要把兩個物件的重新啟動次數相減。相反地，節點、識別碼都沒變，只是容器上一輪已終止，這時去找上一輪的退出原因比追查重新排程更合理。

## 常見錯誤

看到重新啟動次數增加，就說整個 Pod 被換掉，會把時間線接錯。請先比對 UID，再對同一個容器比較重新啟動次數。另一個誤判是只看最後一次畫面：狀態是當下觀察，原因可能已經變了，筆記要保留觀察順序。

## 小結

遇到沒回應的工作，先問「排到哪裡、哪個容器、卡在哪一步」。能從宣告走到證據，比背一串狀態名稱更有用。
