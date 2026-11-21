---
id: fd-network-05-failure
module: fd-network
order: 10
title: 網路故障分層判讀
subtitle: 從失敗畫面縮小範圍
status: ready
minutes: 35
level: 2
prereqs:
  - fd-network-09-proxies
objectives:
  - 辨認 DNS、連線與 HTTP 的不同失敗層
  - 把已觀察的結果和猜測分開寫
tags:
  - network
  - diagnosis
resources:
  - title: MDN：HTTP 回應狀態碼
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: MDN：HTTP 請求與回應
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-network-failure-last-step
    prompt: 收到 HTTP 回應狀態能定位到哪一層？
    answer: 至少有 HTTP 元件作答，但不能斷定回應一定由最終後端產生。
    mcq:
      question: 文件回 404，先核對哪項最直接？
      options:
        - 是否未取得主機位址
        - 是否連 TCP 都無法建立
        - 請求的路徑與方法
        - 是否尚未送出任何 HTTP 請求
      answer: 2
      explain: 收到狀態碼代表有元件回答；先核對它回答的是哪個資源。
    interview:
      question: 有人報告「網站掛了」，只有一條 503 紀錄。你會怎麼回報？
      points:
        - 表明已收到 HTTP 回應
        - 不擅自判定後端原因
        - 提出可區分來源的下一步
      answer: 我會報告這個時間與路徑收到 503，不會說 DNS 或資料庫壞了。下一步比對入口與後端的同次請求紀錄，確認是哪一段先回覆。
  - id: fd-network-failure-refusal
    prompt: 連線被拒絕時，可以寫成 HTTP 503 嗎？
    answer: 不行；未收到 HTTP 狀態碼就只記連線層的現象。
    mcq:
      question: 哪個紀錄是連線層而非 HTTP 狀態？
      options:
        - '404'
        - '503'
        - '200'
        - connection refused
      answer: 3
      explain: 被拒絕發生在取得 HTTP 回應之前。
  - id: fd-network-failure-hypothesis
    prompt: 如何把故障原因的猜測變成可檢驗的下一步？
    answer: 固定其餘條件，比對一項能區別兩種解釋的觀察，沒證據的地方留成待查。
practice:
  - id: fd-network-b04-10-p1
    title: 交一張可接手的故障單
    kind: explain
    minutes: 12
    steps:
      - 執行 triage.py，在 triage-note.md 逐列記觀察與待查
      - 挑一列寫一個暫時可排除的解釋
      - 補上一次只改一項條件的下一步
    checks:
      - 4 列只有丁列記了 HTTP 數字
      - 丙列不建議忽略憑證警告
      - 下一步能區別兩種解釋
---

## 「打不開」不是故障層

同一位讀者連續 2 天說文件打不開。第一天工具找不到主機，第二天畫面寫著找不到檔案。兩次感受一樣，能從紀錄推出的事情卻很不一樣。判讀故障的工作不是最快猜中一個原因，而是先找出這次已經走到哪一步，把下一個問題縮小到能驗證的程度。

## 依一次請求的順序追蹤證據

先看名稱解析 (name resolution)：查不出主機位址時，還不能判斷服務埠是否有人接待。若已得到位址，下一步是建立連線 (connection)。被拒絕和等到逾時都不是 HTTP 狀態碼；被拒絕常見於沒有服務監聽，但單靠一行錯誤不能排除其他拒絕來源。HTTPS 還有憑證與安全交握；名稱查得到、連線也建立，不等於驗證就已通過。

若已收到 HTTP 404 或 503，則至少有一個能回答 HTTP 的元件回覆了這次請求。前者表示沒有取得指定的資源，後者表示服務目前無法處理。可能是代理產生的回應，因此不能只憑這串數字宣布後端資料庫故障。請求的時間、方法、主機、路徑是證據的座標；不同時間或不同路徑的成功不會自動推翻原報告。

## 範例：替 4 張收據找到最後確定的一步

在 `C:\dev\stackway-lab\network` 新建 `triage.py`。先標記最後一個有成功證據的步驟，再猜下一步該驗什麼。從證據分層比從一個錯誤訊息猜整套系統可靠。

在該目錄執行：Windows PowerShell 用 `py triage.py`；macOS／Linux 用 `python3 triage.py`。

```python
records = [
    ("A", "name not found", None),
    ("B", "connection refused", None),
    ("C", "certificate mismatch", None),
    ("D", "response received", 404),
]
for case, observed, status in records:
    print(case, observed, "HTTP:", status if status is not None else "-")
```

這四筆都是教學樣本，程式只列印資料，沒有測任何外部網站。把螢幕分成「觀察」和「待查」兩欄。甲列的觀察是查無名稱，待查是拼字與本次解析結果，不能填「伺服器當機」。乙列是連線被拒絕，可核對服務是否在預期的本機埠監聽。丙列是憑證名稱不符，先核對原本要找的主機，不應略過警告。丁列有真正的狀態碼，優先檢查方法、路徑和入口紀錄是否相符。

### 下一步要能區分 2 種解釋

以丁列為例，假設同一主機的首頁同時成功，而文件路徑仍回查無資源。這讓「文件名稱變了」比「整個主機的名稱都無法解析」更值得先查，但沒有證明檔案被刪除。如果能讀到該次請求的入口紀錄，就能再區分「入口自己回覆」與「入口把後端回覆轉回來」。沒有紀錄時，把這個分支留成未知，比隨手填上一個根因有用。

還留著[〈HTTP 方法、狀態與標頭〉](#/lesson/fd-network-03-message)的練習資料夾嗎？讓那個本機服務運作時先試缺檔路徑，再停掉自己的服務，原封不動重做同一請求。前者可以交出狀態碼，後者若無其他程式接手該埠就無法連線；這次改變的是服務是否監聽，不是檔名。

## 常見錯誤

一次改網址、埠和工具，終於成功卻說不出哪項有關。每次只改能檢驗假設的一項，保留原觀察。也不要把沒有回應寫成狀態碼 0；0 不是網站傳回的 HTTP 狀態。貼報告只留必要欄位，移除憑證、Cookie 與可能包含私密資料的查詢值。

## 小結

好的交接可以短到三句：「我看到了什麼」「因此可以排除什麼」「我接下來會比對什麼」。用確定的最後一步當起點，就不必叫下一個人從頭猜。
