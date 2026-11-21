---
id: fd-design-03-queue
module: fd-design
order: 3
title: 佇列與過載處理
subtitle: 尖峰到來時先排隊還是拒絕
status: ready
minutes: 35
level: 3
prereqs:
  - fd-design-02-capacity
objectives:
  - 畫出佇列深度隨時間的變化
  - 定義何時拒絕與如何通知呼叫者
tags:
  - design
  - queue
resources:
  - title: "Microsoft Learn：用佇列平衡工作量"
    url: https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-design-03-queue-depth
    prompt: "依本課順序，期末深度怎麼算？"
    answer: "從舊深度加上實際接納件數，再扣本格取走的件數。"
    mcq:
      question: "原等 3、容量 6、到 5、取走 2，期末等幾份？"
      options:
        - "6"
        - "3"
        - "4"
        - "1"
      answer: 2
      explain: "先收 3 拒 2，滿到 6 後再取走 2。"
    interview:
      question: "尖峰一來就把佇列加長，你會怎麼判斷是否合理？"
      points:
        - "區分短峰與持續超載"
        - "檢查深度和等待"
        - "說明接納與拒絕回應"
      answer: "我先看離峰能不能把隊伍消完，也看最老那份已等多久。短峰可用有限容量緩衝，滿了就清楚拒絕；已接下的回代號，不讓人以為要再按一次。"
  - id: fd-design-03-queue-sustain
    prompt: "佇列為何不能解決持續過載？"
    answer: "它暫存等待工作；長期進件快於處理，等待或拒絕仍會增加。"
    mcq:
      question: "持續每分鐘來 5 份只能做 2 份，加大佇列的直接效果？"
      options:
        - "推遲滿載並容納更長等待"
        - "讓工作程序變成每分鐘做 5 份"
        - "保證不再拒絕"
        - "自動降低到達量"
      answer: 0
      explain: "等候空間不改變工作程序速度或進件量。"
  - id: fd-design-03-queue-receipt
    prompt: "工作成功排入時該回應什麼？"
    answer: "回已接納、工作代號與查詢方式，不宣稱成品已完成。"
    mcq:
      question: "哪句適合剛入列但尚未處理的匯出？"
      options:
        - "報表已經產生"
        - "匯出成功且可下載"
        - "本次未接納，請重送"
        - "已排入，可用工作代號查進度"
      answer: 3
      explain: "回執是接下工作，並非完成；錯說未接納也會誘發重送。"
practice:
  - id: fd-design-03-queue-p1
    title: "保存一張尖峰水位圖"
    kind: code
    minutes: 16
    steps:
      - "跑原始 5 格並把文字圖存進 queue.md"
      - "把最後 3 格都改為 5，對照兩張圖"
      - "寫出排入與拒絕時各一條給呼叫者的訊息"
    checks:
      - "原圖第二格拒 2 份且期末剩 4 份"
      - "原圖 11 份都能對帳"
      - "受理回應沒有承諾報表已完成"
---

## 為什麼要學：按下匯出，不代表報表已完成

早班交接時，許多人同時按下匯出。如果入口收到一個就同步做完一個，後來的人可能一路等到瀏覽器逾時。佇列（queue）把「接受工作」和「完成工作」拆成兩件事：入口先把工作交給等候區，背景工作程序（worker）再依能力取走。這讓短暫的流量尖峰有地方等待，但不會憑空讓機器每秒多做 1 倍。

## 核心概念：用水位看見債務

佇列深度（queue depth）是某時點仍在等的工作數。畫圖前先訂時間單位與事件先後，否則相同數字可能畫出不同水位。本課以每分鐘為一格：先接納新到工作，超過等候區容量的拒絕，再由工作程序取走本分鐘能處理的份數。容量含這一刻等候的工作，不含已取走的工作。這是為了可以手算的模型，不是所有佇列服務的內部實作。

假設最多等 6 份，工作程序每分鐘可做 2 份。第 1 分鐘來 5 份，全收後做掉 2 份，剩 3 份。第 2 分鐘再來 5 份，只能收 3 份，拒絕 2 份；做掉 2 份後剩 4 份。注意第 2 分鐘不可以因為「等一下會做掉 2 份」就回頭接納之前拒絕的 2 份，那會改變模型的順序。持續到達量若高於處理量，無限加長隊伍只會讓等待時間越拖越久。

## 範例：畫出水位，找出拒絕的那一格

在 `C:\dev\stackway-lab` 新建 `queue-lab` 並存下 `waterline.py`，於該處執行 `py waterline.py`；macOS 或 Linux 用 `python3 waterline.py`。圖裡每個方塊代表一份仍在等待的工作。

```python
depth = 0
for minute, incoming in enumerate([5, 5, 1, 0, 0], 1):
    accepted = min(incoming, 6 - depth)
    refused = incoming - accepted
    depth += accepted
    done = min(2, depth)
    depth -= done
    print(minute, "#" * depth or "-", "wait", depth, "done", done, "refused", refused)
```

期末深度是 3、4、3、1、0；總共來 11 份，做完 9 份，拒絕 2 份。把已完成、仍在等與已拒絕加起來，應等於所有到達量。守住這個等式，比盯著一張平滑曲線更容易抓出被遺失的工作。觀察第 2 分鐘拒絕後，後面的低流量讓隊伍逐漸消退；若最後 3 格仍各來 5 份，就再也等不到自然排空。

### 把水位翻譯成人看得懂的回應

接受後可以回工作代號與查詢位置，說明「已排入」；完成後才標「可下載」。若已滿，入口要清楚說這次沒接下，依介面約定給稍後再試的提示。若過載來自整體服務，可考慮暫時無法服務的回應；若是單一呼叫者超額，應區分為該呼叫者的限制。何時再送、如何避免一個工作出現 2 份，之後在[〈重試、退避與上限〉](#/lesson/fd-design-04-retry)會細講。

## 常見錯誤

把已接受看成已完成，讓使用者一直重新按匯出；或者只看隊伍長度，不管最老那份已等多久。不同工作耗時可能差很大，短短 3 份也可能卡很久。應一起觀察完成速率、等待時間和拒絕數，再判斷是調整容量、降低進件，還是需要處理卡住的工作。

## 小結

佇列買的是時間，不是持續吞吐。畫出進件、完成、等待與拒絕四者的去向，便能同時解釋機器發生什麼事，以及畫面應該對使用者說什麼。
