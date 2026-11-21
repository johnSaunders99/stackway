---
id: ai-gateway-04-cost
module: ai-gateway
order: 4
title: 成功請求的單位成本
subtitle: 每個成功答案花了多少
status: ready
minutes: 35
level: 3
prereqs:
  - ai-gateway-03-evaluation
objectives:
  - 把失敗與重試計入總成本
  - 使用一致的品質門檻比較兩種配置
tags:
  - gateway
  - cost
resources:
  - title: "FinOps Foundation：用單位經濟衡量服務價值"
    url: https://www.finops.org/framework/capabilities/unit-economics/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-gateway-04-cost-numerator
    prompt: "失敗和重試費用算在哪裡？"
    answer: "凡在約定計算範圍內已發生，都計入總成本分子，不只計最後成功的一次。"
    mcq:
      question: "q1 花 2 點失敗又花 2 點成功，這題占多少成本？"
      options:
        - "2 點"
        - "0 點"
        - "1 點"
        - "4 點"
      answer: 3
      explain: "失敗沒有消除已發生的費用，重試也不是免費。"
    interview:
      question: "甲每呼叫只收 2 點，乙收 4 點，你怎麼選？"
      points:
        - "使用相同題組與品質期限"
        - "成本含重試及失敗"
        - "並列總額、成功率與每成功成本"
      answer: "我不會只比單次標價。這批甲花 6 點只解決 1 題，乙花 8 點解決 2 題，在相同門檻下乙每個成功只要 4 點；但我也要確認總預算容得下乙。"
  - id: ai-gateway-04-cost-denominator
    prompt: "計算成功請求成本時，分母的單位是什麼？"
    answer: "在相同品質及期限下合格的不同邏輯任務，而非每次嘗試。"
    mcq:
      question: "同題重送 2 次皆產生合格回覆，分母加多少？"
      options:
        - "2 個合格任務"
        - "2 次模型計費"
        - "0 個任務"
        - "1 個合格任務"
      answer: 3
      explain: "同一題的額外回覆不代表多解決一個使用者問題。"
  - id: ai-gateway-04-cost-fair
    prompt: "比較兩種配置時為什麼要固定成功門檻？"
    answer: "放寬成功定義會增加分母，讓單位成本看似下降而沒有實際改善。"
    mcq:
      question: "哪個評估最能支持公平比較？"
      options:
        - "便宜模型只答短題"
        - "另一版只看正常回應碼"
        - "只挑兩邊各自最佳結果"
        - "同題組、同期限、同品質判準及成本範圍"
      answer: 3
      explain: "題目或成功定義不同，差異可能不在配置本身。"
  - id: ai-gateway-04-cost-zero
    prompt: "0 合格任務時單位成本怎麼呈現？"
    answer: "報總成本、0 成功和比率不適用，不把 0 分母當免費。"
    mcq:
      question: "花了 8 點無一合格，該報什麼？"
      options:
        - "每成功成本 0 點"
        - "總花費 8 點，0 成功，單位成本不適用"
        - "每成功成本 8 點"
        - "不用列入帳目"
      answer: 1
      explain: "沒有可當分母的成果，但支出仍存在。"
practice:
  - id: ai-gateway-04-cost-p1
    title: "做一份含失敗成本的對帳單"
    kind: code
    minutes: 16
    steps:
      - "跑 cost.py，在 cost-note.md 列出嘗試、原題代號、花費和成功判準"
      - "把甲的成功也改成失敗，保存第二次輸出"
      - "為兩個實驗配置寫一個相同的成本範圍"
    checks:
      - "甲 6 點與乙 4 點均以合格任務為分母"
      - "甲所有嘗試失敗仍花 6 點"
      - "沒有把總額較低直接解讀為每份成果較省"
---

## 為什麼要學：便宜的模型為什麼每個答案反而更貴？

甲模型每次呼叫收的點數較少，但遇到長問題常失敗，使用者必須再送一次，最後仍可能拿到不完整的答案。乙模型每次呼叫較貴，可是多數問題一次就過。單次呼叫費回答的是「供應一趟花多少」，成功請求的單位成本（cost per successful request）回答的是「交給使用者一份合格成果，整體平均付出多少」。兩個指標都可用，不能拿來代替彼此。

## 核心概念：分子數所有嘗試，分母數合格任務

先定義一個邏輯請求：同一題因逾時重試，仍是同一個使用者任務。再定義何為成功，例：「規定時間內完成，答案符合固定判準且有文件支持。」不能只看服務回覆成功代碼，因為空白或錯誤答案也可能正常送達。成本分子則要納入本批所有嘗試，包含失敗、逾時和重試的已發生成本。若檢索、重排或閒置算力也要歸入本批，須說明範圍及分攤方式，兩個配置一視同仁。

先鎖定相同題組、品質門檻、期限、預算單位和觀察窗口。測試題若一邊全短題、另一邊全長題，看來便宜可能只是分到不同工作。只報每成功成本也會漏掉整批成功率；一個服務即使只回答最簡單的題目，也可能得到很漂亮的單位成本。把成功件數與所有原始任務數一起附上，才能看見省下點數是否以放棄難題換來。

## 範例：把每次執行對回使用者原題

在 `C:\dev\stackway-lab` 新建 `unit-cost-lab`，將以下存成 `cost.py` 後執行 `py cost.py`；macOS 或 Linux 用 `python3 cost.py`。甲乙各面對相同的 2 個問題，費用以虛構點數表示；布林值已按同一品質和期限判定。

```python
runs = {"A": [("q1", 2, False), ("q1", 2, True), ("q2", 2, False)],
        "B": [("q1", 4, True), ("q2", 4, True)]}
for name, rows in runs.items():
    total = sum(points for _, points, _ in rows)
    passed = {qid for qid, _, ok in rows if ok}
    unit = total / len(passed) if passed else None
    print(name, "total", total, "qualified", len(passed), "per success", unit)
```

甲花 6 點，交出 1 份合格答案，單位成本是 6 點；乙花 8 點，交出 2 份，單位成本是 4 點。乙這批總花費較高，但每個合格任務較便宜，成功率也較高。若總預算只准花 6 點，還需要調整範圍或配置，不能僅憑單位成本宣布乙在所有條件都勝出。這是合成的比較，不是任何產品的即時報價。

### 把容易漏的成本列在帳外說明

假設甲逾時後，模型其實仍在產生詞元（token），使用者雖然沒收到，供應端若已計費就要算進分子。若費用尚未取得，先標未結算，不要填入 0。自架模型則可能主要付固定執行時間而不是每次呼叫；應選定同一期間把該負擔的算力成本分攤進來，再比較合格任務。如何讓呼叫者離開後工作及時停止，之後在[〈Go context 與取消〉](#/lesson/ai-gateway-05-timeout)會細講。

## 常見錯誤

只加成功那次的費用，讓最常失敗的配置看似最省；或把每次重試都當一個新任務，使分母跟著失敗膨脹。若整批沒有合格答案，分母是 0，應報總花費和0 個任務成功、單位成本不適用，不能填成免費。

## 小結

一手拿完整成本帳，一手拿去重後的合格任務清單。先保證兩邊用同一把尺，再討論是要省總預算、提高成功率，還是降低每個可用答案的成本。
