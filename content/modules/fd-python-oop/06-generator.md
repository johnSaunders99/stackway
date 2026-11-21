---
id: fd-python-oop-06-generator
module: fd-python-oop
order: 6
title: 生成器與 yield
subtitle: 不先存完整份清單也能逐筆處理
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-oop-05-iterator
objectives:
  - 把回傳清單的函式改為逐筆 yield
  - 說明暫停位置以及資料何時才被運算
tags:
  - python-oop
  - generator
resources:
  - title: 'Python 教學：生成器'
    url: 'https://docs.python.org/zh-tw/3/tutorial/classes.html#generators'
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '讀 yield 與區域狀態如何跨次保留。'
concepts:
  - id: fd-python-oop-generator-start
    prompt: '生成器函式被呼叫時，迴圈何時開始執行？'
    answer: '先得到生成器，第一次要求值時才開始跑本體。'
    mcq:
      question: 'stream = positive(rows) 後尚未讀取，會印出幾個 check？'
      options:
        - '一個'
        - '與輸入等長'
        - '與正數等長'
        - '0 個'
      answer: 3
      explain: '建立的是可繼續執行的物件，不是立即跑完函式。'
  - id: fd-python-oop-generator-pause
    prompt: 'yield 與 return 對後續執行有何差異？'
    answer: 'yield 交出值並保留位置等待續跑；return 結束該次函式執行。'
    mcq:
      question: '第一次 yield 之後，下一次 next 從何處接手？'
      options:
        - '重新執行第一行'
        - '上次暫停處之後'
        - '從同一個 yield 再次交出舊值'
        - '跳出目前迴圈再繼續'
      answer: 1
      explain: '生成器保留區域狀態與迴圈進度，不需要自行保存索引。'
  - id: fd-python-oop-generator-space
    prompt: '逐筆產生結果節省哪一部分空間？'
    answer: '可以不保存全部輸出；輸入與單步計算需要的空間仍要計入。'
    interview:
      question: '只要第一筆符合條件的紀錄，你會選串列還是生成器？'
      points:
        - '逐筆處理可提前停止'
        - '一次索取可能掃過多筆'
        - '原輸入不因此消失'
      answer: '我會讓函式逐筆篩選，讀到第一個合格值就停。如果前 10 筆都不合格，仍得做 10 次檢查，但不必為後面的結果建立串列。已讀進記憶體的原始資料仍佔空間。'
practice:
  - id: fd-python-oop-generator-lab
    title: '留下只取第一筆的執行軌跡'
    kind: code
    minutes: 10
    steps:
      - '執行 lazy_minutes.py，核對 check 與 ready 的先後。'
      - '另建一支生成器，只以 next 取第一筆，不對它呼叫 list。'
      - '改用全為 0 的輸入，用 next 的預設值標出空結果。'
    checks:
      - '只取第一筆時只檢查 0 與 4。'
      - '全 0 版本回傳自訂的結束標記，不會把 0 當作合格分鐘。'
---
## 為什麼要學
一串練習紀錄中，你只想先看第一筆正分鐘。先篩完整份資料再看清單第一格也能做，但如果前面就有答案，後面數 1000 筆檢查都是這一刻用不到的。能不能把「下一筆怎麼找」交給函式，把「要找幾筆」留給讀的人決定？這正是生成器適合解的問題。

## 核心概念
生成器函式 (generator function) 的函式本體內有 `yield`。呼叫它得到一支生成器 (generator)，也是一支迭代器；此時函式本體尚未開始掃描。讀的人呼叫 `next`，本體才執行到第一個能交出值的位置。`yield` 交出當下的結果，暫停並留下區域變數和迴圈位置。再要求下一筆時，是接著這個位置繼續，不是從第一行重跑。

與回傳 (return) 對照：要一次交出所有結果，可以先建空串列，把符合值逐一加入，最後回傳整個串列。那樣在第一個結果被使用前，計算已全部完成。若把加入清單改成逐筆產生，就不需為所有結果另外留座位。這說的是產生結果的額外記憶體；若輸入原本就是一個大串列，它本身仍然存在，並不會因為使用生成器就消失。

## 範例：用輸出辨認程式何時真的在工作
開啟 `C:\dev\stackway-lab\timers`，將範例另存為 `lazy_minutes.py`。先指出呼叫後哪一步才真的開始產生值，再逐次取用。把整串結果一次轉成清單會改變觀察到的時機。

在該目錄執行：Windows PowerShell 用 `py lazy_minutes.py`；macOS／Linux 用 `python3 lazy_minutes.py`。

```python
def collect(rows):
    return [value for value in rows if value > 0]

def positive(rows):
    for value in rows:
        print("check", value)
        if value > 0:
            yield value

rows = [0, 4, -1, 7]
stream = positive(rows)
print("ready")
print("first", next(stream))
print("rest", list(stream))
print("again", list(stream))
print("all", collect(rows))
```

先只看標記的先後。`ready` 會在任何 `check` 前印出，證明建立生成器時沒有跑迴圈。第一次索取要先跳過 0，所以一次 `next` 不等於只檢查一筆輸入。看到 4 時它就停；等到收集剩餘結果才會印出負一與 7。觀察最後兩行：同一支已用完，只能收出空串列；使用原始資料另行收集，才會再次得到 4 和 7。

把「剩下的全部收起來」那行換成直接跳出讀取，想像後面還有幾 10000 列。函式不會自己在背景繼續跑，沒有人要求下一筆，就不會出現後續的檢查紀錄。若工作必須完成每一筆才算成功，不能只建立生成器便回報完成。延後運算代表錯誤也可能到實際讀那筆資料時才浮現。

這也解釋了為何生成器沒有直接報出結果筆數：即使知道輸入有 4 筆，若不檢查條件，就不知道其中幾筆會被篩掉。要數完結果便得付出走完整趟的工作。

## 常見錯誤
在第一個合格值處寫 `return value` 並不能逐筆交付；那代表函式結束。在產生值的迴圈裡先組好整個結果清單再逐筆交出，雖然呼叫方式一樣，卻失去提前停下的好處。除錯時若為了預覽呼叫 `list(stream)`，後面正式處理前要記得這支已經用完了，必要時從來源重新建立。

## 小結
要隨時取第幾筆、反覆閱讀同一份結果，串列很適合；要按需往前走、看到答案就停，生成器讓讀者決定工作量。看懂第一個檢查標記出現在哪裡，就能分辨這兩種做法，不必靠感覺猜快慢。
