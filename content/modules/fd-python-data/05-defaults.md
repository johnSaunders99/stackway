---
id: fd-python-data-05-defaults
module: fd-python-data
order: 5
title: 預設參數與作用域
subtitle: 第二次呼叫為何多了一筆
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-data-04-comprehension
objectives:
  - 區分位置、關鍵字與預設參數
  - 用區域名稱與可變預設值的例子追蹤兩次呼叫
tags:
  - python-data
  - defaults
resources:
  - title: Python 教學：流程控制與參數
    url: https://docs.python.org/zh-tw/3/tutorial/controlflow.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-data-05-timing
    prompt: "一般函式定義中，預設空串列何時建立？"
    answer: "執行該函式定義時建立，而非每次省略引數時。"
    mcq:
      question: "函式宣告的預設參數是空串列。這個物件在什麼時候建立？"
      options:
        - "每次呼叫時"
        - "執行 def 時"
        - "第一次 append 後"
        - "函式回傳後"
      answer: 1
      explain: "同一個預設物件被反覆使用，區域參數可以重新指向它。"
    interview:
      question: "第一次測試正常、第二次卻多了前筆資料，你怎麼縮小原因？"
      points:
        - "用同一行程連續呼叫"
        - "區分區域名稱與共用預設物件"
        - "以 None 分支並測明傳空清單"
      answer: "我會在同一支腳本連叫兩次，不靠重啟掩蓋現象。接著把預設值改為 None，在函式內建立每次的新清單，最後再傳自己的空清單確認仍會收到追加的項目。"
  - id: fd-python-data-05-missing
    prompt: "為何用 is None 而非 if not stops？"
    answer: "要分開未提供與明確提供的空清單。"
    mcq:
      question: "可選清單參數預設是 None。為何用 is None 來決定要不要另建清單？"
      options:
        - "要保留外部空串列的意圖"
        - "因為空串列永遠為真"
        - "因為 None 是一個串列"
        - "因為關鍵字引數不能是空值"
      answer: 0
      explain: "空串列也是假值，寬鬆判斷會誤建另一個容器。"
  - id: fd-python-data-05-keyword
    prompt: "record(stop=\"east\") 的 stop 是什麼？"
    answer: "用關鍵字名稱指定函式的 stop 參數。"
    mcq:
      question: "呼叫 record(stop=\"east\") 時，值與參數如何配對？"
      options:
        - "只能給第一個位置，stop 只是註解"
        - "先改寫函式的預設值再呼叫"
        - "把 east 當成要尋找的參數名稱"
        - "依名稱 stop 配對"
      answer: 3
      explain: "引數標籤用於配對參數，不會因此改外部作用域。"
practice:
  - id: fd-python-data-05-p1
    title: "交出三種呼叫的對照證據"
    kind: code
    minutes: 13
    steps:
      - "存好 defaults.py，標出錯誤版第二次多出的站名。"
      - "暫改成寬鬆真假判斷，檢查外部 plan。"
      - "還原正確條件並在檔尾寫三個預期結果。"
    checks:
      - "錯誤版連續呼叫會累積。"
      - "正確版省略清單時第二次只有 east。"
      - "明傳空清單時 plan 內有 bridge。"
---

## 為什麼要學

做一個登記路線步驟的小函式，你希望每次沒給清單就從空白開始。第一次呼叫收進北門，第二次只傳東門，結果清單裡竟然有 2 站。這不是前一次執行的畫面沒清乾淨，而是參數名稱與它指向的物件有不同的生命週期。今天要把這個現象縮小成兩次呼叫，並讓「建立新清單」與「繼續編輯舊清單」兩種用途都能成立。

## 核心概念

定義函式時括號中的名稱叫參數（parameter），呼叫時放進去的值叫引數（argument）。位置引數依順序配對；關鍵字引數用參數名指定；有預設值（default value）的參數在呼叫者省略時才使用那個值。例如第一個位置給站名，也可用 `stop=` 明寫站名。兩種都是傳資料，不是呼叫時替外部建立一個同名變數。

作用域（scope）決定一個名稱在哪裡查得到。每次呼叫都有自己的區域參數名稱，但不同名稱可以指到同一個物件。預設值的運算式在執行函式定義時求值，不是每次呼叫都重新求值。若預設是一個可變（mutable）的空串列，它就可能被多次省略參數的呼叫共用；對它執行 `append` 會修改那個物件，而不是只改這次呼叫的區域名稱。

## 範例：2 次呼叫，3 種清單

在 `C:\dev\stackway-lab\python-data` 新建 `defaults.py`，於此用 PowerShell 執行 `py defaults.py`；macOS 或 Linux 用 `python3 defaults.py`。第一個函式刻意示範錯誤，第二個才是要留下的規則。

```python
def leaky(stop, stops=[]):
    stops.append(stop)
    return stops

def record(stop, stops=None):
    if stops is None:
        stops = []
    stops.append(stop)
    return stops

print(leaky("north"))
print(leaky(stop="east"))
print(record("north"))
print(record(stop="east"))
plan = []
record("bridge", stops=plan)
print(plan)
```

逐行讀輸出。錯誤版第二次含北門與東門，表示省略第二個參數時重用了同一個串列。正確版以 `None` 表示「沒有提供清單」，在函式內才為這一次建立空串列，所以第二次應只剩東門。最後呼叫者明確傳入自己的空清單，函式應把橋加進那份清單，外部 `plan` 也看得到。新建還是沿用，是呼叫者能預測的條件，不必靠清空隱藏狀態來運作。

做個小實驗：只把正確版的判斷改成 `if not stops:` 再跑。前面兩個單站結果可能仍然正確，最後的外部清單卻變成空的，因為空清單也被判成假，區域名稱改指到另一份新清單。這個反例說明「沒提供」與「有提供但目前是空的」不是同一回事。驗完把條件改回去，保留外部清單能收到橋的證據。

## 常見錯誤

看到 `stops` 是區域名稱就推論不可能影響外部；名稱的可見範圍不能保證物件沒有其他持有者。另一個易混點是把 `None` 當成空串列去追加；它只是一個明確的缺值訊號，必須先建立容器，再對容器操作。若不想修改呼叫者傳入的資料，那是另一個契約，需要先複製並在說明中講清楚。

## 小結

先決定函式是否允許延用呼叫者的清單，再選怎麼表示省略值。用連續兩次不傳清單，加上一次明傳空清單來驗收；只看第一個漂亮結果，很容易漏掉跨呼叫累積的錯誤。
