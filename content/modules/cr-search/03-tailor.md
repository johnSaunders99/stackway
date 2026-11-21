---
id: cr-search-03-tailor
module: cr-search
order: 3
title: 履歷客製與摘要
subtitle: 同一個作品寫兩種摘要
status: ready
minutes: 30
level: 4
prereqs:
  - cr-search-02-bridge
objectives:
  - 依職務調整證據出現順序
  - 不用改動事實也能回應不同需求
tags:
  - search
  - tailoring
resources:
  - title: "Oregon State University：依職缺調整履歷"
    url: https://writingcenter.oregonstate.edu/tailoring-your-resume
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: "UC San Diego Career Center：履歷中的成果敘述"
    url: https://career.ucsd.edu/resources/guides/resume.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-search-03-tailor-invariant
    prompt: "客製摘要時哪些內容不能改？"
    answer: "已做的事、測試條件、數字及個人責任不能隨職缺變動。"
    mcq:
      question: "哪一種調整不會改變事實？"
      options:
        - "把本機改為正式服務"
        - "將測例數換成使用人數"
        - "將缺值代號的證據移到開頭"
        - "把列印錯誤寫成發送告警"
      answer: 2
      explain: "調整順序是編輯；其他選項都加入不同的主張。"
    interview:
      question: "你的兩份摘要不一樣，我怎麼知道描述的是同一個作品？"
      points:
        - "共用事實底稿"
        - "示範相同輸入輸出"
        - "只改閱讀重點"
      answer: "我可以用同一支腳本跑出 3 筆報表和 1 個缺值代號。後端版先寫驗證，平台版先寫排查；兩版都限定本機合成資料，沒有增加上線或值班經驗。"
  - id: cr-search-03-tailor-word
    prompt: "什麼時候可以使用職缺的技術用語？"
    answer: "該用語確實描述自己的實作，且有相應行為可驗證時。"
    mcq:
      question: "程式只印出錯誤代號，如何描述最準確？"
      options:
        - "自動告警已送達"
        - "值班人員已回應"
        - "建立完整事件管理系統"
        - "輸出缺值代號以供定位"
      answer: 3
      explain: "畫面可確認代號，不能證明通知或人員處理。"
  - id: cr-search-03-tailor-lead
    prompt: "如何替兩個職務選擇摘要第一句？"
    answer: "優先展示最能回應該職務日常任務的真實證據。"
    mcq:
      question: "要回應輸入驗證，最該先寫什麼？"
      options:
        - "錯誤代號可按批次彙整"
        - "本機可重跑、不需登入"
        - "同一份腳本可供交接使用"
        - "不完整的資料未進報表且留有代號"
      answer: 3
      explain: "驗證需求看的是資料是否被正確接受或拒絕。"
practice:
  - id: cr-search-03-tailor-p1
    title: "留下同一作品的 2 版摘要"
    kind: explain
    minutes: 14
    steps:
      - "跑出範例結果並建立 facts.md"
      - "另存 backend-summary.md 與 platform-summary.md，各寫不超過兩句"
      - "把每項數字與動詞逐一對回事實檔"
    checks:
      - "兩版第一句回應不同任務"
      - "數字、條件與責任一致"
      - "每個判斷都有輸出可查"
---

## 為什麼要學：同一份作品，讀者先問不同的事

後端團隊看報表匯出工具，第一個問題可能是資料錯了怎麼辦；平台團隊想知道失敗後怎麼復原。如果你只有一種摘要，總有人要翻到第三段才找到關心的證據。履歷客製（résumé tailoring）是替讀者安排閱讀順序，不是把同一段經歷改寫成兩份不同的資歷。先建一份穩定的事實清單，才有餘裕調整敘述。

## 核心概念：事實不能動，視角可以換

把事實拆成可核對的小單位：環境是本機；輸入是 4 筆合成事件；其中 1 筆缺欄位；合法的 3 筆產出報表；錯誤那筆記下代號。每一項應該都能指出產物裡的對應位置。職缺要求「處理輸入驗證」，就把判斷合法與否放在第一句；要求「監看批次失敗」，就把錯誤紀錄的位置放在第一句。「負責正式環境告警」並不是改變順序，而是新增了一項原本沒有的事實。

職缺有特定用語時可以沿用，但先問兩邊的意思是否相同。如果你只在終端機列出錯誤，寫「保留錯誤代號，便於排查」很準確；改寫成「建置監控平台」就換了工作的規模。精準的動詞能讓履歷變短，也能避免面試時你得替沒有做過的功能找藉口。

## 範例：把摘要倒推回同一份輸出

在 `C:\dev\stackway-lab` 新建 `tailor-demo`，保存 `facts.py` 後於該處執行 `py facts.py`；macOS 或 Linux 用 `python3 facts.py`。假設這是唯一的實作證據，先別看自己的頭銜，直接讀結果。

```python
rows = [("r1", 4), ("r2", 7), ("r3", None), ("r4", 2)]
valid = [key for key, value in rows if value is not None]
missing = [key for key, value in rows if value is None]
print("report:", *valid)
print("missing:", *missing)
```

給後端的摘要：「實作本機匯出前的欄位檢查，4 筆合成事件中只將 3 筆完整資料列入報表，缺值列留下識別碼。」給平台的摘要：「將本機批次的缺值事件列成可追查的代號；同一組 4 筆輸入能定位 r3，並核對其餘 3 筆進入報表。」讀者的關注點變了，但輸入數量、責任範圍和測試層級沒變。兩句都沒有聲稱告警會自動送達，也沒承諾能處理所有錯誤。

### 刪字時，哪些一定要留？

若只剩一行，先拿掉形容詞，不要先刪「本機」或「合成」。這些看似不耀眼的字保護了數字的解讀。保留最能支持該職缺的一個結果就好；其他事實可以移到作品說明，不必每次通通塞進摘要。最後反問自己：若對方要求我現場重跑這句話，我知道開哪個檔、改哪一筆、指哪行輸出嗎？

## 常見錯誤

把職缺公告整段換成第一人稱，看起來完全匹配，卻無法指回任何作品。另一種是同時改作品名稱、數量和角色，結果投遞後不記得對方看了哪個版本。保留一份事實底稿，針對職缺另存摘要並記版本；之後在[〈投遞漏斗與回饋〉](#/lesson/cr-search-04-funnel)會用到這個版本來比較回覆，但不會靠回覆數來決定事實真假。

## 小結

好的客製讓讀者少找一段，不讓你多背一個故事。拿兩版摘要互相比對，每個數字、環境和責任動詞都應該回到同一份可核對的底稿。
