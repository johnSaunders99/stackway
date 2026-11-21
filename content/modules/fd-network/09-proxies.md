---
id: fd-network-09-proxies
module: fd-network
order: 9
title: 代理伺服器與負載平衡
subtitle: 同一個網址後面可以有幾台主機
status: ready
minutes: 30
level: 2
prereqs:
  - fd-network-08-versions
objectives:
  - 在圖上標出正向與反向代理的位置
  - 用兩個健康後端解釋分流與健康檢查的差異
tags:
  - network
  - proxies
resources:
  - title: MDN：正向與反向代理
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Proxy_servers_and_tunneling
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-network-proxy-represents
    prompt: 判斷正向與反向代理最有用的問題是什麼？
    answer: 問它替用戶端向外取得服務，還是替網站接待外來請求。
    mcq:
      question: 入口代表網站，接單後轉給內部服務。這是哪個角色？
      options:
        - 正向代理
        - 反向代理
        - 名稱解析器
        - 用戶端暫存
      answer: 1
      explain: 判準是代表服務端，而非箭頭方向或是否有多台機器。
    interview:
      question: 2 台後端原先輪流，現在 4 筆都到同一台，你怎麼查？
      points:
        - 先查當時候選名單
        - 核對健康條件與結果
        - 再看分流規則
      answer: 我先看另一台是否還在合格名單。若已因探測失敗而退出，4 筆都給唯一健康的後端是合理行為；2 台都合格時才去查分流設定。
  - id: fd-network-health-pool
    prompt: 健康檢查和分流策略差在哪裡？
    answer: 前者決定哪些後端合格，後者從合格名單挑接單者。
    mcq:
      question: A 合格、B 已退出名單，下一張票該怎麼分？
      options:
        - 繼續輪流，下一筆先試 B
        - 即使 A 合格也先暫停所有接單
        - 交給仍在合格名單的 A
        - 同時發給 2 台，再取第一份結果
      answer: 2
      explain: 輪流規則只適用於合格後端，不該把壞機器加回。
  - id: fd-network-roundrobin-work
    prompt: 輪流分配能保證每台耗時相同嗎？
    answer: 不能；分配次數相近，不代表每項工作的成本一樣。
practice:
  - id: fd-network-b04-09-p1
    title: 畫一張有候選名單的入口圖
    kind: hands-on
    minutes: 10
    steps:
      - 存下 dispatch.py 的三組結果
      - 畫出辦公室出口與網站入口各一張圖，標它代表哪一側
      - 在網站入口圖旁列出第二組可選後端
    checks:
      - 我畫的兩張圖即使箭頭相同仍可區分代理
      - 第二組沒有任何票分到 B
      - 沒有健康後端時有明確結果
---

## 網址沒有換，接單的機器卻換了

你重整兩次課程清單，網址一直相同。服務團隊卻在紀錄裡看到兩台不同的機器各處理了一次。網址代表對外的入口，不必暴露背後每個工作程式。反過來，辦公室裡也可能由一個出口替多台電腦向外取得資料。兩種設備都叫代理伺服器 (proxy server)，要分清它們，先問「它替哪一邊出面」。

## 同一排箭頭，角色不一定相同

正向代理 (forward proxy) 代表用戶端向外提出請求；把它畫在用戶端管理的那一側，例如編輯室指定所有工作站先經過的出口。反向代理 (reverse proxy) 代表網站接待用戶端，再把請求交給內部服務；使用者只要知道公開的入口，不需要自己拿一份後端清單。兩張圖都可能是「用戶端 → 中間程式 → 服務」。只看資料往右流，無法決定中間的是哪一種代理。

負載平衡 (load balancing) 是把工作分配到多個後端。反向代理可以兼做這件事，卻不一定有多個後端，也可能只負責轉交。健康檢查 (health check) 問某個後端現在是否適合接活；分流策略問在合格的候選者中這次輪到誰。把這兩個問題拆開，才不會把「下一台輪到故障機器」當成正常分配。

## 範例：劃掉不合格者，再輪流發票

開啟 `C:\dev\stackway-lab\network`，將範例另存為 `dispatch.py`。先追蹤一次請求經過誰，再看哪個元件決定下一站。不要把回傳內容的來源與對外入口混成同一項。

在該目錄執行：Windows PowerShell 用 `py dispatch.py`；macOS／Linux 用 `python3 dispatch.py`。

```python
from itertools import cycle

def assign(health, tickets):
    ready = [name for name, ok in health.items() if ok]
    if not ready:
        return ["unavailable"] * tickets
    turn = cycle(ready)
    return [next(turn) for _ in range(tickets)]

print(assign({"A": True, "B": True}, 4))
print(assign({"A": True, "B": False}, 4))
print(assign({"A": False, "B": False}, 2))
```

這不是一個真的代理服務，也沒有向任何主機送健康探測。兩個真假值是已知的檢查結果。第一行先把 2 台列入候選，再交替選取；第二行仍接 4 張票，但名單只剩 1 台，因此全數發給同一台。第三行誰都不合格，明確回報無法接待，不是悄悄把工作交給最後失敗的一台。用紙筆也可以照候選名單核對每一張票。

### 一次綠燈，不是整個網站的保證

若探測只問程式能不能回答一個簡短訊息，綠燈最多能說明它回答了那個問題。後端可能在探測之後失去相依服務，或只有某個讀取頁面失敗。記錄檢查的對象、條件和時間，比只寫「健康」兩字更有價值。另外，輪流發 4 張票是平均分配次數，不是平均分配工時；若其中一張要算很久，等待時間仍可能不同。

## 常見錯誤

入口有回應，不代表每個後端都健康；看到只有 1 台接活，也不代表輪流分配程式壞了。先查當時的候選名單，再核對選擇規則。不要因為想看到交替的漂亮輸出，就把已知不能服務的機器硬加回去。

## 小結

用三個動詞講清一個部署：代理替誰「轉交」、探測怎麼「篩選」、分流如何「挑選」。即使日後換了產品名稱，這張圖仍可用。
