---
id: ai-serving-02-batching
module: ai-serving
order: 4
title: 連續併批與等待時間
subtitle: 併批為何既快又慢
status: ready
minutes: 30
level: 3
prereqs:
  - ai-serving-03-metrics
objectives:
  - 畫出連續併批中請求的加入與離開
  - 比較相同負載下的吞吐與尾端延遲
tags:
  - serving
  - batching
resources:
  - title: Transformers：連續併批的運作方式
    url: https://huggingface.co/docs/transformers/main/en/continuous_batching
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-02-batching-slot
    prompt: 連續併批最關鍵的補位時機是什麼？
    answer: 某請求離開後的下一個可排程步驟。
    mcq:
      options:
        - 某請求離開後的下一個可排程步驟
        - 等原本最後一筆完成後才重組整個批次
        - 等到又湊滿一整批新請求才補空席
        - 只在新流量停止後重排現有席位
      answer: 0
      explain: 保留還在解碼的請求，只填補可用位置。
  - id: ai-serving-02-batching-load
    prompt: 公平比較兩種併批要重播什麼？
    answer: 相同到達時刻、順序和輸入輸出長度。
    mcq:
      options:
        - 相同總詞元數即可，不必記抵達時刻
        - 相同到達時刻、順序和輸入輸出長度
        - 相同請求總數即可，不必記長短順序
        - 相同平均輸出長度即可，不必固定並行條件
      answer: 1
      explain: 負載本身會改變可補位時機和等待時間。
  - id: ai-serving-02-batching-tail
    prompt: 每步容納更多請求，能確定哪個結論？
    answer: 要用每步耗時與逐筆延遲才能判斷尾端。
    mcq:
      options:
        - 只要單步容納更多，尾端就一定較短
        - 只要整批吞吐升高，各筆完成時間就同步縮短
        - 要用每步耗時與逐筆延遲才能判斷尾端
        - 只比滿批時的瞬間速度即可推出尾端
      answer: 2
      explain: 多裝工作可能讓每步變慢，吞吐改善不保證尾端改善。
    interview:
      question: 短請求排很久，要怎麼驗證改併批有用？
      points:
        - 保留到達序列
        - 標出空席及補位
        - 比較吞吐與尾端
      answer: 我會先重播同一批長短請求，畫出短請求何時能進空席。再量整批產量和慢請求完成時間，免得只改善平均卻拖慢少數使用者。
practice:
  - id: ai-serving-02-batching-p1
    title: 保存一張解碼席位圖
    minutes: 11
    kind: code
    steps:
      - 儲存腳本及兩份列印結果
      - 在空席上圈出丙最早可以加入的位置，算出 2 輪最慢完成步數
    checks:
      - 丙分別在第 5 與第 2 步完成
      - 吞吐分別為每步 1.2 與 1.5 詞
---
## 為什麼要學：先完成的請求留下了什麼？
想像 2 個解碼席位，先來一長一短。短回答結束時，長回答還有好幾詞沒吐完。若必須等兩者全部離開才能收下一批，空席就會閒著。連續併批（continuous batching）把重組批次的時機從整批結束改為解碼步驟的邊界。它增加的是利用空席的機會，不是保證每位使用者都更早拿到答案。

## 核心概念：畫席位，不只畫佇列
在紙上畫兩欄席位，每列是一個解碼步驟。先把已抵達的請求放進空席，這一步每個在席的請求各產 1 詞。完成的離席，未完成的保留自己的狀態，空席下一步才能補人。真實引擎還要處理提示、詞元預算和快取容量，本課先把這些固定，專心看加入和離開。

假設甲需要 4 步，乙和丙各要 1 步，依此順序在時間 0 到場。固定批次先做甲乙，乙只在第 1 格出現，第 2 到第 4 格沒有丙；連續併批則讓丙坐到第 2 格。請注意甲照樣走完 4 步，提早完成的是排在後面的丙。服務端多完成一筆的時間，不能直接說成每個請求少等相同的時間。

## 範例：對同一張到達清單套 2 種規則
在 `C:\dev\stackway-lab\serving` 新建 `batch_slots.py`。逐輪圈出完成的請求與能遞補的位置。不要只比每輪塞入幾筆，也要看後到的請求等了幾輪。

在該目錄執行：Windows PowerShell 用 `py batch_slots.py`；macOS／Linux 用 `python3 batch_slots.py`。

```python
def run(continuous):
    queue = list("ABC")
    left = dict(A=4, B=1, C=1)
    seats, done, tick = [None, None], {}, 0
    while queue or any(seats):
        if continuous or not any(seats):
            for i in range(2):
                if not seats[i] and queue:
                    seats[i] = queue.pop(0)
        tick += 1
        print(tick, *(x or "-" for x in seats))
        for i, x in enumerate(seats):
            if x:
                left[x] -= 1
                if not left[x]:
                    done[x], seats[i] = tick, None
    print([done[x] for x in "ABC"], "tok/step", 6/tick)
for mode in (False, True):
    run(mode)
```

程式中的橫線是空席，結果欄依甲乙丙排序。這裡每步等長，從共同送出到各自完成就是每筆延遲。總產量固定為 6 詞，用 6 除以各規則走完的步數，比的是每步吞吐。小樣本用最慢完成時間描述尾端，不把三筆資料包裝成穩定的高百分位數。

### 反過來安排到達時間
把紙上的丙移到甲剛完成之後才抵達。前面雖然一直有空席，但沒有待辦可以補，兩種規則都無法利用那些空格。若改成丙很早到、卻因快取已滿而不能進，席位圖的外觀相似，解法完全不同。可以在每一列旁加上「已到未進」和「可用容量」兩欄：前者空白說明沒有需求，前者有名字但後者不足說明容量有限，兩者都不同於調度規則刻意等整批結束。

## 常見錯誤
把一次能裝更多請求當成一定更快，忽略批次變大可能拉長單步時間。若新進的是長提示，它也可能和既有解碼爭用計算；實際要同時看首詞、後續間隔與尾端。也別拿一輪只有短請求、另一輪全是長請求來比較，應重播同一批到達與長度，再看變動。

## 小結
看到空席先問調度器何時能補位，看到佇列再問它有沒有足夠容量。無法補位可能是規則限制，也可能是記憶體不夠。下一堂[〈KV 快取容量估算〉](#/lesson/ai-serving-05-sizing)將用每個在席請求保留多少詞元，估計多開一席的容量代價。
