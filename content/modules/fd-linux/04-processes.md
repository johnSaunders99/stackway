---
id: fd-linux-04-processes
module: fd-linux
order: 4
title: 行程、PID 與訊號
subtitle: 讓自己的測試工作正常結束
status: ready
minutes: 30
level: 3
prereqs:
  - fd-linux-02-rights
objectives:
  - 從行程清單辨認自己啟動的工作
  - 比較正常結束、TERM 與強制中止的後果
tags:
  - linux
  - processes
resources:
  - title: Linux 手冊：訊號與預設處置
    url: https://man7.org/linux/man-pages/man7/signal.7.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 在訊號清單比對 TERM 與 KILL。
concepts:
  - id: fd-linux-04-processes-identity
    prompt: 同名的行程應如何區分這一次要處理的對象？
    answer: 啟動自己的背景工作後立即保留 $!，再以 PID、親代與程式名核對。
    mcq:
      question: 同時有三個 sleep，哪個判斷最可靠？
      options:
        - 當下取得的 $! 加上清單核對
        - 取舊筆記最小的 PID
        - 任選名稱相同的一列
        - 使用等待時間最長者
      answer: 0
      explain: 名稱會重複，舊 PID 也可能重用；啟動關係和當下快照可交叉確認。
    interview:
      question: 測試工作卡住，你會怎麼避免中斷其他人的程式？
      points:
        - 只使用自己啟動的識別碼
        - 比對 PPID 與程式名
        - 先正常請求結束並等待
      answer: 我不會照名字把整批都停掉。先核對剛啟動的編號和親代；若仍是那個測試工作才通知它結束，再用 wait 確認。對不上或已自然結束，就不再發訊號。
  - id: fd-linux-04-processes-signal
    prompt: TERM 與 KILL 在清理機會上有何差異？
    answer: 程式可以處理 TERM；KILL 不能被攔截來做清理。
    mcq:
      question: 需要讓程式有機會正常收尾時，不該把哪個動作當第一步？
      options:
        - 先讓工作自然完成
        - 確認工作身分
        - 對核對過的測試行程先用 TERM
        - 直接用 KILL 強制中止
      answer: 3
      explain: 強制中止不留給程式處理訊號的機會，並非較可靠的正常關閉。
  - id: fd-linux-04-processes-wait
    prompt: 成功送出訊號，如何進一步得知自己的子行程已結束？
    answer: 用 wait 等待該子行程，再立刻讀它交回的狀態。
    mcq:
      question: kill 成功返回但還沒 wait，已能確定哪件事？
      options:
        - 資料寫入一定完成
        - 工作已正常回傳 0
        - 訊號已成功送出
        - 所有同名工作都停止
      answer: 2
      explain: 送出通知和對方完成收尾是兩個不同時點。
practice:
  - id: fd-linux-04-processes-p1
    title: 留下自然結束與提早結束的 2 列觀察
    kind: hands-on
    minutes: 12
    steps:
      - 依課文建立短與長兩個自有工作
      - 先核對長工作的 PID 與 PPID，再通知並等待
      - 留一張有工作關係及退出碼的紀錄，無 Linux 則標明為推演
    checks:
      - 自然完成為 0，遭 TERM 的測試是非零
      - 紀錄能解釋為何不拿昨天的 PID 當今天的對象
---

## 為什麼要學：要停止的是哪一份工作？
開了好幾個終端機後，一個測試程式還在背景跑。只憑檔名中止「所有同名程式」，可能把旁邊正在使用的工作一起中斷。這堂不碰任何既有程式，只在自己的分頁啟動一個不寫檔的小工作，像拿取號牌一樣留住它的編號，再用清單讀回身分。先能找對一份，才談怎麼結束它。

## 核心概念：名稱描述程式，編號識別這一次執行
執行中的程式實例稱為行程（process），系統給它一個行程識別碼（process ID，PID）。同一個程式可以同時啟動多次，每個實例有自己的編號。編號日後可能被重新使用，因此昨天抄到的數字不是今天的授權，也不是永久身分。Bash 在命令後看到 `&`，會把工作放到背景，讓你在同一個分頁繼續輸入；`$!` 表示剛剛啟動的那一個背景工作的識別碼。

訊號（signal）是傳給行程的通知，不是往它的鍵盤輸入一個字。正常完成讓程式自己走完；終止訊號（TERM）則要求提早結束，程式有機會處理、清理資源或延後結束，並非保證已經存檔。強制中止（KILL）不能由程式攔截清理。兩者可能都讓名字消失，對寫到一半的檔案卻有完全不同的風險。

## 範例：在自己的分頁做 2 次計時
Windows 使用已授權的 WSL Ubuntu Bash；原生 Linux 在 Bash 任意練習目錄即可。先把 `sleep` 當一個只會等待指定秒數的小工作。下面只等自己的子行程，`wait` 會讓 shell 等到它結束，`$?` 讀出上一個指令的退出碼（exit status，之後在[〈Shell 腳本與退出碼〉](#/lesson/fd-linux-04-script)會細講）。

```bash
sleep 1 &
short=$!
wait "$short"
printf 'natural=%s\n' "$?"
```

接著給自己充裕的檢查時間。`ps` 查快照，`-p` 限定編號，`-o` 選出要看的欄位。親代編號（PPID）應與 `echo "$$"` 顯示的目前 Bash 編號相同，程式欄應是 sleep。核對成功才執行最後一段；若已經過了 120 秒、工作先結束，就重新從建立工作開始，不要拿舊編號測試。

```bash
sleep 120 &
job=$!
printf 'shell=%s child=%s\n' "$$" "$job"
ps -p "$job" -o pid,ppid,comm
```

```bash
if [[ $(ps -p "$job" -o ppid= | tr -d ' ') == "$$" && $(ps -p "$job" -o comm=) == sleep ]]; then
  kill -TERM "$job"
  wait "$job"
  printf 'interrupted=%s\n' "$?"
fi
```

第一段正常等待應是 0；第二次若在等待期間受到 TERM，Bash 的 `wait` 會交回非零值。這不是 sleep 算錯時間，而是終止原因不同。沒有 Linux 可用時，畫一張小圖：Bash 啟動兩個 sleep，替它們填不同編號與共同親代，在被中斷的那一個旁標「非零，受訊號結束」即可。

## 常見錯誤
看到清單裡有 sleep 就任選一列，或跳過正常通知直接用最強的訊號。第一次查不到可能只是工作已自然結束，不代表你需要更多權限。還有一個容易看錯的地方：成功送出通知，並不等於對方已經停止；等待該子行程的結果才是本例的結束證據。

先把子行程與啟動它的 shell 分開標記，再核對訊號的目標；不要用一串相似的程式名稱代替確認。

## 小結
紀錄中留「我如何知道是自己的工作」與「我如何知道它已結束」兩行。前者靠啟動時取得的編號與清單交叉確認，後者靠等待結果；兩種證據不能互相取代。
