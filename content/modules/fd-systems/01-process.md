---
id: fd-systems-01-process
module: fd-systems
order: 1
title: 程式、行程與執行緒
subtitle: 開兩次程式是同一份狀態嗎
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 區分程式檔與執行中的行程
  - 在工作管理員觀察兩個實例
tags:
  - systems
  - process
resources:
  - title: "Windows：行程與執行緒"
    url: https://learn.microsoft.com/en-us/windows/win32/procthread/about-processes-and-threads
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-systems-01-process-instance
    prompt: "同時啟動同一份程式兩次，通常會產生什麼？"
    answer: "磁碟上可以只有一份程式碼，作業系統卻建立兩個各自執行的行程。"
    mcq:
      options:
        - "各自多一份磁碟上的程式檔"
        - "同一個行程的兩個變數"
        - "自動共用的計數器"
        - "兩個各有狀態的行程"
      answer: 3
      explain: "程式檔是指令的來源；執行次數不是檔案數，也不代表變數相通。"
  - id: fd-systems-01-process-pid
    prompt: "在工作管理員應用什麼來分辨同名行程？"
    answer: "比對仍在執行的行程識別碼，而不是只看名稱。"
    mcq:
      options:
        - "副檔名"
        - "程式圖示"
        - "PID"
        - "資料夾名稱"
      answer: 2
      explain: "同一支直譯器可有相同名稱與位置；同一時間的 PID 能把實例分開。"
    interview:
      question: "有人說關掉其中一個計數器會清空另一個。你會怎麼驗證？"
      points:
        - "同時啟動並記錄兩個 PID"
        - "只修改其中一份狀態"
        - "正常結束其中一個再觀察另一個"
      answer: "我會在兩個分頁啟動相同腳本。先確認 PID 不同，只在左邊加兩次，再關掉左邊。右邊若仍能從自己的值繼續，就有證據說明這兩份狀態沒有綁在一起。"
  - id: fd-systems-01-process-thread
    prompt: "同一行程內的執行緒通常共享什麼？"
    answer: "共享行程的位址空間，各自保有目前執行的位置與呼叫堆疊。"
    mcq:
      options:
        - "同一個呼叫堆疊"
        - "行程中的記憶體"
        - "唯一且相同的執行位置"
        - "每次函式呼叫的區域變數"
      answer: 1
      explain: "共享資料不等於每條執行路徑走到同一行。"
practice:
  - id: fd-systems-01-process-lab
    title: "留下兩個實例的觀察紀錄"
    kind: hands-on
    minutes: 10
    steps:
      - "儲存並在兩個終端機分頁執行正文的 counter.py。"
      - "在工作管理員的詳細資料對照兩個 PID，只在左邊按兩次 Enter。"
      - "在左邊輸入 q，回到右邊按 Enter，把前後結果寫入 process-notes.txt。"
    checks:
      - "我記得的是同時存在的兩個不同 PID，不是兩個分頁名稱。"
      - "左邊到 2 後結束；右邊第一次增加仍是 1。"
---

## 為什麼要學：同一份程式，誰記得哪個數字？

在終端機開一個計數器，每按一下就加 1。假如再開一個，第二個該從 0 開始，還是接著第一個的數字往上走？先別看程式名稱。磁碟上的程式（program）是一份指令；行程（process）是作業系統替這些指令安排的一次執行。前者回答「要怎麼做」，後者才回答「現在做到哪裡」。

## 核心概念：先找容器，再找執行路徑

啟動 Python 腳本時，是直譯器讀取你的檔案並執行。作業系統替這個行程準備記憶體與可使用的資源，也給一個行程識別碼（process ID，PID）。同一時間活著的行程可以用這個號碼區分；結束之後號碼有機會被重用，不能拿昨天的號碼辨認今天的工作。

執行緒（thread）則是行程內可以被排程執行的一條路徑。想像一個工作室裡的人各有一本記錄目前步驟的筆記，卻共用一張放工具的桌子。同一行程的執行緒可以看到共享的物件，但各有自己的呼叫堆疊，也就是手上還沒做完的函式。共用桌面會發生什麼差錯，之後在[〈共享狀態與競爭條件〉](#/lesson/fd-systems-03-threads)會細講。

## 範例：用 2 個分頁比對，而不是猜

在 `C:\dev\stackway-lab` 的新資料夾 `systems` 建立 `counter.py`。在該資料夾開啟 PowerShell，輸入 `py counter.py`；macOS 或 Linux 在同一練習資料夾用 `python3 counter.py`。

```python
import os

count = 0
print("PID:", os.getpid(), "count:", count)
while input("Enter: +1, q: quit > ") != "q":
    count += 1
    print(count)
```

先留著第一個分頁，在第二個分頁從同一個資料夾啟動相同指令。兩邊都印出 0。按下 Ctrl、Shift 和 Esc 開啟 Windows 工作管理員，在「詳細資料」用 PID 找到這兩列。名稱可能都是 Python，但號碼不同。左邊按幾次 Enter，右邊仍停在等待輸入；現在讓右邊也加一次，它會印出自己的第一個數字。這個觀察比單看兩個視窗更有說服力。

### 再做一次有方向的預測

左邊輸入 `q` 後，先猜磁碟上的腳本、工作管理員的那一列、右邊的計數各會怎樣。腳本仍在，否則無法從同一路徑再開；那一列會消失，因為這次工作已結束；右邊的計數並沒有被重設。若希望新開視窗也能接著數，就得刻意把值寫到可共享的位置，光是讓變數同名不夠。

如果第二個分頁只開了終端機，卻還沒有執行腳本，它就不是第二次計數實驗。先看到新的識別碼，再開始比數字，才能排除只是切換視窗的誤判。

## 常見錯誤

終端機分頁承載的是操作介面，不等於要找的行程。看到工作管理員將多列摺疊成一團，請切到詳細資料比對腳本印出的號碼，不要為了尋找腳本去強制結束其他工作。同樣地，只啟動一次後輪流輸入兩個數字，測到的是同一份狀態，不能用來推論不同實例。

## 小結

要找檔案，看路徑；要找這次執行，看目前的 PID；要解釋同一份記憶體裡如何同時做事，再談執行緒。把這三種問題分開，下一堂[〈記憶體與生命週期〉](#/lesson/fd-systems-02-memory)追查記憶體才知道正在量哪個對象。
