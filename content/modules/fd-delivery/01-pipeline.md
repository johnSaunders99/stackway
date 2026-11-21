---
id: fd-delivery-01-pipeline
module: fd-delivery
order: 1
title: GitHub Actions 流程
subtitle: 讓乾淨環境重跑檢查
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 讀出 GitHub Actions 中 workflow、job、step 與失敗狀態的關係
  - 把觸發事件與執行步驟分開
  - 從失敗紀錄指出第一個真正的錯誤
tags:
  - delivery
  - ci
resources:
  - title: "GitHub Actions：工作流程與執行器"
    url: "https://docs.github.com/en/actions/get-started/understand-github-actions"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-delivery-01-pipeline-trigger"
    prompt: "GitHub Actions 的 on 和 steps 各回答什麼？"
    answer: "何時觸發，以及觸發後依序做什麼。"
    mcq:
      options:
        - "在哪執行，以及誰付費。"
        - "如何保存產物，以及多久過期。"
        - "用什麼語言，以及誰可閱讀。"
        - "何時觸發，以及觸發後依序做什麼。"
      answer: 3
      explain: "觸發事件不會自動推斷要執行的檢查，兩者都要明寫。"
    interview:
      question: "同事說本機通過而流程失敗，你如何開始查？"
      points:
        - "定位第一個紅色步驟"
        - "比較輸入與工具環境"
        - "原樣重跑最小失敗指令"
      answer: "我先找哪一步第一次失敗，不從最後的摘要猜。記下工作目錄、工具版本與測試輸入，在乾淨環境重跑同一條指令；若缺少檔案，就補明確取得它的步驟。"
  - id: "fd-delivery-01-pipeline-runner"
    prompt: "為什麼本機有的檔案不一定在託管執行器上？"
    answer: "新的工作有自己的執行環境，所需輸入必須明確提供。"
    mcq:
      options:
        - "新的工作有自己的執行環境，所需輸入必須明確提供。"
        - "不同步表示所有步驟都跳過。"
        - "觸發事件會自動傳送桌面資料夾。"
        - "同一帳號的電腦必定共用硬碟。"
      answer: 0
      explain: "不要依賴本機殘留的工具、檔案或私密設定。"
  - id: "fd-delivery-01-pipeline-exit"
    prompt: "紀錄末行只有 exit code 1，下一步看哪裡？"
    answer: "找到最早失敗步驟的第一個具體診斷。"
    mcq:
      options:
        - "直接把所有步驟改成忽略失敗。"
        - "找到最早失敗步驟的第一個具體診斷。"
        - "只看後續被跳過的發布步驟。"
        - "改觸發條件讓工作不再執行。"
      answer: 1
      explain: "退出碼是結果；出錯的參數、斷言或缺少的檔案才有助定位。"
  - id: fd-delivery-01-pipeline-skip
    prompt: "最後的步驟被標為跳過，能否據此推斷該步驟的命令有錯？"
    answer: "不能。先前步驟失敗就可能使後面的成功條件不成立；應找真正執行且最早失敗的步驟。"
practice:
  - id: "fd-delivery-01-pipeline-p1"
    title: "交一份能指出故障位置的流程檔"
    kind: "hands-on"
    minutes: 12
    steps:
      - "存下工作流程"
      - "在 PowerShell 執行其中的 node 指令"
      - "把預期值從 4 改成 5，保存第一個斷言錯誤再改回"
    checks:
      - "原值退出碼為 0"
      - "失敗版有實際值與預期值"
      - "能分別圈出事件、工作與步驟"
---

## 為什麼要學：本機的綠燈可以交給誰重跑？

你修完一個加總函式，在桌面上跑過測試。另一台機器卻少了一份檔案。持續整合（continuous integration，CI）的用途不是替提交加上漂亮圖示，而是把取得輸入、執行檢查與回報失敗的方式寫成版本化的程序。每次在乾淨環境重跑，才知道結果依靠的是專案本身，還是誰的桌面剛好有一份額外資料。

## 核心概念：讀懂 4 層名稱

工作流程（workflow）是一份放在專案指定目錄下的 YAML 檔。事件（event）決定何時啟動，例如手動執行或推送程式；工作（job）指定執行器（runner），也就是提供作業系統與工具的機器。步驟（step）則在同一份工作中依序執行。某個命令回傳非零退出碼，預設會讓那一步失敗，後面只在成功時執行的步驟便跳過。

同一個工作中的步驟可讀前一步建立的檔案，不同的託管工作不能假設共用磁碟。要測自己放在版本庫裡的程式，還得先取出原始碼；事件會帶來版本資訊，不會讓所有檔案自動出現在當前目錄。本例故意只用執行器內的 Node 指令，所以不需要取出專案，也不用任何憑證。

## 範例：用可手動觸發的檢查分辨綠燈和紅燈

為只供練習的工作流程建立 `C:\dev\stackway-lab\delivery`。依照下面的目錄層級存成 `.github/workflows/arithmetic.yml`。本機練習不必建立遠端專案。若日後在已啟用 Actions 的練習庫使用手動事件，流程檔須先存在預設分支；只把檔案放在本機不會啟動託管工作。

```yaml
name: Arithmetic check
on: workflow_dispatch
permissions: {}
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Check the total
        run: node -e "require('node:assert/strict').equal(2+2,4)"
      - name: Mark success
        run: echo checked
```

把第一條 `run` 後面的命令直接貼到 PowerShell；macOS／Linux 也可貼入終端機。成功時斷言沒有文字，不要把安靜誤判為沒執行。Windows 看 `$LASTEXITCODE`，其他系統看 `echo $?`。再把等號右方預期值換成 5，讀輸出中的實際值與預期值；這一條具體差異比「工作失敗」有用得多。

### 用 2 份紀錄分辨「沒跑」與「跑壞」

一份紀錄只有手動觸發的按鈕，沒有這次提交的執行項目；另一份紀錄有工作名稱、啟動時間，也列出失敗的斷言。前者應檢查事件與分支條件，後者才是調查命令輸入與結果。不要一直修改算術公式來解決沒有觸發的問題，也不要為了避開失敗就把事件改成不會發生的條件。對照第一次成功時的步驟順序，你可以指出末尾沒有成功標記究竟是沒啟動、被跳過，還是本身執行出錯，三者的下一步完全不同。

把觸發事件、執行工作與驗收結果各劃一欄；檔案存在於儲存庫，只能證明流程已寫下，不能證明已成功執行。

## 常見錯誤與小結

只看最後一行往往只讀到一般性的退出碼；整份紀錄搜尋到第一個警告，也不代表它是原因。先找到第一個真正失敗的步驟，再從該步驟向前讀到能解釋失敗的訊息。修好後用同一個輸入重跑，確認成功標記不是因為測試被註解或略過了。
