---
id: fd-systems-03-filesystem
module: fd-systems
order: 3
title: 檔案系統與目錄樹
subtitle: 程式關掉後，哪些資料還在
status: ready
minutes: 30
level: 2
prereqs:
  - fd-systems-02-memory
objectives:
  - 以路徑、目錄項目與檔案內容說明一次讀取
  - 區分檔案描述元、記憶體中的值與磁碟上的資料
tags:
  - systems
  - filesystem
resources:
  - title: "Python 教學：讀寫檔案"
    url: https://docs.python.org/zh-tw/3/tutorial/inputoutput.html
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-systems-03-filesystem-path
    prompt: "為什麼相同的相對路徑在不同終端機可能指到不同檔案？"
    answer: "查找從目前工作目錄開始；起點不同，同名目錄項目不一定連到同一份內容。"
    mcq:
      options:
        - "一律以執行檔所在資料夾為起點"
        - "起點由工作目錄決定"
        - "由描述元數字決定"
        - "一律以腳本所在資料夾為起點"
      answer: 1
      explain: "相對路徑需要起點，副檔名不參與選起點。"
  - id: fd-systems-03-filesystem-descriptor
    prompt: "開啟檔案後拿到的描述元有什麼用？"
    answer: "它識別行程中已開啟的資源，可透過檔案物件讀寫；它不是內容的副本。"
    mcq:
      options:
        - "識別仍開啟的資源"
        - "記住上次讀出的文字"
        - "保存可跨重啟使用的路徑"
        - "代表檔案的位元組數"
      answer: 0
      explain: "描述元有使用期限；關閉後不能拿舊號碼找回內容。"
    interview:
      question: "程式記下開檔時的數字，想下次啟動拿來接著讀。你會改存什麼？"
      points:
        - "描述元只在開啟期間有效"
        - "保存路徑與必要的位置資訊"
        - "重開時確認指向預期資料"
      answer: "我會存可重新定位的路徑；若需要接續才多存進度。下次先重開並確認檔案沒有被換掉，再依進度讀取。舊的描述元可能已經被分給別的檔案。"
  - id: fd-systems-03-filesystem-snapshot
    prompt: "關閉檔案後，先前 read 得到的字串還能讀嗎？"
    answer: "可以。已讀出的字串是記憶體中的值，只要仍有參照，就不必保持檔案開啟。"
    mcq:
      options:
        - "不能，關閉等同刪檔"
        - "不能，字串只是讀取位置的別名"
        - "要先重新開啟描述元"
        - "能，字串已讀入記憶體"
      answer: 3
      explain: "關閉釋放的是開啟的資源，不會抹去已讀出的值。"
  - id: fd-systems-03-filesystem-persist
    prompt: "把讀到的字串重新指定成別的文字，磁碟檔案會改變嗎？"
    answer: "不會。重新指派變數只改行程內的參照，要改磁碟內容必須做明確的寫入。"
practice:
  - id: fd-systems-03-filesystem-lab
    title: "留下檔案、字串與開啟狀態的對照"
    kind: code
    minutes: 12
    steps:
      - "在新的練習子目錄建立正文的 tree.py 並執行。"
      - "在編輯器重新開啟產生的 note.txt，將內容與程式列印的舊字串並列記下。"
    checks:
      - "磁碟檔案是 second，而舊字串仍是 first。"
      - "我能指出 with 結束後哪個物件的 closed 是 True。"
---

## 為什麼要學：編輯器看到新字，程式卻顯示舊字

你把筆記從第一版改成第二版，程式卻仍然印出第一版。是存檔失敗，還是它根本沒有再讀？把檔案系統（file system）想成一套替資料取名字、找到它、再開啟它的規則。從路徑到螢幕上的字，至少經過了幾個可以分開檢查的步驟。

## 核心概念：名字、開啟狀態、讀出的值

目錄（directory）裡有目錄項目，好比一本索引，記下這層有哪些名字可以往下找。讀取 `shelf/note.txt` 時，先從工作目錄找到名為 `shelf` 的子目錄，再找裡面的 `note.txt`。這是相對路徑（relative path）；它不必包含磁碟機名稱，但你得知道從哪裡開始走。資料夾的名字不是檔案的內容。

開檔成功後，Python 交給你一個檔案物件。它背後的檔案描述元（file descriptor）是這個行程辨識開啟資源的數字；在 Windows，底層還會對應系統控制代碼。呼叫 `read()` 才真正取得資料，文字模式下會用指定編碼轉成字串。關閉是把開啟的資源交還；它既不是刪除磁碟內容，也不是銷毀已經交給你的字串。

## 範例：留下舊字串，再打開新內容

在練習區建立全新的空資料夾 `tree-lab`，存入 `tree.py`，從這個資料夾用 `py tree.py` 執行；macOS 或 Linux 用 `python3 tree.py`。本例只改寫這次示範專用的 `shelf/note.txt`，不要把名稱換成自己的筆記。

```python
from pathlib import Path

folder = Path("shelf")
folder.mkdir(exist_ok=True)
path = folder / "note.txt"
path.write_text("first", encoding="utf-8")
with path.open(encoding="utf-8") as handle:
    old = handle.read()
    print("open", handle.fileno(), handle.closed)
path.write_text("second", encoding="utf-8")
print("closed", handle.closed)
print("old", old, "new", path.read_text(encoding="utf-8"))
```

請沿著最後一行的兩個來源回頭讀。左邊取的是記憶體裡已有的值；右邊順著同一路徑重新開檔，才會看見第二次寫下的內容。嘗試只改最後一行，讓兩邊都印 `old`。就算螢幕上都是第一版，用編輯器重新開啟磁碟上的檔案仍是第二版，因為列印沒有改變儲存狀態。

### 用目錄樹解釋一個反例

想像練習區還有另一個同名的筆記，但放在另一個資料夾。只告訴同學「打開筆記」，對方不一定找到相同內容；告訴對方先進哪一層、再找哪個名字，才是可以重做的步驟。現在把這件事套回程式：若換到上層執行，範例可能建立另一個展示資料夾而不是找不到檔案，因為它本來就有建立目錄的程式。兩個資料夾各自打開看，比對照最後一行文字更能發現起點弄錯。追查意外檔案時，先解釋路徑，不要急著把其中一份刪掉。

## 常見錯誤

找不到檔案時，先在 PowerShell 以 `Get-Location` 檢查起點；在其他系統可用 `pwd`。即使用絕對路徑啟動腳本，工作目錄也不會自動切到腳本旁邊。另外，`with` 區塊結束後，檔案物件可以告訴你它已關閉，卻不能再用它讀取。要讀新版就開新的物件，而不是猜下一個描述元的數字。

## 小結

先問從哪個目錄找哪個名字，再問哪次開啟、哪次讀取。磁碟資料變了不代表記憶體裡的舊值會更新；只要能指出是哪一次讀取得到的，就能解釋兩個版本為什麼同時存在。
