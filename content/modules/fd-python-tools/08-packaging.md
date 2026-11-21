---
id: fd-python-tools-08-packaging
module: fd-python-tools
order: 8
title: Python 套件與建置
subtitle: 別的環境如何安裝自己的小工具
status: ready
minutes: 35
level: 2
prereqs:
  - fd-python-tools-07-fixtures
objectives:
  - 讀懂 pyproject.toml 的專案與建置欄位
  - 在獨立環境安裝本機成品並驗證匯入
tags:
  - python-tools
  - packaging
resources:
  - title: 'PyPA：封裝 Python 專案'
    url: 'https://packaging.python.org/en/latest/tutorials/packaging-projects/'
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: '讀專案結構、建置後端與成品；不用上傳。'
  - title: 'pip：為本機專案建置 wheel'
    url: 'https://pip.pypa.io/en/stable/cli/pip_wheel/'
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
    note: '對照本機目錄、輸出位置與 --no-deps 的含義。'
concepts:
  - id: fd-python-tools-packaging-metadata
    prompt: '專案資訊與建置後端在哪兩個區段說明？'
    answer: '[project] 說明名稱版本等資訊；[build-system] 指定後端及其建置需求。'
    mcq:
      question: '接手時想找輪子檔的發行版本，要讀哪裡？'
      options:
        - 'src 的資料夾名稱'
        - 'build-backend'
        - '[project] 的 version'
        - '練習環境的名稱'
      answer: 2
      explain: '後端說明如何建置，不代表產品本身的版本。'
  - id: fd-python-tools-packaging-wheel
    prompt: 'wheel 與原始碼資料夾的差別是什麼？'
    answer: 'wheel 是供安裝的既成版本，不會隨原始檔每次編輯自動更新。'
    mcq:
      question: '已裝 wheel 後只改 src 的函式，新的普通程序通常會用什麼？'
      options:
        - '永遠匯入最新原始碼'
        - '已安裝的成品版本'
        - '自動重新建置'
        - '不能再匯入'
      answer: 1
      explain: '一般安裝使用環境裡的檔案，不等同可編輯安裝。'
  - id: fd-python-tools-packaging-origin
    prompt: '如何排除匯入其實借到開發目錄的可能？'
    answer: '在全新環境安裝成品，以隔離模式執行，再查模組來源是不是該環境的套件目錄。'
    interview:
      question: '你會怎麼驗收交給別人的輪子檔？'
      points:
        - '使用乾淨環境只裝成品'
        - '用公開匯入名稱執行範例'
        - '核對結果和來源'
      answer: '我會把製作端和接收端分開，用乾淨環境安裝指定輪子，再匯入 minute_tool 驗算 7 分鐘。看到 420 還不夠，我也查模組路徑，排除誤讀開發目錄。'
practice:
  - id: fd-python-tools-packaging-lab
    title: '留下一份可離開原始碼使用的成品'
    kind: code
    minutes: 15
    steps:
      - '在 minute-package 建立兩個原始檔並做出 wheel。'
      - '在 .reader 安裝該檔，依範例檢查 7 分鐘及模組來源。'
      - '另存 delivery.txt，記錄發行版本、成品檔名與 3 分鐘的驗收結果。'
    checks:
      - 'wheels 中有 0.1.0 的輪子檔，3 分鐘驗算為 180。'
      - '來源在 .reader 的 site-packages，而非 src。'
---
## 為什麼要學
把一個資料夾傳給別人，對方在那個目錄裡可以匯入，換個位置卻失敗。這不代表安裝成功；Python 可能只是剛好從目前目錄找到原始碼。這堂做一個可安裝的本機成品，讓另一個全新環境取得它。不註冊帳號、不上傳，也不把自己的開發工具塞進成品。

## 核心概念
模組 (module) 是可匯入的程式單位，套件 (package) 可以將模組組成有名稱的結構。發行套件 (distribution package) 是安裝工具處理的單位，發行名稱可用連字號，匯入名稱在本例用底線。`pyproject.toml` 是描述專案的設定檔，不是要給 Python 逐行執行的程式。`[project]` 記發行名稱與版本；`[build-system]` 指定建置工具與後端，不是執行小工具時都要安裝的相依清單。

輪子檔 (wheel) 是已建置的安裝成品，副檔名為 `.whl`。本例的內容只有純 Python，所以產物不綁定特定桌面作業系統。放在 `src` 下的套件，不會因為站在專案根目錄就直接成為同名模組。驗收時再用另一支直譯器匯入，可以分開檢查「能否做出檔案」和「安裝後能否使用」。

## 範例：從 2 個原始檔到一次獨立匯入
在 `C:\dev\stackway-lab\python-tools` 下新建空資料夾 `minute-package`，以下都在這個新資料夾操作。用編輯器建立 `src/minute_tool/__init__.py`（一併建立中間資料夾），內容如下：

```python
def to_seconds(minutes):
    return minutes * 60
```

在新資料夾根目錄建立 `pyproject.toml`，不要放進 `src`。最後一節告訴後端去哪裡尋找套件。這個只做乘法的例子沒有用到需要指定小版本的語法；若要對外宣告最低支援版本，應先用該版本實測，而不是照抄開發機的版號：

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "stackway-minute-tool"
version = "0.1.0"

[tool.setuptools.packages.find]
where = ["src"]
```

在這個目錄的 PowerShell 建立製作端與使用端。建置時需要取得後端，第一次需要網路；使用端只安裝剛做好的本機檔案。

```powershell
py -m venv .maker
.\.maker\Scripts\python.exe -m pip wheel . --no-deps -w wheels
py -m venv .reader
.\.reader\Scripts\python.exe -m pip install --no-index .\wheels\stackway_minute_tool-0.1.0-py3-none-any.whl
.\.reader\Scripts\python.exe -I -c "import minute_tool; print(minute_tool.to_seconds(7)); print(minute_tool.__file__)"
```

macOS／Linux 在相同專案結構下使用：

```bash
python3 -m venv .maker
.maker/bin/python -m pip wheel . --no-deps -w wheels
python3 -m venv .reader
.reader/bin/python -m pip install --no-index ./wheels/stackway_minute_tool-0.1.0-py3-none-any.whl
.reader/bin/python -I -c "import minute_tool; print(minute_tool.to_seconds(7)); print(minute_tool.__file__)"
```

檢查兩個輸出：數字應為 420，來源則應在使用端環境的套件目錄，不在原始碼目錄。`-I` 使用隔離模式，可避免目前目錄剛巧提供同名模組。`--no-index` 讓安裝不去套件索引找東西；本例沒有額外執行相依，才可以只靠一個檔案完成這一步。別把這個結果推論成所有建置都能離線。

若要把這個成品交給同學，只需另附一個可驗算的例子，例如 2 分鐘應得到 120 秒。使用端不必取得你的製作端環境；這也是為何建置工具寫在建置區，而不列成使用者每次執行的需求。

## 常見錯誤
有成品卻匯入失敗，先核對安裝動作用的是不是使用端，以及匯入的是程式套件名而不是發行名稱。若發現使用端印出的是舊數字，要確認你是否只修改了原始碼，卻沒有重新建置並安裝新版本的成品。一般安裝不是持續連回開發資料夾的即時預覽。

## 小結
兩個原始檔、一個輪子檔、兩個分開的環境，就足以展示本機交付的完整路徑。把成品名稱、可驗算的輸出以及來源在安裝目錄這三項一起保存，比「我的電腦可以跑」更有說服力。
