---
id: fd-python-07-report
module: fd-python
order: 14
title: with 與文字檔讀寫
subtitle: 讀檔做出可重跑的摘要
status: ready
minutes: 35
level: 2
prereqs:
  - fd-python-06-function
objectives:
  - 用 with open 指定編碼逐行讀取，離開區塊後關閉檔案
  - 以明確編碼讀取本機紀錄
  - 對照手算結果檢查摘要且不改原檔
tags:
  - python
  - file-io
resources:
  - title: "Python 教學：檔案的讀寫與 with"
    url: https://docs.python.org/zh-tw/3/tutorial/inputoutput.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: "讀文字模式、編碼及逐行走訪段落。"
concepts:
  - id: fd-python-07-report-modes
    prompt: "讀原稿與重建摘要各應選什麼開檔模式？"
    answer: "原稿用 r，只讀不改；只有明確可重建的輸出使用 w，它會清除該檔舊內容再寫。"
    mcq:
      question: "要能反覆產生一份完整摘要，哪種配置符合需求？"
      options:
        - "同一路徑；都用 w"
        - "不同路徑；摘要一直用 a"
        - "不同路徑；來源 r、摘要 w"
        - "同一路徑；先用 w 再用 r"
      answer: 2
      explain: "重建要取代舊摘要但不能碰原稿；附加會讓同一摘要重複出現。"
    interview:
      question: "每天重跑的摘要筆數一直增加，你會先比對哪兩份資料？"
      points:
        - "保留只讀輸入作基準"
        - "核對輸出路徑與模式"
        - "同一來源連跑兩次比對結果"
      answer: "我會先手算一份小原稿，把它設成只讀的輸入，另外用 w 產生可重建的摘要。連跑兩次應該各只看到同一份總數；若多出一段，我會查是否誤用附加模式。"
  - id: fd-python-07-report-with-close
    prompt: "離開 with open 區塊時，檔案會怎麼樣？"
    answer: "結束這段管理範圍時會關閉檔案，即使途中有例外也會嘗試正常釋放資源。"
    mcq:
      question: "哪裡適合放逐行讀取檔案的迴圈？"
      options:
        - "來源關閉以後"
        - "在 open 之前"
        - "把檔名當作每行的清單"
        - "開啟來源的 with 縮排範圍內"
      answer: 3
      explain: "離開 with 後檔案已關閉；走訪檔名只會處理名稱裡的字元。"
  - id: fd-python-07-report-encoding
    prompt: "為什麼讀寫時都指定 UTF-8？"
    answer: "讓程式明確用與檔案一致的文字編碼解讀及寫出，不依賴不同環境的預設值。"
practice:
  - id: fd-python-07-report-p1
    title: "交付能重跑的文字摘要"
    kind: build
    minutes: 13
    steps:
      - "在新的檔案工作區建立 UTF-8 的 minutes-source.txt，依課文填 3 筆與一個空行；保存 file_report.py。"
      - "先手算總數，從同一工作目錄連跑兩次，用編輯器查看來源和摘要。"
      - "在測試用原稿末端加一行 5，重新產生摘要並對照。"
    checks:
      - "原 3 筆得到 43，第二次仍只有 1 行摘要，原稿未被程式改動。"
      - "自行加上第四筆後得到 48；中文單位可正常閱讀。"
---

## 為什麼要學：關掉視窗還能重算昨天那一頁

到目前為止，資料通常直接寫在程式裡，視窗一關，輸出就不容易帶走。現在讓練習紀錄住進一份文字檔，程式只負責讀和算，再把摘要另存。驗收不只是「今天印出 43」：明天用完全相同的原稿重跑，仍應得到同一行，而且原來三筆可以逐行查回去。

## 核心概念：檔案有角色，模式有後果

開檔（open）需要路徑、模式和文字編碼（encoding）。`'r'` 是讀取，`'w'` 是寫入並取代舊內容，`'a'` 是在末尾附加。本堂的原稿不可拿來當輸出；別為了少打一個檔名就讓兩個角色指向同一份資料。

> [!WARN]
> 寫入模式一打開就可能清掉舊內容，不是等到真正寫下第一個字才清。執行前先比對兩個檔名，只有摘要可以重建。

`with open(...) as source:` 表示在下方縮排區塊內使用這份開啟的檔案，離開時自動關閉。直接走訪它，每輪讀到一行文字，通常連行尾換行也在內；去掉首尾空白後，空行便可跳過。指定 `encoding='utf-8'` 是告訴 Python 如何把檔案的位元組解成文字，不能保證本來就用別種編碼儲存的檔會自動變成正確中文。

## 範例：原稿 3 筆，摘要只留一行

在 `C:\dev\stackway-lab\python-basics` 內新建空的 `report-room` 子目錄。用編輯器在裡面建立 `minutes-source.txt`，以 UTF-8（不含 BOM）儲存，4 行依序寫8、15、空行、20；數字請打半形 `8`、`15`、`20`。在**同一個子目錄**另存下方程式為 `file_report.py`，確認 `minutes-summary.txt` 是本次專用的可重建檔名。在這裡開 PowerShell，執行 `py .\file_report.py`；macOS 或 Linux 用 `python3 file_report.py`。

```python
total = 0
with open('minutes-source.txt', 'r', encoding='utf-8') as source:
    for line in source:
        value = line.strip()
        if value != '':
            total = total + int(value)

with open('minutes-summary.txt', 'w', encoding='utf-8') as report:
    report.write(f'合計 {total} 分鐘\n')
print(total)
```

第一個區塊結束時，原稿已經關閉；第二個區塊才打開另一份檔案。`write` 寫出給它的字串，不像 `print` 自動補上換行，所以句尾明寫換行符號。用編輯器打開摘要，應只有 1 行「合計 43 分鐘」。關閉檢視或重新載入後再比第二次結果，避免一直看著編輯器保留的舊畫面。

這裡也能做一筆空白對照：在另一個全新的練習子目錄放同一份程式與同名的空來源，不要清空原來的紀錄。沒有任何一輪加法時，總數會保留初始值 0；這和根本沒有來源檔、在開檔階段就失敗，是兩種應該分開回報的結果。

## 常見錯誤：程式在那裡，不等於你站在那裡

相對路徑從工作目錄算起，不是每次都從程式所在目錄算起。找不到來源時先查工作位置、檔名和副檔名，不要先建立一份同名空原稿讓錯誤消失。若某列寫的是「15 分」，整數轉換會失敗；本例約定只有整數文字和空行，不會把壞資料偷偷算成 0。先找該列並核對格式，再決定怎麼修正。

## 小結：用手算、重跑與原稿 3 方面驗收

先手算 8 加 15 加 20，再連跑兩次比較輸出。最後回到來源，確認仍有 3 個原始數字與中間的空行。這三種檢查分別回答算得對不對、重跑會不會重複，以及工具有沒有把別人的資料改掉。
