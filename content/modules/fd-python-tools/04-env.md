---
id: fd-python-tools-01-env
module: fd-python-tools
order: 4
title: venv 與 pip 隔離環境
subtitle: 隔開每個專案的相依套件
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-tools-03-breakpoint
objectives:
  - 建立虛擬環境並辨認直譯器路徑
  - 列出重建環境所需的資訊
tags:
  - python-tools
  - venv
resources:
  - title: 'Python 教學：虛擬環境與套件'
    url: 'https://docs.python.org/zh-tw/3/tutorial/venv.html'
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: '讀建立環境、列出套件與重建需求清單。'
concepts:
  - id: fd-python-tools-env-target
    prompt: '為什麼用環境內的 python -m pip？'
    answer: '由該直譯器執行其 pip，可清楚指定查詢或安裝的目標環境。'
    mcq:
      question: '尚未啟用環境，哪種查詢仍能鎖定它？'
      options:
        - '直接執行任一個 pip'
        - '用基礎安裝的 python -m pip list'
        - '以環境內的 python 執行 -m pip list'
        - '切進專案後直接打 pip list'
      answer: 2
      explain: '指定執行檔即可，不需要先改終端機的搜尋順序。'
  - id: fd-python-tools-env-proof
    prompt: '怎樣確認腳本用的是剛建立的環境？'
    answer: '看 sys.executable 指向哪個環境，並核對前綴與基礎前綴不同。'
    mcq:
      question: '哪個線索最直接顯示目前跑的是哪支 Python？'
      options:
        - '正在編輯的腳本路徑'
        - 'sys.executable'
        - '終端機目前的工作目錄'
        - 'requirements.txt 的儲存位置'
      answer: 1
      explain: '腳本、工作目錄和需求檔可以不變，執行它們的直譯器卻可能不同。'
  - id: fd-python-tools-env-rebuild
    prompt: '另一台電腦重建應保留哪些資訊？'
    answer: '保留 Python 版本、相依套件的版本與安裝步驟，不搬移整個虛擬環境。'
    interview:
      question: '同事拿到需求檔還是跑不起來，你會先對照什麼？'
      points:
        - '分開查 Python 與套件版本'
        - '確認安裝和執行用同一環境'
        - '從新環境重建'
      answer: '我會先對照 Python 版本，再核對執行檔與 pip 的位置。需求檔描述套件，不指定直譯器。我用相同版本建新環境並在裡面裝需求，而不是直接複製舊環境。'
practice:
  - id: fd-python-tools-env-lab
    title: '留下一份環境收據'
    kind: code
    minutes: 10
    steps:
      - '在 python-tools 練習資料夾依範例建立 .venv 與兩個文字檔。'
      - '讀取 python-version.txt，與 pip 顯示的 Python 主次版本比對。'
      - '加一份 env-note.txt，記錄辨識環境的兩個線索，不寫個人路徑。'
    checks:
      - '版本檔顯示你安裝的 Python 3 版本，前綴比較為 True。'
      - '能解釋全新環境的 requirements.txt 為什麼可能沒有內容。'
---
## 為什麼要學
同一台電腦上，一個工具需要舊套件，另一個工具要試新版。若把套件都裝到同一份 Python，一次更新就可能同時影響兩邊。虛擬環境 (virtual environment) 是專案自己使用的一組直譯器入口和套件目錄。今天先不下載任何套件，只用路徑和一份可保存的清單，證明你知道自己正在操作哪一個環境。

## 核心概念
若 `py --version` 本身就失敗，先回到[〈Windows 安裝 Python〉](#/lesson/fd-python-01-interpreter)；虛擬環境是在已有直譯器後才建立。`venv` 是建立環境的標準模組；`pip` 是安裝與查詢 Python 套件的工具。`python -m` 的意思是請指定的直譯器執行某個模組，所以「環境裡的 Python 加上 `-m pip`」比只打一個 `pip` 更能交代裝到哪裡。啟用環境只是讓終端機優先找到它的指令，並非建立隔離的必要步驟。本堂直接指定環境內的執行檔，不必修改 PowerShell 的執行原則。

專案原始碼留在環境資料夾外。可以把環境想成可重建的工具箱，而不是用來交接的作品；它可能含有指向這台機器的路徑。要讓另一台電腦重現，至少要記錄 Python 版本、專案需要的套件版本以及安裝步驟。`pip list` 適合查看當下有什麼，`pip freeze` 則輸出可供安裝工具讀取的需求格式，預設可能略過建置工具。之後在[〈pytest 斷言與例外測試〉](#/lesson/fd-python-tools-04-tests)會真的把測試套件裝進這個環境。

## 範例：從執行檔和套件位置認出工具箱
沿用 `C:\dev\stackway-lab\python-tools` 練習資料夾；若是從這堂開始，就先建立並開啟它。以下 PowerShell 全部在該資料夾執行；`.venv` 是新環境名稱，不要選到既有專案的環境。最後兩行會留下兩個小文字檔，這次只在自己的練習資料夾使用這些檔名。

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -c "import sys; print(sys.executable); print(sys.prefix != sys.base_prefix)"
.\.venv\Scripts\python.exe -m pip --version
.\.venv\Scripts\python.exe -m pip list
.\.venv\Scripts\python.exe --version | Out-File -Encoding ascii python-version.txt
.\.venv\Scripts\python.exe -m pip freeze | Out-File -Encoding ascii requirements.txt
```

macOS／Linux 在自己的空練習資料夾，用相同概念操作：

```bash
python3 -m venv .venv
.venv/bin/python -c "import sys; print(sys.executable); print(sys.prefix != sys.base_prefix)"
.venv/bin/python -m pip --version
.venv/bin/python -m pip list
.venv/bin/python --version > python-version.txt
.venv/bin/python -m pip freeze > requirements.txt
```

先看兩個互相獨立的線索：印出的執行檔在新環境內，套件工具回報的位置也指向它。真假值為真表示目前環境前綴不同於基礎安裝。即使需求檔是空白，也不等於沒有建立成功；全新環境裡可能只有預設略過的工具。若日後安裝了實際相依套件，務必再產生一次需求清單，否則交接的是昨天的環境。

一份需求檔最好隨著真正用到的套件更新，不必為了讓檔案看起來有內容而安裝無關工具。全新專案沒有額外需求，本來就是可以重現的狀態。

## 常見錯誤
不要把環境資料夾整包複製給別人，也別把「提示字元前有環境名稱」當作唯一證明。若編輯器找不到剛安裝的套件，先比對編輯器選定的直譯器路徑與終端機印出的路徑。重建時先使用記錄的版本建立新環境，再用新環境的 Python 執行 `-m pip install -r requirements.txt`；需求檔記套件，不會替你安裝對應版本的 Python。

## 小結
能交接的不是自己機器上的絕對路徑，而是可重做的步驟。保留版本與需求清單，用執行檔路徑確認操作目標；做到這兩件事，就不需要靠反覆安裝或調整整台電腦來猜問題。
