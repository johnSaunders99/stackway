---
id: fd-python-oop-02-methods
module: fd-python-oop
order: 2
title: 初始化與實例方法
subtitle: 從建立那刻就有合法狀態
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-oop-01-objects
objectives:
  - 用 __init__ 設定實例欄位
  - 用 self 寫方法並追蹤一次呼叫前後的狀態
tags:
  - python-oop
  - methods
resources:
  - title: 'Python 教學：方法物件'
    url: 'https://docs.python.org/zh-tw/3/tutorial/classes.html#method-objects'
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '比較透過實例和透過類別呼叫的方法。'
concepts:
  - id: fd-python-oop-methods-init
    prompt: '初始分鐘數為何放在 __init__？'
    answer: '每個新實例在首次使用前便有自己的合法起始狀態。'
    mcq:
      question: '要讓新計時器一定從 0 開始，哪裡最合適？'
      options:
        - '每次 add 結束時'
        - '第一次列印後'
        - '初始化方法中'
        - '由每個呼叫端自行補上'
      answer: 2
      explain: '建好就有才不會漏設；每次操作都清零則無法累加。'
  - id: fd-python-oop-methods-receiver
    prompt: '呼叫 rest.add(3) 時 self 是誰？'
    answer: '是 rest 所指的那個實例，由點號呼叫自動傳入。'
    mcq:
      question: 'study 與 rest 相互獨立，rest.add(3) 改哪個欄位？'
      options:
        - 'study.minutes'
        - 'Timer.minutes'
        - '區域變數 minutes'
        - 'rest.minutes'
      answer: 3
      explain: 'self 隨接收者改變，不是固定指向第一個建立的實例。'
  - id: fd-python-oop-methods-guard
    prompt: '拒絕一次加值，為何必須先判斷再修改？'
    answer: '才能讓失敗操作不改動原有狀態；只回傳失敗不會自動復原先前的指派。'
    interview:
      question: '拒絕的操作也改了數字，你會如何縮小問題？'
      points:
        - '記下呼叫前的值'
        - '同時查回傳值與狀態'
        - '先判斷再寫入'
      answer: '我會從 6 分鐘呼叫 add(-2)，分別看是否回傳 False 和分鐘是否仍為 6。若結果說失敗但數值變了，先找寫入是否早於檢查，而不是只改畫面。'
practice:
  - id: fd-python-oop-methods-lab
    title: '留下三次呼叫的收據'
    kind: code
    minutes: 10
    steps:
      - '執行 timer_steps.py，記錄每次的接受結果和分鐘。'
      - '加一筆 0，確認被拒絕，再讓 rest 單獨加 3。'
      - '把兩台的結算值印在檔尾。'
    checks:
      - '0 分鐘回傳 False 且讀書時間仍為 10。'
      - '休息時間是 3，不會讓讀書時間變成 13。'
---
## 為什麼要學
如果每次建立計時器都要記得補上分鐘數，漏掉的那一次往往要到按下開始才會出錯。假如畫面、鍵盤捷徑和練習腳本都能加時間，也不值得在三處各寫一次「不可倒扣」。我們要把兩件事分開安排：建立時讓欄位齊全，使用時只開放有明確意義的操作。

## 核心概念
初始化方法 (initializer) `__init__` 會在新實例建立後自動執行。名稱前後各有兩個底線。在類別裡以 `def` 定義函式，第一個參數依慣例叫 `self`，代表這一次收到呼叫的實例。`self.label = label` 左邊是會留在物件上的屬性，右邊是本次呼叫傳來的參數。名字可以相同，壽命卻不同。分鐘數直接從 0 開始，不必讓使用者猜該填什麼。

實例方法 (instance method) 描述已建立的物件會做什麼。讀 `study.add(6)` 時，先找接收者，再看動作和引數。Python 已把點號左邊的物件交給第一個參數，所以括號只寫 6。方法裡讀寫 `self.minutes` 就是讀寫這一台；用另一台呼叫相同方法，接收的位置也跟著換。

## 範例：拒絕倒扣，但保留原值
把方法裡的 self 換讀成「這次接到呼叫的那個物件」。回頭看初始值在哪一步設定、又在哪一步改變。把下面的範例存成 `C:\dev\stackway-lab\timers` 裡的 `timer_steps.py`。

在該目錄執行：Windows PowerShell 用 `py timer_steps.py`；macOS／Linux 用 `python3 timer_steps.py`。

```python
class Timer:
    def __init__(self, label):
        self.label = label
        self.minutes = 0

    def add(self, delta):
        if delta <= 0:
            return False
        self.minutes += delta
        return True

study = Timer("study")
rest = Timer("rest")
for amount in [6, -2, 4]:
    accepted = study.add(amount)
    print(amount, accepted, study.minutes)
print(rest.label, rest.minutes)
```

這個方法約定接收整數分鐘。從第二輪倒著看：進方法以前是 6，判斷負 2 不是正數，立即回傳 `False`，所以加法根本沒執行；回到迴圈後，畫面仍是 6。第三輪則在原有的 6 上加 4，回傳的是「有沒有接受」而不是累計值。把回傳結果與物件狀態並排印出，可以檢查拒絕操作是否也意外留下痕跡。

請把最後一行改為先讀讀書計時器的標籤、再讀休息計時器的分鐘數。兩個欄位都是在初始化時由同一段程式設定，卻各有各的內容。你不需要在每次加時間前把標籤再傳一次；保存狀態正是這個物件的責任。若只要把分鐘換成秒，不需記得上一次的結果，一個普通函式就已經夠用。

試著把失敗那一輪單獨抄成兩句：6 分鐘的這台計時器收到負 2；它拒絕，所以仍是 6。若說不出句子的主詞，就先找點號左側。這個讀法也適用於標籤相同但各自建立的兩個實例。

## 常見錯誤
在方法內只寫 `minutes = delta`，會建立區域變數，呼叫結束就看不到；它不是修改點號後面的欄位。在呼叫時額外寫 `study.add(study, 6)` 則把接收者傳了兩次。若兩台機器的累計每次都重新歸零，看看歸零那行是不是誤放在加時間的方法裡，而不是只執行一次的初始化階段。

## 小結
建立時計時器就該可以讀；操作成功時才改狀態；操作失敗時仍然要能解釋它留下什麼。追蹤方法不要只記最後印出的數字，把接收者、傳入值、回傳值和呼叫後的欄位分開看。
