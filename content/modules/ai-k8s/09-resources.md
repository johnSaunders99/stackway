---
id: ai-k8s-04-resources
module: ai-k8s
order: 9
title: 資源請求與上限
subtitle: 預約資源與實際用量
status: ready
minutes: 35
level: 3
prereqs:
- ai-k8s-03-probes
objectives:
- 用請求量推算節點是否排得下
- 分辨 Pending 與記憶體超限
tags:
- k8s
- requests
resources:
- title: Kubernetes：容器資源請求與上限
  url: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/
  kind: doc
  lang: en
  minutes: 10
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-04-resources-fit
  prompt: 排程時計算剩餘容量，該扣掉其他工作的即時用量還是已請求量？
  answer: 一般資源適配看節點可分配量扣除既有請求，不能拿某一刻的空閒量當承諾。
  mcq:
    question: 可分配 2000m，既有請求 1500m、實際正用 200m，新工作要 700m，是否符合 CPU 條件？
    options:
    - 符合，還有 1800m 沒用
    - 符合，CPU 永不參與排程
    - 不符，請求餘額只有 500m
    - 不符，因為 700m 是 700 核心
    answer: 2
    explain: 1000m 是 1 個 CPU；排程看已承諾的請求，不是瞬時使用率。
- id: ai-k8s-04-resources-limit
  prompt: CPU 與記憶體超過上限時，處置為什麼常不同？
  answer: CPU 時間通常被節流；記憶體無法靠延後執行收回，可能觸發記憶體不足終止。
  mcq:
    question: 已執行容器上一輪的終止原因是 OOMKilled，先查什麼？
    options:
    - Service 的 port
    - Ingress 的主機名稱
    - Pod 是否從未排到節點
    - 記憶體歷史用量、上限與節點壓力
    answer: 3
    explain: 終止記錄表示它已執行過；還要區別容器上限與節點整體壓力。
  interview:
    question: 新工作 Pending、舊工作反覆重啟，你會把兩者都歸因於記憶體嗎？
    points:
    - Pending 查排程事件
    - 重啟查終止原因與用量
    - 提出不同的修正依據
    answer: 我會先查新工作有沒有被指派，事件是否明講資源不足；舊工作則看上一輪結束原因與尖峰。請求太大排不下，和執行後超限，是兩個不同階段。
- id: ai-k8s-04-resources-unit
  prompt: 256Mi 與 256m 在記憶體欄位可互換嗎？
  answer: 不行。Mi 是二進位容量單位；小寫 m 是 1/1000，不是 1000000 位元組。
practice:
- id: ai-k8s-04-resources-p1
  title: 交出一張排程容量收據
  kind: hands-on
  minutes: 12
  steps:
  - 將 fit.ps1 存檔執行，保留 CPU 與記憶體兩個判定。
  - 把新請求改成 500m 與 600Mi 再跑一次，找出新的瓶頸。
  - 在 fit.txt 附上兩組扣除算式及一項模型沒有檢查的條件。
  checks:
  - 第一組 CPU 不足、記憶體足夠；第二組相反。
  - 判定沒有以即時使用率取代資源請求。
---

## 為什麼要學：機器看起來很閒，排程器卻說放不下

中午 CPU 圖表只有一小段綠線，新工作卻一直等不到節點。排程器要做的是兌現對多個工作的承諾，不是賭它們永遠不會同時忙起來。另一方面，工作已經啟動，卻在讀一個大檔案時消失，值得看的證據就不再是排隊時間。兩種情況都叫資源不足，處理順序卻相反。

## 核心概念：預約與使用分 2 本帳

請求量（request）是排程時用來安排容量的數字，上限（limit）是執行時對使用的約束。節點可分配量（allocatable）已考量系統保留，不等於硬體包裝上寫的總容量。對最簡單的單容器 Pod，先用可分配量減去已排入工作的請求，再分別核對 CPU 與記憶體。兩者都要在同一台節點滿足；不能從甲機借半顆核心、再從乙機拿記憶體來拼出一個 Pod。

CPU 以核心計，`1000m` 是 1 個 CPU；記憶體的 `Mi` 是以 2 的次方計量。CPU 碰上限通常被節流（throttling），表現可能是延遲增加而非退出。記憶體碰上限時可能由核心以記憶體不足（out of memory，OOM）為由終止行程。它不是寫到某個位元組就一定立即退出的精準開關。終止原因和當時的量測要放在一起看。

## 範例：算出是哪一本帳不足

在 `C:\dev\stackway-lab\k8s` 存成 `fit.ps1`，以 PowerShell 執行 `.\fit.ps1`。所有數字都已換成相同單位，CPU 用毫核心，記憶體用 Mi。這是單節點、單容器，且沒有其他排程限制的算術題，不是完整排程器。

```powershell
$freeCpu = 2000 - 1500
$freeMem = 2048 - 1536
$needCpu = 700
$needMem = 256
"cpu: $needCpu / $freeCpu m => $($needCpu -le $freeCpu)"
"mem: $needMem / $freeMem Mi => $($needMem -le $freeMem)"
```

剩下 500 毫核心和 512 Mi，記憶體足夠卻不能因此入場。把工作改為 500 毫核心與 600 Mi，這次 CPU 剛好符合，記憶體不足。若兩個比較都成功，結論也只能寫「這兩個容量條件通過」；節點標籤、儲存位置或之後在[〈GPU 裝置外掛與排程〉](#/lesson/ai-k8s-05-gpu)會看到的特殊裝置，同樣可能阻止指派。

再多做一個反向推理：如果排程事件只說記憶體不足，你能從這句話判斷程式有記憶體洩漏嗎？不能，工作可能還沒開始，排程時看的只是它提出的容量需求。反之，已執行 1 小時才出現終止記錄，也不能直接把當時的閒置比例當作排程失敗。把服務開始時間標在資源圖上，會幫你選對下一個要查的證據。

## 常見錯誤

看到 `Pending` 就提高記憶體上限，卻沒確認排程事件是否指出請求過大。看到 `OOMKilled` 就一律降低請求，更混淆了兩本帳。先問「它有跑過嗎」：沒被指派先查事件，執行後退出則查上一次終止原因、尖峰與節點整體壓力。正式調整應對照代表性負載，不能只把範例數字抄進產品。

## 小結

請求回答「誰能容納」，上限回答「使用到哪裡會受約束」。記錄計算單位、剩餘容量和第一個不符條件，就能在別人問起時重現判斷，而不是只說機器不夠。
