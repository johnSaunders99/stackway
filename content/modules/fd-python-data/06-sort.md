---
id: fd-python-data-06-sort
module: fd-python-data
order: 6
title: 排序鍵與 lambda
subtitle: 同分時再按名稱排序
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-data-05-defaults
objectives:
  - 用 sorted 與 key 選擇比較欄位
  - 以 lambda 傳回複合鍵並核對同分結果
tags:
  - python-data
  - sort
resources:
  - title: Python：排序技法
    url: https://docs.python.org/zh-tw/3/howto/sorting.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-data-06-callable
    prompt: "sorted 的 key 參數要提供什麼？"
    answer: "提供能接收一項並傳回比較值的函式。"
    mcq:
      question: "要依每筆紀錄的分數排序，sorted 的 key 應傳入什麼？"
      options:
        - "呼叫函式算出的一個分數"
        - "全部分數加總後的值"
        - "每筆取比較值的函式"
        - "只用一個整數代表欄位位置"
      answer: 2
      explain: "傳函式本身，排序器會將各筆資料傳給它。"
    interview:
      question: "你會怎麼測一個高分優先、同分按代號的排行榜？"
      points:
        - "測高低分順序"
        - "準備逆序同分者"
        - "交換同分輸入再驗證"
      answer: "我會故意先放同分的 B 再放 A，並混入較高分的 C。結果要是 C、A、B；調換輸入後仍一樣，才能排除只是靠原順序碰巧排對。"
  - id: fd-python-data-06-mixed
    prompt: "數值分數降冪、代號升冪，在預設升冪下用哪個鍵？"
    answer: "用負分數、原代號組成的元組。"
    mcq:
      question: "分數 score 高者優先、同分按 code 升冪。sorted 採預設升冪時，鍵函式應回傳什麼？"
      options:
        - "(score, code)"
        - "(-score, code)"
        - "(code, -score)"
        - "(-score, -score)"
      answer: 1
      explain: "負號只套分數，代號放第二項且不反向。"
  - id: fd-python-data-06-stable
    prompt: "只按分數排序，兩筆同分資料的相對次序如何？"
    answer: "穩定排序會保留輸入時的相對次序。"
    mcq:
      question: "只用分數當排序鍵時，穩定排序對兩筆同分紀錄保證什麼？"
      options:
        - "保留輸入次序"
        - "一定照代號升冪"
        - "一定照代號降冪"
        - "隨機打散"
      answer: 0
      explain: "分數鍵相同不會自動推導另一個欄位。"
practice:
  - id: fd-python-data-06-p1
    title: "留下有同分反例的排行榜"
    kind: code
    minutes: 12
    steps:
      - "執行 ranking.py，把兩種輸出並排記錄。"
      - "交換同分紀錄在輸入中的位置，再跑相同腳本。"
      - "保留原輸入輸出與正確的複合鍵。"
    checks:
      - "高分 C 都排第一。"
      - "複合鍵結果一直是 C、A、B。"
      - "只按分數時同分次序跟隨輸入。"
---

## 為什麼要學

三條路線要按分數列在看板上。高分排前面，但同分時希望短代號依字母順序由小到大。若把所有欄位一律反過來，分數對了，代號卻顛倒了。排序鍵（sort key）讓我們先把「要比較什麼」從「最後要顯示什麼」分開：輸出仍是完整紀錄，暫時用來比較的可以只是分數，也可以是一組有先後的值。

## 核心概念

`sorted(資料, key=函式)` 會回傳新的串列，不必改動原來的順序。排序時，每項會交給鍵函式取出比較值。傳入的是函式本身，不是在這一行先替某一筆呼叫一次。匿名函式（lambda）是只有一個運算式的小函式，`lambda row: row[1]` 表示收到一筆紀錄，就取索引一的值當答案。若比較規則需要多行解釋，用有名稱的普通函式也可以，不必為了縮短而硬用匿名寫法。

複合鍵（compound key）可用元組表達。比較元組會先比第一項，相同才看第二項。假設分數是數值、代號是本題所用的大寫英文字母，將分數取負作第一鍵，就能在整體由小到大時讓原分數高者排前；第二鍵直接放代號即可維持升冪。這裡不是把原資料分數真的改成負數，而是替每筆準備一張只在排序時看的比較卡。

## 範例：同分時讓代號裁決

在 `C:\dev\stackway-lab\python-data` 存成 `ranking.py`，在該目錄用 PowerShell 執行 `py ranking.py`；macOS 或 Linux 用 `python3 ranking.py`。每筆依序是代號、分數，刻意把同分代號以相反順序輸入。

```python
rows = [("B", 8), ("C", 9), ("A", 8)]
score_only = sorted(rows, key=lambda row: row[1], reverse=True)
ranked = sorted(rows, key=lambda row: (-row[1], row[0]))
print("score", score_only)
print("ranked", ranked)
print("input", rows)
```

只看分數時最高的先出現，另外兩筆分數相同，仍照輸入先後排列。這是穩定排序（stable sort）：鍵相等時維持原有的相對次序，不是 Python 暗中替你猜第二個規則。複合鍵版本則是最高分之後先出現字母較前的代號。把那兩張比較卡寫出來，一張是負 8 配第二個字母，一張是負 8 配第一個字母，第一項相同，勝負就在第二項。

接著只交換輸入中兩個同分者的位置，兩種排序再跑一次。只看分數的版本會跟著改變同分順序，明訂代號規則的版本則不改變。最後一行印原始資料，能觀察新串列沒有把來源重排。若兩筆連代號與分數都相同，它們的比較鍵才真的完全相等；這時穩定性仍然保留這兩筆的原先順序。

## 常見錯誤

把 `reverse=True` 加在已含代號的整組鍵上，會連次要欄位都反轉，不能達到「主要降、次要升」。也要確認分數真是數字；若讀進來的是文字，字串按字元順序比較，10 與 2 就可能得到不合數值直覺的順序。先把資料形狀與型別釐清，再修改比較規則。

先固定輸入再改排序鍵，才能把輸出差異歸因到規則，而不是一開始就換了資料。

## 小結

寫下主鍵、同分條件、各欄方向，再把它們翻成一個鍵。驗收務必放一對逆序輸入的同分者；全部都是不同分的測試，無論怎麼寫第二鍵都可能看起來正確。
