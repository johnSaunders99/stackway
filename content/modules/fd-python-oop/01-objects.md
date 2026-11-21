---
id: fd-python-oop-01-objects
module: fd-python-oop
order: 1
title: 類別與物件
subtitle: 兩個計時器各記自己的時間
status: ready
minutes: 30
level: 2
prereqs: []
objectives:
  - 宣告 class 並建立兩個實例
  - 檢查修改一個實例不會改到另一個
tags:
  - python-oop
  - objects
resources:
  - title: 'Python 教學：類別與實例'
    url: 'https://docs.python.org/zh-tw/3/tutorial/classes.html#class-objects'
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '讀類別呼叫與實例屬性的例子。'
concepts:
  - id: fd-python-oop-objects-make
    prompt: '類別宣告和呼叫類別的時機有何不同？'
    answer: '宣告定義一種型別；在此例呼叫 Timer() 才建立一個新的計時器實例。'
    mcq:
      question: '哪一行真正建立新的 Timer 實例？'
      options:
        - 'other = study'
        - 'other = Timer()'
        - 'other = Timer'
        - 'study.minutes = 0'
      answer: 1
      explain: '有括號才呼叫類別。指定現成實例或類別名稱，都只建立名字的關聯。'
  - id: fd-python-oop-objects-field
    prompt: '兩個分別建立的計時器，為什麼能各自記分鐘？'
    answer: '指派到各自的實例屬性，讀寫的是不同物件身上的欄位。'
    mcq:
      question: '兩個新實例各設 minutes 為 0，只對第一個加 3，第二個的值為何？'
      options:
        - '3'
        - 'None'
        - '0'
        - '讀取時找不到 minutes 屬性'
      answer: 2
      explain: '相同的欄位名稱並不共用儲存位置；第二個也已明確設為 0。'
  - id: fd-python-oop-objects-alias
    prompt: '把現成的計時器指定給新名字，會多一份狀態嗎？'
    answer: '不會；兩個名字指向同一實例，從任一端修改都能從另一端看到。'
    interview:
      question: '兩個計時器的數字總是一起跳，你會如何確認它們是否獨立？'
      points:
        - '檢查建立或指定的位置'
        - '用 is 分辨是否同一物件'
        - '只動其中一個再讀另一個'
      answer: '我會先看第二個名字來自 Timer() 還是直接指定，再用 is 確認。若兩種用途應各自計時，我會分開建立，只加讀書時間，確認休息時間不動。'
practice:
  - id: fd-python-oop-objects-lab
    title: '替計時器加一個觀察窗口'
    kind: code
    minutes: 10
    steps:
      - '儲存並執行 two_timers.py，先畫出 study 和 rest 的箭頭。'
      - '從 label 再加 5 分鐘，分別印出三個名字的分鐘數。'
      - '在程式末尾用註解留下預測與實際值。'
    checks:
      - '最後 study 和 label 都是 15，rest 仍為 0。'
      - '我能指出哪一行只增加名字，沒有建立計時器。'
---
## 為什麼要學
讀書倒數和休息倒數都用分鐘。若只用一個變數，休息開始時歸零，讀書紀錄也跟著消失。你可以分開寫兩個變數，但等到每個計時器又有標籤、累計次數，就很容易把同一組資料拆散。這堂不必真的等 1 分鐘；我們用程式裡的數字模擬時間，要回答的是：這 1 分鐘究竟記在誰身上？

## 核心概念
類別 (class) 為一種事物取名；實例 (instance) 是用這個類別實際建立的物件 (object)。宣告 `class Timer:` 時還沒有建立任何一個倒數用的實例。冒號後面要有縮排，範例的 `pass` 表示這一段先不做事。等執行 `Timer()`，才得到一個新的計時器。再執行一次，即使括號裡同樣是空的，得到的也不是剛才那一個。

屬性 (attribute) 是掛在物件上的名字。看見點號時，從左往右讀：先找點號左邊的物件，再到它身上讀取或設定右邊的屬性。寫 `study.minutes = 0` 就是在讀書計時器身上建立分鐘欄位，不是替所有計時器訂一條規則。這次刻意自己填起始值；之後在[〈初始化與實例方法〉](#/lesson/fd-python-oop-02-methods)會細講如何讓每個計時器一出生就有這個欄位。

## 範例：畫出 2 個名字指向哪裡
在 `C:\dev\stackway-lab\timers` 新建 `two_timers.py`。把兩個計時器畫在不同的框裡。對其中一個累加分鐘時，另一個應保留什麼值？先寫預測再讀輸出。

在該目錄執行：Windows PowerShell 用 `py two_timers.py`；macOS／Linux 用 `python3 two_timers.py`。

```python
class Timer:
    pass

study = Timer()
rest = Timer()
study.minutes = 0
rest.minutes = 0
study.minutes += 8
print(study.minutes, rest.minutes)
label = study
label.minutes += 2
print(study.minutes, rest.minutes)
print(label is study, rest is study)
```

先遮住最後三行。第一次列印應該是 `8 0`：兩個物件都用了同一種欄位名稱，不代表它們共用欄位值。接著在紙上畫兩個框，各寫一個分鐘數；用箭頭把變數名連到框。執行 `label = study` 時，只要再畫一支箭頭，不需要第三個框。從新名字加 2 分鐘，再沿舊名字去看，兩支箭頭終點相同，所以第二行是 `10 0`。

這種「同一個東西有兩個名字」的情況叫別名 (alias)。最後一行使用 `is` 問是不是同一個物件，因此得到 `True False`。它問的不是兩邊的分鐘數有沒有碰巧一樣。若把休息計時器也調到 10 分鐘，資料相符，箭頭仍指向不同的框。判斷身分與比較內容是兩個問題。

能不能把兩次建立濃縮成一行？可以，但要看等號右邊實際做了幾次建立。連鎖指定看起來列了兩個名字，卻只求值一次；這就是畫兩個框與只畫一個框的分界。

## 常見錯誤
若把第二次建立改成 `rest = study`，後面讀起來依然像兩個角色，但第一次列印就會變成兩邊都是 8。找錯時不要只盯著加法，先往上數到底呼叫了幾次類別。另一個線索是屬性不存在：在寫入 `rest.minutes` 前就讀取它，Python 不會猜測未填的時間等於 0。檢查拼字，以及這個特定實例是否真的收到過初始值。

## 小結
先用類別建立物件，再決定哪些名字參照它。需要兩份各自累計的狀態就建立兩個實例；需要從另一個名字觀察同一份紀錄才使用指定。能畫對那兩支箭頭，比記住類別像哪一種日常物品更有用。
