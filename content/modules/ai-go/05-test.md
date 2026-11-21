---
id: ai-go-05-test
module: ai-go
order: 5
title: Go 表格驅動測試
subtitle: 正常、空白、壞格式都只需一列
status: ready
minutes: 35
level: 3
prereqs:
- ai-go-04-input
objectives:
- 把輸入與期望結果整理成測試案例
- 以 go test 比對三種結果，保留錯誤訊息而不輸出原始資料
tags:
- go
- test
resources:
- title: Go Wiki：表格驅動測試
  url: https://go.dev/wiki/TableDrivenTests
  kind: doc
  lang: en
  minutes: 7
  required: false
  checked: '2026-11-20'
- title: Go 官方教學：新增測試
  url: https://go.dev/doc/tutorial/add-a-test
  kind: doc
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-go-05-test-case
  prompt: 表格驅動測試的一列應描述什麼？
  answer: 案例名稱、輸入、預期值或錯誤類別；共用執行與判斷邏輯，不應每列再實作一次被測演算法。
  mcq:
    question: 解析器要多支援前後空白，最值得新增哪一列？
    options:
    - 複製整個解析器做期望值
    - 只看程式能否編譯
    - 輸入帶空白的已知數字，期望原數值且無錯誤
    - 只把測試函式改名
    answer: 2
    explain: 事先寫好的期望能抓到錯誤；複製同一個實作可能一起算錯。
- id: ai-go-05-test-identity
  prompt: 測試想辨別錯誤類別，為何用 errors.Is 而不是比對整句輸出？
  answer: 它能辨認同一個目標錯誤及包裝後的原因，不把人讀的上下文文字鎖成固定介面。
  mcq:
    question: 上層以 %w 加上列號，哪個斷言仍適合檢查底層錯誤類別？
    options:
    - err.Error() 恰等於舊句子
    - 只看輸入長度
    - 只確認結果為 0
    - errors.Is(err, errFormat)
    answer: 3
    explain: 包裝可能增加訊息但保留原因；數字 0 不能代表哪類錯誤。
- id: ai-go-05-test-red
  prompt: 如何確認一個綠色測試真的有能力抓到錯誤？
  answer: 只改教學案例的期望值製造已知失配，確認指定子測試變紅，再還原期望並重跑。
  interview:
    question: 工具不應在失敗日誌洩漏原始欄位，你會如何保留診斷能力？
    points:
    - 穩定的案例名稱
    - 比對安全錯誤類別而非原始內容
    - 故意讓案例失敗檢查訊息
    answer: 我用有效 0、空白、壞格式等名稱識別問題；失敗只報分類或數字。測試故意改錯一次，看到是哪一列壞了就足夠，沒有必要把整列輸入印出來。
practice:
- id: ai-go-05-test-p1
  title: 保留一次紅燈與一次綠燈
  kind: code
  minutes: 13
  steps:
  - 在 parse 套件加入 main_test.go，執行全部案例。
  - 只把 padded 的期望從 7 改成 8，單跑該子測試，記錄失敗片段。
  - 改回 7 後重跑，將前後結果另存為 test-evidence.txt。
  checks:
  - 故意錯配只指向 TestParseSlots/padded，訊息有數字但沒有原始字串。
  - 復原後看到所有命名案例通過，且原本的 main.go 沒有改動。
---

## 為什麼要學：一張綠燈截圖不能說明測過什麼

工具第一次能印出容量，驗收者還會問：「如果來源只送空白呢？如果是有效的 0 呢？」每次人工重打，很容易漏掉上一回曾經壞過的輸入。表格驅動測試（table-driven test）把這些邊界列成資料。程式走的判斷邏輯相同，每多想到一個有意義的反例，加一列就能留下以後可重跑的證據。

## 核心概念：把輸入、約定與診斷分開

Go 會在執行 `go test` 時載入以 `_test.go` 結尾的檔案。測試函式以 `Test` 加上大寫開頭的識別名稱，接收 `*testing.T`，讓你能標記失敗。放在相同套件的測試可以直接呼叫之前寫的 `parseSlots`，不需要開一個終端機子行程，也不必把函式改成公開。這裡測的是解析約定，不是整支工具的結束碼。

案例表（test cases）的每一列都寫已知答案，包含名稱、輸入、期望整數與錯誤類別。先檢查錯誤分類，再對有效結果比數字。`errors.Is` 能辨認包裝後的相同原因；實際與預期都沒有錯誤時也會相符。失敗訊息供人定位問題，並不是越詳細越好：輸入若是內部資料，印整份內容反而破壞小工具原本的保密約定。

## 範例：在原本的套件旁驗收，不複製解析器

回到 `C:\dev\stackway-lab\node-audit`。保留[〈Go 多回傳值與錯誤〉](#/lesson/ai-go-03-errors)完成的 `parse/main.go`，在同一個 `parse` 子目錄新增 `main_test.go`。不要貼到 `input`，因為那是另一個套件目錄。案例名稱描述行為，不用真實的節點名稱或原始輸入作為名稱。

```go
package main

import (
    "errors"
    "testing"
)

func TestParseSlots(t *testing.T) {
    cases := []struct {
        name string
        raw string
        want int
        cause error
    }{
        {"zero", "0", 0, nil},
        {"padded", " 7 ", 7, nil},
        {"blank", "   ", 0, errFormat},
        {"malformed", "x7", 0, errFormat},
        {"negative", "-1", 0, errNegative},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            got, err := parseSlots(tc.raw)
            if !errors.Is(err, tc.cause) {
                t.Fatal("error category mismatch")
            }
            if tc.cause == nil && got != tc.want {
                t.Errorf("slots: got %d, want %d", got, tc.want)
            }
        })
    }
}
```

從模組根目錄在 PowerShell 執行 `go test -v ./parse`。詳細模式會列出各個子測試（subtest）；看到某列失敗，就能從名稱回到表格。故意把 `padded` 的期望值改成 8，用 `go test -run TestParseSlots/padded -v ./parse` 只重播這一列。得到 7、期望 8，表示測試真的走到數字比對。改回正確期望再跑全部案例；這次的目標是確認測試能檢出錯配，不是更動解析規則。

也可以問哪一種錯誤這張表抓不到：如果旗標名稱打錯、執行檔找不到檔案，解析函式根本還沒收到輸入，所有子測試仍可能是綠色。這不是表格失靈，而是測試邊界不同。保留上一堂用真實檔案啟動工具的證據，就能把函式約定與命令列交付分開驗收。

## 常見錯誤

把所有失敗一律期待成「有錯就好」，會讓負容量被誤分成格式錯誤時照樣過關。另一個錯誤是測試直接執行相同解析程式來產生期望值；兩邊會犯一模一樣的錯。先想好可以獨立說明的輸入與輸出，再寫成表格才有意義。只看到整包成功而沒有子測試名稱時，也要確認測試檔與函式有被工具辨認。

## 小結

交付的不只是測試數量，而是一份能說明「哪些邊界受保護、壞掉如何定位」的案例表。留下紅燈再回到綠燈的證據，比刻意堆很多彼此重複的案例更有價值。
