---
id: fd-python-tools-07-fixtures
module: fd-python-tools
order: 7
title: pytest 測試資料
subtitle: 每次測試都從空白開始
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-tools-04-tests
objectives:
  - 用 fixture 提供可重建的輸入
  - 利用暫存目錄驗證測試不會改到原始樣本
tags:
  - python-tools
  - fixtures
resources:
  - title: 'pytest：宣告與請求 fixture'
    url: 'https://docs.pytest.org/en/stable/how-to/fixtures.html'
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '讀測試如何用參數取得預先準備的資料。'
  - title: 'pytest：每個測試的 tmp_path'
    url: 'https://docs.pytest.org/en/stable/how-to/tmp_path.html'
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
    note: '核對專屬目錄與 Path 的用法。'
concepts:
  - id: fd-python-tools-fixtures-request
    prompt: '測試函式怎麼取得 fixture 的回傳值？'
    answer: '把 fixture 名稱列成參數，pytest 會解析相依並提供結果。'
    mcq:
      question: '哪個做法會請求名為 log_pair 的 fixture？'
      options:
        - '將測試檔命名為 log_pair'
        - '在測試裡直接呼叫裝飾後的 log_pair()'
        - '在測試函式參數寫 log_pair'
        - '將測試函式命名為 test_log_pair'
      answer: 2
      explain: '參數名稱建立需求關係；不用自行呼叫裝飾後的函式。'
  - id: fd-python-tools-fixtures-isolation
    prompt: '兩個測試都請求 tmp_path 時，檔案為什麼不互相覆寫？'
    answer: '每個測試有自己的目錄，只要把檔案建在該目錄下，同名檔案便是不同路徑。'
    mcq:
      question: '哪一種寫法真的把檔案放在測試專屬目錄？'
      options:
        - 'Path("work.txt")'
        - 'tmp_path / "work.txt"'
        - 'Path.cwd()'
        - '直接指定固定樣本路徑'
      answer: 1
      explain: '檔名相對於哪個目錄才是關鍵，單純要求 tmp_path 不會改變所有路徑。'
  - id: fd-python-tools-fixtures-preserve
    prompt: '成功附加新資料之外，還需要哪個斷言保護樣本？'
    answer: '重新讀取基準檔並核對仍是原內容，而非只檢查它還存在。'
    interview:
      question: '寫檔測試偶爾污染樣本，你會留下哪些證據？'
      points:
        - '為每個測試分配目錄'
        - '明確複製而非重用路徑'
        - '斷言兩個檔案各自的內容'
      answer: '我會讓 fixture 在 tmp_path 建基準和副本，只把副本交給寫入流程。完成後同時讀兩份，證明新增那行在對的位置、基準沒變；再單跑另一案例確認不靠上一個測試。'
practice:
  - id: fd-python-tools-fixtures-lab
    title: '驗證兩個同名工作檔互不干擾'
    kind: code
    minutes: 12
    steps:
      - '儲存並執行 test_log_files.py，暫時印出每次準備的目錄名稱。'
      - '將要附加的內容改為 13，先觀察舊斷言失敗，再更新對應的規格案例。'
      - '保留檢查原樣本不變的斷言，重跑兩項。'
    checks:
      - '兩份工作檔位於不同目錄。'
      - '改完後工作檔為 2 行，原始樣本仍只有 5，兩項都通過。'
---
## 為什麼要學
一個測試替檔案加一行，另一個測試讀第一版檔案。若兩者偷偷共用同一份樣本，單跑都過，整批執行卻可能因為順序改變而失敗。更糟的是，除錯完才發現原始樣本也被改掉了。我們要保存一份可反覆重建的起點，讓會寫入的程式只碰這一次測試專用的工作檔。

## 核心概念
測試準備函式 (fixture) 用 `@pytest.fixture` 標註，負責建立每個案例需要的資料。測試函式只要宣告同名參數，pytest 便會呼叫準備函式，把回傳值交給該參數。不用在測試裡自己呼叫它。預設範圍是單一測試函式；兩個測試提出相同需求，並不因此共用上一次改過的物件。

`tmp_path` 是 pytest 提供的準備項目，給每個測試一個專屬暫存目錄 (temporary directory)，型別為 `Path`。可以把它當成自己的工作桌：先放基準檔，再從基準做一份工作副本，真正改動的是後者。暫存不等於結束就保證刪除，更不表示工作資料夾裡任何舊路徑都受到保護；程式一定要收到正確的目標路徑。

## 範例：同時檢查改動與沒有發生的改動
在 `C:\dev\stackway-lab\python-tools` 建立 `test_log_files.py`，使用已安裝 pytest 的練習環境。基準內容是一段虛構文字，不讀取你的筆記或其他原始檔。`Path` 的斜線運算在這裡用來組合目錄與檔名。

```python
import pytest

@pytest.fixture
def log_pair(tmp_path):
    source = tmp_path / "sample.txt"
    work = tmp_path / "work.txt"
    source.write_text("5\n", encoding="utf-8")
    work.write_bytes(source.read_bytes())
    return source, work

def test_append(log_pair):
    source, work = log_pair
    with work.open("a", encoding="utf-8") as stream:
        stream.write("8\n")
    assert work.read_text(encoding="utf-8").splitlines() == ["5", "8"]
    assert source.read_text(encoding="utf-8").splitlines() == ["5"]

def test_fresh(log_pair):
    source, work = log_pair
    assert work.read_bytes() == source.read_bytes()
```

在同一資料夾的 PowerShell 執行 `.\.venv\Scripts\python.exe -m pytest -q test_log_files.py`；macOS／Linux 用 `.venv/bin/python -m pytest -q test_log_files.py`。預期兩項通過。先依資料的方向讀：基準檔寫 5，工作檔複製內容，附加模式只在工作檔尾端寫 8。第一個案例的第二個斷言，檢查的不是「多了 8」，而是原始那份不該多出任何一行。

第二個案例沒有先刪除 8 再開始；它根本不該見到第一個案例的檔案。若要查證，在準備函式暫時印出 `tmp_path.name`，執行測試時加 `-s` 讓輸出可見。不同的測試會得到不同目錄，即使兩邊都把檔案命名為工作檔也不互撞。如此失敗時可以單獨重跑一個測試，不需要記住「要先跑上一個才會有檔案」。

要測「每次從同一起點開始」，也可以只重跑第二個案例。它應該在完全沒跑第一個案例時就成功；如果得先做一次附加才有檔案，表示準備工作仍藏在另一個測試裡。

## 常見錯誤
`work = source` 只多取了一個名字，沒有複製檔案；寫入任一名字都會修改同一路徑。把暫存路徑當參數卻在函式內固定寫到目前資料夾，同樣失去隔離。不要靠測試結束時刪除共用檔案補救；若中途失敗，清理未執行，下一次仍會讀到殘留內容。先隔開位置，再檢查原始資料未變。

## 小結
準備函式描述起點，測試案例描述改動，暫存目錄隔開每次執行。把「產生預期的新內容」和「沒有改壞原樣本」各寫成斷言，比只看工作檔是否存在更能抓到寫錯目的地的問題。
