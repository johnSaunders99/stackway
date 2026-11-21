---
id: fd-python-data-08-stdlib
module: fd-python-data
order: 8
title: 標準函式庫與路徑
subtitle: 從日誌檔讀出一份 JSON 摘要
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-data-07-imports
objectives:
  - 用 pathlib 組合路徑而非拼接反斜線
  - 用 json 將資料讀回並核對型別
tags:
  - python-data
  - stdlib
resources:
  - title: Python：pathlib 路徑物件
    url: https://docs.python.org/zh-tw/3/library/pathlib.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Python：JSON 編碼與解碼
    url: https://docs.python.org/zh-tw/3/library/json.html
    kind: doc
    lang: zh-Hant
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-data-08-anchor
    prompt: "需求是讀腳本旁的檔案，應以什麼為路徑起點？"
    answer: "以解析後的腳本所在目錄為基準。"
    mcq:
      question: "日誌約定與 summary.py 並排，從不同目錄啟動時應以哪裡作為路徑基準？"
      options:
        - "腳本所在目錄"
        - "終端機開啟位置"
        - "固定取目前目錄的上一層"
        - "直譯器安裝目錄"
      answer: 0
      explain: "工作目錄可能改變，檔案明訂和腳本並排。"
    interview:
      question: "工具從編輯器能跑，換目錄就找不到日誌，你怎麼修並驗證？"
      points:
        - "確認需求是相對腳本而非工作目錄"
        - "組出腳本旁路徑"
        - "從父目錄執行並讀回摘要"
      answer: "我先確認日誌本應與腳本並排，改用腳本目錄組路徑，不把自己的磁碟位置寫死。再從父目錄啟動，檢查檔案位置，並讀回確認總數是整數且算對。"
  - id: fd-python-data-08-decode
    prompt: "json.loads 接收本例讀回的文字後，會交出什麼？"
    answer: "解析後的 Python 字典，其中數值欄位可為整數。"
    mcq:
      question: "對含整數欄位的 JSON 物件文字呼叫 json.loads，得到的是什麼？"
      options:
        - "仍是同一個字串"
        - "按行切好的字串串列"
        - "所有欄位值都是字串的字典"
        - "可查欄位的字典"
      answer: 3
      explain: "read_text 取得字串，loads 依 JSON 結構還原資料。"
  - id: fd-python-data-08-roundtrip
    prompt: "為什麼寫完摘要還要從磁碟讀回？"
    answer: "確認真正交付的檔案可解析，且欄位值與型別符合約定。"
    mcq:
      question: "為何要從磁碟重讀摘要，而不只印出寫檔前的 Python 字典？"
      options:
        - "印原字典已能證明輸出檔案完整"
        - "只要讀回文字就能自動保證欄位是整數"
        - "驗證磁碟產物的值與型別"
        - "讀檔會替換原腳本使用的工作目錄"
      answer: 2
      explain: "印出記憶體中的原字典，不能證明落盤內容可用。"
practice:
  - id: fd-python-data-08-p1
    title: "留下可重讀的日誌摘要"
    kind: code
    minutes: 14
    steps:
      - "建立 log-demo 的樣本日誌與 summary.py。"
      - "從父目錄執行，核對產物位置、型別與初始總值。"
      - "在日誌新增 6 分鐘，再執行並打開 summary.json。"
    checks:
      - "摘要在 log-demo 而非啟動目錄。"
      - "第一次顯示 dict int 及 3 60。"
      - "第二次摘要為 4 筆、66 分鐘。"
---

## 為什麼要學

昨天的報表在編輯器可以跑，今天從另一個資料夾啟動卻「找不到檔案」。另一個常見問題是摘要明明寫進檔案了，讀回來卻只能印文字，不能把總分鐘加 1。這兩件事各有一個工具：標準函式庫（standard library）裡的 `pathlib` 管路徑，`json` 管文字與資料結構之間的轉換。這堂的交付物是一份真的能重開、查欄位與核對數值的摘要，不是一張終端機截圖。

## 核心概念

路徑物件（path object）讓你用 `目錄 / 檔名` 組合路徑，這裡的斜線是在路徑物件上表示組合，不是數字除法。相對路徑通常從目前工作目錄（current working directory）解讀，與腳本所在位置未必相同。在這種要讀取腳本旁樣本檔的小工具，用 `Path(__file__).resolve().parent` 取得這支腳本所在的目錄，再接上檔名，就能清楚表達基準。這是一般腳本的做法，不是在互動提示符號裡輸入整段。

JSON 是一種交換資料的文字格式。序列化（serialization）是把字典、串列等支援的資料結構轉為 JSON 文字，`json.dumps` 的結果是字串；`json.loads` 則把 JSON 文字解析為 Python 值。讀檔與解析是兩步，寫檔與轉文字也是兩步。若把 `str(字典)` 直接寫入，看起來雖然也有大括號，但其中的引號或布林值寫法不一定符合 JSON，交給別的工具就可能讀不回來。

## 範例：從日誌算出可攜的摘要

在 `C:\dev\stackway-lab\python-data` 新建專用空資料夾 `log-demo`。先在裡面建立 UTF-8 純文字 `minutes.log`，下列三行各是一筆已確認的非負整數分鐘。這個輸入規格故意簡單，空白行可略過，其他錯值不該悄悄當成 0。

```text
12
18
30
```

同一資料夾建立 `summary.py`。它只讀上述樣本，會在同資料夾寫入或更新 `summary.json`；不要把同名私人檔案放在這個練習目錄。不要將腳本命名為 `json.py`，以免遮住要匯入的標準模組。

```python
from pathlib import Path
import json

base = Path(__file__).resolve().parent
source = base / "minutes.log"
output = base / "summary.json"
lines = source.read_text(encoding="utf-8").splitlines()
values = [int(line) for line in lines if line.strip()]
if any(value < 0 for value in values):
    raise ValueError("minutes must be non-negative")
summary = {"count": len(values), "total_minutes": sum(values)}
output.write_text(json.dumps(summary, indent=2), encoding="utf-8")
loaded = json.loads(output.read_text(encoding="utf-8"))
print(type(loaded).__name__, type(loaded["total_minutes"]).__name__)
print(loaded["count"], loaded["total_minutes"])
```

在上層 `python-data` 用 PowerShell 執行 `py log-demo/summary.py`，macOS 或 Linux 則用 `python3 log-demo/summary.py`。從父目錄啟動正好能測路徑基準；摘要仍應出現在樣本旁。`any` 在這裡逐個檢查是否至少有一個負值；`raise` 表示資料不合格時停止，而不是留下貌似有效的新報表。之後在[〈Python 例外處理〉](#/lesson/fd-python-tools-02-errors)會細講如何回應這類錯誤。檔案寫入後重新讀回，應看到字典與整數的型別名稱，再看到 3 筆、共 60 分鐘。

## 常見錯誤

把數字用引號包成文字，就算整份檔仍是合法 JSON，讀回欄位也不再是整數。只看縮排漂亮不能證明資料可用，應真的讀回並核對型別與值。另一種誤判是第二次執行失敗，卻把前一次留在磁碟的摘要當成最新結果；看這次的結束狀態，並用一個已知的輸入改變去驗收。

## 小結

在日誌多加一行 6，重新執行後應得到 4 筆、66 分鐘。能從不同工作目錄得到同一個輸出位置，又能從磁碟讀回正確型別和新總數，這份摘要才算真的交付完成。
