---
id: fd-algo-03-queue
module: fd-algo
order: 5
title: 堆疊與佇列
subtitle: 用堆疊與佇列重播操作
status: ready
minutes: 30
level: 2
prereqs:
  - fd-algo-04-pointers
objectives:
  - 模擬返回上一頁與依序處理任務
  - 在空容器上定義合理行為
tags:
  - algo
  - queue
resources:
  - title: 'Python 教學：用串列作堆疊與佇列'
    url: 'https://docs.python.org/zh-tw/3/tutorial/datastructures.html'
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '比較尾端 pop 與 deque 的 popleft。'
concepts:
  - id: fd-algo-queue-stack
    prompt: '瀏覽器切頁時，返回堆疊應壓入哪一頁？'
    answer: '先壓入即將離開的目前頁，返回時才拿到最近離開的頁面。'
    mcq:
      question: '從 home 到 map 再到 lesson，第一次返回應到哪裡？'
      options:
        - 'home'
        - 'map'
        - 'lesson'
        - '空頁面'
      answer: 1
      explain: '歷史最近存入 map，lesson 是正在看的頁面。'
  - id: fd-algo-queue-fifo
    prompt: '右端加入工作的 deque，要拿最早工作用哪個操作？'
    answer: '從左端 popleft，維持先進先出。'
    mcq:
      question: '依序加入 notes、cards 後，popleft 會交出什麼？'
      options:
        - 'cards'
        - '含 notes 的單元素串列'
        - 'notes'
        - 'None，但佇列仍會縮短'
      answer: 2
      explain: '右加左取會取最舊項；右端 pop 則會先拿 cards。'
  - id: fd-algo-queue-empty
    prompt: '為什麼空歷史和空工作佇列可以採用不同政策？'
    answer: '歷史要維持畫面；工作佇列需表示沒有待辦，空情況依呼叫者需要決定。'
    interview:
      question: '如何測試返回功能和列印排隊沒有用錯端點？'
      points:
        - '放入至少兩個不同項目'
        - '比對首次取出的項目'
        - '取空後再試一次'
      answer: '我會用三頁和三個工作，不用只有一項的例子，因為一項看不出方向。先比第一次返回及第一次列印，再多操作一次，確認沒歷史時留在首頁、沒工作時回空值。'
practice:
  - id: fd-algo-queue-lab
    title: '留下兩種順序的操作紀錄'
    kind: code
    minutes: 10
    steps:
      - '儲存 desk_orders.py，在頁面清單尾端再加入 stats。'
      - '讓返回次數增加到 4，並在列印工作尾端加一份 draft，多取到空為止。'
      - '在檔尾寫下兩邊第一次與最後一次操作結果。'
    checks:
      - '從 stats 首次返回 lesson，最後停在 home。'
      - 'notes 最先列印，draft 最後列印，再取一次為 None。'
---
## 為什麼要學
在瀏覽器連看三頁，按返回應該退到最近離開的頁面；印表機收到三件工作，下一張卻應該是等待最久的那件。兩者都是「先放進去，之後拿出來」，只記得要用清單還不夠。決定從哪一端取資料，實際上就在決定使用者眼中的先後順序。

## 核心概念
堆疊 (stack) 遵守後進先出 (last in, first out)：從同一端加入和取出。Python 串列尾端的 `append` 和 `pop` 正好能表達這件事。做返回功能時，把「上一頁」推進歷史，再把目前頁換成新頁。按返回則從歷史尾端取回最近離開的一頁，不是把目前頁再放回去。

佇列 (queue) 遵守先進先出 (first in, first out)。這裡用標準函式庫的雙端佇列 (deque)，右端 `append`，左端 `popleft`。把資料結構想成規則，而不是只記操作名稱：同一個雙端佇列如果用右端 `pop`，拿到的就不是最早排隊的人。要取得下一件與單純查看下一件也不同，取出之後容器真的少了一項。

## 範例：同一張桌上的歷史紀錄與列印工作
把下一個應離開的工作圈起來。從哪一端放、哪一端拿，比容器裡的項目剛好叫什麼名字重要。把下面的範例存成 `C:\dev\stackway-lab\algorithms` 裡的 `desk_orders.py`。

在該目錄執行：Windows PowerShell 用 `py desk_orders.py`；macOS／Linux 用 `python3 desk_orders.py`。

```python
from collections import deque

current = "home"
history = []
for page in ["map", "lesson"]:
    history.append(current)
    current = page

for _ in range(3):
    if history:
        current = history.pop()
    print("page", current)

jobs = deque()
for job in ["notes", "cards", "summary"]:
    jobs.append(job)
for _ in range(4):
    job = jobs.popleft() if jobs else None
    print("print", job)
```

走到課程頁時，歷史從底到頂有首頁、地圖，課程頁本身在 `current`。第一次返回取出地圖，第二次取出首頁，第三次因歷史空了而停在首頁。這裡是刻意選擇的空容器政策，不是串列自動知道什麼叫首頁。你也可以設計成按鈕停用，但資料層仍需在沒有上一頁時拒絕取出。

列印的三次取出則依照加入順序。第四次明確回傳 `None` 表示暫無工作，而不是假裝印了一張空白文件。這裡佇列只存文字工作名，所以空值不會和合法工作撞名。兩種空容器用不同結果，是因為一邊要保留目前畫面，另一邊要向呼叫者表示沒有可做的事；資料結構不必替產品決定這個規則。

選兩份工作來手推，比只放一份更能驗證方向：只有一份時，取隊首和取隊尾結果相同，錯誤做法也會碰巧過關。把兩份名稱寫得明顯不同，再看哪份先消失，便能區分順序錯或單純顯示錯。

## 常見錯誤
歷史裡若存成「剛抵達的新頁」，第一次返回會回到眼前這頁，看起來像按鈕失效。佇列若用串列的 `pop(0)`，順序雖然正確，卻需搬移其後的元素；大量工作反覆從前端取出時，雙端佇列更適合。兩種容器都不要在空的時候直接取出，否則會引發索引例外，而不是自動取得你想要的空值。

## 小結
先把三張紙條按到達順序放好，說明下一張要取最上面還是最早的那張，再選操作。測完正常順序後一定再多取一次，才知道沒資料時程式是保留狀態、回報空值，還是意外中斷。
