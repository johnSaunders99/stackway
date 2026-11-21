---
id: ai-go-02-types
module: ai-go
order: 2
title: Go 型別、結構與切片
subtitle: 把三筆節點資料整理成清單
status: ready
minutes: 30
level: 3
prereqs:
- ai-go-01-module
objectives:
- 用 struct 描述一筆節點、slice 表達多筆
- 以 range 走訪並依條件累計可用容量
tags:
- go
- types
resources:
- title: Go 導覽：結構與欄位
  url: https://go.dev/tour/moretypes/2
  kind: interactive
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
- title: Go 官方文章：切片與長度
  url: https://go.dev/blog/slices-intro
  kind: article
  lang: en
  minutes: 6
  required: false
  checked: '2026-11-20'
concepts:
- id: ai-go-02-types-record
  prompt: 為什麼把單筆節點寫成 struct，而不是另外存 3 個切片？
  answer: 具名欄位把同一筆的名稱、容量與狀態綁在一起，避免索引錯位，也讓編譯器檢查型別。
  mcq:
    question: 要讓編譯器阻止把 "yes" 當作就緒值，欄位應選什麼型別？
    options:
    - string
    - int
    - '[]string'
    - bool
    answer: 3
    explain: bool 只能表示真假；字串和數字需另外約定含義，切片則代表多個值。
- id: ai-go-02-types-collection
  prompt: Node 與 []Node 表達的資料有何不同？
  answer: Node 是一筆結構值；[]Node 是可表示 0 到多筆 Node 的切片。
  mcq:
    question: 哪個數字代表切片實際有幾筆資料？
    options:
    - len(nodes)
    - 第一筆的 Slots
    - 最後一筆的索引
    - 所有 Slots 的總和
    answer: 0
    explain: 長度計筆數，索引從 0 起，容量欄位只是節點自己的資訊。
- id: ai-go-02-types-traversal
  prompt: for _, n := range nodes 中的空白識別字丟掉什麼？
  answer: 丟掉索引，n 接到該次走訪的元素值；對這個純值結構改 n 的欄位不會改回原切片。
  mcq:
    question: 想把原切片第 i 筆標成未就緒，哪個寫法會改到原資料？
    options:
    - 只改 range 取得的 n.Ready
    - nodes[i].Ready = false
    - 只把迴圈索引設成 0
    - 只把累計變數設成 0
    answer: 1
    explain: 更改元素本身和更改元素的區域副本是不同操作。
- id: ai-go-02-types-filter
  prompt: 計算可接受工作的總容量，應在哪個步驟判斷就緒？
  answer: 逐筆走訪時先檢查 Ready，只將符合條件的 Slots 加進總數。
  interview:
    question: 工具顯示 3 個節點、可用容量 6，怎麼證明不是隨便印的？
    points:
    - 區分筆數和容量
    - 指出被排除的節點
    - 只改一個狀態重算
    answer: 我會保留 3 列輸入及手算。把離線節點切成可用後，總容量應增加它的欄位值，筆數保持不變，這比只驗一次剛好等於 6 更有說服力。
practice:
- id: ai-go-02-types-p1
  title: 把節點清單變成可交接的容量報表
  kind: code
  minutes: 11
  steps:
  - 在既有模組新增 capacity/main.go，將第一次輸出保存為 capacity.txt。
  - 只把中間節點改為就緒，預測再重跑。
  - 把切片換成空的 []Node{}，記下筆數和可用容量。
  checks:
  - 三次輸出的可用容量依序為 6、14、0。
  - 我能指出哪一列被排除，以及為什麼沒有少算一台機器。
---

## 為什麼要學：有 3 台機器，不代表能接 3 份工作

排程前想知道還有幾個工作名額。某台節點有 8 個名額卻正在維修，若報表只把容量整欄加總，就會答應一個目前做不到的交期。這堂把一張小清單放進 Go 程式：先描述一筆資料，再描述多筆資料，最後用一條明確的規則計算「可用」，而不是猜測清單長度。

## 核心概念：先決定一筆長什麼樣

型別（type）限制值能表示什麼。字串（string）放名稱、整數（int）放名額、布林值（bool）放真假。結構（struct）把這些不同型別的欄位組成一筆，取名叫 `Node`。讀 `n.Slots` 就是讀這筆節點的名額。建構時明寫 `Slots: 2`，比只按位置依序填值清楚；日後增加欄位也比較不會把數字放錯位置。

切片（slice）是可以有不同長度的同型別序列。`[]Node` 表示每個元素都是一筆節點，不表示裡面一定有節點。`len(nodes)` 只回答幾筆。用 `for` 搭配 `range` 逐筆處理時，會得到索引及元素值；不用索引可以寫空白識別字 `_`。`:=` 是在函式內宣告變數並讓編譯器從右邊推得型別，`+=` 則是把新值累加到原變數，不是重新宣告。

## 範例：先手算，再看工具會不會同意

在上一堂的 `C:\dev\stackway-lab\node-audit` 建立 `capacity` 子目錄，以下存成 `capacity/main.go`。在模組根目錄以 PowerShell 執行 `go run ./capacity`，其他系統用相同指令。第一輪先用手指遮住程式最後一行：把就緒節點的名額寫在紙上，自己算一次。

```go
package main

import "fmt"

type Node struct {
    Name string
    Slots int
    Ready bool
}

func main() {
    nodes := []Node{
        {Name: "north", Slots: 2, Ready: true},
        {Name: "east", Slots: 8, Ready: false},
        {Name: "west", Slots: 4, Ready: true},
    }
    available := 0
    for _, n := range nodes {
        if n.Ready {
            available += n.Slots
        }
    }
    fmt.Printf("nodes=%d available=%d\n", len(nodes), available)
}
```

北側提供 2 個、西側提供 4 個，東側維修，不算入可用名額。輸出 `nodes=3 available=6` 合理。現在只把東側的狀態改成真，筆數仍然是 3，容量應變成 14。這個反例能排除「把中間那筆永久跳過」這種碰巧得到正確答案的程式。若清單為空，迴圈不會進入，初始值 0 就是正確總數，不必特別取第一筆。

試著比較兩份都顯示可用 0 的報表。第一份完全沒有節點，第二份有節點但都未就緒。對排程者而言現在都不能接工作，對維運者而言卻是兩個問題。保留筆數與可用容量兩欄，可以在不增加複雜資料結構的情況下說出這個差別。若還想知道排除哪台，下一個合理欄位是節點名稱，不是把整筆資料轉成沒有結構的一大段文字。

## 常見錯誤

直接在迴圈裡改 `n.Ready`，然後以為原切片被更新。這個結構只有一般值欄位，`n` 拿到的是副本；若目的真的是改原始資料，就要用索引存回原元素。反過來，單純做報表時只讀副本剛好清楚，別為了求和偷偷改掉來源資料。另一個混淆是把 0 名額當成資料遺失：數字 0 可以是有效觀察；如何區別沒填，之後在[〈Go 旗標與 JSON 輸入〉](#/lesson/ai-go-04-input)會細講。

## 小結

把「幾筆」、「每筆有多少」與「哪些可用」拆成型別、欄位和條件。報表不只要印對一個數字，還要能解釋少算或多算的是哪一筆。
