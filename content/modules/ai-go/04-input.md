---
id: ai-go-04-input
module: ai-go
order: 4
title: Go 旗標與 JSON 輸入
subtitle: 換一份資料而不用改工具原始碼
status: ready
minutes: 35
level: 3
prereqs:
- ai-go-03-errors
objectives:
- 用 flag 指定輸入檔並使用明確預設值
- 反序列化到結構後檢查缺少的欄位
tags:
- go
- input
resources:
- title: Go 標準函式庫：旗標與解析順序
  url: https://pkg.go.dev/flag
  kind: doc
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
- title: Go 標準函式庫：JSON 解碼至結構
  url: https://pkg.go.dev/encoding/json
  kind: doc
  lang: en
  minutes: 7
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-go-04-input-flag
  prompt: flag.String 回傳什麼？何時能讀到使用者指定的檔名？
  answer: 回傳字串指標；註冊旗標並執行 flag.Parse() 後，以解參照讀取解析出的值，未指定時用預設值。
  mcq:
    question: 要讓 -in 真正換掉預設檔名，必須在哪個動作後開檔？
    options:
    - 宣告結構的型別
    - flag.Parse()
    - 印出工具名稱
    - 將預設值設為空字串
    answer: 1
    explain: 註冊旗標只是說明它怎麼用，解析才會讀取本次命令列。
- id: ai-go-04-input-decode
  prompt: JSON 的 slots 缺少與明確給 0，怎麼用結構區分？
  answer: 解碼到全新結構的 *int 欄位；缺少或 null 為 nil，明確 0 為指向 0 的非空指標。
  mcq:
    question: 用新的結構解碼 {"slots":0}，下列哪個觀察代表有效 0？
    options:
    - Slots 一定為 nil
    - 只能看 JSON 的字串長度
    - Slots 不為 nil 且其值為 0
    - 只有欄位名稱小寫才能解碼
    answer: 2
    explain: 利用指標區別是否有數值；JSON 標籤把外部鍵對應到可匯出的 Go 欄位。
- id: ai-go-04-input-validation
  prompt: JSON 可以解碼，為什麼還可能不能當作節點報告？
  answer: 語法與型別檢查不能代替領域約束；仍須驗證必要欄位、有意義的名稱與容量範圍。
  interview:
    question: 檔名換掉後工具回報失敗，你怎麼不看原始資料也能定位？
    points:
    - 分辨讀檔、解碼與欄位驗證
    - 指出失敗欄位與安全的原因
    - 失敗回傳非零結束碼
    answer: 我先看停在讀檔、JSON 還是欄位檢查。使用者只需知道該修名稱、格式或容量；錯誤時我不輸出整個檔案，並讓自動化能用結束碼判斷失敗。
practice:
- id: ai-go-04-input-p1
  title: 用同一個命令列工具檢查兩份輸入
  kind: code
  minutes: 13
  steps:
  - 建立 input/main.go 與 nodes.json，記下不帶旗標的結果。
  - 另存 missing.json，移除 slots，使用 -in 指向它，保存錯誤類別。
  - 再把 slots 改成字串後重跑，於 input-note.txt 比較三種輸出。
  checks:
  - 明確的 0 是成功；缺欄位與錯誤型別的訊息不同。
  - 修改輸入不必編輯 Go 原始碼，失敗時不印出輸入全文。
---

## 為什麼要學：檔案換了，工具不必跟著改

上一堂把幾筆測試字串直接寫在原始碼裡，很適合先確認邏輯。但若每次收到一份節點狀態，都要改程式再建置，拿到成品的人就沒辦法獨立使用。命令列旗標（flag）讓呼叫者說明這次要檢查哪個檔案；資料格式定義各個欄位；程式則在兩者之間做一道清楚的檢查。

## 核心概念：參數解析與資料解析是 2 個關卡

`flag.String` 定義旗標名稱、預設字串和用途，得到一個指向結果的指標（pointer）。`flag.Parse()` 解析這次傳入的命令列，之後用 `*path` 取出實際字串。若沒有指定 `-in`，採用預設檔名。相對路徑從目前的工作目錄計算，不會因為原始碼放在某個子目錄，就自動改去那裡找檔案。

將 JSON 的文字資料解碼回記憶體中的結構，叫反序列化（deserialization）。欄位名以大寫字母開頭才能由套件外的解碼器設定，反引號中的標籤指定對應的 JSON 鍵。`&r` 表示把可寫入的位置交給解碼器。普通整數欄位沒填就留下 0，會把遺漏和有效 0 混為一談；新的結構用 `*int` 時，沒提供數值就維持 `nil`。這堂刻意讓缺少和明確的 `null` 都走「必須提供數值」的同一條錯誤路徑。

## 範例：從明確 0 開始，再拿掉一個鍵

在 `C:\dev\stackway-lab\node-audit` 建立 `input`，將以下資料用編輯器存為模組根目錄的 `nodes.json`，選 UTF-8 無 BOM。檔案是單一教學節點，不含任何實際機器資訊。第二段存成 `input/main.go`。

```json
{"name":"edge","slots":0}
```

```go
package main

import (
    "encoding/json"
    "errors"
    "flag"
    "fmt"
    "os"
    "strings"
)

type Report struct {
    Name string `json:"name"`
    Slots *int  `json:"slots"`
}

func inspect(path string) error {
    b, err := os.ReadFile(path)
    if err != nil { return errors.New("input: cannot read file") }
    var r Report
    if json.Unmarshal(b, &r) != nil { return errors.New("input: invalid JSON or type") }
    if strings.TrimSpace(r.Name) == "" { return errors.New("name: required") }
    if r.Slots == nil { return errors.New("slots: required") }
    if *r.Slots < 0 { return errors.New("slots: negative") }
    fmt.Printf("node=%s slots=%d\n", r.Name, *r.Slots)
    return nil
}

func main() {
    path := flag.String("in", "nodes.json", "input report")
    flag.Parse()
    if err := inspect(*path); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}
```

在模組根目錄用 PowerShell 執行 `go run ./input`，應看到 `node=edge slots=0`。另存 `missing.json` 並拿掉逗號與整個 `"slots":0`，再執行 `go run ./input -in missing.json`。這次內容仍是合法 JSON，卻收到欄位缺少的錯誤。若提供 `"slots":"0"`，錯誤則發生在解碼階段：字串不是整數。兩個錯誤應給不同修正方向，才不會讓人重新打一次相同資料。

可以再做一個不動程式的實驗：把檔案留在模組根目錄，人切進別的目錄從那裡開啟已建好的工具，會發現同樣的預設檔名不一定能找到。這說明預設檔名是介面的一部分，不是硬寫在程式裡的神奇定位器。交付說明要一起寫清楚從哪裡啟動、預設找誰、如何指定另一份資料，才不會把工作目錄的差異當成格式錯誤。

## 常見錯誤

看見 `nil` 就直接取 `*r.Slots`，會在最需要良好錯誤訊息的時候讓程式異常中止。先判斷指標有值，再讀它。也不要以為解碼成功代表每個鍵都經過允許清單檢查；這裡的解碼方式預設忽略未知鍵，因此必要欄位必須由程式明確檢查。小工具只讀小型本機教學檔，不是用來接收沒有大小限制的網路上傳。

## 小結

輸入路徑、格式和欄位意義要分別驗證。交付一個明確的預設檔、一份可接受的樣本和一個會失敗的樣本，比只附一張成功畫面更能說明工具的使用約定。
