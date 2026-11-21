---
id: ai-go-03-errors
module: ai-go
order: 3
title: Go 多回傳值與錯誤
subtitle: 錯誤是回傳值，不是成功時的空資料
status: ready
minutes: 30
level: 3
prereqs:
- ai-go-02-types
objectives:
- 用值與 error 表達解析結果
- 讀懂 if err != nil 的分支，保留呼叫端需要的上下文
tags:
- go
- errors
resources:
- title: Go 官方文章：回傳與處理錯誤
  url: https://go.dev/blog/error-handling-and-go
  kind: article
  lang: en
  minutes: 7
  required: false
  checked: '2026-11-20'
- title: Go 官方文章：包裝錯誤與辨認原因
  url: https://go.dev/blog/go1.13-errors
  kind: article
  lang: en
  minutes: 6
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-go-03-errors-pair
  prompt: 為什麼解析函式同時回傳整數與 error？
  answer: 整數是成功結果；error 明確區分有效的 0 與解析失敗時佔位的 0。
  mcq:
    question: 輸入 "0" 得到 0，輸入 "bad" 也回傳第一個值 0，要用什麼區分？
    options:
    - 檢查第二個回傳值是否為 nil
    - 看數字是不是正數
    - 看程式有沒有立刻退出
    - 只看字串長度
    answer: 0
    explain: 合法 0 不是失敗；錯誤值才是這個函式約定的判斷依據。
- id: ai-go-03-errors-guard
  prompt: 呼叫端讀到 err != nil，為什麼要先處理再累加？
  answer: 此函式失敗時的數字不是有效觀察；提早返回或跳過可阻止錯值進入成功結果。
  mcq:
    question: 哪個流程最符合解析函式的約定？
    options:
    - 先寫入 n 再看 err
    - 先判斷 err，成功才使用 n
    - 把每個 err 換成有效 0
    - 只在 n 大於 0 時檢查 err
    answer: 1
    explain: 先驗證再更新，才不會把失敗或負值算成容量。
- id: ai-go-03-errors-context
  prompt: 用 %w 包裝錯誤的目的為何？
  answer: 補上上層操作背景，同時保留可用 errors.Is 等方式辨認的底層原因；要另外選擇安全的顯示內容。
  interview:
    question: 要讓維運者知道哪一列壞了，又不能把原始輸入印出來，怎麼設計？
    points:
    - 使用不含原文的原因類別
    - 加上操作或列號
    - 保留錯誤分支且不採用佔位值
    answer: 我會在輸入邊界轉成安全的錯誤類別，再由上層補列號。不能想當然地印出解析套件的原始錯誤，因為裡面可能包含原文；失敗那列也不能當成 0 容量。
practice:
- id: ai-go-03-errors-p1
  title: 保存能區分 0、負值和壞格式的解析紀錄
  kind: code
  minutes: 11
  steps:
  - 在 parse/main.go 實作範例，從模組目錄執行並保存輸出。
  - 在測試清單加入空字串及一筆前後帶空格的非負整數。
  - 在 parse-note.txt 寫下有效 0 與格式錯誤走到哪個分支。
  checks:
  - 合法的 0 留在成功分支，負值與格式錯誤各有可讀原因。
  - 失敗輸出含列號，不含原始的 bad 或新加入的原始內容。
---

## 為什麼要學：真的 0，和不知道是多少

節點回報名額是字串。`"0"` 表示目前已滿，應該接受；`"bad"` 表示這筆資料讀不懂，不應放進統計。若一律在出錯時回傳 0，兩種狀況在報表上就長得一模一樣。這不是顯示的小問題，而是使用者會把資料品質故障誤認為沒有容量。Go 常用多回傳值（multiple return values）讓這條界線留在函式簽名裡。

## 核心概念：數值有型別，失敗也有值

`func parseSlots(raw string) (int, error)` 的意思是接受字串，回傳整數與錯誤值（error）。成功時錯誤位置為 `nil`，是沒有錯誤，不是空字串。`n, err :=` 把兩個結果分別接住。在本例的約定中，若錯誤不為空，第一個數字只是佔位值。其他函式可能允許讀到部分資料，所以要先看每個函式的約定，別把這條規則當成整個語言的鐵律。

先把輸入邊界的不確定性攔下，再做上層工作。去掉前後空白叫正規化，將字串轉成整數叫解析，要求不得小於 0 則是業務規則；能解析不等於能接受。每一層回答不同問題，保留易辨認的錯誤類別，上層就能決定停止、跳過，或請資料來源修正，而不需要從一整句文字猜是哪個錯誤。

## 範例：替失敗加上列號，不把輸入倒進日誌

在 `C:\dev\stackway-lab\node-audit` 建立 `parse`，以下存為 `parse/main.go`，用 PowerShell 執行 `go run ./parse`。標準函式 `strconv.Atoi` 負責解析十進位整數。它回報的原始錯誤可能含有輸入內容，這裡刻意改成安全的原因，再在外層用 `%w` 加上列號。

```go
package main

import (
    "errors"
    "fmt"
    "strconv"
    "strings"
)

var errFormat = errors.New("expected integer")
var errNegative = errors.New("negative capacity")

func parseSlots(raw string) (int, error) {
    n, err := strconv.Atoi(strings.TrimSpace(raw))
    if err != nil { return 0, errFormat }
    if n < 0 { return 0, errNegative }
    return n, nil
}

func main() {
    for i, raw := range []string{"0", "-2", "bad"} {
        n, err := parseSlots(raw)
        if err != nil {
            problem := fmt.Errorf("row %d: %w", i+1, err)
            fmt.Println(problem)
            continue
        }
        fmt.Printf("row %d: slots=%d\n", i+1, n)
    }
}
```

輸出先是第一列的有效 0，接著是第二列的負容量與第三列的格式錯誤。`continue` 表示這一列已處理完，直接進下一列，所以錯誤列不會再印一次成功訊息。這是示範逐列診斷的工具，不是讀到錯誤仍宣告整批成功的部署閘門。若需求是整批都要正確，應改成停止處理並向呼叫者回報失敗。

這裡也刻意把是否要繼續的決定留給呼叫端。解析函式若自己印日誌再終止整個行程，之後想在另一個服務或測試裡重用，就很難只檢查一筆資料。讓小函式單純回報原因，由最了解情境的外層加上列號並選擇處置，同時得到可重用的介面和讀得懂的診斷。

## 常見錯誤

用 `n, _ :=` 丟掉錯誤，看似少寫幾行，卻讓合法 0 和未知值再度混在一起。另一個陷阱是用字串完全相等來辨別原因：只要上層多加列號就壞了。`%w` 能保留包裝鏈，讓呼叫者以 `errors.Is` 比對原本的類別；之後在[〈Go 表格驅動測試〉](#/lesson/ai-go-05-test)會用這個差別寫測試。

先檢查回傳的錯誤，再使用同一次呼叫交回的資料；資料看起來像合法的零值，仍可能代表工作沒有成功。

## 小結

函式回傳兩份資訊，你就要分兩步使用：先決定這筆結果可不可信，再取數字做事。失敗訊息報告操作和原因即可，不必把原始資料連同錯誤一起傳下去。
