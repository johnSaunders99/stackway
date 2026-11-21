---
id: ai-gateway-01-gateway
module: ai-gateway
order: 1
title: 多租戶請求預算
subtitle: 替不同團隊分配請求預算
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 在入口區分租戶與服務身分
  - 用兩組流量驗證互不耗盡配額
tags:
  - gateway
resources:
  - title: "Microsoft Learn：多租戶閘道的配額與計數範圍"
    url: https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/service/api-management
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-gateway-01-gateway-mapping
    prompt: "租戶計數鍵為什麼不能直接取自請求本文？"
    answer: "自填名稱未證明授權，須從已驗證身分與可信對應取得適當租戶。"
    mcq:
      question: "哪項適合作為本例扣額依據？"
      options:
        - "本文自填團隊名稱"
        - "任意顯示名稱"
        - "已驗證服務所對應的獲准租戶"
        - "最後使用的租戶"
      answer: 2
      explain: "名稱與歷史值都不能證明本次授權。"
    interview:
      question: "兩個應用共用一組模型服務，你會怎麼證明它們沒搶走另一隊額度？"
      points:
        - "驗證服務後對租戶"
        - "同租戶合併計數"
        - "用超額與另一租戶仍成功做對照"
      answer: "我先固定窗口，讓同一隊的兩支服務把額度一起用完，再從另一隊送相同請求，確認仍能受理。這只證明帳本隔離，跨入口一致性和共用機器延遲還得另外測。"
  - id: ai-gateway-01-gateway-isolation
    prompt: "同一團隊有兩支服務時要怎麼扣團隊配額？"
    answer: "兩支共用同一租戶帳本，不能每多一支服務就多一份完整額度。"
    mcq:
      question: "文件團隊共 2 份預算，2 支服務各成功一次後再送應如何？"
      options:
        - "拒絕文件請求，客服額度不變"
        - "另發一份文件額度"
        - "扣客服以維持通過"
        - "清空全部團隊額度"
      answer: 0
      explain: "團隊額度與服務數無關，也不能轉扣其他團隊。"
  - id: ai-gateway-01-gateway-units
    prompt: "請求份數相同能否保證模型費用相同？"
    answer: "不能，輸入輸出長度與實際資源用量可不同。"
    mcq:
      question: "兩租戶各送 10 次，哪個結論有根據？"
      options:
        - "產生的詞元數一定相同"
        - "兩邊同時執行數一定相同"
        - "請求數相同，但運算成本未必相同"
        - "共享機器必定沒有競爭"
      answer: 2
      explain: "件數、用量、並行與容量是不同維度。"
  - id: ai-gateway-01-gateway-scope
    prompt: "多入口各持有完整配額會怎樣？"
    answer: "每個入口可獨立放行，合計可能超過團隊總額。"
    mcq:
      question: "若必須嚴格遵守全域餘額，該先設計什麼？"
      options:
        - "每處都完整複製原額度"
        - "跨入口一致的扣額方式或明確切分的預算"
        - "定期彙總各入口用量，不限制當下接納"
        - "只為每個入口設一樣的窗口起訖"
      answer: 1
      explain: "狀態範圍決定承諾，複製額度反而放大上限。"
practice:
  - id: ai-gateway-01-gateway-p1
    title: "保存一份雙租戶受理紀錄"
    kind: code
    minutes: 14
    steps:
      - "執行 admit.py 並把輸出存成 quota.md"
      - "新增另一筆未知身分與已用完額度的文件請求"
      - "畫服務到租戶的對應，記最終餘額"
    checks:
      - "文件第三次拒絕且客服 2 次皆受理"
      - "未知服務不會被分到預設租戶"
      - "分清帳本隔離與共享運算容量"
---

## 為什麼要學：測試團隊用完了誰的額度？

客服摘要和文件搜尋共用模型服務。文件團隊早上重跑一批測試，客服下午卻連一個請求都送不進去。多租戶（multitenancy）指同一套服務提供給多個彼此應受隔離的使用群組；模型閘道（gateway）是請求進入模型前的共同入口。只有全域額度時，第一個抵達的大戶就可能拿走全部預算。要談公平，先辨認「這筆請求應該算在誰身上」。

## 核心概念：驗證呼叫者，再決定租戶

服務身分（service identity）辨認發出請求的程式，租戶（tenant）則是要負責配額的團隊或單位。兩支前端服務可能同屬一個租戶，因此不能靠每支程式各拿一份完整額度。入口應先驗證服務身分，再查受信任的授權對應，才選定計數鍵。請求本文自填的團隊名稱只是一段輸入，不是經驗證的身分；如果服務合法代表多個租戶，還要檢查這次代理哪個租戶是否獲准。

配額（quota）是某段期間允許使用的量。這堂以固定的一個窗口計算成功接納的請求份數，不代表每筆耗用一樣的模型運算。短時間速率限制控制進件節奏，同時進行數限制尚未結束的工作，兩者和每日總配額各有不同目的。不同團隊各有餘額，只代表不會互相扣帳，不保證共享的圖形處理器永遠有空位；全域實體容量仍是另一層限制。

## 範例：2 支服務共用一個團隊帳本

在 `C:\dev\stackway-lab` 新建 `quota-lab`，存成 `admit.py` 並執行 `py admit.py`；macOS 或 Linux 用 `python3 admit.py`。輸入的服務標記假設已完成驗證，全是虛構代號，程式不負責實作登入。

```python
owner = {"doc-web": "docs", "doc-batch": "docs", "support-api": "support"}
left = {"docs": 2, "support": 2}
for service in ["doc-web", "doc-batch", "doc-web", "support-api", "unknown", "support-api"]:
    tenant = owner.get(service)
    if tenant is None:
        print(service, "unmapped")
    elif left[tenant] == 0:
        print(service, "quota exhausted")
    else:
        left[tenant] -= 1
        print(service, "admitted", tenant, left[tenant])
```

文件的 2 支服務各送一次後，第三次被拒；客服 2 次都能進入，未知服務不會消耗任何人的額度。這份輸出是一個能驗收的隔離測例：同一租戶內合併，租戶之間分開。若把計數鍵錯換成服務名稱，文件團隊就會因拆出另一支程式而取得額外預算。若把拒絕也算成已接納，重試可能讓帳目愈扣愈多，偏離本課的計費約定。

### 有多個入口時，這個承諾還成立嗎？

這個字典只適用於一個程序逐筆處理。多個入口若各自發放整份額度，總量會超過原訂上限；同時讀餘額再各自遞減，也可能重複接納最後一份。要明訂計數範圍和一致性需求，選擇共用且能不可分割扣額的計數方式，或明確切分區域預算。在課堂只需說出哪項保證未被本機測例覆蓋，不必真的部署多區服務。

## 常見錯誤

把配額耗盡和服務故障都回成同一種「稍後再試」，讓人不知道應該等窗口重設還是需要查修。另有人只數請求，誤以為能精準限制模型費用；長輸出可能遠貴於短輸出，若要管費用，還要按詞元或實際用量建立預算。

## 小結

先驗證身分、找對租戶，再依清楚的窗口與單位扣額。能展示某團隊被拒時另一團隊仍可使用，才算替配額隔離提供了正面證據。
