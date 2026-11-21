---
id: ai-k8s-02-service
module: ai-k8s
order: 4
title: Service 與標籤選取
subtitle: 服務位址與短命的 Pod
status: ready
minutes: 30
level: 3
prereqs:
- ai-k8s-03-deploy
objectives:
- 畫出標籤選取與流量目的地
- 用沒有相符標籤的案例解釋空端點
tags:
- k8s
- service
resources:
- title: Kubernetes：Service、選取條件與端點
  url: https://kubernetes.io/docs/concepts/services-networking/service/
  kind: doc
  lang: en
  minutes: 9
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-02-service-select
  prompt: Service 與 Pod 不同名時，怎麼知道流量會選到誰？
  answer: 在相同命名空間內比對 Service 的 selector 與 Pod 標籤，再確認端點是否就緒。
  mcq:
    question: 選取條件是 app=reader、tier=api，哪一個 Pod 會被選中？
    options:
    - 只有 app=reader
    - 同時具有這兩個鍵值且多一個 zone 標籤
    - 只有 tier=api
    - 名稱叫 reader-api 但沒有標籤
    answer: 1
    explain: 所有指定鍵值都須相符，多出的標籤無妨；名字不是比對條件。
- id: ai-k8s-02-service-ports
  prompt: Service 的 port 與 targetPort 各是哪一端？
  answer: port 是呼叫者連到服務的連接埠；targetPort 是轉送至後端 Pod 時使用的連接埠。
  mcq:
    question: 服務收 80，程式只聽 8080，應如何設定？
    options:
    - port 8080、targetPort 80
    - 2 個都必須是 80
    - port 80、targetPort 8080
    - 把 Pod 名稱改成 8080
    answer: 2
    explain: 連接埠可以不同；目的地必須是程式真的監聽的位置。
- id: ai-k8s-02-service-empty
  prompt: 能解析服務名稱，為什麼仍可能沒有可用後端？
  answer: 名稱代表服務入口，不代表已有相符且就緒的端點；應檢查標籤、範圍及端點條件。
  interview:
    question: Service 有位址卻無法連到新版，你會按什麼順序查？
    points:
    - 查相同命名空間與標籤
    - 查端點及就緒條件
    - 核對 targetPort 與監聽埠
    answer: 我先確認 Service 看得到新版的標籤，再看端點是否就緒。有就緒端點才查後端監聽埠；只測到名稱可解析還沒測到應用程式。
practice:
- id: ai-k8s-02-service-p1
  title: 保存一張能解釋空端點的流量圖
  kind: hands-on
  minutes: 10
  steps:
  - 執行範例，把 3 個 Pod 寫在 service-map.txt 的右側。
  - 畫出從服務的 80 埠到可用 Pod 的 8080 埠的一條線。
  - 將篩選值 reader 改成 readers 重跑，記錄空清單與原因。
  checks:
  - 初始版僅 p1 可以接一般流量，p2 是相符但未就緒。
  - 第 2 版不必改 Pod 或連接埠就能產生空清單。
---

## 為什麼要學：新版換了位址，呼叫者不該跟著改

上一堂做完滾動更新，原來的 Pod 已經不在。若前端在設定中記住舊 Pod 的網路位址，即使新版服務正常，請求還是會跑錯地方。服務物件（Service）提供一個相對穩定的入口。呼叫端記住服務名稱與連接埠，由叢集維護後端的更替。服務不是另一份應用程式，也不負責把故障的 Pod 補回來。

## 核心概念：畫 2 次篩選，再畫連接埠

假設使用一般的叢集內服務（ClusterIP），沒有特別發布未就緒端點。先看命名空間（namespace），這是把資源分組的範圍，再看 `spec.selector` 要求的標籤。具有全部指定鍵值的 Pod 才相符。命名空間外即使有完全相同的標籤，也不會因此進入這個服務。控制器把後端位址、埠及狀態整理在端點片段（EndpointSlice），供流量轉送機制使用。

標籤選得到，和現在能不能接流量，是兩個問題。端點可以出現在清單裡，卻標記為未就緒。一般流量應送往可用端點；不要把「有一列」當作「已有服務品質保證」。就緒判斷怎麼來，之後在[〈啟動、就緒與存活探針〉](#/lesson/ai-k8s-03-probes)會細講。最後才查 `port` 與 `targetPort`：前者是入口，後者是到達 Pod 時的埠。改其中一端不會自動改應用程式監聽的位置。

## 範例：在本機重播一次選取

在 `C:\dev\stackway-lab\k8s` 將下列程式存成 `service-map.ps1`，用 PowerShell 執行 `.\service-map.ps1`。資料是同一命名空間內的快照，不模擬網路連線。把第一行當作抄自服務宣告的條件，下面三列則是觀察，不是你希望的目標。

```powershell
$selector = 'reader'
$pods = @'
name,app,ready
p1,reader,yes
p2,reader,no
p3,index,yes
'@ | ConvertFrom-Csv
$selected = @($pods | Where-Object app -eq $selector)
$usable = @($selected | Where-Object ready -eq 'yes')
"matched=$($selected.Count) usable=$($usable.Count) targets=$($usable.name -join ',')"
```

輸出中的相符數是 2，可用數只有 1。若改為 `readers` 則兩者都是 0。這時改連接埠不會幫忙，因為根本沒選到目的地。反過來，若有可用端點但程式其實只聽另一個埠，標籤就不是第一個要改的地方。兩種故障在瀏覽器上可能都像「打不開」，但流量圖會把斷點分開。

把圖畫得更精確一些：在左側畫一個代表呼叫端的方框，連到服務的名稱和入口埠；在右側把相符但未就緒的 Pod 畫成虛線，而不是把它從紙上擦掉。當新版剛開始暖機，虛線可能稍後變成實線；若鍵值拼錯，等再久也不會相符。這張圖也能回答「已經找到一個健康副本，為什麼另一個沒流量」：先看第二份有沒有入選，再問就緒狀態，不能預設服務會平均分配到所有同名應用程式。

若有 kubectl，在同目錄預演 Service，找出 selector 與 port；不會建立線上服務：

```powershell
kubectl create service clusterip reader --tcp=80:8080 --dry-run=client -o yaml
```

請在產物中找出三個值：選取的標籤是 reader、服務入口是 80、後端目標是 8080。輸出的服務物件本身沒有任何證據能保證 Pod 已就緒。

## 常見錯誤

把 Service 自己的 `metadata.labels` 當成後端條件；那是貼在服務物件上的分類，不是要選哪些 Pod。也別把叢集內服務視為公開網址。外面的人如何根據網址走到這個服務，之後在[〈Ingress 與入口控制器〉](#/lesson/ai-k8s-05-ingress)會細講。

## 小結

排查時沿著「服務入口、標籤、就緒端點、目的埠」順序走。在哪一段先找不到證據，就先修那一段，不用一次改動所有網路設定。
