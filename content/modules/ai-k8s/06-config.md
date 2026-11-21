---
id: ai-k8s-06-config
module: ai-k8s
order: 6
title: ConfigMap 與 Secret
subtitle: 改設定一定要重建映像嗎
status: ready
minutes: 30
level: 3
prereqs:
- ai-k8s-05-ingress
objectives:
- 比較一般設定與敏感值的注入方式
- 說明編碼不等於加密，以及讀取權限應授予誰
tags:
- k8s
- config
resources:
- title: Kubernetes：ConfigMap 的使用方式
  url: https://kubernetes.io/docs/concepts/configuration/configmap/
  kind: doc
  lang: en
  minutes: 7
  required: false
  checked: '2026-11-20'
- title: Kubernetes：Secret 的使用與注意事項
  url: https://kubernetes.io/docs/concepts/configuration/secret/
  kind: doc
  lang: en
  minutes: 7
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-k8s-06-config-classify
  prompt: 什麼值應放 ConfigMap，什麼值應走 Secret？
  answer: 非機密的行為設定放 ConfigMap；能授權存取的敏感值走受限 Secret，並限制讀取者。
  mcq:
    question: 哪一項最適合放在一般 ConfigMap？
    options:
    - 可寫入資料庫的密碼
    - 可代表服務登入的權杖
    - 簽發憑證的私密金鑰
    - 頁面每次顯示的筆數
    answer: 3
    explain: 筆數是行為設定，另外三項外洩都可能讓人取得身分或能力。
- id: ai-k8s-06-config-encoding
  prompt: Secret 的 data 使用 base64，為什麼仍需要存取控制？
  answer: 編碼可以還原，不是加密；能讀出值的主體就可能取得原始內容。
  mcq:
    question: 不改檔案權限，只把敏感值改成 base64，增加了哪一種保護？
    options:
    - 沒有新增保密能力
    - 已做到靜態加密
    - 只有原作者可以還原
    - 已限制只有特定 Pod 能讀取
    answer: 0
    explain: 編碼只改表示形式，沒有金鑰或授權機制。
  interview:
    question: 你收到一份「已編碼，可以提交」的憑證設定，怎麼處理？
    points:
    - 說明編碼可還原
    - 不提交真值，改存引用
    - 限制讀取與已外洩時輪替
    answer: 我會保留鍵名和引用方式，不把值提交。先查誰真的需要讀它，也確認叢集有沒有靜態加密；如果它已流出，刪掉那一行並不能取代輪替。
- id: ai-k8s-06-config-refresh
  prompt: 設定用環境變數送進容器後，改 ConfigMap 會讓現有行程立即更新嗎？
  answer: 不會；須建立使用新值的容器。掛載檔案是另一條更新路徑，應用程式仍須重新讀取。
practice:
- id: ai-k8s-06-config-p1
  title: 做一份不含真值的設定交接單
  kind: hands-on
  minutes: 10
  steps:
  - 保存範例為 config-refs.yaml，用 PowerShell 找出兩種 KeyRef。
  - 另存 config-review.txt，逐一列出變數、來源物件、鍵與誰需要使用。
  - 寫下調整 PAGE_SIZE 後如何讓既有服務讀到新值。
  checks:
  - 交接單清楚區分 page-size 與 access-key，沒有填任何真實密鑰。
  - 我有寫出環境變數方案需更換容器，而不是只改設定物件。
---

## 為什麼要學：每頁從 10 筆改成 20 筆，要重新打包嗎？

假設測試環境希望多印診斷資訊，正式環境不希望；兩邊的程式邏輯其實相同。把設定寫進映像，就必須為一個數字重做成品，還可能把不該分享的資料發到每個環境。把映像當作同一份程式，把設定當作執行時輸入，才能說清楚「換的是程式，還是程式讀到的值」。

## 核心概念：先分敏感程度，再選傳遞方式

設定對照表（ConfigMap）適合放非機密的鍵值或設定檔；機密物件（Secret）用來分開處理憑證、密碼等敏感資料。兩者都可以讓容器以環境變數（environment variable）或掛載檔案取得資料。選哪一種，要看應用程式在哪裡讀，以及你希望設定變動後如何生效，不是看哪一種寫起來比較短。

Secret 的 `data` 欄位使用 base64 編碼（encoding），作用是用文字表示位元組，不需要金鑰就能還原。靜態加密（encryption at rest）是叢集儲存層的另一項設定，不能從物件叫 Secret 就推論已啟用。能讀取物件或能建立使用它的工作負載，都可能間接取得值。授權不要只看誰可以操作命令列，還要考慮誰能部署什麼容器，以及誰能閱讀日誌。

## 範例：只交接鍵名，不交接憑證

在 `C:\dev\stackway-lab\k8s` 把下列 Pod 宣告存成 `config-refs.yaml`。在 PowerShell 執行 `Select-String -Path config-refs.yaml -Pattern 'KeyRef'` 應各看到一個來源。這裡只練閱讀，不用建立物件或填入任何敏感值。想像同一命名空間裡已各有一份對應的設定和機密。

```yaml
apiVersion: v1
kind: Pod
metadata: {name: config-reader}
spec:
  containers:
    - name: reader
      image: nginx:stable
      env:
        - name: PAGE_SIZE
          valueFrom:
            configMapKeyRef: {name: reader-settings, key: page-size}
        - name: ACCESS_KEY
          valueFrom:
            secretKeyRef: {name: reader-access, key: access-key}
```

從容器角度看，只會讀到 `PAGE_SIZE` 與 `ACCESS_KEY`。從維運者角度看，來源是兩個不同物件的特定鍵。這份映像只示範注入，不會因為有了這兩個變數就自動改變網頁行為；程式必須真的去讀。調大每頁筆數時，先更新設定來源，環境變數是在容器建立時帶入，所以對服務安排可觀察的替換，再檢查新行為。

分配權限時再問一次「哪個容器需要哪個鍵」。同一個 Pod 若還有負責輸出一般指標的輔助容器，沒有理由因為它住在旁邊，就把主要程式的權杖也放進它的環境。練習交接單可以放心保留在本機，因為它記的是引用關係；讀者看得出缺哪個物件，卻無法拿著這張單直接登入任何系統。

手邊有 kubectl 才做這個對照：在本機生成 ConfigMap 宣告，核對鍵名，不套用到叢集。

```powershell
kubectl create configmap reader-settings --from-literal=page-size=20 --dry-run=client -o yaml
```

檢查產物中的鍵名是否正好對上容器所引用的鍵，再看數字是以字串表示。這是一般設定範例，不要改成把憑證放進指令列。

## 常見錯誤

掛載整份設定檔時，投射內容一般會在一段時間後更新，不代表行程已重新讀取；若用 `subPath` 只掛單一檔案，更不能期待它隨來源更新。反過來，用環境變數卻只在現有容器裡重讀變數，拿到的仍是原值。驗證時記錄安全的行為變化，不要為了證明注入成功把環境變數全部印出來。

## 小結

交接設定時列出名稱、來源、讀取者與生效時機就夠了。真正需要替換的是值，不是維運文件，更不是把真值附在工單後面。
