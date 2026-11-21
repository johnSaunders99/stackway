---
id: fs-services-03-limit
module: fs-services
order: 3
title: 速率限制與重試提示
subtitle: 同一位使用者 1 分鐘能送幾次
status: ready
minutes: 30
level: 3
prereqs:
  - fs-services-02-jobs
objectives:
  - 為固定視窗設計計數與到期規則
  - 用邊界請求說明 429 與重試等待時間
tags:
  - services
  - limit
resources:
  - title: "MDN：429 與重試提示"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-services-03-limit-window"
    prompt: "固定視窗如何判斷第 60 秒屬於哪一桶？"
    answer: "視窗採左含右不含，第 60 秒進入新的桶。"
    mcq:
      options:
        - "視窗採左含右不含，第 60 秒進入新的桶。"
        - "第 60 秒同時算在 2 桶。"
        - "每次請求都將原窗口延長 1 分鐘。"
        - "只依本次與上次的時間差判斷。"
      answer: 0
      explain: "固定視窗跟時鐘對齊，不是從最後一次請求重新倒數。"
    interview:
      question: "被限流時你會讓畫面怎麼做？"
      points:
        - "依 429 區別身分失效"
        - "採用等待提示且不自動無限重送"
        - "解釋窗口邊界"
      answer: "我會顯示何時能再試，保留輸入而不要求重新登入。若端點是有副作用的送出操作，還得先確認能安全重送；等待時間不是下一次一定成功的保證。"
  - id: "fs-services-03-limit-response"
    prompt: "因本視窗額度已用完而拒絕，適合回什麼？"
    answer: "HTTP 429，可附 Retry-After 說明等待多久。"
    mcq:
      options:
        - "HTTP 200 並假裝已受理。"
        - "HTTP 429，可附 Retry-After 說明等待多久。"
        - "HTTP 401 要求重新登入。"
        - "HTTP 404 表示端點不存在。"
      answer: 1
      explain: "太頻繁並非未驗證，也不表示資源不存在。"
  - id: "fs-services-03-limit-burst"
    prompt: "每分鐘最多 2 次是否等於任意連續 60 秒最多 2 次？"
    answer: "不等於，固定桶交界兩邊可以各用完一次額度。"
    mcq:
      options:
        - "等於，只要所有請求都成功。"
        - "等於，只要秒數用整數。"
        - "不等於，固定桶交界兩邊可以各用完一次額度。"
        - "不等於，因為固定桶沒有計數。"
      answer: 2
      explain: "對齊分鐘的限制與滑動的最近 1 分鐘不是同一規則。"
practice:
  - id: "fs-services-03-limit-p1"
    title: "寫一張額度邊界收據"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 window.py"
      - "再加一位代號 B 在第 59 秒的請求"
      - "列出每次的桶號、回應與等待秒數"
    checks:
      - "第 59 秒被拒時等待 1 秒"
      - "另一位使用者仍有獨立額度"
---

## 為什麼要學：慢一點，跟沒有權限不一樣

練習網站能產生預覽圖，但同一個頁面短時間連按 10 次，可能占滿工作者。速率限制（rate limiting）先說清楚誰、哪種操作、多久、最多幾次，再決定不受理時怎麼通知。登入成功的人也可能超額，重新登入並不能解決問題；保留頁面上的輸入和清楚的等待時間，比跳到錯誤頁有用。

## 核心概念：每個身分各有 1 個時鐘格子

固定視窗（fixed window）把時間切成對齊的格子，例如從 0 秒到未滿 60 秒是第一格。將整數秒數除以 60 取商，就是桶號。計數鍵至少包含身分、操作與桶號；否則一個人的昂貴預覽可能耗掉另一個人的查詢額度。先定義「受理才扣」或「每次嘗試都計」；本課採前者，拒絕不延長視窗。舊桶在視窗結束後不再使用，可到期回收。剩餘秒數是視窗終點減現在時間，不是從最近一次請求算起。

多個服務副本若各自在記憶體數，就沒有共同的限額。共用計數器時，判斷、扣額與必要的到期設定要有一致的更新方式，避免同時讀到還有 1 格或計數鍵永遠不回收。這與先查庫存再開票很像：畫面顯示的剩餘額度只是提示，真正的裁決在伺服器。

## 範例：讓時鐘跨過第 60 秒

在 `C:\dev\stackway-lab\services` 建立 `window.py`，用 `py window.py` 執行；macOS／Linux 用 `python3 window.py`。以下單行程模型每格額度為 2，印出回應狀態與秒數形式的重試提示（Retry-After），不會真的寄出任何要求。

```python
counts = {}
def request(who, sec):
    bucket = sec // 60
    key = (who, "preview", bucket)
    used = counts.get(key, 0)
    if used >= 2:
        return bucket, 429, (bucket + 1) * 60 - sec
    counts[key] = used + 1
    return bucket, 200, None
for sec in [58, 59, 59, 60, 61]:
    print(sec, request("A", sec))
```

第三次被拒時已到第 59 秒，距新視窗只有 1 秒，不應一律叫讀者等滿 1 分鐘。下一秒換桶並非幫使用者清除身分；是同一人合法取得下一格的額度。留意在短短幾秒內仍可能成功 4 次，若需求是「任意連續 1 分鐘」就要改用能表示滑動區間的策略。

### 檢查被拒絕的是誰，不只是哪 1 秒

在第三次要求之後，插入另一位讀者同樣想看預覽的要求。第一位讀者已滿額並不該影響第二位；若兩位一起被拒，很可能是鍵裡少了身分。反過來，如果同一位讀者開新分頁就能拿到新額度，代表鍵選得太細。把兩位的桶號並排，你會看到桶號可以相同，計數仍應分開。對多人共用網路的環境尤其要先問限制對象是帳戶、裝置還是連線來源；三種方式有不同的誤擋風險，不是換個變數名就一樣。

## 常見錯誤與小結

HTTP 429 是請求太頻繁，並不表示伺服器一定停止服務，也不保證一到提示時間就有位置。別讓每個分頁都立刻在背景狂按重試；顯示等待、保留草稿，能安全重送才再送。寫測試時不要真的等 1 分鐘，直接把現在時間當輸入，測最後一秒和新格第 1 秒，才看得出規則寫在哪一側。
