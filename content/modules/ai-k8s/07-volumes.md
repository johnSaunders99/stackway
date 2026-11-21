---
id: ai-k8s-07-volumes
module: ai-k8s
order: 7
title: 持久卷與儲存宣告
subtitle: Pod 換節點後還能取回資料嗎
status: ready
minutes: 35
level: 3
prereqs:
- ai-k8s-06-config
objectives:
- 連結 Pod、PVC 與 PV 的責任
- 比較臨時與持久儲存，辨認回收政策對資料的影響
tags:
- k8s
- volumes
resources:
- title: Kubernetes：持久卷繫結與回收
  url: https://kubernetes.io/docs/concepts/storage/persistent-volumes/
  kind: doc
  lang: en
  minutes: 9
  required: false
  checked: '2026-11-20'
- title: Kubernetes：卷與 emptyDir
  url: https://kubernetes.io/docs/concepts/storage/volumes/
  kind: doc
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-07-volumes-lifetime
  prompt: 同一個 Pod 內的容器重新啟動與 Pod 被替換，對 emptyDir 有何差別？
  answer: emptyDir 隨 Pod 存在；原 Pod 內重啟容器仍可使用，Pod 被移除則不能拿它當持久資料。
  mcq:
    question: 哪一份資料最適合放在 emptyDir？
    options:
    - 可從來源重建的解壓暫存
    - 唯一的那份預約紀錄
    - 必須保留的稽核檔
    - 要跨 Pod 交接的唯一檢查點
    answer: 0
    explain: 暫存可重建，其餘資料都不能依賴原 Pod 一直存在。
- id: ai-k8s-07-volumes-binding
  prompt: PVC 與 PV 各代表什麼？
  answer: PVC 是工作對容量、存取模式及儲存類別等條件的要求；PV 是可繫結給它的叢集儲存資源。
  mcq:
    question: Pod 要使用同命名空間的既有 PVC，應指定什麼？
    options:
    - 節點上猜測的磁碟位置
    - claimName
    - PV 的實體序號
    - 應用程式映像標籤
    answer: 1
    explain: Pod 引用宣告名稱；實際儲存的供應與繫結是另一層責任。
- id: ai-k8s-07-volumes-reclaim
  prompt: 回收政策 Retain 能取代備份嗎？
  answer: 不能。它處理宣告釋放後如何保留儲存，不會產生誤寫之前的獨立副本。
  interview:
    question: Pod 換了機器，能否保證續讀昨天的結果？
    points:
    - 找出資料寫入的掛載點
    - 核對相同 PVC 與繫結
    - 檢查儲存後端的節點限制
    answer: 我會先確認寫入的是卷而非容器根目錄，再追 PVC 是否還綁在原 PV。即使叫持久卷，節點本機磁碟也不一定能換機掛載；真正可回復還要有另一份已測過的備份。
practice:
- id: ai-k8s-07-volumes-p1
  title: 為兩個目錄做資料去向卡
  kind: hands-on
  minutes: 12
  steps:
  - 把 pod-storage.yaml 存檔，為 /scratch 與 /results 各畫一條連到來源的線。
  - 在 storage-notes.txt 分別填「容器重啟」「替代 Pod 引用原 PVC」「刪除 PVC」的預測。
  - 在刪除 PVC 那一列另列 Retain 和 Delete；不要實際刪除。
  checks:
  - /scratch 的生命週期跟著 Pod，/results 能追到 runs 這份宣告。
  - 答案區分跨節點能否掛載、釋放後回收、備份這三個問題。
---

## 為什麼要學：工作重跑可以，成果不該跟著消失

假設一個轉檔工作先把輸入解壓，再把整理好的索引寫出來。解壓檔消失可以重做，索引若是唯一結果，消失就得花幾小時重算。對程式而言兩者都是寫入路徑；對平台而言，它們需要不同的生命週期。先寫下資料需要留到什麼時候，才決定那個目錄該接哪一種卷。

## 核心概念：從程式實際寫入的路徑往下追

卷（volume）是掛進容器目錄的儲存來源。容器自己的可寫層不是保存結果的可靠位置。臨時卷 `emptyDir` 隨 Pod 建立，適合同一個 Pod 內的容器交換檔案或當暫存；容器重新啟動不會因此清空它，但原 Pod 被移除時就不能再依賴裡面的內容。路徑名稱叫 `/data` 或 `/results` 不會自動賦予任何持久性。

持久卷宣告（PersistentVolumeClaim，PVC）由使用者提出需要的儲存條件，持久卷（PersistentVolume，PV）代表叢集提供的儲存資源。可以先有供配對的卷，也可以由儲存類別（StorageClass）支援的供應機制按需建立。Pod 在自己的命名空間引用 PVC，不需要知道磁碟的實體識別碼。相同名稱的宣告若被刪除又重建，不保證仍指向原資料。

## 範例：追出 2 條不同壽命的路徑

在 `C:\dev\stackway-lab\k8s` 存為 `pod-storage.yaml`，用 PowerShell 執行 `Select-String -Path pod-storage.yaml -Pattern 'mountPath|claimName|emptyDir'`。這裡假設已有名為 `runs` 的 PVC，只讀宣告，不建立磁碟。每個 `volumeMounts` 項目的名稱都要在 `volumes` 找到來源。

```yaml
apiVersion: v1
kind: Pod
metadata: {name: sorter}
spec:
  containers:
    - name: worker
      image: busybox:stable
      command: ["sh", "-c", "sleep 3600"]
      volumeMounts:
        - {name: unpack, mountPath: /scratch}
        - {name: output, mountPath: /results}
  volumes:
    - {name: unpack, emptyDir: {}}
    - {name: output, persistentVolumeClaim: {claimName: runs}}
```

原 Pod 被替換後，新 Pod 若引用同一份仍繫結的宣告，且後端允許在新節點掛載，才能接著讀結果。若卷綁定某個節點或區域，新節點不見得符合條件。看到掛載失敗時先查宣告是否已繫結、節點與存取條件是否相容，不要直接新建一份同名空卷來「修復」資料。

用一個具體問題檢查你的圖：如果程式其實將成果寫在 `/result` 而不是 `/results`，資料是由誰保存？看起來只少了一個字母，實際上根本沒有寫到指定的卷。即使 PVC 已繫結、容量也夠，替換 Pod 後仍可能一無所獲。遇到「卷在、檔不在」，先比對程式輸出位置、容器掛載點與原宣告，不要只根據目錄名稱猜測。這個診斷無須先動到原磁碟，適合放在任何調整回收設定之前。

若要對照需求端，可在同一目錄將下列獨立宣告存成 `runs-pvc.yaml`，不必套用。`requests.storage` 寫需求容量，`ReadWriteOnce` 表示可由單一節點以可寫方式掛載，不等於只准一個 Pod。這個例子假設環境有合適的預設儲存類別與供應機制；光是寫下 2 GiB，並不是已經拿到磁碟的證據。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: runs}
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests: {storage: 2Gi}
```

## 常見錯誤

刪 Pod 和刪 PVC 是不同事件。工作結束後保留 PVC，並不觸發卷的回收政策（reclaim policy）；若宣告釋放，`Retain` 留下儲存待人工處理，`Delete` 在支援的供應機制下會連後端儲存一起移除。保留下來的卷也可能已被誤寫。能找回更早的內容，需要獨立備份及實際還原驗證，而不是只靠「持久」兩字。

## 小結

對每個重要檔案問三句：它寫到哪個掛載點？哪個物件不見會使資料不可得？若內容本身寫錯，還有哪一份可回復？能回答才算交代清楚儲存設計。
