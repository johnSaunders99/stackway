---
id: fd-systems-03-threads
module: fd-systems
order: 4
title: 共享狀態與競爭條件
subtitle: 兩個工作如何互相卡住
status: ready
minutes: 30
level: 2
prereqs:
  - fd-systems-03-filesystem
objectives:
  - 用時間線描述共享狀態的競爭
  - 指出需要保護的讀改寫區段
tags:
  - systems
  - concurrency
resources:
  - title: "Python：執行緒與鎖"
    url: https://docs.python.org/3/library/threading.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-systems-03-threads-race
    prompt: "哪種情形叫競爭條件？"
    answer: "結果取決於多個工作讀寫共享資料的交錯順序。"
    mcq:
      options:
        - "任何同時開始的工作"
        - "只要有兩個執行緒"
        - "交錯順序改變最後結果"
        - "兩個工作只讀同一個值"
      answer: 2
      explain: "有並行不一定有競爭；關鍵是順序影響正確性。"
  - id: fd-systems-03-threads-window
    prompt: "2 個工作各加 1，結果卻只增加 1，遺失在哪裡？"
    answer: "它們都依同一個舊值算新值，後寫的結果覆蓋前寫的更新。"
    mcq:
      options:
        - "建立第二個工作時就重設了共享值"
        - "把由舊值算出的結果寫回時"
        - "最後顯示時只列印其中一個工作"
        - "等候工作結束時撤銷了先完成的加法"
      answer: 1
      explain: "問題在讀與寫之間另有工作使用同一份狀態。"
  - id: fd-systems-03-threads-guard
    prompt: "要避免舊值覆蓋，鎖應保護哪一段？"
    answer: "所有參與者用同一把鎖保護完整的讀取、計算、寫回。"
    mcq:
      options:
        - "整段讀改寫"
        - "只有最後寫回"
        - "每個工作分別用自己的鎖"
        - "只鎖顯示結果"
      answer: 0
      explain: "即使寫回不交錯，先前讀到的值仍可能已過時。"
    interview:
      question: "座位原本有 2 個，2 次預約後卻剩 1 個。怎麼說明與修正？"
      points:
        - "列出同讀舊值的時間線"
        - "指出完整臨界區段"
        - "讓所有寫入者遵守同一把鎖"
      answer: "我會先列出 2 個工作都讀到 2，接著各寫回 1 的順序。修正時讓檢查餘額與扣減在同一把鎖裡完成；只保護寫回，不能保證先前的判斷仍有效。"
  - id: fd-systems-03-threads-barrier
    prompt: "為什麼未保護版本使用集合點而不是睡眠？"
    answer: "集合點保證兩個工作都已讀到舊值；睡眠長短只是碰運氣，無法確定另一邊已讀。"
practice:
  - id: fd-systems-03-threads-lab
    title: "保留一次遺失更新的時間線"
    kind: code
    minutes: 12
    steps:
      - "在 systems 建立 seats.py 並執行，畫兩欄寫出每個工作的讀值與寫值。"
      - "對照鎖內的版本，標出另一個工作最早能讀的位置。"
    checks:
      - "未保護版本固定剩 1，受保護版本剩 0。"
      - "時間線中能圈出不應被別的工作插入的區段。"
---

## 為什麼要學：2 張預約只扣掉一個座位

櫃檯看見剩下 2 個座位，預約一次，應該留下 1 個。另一個櫃檯也完成預約，最後卻還剩 1 個。每個人都會減法，錯在誰根據哪個時刻的數字做決定。這就是競爭條件（race condition）：同樣的輸入，在不同的工作交錯順序下可能有不同結果。

## 核心概念：把看似一步的工作拆開

先拿紙畫兩欄。左欄寫「讀到 2」，右欄也寫「讀到 2」。左邊算出 1 並寫回，右邊根據自己先前讀到的 2，也算出 1 並寫回。最後一筆沒有從最新的 1 開始算，左邊做過的更新就像被擦掉了。不必真的有兩顆處理器；只要某個工作在讀與寫之間讓另一個工作取得執行機會，就具備這種可能。

需要當作整體處理的部分叫臨界區段（critical section）。鎖（lock）好比一把共用鑰匙：所有會動到同一筆狀態的工作都先取得它，完成讀取、判斷和寫回才歸還。若只有歸檔的人拿鑰匙，登記的人卻能在門外先抄舊數字，關鍵問題還在。

## 範例：讓不巧的時機每次都出現

在 `systems` 建立 `seats.py`，以 `py seats.py` 執行；其他系統用 `python3 seats.py`。這不是靠運氣連跑 1000 次：屏障（barrier）是一個集合點，刻意要求兩個工作都讀完才能繼續。

```python
from threading import Barrier, Lock, Thread

def trial(protected):
    seats = [2]
    both_read = Barrier(2)
    key = Lock()
    def reserve():
        if protected:
            with key:
                seats[0] = seats[0] - 1
        else:
            old = seats[0]
            both_read.wait()
            seats[0] = old - 1
    workers = [Thread(target=reserve) for _ in range(2)]
    for w in workers:
        w.start()
    for w in workers:
        w.join()
    return seats[0]

print("unprotected:", trial(False), "protected:", trial(True))
```

`start` 讓工作開始，`join` 等待結束，確保最後印出的不是半途的結果。先沿著沒有鎖的路走一次，再沿著有鎖的路走一次。第二條路不需要集合點，因為要驗證的是後來的人會在前一位放回鑰匙後才讀到新值。避免把輸出順序誤認為讀值順序，紙上的時間線才是你解釋結果的依據。

### 區分遺失更新與工作沒有結束

如果有人解釋「最後只少一個座位，是因為第二個工作沒有跑」，你怎麼排除？先指出主線在讀結果前已等兩個工作結束，再指出未保護分支沒有略過任何一次寫回。如此一來，問題才從「少做一次」縮小成「做了 2 次卻寫出同樣的值」。如果座位只有 1 個，需求還多了一層：拿到鑰匙後要先檢查是否仍有座位，再決定是否接受預約，而不是只保證減法有先後。鎖能保住一致性，但不會替你訂出什麼算合法預約。

## 常見錯誤

不要把集合點搬進鎖裡：第一個工作拿著鑰匙等第二個到達，第二個卻得先拿同一把鑰匙才能進門，兩邊都走不下去。也不要把鎖放在每次呼叫才建立的區域變數裡；每人有自己的鑰匙，根本沒有共同約束。鎖應該共用，範圍則只涵蓋必須一致的操作。

## 小結

「每次測試都對」不等於沒有競爭。只要找得到一個合法的交錯順序會讓更新遺失，就已有修正的理由。用固定集合點重現，再把完整讀改寫包起來，比盲目加長等待時間更可靠。
