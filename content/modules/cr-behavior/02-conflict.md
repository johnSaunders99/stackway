---
id: cr-behavior-02-conflict
module: cr-behavior
order: 2
title: 協作分歧與回饋
subtitle: 有分歧時先找共同目標
status: ready
minutes: 30
level: 4
prereqs:
  - cr-behavior-01-story
objectives:
  - 重述另一方的合理顧慮
  - 提出可逆的小實驗比較兩個方案
tags:
  - behavior
  - disagreement
resources:
  - title: Microsoft Careers：用經驗說明如何協作與回應回饋
    url: https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: Atlassian：工程面試中的系統設計與協作
    url: https://www.atlassian.com/company/careers/resources/interviewing/engineering
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-behavior-02-conflict-restate
    prompt: 哪一句是能讓對方修正的重述？
    answer: 用中性語句說明對方想保護的結果，再邀請確認。
    mcq:
      options:
        - 你是不是只重速度？
        - 我們不要再討論了
        - 你想保留今天取得回饋的機會，對嗎？
        - 我知道你一定同意我
      answer: 2
      explain: 重述是確認理解，不是猜人格、要求讓步或替對方表態。
    interview:
      question: 同事不同意你的做法，你能說出對方可能是對的地方嗎？
      points:
        - 中性重述另一方的目標
        - 共訂相同測試與底線
        - 依結果選擇並留下代價
      answer: 我也想保住展示取得回饋的機會，所以我會先確認是否非測匯入不可。我們用副本比兩案，都不接受假成功。若只要看結果就用預載版；若必須測匯入而兩案都不行，我會支持延期。
  - id: cr-behavior-02-conflict-experiment
    prompt: 比較兩個展示方案前，哪件事最關鍵？
    answer: 先約定相同任務與不可接受的結果，使用可回復的測試環境。
    mcq:
      options:
        - 看完結果再挑指標
        - 讓兩組使用不同難度資料
        - 直接改正式使用者資料
        - 先約定門檻與退出方式
      answer: 3
      explain: 事後選尺或不同案例無法公平比較，正式資料不該承擔演練風險。
  - id: cr-behavior-02-conflict-neither
    prompt: 若兩個候選都未通過必要條件，應如何回報？
    answer: 明說目前無合格方案，協商改期或改範圍，不包裝成已達標。
practice:
  - id: cr-behavior-02-conflict-p1
    title: 寫一份不靠說服力取勝的比較便箋
    kind: explain
    minutes: 13
    steps:
      - 在 disagreement.md 各用一句話替雙方發言，再寫共同目標與不得違反的條件。
      - 用範例資料判定兩種目標下的選案；為一項實驗補上停止與還原方式。
    checks:
      - 自備檔不是必要時只留下 sample；必要時沒有合格方案。
      - 給對方的回饋包含觀察、影響與具體請求，不含人格判斷。
---

## 要延後展示，還是先關閉匯入？
同一個錯誤，測試角色主張延期，展示角色主張照常。前者擔心讀者以為資料都已存好，後者擔心錯過一次收集回饋的機會。如果你在面試只說「我用證據說服了對方」，聽者還是不知道你有沒有理解另一案真正要保護的東西。協作分歧 (disagreement) 要展現的不是勝負，而是如何讓不同擔憂進入同一個決定。

## 重述到對方願意點頭，再訂比較條件
先說：「我理解你想保留這次展示的回饋，不是覺得資料遺失沒關係，這樣說對嗎？」給對方糾正的空間。再說明自己的底線：「我擔心畫面顯示成功，但檔案裡的資料沒有進來。」這比「你太趕，我比較重品質」準確得多。接著找共同目標，例如讓試用者能完成一條可信的操作，又不把展示變成假成功。把不能犧牲的條件寫成門檻，其他部分才拿來比較。

可逆實驗 (reversible experiment) 要能退回原狀，且無須用真實使用者承擔試錯成本。例如用一份拋棄式資料副本，比較「開放匯入但遇不支援檔案要明確拒絕」和「關閉匯入但提供已載入的範例」。不在正式服務切換功能；兩案用相同任務、相同檔案與相同計時起點，各記是否出現假成功、試用者能否看見目標資料。先約定只要出現假成功就不選該案，再談剩餘時間與展示價值。

## 範例：先讀結果，別急著評人
假設各做 3 次練習，方案甲有 1 次回報完成卻少一列；乙 3 次都能顯示範例，但不能展示自備檔匯入。此時選乙不等於判甲的主張較差，而是甲沒通過雙方事前同意的底線。若展示的唯一目標就是測自備檔，乙其實也不能回答問題，應坦白宣布改期，不把預載資料的畫面偷換成匯入已驗證。

在 `C:\dev\stackway-lab\behavior` 存 `decision.py`，執行 `py decision.py`；macOS／Linux 用 `python3 decision.py`。改變目標後再看合格清單，觀察哪個爭執其實來自目標不一樣。

```python
options = [("live", 1, True), ("sample", 0, False)]
for must_import in (False, True):
    print([name for name, false_ok, imports in options
           if false_ok == 0 and (imports or not must_import)])
```

若最後採用的不是你的方案，仍然可以有好的面試答案：說明對方提出哪個事實讓你修正判斷，以及你如何協助把新方案交出去。能說出自己改變主意的時刻，通常比把整段經過描成單向說服更具體。

## 常見錯誤
回饋只講個性，例如「對方太固執」，接手的人無從行動。改成觀察、影響和請求：「第二次匯入顯示完成但少一列；試用者會以為可放心關掉頁面。能否一起對照輸入列數？」若實驗仍無法分勝負，交給事前指定的決策角色，寫明何時復查；不是無限討論，也不是事後替勝方挑指標。

## 小結
一次好的協作可以在沒有共識的時候留下清楚的決定。面試時先公平重述你沒選的方案，再交代同一把尺、退出方式與最終承擔的代價。
