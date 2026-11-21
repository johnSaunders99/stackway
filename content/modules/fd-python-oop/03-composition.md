---
id: fd-python-oop-03-composition
module: fd-python-oop
order: 3
title: 繼承與組合
subtitle: 需要換的是記錄方式，不是整個計時器
status: ready
minutes: 35
level: 2
prereqs:
  - fd-python-oop-02-methods
objectives:
  - 以子類別覆寫同名方法
  - 改用組合替換輸出元件，說明兩種相依關係
tags:
  - python-oop
  - composition
resources:
  - title: 'Python 教學：繼承'
    url: 'https://docs.python.org/zh-tw/3/tutorial/classes.html#inheritance'
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '查子類別語法與同名方法的查找。'
concepts:
  - id: fd-python-oop-composition-override
    prompt: '子類別定義同名方法，呼叫時如何選擇？'
    answer: '對子類別實例呼叫時優先使用覆寫的方法，沒有覆寫才沿用找到的基底方法。'
    mcq:
      question: '把 Compact 的本體改成 pass，Compact().render(7) 會怎樣？'
      options:
        - '回傳空字串'
        - '使用 Line 的格式'
        - '呼叫時找不到 render'
        - '因為只寫 pass 而回傳 None'
      answer: 1
      explain: 'pass 沒有新增方法，但會繼承基底的 render。'
  - id: fd-python-oop-composition-delegate
    prompt: '計時器持有格式器屬於什麼關係？'
    answer: '組合；計時器負責保存時間，把文字輸出委派給另一個物件。'
    mcq:
      question: '哪個修改只換輸出、不重建計時器？'
      options:
        - '修改 watch.minutes'
        - '只建立 Compact()，不交給 watch'
        - '替換 watch.output'
        - '把 watch 指向新建的 Timer(Compact())'
      answer: 2
      explain: '替換合作物件就能沿用原來計時器及其數字。'
    interview:
      question: '要增加第三種報告格式，你會改計時器的哪一部分？'
      points:
        - '區分計時與呈現'
        - '提供相同輸入與回傳'
        - '替換協作者並核對原狀態'
      answer: '我不會複製計時器。新增一個能把分鐘轉成字串的格式器，在建立時傳入或更換 output；我會用同一個 12 分鐘比較輸出，也確認分鐘沒被改掉。'
  - id: fd-python-oop-composition-contract
    prompt: '替代格式器至少要守住什麼呼叫約定？'
    answer: '提供 render 方法，能接收分鐘並回傳格式化字串，否則下游無法以相同方式使用。'
practice:
  - id: fd-python-oop-composition-lab
    title: '添加只顯示秒數的格式器'
    kind: code
    minutes: 12
    steps:
      - '儲存 timer_output.py，保留兩種原輸出。'
      - '新增 Seconds 類別，讓 render 回傳分鐘乘 60 後接 s。'
      - '在同一個 watch 更換格式器，印出報告與原分鐘。'
    checks:
      - '三種格式依序為 12 min、12m、720s。'
      - '最後 watch.minutes 仍為 12，Timer.report 不必新增分支。'
---
## 為什麼要學
計時器記了 12 分鐘，終端機想看「12 min」，摘要畫面卻只要「12m」。算出來的數字完全相同，變的是怎麼呈現。如果為每種輸出各複製一份計時器，之後修正加時間的規則，很容易只修到其中一份。本堂先做一種輸出的兩個版本，再讓同一個計時器使用不同版本。

## 核心概念
繼承 (inheritance) 表示新類別是一種既有類別。`class Compact(Line):` 括號裡的是基底類別；子類別可以沿用它的行為，也可以定義同名方法來覆寫 (override)。呼叫方法時，Python 先依實際物件的類別找實作。在這裡約定兩種格式器都收一個分鐘數，回傳字串，呼叫方不需要知道是哪一種在處理。

組合 (composition) 是把工作交給持有的另一個物件。計時器不是一種格式器；它「有一個」格式器。建立時計時器把對方存入屬性，需要顯示才請對方產生文字。這個分工讓數字的來源和字串的長相可以分開檢查。這也不要求每個合作物件都要有同一個祖先，只要真的支援約定的呼叫。

## 範例：留下分鐘數，換掉輸出的接手者
開啟 `C:\dev\stackway-lab\timers`，將範例另存為 `timer_output.py`。區分計時器自己負責的事，以及它交給另一個物件處理的事。更換輸出方式時，哪一段邏輯應不必重寫？

在該目錄執行：Windows PowerShell 用 `py timer_output.py`；macOS／Linux 用 `python3 timer_output.py`。

```python
class Line:
    def render(self, minutes):
        return f"{minutes} min"

class Compact(Line):
    def render(self, minutes):
        return f"{minutes}m"

class Timer:
    def __init__(self, output):
        self.minutes = 0
        self.output = output

    def report(self):
        return self.output.render(self.minutes)

watch = Timer(Line())
watch.minutes = 12
print(watch.report())
watch.output = Compact()
print(watch.report(), watch.minutes)
```

用手指跟著第一次報告的路徑：從計時器出發，讀到它存的輸出物件，再把 12 交給對方的方法。方法回傳給報告，報告再把字串還給列印。第二次只有箭頭中段換了接收者，所以原本的數字沒變。拿掉子類別的覆寫、在類別本體寫 `pass` 再試一次，你會讀到上層提供的格式，而不是空字串。

要決定用哪一種關係，可以問兩個不同問題。精簡格式能否放到原本接受一般格式的地方，仍交出一段文字？可以，因此可視為同一類角色。計時器是否必須學會所有文字輸出規則，才能繼續記時間？不必，因此讓它持有協作者，比把它做成格式器的子類別容易替換。兩種設計能合作，不必整個程式只選其一。

還可以在沒有計時器時單獨呼叫格式器。若格式器把 12 正確寫成精簡格式，但報告仍然採舊格式，要查的是計時器持有哪個物件，不是去改字串的拼法。

## 常見錯誤
傳 `Compact` 而不是 `Compact()`，交出去的是類別，不是已建立的格式器。覆寫時只改方法名稱大小寫，也會變成另一個方法，呼叫原名依舊得到舊輸出。若新格式器直接列印卻不回傳，畫面可能看似有字，但需要字串的報告取得的是 `None`。檢查約定要同時看輸入與回傳，不只看方法的名字。

## 小結
同一種角色要改變行為，可以沿用類別再覆寫；同一個物件想改用不同幫手，則把幫手當屬性換掉。能指出「哪一行交棒」與「哪一份資料沒搬家」，就能對這次設計做出說得通的解釋。
