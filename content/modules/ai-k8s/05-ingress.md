---
id: ai-k8s-05-ingress
module: ai-k8s
order: 5
title: Ingress 與入口控制器
subtitle: 讓兩個服務共用同一個入口
status: ready
minutes: 30
level: 3
prereqs:
- ai-k8s-02-service
objectives:
- 將主機名稱與路徑對應到 Service
- 分清宣告規則、入口控制器與實際流量的責任
tags:
- k8s
- ingress
resources:
- title: Kubernetes：Ingress 的規則與路徑類型
  url: https://kubernetes.io/docs/concepts/services-networking/ingress/
  kind: doc
  lang: en
  minutes: 8
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-05-ingress-rule
  prompt: Ingress 的一條 HTTP 路由至少要把哪些條件連到哪個後端？
  answer: 先比對可選的主機名稱及路徑規則，再送至指定的 Service 名稱與服務埠。
  mcq:
    question: 後端服務的 port 是 80、targetPort 是 8080，Ingress 的 backend.service.port 要填哪個？
    options:
    - 8080，因為一定跳過 Service
    - 443，因為入口可能使用 HTTPS
    - 80，因為後端在此指向 Service
    - 任一可用的節點埠
    answer: 2
    explain: 規則引用的是服務提供的埠，不是後端容器監聽埠，也不是外部入口埠。
- id: ai-k8s-05-ingress-prefix
  prompt: Prefix 規則 /api 會不會符合 /apix？
  answer: 不會。Prefix 以斜線分隔的路徑元素比對，不是任意字串開頭。
  mcq:
    question: 規則只有 /api 與 /，兩者都是 Prefix，哪個路徑選到 /api？
    options:
    - /apix
    - /apiary
    - /v1/api
    - /api/jobs
    answer: 3
    explain: 路徑要從第一個元素開始符合；同時符合時較長的路徑優先。
- id: ai-k8s-05-ingress-controller
  prompt: 為何寫好 Ingress 檔案，仍可能沒有流量入口？
  answer: 規則不是執行中的代理；需要負責該類別的控制器配置實際入口，還要有可達的位址。
  interview:
    question: 看到 Ingress 物件建立成功，如何確認兩個服務真的可達？
    points:
    - 核對類別與控制器
    - 對同一入口測主機及兩條路徑
    - 核對服務端點與回應內容
    answer: 我會先找負責這個類別的控制器，再帶正確主機名稱測首頁和 API。兩條都應回到各自的內容；看到物件存在或只測 IP 並不能證明路由正確。
practice:
- id: ai-k8s-05-ingress-p1
  title: 做一張入口路由驗收單
  kind: hands-on
  minutes: 11
  steps:
  - 另存入口規則為 reader-ingress.yaml，確認有 2 個 backend。
  - 在 ingress-check.txt 寫下正確主機的 /、/api/jobs、/apix，以及不同主機的 /api/jobs。
  - 先填預測再對照正文，將「沒命中規則」和「後端故障」分別註記。
  checks:
  - 4 列依序為 site、jobs、site、未命中本規則。
  - 我有註明清單不證明控制器、網域名稱或後端可達。
---

## 為什麼要學：網址不變，卻有 2 個服務在回答

預約首頁由頁面服務回應，查詢空位交給資料服務。使用者不需要知道這兩套服務的內部名稱，也不用把連接埠加進書籤。入口規則（Ingress）描述外部 HTTP 請求應該交給哪個服務。與上一堂的 Service 不同，這一層看得懂主機名稱與路徑，不只是某個埠後面有哪些 Pod。

## 核心概念：把規則、控制器、流量分開

規則放在 Kubernetes API；入口控制器（Ingress controller）監看它負責的入口類別（IngressClass），依照規則配置代理或負載平衡器。真正接下連線的是配置好的入口。控制器和代理在不同實作可能同時或分開運作，不能認定每個請求都要先經過 Kubernetes API。沒有控制器接手時，規則能被保存，卻不會憑空出現對外位址。

收到請求時先看主機名稱，再看路徑。精確比對（Exact）需要整條路徑相同；前綴比對（Prefix）以斜線分隔的元素為單位。多條規則都符合時先選較長的路徑，同長時精確優先。下面以本機教學名稱為例，不需要註冊網域。規則不會替你建立名稱解析，也不保證自動取得憑證。

## 範例：從 4 個網址反推要測哪一層

在 `C:\dev\stackway-lab\k8s` 存成 `reader-ingress.yaml`，在 PowerShell 執行 `Select-String -Path reader-ingress.yaml -Pattern 'backend:'` 應列出 2 個後端。此處是規則閱讀練習；`lab` 是假設的類別，同一命名空間中還需有相符服務才可能送達。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: {name: reader}
spec:
  ingressClassName: lab
  rules:
    - host: reader.test
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend: {service: {name: jobs, port: {number: 80}}}
          - path: /
            pathType: Prefix
            backend: {service: {name: site, port: {number: 80}}}
```

同一主機的首頁走 `site`；查詢 `/api/jobs` 同時符合兩條，選較長的 `/api`，走 `jobs`。`/apix` 看似也以同樣字母開頭，但第一個路徑元素不是 `api`，所以回到首頁那條。若換了主機名稱，以上規則都不命中；實際回應仍取決於入口的預設後端，不能武斷寫成一個固定狀態碼。

驗收表不要只寫「成功」：給 2 個後端各 1 個可辨認的回應，例如首頁有標題、資料服務有工作清單欄位。即使兩份回應都是成功狀態，也可能是較寬的規則吞掉較窄的路徑。再用一個看來相近但不應命中的路徑做對照。若失敗只集中在同一主機的資料路徑，名稱解析與入口連線已經有部分證據，不必立刻把所有層都當成嫌疑；先核對那條後端服務是否有就緒端點，以及是否仍期待完整路徑。

## 常見錯誤

測試只輸入 IP，看見預設頁面便判定資料服務壞了。先確認請求帶的主機名稱，再檢查入口和服務的對應。另一個誤會是以為選了 `/api` 就會自動剝掉這段路徑；基礎規則只負責挑後端，改寫與否要看實作與明確設定。若後端原本就接收完整路徑，不必加改寫。

## 小結

遇到入口故障先辨別「連不到入口、規則沒命中、命中但後端不能服務」。Ingress API 仍可用，但功能已凍結；新平台可另外評估 Gateway API，不必為了讀懂現有系統先學兩套設定。
