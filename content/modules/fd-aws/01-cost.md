---
id: fd-aws-01-cost
module: fd-aws
order: 1
title: AWS 預算與成本提醒
subtitle: 提醒不是會自動斷電的開關
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 用時數、儲存量與流量列出試算假設
  - 區分預算提醒與強制上限，無帳號時用紙上帳單完成
tags:
  - aws
  - cost
resources:
  - title: "AWS Budgets：預算追蹤與通知"
    url: "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "AWS Billing：追查意外費用"
    url: "https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/checklistforunwantedcharges.html"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-aws-01-cost-units"
    prompt: "一個月只運算 20 小時，但磁碟保留整月，如何估算？"
    answer: "用 20 小時計算運算，另依整月容量計算儲存。"
    mcq:
      options:
        - "用 20 小時計算運算，另依整月容量計算儲存。"
        - "所有項目都只收 20 小時。"
        - "所有項目都按整月運算時數。"
        - "只計資料傳出不計磁碟。"
      answer: 0
      explain: "每個資源有自己的單位與使用期間。"
    interview:
      question: "專案預算很小，可以把提醒當作超支保險嗎？"
      points:
        - "試算用量與單位"
        - "提醒有延遲且不強制停用"
        - "指定動作與複核"
      answer: "我會先算正常與忘記關機的兩張帳單。設提醒是為了提早查用量，不是保證不超支；要有人負責看異常、處理測試資源並再次對帳。"
  - id: "fd-aws-01-cost-alert"
    prompt: "收到預算超標通知意味著什麼？"
    answer: "成本資料符合通知條件，需要判讀並採取行動。"
    mcq:
      options:
        - "配置中的機器已自動關閉。"
        - "成本資料符合通知條件，需要判讀並採取行動。"
        - "往後所有使用一律不計費。"
        - "已自動刪除帳上資料。"
      answer: 1
      explain: "普通通知不是即時硬上限，也不替你處置資源。"
  - id: "fd-aws-01-cost-forecast"
    prompt: "已發生成本與預測成本的差別是什麼？"
    answer: "前者依已入帳用量，後者估計期間結束時可能的結果。"
    mcq:
      options:
        - "預測是已扣款金額。"
        - "實際表示每秒都完全同步。"
        - "前者依已入帳用量，後者估計期間結束時可能的結果。"
        - "兩者只差通知方式。"
      answer: 2
      explain: "成本資料有延遲，預測也不是最後帳單。"
practice:
  - id: "fd-aws-01-cost-p1"
    title: "做一張不需帳號的紙上帳單"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 budget.py"
      - "把運算時數改成 80 而維持儲存量"
      - "在預算單寫明通知後先查哪個項目"
    checks:
      - "原試算總數為 70 點，第二次為 190 點"
      - "明確寫出是假設單價，不是雲端報價"
---

## 為什麼要學：沒按過部署，也能先練算帳

一次小實驗只打算跑兩晚，最容易忘的是兩晚以外仍在的東西。有些費用跟主機運作時數走，有些跟配置容量與保留期間走，還有些跟資料傳輸方向及數量有關。預算（budget）先定義監看的範圍與期間，再用成本資料發現偏差。這堂完全在紙上與本機完成，不需註冊、輸入付款工具或啟用任何服務。

## 核心概念：先寫單位，再乘費率

把每一項寫成「數量乘對應單價」。假設一個月只開 20 小時運算，整月保留 10 個容量單位的磁碟，對外傳出 5 個資料單位，三種用量不能加成 35 再乘一個籠統單價。儲存若是按容量月收費，還得知道保留幾個月或該月的使用比例。真實試算還需明列區域、服務方案、傳輸方向和幣別，不可以把教學點數當成 AWS 價目。

實際成本（actual cost）根據目前已彙整的使用紀錄；預測成本（forecasted cost）用已有資訊估算期末。通知（alert）可分別依這兩種條件設定。費用資料不是即時電表，服務使用和通知送達中間可能有落差。一般提醒不會自己停止資源；即使另設預算動作（budget action），也要明定授權與作用範圍，不能把它當作所有服務絕不超支的開關。

## 範例：故意讓帳單跨過預警線

為不需雲端帳號的預算試算建立 `C:\dev\stackway-lab\aws`。存入 `budget.py`，用 `py budget.py` 執行；macOS／Linux 用 `python3 budget.py`。所有數字都是自訂練習點數：運算每小時 2 點、儲存每容量月 1 點、傳出每單位 4 點。沒有向 AWS 查價或查用量。

```python
budget = 100
rows = [("compute-hours", 20, 2), ("storage-unit-month", 10, 1),
        ("outbound-units", 5, 4)]
total = 0
for label, used, rate in rows:
    subtotal = used * rate
    print(label, used, rate, subtotal)
    total += subtotal
print("total", total, "notify" if total >= 0.8 * budget else "below threshold")
```

第一次合計 70 點，距 80 點的預警線還有 10 點。把運算時數改成 80 再跑，其餘兩項應該原封不動。結果出現提醒文字以後，數字還是 190，沒有截斷成 100。這正是查帳與強制限制的差別。若要找出增幅原因，比較每列小計比只看總額更快。

### 把預警交給能採取行動的人

假設提醒在隔天上午才到，負責角色應先確認費用屬於哪一天、哪項服務、哪個專案，再比對當初的時數假設。若運算時數符合預期，卻是保留容量增加，不該只把主機停掉就宣布結案。也可能已有處置，只是報告尚未反映；把處置時間留在帳單旁，下一次比較新的用量而不是舊金額。這種交接讓沒有帳號的人也能先練習判斷：看到的是一筆真實歷史、一個期末預估，還是必須馬上查明的持續使用？

成本提醒是通知，不是自動停止計費的開關。保留用量單位和預算期間，下一位讀者才有辦法重算。

## 常見錯誤與小結

不要將方案優惠、折抵或特定用量門檻當成永遠適用的價格。做決策前重新確認適用條件，並另外列出超過假設後會發生什麼。把預警後的第一個動作寫成能執行的話，例如「核對昨天的運算時數是否含夜間閒置」，而不只是「注意花費」。
