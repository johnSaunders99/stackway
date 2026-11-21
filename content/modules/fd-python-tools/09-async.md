---
id: fd-python-tools-05-async
module: fd-python-tools
order: 9
title: asyncio 與非同步等待
subtitle: 等待時不必卡住整個程式
status: ready
minutes: 35
level: 2
prereqs:
  - fd-python-tools-08-packaging
objectives:
  - 畫出兩個等待工作交錯的時間線
  - 解釋 async 不能讓純計算自動加速
tags:
  - python-tools
  - async
resources:
  - title: 'Python：協程、任務與並行等待'
    url: 'https://docs.python.org/3/library/asyncio-task.html'
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: '對照循序等待、gather 與 sleep。'
concepts:
  - id: fd-python-tools-async-schedule
    prompt: '先後 await 兩個獨立協程，是否會自動重疊等待？'
    answer: '不會，第一個完成後才開始第二個；要重疊需先把兩者安排執行。'
    mcq:
      question: '哪種安排能讓兩個獨立的 sleep 等待重疊？'
      options:
        - '依序 await 兩個呼叫'
        - '把兩個協程交給 gather 並等待'
        - '只宣告 async 函式'
        - '先跑完慢的再建立快的'
      answer: 1
      explain: '需要兩個工作都能被排程，不是只看語法有沒有 async。'
  - id: fd-python-tools-async-order
    prompt: 'gather 成功回傳的結果依哪個順序排列？'
    answer: '按傳入順序，與各任務實際結束先後不同。'
    mcq:
      question: '先傳慢工作後傳快工作，快工作先結束，結果第一項是誰？'
      options:
        - '快工作的結果'
        - '最後印出的文字'
        - '未定義'
        - '慢工作的結果'
      answer: 3
      explain: '結束標記顯示完成順序；gather 保留傳入的位置。'
  - id: fd-python-tools-async-blocking
    prompt: '為何改成 async def 不能自動加速長時間的純計算？'
    answer: '同一事件迴圈仍需取得執行權才能安排別人，未讓出的純計算會持續佔用它。'
    interview:
      question: '兩個任務寫成 async 卻仍然卡住，你會查什麼？'
      points:
        - '確認兩個工作是否已排程'
        - '找阻塞呼叫與長計算'
        - '比較開始與結束標記'
      answer: '我會先看兩個開始標記，確認不是依序等完才啟動下一個。接著看中間用的是可讓出的等待還是同步睡眠或長計算。沒有交回執行權，改函式宣告也不會讓其他任務前進。'
practice:
  - id: fd-python-tools-async-lab
    title: '把交錯順序畫成兩條時間線'
    kind: code
    minutes: 12
    steps:
      - '儲存並執行 wait_timeline.py，把兩個段落各畫成一組起訖線，存成 timeline.txt。'
      - '對調 gather 兩個引數，保留原本延遲。'
      - '在圖下分開記下完成順序與結果順序。'
    checks:
      - '循序段沒有重疊，一起執行的段落有兩個先後開始的等待。'
      - '對調引數後結果第一項改為 fast，沒有靠固定毫秒數判定成功。'
---
## 為什麼要學
一份摘要要等兩個資料來源。第一份還沒到，不等於第二份不能開始等。若做法是拿到第一份才出發取第二份，2 段等待只能相加；若兩個請求都已出發，總等待有機會重疊。今天不連外部服務，改以可控制的短暫等待重播兩種情形。要看的不是電腦快了幾倍，而是第二件工作何時才開始。

## 核心概念
用 `async def` 定義協程函式 (coroutine function)。呼叫它會得到協程物件，並不表示函式本體已跑完或已經排入背景。`await` 等待可等待的工作；若尚未就緒，執行權可以交回事件迴圈 (event loop)，由它安排其他已就緒的任務 (task)。`asyncio.run` 是本例一般腳本的入口，負責讓最外層協程跑完再收尾。

先 `await` 第一個再 `await` 第二個，仍是循序。`asyncio.gather` 可以把兩個協程一起排入執行，等兩邊結束才回傳，結果按傳入順序排列，不必按完成時間排序。`asyncio.sleep` 是會讓出執行權的等待，用來模擬資料尚未到達。不是每個函式前面加個等待關鍵字，就能忽然變成不阻塞的操作。

## 範例：把起點與終點分開標記
開啟 `C:\dev\stackway-lab\python-tools`，將範例另存為 `wait_timeline.py`。把主動讓出控制權的地方標在時間線上。交錯進行不等於同一瞬間有兩段 Python 運算都占著處理器。

在該目錄執行：Windows PowerShell 用 `py wait_timeline.py`；macOS／Linux 用 `python3 wait_timeline.py`。

```python
import asyncio

async def fetch(label, delay):
    print("start", label)
    await asyncio.sleep(delay)
    print("end", label)
    return label

async def main():
    print("serial")
    await fetch("slow", 0.12)
    await fetch("fast", 0.02)
    print("together")
    result = await asyncio.gather(fetch("slow", 0.12), fetch("fast", 0.02))
    print("result", result)

asyncio.run(main())
```

先圈出循序段第一個結束與第二個開始的位置。接著在一起執行的段落，把兩張紙條上的起點、終點依輸出排列。短等待通常先結束，但最後的結果仍是先慢後快，因為我們先傳入慢的工作。若兩份資料彼此獨立，重疊等待有意義；若第二份請求必須用第一份的回傳值，強行把它們一起排程也不會消除這個資料相依。

不要把測量到的毫秒當成正確性的條件。睡眠時間是至少要等待的間隔，還要考慮其他排程工作，實際回來的時刻可能更晚。本例最有用的證據是兩個來源都能在第一份等待結束前啟動，而不是某次剛好快了固定比例。若改成純運算迴圈而沒有讓出執行權，其他工作就得等那段計算跑完。

## 常見錯誤
在協程內用同步的 `time.sleep` 會擋住這條執行緒，事件迴圈也沒空服務其他任務。只呼叫 `fetch` 卻沒有等待或安排它，更不是「悄悄開始下載」；本體可能根本不會跑。還有一種誤判是看結果串列就認定誰先完成，這時應回頭看結束標記，而不是看回傳順序。

用兩條時間線分開標出等待和真正執行的段落；不要只憑最後完成的順序判斷等待是否重疊。

## 小結
先問兩件工作有沒有相依，再問等待時能否讓出執行權。非同步 (asynchronous) 在這裡利用的是原本閒著的等待時間，不是讓同一段純計算憑空多出處理能力。能畫出兩條線的重疊區域，就能說清楚你預期改善的是哪一部分。
