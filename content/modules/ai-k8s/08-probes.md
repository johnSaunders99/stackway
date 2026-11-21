---
id: ai-k8s-03-probes
module: ai-k8s
order: 8
title: 啟動、就緒與存活探針
subtitle: 活著不代表準備好
status: ready
minutes: 30
level: 3
prereqs:
- ai-k8s-07-volumes
objectives:
- 區分啟動、就緒與存活檢查
- 說明哪一種失敗應停止分流而非重啟
tags:
- k8s
- probes
resources:
- title: Kubernetes：啟動、就緒與存活探針
  url: https://kubernetes.io/docs/concepts/workloads/pods/probes/
  kind: doc
  lang: en
  minutes: 9
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-03-probes-startup
  prompt: 設定 startupProbe 時，另外兩種探針何時開始？
  answer: 等該容器的啟動探針成功才執行存活與就緒探針，讓初始化有明確的容許時間。
  mcq:
    question: 模型偶爾需要較久載入，但啟動後應快速發現卡死，適合怎麼設計？
    options:
    - 永遠關掉所有檢查
    - 以獨立啟動探針容許暖機
    - 把就緒成功當作自動延長啟動時間
    - 把每次存活檢查都延到數分鐘後
    answer: 1
    explain: 啟動與穩定執行需要不同的判斷時間，不必為了暖機犧牲後續反應速度。
- id: ai-k8s-03-probes-ready
  prompt: 就緒探針失敗和存活探針失敗，達門檻後的處置有何不同？
  answer: 前者讓 Pod 不承接一般服務流量但保留容器；後者使 kubelet 重啟該容器，依重新啟動政策處理。
  mcq:
    question: 暫時不能服務，但重新啟動無助於恢復，應優先讓哪一個檢查失敗？
    options:
    - 存活探針
    - 節點容量檢查
    - 就緒探針
    - 映像拉取檢查
    answer: 2
    explain: 停止分流可以保住行程與診斷資料；不必要的重啟可能延長故障。
  interview:
    question: 共享資料庫短暫變慢，為什麼不讓所有副本的存活檢查都查它？
    points:
    - 重啟不能修復共享依賴
    - 可能同步丟失可用容量
    - 以就緒或降級策略處理
    answer: 如果程式自己仍能前進，重啟每一份只會讓它們一起暖機。我會分開檢查本身是否卡死與能否提供必要服務，並確認依賴失效時還有沒有可用的降級路徑。
- id: ai-k8s-03-probes-threshold
  prompt: failureThreshold 是秒數還是次數？
  answer: 是判定失敗所需的連續失敗次數，搭配 periodSeconds 等參數估計時間，不能當作精準時刻。
practice:
- id: ai-k8s-03-probes-p1
  title: 留下三種探針的處置時間線
  kind: hands-on
  minutes: 10
  steps:
  - 存下 probe-policy.yaml，從中讀出啟動探針的週期與次數。
  - 在 probe-log.txt 寫下暖機、就緒失敗、就緒恢復、存活連敗 3 次這 4 列。
  - 每列預測是否接一般流量、是否應重啟，並圈出第一次可能重啟的位置。
  checks:
  - 暖機中的容器不會同時被存活探針判死。
  - 就緒恢復不需要重啟；達門檻的存活失敗與它不同。
---

## 為什麼要學：暖機很慢，不等於已經卡死

推論服務把模型載入記憶體要花時間。這時行程存在，卻不能正確回答請求。若系統太早送流量，第一批使用者會收到錯誤；若系統每隔幾秒就因「還沒載好」而重啟，模型則可能永遠載不完。探針（probe）的關鍵是檢查失敗後想採取什麼動作，而不是替同一個網址取三個名字。

## 核心概念：先決定動作，再設計要問的問題

啟動探針（startup probe）回答「初始化完成了嗎」。在它成功以前，同一容器的就緒與存活探針先不執行；這給慢啟動明確的容許時間。成功後這一輪啟動檢查便結束。若一直達不到條件直到失敗門檻，節點會終止容器並依政策重新啟動。它不是允許壞程式無限等待的開關。

就緒探針（readiness probe）回答「現在能把新請求交給我嗎」。失敗會改變就緒狀態，一般服務不再把它當成可用端點，但不會只因這件事重啟。存活探針（liveness probe）回答「這個行程是否已經無法自行恢復」。達到失敗門檻就會觸發容器重啟處置。讓存活檢查依賴所有外部系統，會把一次共用依賴故障放大成整群重啟。

## 範例：讀懂檢查政策，而不是猜秒數

在 `C:\dev\stackway-lab\k8s` 把以下容器設定片段存成 `probe-policy.yaml`，用 PowerShell 執行 `Select-String -Path probe-policy.yaml -Pattern 'Probe:|Threshold:'`。片段屬於 `spec.containers` 裡的一個項目；假設應用程式在 8080 埠實作了這三個端點。單獨的片段不是可提交的 Pod。

```yaml
name: model
image: model:lab
startupProbe:
  httpGet: {path: /started, port: 8080}
  periodSeconds: 5
  failureThreshold: 24
readinessProbe:
  httpGet: {path: /ready, port: 8080}
  periodSeconds: 5
  failureThreshold: 1
livenessProbe:
  httpGet: {path: /live, port: 8080}
  periodSeconds: 10
  failureThreshold: 3
```

啟動檢查容許的量級約是 120 秒，這不是保證精準到秒的時鐘。現在假設啟動探針已成功，模型稍後因切換索引而暫時不能接客。`/ready` 回傳失敗，`/live` 仍成功，正確的故事是「暫停分流，行程仍在」。切換結束後就緒恢復，服務可以再把它列為目的地，無須重做整段模型載入。

在時間線旁再加一欄「目前受影響的是誰」。就緒失敗主要改變新請求的去向，不表示已經進行中的交易都會被安排到另一份副本繼續。存活失敗則可能中止這個容器正在做的工作；若工作不能安全重試，就更要確認失敗條件真的代表行程卡死。把這兩種代價先寫下來，才能向別人解釋為什麼同一個短暫故障不應觸發兩種相同的強制動作。

## 常見錯誤

拿首頁當存活檢查，首頁卻會查一個慢速資料庫，等於把外部延遲直接接上重啟開關。另一個極端是每個端點都永遠回成功；那只是測到網路連得通，排不掉載入失敗的副本。檢查本身要輕，成功條件要能對應處置。單機重啟試驗不等同於驗證真實叢集的流量切換時間。

## 小結

把探針翻成動詞：等啟動、停分流、重啟容器。若你不能解釋失敗後為什麼要做那個動作，就還沒找到合適的檢查條件。
