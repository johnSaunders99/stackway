---
id: ai-gateway-05-timeout
module: ai-gateway
order: 5
title: Go context 與取消
subtitle: 用 Go 讀懂基礎設施小工具
status: ready
minutes: 40
level: 3
prereqs:
  - ai-gateway-04-cost
objectives:
  - 追蹤 context 取消如何傳到下游
  - 從現成片段標出要釋放的計時或連線資源
tags:
  - gateway
  - go
resources:
  - title: "Go 標準函式庫：context 的期限與取消"
    url: https://pkg.go.dev/context
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-gateway-05-timeout-tree
    prompt: "取消在父子 context 之間如何傳遞？"
    answer: "父取消會通知衍生子層；單獨取消子層不會取消父或其他子層。"
    mcq:
      question: "入口早已取消，下游才從它衍生 1 小時期限，會怎樣？"
      options:
        - "子層保證能跑 1 小時"
        - "父層期限被延長"
        - "子層可立即觀察到取消"
        - "所有無關根脈絡一起退出"
      answer: 2
      explain: "子層受父層限制，較長局部期限無法延長父層壽命。"
    interview:
      question: "畫面已關掉，模型還在跑，你如何沿程式碼找問題？"
      points:
        - "追父子脈絡與下游 API"
        - "檢查工作是否監聽取消"
        - "核對資源釋放與遠端實際停止"
      answer: "我先看入口是否取得取消，再逐層查有沒有把收到的脈絡往下傳、底層是否支援。接著核對下游返回、cancel 與回應本文的清理；遠端是否真的停止算力不能只看入口錯誤。"
  - id: ai-gateway-05-timeout-cooperate
    prompt: "傳入 context 是否會強制終止任何工作？"
    answer: "不會，工作或底層 API 要監聽取消並合作退出。"
    mcq:
      question: "入口已取消但底層仍持續計算，先查哪裡？"
      options:
        - "只查入口有沒有印出逾時紀錄"
        - "只看呼叫端是否停止接收回應"
        - "是否沿用父脈絡並檢查取消訊號"
        - "只延長局部期限"
      answer: 2
      explain: "訊號中斷或工作未處理取消，都可能讓底層繼續執行。"
  - id: ai-gateway-05-timeout-cleanup
    prompt: "為何 WithTimeout 後通常要 defer cancel()？"
    answer: "讓函式返回時釋放子脈絡相關資源，而不是不必要地等到期限。"
    mcq:
      question: "取得 HTTP 回應後，哪個責任仍在？"
      options:
        - "只要 cancel 就不用關閉本文"
        - "關閉回應本文，取消函式不能替代它"
        - "只需關閉共用用戶端的閒置連線"
        - "必須等期限耗完才可關閉"
      answer: 1
      explain: "子脈絡與已取得的回應本文是不同資源，各有清理責任。"
  - id: ai-gateway-05-timeout-reason
    prompt: "如何分辨主動取消和期限耗盡？"
    answer: "在脈絡結束後讀 Err，分別可見 context.Canceled 與 context.DeadlineExceeded。"
    mcq:
      question: "有效父脈絡衍生 0 期限子層，本例應得到什麼？"
      options:
        - "context canceled"
        - "永遠等待"
        - "context deadline exceeded"
        - "根脈絡也回相同錯誤"
      answer: 2
      explain: "此輪是子層自己的期限到期，根脈絡沒有被取消。"
practice:
  - id: ai-gateway-05-timeout-p1
    title: "標出兩條取消路徑與資源責任"
    kind: code
    minutes: 18
    steps:
      - "執行 main.go 並保存三行結果到 cancel-trace.md"
      - "畫出 root、request 與兩次 retrieve 的父子線及結束原因"
      - "標出取消函式、計時資源及若改用 HTTP 後回應本文的負責者"
    checks:
      - "主動取消與期限到期各得到不同訊息"
      - "根脈絡最後仍是 <nil>"
      - "沒有把收到訊號當成已停止遠端計費"
---

## 為什麼要學：畫面已經關了，誰還在付推論費？

