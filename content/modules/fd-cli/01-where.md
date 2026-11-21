---
id: fd-cli-01-where
module: fd-cli
order: 1
title: 目錄切換與相對路徑
subtitle: 從提示字元出發
status: ready
minutes: 20
level: 1
prereqs: []
objectives:
  - 用 Get-Location 確認起點
  - 以絕對與相對路徑抵達同一資料夾
tags:
  - cli
  - path
resources:
  - title: "Microsoft Learn：Set-Location 與工作位置"
    url: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/set-location
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: "比較指定完整位置與使用上層目錄的例子。"
concepts:
  - id: fd-cli-01-where-anchor
    prompt: "相對路徑的起點是什麼？"
    answer: "是發出指令當下的工作目錄，不是檔案總管正在看的資料夾。"
    mcq:
      question: "兩個視窗輸入相同的相對路徑卻走到不同地方，先比較什麼？"
      options:
        - "兩個視窗的字型"
        - "兩個視窗的 Get-Location"
        - "最後一次儲存時間"
        - "兩份檔案的大小"
      answer: 1
      explain: "相對路徑不包含固定起點，工作位置不同便可能指到不同目錄。"
  - id: fd-cli-01-where-parent
    prompt: "一個句點與兩個句點各指哪裡？"
    answer: "一個句點是目前目錄，兩個句點是目前目錄的上一層。"
    mcq:
      question: "從 lab 的 route 子目錄回到 lab，選哪個位置？"
      options:
        - "."
        - "route"
        - ".."
        - "lab"
      answer: 2
      explain: "上一層不是再找一個叫 lab 的子目錄；句點的數量有意義。"
  - id: fd-cli-01-where-absolute
    prompt: "什麼樣的 Windows 路徑不必知道目前位置？"
    answer: "含磁碟機和根目錄的完整路徑，例如 C:\\dev\\stackway-lab；起點已寫在裡面。"
practice:
  - id: fd-cli-01-where-p1
    title: "畫一張附有實測路徑的往返票"
    kind: hands-on
    minutes: 8
    steps:
      - "用檔案總管準備 route 子目錄，在紙上畫出它與練習區的位置。"
      - "依範例先用完整路徑抵達，再返回父目錄，改用相對路徑進入。"
      - "在兩條箭頭下各抄一次 Get-Location 的結果。"
    checks:
      - "兩種寫法最後的完整位置相同。"
      - "我能從 route 預測走一次 .. 的結果，紙上不含私人路徑。"
---

## 為什麼要學：你站在哪裡，決定下一步會碰到什麼

用檔案總管時，你看得到視窗上方的地址；在終端機（terminal）裡，也有一個目前所在的位置。今天先別急著建立或搬動一堆檔案。只要能走進指定資料夾，再原路走回來，你就有方法在執行任何會寫入檔案的指令之前，確認自己沒有站錯地方。

## 核心概念：一種地址，2 種走法

目錄（directory）就是資料夾。工作目錄（working directory）是這個視窗用來解讀相對地址的位置。PowerShell 是讀取指令的程式，畫面上等你輸入的提示字元（prompt）常會顯示位置，但它的外觀可以更換。想知道真正的位置就輸入 `Get-Location`，按 Enter。看到新的提示字元表示可以輸入下一行，不必把提示字元抄進指令。

絕對路徑（absolute path）像從車站名開始寫的地址：`C:\dev\stackway-lab` 不問你從哪裡來。相對路徑（relative path）則像「從這裡往下一層」；一個句點代表這裡，兩個句點代表上一層，反斜線分隔途中各層。`Set-Location` 的工作是切換位置，不會建立一個你尚未擁有的目錄。

## 範例：讓 2 條路在同一處會合

用檔案總管在 C 槽的 `dev` 下確認有 `stackway-lab`，若尚無則逐層建立，再在裡面建立 `route` 子目錄。不能使用 C 槽時，以下完整路徑都換成 D 槽的練習區；不要到系統資料夾練習。在任意位置開 PowerShell，逐行輸入，留意哪幾行只有提示字元回來，哪幾行會印出地址。

```powershell
Set-Location -LiteralPath 'C:\dev\stackway-lab\route'
Get-Location
Set-Location -LiteralPath '..'
Get-Location
Set-Location -LiteralPath '.\route'
Get-Location
```

第一個和最後一個地址應該一樣，中間那個少了最後一層。`-LiteralPath` 表示把後面文字當成實際路徑；單引號把地址圈成一個值，即使之後遇到空格也不會被拆成兩段。現在停一下：若在最後的位置再走一次 `.\route`，電腦會找哪裡？它會找裡面的另一個同名子目錄，不會把你送回原點。

在 macOS 或 Linux 的個人練習區，先用圖形介面建立相同的子目錄，再於練習區開 bash。依序輸入 `pwd`、`cd ./route`、`pwd`、`cd ..`、`pwd`。你沒有 C 槽也能完成相同的往返：比較第一次與最後一次的地址，而不是要求不同電腦印出完全相同的字串。之後在[〈bash 與 2 種路徑〉](#/lesson/fd-cli-04-bash)會對照兩種環境。

## 常見錯誤：2 個視窗沒有共用一雙腳

你在檔案總管點進子目錄，不會帶動已開啟的 PowerShell 一起走。在另一個終端機分頁切換位置，也不代表這一頁已切換。若切換失敗，先讀出原來的位置，再從檔案總管核對子目錄確實存在；看到紅字不等於你需要管理員權限。不要用新建同名資料夾來掩蓋走錯層的問題。

## 小結：先定位，再移動，最後報站

把完整地址寫在紙上，下面各畫一條「從磁碟機出發」和「從父目錄出發」的箭頭。下次練習複製時也先做這三步：看起點、說出目標、重新查位置。路徑不是一串需要死背的符號，而是從已知位置找到同一個地方的方法。
