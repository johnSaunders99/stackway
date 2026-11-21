---
id: ai-iac-04-budget
module: ai-iac
order: 4
title: 雲端成本估算
subtitle: 替短期資源設預算邊界
status: ready
minutes: 35
level: 3
prereqs:
  - ai-iac-03-identity
objectives:
  - 用每小時單價與存續時間估算成本
  - 列出停止運算後仍需處理的費用
tags:
  - iac
  - cost
resources:
  - title: "Amazon EC2：執行個體生命週期與計費"
    url: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: "AWS Budgets：費用通知與更新頻率"
    url: https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-iac-04-budget-unit
    prompt: "運算費用怎麼從每台每小時費率換算？"
    answer: "以台數乘各台運作時數與單價，單位最後只剩費用。"
    mcq:
      question: "2 台各跑 3 小時，每台每小時 2 點，運算幾點？"
      options:
        - "6"
        - "3"
        - "12"
        - "17"
      answer: 2
      explain: "17 是含其他項目的總額；不要漏掉台數或單價。"
    interview:
      question: "短期實驗預算只有 20 點，你會如何決定能不能跑？"
      points:
        - "拆出運算與殘留費用"
        - "估正常與逾時情境"
        - "預先限制用量並安排核對"
      answer: "這組假設正常 17 點，若隔夜卻要 65 點。我先縮小試跑、限制台數和時間，安排收工核對磁碟與快照；不把帳務提醒當成即時斷電。"
  - id: ai-iac-04-budget-residual
    prompt: "停止運算後為何仍可能有費用？"
    answer: "保留的儲存、快照等項目有獨立生命週期和費率。"
    mcq:
      question: "機器已停止，下一步最應核對？"
      options:
        - "假設所有資源立即免費"
        - "仍保留的磁碟與快照、各自保留期限"
        - "只檢查機器是否還有工作程序"
        - "直接刪掉所有資料"
      answer: 1
      explain: "核對保留需求與計費項目，不把停止運算等同安全清理。"
  - id: ai-iac-04-budget-alert
    prompt: "預算通知為何不等於即時硬上限？"
    answer: "費用更新和通知可能延後，沒有另外設定控制就不會即時停止工作。"
    mcq:
      question: "要降低忘記收工風險，哪個措施最直接限制用量？"
      options:
        - "先設最長運行時間並檢查收工清單"
        - "只等月底總帳"
        - "只寄一封預算提醒"
        - "只核對啟動前的價格試算"
      answer: 0
      explain: "提醒不能保證停止，時間限制直接約束運算時數。"
practice:
  - id: ai-iac-04-budget-p1
    title: "留下含時間線的實驗預算單"
    kind: code
    minutes: 16
    steps:
      - "執行範例，把兩種情境與單位寫進 budget.md"
      - "將磁碟保留時間改成 8 天，只重算此項影響"
      - "列出收工時可停止與需確認後保留的項目"
    checks:
      - "正常情境原為 17 點，磁碟多留 4 天後為 21 點"
      - "隔夜多花費的來源可指回運算時間"
      - "虛構點數沒有被當成實際報價"
---

## 為什麼要學：停止計算，不代表帳單停止

模型只訓練 3 小時，為什麼幾天後還看得見費用？運算機器、保存模型的磁碟和傳出資料是不同的計價項目，不一定一起開始或停止。成本估算（cost estimation）先問每項用什麼單位計價，再問這個單位累積多少。這堂用虛構單價練計算，不開帳號、不查即時報價，也不建立任何付費資源。

## 核心概念：畫時間線比只看時薪可靠

把實驗拆成準備、執行、驗證和保留成果四段。運算可能從開機起就計費，即使你在等資料；磁碟若在機器停止後保留，仍要算它存在的時間。快照（snapshot）保存某個時間點的資料，也可能有獨立費用；網路傳輸依方向、區域與服務條件計算，不應假設一定收費或一定免費。費用由資源實際生命週期決定，不是由你坐在電腦前的時間決定。

假設本次以「點」代替貨幣：每台運算每小時 2 點，共 2 台、跑 3 小時；另有 1 份 50 GB 的磁碟，練習費率為每 GB 每日 0.02 點，保留 4 天；傳出 10 GB，每 GB 0.1 點。這是特意選成容易手算的帳，不是任何供應商的價格。若費率按月或有最低用量，應先看該服務的計費規則再換算，不能自動把這裡的日費套過去。

## 範例：同時算正常與忘記收工的情境

在 `C:\dev\stackway-lab` 新建 `budget-lab`，儲存 `estimate.py` 後執行 `py estimate.py`；macOS 或 Linux 用 `python3 estimate.py`。用兩條時間線，不必真的付費就能找出風險最大的乘數。

```python
for label, hours in [("planned", 3), ("overnight", 15)]:
    compute = 2 * hours * 2
    storage = 50 * 4 * 0.02
    transfer = 10 * 0.1
    print(label, "compute", compute, "disk", storage, "transfer", transfer,
          "total", compute + storage + transfer)
```

原估算 12 點運算、4 點磁碟、1 點傳輸，合計 17 點。若忘記停止，讓 2 台都跑了 15 小時，總計變成 65 點；故意固定磁碟和傳輸，是為了單獨看延長運算的影響。若預算只有 20 點，可以先做小規模短跑，在實驗前安排結束時間和檢查責任。不要把節省磁碟的 1 點當作能彌補整夜運算的 48 點。

### 預算通知和硬性上限不同

預算通知（budget alert）是根據費用或預測發出提醒，帳務資料更新會延遲；收到通知時可能已超過門檻。設定通知本身不是即時斷電開關。更實際的邊界包括限制資源規格與數量、限制工作最長執行時間、到期檢查清單，以及事後核對費用。即使停止計算，也要盤點仍保留的磁碟、快照和其他獨立計費項目。

## 常見錯誤

把磁碟單價乘運算小時，卻忘了原單位是每天；或以為機器停止就能任意刪磁碟。成本下降不等於資料可丟棄。先確認模型與紀錄要保留到何時、有沒有可還原副本、誰同意清理；本練習只做紙上清單，不對真實資源下任何清除指令。

## 小結

預算單的每一列都要能讀成「數量乘單價乘用量」。留下正常與失控情境、通知限制及收工後仍要檢查的項目，比寫一個沒有單位的總額更能保護下一次實驗。
