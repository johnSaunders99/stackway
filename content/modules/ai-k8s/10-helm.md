---
id: ai-k8s-10-helm
module: ai-k8s
order: 10
title: Helm 套件與版本
subtitle: 改一個設定，實際會改哪些物件
status: ready
minutes: 35
level: 3
prereqs:
- ai-k8s-04-resources
objectives:
- 讀懂 chart、values 與 release 的關係
- 比對渲染後物件，再判讀升級與回復的版本
tags:
- k8s
- helm
resources:
- title: Helm：發行與歷史修訂
  url: https://helm.sh/docs/intro/using_helm/
  kind: doc
  lang: en
  minutes: 9
  required: false
  checked: '2026-11-20'
- title: Helm：在本機渲染範本
  url: https://helm.sh/docs/helm/helm_template/
  kind: doc
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-10-helm-inputs
  prompt: 只看到 values.yaml，能確定最後有哪些 Kubernetes 物件嗎？
  answer: 不能。值要經過該 chart 的範本才變成宣告；沒有被範本使用的值不一定影響輸出。
  mcq:
    question: 改了一個 values 鍵後，哪個方法最能在安裝前看出影響？
    options:
    - 只看 values 的行數
    - 只看 chart 的檔名
    - 先在正式環境回復再猜
    - 用相同 chart 與發行名稱渲染前後兩份宣告
    answer: 3
    explain: 要比較的是使用者真正會提交的物件，單看輸入看不出範本是否使用該鍵。
- id: ai-k8s-10-helm-revision
  prompt: chart 版本與 release 修訂號為什麼不同？
  answer: 前者標示套件版本，後者是該次安裝的操作歷史；同一套件只改設定升級也可有新修訂。
  mcq:
    question: release 已到修訂 3，成功回到修訂 1 的設定後，通常會看到什麼？
    options:
    - 新增修訂 4，記錄此次回復
    - 歷史只剩下修訂 1
    - chart 版本自動降為 1
    - 刪除所有儲存卷
    answer: 0
    explain: 回復是新的歷史動作，不會倒轉時間，也不保證回復外部資料。
  interview:
    question: Helm 回復後為什麼資料還是新格式？
    points:
    - 分開宣告與資料
    - 查歷史與相容性
    - 先驗證關鍵讀寫流程
    answer: Helm 能把受管理物件拉回先前設定，不能倒轉已提交的交易。我會比對應用程式版本和資料格式，先在隔離環境確認舊版能讀，再決定是否另做資料還原。
- id: ai-k8s-10-helm-preview
  prompt: helm template 成功能證明這份設定在指定叢集可部署嗎？
  answer: 不能。它可以檢查本機渲染結果，不代表叢集支援物件、權限符合或服務能運作。
practice:
- id: ai-k8s-10-helm-p1
  title: 留下兩份渲染結果的差異
  kind: hands-on
  minutes: 12
  steps:
  - 按正文建立三個 chart 檔；有 Helm 時渲染兩次並保存輸出。
  - 沒有 Helm 時手動展開兩個佔位式，另存兩份預測檔，標記為手算。
  - 比對 ConfigMap 名稱與 mode 值，在筆記註明這次是否建立 release。
  checks:
  - 名稱都為 desk-settings，mode 依序為 quiet 與 busy。
  - 我區分了本機渲染、手算及叢集發行紀錄，沒有把預覽當作安裝。
---

## 為什麼要學：只改一行設定，怎麼知道真正的影響？

一套服務可能要建立部署、設定與入口。若每個環境都複製整疊檔案，一個鍵改了，很難知道其他地方還留著幾份舊值。Helm 把範本與預設值包成套件（chart），再用一組輸入值產生環境需要的宣告。先看產物再決定要不要發行，比看到一行漂亮的設定就按下升級可靠得多。

## 核心概念：套件、值與一次安裝是 3 件事

`Chart.yaml` 說明套件叫什麼、版本多少；`values.yaml` 是預設輸入；`templates` 目錄放產生物件的範本。一次具名安裝是發行實例（release）。同一份套件能安裝成不同名稱，或為不同環境覆寫值。範本中的 `.Release.Name` 取發行名稱，`.Values.mode` 取輸入的鍵。若範本沒用到某個鍵，改值並不會自動改到應用程式。

修訂號（revision）追蹤同一發行實例的歷史。改設定升級也可留下新的修訂，不表示套件作者一定發了新版。回復（rollback）會把先前修訂的設定與套件內容重新用在這次發行，會產生新的歷史紀錄。它不是資料庫的時間機器；已經寫入磁碟的內容、外部服務已完成的動作不會跟著自動倒轉。

## 範例：同一份範本算 2 次

在 `C:\dev\stackway-lab\k8s` 建立空的 `desk-chart` 資料夾及其中的 `templates` 子目錄。以下三段分別存成 `desk-chart/Chart.yaml`、`desk-chart/values.yaml`、`desk-chart/templates/settings.yaml`。最後一段是 Helm 範本，展開大括號後才是 Kubernetes 可讀的宣告。

```yaml
apiVersion: v2
name: desk-chart
version: 0.1.0
```

```yaml
mode: quiet
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-settings
data:
  mode: {{ .Values.mode | quote }}
```

若本機已有 Helm，在 `desk-chart` 的上一層以 PowerShell 執行以下指令。不需要叢集。沒有工具也能做同一份練習：把名稱代入 `desk`，把模式分別代入 `quiet` 與 `busy`，將展開的兩份宣告另存並註明手算。管線中的 `quote` 會把結果當成帶引號的字串輸出。

```powershell
helm template desk ./desk-chart | Set-Content before.yaml
helm template desk ./desk-chart --set mode=busy | Set-Content after.yaml
Compare-Object (Get-Content before.yaml) (Get-Content after.yaml)
```

兩份產物應只有模式不同。假設之後真的安裝為修訂 1，再升級為修訂 2，成功回到修訂 1 的設定會新增修訂 3，不會把修訂 2 從歷史抹掉。沒有執行安裝就沒有這段歷史，離線範例能證明的只有宣告差異。

如果兩份都還是安靜模式，先檢查傳入的鍵是否和範本取的鍵相同，再查比對的是否為兩次不同輸出。反之，若預期只改模式，差異中卻多了一個新名稱，部署後可能變成建立新物件而非原地改設定。這是預覽最有價值的地方：在還沒有改到任何服務前，先找出與變更目的無關的差異，縮小需要審查的範圍。

## 常見錯誤

把預覽成功當作部署成功：本機能展開字串，不代表目標叢集有對應型別、能通過授權、或新的容器能就緒。也不要把含有敏感值的完整渲染結果附到公開的變更單；這次故意只用一般模式字串，方便安全比對。

## 小結

交付時把套件版本、覆寫值、渲染差異及發行修訂分開記。不需要整份歷史都背下來，但要能回答「這次改了哪個物件，回復又能回到哪一層」。
