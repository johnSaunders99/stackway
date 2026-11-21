---
id: fd-cli-02-copy
module: fd-cli
order: 2
title: 檔案複製與目的路徑
subtitle: 複製而不覆蓋原稿
status: ready
minutes: 25
level: 1
prereqs:
  - fd-cli-01-where
objectives:
  - 在練習區建立檔案副本
  - 比對來源與目的地的名稱及內容
tags:
  - cli
  - copy
resources:
  - title: "Microsoft Learn：Copy-Item 的來源與目的地"
    url: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/copy-item
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: "看複製單一檔案及另取檔名的範例。"
concepts:
  - id: fd-cli-02-copy-direction
    prompt: "複製指令的來源與目的地各代表什麼？"
    answer: "來源是要讀的原稿，目的地是要寫的副本位置；複製不會移除來源。"
    mcq:
      question: "要保留原稿 draft.txt，哪個角色不能弄反？"
      options:
        - "新檔名是來源，draft.txt 是目的地"
        - "兩個都必須是現有檔案"
        - "draft.txt 是來源，另一個新檔名是目的地"
        - "兩個都必須是資料夾"
      answer: 2
      explain: "讀哪個與寫哪個有方向；空的新位置可以成為副本。"
  - id: fd-cli-02-copy-collision
    prompt: "要避免寫到既有目的檔，應先查什麼？"
    answer: "檢查完整目的路徑是否已存在；若存在就停下或選未使用的名字。"
    mcq:
      question: "Test-Path 回報目的檔為 True，下一步最符合保留舊稿的需求？"
      options:
        - "加上 Force"
        - "假定一定會有確認視窗"
        - "把來源刪掉再複製"
        - "改選未使用的目的檔名並重查"
      answer: 3
      explain: "True 是位置已存在，不是允許取代；覆寫也不一定會詢問。"
  - id: fd-cli-02-copy-verify
    prompt: "沒有錯誤訊息如何再確認副本正確？"
    answer: "分別列出來源與目的名稱，讀取兩個檔案比對內容，再確認原稿仍在原位置。"
practice:
  - id: fd-cli-02-copy-p1
    title: "留下一份不覆寫的校對稿"
    kind: hands-on
    minutes: 10
    steps:
      - "在新練習資料夾存一份兩行的 draft.txt，記住兩行的順序。"
      - "核對目的位置尚未使用，依範例複製並讀兩份檔案。"
      - "只在副本末尾加一行 review，再重新讀取兩份檔案。"
    checks:
      - "原稿仍有原來的 2 行；副本有 3 行。"
      - "再次檢查相同目的路徑得到 True，沒有重跑寫入。"
---

## 為什麼要學：先留一份能回頭看的原稿

假設你要把一份兩行的練習紀錄交給別人校對。理想狀況不是改完才問「剛才寫了什麼」，而是手邊始終有原稿和一份可改寫的副本。複製（copy）是讀一個位置、在另一個位置寫出資料；搬移則改變原檔所在位置。看著兩個圖示有時分不出差別，這堂要用內容證明確實分成兩份。

## 核心概念：把指令讀成一句有方向的話

`Copy-Item` 後面跟來源（source）與目的地（destination）。若目的地是一個已存在的資料夾，通常會沿用原檔名放進去；若寫的是新檔的完整路徑，就能替副本另取名字。我們選後者，因為執行之前就能說清楚哪個位置會多出檔案。別把「我要複製到這裡」誤寫成「從這裡複製」。

在練習區用檔案總管準備一個新的 `copy-room` 資料夾，用編輯器在裡面建立 `draft.txt`，第一行寫 `read`，第二行寫 `check`。顯示副檔名再存檔；若已有同名作品就使用新的空資料夾，以下起點一併換掉。先在編輯器儲存，終端機讀到的是磁碟上的版本，不是畫面上還沒存的字。

## 範例：用一道閘門擋下舊目的檔

在 PowerShell 從任何位置開始。`Test-Path` 檢查路徑存在與否，結果是 `True` 或 `False`。下面的 `if` 是一道條件閘門：只有括號內成立才做大括號內的事。`-not` 把有變成沒有、沒有變成有；之後在[〈if、elif 與 else〉](#/lesson/fd-python-03-branch)會用 Python 練同樣的判斷。

```powershell
Set-Location -LiteralPath 'C:\dev\stackway-lab\copy-room'
Get-Content -LiteralPath '.\draft.txt'
Test-Path -LiteralPath '.\review.txt'
if (-not (Test-Path -LiteralPath '.\review.txt')) {
    Copy-Item -LiteralPath '.\draft.txt' -Destination '.\review.txt'
}
Get-ChildItem -File
Get-Content -LiteralPath '.\review.txt'
```

第一次在新資料夾看見的應是 2 行原文、`False`、兩個檔名，以及副本中的相同兩行。`Get-ChildItem` 是列出內容，`-File` 只看檔案。若已看見 `True`，閘門不會寫入；後面讀到的可能是以前的舊副本，不能據此宣稱今天複製成功。在自己獨用的練習目錄操作，不把這個事前檢查當作多人同時寫入的保護。

在 macOS 或 Linux 的 bash，先在同樣準備好的新練習目錄開啟終端機。`pwd` 查起點，`ls` 查名稱，`cp -i draft.txt review.txt` 複製。若目的檔已在，互動選項會詢問是否取代，請回答 `n` 保留舊檔；複製後分別用 `cat draft.txt` 和 `cat review.txt` 讀取。指令雖然較短，先預測會讀哪份、寫哪份的原則沒有變。

## 常見錯誤：同名不代表同一份，沒印字也不代表沒做

來源和目的都寫成同一個檔名，沒有建立另一份的空間；改用不同路徑。若忘記指定資料夾，把東西複製到別的工作目錄，不能靠重複執行來找回它，應先確認目前位置。成功複製常常不會印出一整段通知，這正是要列檔名和讀內容的理由。

複製後分別從來源與目的地開檔。只看到兩份相同內容，還不能證明你知道正在編輯哪一份。

## 小結：改副本，不碰來源

只在副本末行加上校對記號，儲存後切回終端機，分別讀取原稿和副本。如果原稿仍是 2 行，副本已變成 3 行，你就有了比「看起來有兩個檔案」更強的證據，也留下了下次可以放心嘗試的材料。
