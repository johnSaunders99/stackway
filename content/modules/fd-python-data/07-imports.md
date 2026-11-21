---
id: fd-python-data-07-imports
module: fd-python-data
order: 7
title: 模組與 import
subtitle: 讓兩份程式共用同一個函式
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-data-06-sort
objectives:
  - 將純函式放進可匯入的模組
  - 區分直接執行與被匯入時的行為
tags:
  - python-data
  - imports
resources:
  - title: Python 教學：模組
    url: https://docs.python.org/zh-tw/3/tutorial/modules.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-data-07-import
    prompt: "相鄰檔案 trail_units.py 應如何以模組名匯入？"
    answer: "用 import trail_units，不含副檔名。"
    mcq:
      question: "同層有 trail_units.py，哪個寫法載入整個模組並保留 trail_units.hours 的呼叫方式？"
      options:
        - "import trail_units.py"
        - "from trail_units import hours"
        - "from hours import trail_units"
        - "import trail_units"
      answer: 3
      explain: "檔案的副檔名不是匯入名稱的一部分。"
    interview:
      question: "匯入共用工具後報表多了一行示範，你會怎麼修？"
      points:
        - "查模組頂層動作"
        - "將示範放在入口判斷內"
        - "測直接執行與匯入"
      answer: "我會找匯入時就執行的列印，把示範移到入口判斷裡，公式仍只回傳數值。再跑三次：直接執行有示範、報表有 2 行、單純匯入沒有輸出。"
  - id: fd-python-data-07-guard
    prompt: "想讓示範只在直接執行時列印，條件要檢查什麼？"
    answer: "檢查 __name__ 是否等於 \"__main__\"。"
    mcq:
      question: "要區分模組是直接執行還是被匯入，示範列印外應檢查什麼？"
      options:
        - "__name__ 是否為腳本完整路徑"
        - "函式是否有回傳數值"
        - "__name__ 是否為 __main__"
        - "工作目錄是否與腳本同層"
      answer: 2
      explain: "直接執行的模組有特別的入口名稱，被匯入的模組則用模組名。"
  - id: fd-python-data-07-pure
    prompt: "共用的 hours 不直接列印有什麼好處？"
    answer: "呼叫者可自行決定要顯示、比較或繼續計算回傳值。"
    mcq:
      question: "回傳時數而非直接印出的設計目的為何？"
      options:
        - "保證所有輸入都合法"
        - "讓各呼叫者自行使用結果"
        - "使匯入完全不執行頂層"
        - "讓變數都成為全域"
      answer: 1
      explain: "計算與呈現分離，並不自動帶來輸入驗證。"
practice:
  - id: fd-python-data-07-p1
    title: "交付安靜可重用的時數模組"
    kind: code
    minutes: 14
    steps:
      - "將兩份檔案放在同一個 unit-demo 資料夾。"
      - "分別直接執行模組、執行報表、只匯入模組。"
      - "把三次的輸出行數和時數留在練習筆記。"
    checks:
      - "模組直接執行只有 1 行 demo。"
      - "報表正好 2 行 report。"
      - "只匯入時 0 行，沒有額外套件需求。"
---

## 為什麼要學

命令列報表和小測驗都要把分鐘換成小時。把同一行公式抄進兩支程式，第一次似乎最快；等規則要修正，你得記得每個副本在哪裡。模組（module）讓一份程式可以被別的程式匯入使用。這堂不安裝套件、不設定特殊搜尋路徑，只用相鄰的兩個檔案，就能把「計算」與「決定何時顯示結果」分給不同角色。

## 核心概念

一個普通的 `.py` 檔就可以是模組。`import trail_units` 依模組名稱找並載入程式，名稱不加副檔名；之後用 `trail_units.hours(...)` 從模組取出函式。點號左邊回答「在哪個模組」，右邊才是「用哪個功能」。這樣即使不同模組都有一個叫時數的函式，讀者仍有線索知道現在用的是哪一個。

純函式（pure function）在本例只依收到的分鐘算出時數並回傳，不自行印出、不讀外部檔案，也不改呼叫者的資料。把顯示留給外側，就能讓報表選擇印字，小測驗則只比較數值。第一次匯入時，模組頂層的程式會被執行，並非只抄走函式而略過其他行；同一個行程內一般再次匯入會使用已載入的模組。若把示範用的列印直接寫在頂層，報表可能一開頭就多出一行不屬於它的文字。

## 範例：同一份公式提供 2 個入口

在 `C:\dev\stackway-lab\python-data` 中新建 `unit-demo` 資料夾。先把下列程式存成其中的 `trail_units.py`。特殊名稱 `__name__` 在直接執行此檔時等於 `"__main__"`，被別的檔案以模組名匯入時則不是。用一個條件把示範列印包住，就能兩種用途都保留。

```python
def hours(minutes):
    return minutes / 60

if __name__ == "__main__":
    print("demo", hours(30))
```

同一資料夾另存 `report.py`，內容如下。這裡刻意讓報表自行選標籤和兩筆輸入；共用模組不需要知道外側報表的格式，也不需要反過來匯入報表。

```python
import trail_units

for minutes in [45, 90]:
    print("report", minutes, trail_units.hours(minutes))
```

在 `unit-demo` 開 PowerShell，依序執行：

```powershell
py trail_units.py
py report.py
```

macOS 或 Linux 在相同目錄用 `python3 trail_units.py` 與 `python3 report.py`。第一次是直接入口，應只印一行半小時的示範。第二次是報表，應只有 2 行，時數分別為 0.75 與 1.5，不應先插入示範。再於同一終端機執行 `py -c "import trail_units"`（其他系統將前半改為 `python3`），單純載入模組應安靜結束。這個空輸出本身就是要驗證的行為，不是測試漏跑。

## 常見錯誤

把檔名也寫進匯入名稱，或把兩份檔案存到外觀相近的不同資料夾，就會產生找不到模組的問題；先核對實際檔名與位置，不要先裝一個名字相似的網路套件。也別把自己的檔案命名成常用標準模組，否則你後來要匯入工具時，可能載入自己那份同名程式。下一堂[〈標準函式庫與路徑〉](#/lesson/fd-python-data-08-stdlib)會直接用到這項習慣。

把呼叫檔和被匯入的檔案角色互換看看：哪一份負責啟動工作，哪一份應能安靜地提供函式？

## 小結

計算只回傳，入口才決定什麼時候顯示。保留兩個檔案和三種執行結果：直接執行、被報表呼叫、單獨匯入。三者區分開來，公式才能被其他程式安心重用。
