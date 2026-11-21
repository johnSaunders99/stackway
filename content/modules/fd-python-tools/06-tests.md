---
id: fd-python-tools-04-tests
module: fd-python-tools
order: 6
title: pytest 斷言與例外測試
subtitle: 用失敗案例寫第一個測試
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-tools-03-types
objectives:
  - 把計算邏輯與檔案讀寫分開
  - 用 pytest 檢查一般值與例外
tags:
  - python-tools
  - pytest
resources:
  - title: 'pytest：斷言與預期例外'
    url: 'https://docs.pytest.org/en/stable/how-to/assert.html'
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: '讀 assert 的差異顯示與 raises 的範圍。'
concepts:
  - id: fd-python-tools-tests-assert
    prompt: 'assert 在一般結果測試中驗證什麼？'
    answer: '它驗證條件為真，例如實際回傳值等於根據需求算出的期望值。'
    mcq:
      question: '規格明定 17 分鐘分 3 場取整數為 5，測試失敗時應先看什麼？'
      options:
        - '把期望改成 20'
        - '實際回傳式是否符合整除'
        - '改用可整除的測資再判斷'
        - '先改報表檔的讀取路徑'
      answer: 1
      explain: '這是直接呼叫計算函式的測試，不涉及檔案；換整除測資可能遮住餘數處理的錯誤。'
  - id: fd-python-tools-tests-raises
    prompt: '如何測試一個操作應當拒絕非法輸入？'
    answer: '用 pytest.raises 包住該次呼叫，指定預期例外，必要時再檢查訊息。'
    mcq:
      question: '用 raises(ValueError) 包住呼叫，哪種情況會通過？'
      options:
        - '回傳 ValueError 物件'
        - '正常回傳 0'
        - '發生 ZeroDivisionError'
        - '引發 ValueError'
      answer: 3
      explain: '回傳和引發不同；指定例外可防止因不相干錯誤而假通過。'
  - id: fd-python-tools-tests-separate
    prompt: '為何將報表讀檔與平均計算分開？'
    answer: '純計算可直接給數字測試，結果不依賴檔案位置或內容。'
    interview:
      question: '每次測平均都要準備一份報表，你會如何改？'
      points:
        - '把讀取與計算拆開'
        - '用固定數字驗證正常回傳'
        - '另測非法場次'
      answer: '我先抽出接受總分鐘和場次的函式，拿 17 除以 3 核對 5；空報表則明確預期例外。檔案格式另外測，這樣失敗報告能告訴我是讀取壞了還是計算錯。'
practice:
  - id: fd-python-tools-tests-lab
    title: '保存一敗一過到 2 項通過的測試'
    kind: code
    minutes: 12
    steps:
      - '建立兩個範例檔並以指定環境執行 pytest。'
      - '記下失敗項目、實際與期望值，再只修正計算函式。'
      - '新增一個總分鐘小於場次的案例，保留三項測試。'
    checks:
      - '初次只有一般案例失敗，例外案例通過。'
      - '修正並加入案例後顯示 3 passed，2 分鐘分 3 場回傳 0。'
---
## 為什麼要學
一行取整數的計算改過以後，正常例子看似沒問題，空報表卻讓畫面中斷。只記得昨天手動試過，今天就得再猜該試哪些值。自動測試 (automated test) 把「給什麼，應該得到什麼」寫成可重跑的程式。這堂會先看一個真的失敗，再修正計算，而不是只追求終端機出現綠字。

## 核心概念
斷言 (assertion) 寫作 `assert 條件`。測試執行器 pytest 會尋找檔名和函式名符合測試慣例的案例，執行後列出哪些條件不成立。若需求是「沒有場次就拒絕」，例外才是正確行為；用 `with pytest.raises(ValueError):` 包住那一次呼叫。沒有引發或引發不同種類的例外，都不算通過。

把讀檔和計算拆開：計算函式接收數字，不自行開檔，不詢問鍵盤，也不從畫面取得值。如此測試只要交給它兩個整數，不需要先準備一份位置剛好的報表。日後改用另一種輸入格式，平均分鐘的規則與這兩個案例都能保留。這裡假設上游已確認總分鐘非負，本函式負責檢查場次必須為正，再將平均取整數部分。

## 範例：先讓一個測試指出一個錯誤
在 `C:\dev\stackway-lab\python-tools` 使用前課的 `.venv`。在同一資料夾建立兩個檔案，第一個 `report_math.py` 刻意把除法寫錯：

```python
def whole_average(total, count):
    if count <= 0:
        raise ValueError("count must be positive")
    return total + count
```

第二個存成 `test_report_math.py`。第一個案例用已知答案比對；第二個只包住應拋出例外的呼叫，避免準備資料時出錯卻意外讓測試通過。

```python
import pytest
from report_math import whole_average

def test_average():
    assert whole_average(17, 3) == 5

def test_empty_report():
    with pytest.raises(ValueError, match="count must be positive"):
        whole_average(0, 0)
```

在同一資料夾的 PowerShell 執行。首次安裝需要網路，只安裝到練習環境：

```powershell
.\.venv\Scripts\python.exe -m pip install pytest
.\.venv\Scripts\python.exe -m pytest -q test_report_math.py
```

macOS／Linux 在對應資料夾執行：

```bash
.venv/bin/python -m pip install pytest
.venv/bin/python -m pytest -q test_report_math.py
```

第一次應是一敗一過，實際值 20 與期望值 5 不同。這個差距在完全不開檔時也能重現，因此先檢查計算，不去調整路徑。把回傳式改成 `total // count` 並重跑同一個測試指令，兩項都應通過。注意不是把期望值改成 20：當規則不變時，測試就是用來提醒實作偏離，而不是替當前輸出背書。

為什麼用 17 而不是 15？15 分 3 場即使使用一般除法，也會得到與整數 5 比較相等的數值；17 留下餘數，更能辨認是否真的依規則取整。測資不用多，應該優先選能分出兩種實作行為的那一筆。

## 常見錯誤
檔名沒以測試慣例命名、函式沒以 `test_` 開頭，可能導致沒有收集到案例。「0 個案例」不是「全部通過」。直接執行測試檔只會定義函式，不等於請 pytest 執行它們。另一個常見問題是把兩個行為塞進同一個例外區塊；第一個操作一旦失敗，第二個便不會執行，表面通過卻沒測到真正要驗證的那一步。

## 小結
好測試應該能在程式壞掉時因正確理由失敗，修好後再恢復通過。保留剛好能區分加法與整除的小例子，再為拒絕條件單獨寫一項案例，下一次改動報表時就有可重播的依據。
