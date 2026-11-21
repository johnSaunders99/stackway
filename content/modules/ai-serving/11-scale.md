---
id: ai-serving-06-scale
module: ai-serving
order: 11
title: 自動擴縮與佇列訊號
subtitle: 佇列是擴容訊號還是流量尖峰
status: ready
minutes: 35
level: 3
prereqs:
  - ai-serving-05-engines
objectives:
  - 由排隊時間與服務時間分解超時
  - 為冷啟動、拒絕與縮容寫出門檻
tags:
  - serving
  - autoscaling
resources:
  - title: Azure 架構中心：用佇列緩衝負載
    url: https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
  - title: Kubernetes：水平擴縮的指標與穩定視窗
    url: https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-06-scale-delay
    prompt: 排隊 700 毫秒，服務 450 毫秒，期限 1 秒，應如何判讀？
    answer: 預估總耗時超出期限 150 毫秒。
    mcq:
      options:
        - 只需看服務 450 毫秒，所以不會超時
        - 把 2 段取較大值 700 毫秒，視為符合期限
        - 用 2 段平均值 575 毫秒判定可接
        - 預估總耗時超出期限 150 毫秒
      answer: 3
      explain: 同一請求的連續階段要相加，不是取最大值或平均。
  - id: ai-serving-06-scale-cold
    prompt: 新複本已建立但仍在載入，應算哪一種容量？
    answer: 啟動中，尚不能分派請求。
    mcq:
      options:
        - 啟動中，尚不能分派請求
        - 從建立程序起就列為可分流的暖容量
        - 只要有分配 GPU 便等同已能生成
        - 第一個複本接得動就視為新複本也就緒
      answer: 0
      explain: 建立資源不代表模型就緒；路由須依能否服務判斷。
  - id: ai-serving-06-scale-drain
    prompt: 縮掉仍有串流的複本前，應先做什麼？
    answer: 停止分派新請求並排空在途工作。
    mcq:
      options:
        - 只要全池平均等待降低就立即終止
        - 停止分派新請求並排空在途工作
        - 先停止執行，再讓已接收的請求自然排空
        - 看佇列空了就假設所有在途生成都已完成
      answer: 1
      explain: 縮容應處理已接受的工作，不能用平均低負載證明沒有在途請求。
    interview:
      question: 佇列瞬間變長，如何避免過度擴容又不拖死服務？
      points:
        - 辨識持續壓力
        - 考慮冷啟動與期限
        - 縮容前排空
      answer: 我先分開看排隊和執行時間，要求持續超標才增派，並把啟動中的複本列出。快過期的請求不無限收；回落後保留穩定視窗，排空才移除。
practice:
  - id: ai-serving-06-scale-p1
    title: 重播一次擴縮決策
    minutes: 12
    kind: code
    steps:
      - 保存腳本和事件時間線
      - 改為在第 120 秒才排空，記錄哪項決策跟著改變
    checks:
      - 原例 40 秒申請、100 秒就緒、110 秒移除
      - 延後排空只改移除時刻，範例新請求被拒絕
---
## 為什麼要學：複本還在載入，請求已經過期
流量突然變多，圖上的等待數升高。此時多開一個模型複本也許有用，但模型若要 60 秒才能載入，不能拿它救 2 秒後就到期的請求。自動擴縮（autoscaling）是在訊號持續時改變服務容量；准許多少工作進門、已在途的工作如何善後，則需要另外訂規則。

## 核心概念：先把超時切成 2 段
從請求到達到開始執行是排隊時間（queue time），從開始到完成是服務時間（service time）。假設忽略傳輸，同筆 2 段相加才是端到端耗時。若排隊增加但執行時間穩定，可能是到達量長期超出容量；若所有請求一進去就執行卻一直算不完，先看輸入長度、裝置與引擎，而不是把所有超時都怪到佇列。

本例每 10 秒看一次最久等待時間，連續 3 個視窗超過 500 毫秒才申請增加一份容量；有啟動中的複本時暫不再加。這段從建立到能服務的時間叫冷啟動（cold start）。個別新請求若預估等候加服務會超過剩餘期限，選擇明確拒絕或降載，而不是排到過期。這些數字是教學政策，不是 Kubernetes 的預設值。

## 範例：同一段佇列紀錄會觸發幾次？
把副本啟動所需時間畫進佇列的時間線。看到排隊就立刻增加副本，不代表第一批人能更快得到回應。把下面的範例存成 `C:\dev\stackway-lab\serving` 裡的 `scale_policy.py`。

在該目錄執行：Windows PowerShell 用 `py scale_policy.py`；macOS／Linux 用 `python3 scale_policy.py`。

```python
waits = [600,100,600,700,800,900,100,80,50,50,50,50,50]
hi = lo = 0
ready, warm_at = 1, None
for i, wait in enumerate(waits):
    sec = i*10
    if warm_at == sec:
        ready += 1
        warm_at = None
        print(sec, "ready")
    hi = hi+1 if wait>500 else 0
    lo = lo+1 if wait<150 else 0
    if hi>=3 and warm_at is None:
        warm_at = sec+60
        print(sec, "request replica")
    drained = sec >= 110  # fixture: target stopped accepting and has no active streams
    if ready>1 and lo>=3 and drained:
        ready -= 1
        print(sec, "remove drained replica")
print("admit" if 700+450 <= 1000 else "reject")
```

一次短尖峰後回落會清除連續次數；第二波才滿足條件。程式把啟動中當成尚未可用的容量，到指定時刻才轉為就緒。縮容用不同門檻：必須低等待持續 3 次、超出保底複本數，且目標複本已停止接新工作並排空，才能移除。這種穩定視窗避免負載在界線附近讓服務反覆增減。

### 2 張不同的單：容量單與請求單
想像現場有 1 個待載入的複本，還需 20 秒；新到的請求只願意等 1 秒。容量單可以寫「已申請，尚待就緒」，這張請求單卻仍可能要拒絕。若對方會重試，回應應讓用戶端知道是暫時過載，並有退避策略，免得失敗請求立刻回頭排隊。回顧擴縮是否得當時，除了看排隊有沒有變短，也要核對拒絕數；把工作全拒絕也會得到漂亮的空佇列。

## 常見錯誤
用平均使用率直接替代等待；很忙的卡仍可能準時，很閒的卡也可能因上游堵住而無工可做。另有一種錯誤是把縮容當立即終止，讓仍在串流的讀者只收到半段。應先從可接流量的名單移除目標、等在途請求完成或達事先約定的期限，再釋放容量。

## 小結
在值班筆記分開記「何時加」、「現在這筆收不收」與「何時安全地減」。若尖峰比冷啟動更短，先考慮保留暖複本或限制入口，不要承諾靠事後擴容救回已超時的工作。每個門檻都應能由帶時間戳的紀錄重播。
