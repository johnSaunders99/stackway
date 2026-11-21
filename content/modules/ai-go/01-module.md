---
id: ai-go-01-module
module: ai-go
order: 1
title: Go 模組與命令列程式
subtitle: 從一個目錄得到可重跑的工具
status: ready
minutes: 35
level: 3
prereqs: []
objectives:
- 辨認 go.mod、package main 與程式入口
- 用 go run 和 go build 區分暫時執行與產生成品
tags:
- go
- module
resources:
- title: Go 官方教學：從模組執行第 1 個程式
  url: https://go.dev/doc/tutorial/getting-started
  kind: doc
  lang: en
  minutes: 7
  required: false
  checked: '2026-11-20'
- title: Go 官方教學：從原始碼建置成品
  url: https://go.dev/doc/tutorial/compile-install
  kind: doc
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
- title: Go 官方：下載與安裝工具鏈
  url: https://go.dev/doc/install
  kind: doc
  lang: en
  minutes: 4
  required: false
  checked: '2026-11-20'
  note: 依 Windows 分頁選取安裝檔，再確認版本。
concepts:
- id: ai-go-01-module-boundary
  prompt: go.mod 與 main.go 各回答什麼問題？
  answer: go.mod 標示模組路徑與工具鏈需要的版本資訊；main.go 是原始碼檔，執行入口在 main 套件的 main 函式。
  mcq:
    question: 想找這組程式碼的模組路徑，先看哪裡？
    options:
    - main.go 的檔名
    - 輸出執行檔的名稱
    - go.mod 的 module 宣告
    - 終端機的視窗標題
    answer: 2
    explain: 模組由 go.mod 定義；原始碼檔、執行檔或視窗改名，都不會因此改變模組路徑。
- id: ai-go-01-module-entry
  prompt: Go 要建成可執行命令，入口需要哪兩個要素？
  answer: 套件名稱是 main，且有不帶參數也沒有回傳值的 func main()。
  mcq:
    question: 同一目錄已有 package main，就一定能產生可執行工具嗎？
    options:
    - 只要檔名叫 main.go 就夠
    - 再加一個 go.mod 就夠
    - 加上 fmt 套件就會自動執行
    - 還需要符合簽名的 main 函式
    answer: 3
    explain: 套件與入口函式缺一不可；檔名及是否使用輸出套件不是判準。
- id: ai-go-01-module-build
  prompt: 想交付一個可重跑的本機工具，怎麼選 go run 與 go build？
  answer: 開發時用 go run 快速編譯並執行；用 go build -o 指定保留的成品，之後可以直接啟動它。
  interview:
    question: 交付後原始碼改了，為什麼執行檔還印出昨天的訊息？
    points:
    - 辨別執行的是成品或原始碼
    - 更動原始碼不會更新既有成品
    - 重新建置並核對輸出
    answer: 我會分別跑目前的原始碼與交付檔。兩者輸出不同時，先查是否漏了重建，再用明確的輸出路徑建置，不會要求對方每天用 go run 猜版本。
practice:
- id: ai-go-01-module-p1
  title: 交付一個會說明用途的命令列工具
  kind: build
  minutes: 12
  steps:
  - 建立模組、hello/main.go，先用 go run 看到用途。
  - 用 go build 留下成品，再只改程式輸出的文字，比對成品與 go run。
  - 重新建置，將兩種執行方式和最後輸出寫入 run-note.txt。
  checks:
  - 目錄裡能找到 go.mod、原始碼與可直接執行的成品。
  - 我能重現「改碼但尚未重建」時的兩種不同輸出。
---

## 為什麼要學：從「照著跑」變成「拿得到工具」

假設你要交接一個檢查節點容量的小工具。若交給同事一段零散的程式碼，對方很難知道該從哪個目錄執行、如何建置。這堂先只做一件小事：讓工具印出用途，並留下一個可以再開一次的成品。之後才加節點資料和錯誤檢查。第一步能重現，後面的失敗才有明確的起點。

## 核心概念：模組是邊界，套件才是一起編譯的程式碼

模組（module）由一個 `go.mod` 描述，裡面寫著模組路徑及 Go 版本等資訊。套件（package）把同一目錄下屬於同一包的來源檔放在一起編譯。一個模組可以包含多個套件，不必為每一個檔案或每一堂課都重新初始化。這次用一個新模組，裡面每個小工具佔一個子目錄，保留你的前一個可執行版本。

要讓套件變成可執行命令，宣告 `package main`，並提供入口函式（entry point）`func main()`。大括號括住要執行的動作；`import "fmt"` 引入標準函式庫的格式化輸出套件。`fmt.Println` 呼叫其中的函式，印出文字及換行。入口不靠檔名辨識，叫 `main.go` 是讓讀程式的人容易找到，不是語言要求這個名字。

## 範例：同一行原始碼，2 種執行方式

在 PowerShell 輸入 `go version`；若找不到指令，依延伸資源的 Go 官方安裝說明選符合系統架構的 Windows 安裝檔，安裝後開新視窗重試。看到版本再建立模組；不用替不同範例重裝工具鏈。到 `C:\dev\stackway-lab`（若無法使用 C 槽就用 D 槽），在未使用過的資料夾建立模組。指令中的本機模組名稱只作識別，不會發布到網路；範例也不需下載第三方套件。

```powershell
mkdir node-audit
cd node-audit
go mod init lab.local/node-audit
mkdir hello
```

在編輯器將以下內容以 UTF-8 存成 `hello/main.go`。在同一個 `node-audit` 目錄執行下一段指令。點加斜線表示相對於所在位置，並不是去網路尋找同名程式。

```go
package main

import "fmt"

func main() {
    fmt.Println("node-audit: inspect local capacity")
}
```

```powershell
go run ./hello
go build -o node-audit.exe ./hello
.\node-audit.exe
```

在 macOS 或 Linux 的同一模組目錄，建置與啟動可用 `go build -o node-audit ./hello`、`./node-audit`。兩條路徑都會看到同一句用途。`go run` 也會編譯，只是不把你指定名稱的發行成品留在目錄中；`go build` 預設不會替你執行。把輸出字串最後加上 `v2`，先別重新建置：直接開成品仍是舊文字，從原始碼執行才是新文字。

留意這份成品是針對目前建置的作業系統與處理器產生；在自己的 Windows 成功開啟，不等於可以把同一個檔案直接交給其他作業系統。交接筆記附上平台和測過的指令，對方就能判斷是直接使用，還是取同一份原始碼重新建置。

## 常見錯誤

看到找不到模組便隨手再做一次初始化，最後子目錄多出一個不打算維護的模組。先確認所在位置和 `go.mod` 的位置。另有一種更早的錯誤是終端機根本找不到 `go`；這與程式語法無關，要先確認工具鏈可用，再來改原始碼。把這兩種錯誤分開，就不用碰運氣重裝一切。

## 小結

用模組目錄固定工作範圍，用明確的入口固定執行位置，再用建置產生可交付檔案。你的第一個小工具即使只說一句話，也已經能驗證整條交付路徑。
