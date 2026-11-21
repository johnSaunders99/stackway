---
id: fd-design-05-tradeoff
module: fd-design
order: 5
title: 架構決策紀錄
subtitle: 把取捨寫成一頁設計紀錄
status: ready
minutes: 40
level: 3
prereqs:
  - fd-design-04-retry
objectives:
  - 比較兩個候選方案的成本與失敗方式
  - 替最昂貴的假設設計小型驗證
tags:
  - design
  - design-review
resources:
  - title: "Microsoft Learn：架構決策紀錄"
    url: https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: "Google SRE Workbook：以具體數量設計系統"
    url: https://sre.google/workbook/non-abstract-design/
    kind: book
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-design-05-tradeoff-criterion
    prompt: "比較同步與非同步匯出前要先定義什麼？"
    answer: "使用者期待受理還是成品，以及各自的觀察點與期限。"
    mcq:
      question: "非同步入口很快回代號，能直接證明什麼？"
      options:
        - "報表已下載"
        - "受理步驟有回應"
        - "所有工作都會在期限內完成"
        - "佇列不會滿"
      answer: 1
      explain: "受理與完成是不同事件，後者需要另外量測。"
    interview:
      question: "你選非同步匯出，這筆複雜度值得嗎？"
      points:
        - "分清受理與完成期限"
        - "並列簡單方案及失敗方式"
        - "指定改選或補測條件"
      answer: "只有使用者願意稍後拿檔案時我才考慮。佇列可接短峰，卻要處理狀態和工作中斷。我先量合理大小報表在隊尾等多久；若成品仍逾時，快速回代號不算解決。"
  - id: fd-design-05-tradeoff-experiment
    prompt: "如何挑第一個驗證的架構假設？"
    answer: "挑最可能影響決策而且可用小成本量測的未知條件。"
    mcq:
      question: "成品期限固定、單份耗時不明，最有辨識力的下一步？"
      options:
        - "只量入口送回工作代號的時間"
        - "用代表性大小資料量測單份耗時與等待"
        - "只查閒置時的記憶體用量"
        - "估每份報表的平均檔案大小"
      answer: 1
      explain: "單份耗時會決定隊尾能否達標，受理速率不能回答。"
  - id: fd-design-05-tradeoff-history
    prompt: "新事實推翻架構選擇時怎麼留紀錄？"
    answer: "保留舊紀錄的情境與理由，新增取代紀錄連結並說明何事改變。"
    mcq:
      question: "從有界佇列改回同步處理，如何交接？"
      options:
        - "覆寫舊理由使其看來從未選佇列"
        - "新紀錄列替代關係及改變的條件"
        - "刪掉所有失敗案例"
        - "只改圖不留說明"
      answer: 1
      explain: "保留前因後果才能知道當時是否做了合理判斷。"
practice:
  - id: fd-design-05-tradeoff-p1
    title: "交出一頁能被推翻的設計紀錄"
    kind: explain
    minutes: 18
    steps:
      - "保存時鐘模型與兩組輸出"
      - "建立 adr-export.md，列同步和非同步各自的成本及失敗方式"
      - "記下提案、最昂貴假設、測法和改選條件"
    checks:
      - "受理與完成有不同判準"
      - "能解釋第 24 秒為何不合格"
      - "紀錄沒有把理想模型當壓測證據"
---

## 為什麼要學：半年後，圖上只剩 1 個方框

交班系統的架構圖上多了一個佇列。新同事問：「為什麼不直接匯出？」如果你只留一張方框圖，對方看不出哪個問題逼你改設計，也不知道現在是否還有那個問題。架構決策紀錄（architecture decision record，ADR）留下的不是開會逐字稿，而是一個重要選擇在當時成立的理由，以及什麼新證據足以讓團隊重看它。

## 核心概念：先寫共同判準，再比較失敗方式

情境是交接時段會集中匯出，使用者希望很快知道請求有沒有被接下，但允許稍後才下載成品。同步方案讓入口等到報表完成才回應，程式簡單、單次呼叫就能拿結果；若報表慢，連線占用久，而且逾時時使用者可能不知道成品是否已產生。非同步方案先回工作代號，工作程序另行製作；代價是要保存狀態、處理佇列滿載和重複交付。兩個方案都能完成匯出，不能只替偏好的方案列好處。

判準要和使用者的承諾對齊。若需求是「立即得到檔案」，回工作代號不是成功；若是「先確認受理，成品可等」，就應分別量受理和完成時間。決策紀錄可只用一頁：情境與限制、候選方案、採用哪個及原因、要承擔的代價、重新評估的條件。狀態也要明寫為提案或已採用；一個試算不等於團隊已核准改架構。

## 範例：先挑最可能推翻決策的假設

在 `C:\dev\stackway-lab` 新建 `adr-lab`，存成 `finish_times.py` 並於該處執行 `py finish_times.py`；macOS 或 Linux 用 `python3 finish_times.py`。簡化成 4 份等大的工作同時到達，工作程序每次只做一份，中間沒有額外開銷。

```python
for seconds_per_job in (2, 6):
    finishes = [seconds_per_job * n for n in range(1, 5)]
    print("service seconds:", seconds_per_job, "finish:", finishes,
          "all within 12s:", max(finishes) <= 12)
```

每份耗 2 秒時，最後一份第 8 秒完成；改成 6 秒就要等到第 24 秒。若目標是 12 秒內可下載，第二種情境不合格，再快回代號也救不了成品等待。這項試算指出值得花下一個半小時驗證的未知數：代表性報表實際要做多久？先取不同大小的合成輸入做短測，記錄分布與排隊時間，比先畫十個新服務有用。

### 用失敗情境寫下取捨

可寫成「提案：用有界佇列承接短峰，回代號供查詢。接受需要維護狀態的成本；若合理大小的尖峰使最後一份超過期限，先重估處理能力或縮減報表，不因受理很快就宣布達標。」再補一條「工作程序取件後中斷」的判準：已受理不能無聲消失，恢復時要可辨識同一工作。這條不能由上面的時鐘模型證明，要另設中斷與恢復測試。

## 常見錯誤

選完工具才回頭寫一份只包含優點的比較；更好的寫法是保留最強的反方理由。假設改變時也不要把舊理由整段改成好像當時就知道。留住當時的條件、在新紀錄標明取代了哪次選擇，後來的人才看得懂架構為什麼又變了。

## 小結

決策紀錄的價值在於能交接判斷：現在選什麼、因此要負責哪種失敗，以及哪個小實驗會讓你改選。方框圖描述形狀，這一頁補上形狀背後的代價。
