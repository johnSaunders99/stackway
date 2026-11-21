---
id: fd-python-tools-02-errors
module: fd-python-tools
order: 2
title: Python 例外處理
subtitle: 只接住自己能處理的例外
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-tools-01-traceback
objectives:
  - 區分壞輸入與程式錯誤
  - 保留可追查原因的錯誤訊息
tags:
  - python-tools
  - exceptions
resources:
  - title: 'Python 教學：處理例外與例外鏈'
    url: 'https://docs.python.org/zh-tw/3/tutorial/errors.html'
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: '讀 try、except 及 raise from。'
concepts:
  - id: fd-python-tools-errors-scope
    prompt: '為什麼 try 裡只放預期可能失敗的操作？'
    answer: '縮小錯誤來源，避免把其他程式問題誤判成可修正的輸入問題。'
    mcq:
      question: '只預期整數文字格式不對，要接哪一種？'
      options:
        - '所有例外'
        - 'TypeError'
        - 'ValueError'
        - 'IndexError'
      answer: 2
      explain: '格式不符由 int 引發 ValueError；全面接住會掩蓋其他錯誤。'
    interview:
      question: '解析函式應該自行略過所有壞資料嗎？'
      points:
        - '解析層能指出錯誤原因'
        - '呼叫端決定略過或中止'
        - '不隱藏未預期的程式錯誤'
      answer: '我讓解析函式負責把文字轉成合法分鐘，失敗就帶列號往上報。逐列匯入可以繼續，整批必須一致時則停止。兩者共用解析規則，不需要把所有例外一律變成 0。'
  - id: fd-python-tools-errors-chain
    prompt: 'raise 新例外時加上 from cause 能留下什麼？'
    answer: '新訊息交代情境，原例外保留為直接原因，便於追查。'
    mcq:
      question: '哪種做法能同時補列號與保留底層成因？'
      options:
        - '回傳 0'
        - '只印列號'
        - '忽略例外'
        - '從原例外引發帶列號的新例外'
      answer: 3
      explain: '回傳或列印本身不會建立可追溯的例外鏈。'
  - id: fd-python-tools-errors-range
    prompt: '負整數文字為何不能只靠 int 判定合法？'
    answer: '格式可轉換不等於符合業務範圍，非負條件必須另外驗證。'
practice:
  - id: fd-python-tools-errors-lab
    title: '存下 4 列驗收結果'
    kind: code
    minutes: 9
    steps:
      - '執行 checked_minutes.py，區分兩種 rejected 訊息。'
      - '加入文字 12 與文字 1.5，印出每列的決定。'
      - '在檔尾註解記下兩個新增案例及理由。'
    checks:
      - '12 被接受，1.5 回報預期整數且列號正確。'
      - '合法的 0 仍被接受；負數沒有被錯報成格式錯。'
---
## 為什麼要學
讀入分鐘出錯時，填表的人需要知道改哪一列，維護程式的人則想知道底層轉換為何失敗。如果只有一句「有錯」，兩邊都得重新猜。如果把讀不到的值一律改成 0，整份報表還會看似成功。這次的規則很明確：接受非負整數文字；壞資料要指出列號，程式本身接錯資料的問題則不能藏起來。

## 核心概念
例外處理 (exception handling) 是先嘗試某段操作，再為特定失敗安排去處。把可能轉換失敗的那一行放在 `try` 裡；`except ValueError as cause` 只接住符合的例外，並用名字留下原事件。把範圍縮小很重要：若把整份報表都包起來，後面其他運算的同名錯誤，也可能被誤報成分鐘格式錯。

`raise` 會主動引發例外，不是把例外物件當普通結果交回去。用 `raise ... from cause` 換成帶列號的訊息，同時保留底層原因，稱為例外鏈 (exception chaining)。能不能轉成整數和轉出來是否非負是兩道不同的關卡；負 3 可以順利轉成整數，卻不符合這份報表的規則，必須另外判斷。

## 範例：分開處理格式不對和範圍不對
用一筆不合格式的輸入與一筆合法的 0 比較。前者需要解釋無法轉換的原因，後者不該被當成錯誤。把下面的範例存成 `C:\dev\stackway-lab\python-tools` 裡的 `checked_minutes.py`。

在該目錄執行：Windows PowerShell 用 `py checked_minutes.py`；macOS／Linux 用 `python3 checked_minutes.py`。

```python
def parse_minutes(text, row):
    try:
        value = int(text)
    except ValueError as cause:
        raise ValueError(f"row {row}: expected an integer") from cause
    if value < 0:
        raise ValueError(f"row {row}: minutes below zero")
    return value

for row, text in enumerate(["8", "", "-3", "0"], start=1):
    try:
        value = parse_minutes(text, row)
    except ValueError as error:
        print("rejected", error)
    else:
        print("accepted", value)
```

第一次轉換成功，外層的 `else` 只在嘗試段沒引發例外時執行。第二筆在轉換當下失敗，內層補上第二列的線索，外層決定顯示拒收並繼續下一列。第三筆走的是負數檢查，沒有底層轉換失敗可串接。最後文字 0 照樣接受，不因為其數值在真假判斷中是假的就被當成缺漏。由此可見，錯誤策略也得像成功結果一樣測試。

想觀察完整原因，在迴圈外直接呼叫解析函式並傳空字串，不在外層接它。終端機會顯示原始整數轉換錯誤，以及你後來引發、帶列號的新錯誤。恢復外層處理後，畫面只印簡短訊息，不代表根因已被刪掉，只是呈現方式不同。這個分工讓解析函式不必自行決定要重試、略過還是結束整批。

把格式錯與範圍錯分成兩句提示，填表的人才知道要改字元還是改數字。這比統一顯示解析失敗更有用，也不需要在畫面上公開整份原始資料。

## 常見錯誤
空的 `except:` 加上 `pass` 雖然能讓畫面安靜，卻可能連程式寫錯的訊號都吞掉。若呼叫方傳入 `None`，本例約定的文字輸入已被破壞，整數轉換引發的是 `TypeError`；不應冒充「這一列是負分鐘」。反過來也不要只在錯誤訊息裡寫新描述卻繼續回傳正常數字，否則上層根本不知道應拒收。

## 小結
在最了解資料的位置補上原因，在能決定下一步的位置處理它。每次設計例外路徑，記得試一次合法 0、一次格式錯、一次規則錯，並留一種不該被接住的錯誤，檢查邊界是否畫對。
