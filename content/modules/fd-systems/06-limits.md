---
id: fd-systems-05-limits
module: fd-systems
order: 6
title: 並行上限與背壓
subtitle: 資源有上限時怎麼排隊
status: ready
minutes: 35
level: 2
prereqs:
  - fd-systems-04-io
objectives:
  - 估計同時工作數增加的代價
  - 為超過負載的情況選擇等待或拒絕
tags:
  - systems
  - backpressure
resources:
  - title: "Google SRE：處理過載"
    url: https://sre.google/sre-book/handling-overload/
    kind: book
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-systems-05-limits-active
    prompt: "並行上限限制的是哪個數量？"
    answer: "同一時間正在服務的工作數，不等於一輪內所有到達的工作數。"
    mcq:
      options:
        - "進行中的工作"
        - "佇列中尚未開始的工作"
        - "每秒新到達的工作"
        - "排隊和完成的總和"
      answer: 0
      explain: "工作可先排隊，因此到達數可大於同時執行數。"
  - id: fd-systems-05-limits-queue
    prompt: "只限制工作者數量，但允許無限排隊，會發生什麼？"
    answer: "長期到達率大於處理率時，等待時間與佇列占用會增加。"
    mcq:
      options:
        - "記憶體必定維持固定"
        - "只要工作位固定，等候時間也有固定上限"
        - "所有請求會立刻失敗"
        - "待辦可能持續累積"
      answer: 3
      explain: "固定工作者保住了同時執行數，沒有保住等待空間。"
  - id: fd-systems-05-limits-pressure
    prompt: "哪個行為真的把壓力傳回上游？"
    answer: "容量用完時要求生產端減速、暫停或稍後再送。"
    mcq:
      options:
        - "把工作轉存到無限清單"
        - "只把警示寫到畫面"
        - "通知上游暫停提交"
        - "立即不停重送"
      answer: 2
      explain: "上游若照原速度送，壓力只是換了位置。"
    interview:
      question: "縮圖服務同時只能做 2 張；第五張來了怎麼回應？"
      points:
        - "先確認等候容量與時效"
        - "說明滿載時等待或拒絕的條件"
        - "避免立刻大量重試"
      answer: "若容許再排 2 張，第五張就超出容量。我會看需求：互動頁可清楚回覆稍後再試；能暫停的匯入工具可等有空位才送。兩者都不該默默把第五張扔進無上限的清單。"
  - id: fd-systems-05-limits-capacity
    prompt: "同時做 2 件、容許再等 3 件，空系統同時收到 6 件會怎樣？"
    answer: "這個固定容量模型可立即服務 2 件、排隊 3 件，第六件必須通知上游稍後再送或採用其他明確政策。"
practice:
  - id: fd-systems-05-limits-lab
    title: "畫出滿載時每一筆工作的去向"
    kind: code
    minutes: 15
    steps:
      - "在 systems 建立 line.py，執行後把每個編號的去向寫入 queue-notes.txt。"
      - "只增加等候位到 3，重跑並比較最後一筆以及最後完成的輪次。"
    checks:
      - "2 個工作位、2 個等候位時，第五筆明確被拒絕。"
      - "增加等候位能接下第五筆，卻不增加每輪能完成的數量。"
---

## 為什麼要學：接單成功不等於做得完

縮圖工具每次要先解開圖片，才能縮小再輸出。同時解開太多張會把記憶體用完；全部先收件，又可能等很久才輪到最後一張。這裡要決定的不是把數字調到最大，而是當資源用完時，下一張圖片會去哪裡，以及送件的人如何知道。

## 核心概念：工作位與等候位分開算

並行上限（concurrency limit）是同時進行的工作數。假設每份工作解開後約占 20 MiB，光是 2 個工作位就可能占 40 MiB，還沒算程式與等候的資料。若佇列（queue）中只存檔名，而不是整張解開的圖片，等候位的成本通常小得多，但每多排一輪，輪到它的時間也變晚。

服務端的排隊取捨見[〈佇列與過載處理〉](#/lesson/fd-design-03-queue)。這裡先試一個不用架設服務就能觀察的機制：背壓（backpressure）是讓下游的處理能力影響上游送件速度。可暫停的工具收到「滿了」就等有空位再送；不能讓使用者一直等的介面，可以及早告知這次未受理。拒絕是過載時的一種選擇，只有送件端也因此調整行為，壓力才真的傳了回去。把待辦搬到另一個無限長的清單，只是換地方堆積。

## 範例：不用真的開執行緒也能算容量

在 `systems` 建立 `line.py`，以 `py line.py` 執行；其他系統用 `python3 line.py`。模型假設 5 筆同時到達，每份工作都正好花 1 輪，先到先做。刻意消除速度差異，是為了只看容量政策。

```python
workers, waiting = 2, 2
pending = []
for job in range(1, 6):
    if len(pending) < workers + waiting:
        pending.append(job)
        print(job, "active" if len(pending) <= workers else "queued")
    else:
        print(job, "retry later")
turn = 0
while pending:
    turn += 1
    print("done", turn, pending[:workers])
    pending = pending[workers:]
```

程式用一個清單呈現進行中與等候中的工作，前面最多 2 筆是本輪的工作位。注意判斷受理的門檻是兩種位子相加，但每輪完成的數量只看工作位。如果只增加等待空間，不增加工作者，第五筆不再被拒絕，代價卻是多等一輪。把這句話寫成一筆接受規則，比只記住某個建議值有用。

### 替送件者做一次選擇

試想送件的人正在批次整理自己的相簿，而且手上保留原圖。若被告知現在已滿，它可以停在目前這張，等空位通知後再繼續，圖不會因此消失。換成即將關閉頁面的使用者，同樣一句「等一下」就不夠：若系統其實尚未受理，畫面應明確告知不要期待稍後收到完成通知。兩種情境都可以不用增加容量，卻需要不同的回應文字。用第五筆的命運回頭檢查你的介面，有沒有把已排隊和根本沒進隊寫成同一句話。

## 常見錯誤

每次被拒絕就立刻重送，會讓原本已忙的服務更忙；應讓送件端等候空位或依指示稍後再試。另一個錯誤是看到等待人數增加就一律加工作位：若所有工作都要同一份已滿載的資源，多開幾份反而拉長每份的時間。先量每輪完成量與等待時間，再決定調哪個旋鈕。

## 小結

設上限時至少交代同時能做幾件、還能等幾件、滿了怎麼回覆。這三個決定能讓下一位使用工具的人分辨「已接單，稍後完成」與「沒有接單，需要改天再送」。
