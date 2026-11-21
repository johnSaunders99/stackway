---
id: fd-python-tools-03-types
module: fd-python-tools
order: 5
title: Python 型別註記
subtitle: 替資料畫出型別邊界
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-tools-01-env
objectives:
  - 用類別封裝紀錄與狀態
  - 為函式的參數與回傳值加註型別
tags:
  - python-tools
  - typing
resources:
  - title: 'Python：型別註記與執行行為'
    url: 'https://docs.python.org/3/library/typing.html'
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '讀說明開頭，區分註記與執行時檢查。'
concepts:
  - id: fd-python-tools-types-signature
    prompt: '函式參數後的冒號與括號後的箭頭各描述什麼？'
    answer: '冒號描述該參數的預期型別，箭頭描述預期回傳型別。'
    mcq:
      question: '哪個簽名描述「收文字、回整數」？'
      options:
        - 'f(x: int) -> str'
        - 'f(x: str) -> None'
        - 'f(x: str) -> int'
        - 'f(x: int) -> int'
      answer: 2
      explain: '先讀括號內的參數，再讀括號外的箭頭。'
  - id: fd-python-tools-types-runtime
    prompt: '註記為 int 的參數收到文字，Python 一定拒絕嗎？'
    answer: '不一定；註記本身不強制檢查，實際結果由程式對該值的操作決定。'
    mcq:
      question: 'doubled 的本體是 value * 2，傳入文字 3 會得到什麼？'
      options:
        - '整數 6'
        - '字串 33'
        - '一定是 TypeError'
        - '整數 33'
      answer: 1
      explain: '字串乘 2 代表重複；參數和回傳的註記都不會自動轉型。'
    interview:
      question: '資料有註記卻產生錯誤字串，你會在哪裡修？'
      points:
        - '註記不會轉型'
        - '先檢查輸入邊界'
        - '保留計算內部的明確型別'
      answer: '我會看資料進來時實際是文字還是整數。輸入端確認格式並轉成整數，內部就能維持加總約定；不會只把箭頭改成 int 然後假設結果正確。'
  - id: fd-python-tools-types-mutate
    prompt: '方法宣告回傳 None，呼叫後如何取得更新的資料？'
    answer: '若方法修改實例，就從原實例讀取新的狀態，而不是把回傳值當成新實例。'
practice:
  - id: fd-python-tools-types-lab
    title: '替讀書紀錄加一個查詢'
    kind: code
    minutes: 10
    steps:
      - '儲存 typed_log.py，觀察字串與整數的倍增差異。'
      - '新增 seconds 方法，註記回傳整數，回傳分鐘乘 60。'
      - '沿用原本的 15 分鐘，只再加 5 分鐘，印出秒數及描述。'
    checks:
      - '秒數是整數 1200，描述仍使用 20 min。'
      - 'seconds 不會改動原本的分鐘。'
---
## 為什麼要學
同樣是一筆 15 分鐘的紀錄，文字欄位讀出的是 `"15"`，計算需要的卻是 `15`。如果靠每個呼叫者猜測函式想拿哪一種，查錯時就會不停追資料從哪裡來。這堂先替一份讀書紀錄寫清楚接收什麼、交回什麼，再用一組實驗看看這個說明會不會自動把錯的資料變成對的。

## 核心概念
型別註記 (type annotation) 以 `name: type` 描述參數，以 `-> type` 描述預期回傳值。`str` 是字串、`int` 是整數，`None` 表示沒有要交回的有用結果。註記能讓編輯器或靜態型別檢查器 (static type checker) 在執行前比對用法。Python 本身不會因為註記替你轉換、攔截或修復輸入；執行時的行為仍取決於函式裡寫了哪些操作。

紀錄類別把同一份狀態和操作放在一起。這裡的累計只存整數；從文字到整數的轉換留在外面的輸入邊界。`add` 做的事是累加而非產生新紀錄，所以把回傳標為 `None`；`describe` 要把狀態交給畫面，因此回傳字串。讀一個函式的註記，先分清它是回傳結果，還是更新了你交給它的物件。

## 範例：同一個乘法，2 種結果
先說明註記預期收什麼，再觀察執行時真正收到什麼。寫上型別並不會偷偷替呼叫端轉換輸入。把下面的範例存成 `C:\dev\stackway-lab\python-tools` 裡的 `typed_log.py`。

在該目錄執行：Windows PowerShell 用 `py typed_log.py`；macOS／Linux 用 `python3 typed_log.py`。

```python
class StudyLog:
    def __init__(self, label: str) -> None:
        self.label = label
        self.minutes: int = 0

    def add(self, minutes: int) -> None:
        self.minutes += minutes

    def describe(self) -> str:
        return f"{self.label}: {self.minutes} min"

def doubled(value: int) -> int:
    return value * 2

log = StudyLog("reading")
log.add(int("15"))
print(log.describe())
print(doubled(3), repr(doubled("3")))
```

先預測最後一行會不會丟出例外。傳進整數 3 時得到 6；傳進文字 3 時字串乘 2 是合法操作，得到 2 個字元組成的字串。用 `repr` 可以直接看到引號，不會把結果誤看成數字 33。這行刻意違反註記以觀察行為；若編輯器已開啟型別檢查，它指出問題是合理的，不代表直譯器會在同一處阻止執行。

現在回到正規呼叫：外層先轉換 15，紀錄物件只需處理整數，不必知道來源有沒有引號。要處理空白或負數，應在適當位置加明確的驗證，不要把「是整數」和「符合預期範圍」混為一談。若檔案讀入 10 筆，9 筆正確，也不能據此推論第十筆一定符合註記；外部資料仍需要實際檢查。

把最後一行當成兩個問題一起回答：直譯器願不願意執行，以及結果符不符合原本的承諾。這兩題答案可以不同；正因如此，只有程式順利結束還不足以驗證型別邊界。

## 常見錯誤
把回傳註記寫成字串，不會替缺少 `return` 的函式補出文字；把參數註記成整數也不會協助呼叫方補上 `int`。如果寫成 `log = log.add(5)`，原物件雖然增加了分鐘，新指定卻把這個名字改指向空值。看見 `-> None` 就要先問自己，本來該讀的是回傳值還是呼叫以後的物件狀態。

## 小結
註記負責講清楚承諾，程式碼負責兌現。讓文字留在輸入端、整數留在計算端，再用實際值檢查這條界線；即使沒有安裝額外檢查工具，這份紀錄也會比一串沒有單位或型別線索的參數容易維護。
