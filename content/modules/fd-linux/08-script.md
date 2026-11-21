---
id: fd-linux-04-script
module: fd-linux
order: 8
title: Shell 腳本與退出碼
subtitle: 讓重跑不會多做一次
status: ready
minutes: 35
level: 3
prereqs:
  - fd-linux-03-logs
objectives:
  - 用退出碼表示成功或失敗
  - 對相同輸入連跑兩次比對結果
tags:
  - linux
  - scripting
resources:
  - title: Bash 手冊：退出狀態與條件判斷
    url: https://man7.org/linux/man-pages/man1/bash.1.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: "2026-11-20"
    note: 搜尋 EXIT STATUS 與 CONDITIONAL EXPRESSIONS。
concepts:
  - id: fd-linux-04-script-status
    prompt: 為什麼要在腳本結束後立刻讀 $?？
    answer: 它只代表上一個命令的退出狀態，插入其他命令就會換成別的結果。
    mcq:
      question: 腳本執行後先 cat 報告，再讀 $?，讀到的是誰的結果？
      options:
        - cat
        - 先前的腳本
        - 整個終端機的累計結果
        - 第一次啟動 Bash 的結果
      answer: 0
      explain: 狀態會被下一個命令取代，內容正確和腳本的成功訊號也要分開核對。
  - id: fd-linux-04-script-repeat
    prompt: 怎樣檢查產生報告的腳本是否符合本例的冪等要求？
    answer: 用相同輸入連跑兩次，保留第一份再直接比較兩次內容。
    mcq:
      question: 哪種結果算通過本例的重跑測試？
      options:
        - 兩次都印了完成但第二份多一行
        - 第二次改了檔名
        - 檔案修改時間一定不變
        - 兩次報告內容一致
      answer: 3
      explain: 要穩定的是報告內容，不是時間戳記或螢幕上的訊息。
    interview:
      question: 同事說腳本跑第二次沒報錯就代表安全，你會補哪兩個驗證？
      points:
        - 比對相同輸入兩次結果
        - 測壞輸入與退出碼
        - 看舊報告是否受影響
      answer: 我會留第一次的檔案做 cmp，而不是只看有沒有報錯。接著故意給不存在的檔名，確認呼叫端收到非零，原本的兩行報告也沒有被清掉。
  - id: fd-linux-04-script-guard
    prompt: 輸入無法讀取時，為什麼要在開啟輸出檔前結束？
    answer: 避免把上次成功的結果截短，並以非零狀態告知呼叫者。
    mcq:
      question: 樣本先前成功，接著傳入不存在的檔案，預期看到什麼？
      options:
        - 狀態 0、輸出變空
        - 狀態 2、必須刪除舊報告
        - 狀態 2、原報告仍在
        - 狀態 0、附加一筆錯誤當資料
      answer: 2
      explain: 程式在重導向之前檢查輸入；診斷走標準錯誤，不該混成正常報告。
practice:
  - id: fd-linux-04-script-p1
    title: 保存一份可重跑的報告工具
    kind: code
    minutes: 16
    steps:
      - 在新目錄建立 report.sh 並產生 items.txt
      - 依範例連跑兩次，留下 first.txt 與 report.txt
      - 改傳不存在的檔名，記下退出碼，無 Bash 可寫三條決策路徑
    checks:
      - 正常結果只有 book 與 tea，cmp 狀態 0
      - 缺檔時狀態 2，先前報告未被清空
---

## 為什麼要學：重按一次，不應多出第 2 份結果
你幫自己寫了一個整理文字的工具。第一次產生報告，第二次卻多出一份相同的項目；更糟的是，輸入檔打錯名字也顯示「完成」。自動化不是把一串成功步驟存起來，而是要說清楚三件事：從哪裡讀、什麼算成功、同樣資料再做一次會留下什麼。這堂用一張只有幾行的清單把它們測出來。

## 核心概念：輸出回答「得到什麼」，退出碼回答「做成沒有」
腳本（script）是儲存成檔案、交給 shell 逐步執行的命令。退出碼（exit status）是程式結束時回給呼叫者的數字，慣例是 0 成功，非零表示這個程式定義的其他結果。終端機有沒有印字不是成功與否的可靠依據。`$?` 取的是緊接著上一個命令的結果，所以不要先插入別的查詢，否則看到的會是另一個程式的退出碼。

在伺服器上，相同請求重送也會遇到這個問題，見[〈冪等性與重複送出〉](#/lesson/fs-api-05-retry)。冪等（idempotent）在本例指相同輸入重跑，報告內容維持相同；不代表程式不能再執行，也不保證任何寫檔都能抵抗斷電。把完整結果覆寫到專屬輸出檔，和每次都附加在尾端，會產生不同語意。先檢查輸入再動輸出，才能避免連檔案都讀不到時卻把上次成功結果清空。

## 範例：產生排序且不重複的清單
Windows 先建立 `C:\dev\stackway-lab\linux`，從 WSL Bash 用 `cd /mnt/c/dev/stackway-lab/linux` 進入；若切換失敗先停下來。原生 Linux 或 macOS 請切到自己練習區的 `linux` 子目錄。

Windows 進已授權的 WSL Ubuntu Bash；macOS 或 Linux 也可用 Bash。在目前的主題目錄以 `mktemp -d "$PWD/list.XXXXXX"` 建立新目錄，再 `cd` 到印出的路徑。以下在該目錄用編輯器建立 `report.sh`，以 UTF-8 與 LF 換行儲存。這支腳本固定產生自己的 `report.txt`，不要在放有重要同名檔案的目錄執行。

```bash
#!/usr/bin/env bash
if [[ $# -ne 1 || ! -f "$1" || ! -r "$1" ]]; then
  printf 'Expected one readable input file\n' >&2
  exit 2
fi
if [[ "$1" -ef report.txt ]]; then
  printf 'Input equals output\n' >&2
  exit 2
fi
LC_ALL=C sort -u -- "$1" > report.txt || exit 1
```

`$#` 是參數個數，`$1` 是第一個參數；`-ef` 檢查兩個路徑是否指到同一個檔案。`>&2` 把診斷送到標準錯誤，不混入報告。`sort -u` 排序並合併相同列，成功時腳本自然回傳最後這個成功狀態。接下來在同一個目錄執行，不用賦予腳本直接執行的權限。

```bash
printf '%s\n' tea book tea > items.txt
bash report.sh items.txt
cp report.txt first.txt
bash report.sh items.txt
cmp first.txt report.txt
printf 'same=%s\n' "$?"
bash report.sh missing.txt
printf 'missing=%s\n' "$?"
cat report.txt
```

這個工具也說明了「來源」和「目的地」的契約：來源是一份可讀的清單，結果是這支工具負責維護的那個檔案。若你把輸出名字也當成輸入，腳本會在寫之前拒絕，以免先截短再從空檔讀取。這是避免破壞來源的檢查，和去除重複列是兩個不同責任。

## 常見錯誤
只檢查輸出檔存在，會把上次留下的成功結果誤當作這次新產生。應分別驗證正常重跑時內容相同、缺檔時回傳 2 且原報告仍可讀。注意這段範例只保證在前置檢查失敗時不開啟輸出；若寫到一半磁碟滿，還需要其他保護才能維持上一份完整報告。

## 小結
驗收卡寫下預期的兩行輸出，以及 `cmp` 無輸出且狀態 0 的含義。若手邊沒有 Bash，就沿程式分別走一次正常、缺檔、輸入等於輸出的路徑，標記各自在哪裡停止，別把紙上推演寫成實機結果。
