---
id: ai-cluster-02-queues
module: ai-cluster
order: 3
title: Kueue 配額與准入
subtitle: 誰先拿到下一批 GPU
status: ready
minutes: 30
level: 3
prereqs:
  - ai-cluster-02-sharing
objectives:
  - 用兩個工作群組模擬配額與等待
  - 說明 Kueue 准入與節點排程的差別
tags:
  - cluster
  - quota
resources:
  - title: Kueue：ClusterQueue 與配額
    url: https://kueue.sigs.k8s.io/docs/concepts/cluster_queue/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: Kueue：命名空間的 LocalQueue
    url: https://kueue.sigs.k8s.io/docs/concepts/local_queue/
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-cluster-02-queues-books
    prompt: 兩個 LocalQueue 指向同一 ClusterQueue，會自動各有一整份配額嗎？
    answer: 不會，要看所指的共同帳本。
    mcq:
      options:
        - 會，命名空間不同就會自動複製帳本
        - 會，每個 LocalQueue 各計一份完整名目配額
        - 會，只要兩組使用不同的工作名稱
        - 不會，要看所指的共同帳本
      answer: 3
      explain: LocalQueue 是入口；資源的額度在 ClusterQueue 等設定中管理。
  - id: ai-cluster-02-queues-debit
    prompt: 禁止借用，配額 2、已占 1，新工作需 2，准入結果為何？
    answer: 等待，已占仍為 1。
    mcq:
      options:
        - 等待，已占仍為 1
        - 准入並允許已占短暫增為 3
        - 先扣剩餘 1 張，將整份工作標為已准入
        - 自動取消原有工作並把這份工作放行
      answer: 0
      explain: 此例沒有部分准入或搶占；失敗不能憑空消耗配額。
  - id: ai-cluster-02-queues-placement
    prompt: 工作已准入，Pod 仍 Pending，優先確認什麼？
    answer: 節點條件與單個 Pod 的資源能否配對。
    mcq:
      options:
        - 只增加 LocalQueue 的數量，不看節點事件
        - 節點條件與單個 Pod 的資源能否配對
        - 只用全叢集閒卡總和判定單一 Pod 一定能放入
        - 將准入成功當作工作程式已開始執行
      answer: 1
      explain: 准入與落點分工不同，核對節點與排程事件才有新證據。
    interview:
      question: 有人抱怨隔壁組插隊，你會查哪兩張紀錄？
      points:
        - 追到各自帳本
        - 核對當時需求與可用額度
        - 檢查是否已准入才卡在節點
      answer: 我先查兩筆工作進哪個 ClusterQueue、當時要幾張、可否借用。若配額已放行，我才看 Pod 的排程事件。只有提交的時間戳，還不能判斷公平性。
practice:
  - id: ai-cluster-02-queues-p1
    title: 重播 2 組工作的准入紀錄
    minutes: 10
    kind: code
    steps:
      - 保存腳本及每次決策後的帳本
      - 另外畫 2 個各剩 1 張卡的節點，標出單一 Pod 要 2 張的結果
    checks:
      - 研究組先等，服務組先准入
      - 研究組歸還後能准入，但示意節點仍放不下該 Pod
---
## 為什麼要學：排在前面，為何別組先跑？
研究組先提交要 2 張卡的工作，服務組晚到的工作卻先被放行。是不是有人插隊？先看兩組是否共用同一筆額度。配額（quota）是允許占用的資源量；准入（admission）是依規則決定此時能否讓一份工作開始往執行階段走。提交順序不一定是跨組唯一的決定因素。

## 核心概念：算得出額度，不代表找得到節點
Kueue 中，工作從命名空間（namespace）的 LocalQueue 進入，LocalQueue 指向 ClusterQueue。後者按資源類型及資源規格（ResourceFlavor）管理可分配額度。兩個不同名字的 LocalQueue 若指向同一個 ClusterQueue，並不會自動各有獨立配額；務必沿引用找到真正的帳本。

以下刻意設 2 個獨立的 ClusterQueue，每組名目配額 2 張，不借用、不搶占，也沒有額外准入檢查。研究組已占 1 張，只剩 1 張，下一份要 2 張的工作得等。服務組尚未用額度，就能接受自己的工作。真實系統若配置可借用的群組、優先權或其他檢查，結果會不同，不能把這個教具當成完整的排程演算法。

即使准入成功，工作所產生的 Pod 還要由 Kubernetes 排程器尋找滿足機型、每節點資源、標籤與限制的節點。整個叢集有 2 張閒卡，若分在 2 個節點，一個要求同節點 2 張的 Pod 仍可能放不下。注意這是兩個不同的等待原因，處理方法也不同。

## 範例：重播一次歸還額度
開啟 `C:\dev\stackway-lab\cluster`，將範例另存為 `quota.py`。分開記下「可以進入」與「已在執行」。即使需求符合配額，也要問哪一筆證據才表示資源真的到手。

在該目錄執行：Windows PowerShell 用 `py quota.py`；macOS／Linux 用 `python3 quota.py`。

```python
limit, used = {"research":2, "service":2}, {"research":1, "service":0}
def admit(group, need):
    ok = used[group]+need <= limit[group]
    if ok:
        used[group] += need
    print(group, "admit" if ok else "wait", "used", used[group])
admit("research", 2)
admit("service", 1)
used["research"] -= 1
admit("research", 2)
```

先記錄研究組被擋時帳本有沒有變。如果失敗的請求也扣了配額，下一輪會憑空少掉額度。釋放原有那一張後，同一份待辦才重試成功。這裡放行表示額度檢查通過，不代表工作搶到了節點，更不能從這段輸出估計開始時間。

### 把原因寫成可被推翻的一句話
對研究組先寫：「若原有工作交還 1 張額度，新工作會過額度檢查。」然後用同一份需求重播，其他條件不改。如果帳本已足夠卻沒有准入，該查其他准入檢查、資源規格或佇列策略；如果是已准入卻沒有節點，這句預測其實成立。將狀態轉換分開記，才不會因最後還沒跑起來，就錯判前面的配額試驗失敗。

## 常見錯誤
把配額當成事先切好的實體卡，跑不動就提高名目值，結果原本就不足的實體資源並未增加。排查時先看工作是否還在等准入；若已准入，改看 Pod 事件與節點條件。也不要在沒確認共同帳本之前，宣稱新建一個 LocalQueue 就能讓另一組得到保底額度。

## 小結
每份工作至少記錄需求、所屬帳本、已占與剩餘，再分開寫准入結果和落點。當兩者不一致，正好指出該找額度管理者還是節點管理者，而不是用一句「叢集沒 GPU」帶過。
