---
id: fd-python-oop-04-dataclass
module: fd-python-oop
order: 4
title: 資料類別 dataclass
subtitle: 讓兩筆相同紀錄可以直接比較
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-oop-03-composition
objectives:
  - 用 dataclass 定義具名欄位
  - 觀察自動初始化及相等比較與手寫類別的差異
tags:
  - python-oop
  - dataclass
resources:
  - title: 'Python：dataclass 欄位與比較'
    url: 'https://docs.python.org/3/library/dataclasses.html'
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '讀預設產生的方法及相等比較規則。'
concepts:
  - id: fd-python-oop-dataclass-fields
    prompt: 'dataclass 根據什麼產生預設初始化方法？'
    answer: '根據宣告並帶型別註記的欄位，以及它們的順序和預設值。'
    mcq:
      question: 'Session 的 minutes 預設為 0，Session("read") 的結果為何？'
      options:
        - '缺少必要引數'
        - '分鐘為 0'
        - '分鐘為 None'
        - '標籤變成 0'
      answer: 1
      explain: '省略有預設值的欄位會採用該值，不代表未知。'
  - id: fd-python-oop-dataclass-equality
    prompt: '兩個獨立的資料類別實例何時預設相等？'
    answer: '兩者類別相同，參與比較的欄位值也分別相等。'
    mcq:
      question: '同類別兩筆相同紀錄分別建立，哪個結果合理？'
      options:
        - '== 與 is 皆真'
        - '== 假而 is 真'
        - '== 真而 is 假'
        - '兩者都一定是假'
      answer: 2
      explain: '== 比欄位，is 比身分，分別建立不代表內容不同。'
    interview:
      question: '匯入後物件是新的，要如何證明紀錄內容一致？'
      points:
        - '先定義哪些欄位算同一紀錄'
        - '同型別用值比較'
        - '修改一欄做反例'
      answer: '我會先說清楚要比標籤和分鐘，而不是記憶體裡的同一個物件。用兩個獨立實例測相等，再只改分鐘測不等，免得測試其實只是在比一個物件和它自己。'
  - id: fd-python-oop-dataclass-hint
    prompt: 'minutes: int 會主動拒絕負數嗎？'
    answer: '不會。型別註記描述預期型別；數值範圍仍需程式自行檢查。'
practice:
  - id: fd-python-oop-dataclass-lab
    title: '替紀錄加入輪次'
    kind: code
    minutes: 10
    steps:
      - '保留 session_records.py 的原比較，再加一個有預設值的 round_no 整數欄位。'
      - '另外建立兩筆同標籤、同分鐘但不同輪次的紀錄。'
      - '把相等比較與列印結果留在腳本中。'
    checks:
      - '兩筆只差輪次時 == 為 False。'
      - '沒傳 round_no 的舊呼叫仍能建立紀錄。'
---
## 為什麼要學
一次讀書結束後，你把標籤和分鐘記下來。隔天重新輸入同一筆，想核對兩張紀錄是否相符。若問「這是不是昨天那個物件」，新建的一張當然不是；你真正要比的是資料內容。對一張只有幾個欄位的紀錄，每次都手寫初始化、列印和逐欄比較，不只費工，也可能新增一欄卻忘了改比較規則。

## 核心概念
資料類別 (data class) 還是普通的 Python 類別。把裝飾器 (decorator) `@dataclass` 放在類別宣告上方，就請標準函式庫依欄位產生常用方法。欄位用型別註記 (type annotation) 標出，例如 `minutes: int` 表示這裡預期整數；這不是換算或檢查。之後在[〈Python 型別註記〉](#/lesson/fd-python-tools-03-types)會細講怎樣把這類提示用在函式邊界。

沒給預設值的欄位，建立時必須傳入；有預設值的欄位通常排在後面。依位置傳值時，要照欄位宣告的順序；用關鍵字則能在呼叫處寫清楚單位。預設產生的文字表示會顯示類別名、欄位名與值，適合在終端機核對。預設相等比較要求兩邊是同一個類別，再比較參與比較的欄位，不是去查兩個物件的身分。

## 範例：比較 2 張獨立填寫的紀錄
在 `C:\dev\stackway-lab\timers` 新建 `session_records.py`。先分清是在比較兩份紀錄的欄位值，還是在問它們是不是同一個物件；這兩題的正確答案不一定相同。

在該目錄執行：Windows PowerShell 用 `py session_records.py`；macOS／Linux 用 `python3 session_records.py`。

```python
from dataclasses import dataclass

class Plain:
    def __init__(self, label, minutes):
        self.label = label
        self.minutes = minutes

@dataclass
class Session:
    label: str
    minutes: int = 0

print(Plain("read", 12) == Plain("read", 12))
a = Session("read", 12)
b = Session(minutes=12, label="read")
print(a, a == b, a is b)
b.minutes += 1
print(a.minutes, b.minutes, a == b)
```

第一行是對照組：這個手寫類別沒有另訂比較規則，兩個獨立實例不會因屬性剛好相同就相等。接著看第二行的兩個真假值：同值為真，同物件為假。最後只修改第二張，原本同值的比較就變成假。不是程式背下了先前的答案，而是每次比較都看當時的欄位內容。

若只指定讀書標籤，分鐘欄位會拿到 0；那代表這是「0 分鐘」的紀錄，不是「不知道幾分鐘」。預設值應符合資料的實際意義。若負分鐘不能成立，可以另寫檢查；加一個整數註記並不會自動替你拒絕負數。資料類別替你省掉機械式的部分，卻不能替你決定業務上哪兩張單算同一筆。

如果兩張紀錄同時都增加 1 分鐘，它們又會比較相等。先各改一張再比較，可以看出相等是這一刻的關係，而不是建立實例時被永久貼上的記號。

## 常見錯誤
不要用 `is` 來核對匯入前後的內容，也別把資料類別印出來的字串當作穩定的存檔格式。另一個誤會是將「比較欄位」讀成「物件不能改」。本例沒有禁止寫入，第三行正是修改成功後的結果。若實際需求是辨識 2 天不同場次，就算標籤與分鐘一致也應分開，要先把場次識別資訊納入設計。

## 小結
先寫清楚紀錄由哪些欄位構成，再決定相等的意義。相同資料、不同物件與同一物件有兩個名字，是三種不同情形；列出兩個比較結果，再只改一張，就能用很小的實驗分辨它們。
