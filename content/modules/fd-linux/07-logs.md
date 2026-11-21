---
id: fd-linux-03-logs
module: fd-linux
order: 7
title: 文字紀錄與管線篩選
subtitle: 從文字紀錄縮小問題
status: ready
minutes: 30
level: 3
prereqs:
  - fd-linux-06-packages
objectives:
  - 以管線篩出指定時間的訊息
  - 保留原始紀錄與篩選結果
tags:
  - linux
  - logs
resources:
  - title: MIT Missing Semester：串接程式
    url: https://missing.csail.mit.edu/2020/course-shell/
    kind: course
    lang: en
    minutes: 6
    required: false
    checked: "2026-11-20"
    note: 看管線與重新導向的分工。
concepts:
  - id: fd-linux-03-logs-pipe
    prompt: 管線把上一個程式的哪一份資料交給下一個？
    answer: 預設把標準輸出交給下一個程式的標準輸入。
    mcq:
      question: grep 選完時段再接 awk，awk 收到什麼？
      options:
        - 原檔路徑字串而已
        - 所有終端機畫面與錯誤
        - 已被刪掉的行
        - 符合時段的那些行
      answer: 3
      explain: 管線傳選出的文字資料，不等於連診斷訊息與檔案名稱都傳遞。
  - id: fd-linux-03-logs-field
    prompt: 為何不直接搜尋含有 ERROR 的所有列？
    answer: 事件描述也可能含這個字；要比對紀錄格式指定的程度欄。
    mcq:
      question: 09:01 INFO job=ERROR-review 應被哪一條規則排除？
      options:
        - 時間必須是上午
        - 檔名必須含 ERROR
        - 第三欄必須等於 ERROR
        - 只保留出現 ERROR 的列
      answer: 2
      explain: 時間在範圍內且文字含 ERROR，唯有比較正確欄位能排除假陽性。
    interview:
      question: 同事說上午有 2 個錯誤，你怎麼驗證是否多算？
      points:
        - 限定日期時段
        - 比對程度欄
        - 用反例與原始列驗證
      answer: 我先確認同一時區與日期，保留原檔，再把上午的行拿出來核對程度欄。事件名裡有 ERROR 但程度為 INFO 的不能算，我會附上規則和唯一符合的原始列。
  - id: fd-linux-03-logs-output
    prompt: 把結果轉向原始檔本身有什麼風險？
    answer: shell 可能先截短目標，尚未讀完就破壞原始紀錄。
    mcq:
      question: 調查後需要別人能重新套用其他規則，應保留什麼？
      options:
        - 只留下結果並覆寫原檔
        - 原始檔、獨立結果檔與篩選條件
        - 只留下行數
        - 把原始檔空白行全部刪掉再稱作原檔
      answer: 1
      explain: 完整原始資料與規則才能重做和改問別的問題。
practice:
  - id: fd-linux-03-logs-p1
    title: 交出早晨錯誤的篩選證據
    kind: hands-on
    minutes: 13
    steps:
      - 建立含 4 筆樣本的 events.log
      - 先按日期小時、再按程度欄篩選成另一個檔案
      - 無 Bash 則手動抄錄原樣本並另寫結果
    checks:
      - 原始 4 行、第一道 2 行、結果 1 行
      - 結果是 09:04 的 export，未收 INFO 或隔日同時刻
---

## 為什麼要學：有錯誤訊息，不一定在調查時段
練習服務上午 9 點出現問題，你從整天的紀錄裡搜尋錯誤，得到下午另一個工作留下的一串訊息。這些行都是真的，但回答的不是原本的問題。先把問題改寫成可以比對的條件：「同一日、同一個時區、09:00 到 09:59、嚴重程度欄等於 ERROR。」你就能用很小的測試資料驗證方法，而不用搬出可能包含敏感資訊的真實紀錄。

## 核心概念：每個工具只做一道篩選
文字紀錄（log）在本例採用一行一筆，欄位依序是日期、時間、程度與事件。管線（pipeline）把左邊程式的標準輸出（standard output）交給右邊的標準輸入（standard input），資料原本在哪個檔案並不影響傳遞方式。`grep` 會保留符合模式的整行；第一道限定開頭的日期與小時，第二道再判斷程度。兩道都通過，才會出現在結果。

重新導向（redirection）的 `>` 把最後輸出寫進檔案，不是把所有畫面含診斷訊息都存下來。它通常會先開啟並截短目標檔案，因此結果必須用**不同的檔名**。從唯一的原始檔讀取，又重導回同一個原始檔，可能連第一行都還沒處理就覆蓋證據。本課讓原檔保持不動，讓另一人可以重跑同一條判斷。

## 範例：找出早上那一筆真正的錯誤
Windows 先建立 `C:\dev\stackway-lab\linux`，從 WSL Bash 用 `cd /mnt/c/dev/stackway-lab/linux` 進入；若切換失敗先停下來。原生 Linux 或 macOS 請切到自己練習區的 `linux` 子目錄。

Windows 從既有的 WSL Ubuntu 進 Bash，macOS 或 Linux 可直接開 Bash。下段先建立自己的全新練習目錄，看到印出的位置才繼續。`printf` 每次把一段文字放到新的一行，最後得到可以打開檢查的 `events.log`。這些都是教學資料，沒有使用者資訊。

```bash
lab=$(mktemp -d "$PWD/logs.XXXXXX") && cd "$lab" && pwd
printf '%s\n' \
  '2026-11-20 09:01 INFO job=ERROR-review' \
  '2026-11-20 09:04 ERROR job=export' \
  '2026-11-20 10:04 ERROR job=export' \
  '2026-11-21 09:04 ERROR job=export' > events.log
grep '^2026-11-20 09:' events.log
```

先猜第一道會留下幾行，再看它為什麼還不足以回答問題。下一道的 `awk` 是按欄位處理文字的工具，預設以空白切欄，`$3` 表示第三欄；只有等於指定字串才印出整行。用單引號保護它，別讓 Bash 先把錢字號解讀成自己的參數。

```bash
grep '^2026-11-20 09:' events.log | awk '$3 == "ERROR"' > morning-errors.txt
cat morning-errors.txt
wc -l events.log morning-errors.txt
```

原檔 4 行，時段內 2 行，結果 1 行，而且工作是 export。第一筆的事件名稱雖然含 ERROR，程度卻是 INFO；下一日的 09:04 雖然時分相同，日期仍不合。這兩個容易誤收的反例，比單獨測一筆成功紀錄更有說服力。

把這個條件交給另一個人時，請寫出時段的結束邊界。例如 10 點整不列入本次 9 點時段。範例刻意放一行十分接近但不合格的資料，往後改規則時它就是提醒你邊界不能悄悄移動的測試。

## 常見錯誤
看到空檔就寫「系統完全沒出錯」。空檔最多代表依目前條件沒有符合列，還要檢查上游檔案是否讀取成功、欄位與時區是否一致。本例固定格式與時區，不可把相同規則直接套在混合時區或多行堆疊紀錄上。

## 小結
保留原始檔、篩選結果與規則。沒有 Bash 時手動圈選相同資料，保留未畫記的版本當原始樣本。交付時說得出哪兩行被不同條件排除，比單報「查到一筆」更有用。
