---
id: ai-k8s-11-operators
module: ai-k8s
order: 11
title: CRD 與 Operator
subtitle: 宣告一種新資源之後誰會管理它
status: ready
minutes: 35
level: 3
prereqs:
- ai-k8s-10-helm
objectives:
- 區分 CRD、資源實例與控制器
- 用調和迴圈解釋只安裝型別為何不會自行處理工作
tags:
- k8s
- operators
resources:
- title: Kubernetes：自訂資源與控制器
  url: https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/
  kind: doc
  lang: en
  minutes: 8
  required: false
  checked: '2026-11-20'
- title: Kubernetes：Operator 模式
  url: https://kubernetes.io/docs/concepts/extend-kubernetes/operator/
  kind: doc
  lang: en
  minutes: 6
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-11-operators-kinds
  prompt: CRD 和一個自訂資源實例的差異是什麼？
  answer: CRD 註冊資源型別、版本與結構；實例是使用該型別描述某一次具體需求的物件。
  mcq:
    question: 平台想接受很多份不同的 ModelPool 需求，通常如何分工？
    options:
    - 建立一種 CRD，再建立多個實例
    - 每多一個副本就要一種 CRD
    - 只要建立實例就能發明未註冊型別
    - 把每個需求都寫成新的 API 伺服器
    answer: 0
    explain: 型別用來定義共同結構，實例才能帶不同名稱及目標。
- id: ai-k8s-11-operators-actor
  prompt: 已能保存自訂物件，為什麼沒有任何子資源出現？
  answer: API 接受資料和執行領域工作是兩件事；還要有能觀察物件、具備適當權限的控制器。
  mcq:
    question: 只有 CRD 和一份實例時，哪項可合理預期？
    options:
    - 模型一定已載入
    - API 可保存符合結構的需求
    - 相依服務必定已建立
    - 設定已自動通過業務驗收
    answer: 1
    explain: 沒有實作調和行為，型別定義不會代替程式做事。
  interview:
    question: 怎麼分辨需求未被接受與需求已保存但一直沒做？
    points:
    - 查型別與實例是否存在
    - 查控制器是否觀察且有權限
    - 檢查子物件與狀態新舊
    answer: 我會先把 API 接受的範圍查清楚：有實例才去找對應控制器。接著比對子物件與它回報的狀態，沒有新進度不等於要再送一次相同需求。
- id: ai-k8s-11-operators-replay
  prompt: 同一個自訂資源連續被通知兩次，控制器應如何避免重複建立工作？
  answer: 每次先觀察現況，辨認已屬於該實例的工作，只執行仍缺少的動作。
practice:
- id: ai-k8s-11-operators-p1
  title: 製作一張自訂資源調和收據
  kind: hands-on
  minutes: 12
  steps:
  - 把範例存成 pool-loop.ps1，記錄第一次與第二次算出的缺口。
  - 將「控制器停止」情境寫入 pool-receipt.txt：留著實例，但省略建立動作。
  - 分別列出能從 API 證明的事與還沒有證據的事。
  checks:
  - 同一需求重讀兩次時，第二次不會再增加副本。
  - 我能寫出只有 CRD、只有實例、已有控制器證據三者的差別。
---

## 為什麼要學：平台收到了模型池申請，為什麼沒有動靜？

你想用一個物件表達「維持 2 個已準備好的模型工作者」。部署物件知道如何維持程式副本，卻不懂你的模型要先檢查版本、載入索引、再回報可用。Kubernetes 可以讓平台增加自己的資源型別，把這份知識寫進控制器。關鍵在於知道成功提交申請，只證明平台收到資料，並不證明有人真的把申請變成可用的工作。

## 核心概念：先有表格格式，再有申請單與承辦程式

自訂資源定義（CustomResourceDefinition，CRD）向 API 註冊新的型別，描述群組、版本、名稱、作用範圍及欄位結構。自訂資源（custom resource，CR）是填好的一張單，例如名為 `small` 的模型池，目標副本為 2。系統可以驗證欄位型別並保存物件，但不會從 `replicas` 這個英文名稱推論出該怎麼載入模型。

維運控制器模式（Operator pattern）把領域維運知識寫成調和邏輯。控制器讀取目標，觀察由它維護的子物件，採取必要動作，再更新觀察結果。譬如它可以建立一個部署物件，讓既有的部署控制器處理 Pod 副本，而不是自己重新實作排程。這裡的 ModelPool 是課堂設計，不是叢集預先安裝的型別。

## 範例：把重複通知送進同一個判斷

在 `C:\dev\stackway-lab\k8s` 把下列程式存成 `pool-loop.ps1`，在 PowerShell 執行 `.\pool-loop.ps1`。這段用記憶體中的清單代替觀察，不會註冊型別、啟動真正控制器或建立任何叢集資源。想像 `small` 就是這份需求的名字。

```powershell
$pool = [pscustomobject]@{ name='small'; replicas=2 }
$owned = @()
foreach ($notice in 1,2) {
    $missing = $pool.replicas - $owned.Count
    "notice=$notice seen=$($owned.Count) missing=$missing"
    for ($i=0; $i -lt $missing; $i++) {
        $owned += "$($pool.name)-$($owned.Count)"
    }
}
```

第一次觀察到的工作清單是空的，差 2 個；第二次讀的是同一個需求，但清單已經有 2 個，不必再建。若把新增清單那一步拿掉，需求仍可被看到，只是每次觀察都差 2 個。這正好區分「控制器確實做了事」和「儲存層只是留下目標」。真實控制器重啟後還得從叢集重新辨認所屬物件，不能以行程記憶體當唯一帳本。

試著把責任寫成三張收據。第一張只寫「伺服器認得這個型別」，第二張加上「名叫 small 的需求已保存」，第三張才提供「屬於這份需求的 2 個工作已可用」。如果手上只有前兩張，就不能對使用者承諾第三張。若控制器存在卻沒有更新，應檢查它觀察的命名空間與操作子資源的權限；不一定是實例的資料有錯。

可以把假設的申請另存為 `small.yaml`。`kind` 辨識型別，`metadata.name` 辨識這張單，`spec` 才是使用者填入的目標。若平台尚未註冊此型別，這份檔案只能當設計樣本，不要把它套到現有叢集。

```yaml
apiVersion: study.example/v1
kind: ModelPool
metadata: {name: small}
spec: {replicas: 2}
```

## 常見錯誤

把作業狀態寫成想要的值，讓畫面先顯示就緒，實際子物件卻沒完成。狀態應根據觀察，必要時指出尚在等待哪個步驟。看到舊狀態也別直接判成功：若控制器有提供已觀察的世代編號，可以跟最新規格世代比對，確認回報對應這次需求，而不是上一次。

## 小結

除錯時問「型別存在嗎、實例被接受嗎、誰在調和、做事留下什麼證據」。這四個問題能把同一個「沒動靜」拆成不同工作，而不必盲目重新安裝整套平台。
