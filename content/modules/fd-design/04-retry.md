---
id: fd-design-04-retry
module: fd-design
order: 4
title: 重試、退避與上限
subtitle: 區分可重試與不可重試
status: ready
minutes: 35
level: 3
prereqs:
  - fd-design-03-queue
objectives:
  - 為暫時故障設計退避上限
  - 說明哪些操作重試前需要防重
tags:
  - design
  - retry
resources:
  - title: "AWS Builders’ Library：逾時、退避與抖動"
    url: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
    kind: article
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-design-04-retry-unknown
    prompt: "寫入逾時能證明什麼？"
    answer: "只能證明未及時收到結果，不能由此判定服務端尚未寫入。"
    mcq:
      question: "建單請求逾時，最準確的狀態是？"
      options:
        - "可能成功，結果未知"
        - "必定沒建立"
        - "必定已建立"
        - "自動取消所有副作用"
      answer: 0
      explain: "回覆可能在寫入之後遺失，兩種結果都有可能。"
    interview:
      question: "建立訂單逾時，你會如何避免重送造成兩筆？"
      points:
        - "區分逾時與寫入失敗"
        - "驗證服務端防重及同一邏輯鍵"
        - "設計停止條件"
      answer: "我先看能否依原鍵查到結果。服務有可靠防重約定才用同鍵重試；不確定就回報結果未知。即使安全也只在暫時錯誤和剩餘期限內做有限次退避。"
  - id: fd-design-04-retry-key
    prompt: "防重鍵應在何時保持相同？"
    answer: "同一邏輯操作的重送沿用同一鍵，並由服務端可靠地關聯到結果。"
    mcq:
      question: "同一張交班單要重送，應如何用鍵？"
      options:
        - "沿用原鍵，確認服務端有防重約定"
        - "每次重送產生新鍵"
        - "所有不同交班單共用一鍵"
        - "只在前端顯示鍵就算防重"
      answer: 0
      explain: "新鍵會被當成新工作；不同工作也不能碰撞，前端顯示不會保護寫入。"
  - id: fd-design-04-retry-jitter
    prompt: "抖動要解決什麼問題？"
    answer: "讓不同呼叫者分散重試時間，避免同時再度衝擊服務。"
    mcq:
      question: "哪個做法能減少整批同時重送？"
      options:
        - "每個人固定等 1 秒"
        - "在退避上限內各自隨機等待"
        - "大家共用同一固定亂數序列"
        - "立即重送所有失敗"
      answer: 1
      explain: "固定節奏即使有延遲，也可能保持同步。"
  - id: fd-design-04-retry-deadline
    prompt: "還有重試次數時，何時仍應停止？"
    answer: "錯誤不是暫時性、重送不安全，或剩餘期限不足以容納下一步。"
    mcq:
      question: "只剩 20 毫秒，已知下一次至少需 80 毫秒，該怎麼做？"
      options:
        - "保證再做一次才退出"
        - "重設整體時鐘"
        - "提高單次等待上限"
        - "停止並回報期限不足"
      answer: 3
      explain: "次數是上限不是義務，重設時鐘會破壞端到端承諾。"
practice:
  - id: fd-design-04-retry-p1
    title: "保存三條重試時間線"
    kind: code
    minutes: 16
    steps:
      - "執行原排程，再分別測第二次為 400 與期限 100"
      - "在 retry.md 記每次嘗試、耗時與停止原因"
      - "另寫未知結果的建單流程及防重前提"
    checks:
      - "400 後沒有第三次呼叫"
      - "期限 100 時只有 1 次嘗試"
      - "不同交班單不能共用同一把鍵"
---

## 為什麼要學：沒收到回應，不等於沒寫進去

送出交班單後畫面轉了幾秒，最後說逾時。你再按一次，系統裡卻出現兩張單。重試（retry）是遇到暫時問題後再嘗試同一操作；逾時（timeout）只表示呼叫者沒在期限內取得結果，不保證對方沒有執行。先確定重新執行是否安全，再談該等幾秒，比一律重試 3 次重要。

## 核心概念：3 道閘門才決定再送

第一道看錯誤：格式錯誤再送原資料仍然錯；短暫不可用則有恢復機會。第二道看副作用。冪等性（idempotency）指同一操作執行多次，預期的狀態效果與一次相同，不要求每次回覆文字都一樣。建立交班單若可能重複，呼叫端可傳每次邏輯操作固定的識別鍵，由服務端把鍵與結果可靠地一起保存，重送取得原結果。同一鍵卻帶不同內容要視為衝突，而非悄悄覆蓋。

第三道看預算。退避（backoff）是失敗後先等待，連續失敗逐步拉開間隔；抖動（jitter）在範圍內隨機選等待時間，避免所有呼叫者整齊地再衝一次。要限制單次等待、總嘗試數和端到端期限。嘗試數含第一次，例如最多嘗試 3 次，就只有 2 次重新送出的機會。若前面已耗光整體時間，就算仍有次數也不能再送。

## 範例：只模擬時鐘，不製造網路流量

在 `C:\dev\stackway-lab` 新建 `retry-lab`，將下列存成 `schedule.py` 後執行 `py schedule.py`；macOS 或 Linux 用 `python3 schedule.py`。這是已確認可安全重送的讀取操作，以毫秒做離散模擬，每次呼叫固定花 80 毫秒。

```python
from random import Random
rng = Random(7)
elapsed, deadline, attempt_ms = 0, 500, 80
for n, status in enumerate([503, 503, 200], 1):
    if elapsed + attempt_ms > deadline:
        break
    elapsed += attempt_ms
    print(n, status, elapsed)
    if status != 503 or n == 3:
        break
    delay = rng.randint(0, min(200, 50 * 2 ** (n - 1)))
    if elapsed + delay + attempt_ms > deadline:
        break
    elapsed += delay
```

固定亂數種子只為讓你可重現這次課堂排程，正式呼叫者不要共用同一組刻意固定的等待序列。把第二個狀態改成 400，程式會停在第二次；把期限縮為 100，則第一次失敗後就不再送。範例用已知時長教預算，真實系統還要為下一次呼叫設定剩餘期限，而不是假設網路一定在固定時間內返回。

### 寫入操作要多問一句

假設服務先寫入再回覆，回覆在路上遺失。若新嘗試產生一把新鍵，服務會以為這是另一份交班單。若鍵存在卻沒跟寫入結果一致保存，服務中途故障也可能留下無法判斷的狀態。因此「附了一個代號」不等於已保證防重；在不確定支援程度時，先查狀態或請人核對，不自動重送未知結果的寫入。

## 常見錯誤

每一層都重試，導致入口嘗試 3 次、下一層又各嘗試 3 次，最底層可能收到 9 次。選定由哪層負責，並保留原始錯誤及總耗時。退避上限也不是整段工作的上限：就算每次最多等很短，無限重複仍然會塞滿系統。

## 小結

暫時錯誤、重送安全、剩餘預算足夠，三項都成立才重試。退出時讓上游知道是明確失敗還是結果未知，別把不確定藏在更多次嘗試後面。
