---
id: fd-linux-05-env
module: fd-linux
order: 5
title: 環境變數與 PATH
subtitle: 相同指令為何找到不同程式
status: ready
minutes: 25
level: 3
prereqs:
  - fd-linux-04-processes
objectives:
  - 說明子行程繼承環境變數的時機
  - 在暫時的 shell 工作階段比對 PATH 與指令搜尋結果
tags:
  - linux
  - env
resources:
  - title: Bash 手冊：環境與指令搜尋
    url: https://man7.org/linux/man-pages/man1/bash.1.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 頁內搜尋 ENVIRONMENT 與 COMMAND EXECUTION。
  - title: MIT Missing Semester：Shell 的搜尋路徑
    url: https://missing.csail.mit.edu/2020/course-shell/
    kind: course
    lang: en
    minutes: 5
    required: false
    checked: "2026-11-20"
    note: 閱讀 PATH 與指令定位範例。
concepts:
  - id: fd-linux-05-env-inherit
    prompt: export 在什麼時候影響子行程？
    answer: 之後啟動的子行程會繼承該環境值，不會回頭更新已啟動的行程。
    mcq:
      question: 父 shell 在啟動孩子前 export 草稿模式，孩子改成正式模式，父層讀到什麼？
      options:
        - 孩子改的正式模式
        - 原本的草稿模式
        - 變數一定被刪除
        - 所有分頁一起換模式
      answer: 1
      explain: 子行程收到副本，不會把本機修改反寫到父行程。
  - id: fd-linux-05-env-order
    prompt: PATH 有兩個同名外部工具時，順序為什麼重要？
    answer: 對這個沒有斜線的外部工具名，shell 會依搜尋順序找到可執行檔。
    mcq:
      question: 新工具的兩個目錄內容都可執行，調換先後後最直接改變什麼？
      options:
        - 先找到的工具位置
        - 兩個檔案的權限
        - 程式自動改名
        - 工具一定一起執行
      answer: 0
      explain: 目錄先後影響解析結果，不會更動檔案本身。
    interview:
      question: 同名工具在兩個分頁行為不同，如何判斷是不是搜尋順序？
      points:
        - 同時查解析結果
        - 比較 PATH 先後
        - 在子 shell 控制變數重試
      answer: 我先記兩邊 command -v 找到的路徑，不只比工具名。再在一個子 shell 交換兩個練習目錄順序，若實際印出的代號跟著換，才有理由說是搜尋順序。
  - id: fd-linux-05-env-lookup
    prompt: 要確認目前 shell 怎麼解析一個工具名，先查什麼？
    answer: 用 command -v 名稱，比對它選出的對象與實際輸出。
    mcq:
      question: 只想短暫比較兩個搜尋順序，如何避免污染未來工作階段？
      options:
        - 覆蓋全機環境變數
        - 刪除另一份工具
        - 修改所有登入設定
        - 在子 shell 內改 PATH 並保留原目錄清單
      answer: 3
      explain: 暫時範圍足以做對照，永久更動會讓之後的測試難以還原。
practice:
  - id: fd-linux-05-env-p1
    title: 做一張父子環境與工具解析卡
    kind: hands-on
    minutes: 11
    steps:
      - 執行括號內的兩組範例，或無 Bash 時先寫預測
      - 記下 export 前後與孩子改值後父層的結果
      - 配對兩個搜尋順序與各自印出的工具代號
    checks:
      - 孩子先看不到值，匯出後讀到 draft，父層仍是 draft
      - 兩組路徑的尾段和工具輸出一致
---

## 為什麼要學：隔壁的分頁為什麼不知道我的設定？
在 Bash 裡把顯示模式改成草稿，手邊查得到，小工具卻說沒有這個設定。另一位同學打同一個工具名稱，執行的又不是同一份檔案。這兩個問題都有一個容易漏掉的前提：**是哪一個行程，在什麼時間，從哪個環境開始找？** 不必把變更寫進登入設定，就可以在一個可關閉的小範圍內測出來。

## 核心概念：複製給孩子，不是所有分頁一起改
環境變數（environment variable）是隨行程傳給新程式的名稱與值。在 Bash 指派 `name=value`，等號兩邊沒有空格，預設可能只是 shell 變數。用 `export` 標記後，之後啟動的子行程（child process）才會從這一側取得該值的副本。孩子改自己那一份不會寫回父行程，也不會讓已開著的其他分頁自動收到更新。

搜尋路徑（PATH）也是環境變數，內容是有順序的目錄清單，Linux 用冒號分隔。查一個沒有斜線的外部指令名時，shell 通常從前面往後找可執行檔；用絕對路徑或 `./` 指定檔案，就不靠同一套搜尋順序。函式與內建指令另有優先順序，因此這裡用一個全新的外部工具名稱，避免把兩件事混在一起。

## 範例：在括號裡做一個小實驗
Windows 使用 WSL Ubuntu 的 Bash，其他系統可在 Bash 練習目錄執行。括號內是一個子 shell，整段結束會回到原來環境；成果是兩種搜尋順序的對照卡，記在自己的 linux 主題資料夾。第一個 `bash -c` 開啟孩子，單引號確保由孩子展開變數。先清除實驗變數，再在子 shell 內指派草稿值，才不會誤用原本環境裡已經匯出的同名設定。

```bash
(
  unset STACKWAY_MODE
  STACKWAY_MODE=draft
  bash -c 'echo "before=$STACKWAY_MODE"'
  export STACKWAY_MODE
  bash -c 'echo "after=$STACKWAY_MODE"; STACKWAY_MODE=child'
  printf 'parent=%s\n' "$STACKWAY_MODE"
)
```

讀三行輸出：第一行等號後是空白，第二行是 draft，第三行仍是 draft。接下來在自建目錄做兩個同名檔案，每個只印自己的位置代號。`mktemp` 選不會撞名的練習目錄，`chmod u+x` 只讓擁有者多一個直接執行權。這次我們不把目前目錄加入永久設定，也不把系統搜尋路徑整串蓋掉。

```bash
(
  lab=$(mktemp -d) || exit 1
  mkdir "$lab/first" "$lab/second"
  for place in first second; do
    printf '#!/bin/sh\necho %s\n' "$place" > "$lab/$place/which-plan"
    chmod u+x "$lab/$place/which-plan"
  done
  base=$PATH
  for order in "$lab/first:$lab/second" "$lab/second:$lab/first"; do
    PATH="$order:$base"
    command -v which-plan
    which-plan
  done
)
```

若兩個路徑各自能成功啟動，但互動分頁和批次工作結果仍不同，可以把查詢與執行放在同一次工作內記錄。不要只在自己的分頁證明「我找到的是這份」，就替另一個還沒查過的行程下結論。比較的是當時實際傳入的環境，而不是螢幕外觀。

## 常見錯誤
只看工具的短名稱，以為換了設定還是執行舊檔。`command -v` 給出這個 shell 會選的對象，配合工具自己印出的代號才看得出順序的作用。也不要把永久設定當除錯起點：如果只想試一次，把變更放在括號裡更容易界定影響範圍。

## 小結
將 `C:\dev\stackway-lab\linux` 作為筆記位置，記下兩種搜尋順序對應的輸出；執行用的暫存目錄留在 Linux 檔案系統，不必永久更動 PATH。

把輸出留成兩對「解析路徑 → 實際代號」，再對照父子變數的三行結果。一個結論與目錄先後有關，另一個與新行程何時出生有關。沒有 Bash 時，可以先把這兩組預測寫在紙上並標示未實跑，之後逐行對照。
