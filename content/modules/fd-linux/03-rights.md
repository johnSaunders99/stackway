---
id: fd-linux-02-rights
module: fd-linux
order: 3
title: Linux 檔案權限
subtitle: 讀寫與執行是三件事
status: ready
minutes: 30
level: 3
prereqs:
  - fd-linux-01-boundary
objectives:
  - 從權限列辨識擁有者可做的事
  - 提出不擴大全域權限的修正
tags:
  - linux
  - permissions
resources:
  - title: GNU Coreutils：chmod 權限表示法
    url: https://man7.org/linux/man-pages/man1/chmod.1.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: "2026-11-20"
    note: 讀權限對象、加減動作與模式。
concepts:
  - id: fd-linux-02-rights-triad
    prompt: 讀一般檔案權限列時，哪三組人要分開？
    answer: 略過檔案種類字元，依序看擁有者、群組、其他人的讀寫執行位元。
    mcq:
      question: 一般檔案模式 -rw-r----- 表示群組可以做什麼？
      options:
        - 讀寫
        - 讀與執行
        - 沒有任何權限
        - 只讀
      answer: 3
      explain: 中間 3 格是 r--，不要把擁有者的 w 算給群組。
  - id: fd-linux-02-rights-narrow
    prompt: 只想讓擁有者能直接執行，應改哪一格？
    answer: 用 chmod u+x 指定那一個練習檔，只增加擁有者執行位元。
    mcq:
      question: 檔案其餘權限都要不變，哪項變更剛好符合？
      options:
        - chmod a+x check.sh
        - chmod g+x check.sh
        - chmod u+x check.sh
        - chmod u+w check.sh
      answer: 2
      explain: a 會擴到所有類別，g 是群組，w 是寫入；只有 u+x 指向要求的那格。
    interview:
      question: 某人提議把整份專案都打開權限，你如何縮小修正？
      points:
        - 確認目錄、檔案與擁有者
        - 看實際缺少的位元
        - 只修正該檔並直接驗收
      answer: 我會先確認自己是在 Linux 練習目錄看對檔案。如果擁有者可讀但沒有執行位元，只補該檔的 u+x；比對其餘兩組沒有改，再直接執行確認。
  - id: fd-linux-02-rights-direct
    prompt: 用 sh check.sh 跑成功，為何不能證明腳本有直接執行權？
    answer: 此時執行的是解譯器，由它讀腳本；直接執行檔案則另須該檔的執行權。
    mcq:
      question: 哪一項是本例直接啟動腳本的驗證？
      options:
        - 用 cat 讀到腳本文字
        - 執行 ./check.sh 看見 task-ready
        - 看到檔名結尾是 .sh
        - 用編輯器開檔成功
      answer: 1
      explain: 能讀、名稱相符與能直接啟動是不同條件。
practice:
  - id: fd-linux-02-rights-p1
    title: 替單一腳本補一格權限
    kind: hands-on
    minutes: 12
    steps:
      - 在 linux 主題資料夾保存範例，再用原生 Linux 的暫存副本檢查權限
      - 寫下變更前後的權限並執行，無 Linux 則用課文模式列判讀
      - 保留腳本或兩行加註的權限卡
    checks:
      - 只有擁有者的 x 是新增的
      - 實跑者能讀到 task-ready，判讀者能指出群組和其他人各缺哪些位元
---

## 為什麼要學：明明看得見，為什麼不能執行？
一個小腳本用編輯器打得開，直接輸入檔名卻出現權限不足。有人建議「把整個資料夾開放給所有人」；這和為了看一本書就把大門鑰匙分給路過的人一樣，解決的不是同一件事。我們要做的變更很小：只允許檔案擁有者直接執行自己的練習檔，並且能指出改的是哪一個字元。

## 核心概念：先找對象，再找動作
一般檔案的權限（permissions）分成擁有者（owner）、所屬群組（group）與其他人（others）三組。`ls -l` 顯示的模式字串最前方是檔案種類，之後每組依序是讀取、寫入、執行，用 `rwx` 表示；缺少的動作以短橫線佔位。看到 `-rw-r-----`，第一個短橫是一般檔案，擁有者可讀寫、群組可讀、其他人沒有這些權限。不是把整串所有出現的字母加在一起算自己的權力。

同樣的執行位元在目錄有不同意思：代表可以穿越目錄，依名稱走到下一層；目錄可列出名字與可走進去並非同一件事。這堂只針對一個已知屬於自己的普通檔案。使用者看得到內容不代表可以直接啟動它，系統也不會只因副檔名是 `.sh` 就授予執行權限。

## 範例：只多給擁有者一個動作
Windows 從已授權的 WSL Ubuntu 開啟 Bash，原生 Linux 也可用 Bash。在 `C:\dev\stackway-lab\linux` 內建立新資料夾 `rights`，將以下內容存成 `check.sh`，使用 UTF-8 與 LF 換行。Windows 的掛載磁碟不一定保留 Linux 執行位元，所以只把測試副本放到原生 Linux 暫存目錄，原稿和紀錄都留在工作區。

```bash
#!/bin/sh
printf "task-ready\n"
```

在 WSL Bash 用 `cd /mnt/c/dev/stackway-lab/linux/rights` 進入剛才的資料夾；原生 Linux 則到自己的 `linux/rights`。先確認 `cat check.sh` 顯示上面的兩行，再在同一分頁逐段執行；若建立或複製失敗就停下來。

```bash
lab=$(mktemp -d) && cp -- check.sh "$lab/check.sh" &&
  chmod u=rw,go= "$lab/check.sh" && ls -l "$lab/check.sh"
```

先看檔名左邊的權限應以 `-rw-------` 開頭。腳本第一行告訴系統用哪個解譯器，下一行負責印出完成記號。這一步不必刻意放寬任何目錄。接下來的 `u` 是擁有者，`+` 是只增加，`x` 是允許執行；其他類別原本的位元保持原樣。

```bash
(cd -- "${lab:?}" && chmod u+x check.sh && ls -l check.sh && ./check.sh)
```

現在應看到 `-rwx------` 和 `task-ready`。開頭的 `./` 明確表示這個目錄裡的檔案，並不是到已安裝工具的清單去找同名指令。如果你用 `sh check.sh` 成功，只能證明解譯器可讀它，不能證明直接啟動的執行位元本來就有設定。

可以做一次反向預測：如果原檔已經有擁有者執行位元，再加一次不會平白多出第二個執行權。此時畫面沒有差異是合理的；要看清這個實驗，起點必須真的是可讀寫、尚不能直接執行。

## 常見錯誤
同一個「拒絕存取」也可能是父目錄無法穿越、檔案不屬於你，或檔案系統限制直接執行。若模式與範例不符，先看你所在的目錄與擁有者，不要用提升權限來掩蓋原因。更不要遞迴更動整個專案；資料檔沒有理由因為旁邊有腳本就變得可執行。

## 小結
把觀察到的權限列與執行結果記進 `C:\dev\stackway-lab\linux` 的新筆記。若暫存位置不允許執行，改做紙上判讀並註明限制，不要更動掛載設定。

保留改動前後的權限字串，對齊兩行圈出新增的那一格。沒有 Linux 時，就用範例的兩行畫出「誰、多出哪個動作、另外兩組是否改變」，標明這是判讀而非實機輸出。
