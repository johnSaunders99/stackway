---
id: ai-cluster-03-slurm
module: ai-cluster
order: 4
title: Slurm 批次作業
subtitle: 讀懂一個批次工作的生命週期
status: ready
minutes: 35
level: 3
prereqs:
  - ai-cluster-02-queues
objectives:
  - 從提交參數推算所需節點與時間
  - 區分排隊、執行與已結束狀態
tags:
  - cluster
  - slurm
resources:
  - title: Slurm：sbatch 的資源與時間參數
    url: https://slurm.schedmd.com/sbatch.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: Slurm：作業狀態代碼
    url: https://slurm.schedmd.com/job_state_codes.html
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
  - title: Slurm：查詢已結束作業的帳務欄位
    url: https://slurm.schedmd.com/sacct.html
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-cluster-03-slurm-submit
    prompt: sbatch 回傳作業編號代表什麼？
    answer: 已收件，不一定取得資源。
    mcq:
      options:
        - 已收件，不一定取得資源
        - 已取得資源，只差用戶端顯示
        - 已啟動所有要求的任務
        - 已產生並驗證指定的訓練結果
      answer: 0
      explain: 收件與開始是兩個事件；作業可能仍在佇列。
  - id: ai-cluster-03-slurm-units
    prompt: 2 節點、每節點 2 張 GPU，時限 20 分鐘，預留上界為何？
    answer: 80 卡分鐘。
    mcq:
      options:
        - 20 卡分鐘
        - 80 卡分鐘
        - 40 卡分鐘
        - 160 卡分鐘
      answer: 1
      explain: 先得總卡數 4，再乘執行時限，無須再乘任務數。
  - id: ai-cluster-03-slurm-end
    prompt: 作業從 squeue 消失後，如何確認是否成功？
    answer: 查帳務終態、結束碼與結果檔。
    mcq:
      options:
        - 一離開佇列就視為成功
        - 只看輸出檔存在，不查內容和終態
        - 查帳務終態、結束碼與結果檔
        - 只看曾進入 RUNNING 就判為已完成
      answer: 2
      explain: 失敗與取消也會離開佇列；還要核對應用產物。
    interview:
      question: 同一份作業從提交到結束花了 19 分鐘，怎麼向使用者解釋？
      points:
        - 依狀態切出排隊與執行
        - 解讀預留上限
        - 核對終態及產物
      answer: 這份示意是排 12 分、跑 7 分。我不會把 20 分時限說成執行實績；會用作業編號查終態、輸出與卡配置，再決定要查排程或程式。
  - id: ai-cluster-03-slurm-task
    prompt: 要求 8 個 Slurm 任務，為什麼普通的 Python 呼叫未必執行 8 次？
    answer: 資源配置是允許執行工作的範圍，實際啟動要由作業步驟負責，例如以 srun 啟動要求的任務。
practice:
  - id: ai-cluster-03-slurm-p1
    title: 保存批次資源單和作業生命線
    minutes: 12
    kind: code
    steps:
      - 執行腳本並另存輸出的批次腳本區段
      - 在筆記分開寫申請上界、等待分鐘、執行分鐘、實際終態證據需求
    checks:
      - 批次腳本只保留到 srun hostname
      - 能得到 8 任務、4 卡、80 卡分鐘而未提交工作
---
## 為什麼要學：提交成功，只表示收到申請
研究叢集通常不讓所有人直接在登入節點開訓練。你先描述要幾台機器、每台要幾個工作與多久，等排程器給合適的資源。Slurm 把這份申請稱為批次作業（batch job）。取得作業編號只表示控制端收件，不是模型已載入，更不是檔案已寫好。

## 核心概念：申請、啟動與結束分 3 層
提交工具 `sbatch` 讀取批次腳本開頭的 `#SBATCH` 指示。節點（node）是主機，任務（task）是預定啟動的工作單位；申請任務數本身不會讓普通的 Python 呼叫自動變成多行程。在有資源配置的批次腳本中，通常用 `srun` 啟動作業步驟（job step）。不要把登入節點執行一次和分配後在各節點執行混為一談。

假設指定 2 個節點、每節點 4 個任務、每節點 2 張 GPU、時限 20 分鐘。這是 8 個任務、4 張卡、最多 80 卡分鐘的預留上界，不是每個任務 2 張。時限從作業執行計，不代表提交後 20 分鐘一定有結果；若程式需要一任務一卡，這份申請的任務對卡比例就值得先檢查。

## 範例：把資源單與狀態序列對起來
在 `C:\dev\stackway-lab\cluster` 新建 `slurm_ticket.py`。先挑出還在等候的工作，再說明哪個欄位給出等待理由；送出腳本不等於作業已取得節點。

在該目錄執行：Windows PowerShell 用 `py slurm_ticket.py`；macOS／Linux 用 `python3 slurm_ticket.py`。

```python
nodes, tasks, gpus, minutes = 2, 4, 2, 20
print(f"""#!/bin/bash
#SBATCH --nodes={nodes}
#SBATCH --ntasks-per-node={tasks}
#SBATCH --gpus-per-node={gpus}
#SBATCH --time=00:{minutes}:00
srun hostname""")
print("tasks, GPUs, GPU-min limit:", nodes*tasks, nodes*gpus, nodes*gpus*minutes)
for minute, state in [(0,"PENDING"),(12,"RUNNING"),(19,"COMPLETED")]:
    print(minute,state)
```

程式列出可保存的批次腳本內容及一組教學狀態。真正在有 Slurm 的站點上，要先核對站方允許的分區與 GPU 申請語法，再將列印出的腳本存為 LF 換行的 `hello.sbatch`。有提交權限才用 `sbatch hello.sbatch`；本機練習不提交、不占用配額。假想紀錄中作業排隊 12 分鐘，執行 7 分鐘，實際經過的時間和預留上界不同。

### 從同一張資源單讀出 3 種時間
第一種是排隊經過的牆上時間，使用者確實等了，但還沒取得那份運算配置。第二種是執行期間經過的時間。第三種是把同時配置的卡數乘上執行期間，得到這筆作業占用配置的卡分鐘。例子若整段執行都保有 4 張卡，就是 28 卡分鐘，而不是 80 卡分鐘；也不能說卡上的核心在這 28 卡分鐘裡一直滿載。若要回答「有多少時間真在算」，要另看裝置利用率或工作時間線，不能只讀批次腳本。

## 常見錯誤
從目前的佇列消失就判為成功。執行中可透過 `squeue` 看等待原因或執行狀態，結束後應查站方啟用的 `sacct` 帳務紀錄、作業結束碼與輸出檔。超過時限、記憶體不足、使用者取消都能讓作業消失，卻不是完成。即使狀態顯示成功，應用程式也可能沒產出預期內容，還要做結果檢查。

## 小結
交接留作業編號、要求的資源與時限、實際開始結束、終態及輸出證據。先把「等不到卡」和「取得卡後很慢」分開，才不會在排隊時調模型、在程式出錯時又無端調高配額。
