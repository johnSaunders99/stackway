---
id: fd-aws-07-cleanup
module: fd-aws
order: 7
title: AWS 資源清理與對帳
subtitle: 主機沒了，帳單為何還有費用
status: ready
minutes: 30
level: 3
prereqs:
  - fd-aws-06-rds
objectives:
  - 依相依順序列出示意環境的退場步驟
  - 檢查殘留磁碟、快照及位址，註明需保留資料與帳單延遲
tags:
  - aws
  - cleanup
resources:
  - title: "AWS Billing：追查意外費用"
    url: "https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/checklistforunwantedcharges.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "AWS Budgets：預算追蹤與通知"
    url: "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-aws-07-cleanup-dependency"
    prompt: "為何退場時先處理仍會建新工作的來源？"
    answer: "避免清理中又產生寫入或重建資源。"
    mcq:
      options:
        - "因為備份都必須最先刪除。"
        - "因為停排程就不必再對帳。"
        - "避免清理中又產生寫入或重建資源。"
        - "因為停入口會自動清空磁碟。"
      answer: 2
      explain: "先停止新工作、排空既有工作，再處理資料。"
    interview:
      question: "實驗已結束，但儲存費還在，你怎麼對帳？"
      points:
        - "對齊使用與入帳期間"
        - "盤點磁碟快照位址與區域"
        - "區分保留和殘留"
      answer: "我不會看到非零帳單就再刪一次。我會按服務和區域對照清冊，找拆除後是否仍有新用量，將有期限的備份列為預期費用，其餘請負責角色確認。"
  - id: "fd-aws-07-cleanup-retain"
    prompt: "保留期未到的快照應如何列帳？"
    answer: "列出保留理由、負責角色、期限與可能的費用。"
    mcq:
      options:
        - "當成清理失敗而立即刪除。"
        - "從清單移除避免報表難看。"
        - "改名為空閒就不用付費。"
        - "列出保留理由、負責角色、期限與可能的費用。"
      answer: 3
      explain: "有理由留下與漏刪是不同狀態，兩者都要可追蹤。"
  - id: "fd-aws-07-cleanup-delay"
    prompt: "拆除當天仍有帳單項目，怎麼判讀？"
    answer: "比對使用期間與拆除時間，待更新後再查有無新用量。"
    mcq:
      options:
        - "比對使用期間與拆除時間，待更新後再查有無新用量。"
        - "看到金額就斷言主機仍在運作。"
        - "立刻宣告未來不會再收費。"
        - "只核對單一區域的主機數。"
      answer: 0
      explain: "歷史用量可能延後入帳；還要查服務、區域及殘留資源。"
practice:
  - id: "fd-aws-07-cleanup-p1"
    title: "交一張有保留理由的退場清單"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 retire.py"
      - "將每列分類成結束、待查或保留"
      - "替保留列補上期限與下次對帳日"
    checks:
      - "沒有實際刪除雲端資源"
      - "清單涵蓋磁碟、快照、位址及入帳時間差"
---

## 為什麼要學：沒有主機，為什麼帳單還在動？

實驗結束時，執行個體清單已空，帳務報告卻還有儲存與位址用量。這不必然表示重複扣款：有些資源與主機分開存續，有些金額在用量發生後才入帳。退場（decommissioning）不是把畫面清到空白，而是停止不再需要的能力、保存應留的資料，讓後續帳務可以解釋。本課不連帳號，不執行任何雲端刪除指令。

## 核心概念：先問誰還在用，再問哪些該留下

從相依關係反推順序。先確認這是指定的實驗環境、誰能核准處置、是否與別的服務共用。停止新的入口流量與排程後，等待或處理未完成工作，再凍結寫入。若資料要保留，先列保留期間並驗證可還原。確認消費者不再需要資料後，才規劃拆除專用運算與不必保留的儲存。不要對名稱相似的資源一律採取同一動作。

清冊（inventory）應含服務、區域、識別標記、用途、保留決定及下一次複查。執行個體不存在，仍要盤點未附掛磁碟、手動快照、保留的公有位址及物件的舊版本。有些資源由別的服務代為建立，還要追到上層管理者以免又被建回。查成本報告先看「何時使用」，不能把「何時看到費用」當作資源仍在的唯一證明。

## 範例：把保留與不明殘留分 2 欄

在 `C:\dev\stackway-lab\aws` 儲存 `retire.py`，執行 `py retire.py`；macOS／Linux 用 `python3 retire.py`。這張虛構清冊的日期是實驗結束後的相對天數。程式只列待辦，不刪任何東西；「待查」不是「允許刪除」的同義詞。

```python
items = [("compute","gone",""), ("volume","detached",""),
         ("snapshot","present","retain until day 14"), ("address","allocated","")]
for kind, state, reason in items:
    decision = "closed" if state == "gone" else ("keep" if reason else "review")
    print(kind, state, decision, reason)
```

未附掛磁碟可能是意外殘留，也可能是唯一的那份實驗結果，所以先查用途與還原點。保留 14 天的快照則是明知會有費用的例外；到期日還要有角色接手檢查。位址尚在配置中要核對是否仍供其他入口使用，不能只看它現在沒連著哪台主機。

### 對帳時替每張收據找一條時間線

第一筆費用出現在清理之後，但標示的使用時段在清理之前，先列歷史用量。第二筆落在清理之後，又對應明訂保留的快照，列為有理由的持續成本。第三筆同樣在清理之後，清冊卻找不到該磁碟的用途，才需要追加調查。三筆都會出現在帳上，不能用一句「有收費就是沒清乾淨」概括。把待查項目的負責角色與回看日期寫出來；無法證明沒人在用的儲存，不應拿刪除來驗證猜測。

## 常見錯誤與小結

只看目前選的區域，或只看運算服務，會漏掉其他區域和計費項目。記下拆除時間、報告涵蓋的使用期間與查帳時間，等下一次帳務更新再比是否新增用量。真正的完成條件不是總額立刻歸零，而是剩下的資源每個都有理由，後續費用每筆都有人能核對。
