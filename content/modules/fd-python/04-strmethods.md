---
id: fd-python-04-strmethods
module: fd-python
order: 4
title: 字串與字串方法
subtitle: 把輸入的首尾空白去掉
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-03-assign
objectives:
  - 用引號建立字串並比較長度
  - 以 strip 與 replace 取得新字串，確認原值不會自己改變
tags:
  - python
  - strmethods
resources:
  - title: "Python 內建型別：str.strip 與 str.replace"
    url: https://docs.python.org/zh-tw/3/library/stdtypes.html
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-04-strmethods-strip
    prompt: "strip() 沒有給參數時會移除哪裡的字元？"
    answer: "只移除首尾空白字元，不移除中間的空格。"
    mcq:
      question: "'  a b  '.strip() 的結果是哪個？"
      options:
        - "'a b'"
        - "'ab'"
        - "'a b  '"
        - "'  a b'"
      answer: 0
      explain: "兩端都會處理，中間的空格屬於內容。"
  - id: fd-python-04-strmethods-new
    prompt: "為什麼只寫 raw.strip() 下一行再印 raw，空白還在？"
    answer: "字串不會原地修改；方法回傳新字串，必須使用結果或另存。"
    mcq:
      question: "想保留原稿又要可讀的結果，該怎麼寫？"
      options:
        - "raw.strip() 後只讀 raw"
        - "clean = raw.strip()"
        - "clean = len(raw)"
        - "raw = raw.strip() 後只留 raw"
      answer: 1
      explain: "另取名稱才能同時保留 2 個值；長度也不是清理後的文字。"
    interview:
      question: "系統要求保留原始輸入又要顯示乾淨標籤，你怎麼測？"
      points:
        - "原始與整理後使用不同名稱"
        - "說明首尾與內部的差別"
        - "用邊界標記或長度比對"
      answer: "我用一筆兩端有空格、中間有短橫的文字做測資。先去首尾空白，再替換短橫，把新結果另外存；最後我會核對原字串的長度沒變，而顯示用的那份已經整理好。"
  - id: fd-python-04-strmethods-replace
    prompt: "要將句中的短橫換成空格，為何選 replace 而不是 strip？"
    answer: "replace 按指定的舊片段換成新片段，作用位置不限於兩端。"
practice:
  - id: fd-python-04-strmethods-p1
    title: "做一份有邊界標記的文字校樣"
    kind: code
    minutes: 9
    steps:
      - "建立 clean_note.py，先圈出哪些空格應該保留。"
      - "把資料換成兩端各 1 格的 ' 風-向 '，先手算長度再跑。"
      - "把短橫改成 2 個，觀察替換後內部有幾個空格。"
    checks:
      - "第二組原長 5、整理後長 3，2 個中文字仍在。"
      - "第三組中間保留 2 格；原字串中的短橫沒有消失。"
---

## 為什麼要學：看不見的空白也是資料

你替今天的練習取標籤，輸入「讀書」，卻在結尾多按了一下空白。畫面看起來差不多，程式收到的是不同的字串（string）。若直接把所有空格都砍掉，又會害「早上 練習」兩個詞黏在一起。清理之前先分清楚，哪些是意外留在邊緣的字元，哪些是原本就要保留的內容。

## 核心概念：點號後面的工具會交回新值

用成對的引號建立字串。引號不算在值裡，兩邊與中間的空格則算。`len` 可以數出字串的長度，在今天的簡單文字中，一個英文字母或一個空格都算一個位置。不要把螢幕上占幾格寬跟這個數字混為一談，中文字比較寬也不等於一定要算 2 個。

方法（method）是由特定值提供的操作，寫成「值、點號、方法名、括號」。`raw.strip()` 取得去掉首尾空白後的字串；`raw.replace('a', 'b')` 取得把出現的舊片段換成新片段的結果。括號裡舊的在前、新的在後。Python 的字串不可變（immutable），意思是原來的字串內容不會被這些方法改寫；要保留新結果，就像上堂一樣用等號接住它。

## 範例：把標籤整理成可以校對的 2 份

在 `C:\dev\stackway-lab\python-basics` 新建 `clean_note.py`。先保留原字串，再對照清理後的字串。視窗裡看不出尾端的空白時，有什麼證據能分辨兩者？

在該目錄執行：Windows PowerShell 用 `py clean_note.py`；macOS／Linux 用 `python3 clean_note.py`。

```python
raw = '  lab-note  '
trimmed = raw.strip()
label = trimmed.replace('-', ' ')
print('[' + raw + ']', len(raw))
print('[' + label + ']', len(label))
```

方括號是刻意加上的墨線，讓原本不容易分辨的空白有邊界。原稿由 8 個內容字元加上首尾各 2 個空格構成，長度 12；短橫換成一個空格，不增減長度，去除首尾之後剩 8。`print` 在兩份要顯示的值中間用逗號分開，會依序印出文字與長度。不要把為了觀察才加上的方括號，也算進原稿的長度。

若換成 `'a-b-c'`，不指定次數的替換會處理 2 個短橫，不只第一個。如果原本沒有短橫，結果內容看起來與先前一樣，也是合理結果。把這兩種測資放在一起，就能分辨工具到底是在處理所有符合的片段，還是在固定位置刪除一個字。

## 常見錯誤：選錯要清理的那一份

光寫 `raw.strip()` 而沒接住，下一行再讀原稿仍有空白。另一個難察覺的錯誤，是先算出整理過的值，第二步卻回去拿原稿替換；中間步驟沒有被接上，首尾空格當然又出現。用手指循著每行點號前的名稱，就知道那一步從哪份文字出發。

若你想保留字串中間的空格，只清頭尾，比對清理前後的長度之外，也要指認中間的字是否還在。

## 小結：先保留，再整理，再比對

原稿是方便重查的證據，標籤是要拿來顯示的新資料。兩個名稱不要混用，並用邊界與長度證明改了該改的部分。這比看到一行差不多的文字就說成功，更能抓到真正的清理錯誤。
