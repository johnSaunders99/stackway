---
id: ai-iac-05-drift
module: ai-iac
order: 5
title: 組態漂移與修正
subtitle: 手動變更後怎麼回到一致
status: ready
minutes: 40
level: 3
prereqs:
  - ai-iac-04-budget
objectives:
  - 依差異報告判斷要還原或納入設定
  - 寫出含狀態備份與人工關卡的流程
tags:
  - iac
  - drift
resources:
  - title: "HashiCorp：偵測並處理組態漂移"
    url: https://developer.hashicorp.com/terraform/tutorials/state/resource-drift
    kind: course
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
  - title: "HashiCorp：閱讀 Terraform 計畫與規劃模式"
    url: https://developer.hashicorp.com/terraform/cli/commands/plan
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-iac-05-drift-direction
    prompt: "有漂移時應還原現場還是納入設定？"
    answer: "先確認身分、調整原因及目標，逐項決定現場要回到設定或設定追上合理的新需求。"
    mcq:
      question: "緊急擴容是否應立刻縮回？"
      options:
        - "先確認尖峰是否結束及核准範圍"
        - "只要有差異一律縮回"
        - "只要曾經救急便永久保留"
        - "把所有變更一起批准"
      answer: 0
      explain: "同一差異可以有不同合理處理方式，要看現況與授權。"
    interview:
      question: "手動擴容後隔天計畫要縮容，你怎麼處理？"
      points:
        - "先確認差異來源及服務情況"
        - "選還原或納入設定"
        - "備份、人工核准與事後驗證"
      answer: "我會保留這份差異並看目前積壓。若需求已變，就提設定變更；若是短峰，確認縮回也能承接。執行前確認狀態有受保護備份並重做審查，事後核對服務水位。"
  - id: ai-iac-05-drift-refresh
    prompt: "只更新狀態會不會自動改寫設定？"
    answer: "不會；設定和狀態是不同產物，之後普通計畫仍會比較期望與觀察。"
    mcq:
      question: "現場 4、設定 2，只有狀態更新為 4，下一份普通計畫可能怎樣？"
      options:
        - "自動將設定改為 4"
        - "保證永久忽略此差異"
        - "把歷史資料還原"
        - "仍提出調回 2"
      answer: 3
      explain: "設定意圖未變，重新觀察不是接受新設定。"
  - id: ai-iac-05-drift-backup
    prompt: "狀態備份與資料備份能救回的對象有何不同？"
    answer: "前者保存管理綁定與觀察，後者才有可能還原已刪除的業務內容。"
    mcq:
      question: "保存期縮短後有舊報表消失，應優先查什麼才能回復內容？"
      options:
        - "資料備份範圍與可還原性"
        - "狀態檔裡是否還寫 30"
        - "只把期限改回 30"
        - "報表資源名稱是否相同"
      answer: 0
      explain: "改規格或綁定無法重建已不存在的資料。"
practice:
  - id: ai-iac-05-drift-p1
    title: "寫一張逐欄漂移處理單"
    kind: explain
    minutes: 18
    steps:
      - "執行 compare.py，將兩列抄入 drift-review.md"
      - "為工作程序列兩種方向的證據，另寫資料保存風險"
      - "按順序列出備份、核准、變更與復查關卡"
    checks:
      - "更新狀態與改設定分開"
      - "資料損失有獨立還原檢查"
      - "每一欄都有核准前必須回答的問題"
---

## 為什麼要學：緊急調整隔天怎麼辦？

值班時把工作程序從 2 份加到 4 份，佇列終於消退。隔天自動化流程準備「修正」它，打算縮回 2 份。組態漂移（configuration drift）指實際環境偏離原先受管理的預期，常見原因是有人繞過設定做了現場調整。差異是真實的，但不能光憑有差異就判定誰錯。也許臨時擴充應復原，也許服務需求已經改變，舊設定才是過期的那張紙。

## 核心概念：先做觀察，再選方向

用三欄並排看設定、上次狀態與新觀察。若只看「原本 2、現在 4」，你還不知道是現場修改、設定提案，還是拿錯環境。先核對環境與綁定，再問調整的原因、授權、時效及服務指標。如果只是短暫尖峰，決定可以是讓現場回到設定；若尖峰已成常態，則可能要保留現場值並把理由納入設定審查。兩條路都不能略過人工決定。

只更新狀態的規劃模式（refresh-only）用來檢視外部變更對狀態的影響；真正採用這類更新也不是把新值寫進你的設定檔。若設定仍寫 2，稍後的普通計畫可能還是要求縮回 2。反過來，還原舊狀態備份也不會把正在跑的機器變回去；那份檔案是綁定與觀察，不是服務資料的時間機器。

## 範例：同一份差異，2 種可辯護的決定

在 `C:\dev\stackway-lab` 新建 `drift-lab`，將這段存成 `compare.py`，於該處用 `py compare.py`；macOS 或 Linux 用 `python3 compare.py`。這是合成差異報告，不連到 Terraform 或任何雲端。

```python
last = {"workers": 2, "retention_days": 30}
observed = {"workers": 4, "retention_days": 7}
desired = {"workers": 2, "retention_days": 30}
for field in desired:
    print(field, "last", last[field], "observed", observed[field], "desired", desired[field])
```

先替工作程序寫兩張便條。「恢復 2」要有離峰處理量與排隊時間能接受的證據；「保留 4」則要確認新增支出有人負責，修改設定後重新看計畫。保存天數是另一個決策：從 30 天被縮成 7 天可能已影響歷史資料，把設定改回 30 天並不能救回已清除的內容。要另查資料備份可還原到哪天，不能一鍵接受所有現場差異。

### 把人工關卡寫進處理順序

先保存唯讀差異與時間，避免其他變更同時混進來；確認狀態後端有受存取控制的版本備份與恢復方式，涉及內容時另查資料備份。接著逐欄定方向、寫理由、指定核准角色，對正確環境重新規劃。等核准者看過會變動的資源與恢復條件，再由授權流程施工；最後以新觀察核對設定，還要看排隊時間或資料可讀性，而不是只看工具回報成功。

## 常見錯誤

把所有欄位都忽略，就看不到真正需要注意的變動。若某欄確實屬於另一個自動控制元件，應明寫責任歸屬和監看方式，而非沉默。另一個錯誤是遇到差異便把狀態檔下載到個人桌面做公開附件；紀錄可用合成摘要，真實備份仍要留在受保護的位置。

## 小結

漂移報告是需要選方向的問題清單，不是自動修理按鈕。能說明哪欄要回復、哪欄要納入設定、誰核准，以及哪種資料無法靠狀態救回，才算真的重新建立一致性。
