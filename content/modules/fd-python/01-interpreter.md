---
id: fd-python-01-interpreter
module: fd-python
order: 1
title: Windows 安裝 Python
subtitle: 在 Windows 找到能執行的 Python
status: ready
minutes: 30
level: 2
prereqs: []
objectives:
  - 從 python.org 辨識 Windows 安裝方式，用 py 確認實際啟動的版本
  - 從官方 Windows 說明確認可用的直譯器與啟動方式
  - 用版本輸出辨別實際啟動的 Python，而不是商店捷徑
tags:
  - python
  - interpreter
resources:
  - title: "Python 官方文件：Windows 安裝與疑難排解"
    url: https://docs.python.org/3/using/windows.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: "先看安裝管理員，再看 py 找不到時的診斷。"
  - title: "Python 官方網站：Windows 下載"
    url: https://www.python.org/downloads/windows/
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
    note: "找 Python install manager，不選嵌入式套件。"
concepts:
  - id: fd-python-01-interpreter-layers
    prompt: "安裝管理員與直譯器各做什麼？"
    answer: "前者取得與選擇執行環境，後者真正讀取並執行程式；開到下載頁不代表已能執行。"
    mcq:
      question: "哪個現象直接證明有直譯器完成工作？"
      options:
        - "瀏覽器顯示下載清單"
        - "一行指定的 Python 程式印出預期文字"
        - "開始選單有商店圖示"
        - "硬碟上有安裝檔"
      answer: 1
      explain: "下載、圖示與安裝檔都是入口，沒有實際執行程式。"
  - id: fd-python-01-interpreter-version
    prompt: "怎麼確認 py 選到的版本？"
    answer: "在新的 PowerShell 執行 py --version，再用同一入口執行短程式；記錄實際版本而不是網頁版本。"
    mcq:
      question: "官網標題和 py --version 不同，何者代表此刻執行的版本？"
      options:
        - "教學頁標題"
        - "最新下載的檔名"
        - "這次 py --version 印出的版本"
        - "上次開啟商店的日期"
      answer: 2
      explain: "線上文件和本機環境可以不同；使用哪個入口也會影響選到的版本。"
    interview:
      question: "同事說 Python 裝好了，你會保留哪兩個能複查的證據？"
      points:
        - "記錄實際使用的入口與版本"
        - "從同一入口執行已知程式"
        - "區分商店頁與執行結果"
      answer: "我會在新的 PowerShell 記下 py --version，接著用 py 跑一行會印出 ready 的程式。兩個結果能一起對照；只有下載畫面或捷徑，我還不會說這台已跑過 Python。"
  - id: fd-python-01-interpreter-shortcut
    prompt: "打 python 跳出商店就表示 Python 已經執行了嗎？"
    answer: "不一定。捷徑可能只導向安裝頁，應用已知入口核對版本與一行程式的輸出。"
practice:
  - id: fd-python-01-interpreter-p1
    title: "做一張不含私人路徑的環境卡"
    kind: hands-on
    minutes: 10
    steps:
      - "先查是否已有可用 Python 3，沒有才依官方管理員流程安裝。"
      - "執行課文的兩個檢查，在紙上記下入口、版號與短程式輸出。"
      - "關閉再開 PowerShell，用同一入口重做。"
    checks:
      - "兩次均有實際的 Python 3 版本和 ready，而不是只有商店畫面。"
      - "環境卡不含使用者資料夾名稱。"
---

## 為什麼要學：先確認誰在跑程式

同一台電腦可以有不同版本的 Python。你在瀏覽器看的是最新教學，隔壁的終端機跑的卻可能是先前裝過的版本。本堂的終點不是「我點過安裝」，而是下次打開新視窗，仍能用同一個入口讓電腦印出指定的字。若電腦本來就能做到，不需要重裝，更不要先移除舊環境。

## 核心概念：入口不是引擎

直譯器（interpreter）讀取 Python 程式並執行。Windows 上的 `py` 是用來啟動或選擇 Python 的入口；現行官方也提供安裝管理員（Python install manager），可用它取得執行環境。先在一般 PowerShell 輸入 `py --version`。若已有可用的 Python 3，就先做下方的短程式檢查；若電腦尚未裝執行環境，某些管理員設定可能會先提示或開始取得預設版本。

需要安裝時，從下方官方 Windows 下載頁選 Python install manager，依畫面安裝；不要挑名稱含 embeddable 的壓縮包，那是給其他應用程式內嵌用的。安裝管理員後重開終端機，新版管理員的 `py list` 可以列出已安裝的環境。若清單沒有一般用途的 Python 3，可用管理員的 `py install 3` 取得相符的版本，再核對實際結果。下載和安裝需要網路及本機允許；受管理的電腦若不許安裝，就先記錄缺哪一步，別自行提高權限。

## 範例：用同一個入口做 2 種檢查

在 Windows 的一般 PowerShell、任意目錄逐行輸入，不必先建立程式檔。第一行要版本資訊；第二行的 `-c` 告訴直譯器，直接執行後面引號內的一小段程式。`print` 把括號裡的內容顯示出來；之後在[〈Python 值與型別〉](#/lesson/fd-python-02-values)會細講引號內外的差別。

```powershell
py --version
py -c "print('ready')"
```

記下第一行實際印出的完整版本，以及第二行單獨出現的 `ready`。關閉視窗再打開重試。若你本來就在 macOS 或 Linux 且已安裝 Python 3，在當地終端機將這兩行的 `py` 換成 `python3` 即可；不需要找 Windows 安裝管理員。

若畫面只剩三個大於符號，你在的是 Python 的互動模式（interactive mode）：每打一行 Python 就執行一行。輸入 `exit()` 回到 PowerShell，再做版本檢查；不要把終端機啟動指令打進 Python。辨認輸入要交給誰，比一直重開機更快找到問題。

## 常見錯誤：看到商店或清單，就以為跑成功了

打 `python` 打開商店，可能碰到的是系統的啟動別名，不能作為版本證明。若舊的 `py` 能跑程式卻把 `list` 當成檔名，可能是舊式啟動器，不是新版管理員。先保留已可工作的入口，查官方 Windows 疑難排解，別為了讓兩台機器的畫面一樣就隨意調整系統路徑。

## 小結：留下能重做的環境卡

寫下「我用了哪個入口、它回報什麼版本、我的測試印出什麼」。把預期與實際版本並列，比抄官網上的版本號更能定位差異。不用把整個終端機截圖傳給別人，也不用抄使用者資料夾的位置。有這張卡，之後若程式沒反應，你能先分辨是啟動環境的問題，還是新寫的程式需要修正。
