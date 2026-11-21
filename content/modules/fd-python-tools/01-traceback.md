---
id: fd-python-tools-01-traceback
module: fd-python-tools
order: 1
title: 讀取 Python 錯誤堆疊
subtitle: 從最後一行找回出錯的呼叫
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 從 traceback 找出例外名稱與程式行號
  - 沿呼叫順序追到第一個不符合預期的輸入
tags:
  - python-tools
  - traceback
resources:
  - title: 'Python 教學：錯誤與例外'
    url: 'https://docs.python.org/zh-tw/3/tutorial/errors.html'
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '讀例外訊息與呼叫位置的關係。'
concepts:
  - id: fd-python-tools-traceback-last
    prompt: '讀單一例外的回溯，最後一行先看什麼？'
    answer: '先認例外名稱與訊息，再往上找實際失敗的運算。'
    mcq:
      question: '哪個片段最直接指出值無法轉成整數？'
      options:
        - '第一個檔案的名稱'
        - '迴圈的起始行'
        - 'ValueError 與其訊息'
        - '最後成功印出的列號'
      answer: 2
      explain: '例外名稱說明問題類別，訊息提供當次失敗的細節。'
  - id: fd-python-tools-traceback-frames
    prompt: '回溯由外往內列出的資訊代表什麼？'
    answer: '是錯誤發生時仍在呼叫鏈上的位置，不是所有已執行的敘述。'
    mcq:
      question: '最內層一行是 int(text)，上一層通常能回答什麼？'
      options:
        - '總共有幾列資料'
        - '誰傳值給這次轉換'
        - '迴圈已經成功執行幾次'
        - '輸入列表裡的完整內容'
      answer: 1
      explain: '上一層是呼叫點；要查資料列需另外觀察輸入。'
  - id: fd-python-tools-traceback-row
    prompt: '如何區分出錯的程式行與資料列？'
    answer: '回溯的行號對應原始檔，資料列則用列號和最小輸入另行追查。'
    interview:
      question: '同一行轉換用了很多次，你如何找出是哪次壞掉？'
      points:
        - '找到轉換操作與呼叫者'
        - '在轉換前記錄必要的列號和表示值'
        - '用最小失敗與成功輸入對照'
      answer: '我先從例外回到轉換那行，再看迴圈實際傳什麼。用虛構的小資料印列號與 repr，定位空字串後改成文字 0 再跑，確認問題在資料格式，不把程式行號誤當資料列號。'
practice:
  - id: fd-python-tools-traceback-lab
    title: '保存一對可重現的報表輸入'
    kind: code
    minutes: 9
    steps:
      - '以 broken_total.py 重現錯誤，在旁邊建立 traceback-note.txt。'
      - '記下例外名稱、失敗運算、呼叫端與壞資料列號。'
      - '將第二筆改為文字 0 後重跑，在筆記內附上成功總數。'
    checks:
      - '筆記分列程式行號與資料列號。'
      - '空字串出現 ValueError，改成文字 0 後得到 13。'
---
## 為什麼要學
一份分鐘報表昨天還正常，今天加了一列就停止。畫面列出好幾行檔名，最後停在整數轉換。看見最後一行就把轉換刪掉，好像不再卡在那裡，但下一步加總仍然會失敗。本堂保留一個故意會出錯的程式，用它練習分辨「在哪一步無法繼續」和「是哪一筆資料讓這一步失敗」。

## 核心概念
例外 (exception) 表示某個操作在目前條件下無法完成。錯誤回溯 (traceback) 列出當時還在等待結果的函式呼叫。單一例外的最後一行通常由名稱與訊息組成，先看這兩部分，再往上找最接近它的檔名、函式與行號。往上回看是找誰呼叫它；從上往下則是從外層入口走到發生錯誤的內層。它不是程式從啟動到當下的每一行日記。

`ValueError` 表示這裡收到的值不適合該操作。字串可以拿來做整數轉換，但不是所有文字都代表整數。相反地，格式有效的 0 仍是有效分鐘；不能把所有不會增加總數的資料都當成同一種錯。之後在[〈Python 例外處理〉](#/lesson/fd-python-tools-02-errors)會細講使用者能怎樣修正壞輸入，這次先讓錯誤如實浮現。

## 範例：故意重現一筆無法換算的分鐘
在 `C:\dev\stackway-lab\python-tools` 新建 `broken_total.py`。不急著改第一行。先在輸出末端找例外種類，再沿呼叫順序追到第一個不符預期的資料值。

在該目錄執行：Windows PowerShell 用 `py broken_total.py`；macOS／Linux 用 `python3 broken_total.py`。

```python
def minutes(text):
    return int(text)

def total(rows):
    result = 0
    for number, raw in enumerate(rows, start=1):
        print("row", number, repr(raw), flush=True)
        result += minutes(raw)
    return result

print(total(["8", "", "5"]))
```

這次看見程式中斷才是預期結果。`enumerate` 替每筆配上從一開始的列號；`repr` 會把空字串印成一對引號，這比印一段看不見的空白好查。先讀最後一行的例外名，再找含 `int(text)` 的行號，折回上一層的 `minutes(raw)`，最後看誰把整份清單交給加總。若你的檔案前面多了一行，程式行號會不同，出錯的是哪個運算則不變。

看最後一次列印的列號和內容：第二筆是空字串，第三筆還沒處理。現在把第二筆換成文字 0，再跑一次會印出總數 13。這個對照只改一個值，就把失敗條件縮到「空字串不能直接轉整數」。這並沒有回答產品是否允許空白；要決定拒收、請求重填或略過，必須另看資料規則，不要把觀察直接當成修正方案。

## 常見錯誤
錯誤訊息的行號指的是程式碼，不是輸入資料第幾列；這正是範例要另外印列號的原因。若只在函式最後印結果，發生例外時根本走不到那一行。若資料可能含私人資訊，不要照抄整份檔案去問人，先用像本例這樣的虛構三筆資料重現同一例外，再保留必要的呼叫順序與型別。

## 小結
一份好用的錯誤紀錄要能回答三個問題：失敗的是什麼操作、誰帶它走到這裡，以及哪個輸入可讓別人重現。留下最小失敗案例和只差一項的成功案例，下一步才能驗證修正是否真的對症。
