---
id: ai-observe-01-signals
module: ai-observe
order: 1
title: 紀錄、指標與追蹤
subtitle: 同一個錯誤要留下哪三種線索
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 分辨紀錄、指標與追蹤各自回答的問題
  - 用一個識別值串起單次請求
tags:
  - observe
  - telemetry
resources:
  - title: OpenTelemetry：遙測訊號
    url: https://opentelemetry.io/docs/concepts/signals/
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
    note: 分辨事件細節、聚合值與呼叫關係。
  - title: OpenTelemetry：追蹤與跨度
    url: https://opentelemetry.io/docs/concepts/signals/traces/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: 看同一條追蹤如何跨服務延續。
concepts:
  - id: ai-observe-signal-choice
    prompt: 紀錄、指標、追蹤各適合回答什麼問題？
    answer: 紀錄查某次事件細節，指標看聚合程度與趨勢，追蹤看單次工作的跨階段關係。
    mcq:
      question: 想知道某筆逾時經過入口與哪個工作者，先查哪種訊號？
      options:
        - 全站 1 小時的平均值
        - 帶跨度關係的追蹤
        - 按服務彙整的逾時直方圖
        - 只有入口失敗比例的時間序列
      answer: 1
      explain: 問題問的是單次路徑，不是整體規模。
    interview:
      question: 有一張整體錯誤率圖與大量工作者紀錄，你會怎麼找到一筆代表性失敗？
      points:
        - 先確認指標分母與時窗
        - 以識別值取追蹤
        - 在子跨度核對事件
      answer: 我先確認哪個入口和時窗有失敗，再選該時窗的失敗追蹤，沿父子跨度找慢段。最後用追蹤與跨度識別值讀事件，不拿相同的錯誤文字硬湊兩筆。
  - id: ai-observe-trace-context
    prompt: 跨服務要把兩個跨度接成父子，需要保留哪些關係？
    answer: 傳遞共同追蹤識別值與上游跨度脈絡，子跨度有自己的識別值並指向父跨度。
    mcq:
      question: 兩段同時出錯，哪個證據最能支持它們屬同一次呼叫鏈？
      options:
        - 錯誤訊息文字一樣
        - 時刻四捨五入後相同
        - 同一追蹤且子跨度指向父跨度
        - 服務使用同一版程式
      answer: 2
      explain: 時間與字串可能碰巧一致，呼叫脈絡才是明確關聯。
  - id: ai-observe-metric-labels
    prompt: 為什麼不將每筆請求的追蹤識別值當指標標籤？
    answer: 識別值數量隨請求增加，會產生大量時間序列；逐筆細節應留在追蹤與紀錄。
practice:
  - id: ai-observe-01-lab
    title: 保存一條不含正文的診斷路徑
    kind: code
    minutes: 9
    steps:
      - 把整體失敗數、追蹤代號與兩個跨度記到 signal-notes.txt
      - 標示哪段包含另一段並寫下事件類別
    checks:
      - 分母是 3 筆入口請求，不是 3 個跨度
      - t2 入口為 80 毫秒，工作者 75 毫秒包含在其中
---

## 為什麼要學

推論服務的儀表板突然變紅。你想知道「有多少請求失敗」，接著想知道「其中一筆在哪個服務等最久」，最後還想查「當時發生什麼錯誤」。這是三個不同的問題。一份寫滿錯誤文字的檔案，很難單獨回答整個服務的失敗比例；一條比例曲線也不會告訴你某一筆卡在哪裡。

## 從服務全貌縮到單次請求

紀錄（log）是某個時刻的事件，例如工作者回報等待超時，可以附操作名稱與錯誤類別。指標（metric）是可跨時間聚合的數值，例如每分鐘收到的請求數與失敗數，適合快速看影響範圍。追蹤（trace）則保留一次工作經過哪些服務、哪段呼叫包住哪段呼叫。每個有起訖的工作區段叫跨度（span），同一次追蹤有共用的追蹤識別值（trace ID），不同區段仍有各自的跨度識別值。

以入口把請求轉交工作者為例，兩邊若各自產生毫不相干的識別值，就很難把慢請求接起來。入口應把追蹤脈絡（context）傳給工作者，工作者另開子跨度；在錯誤紀錄裡也填同一個追蹤識別值。指標端只按服務或結果類別等有限集合分組，不必把每個請求的識別值做成一條曲線。

## 範例：從一筆錯誤拉出它的路徑

使用短代號方便閱讀，並非標準追蹤協定的線上編碼。下列資料來自同一段合成流量；指標統計的是入口請求，不是跨度筆數。由錯誤紀錄取出共同識別值後，再沿父子關係讀工作階段。

為請求追蹤紀錄建立 `C:\dev\stackway-lab\observe`。建立 `follow_trace.py`。選一筆請求，沿著識別碼尋找同一次工作留下的線索。別把剛好同一秒發生的另一件事併進來。

在該目錄執行：Windows PowerShell 用 `py follow_trace.py`；macOS／Linux 用 `python3 follow_trace.py`。

```python
requests = [("t1", "ok"), ("t2", "error"), ("t3", "ok")]
spans = [("t1", "a", "-", "gateway", 0, 10),
         ("t2", "b", "-", "gateway", 1, 81),
         ("t2", "c", "b", "worker", 5, 80)]
log = {"trace": "t2", "span": "c", "event": "queue_timeout"}
print("errors/requests", sum(s == "error" for _, s in requests), len(requests))
for trace, span, parent, stage, start, end in spans:
    if trace == log["trace"]:
        print(span, parent, stage, end - start, "ms")
print(log["event"])
```

如果只收集部分追蹤，查不到某筆不等於那筆沒有發生；要先問擷取條件與保留時間。反過來，就算為了診斷而特別多留慢請求，也不能從這群刻意挑出的樣本直接推算全站錯誤率。

### 追一筆，不等於追全部

從入口跨度的 80 毫秒扣掉唯一已知子跨度的 75 毫秒，剩下的 5 毫秒只能先記為入口範圍內未被這段子工作覆蓋的時間，不能直接替它取名為網路延遲。若未來還有並行的子跨度，更不能直接把所有子跨度相加後扣除。先對齊誰包含誰，再決定哪些時間可以相減。有了這張圖，下一步才知道應在入隊、出隊或傳輸的哪一個邊界補上事件。

## 常見錯誤

一筆請求可能有多條錯誤紀錄，也可能被重試；拿錯誤行數直接當失敗請求數會重複計算。父跨度和子跨度的時間也可能相互包含，不能相加當總耗時。只留下查證需要的類別與技術代號，不要把提示正文、帳號或憑證一起寫進紀錄。

## 小結

先用指標判斷範圍，選一條相關追蹤縮小階段，再讀同一識別值的事件細節。三種訊號各答一題，串起來才是可以交給下一班的線索。