使用者關掉分頁後，閘道不再需要答案，檢索服務卻繼續等待，模型也持續運算。上游不等了，不代表下游自動停止。在 Go 裡，請求脈絡（context）可以沿呼叫鏈傳遞期限與取消訊號。重點不是背出某個函式名稱，而是能沿著「入口 → 檢索 → 模型」指出哪一層還在聽、哪一層把訊號弄丟了。

## 核心概念：父層發訊號，子層要合作

脈絡可以想成一條有方向的通知線。從父脈絡衍生子脈絡時，父層取消會通知子層；取消某個子層，不會反向取消父層或它的其他子層。`context.WithTimeout` 可替局部工作加上期限，子層不能靠設定較長的期限延長父層壽命。把傳進來的脈絡交給下一層；若每層都自行建立新的背景脈絡，就等於在中途剪斷通知線。

`Done()` 傳回的通道在取消時會關閉，等待這個通道的程式因此能繼續執行；這不是強制終止背景工作。必須由工作本身檢查訊號，或呼叫確實支援脈絡的函式。`Err()` 能分辨明確取消和期限到期。建立子脈絡時一併取得的取消函式，要在所有離開路徑上呼叫，通常用 `defer` 排程在函式返回時執行，以便資源及早釋放。

## 範例：讓下游自己說出結束原因
若終端機找不到 `go`，先回到[〈Go 模組與命令列程式〉](#/lesson/ai-go-01-module)驗證工具鏈；這個範例只需要標準函式庫。


在 `C:\dev\stackway-lab` 新建 `cancel-lab`。使用已安裝的 Go，在該資料夾把以下存成 `main.go`，PowerShell 或 macOS、Linux 終端機都可執行 `go run main.go`。只用標準函式庫，不發出網路請求；兩輪分別模擬使用者離開和下游期限用完。

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func retrieve(parent context.Context, limit time.Duration, ready chan<- struct{}) error {
    ctx, cancel := context.WithTimeout(parent, limit)
    defer cancel()
    if ready != nil {
        close(ready)
    }
    <-ctx.Done()
    return ctx.Err()
}

func main() {
    root := context.Background()
    request, leave := context.WithCancel(root)
    ready := make(chan struct{})
    result := make(chan error)
    go func() { result <- retrieve(request, time.Hour, ready) }()
    <-ready
    leave()
    fmt.Println("left:", <-result)
    fmt.Println("expired:", retrieve(root, 0, nil))
    fmt.Println("root:", root.Err())
}
```

`go func` 讓下游以獨立執行的工作（goroutine）開始等待。兩條通道（channel）各傳一件事：下游關閉 ready 表示已取得子脈絡，入口這時才呼叫 leave；下游醒來後把錯誤交給 result。這樣不用猜該睡幾秒，也確知取消時工作已經開始。第一行是 `context canceled`：即使下游願等 1 小時，也要服從父層取消。第二行是 `context deadline exceeded`，因為這次父層還有效，卻給了已用盡的局部期限。最後根脈絡印出 `<nil>`，顯示子層結束不會取消父層。本例刻意直接等待取消，沒有真的檢索文件；將這段放進工作程序時，應在等待結果與取消之間作選擇，而不是把收到取消當作成功取得答案。

### 實際服務還需要釋放什麼？

檢索若改成 HTTP 呼叫，應讓送出的請求帶著收到的脈絡，例如用 `http.NewRequestWithContext` 建立。收到成功傳回的回應物件後，要負責關閉 `resp.Body`；取消函式不是關閉回應本文的替代品。若自己建立週期計時器，結束工作時也應停止不再需要的計時。這些責任屬於實際取得資源的程式碼，不是放一個全域取消鈕就會全部自動完成。

## 常見錯誤

只在入口寫逾時，底層呼叫卻不接受脈絡，造成上游已回錯誤而昂貴工作仍持續。另有人看見「已取消」就把整筆模型費用扣掉；訊號只是要求停止，已做的工作仍可能計費，遠端供應服務是否停止也要另外驗證。記錄入口取消、下游返回及實際用量，才能定位失聯的那一段。

## 小結

沿著每個函式參數往下追，確認同一條取消鏈真的接到底；沿著返回路徑往上找，確認計時與回應資源有人釋放。這兩條線都完整，期限才不只是一個好看的設定值。
