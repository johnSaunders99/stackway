---
id: fd-delivery-05-rollback
module: fd-delivery
order: 5
title: 漸進發布與回復
subtitle: 發布失敗時退回哪一版
status: ready
minutes: 35
level: 3
prereqs:
  - fd-delivery-04-secrets
objectives:
  - 定義小流量觀察指標與停止條件
  - 在非正式環境驗證回復可用
tags:
  - delivery
  - rollback
resources:
  - title: "Google SRE：小流量發布的評估"
    url: "https://sre.google/workbook/canarying-releases/"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-delivery-05-rollback-baseline"
    prompt: "要判斷候選版造成的影響，應優先比較什麼？"
    answer: "同一時段可比流量中候選版與穩定版的結果"
    mcq:
      options:
        - "不同季節的總請求數"
        - "所有版本合併後的單一平均"
        - "候選版檔案名稱長度"
        - "同一時段可比流量中候選版與穩定版的結果"
      answer: 3
      explain: "單看全站平均，小流量異常可能被穩定版稀釋。"
    interview:
      question: "新版本只接少量流量，何時要退回？"
      points:
        - "預先定義樣本與門檻"
        - "同時段對照"
        - "退回已驗證版本並重驗操作"
      answer: "我會在開始前先約定相對錯誤率和樣本量，另留嚴重資料異常的立即停止條件。觸發後先停擴量，切回已知好版，再用同一組核心操作確認恢復。"
  - id: "fd-delivery-05-rollback-gate"
    prompt: "候選版兩次請求都成功，還不到預定樣本量，應如何處理？"
    answer: "保持原比例繼續觀察，不把資料不足當通過。"
    mcq:
      options:
        - "保持原比例繼續觀察，不把資料不足當通過。"
        - "立刻全面發布。"
        - "把沒有請求的時段算作成功。"
        - "只要執行器綠燈就略過觀察。"
      answer: 0
      explain: "觀察時間與有效樣本都要足以支持判斷。"
  - id: "fd-delivery-05-rollback-restore"
    prompt: "回到舊版以後，哪項才是服務恢復的證據？"
    answer: "確認流量回到指定版本，且核心操作與資料檢查通過。"
    mcq:
      options:
        - "路由設定檔已儲存。"
        - "確認流量回到指定版本，且核心操作與資料檢查通過。"
        - "新版本程序不在清單。"
        - "部署頁顯示按鈕已按過。"
      answer: 1
      explain: "切換意圖和使用者真的能操作是不同的驗收點。"
  - id: fd-delivery-05-rollback-points
    prompt: "候選版失敗率 8%、對照版 1%，相差多少個百分點？"
    answer: "相差 7 個百分點；這是 2 個百分率相減，不是把失敗次數直接相減。"
practice:
  - id: "fd-delivery-05-rollback-p1"
    title: "演練一次可驗收的回復"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 rollout.mjs"
      - "分別輸入少量、正常和異常的樣本"
      - "留存決策與切換後的核心操作結果"
    checks:
      - "三種輸入各見 hold、expand、rollback"
      - "退回後讀到穩定版結果"
---

## 為什麼要學：一個發布按鈕不該同時押上所有人

測試站能開啟首頁，不代表新版本能接住每種真實請求。金絲雀發布（canary release）先把少部分可比較的流量交給候選版，餘下由已知穩定版處理。目的是在影響面積還小時得到能採取行動的證據，而不是固定等幾分鐘就宣布成功。回復（rollback）則是把服務帶回一個已知可用的狀態。

## 核心概念：先寫判斷規則，再看數字

選能代表使用者成功的指標，例如結帳失敗率、等待時間或寫入是否一致。比較同時段、相似操作的兩組，而非候選版的結帳與穩定版的首頁。記下分子和分母，小樣本的 0 失敗不等於已證明安全。約定觀察窗口、最低樣本與停止條件；若發現資料損壞等嚴重問題，不必為了湊樣本而繼續放量。

當門檻被觸發，先停止增加流量，指定回到哪份已通過驗收的產物。再確認流量實際走向、執行核心操作、看資料有沒有壞。程式版本倒回去，不會自動撤銷資料庫已做的變更；若新版已刪掉舊欄，舊程式可能根本不能啟動。事前要確定舊版仍能讀寫目前的資料，或規劃向前修補的路徑。

## 範例：3 種判決不是只有過或不過

在 `C:\dev\stackway-lab\delivery` 建立 `rollout.mjs`，執行 `node rollout.mjs`。這是非正式環境的路由模型，不會調動真實流量。兩組樣本在這個練習已來自同一段觀察期，穩定版失敗率是 1%；候選版超過它 2 個百分點就退回。數字是練習約定，不是所有網站的通用門檻。

```js
const stable = {version:"v1", read:()=>"catalog ready"};
const candidate = {version:"v2", read:()=>"catalog preview"};
for (const [total, failed] of [[2,0],[100,1],[100,8]]) {
  let route = candidate;
  const decision = total < 100 ? "hold" :
    failed / total > 0.01 + 0.02 ? "rollback" : "expand";
  if (decision === "rollback") route = stable;
  console.log(total, failed, decision, route.version, route.read());
}
```

最後一列不是只印回復字樣，而是經由目前路由讀出穩定版的資料。若改成只列印指定的版號而不真正呼叫，設定拼錯也可能拿到一張漂亮收據。模型只能驗證決策分支；真正演練還要從獨立於部署工具的入口重做使用者操作。

### 用百分點而不是印象做決定

把最後一組的 2 個比率分開寫：候選版每 100 次失敗 8 次，穩定版每 100 次失敗 1 次，差距是 7 個百分點，超過這次約定的門檻。若把候選版只分到的少量失敗都攤進全站大量成功裡，差距看起來會小很多。再假設同一時段兩版都變慢，先查共同依賴是否異常，不要僅因時間剛好重疊便宣稱候選版有瑕疵。暫停擴量是保護讀者的決定，不必假裝已經知道根本原因。

## 常見錯誤與小結

不要只盯全站平均：新版本只接少數請求，全部混在一起可能看不出錯誤。也不要在看到結果後才改門檻讓它過關。把候選版、對照版、樣本數、判決、恢復驗收寫在同一張紀錄裡，事後才能清楚說明為什麼在那一刻停止，而不是靠運氣猜對。
