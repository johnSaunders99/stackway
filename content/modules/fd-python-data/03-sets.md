---
id: fd-python-data-03-sets
module: fd-python-data
order: 3
title: 集合與集合運算
subtitle: 兩份出席名單有誰重疊
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-data-02-tuples
objectives:
  - 以 set 去除重複並確認成員資格
  - 用交集與差集回答兩個不同的問題
tags:
  - python-data
  - sets
resources:
  - title: Python 教學：資料結構
    url: https://docs.python.org/zh-tw/3/tutorial/datastructures.html
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-data-03-unique
    prompt: "把 4 次含重複的掃描轉成集合，保住的是什麼？"
    answer: "保住不同成員，不保證原順序或次數。"
    mcq:
      question: "上午刷卡紀錄轉成集合後，不再保留原串列。仍可從集合得知什麼？"
      options:
        - "每張卡的掃描次數"
        - "完整掃描順序"
        - "最後掃描時間"
        - "出現過的不同座位"
      answer: 3
      explain: "只看集合不能還原同一值出現幾次。"
    interview:
      question: "要交出重複掃描次數和兩場重疊座位，你會只存集合嗎？"
      points:
        - "保留原始掃描次序與次數"
        - "另建集合做交集"
        - "報告分清筆數與不同座位數"
      answer: "不會。我保留原始串列來數掃描，再另建集合取共同座位。報告會標明一欄是掃描次數、另一欄是席數，重掃就不會混成多一名到場者。"
  - id: fd-python-data-03-intersect
    prompt: "找兩個時段都有的座位，選哪個運算？"
    answer: "用交集 morning & evening。"
    mcq:
      question: "morning 和 evening 是早晚場座位集合，哪個運算只留下兩場都有的座位？"
      options:
        - "morning - evening"
        - "evening - morning"
        - "morning & evening"
        - "morning | evening"
      answer: 2
      explain: "聯集只需一邊有，兩種差集則排除共同座位。"
  - id: fd-python-data-03-direction
    prompt: "evening - morning 問的是什麼？"
    answer: "晚場有而早場沒有的成員。"
    mcq:
      question: "morning 與 evening 分別是早晚場的座位集合。evening - morning 代表誰？"
      options:
        - "只出現在早場"
        - "只出現在晚場"
        - "兩場都有"
        - "兩場總掃描數之差"
      answer: 1
      explain: "集合差集在挑成員，不是兩個數量相減。"
practice:
  - id: fd-python-data-03-p1
    title: "交出早晚場座位對照"
    kind: code
    minutes: 10
    steps:
      - "執行 seats.py 並在輸出旁寫下各組意思。"
      - "先在晚場加一個重複的 B2，再加入原本只在早場的 A1。"
      - "保存腳本，註明兩次變動各影響哪份對照。"
    checks:
      - "初始 4 次掃描對應 3 席。"
      - "重掃 B2 不改交集。"
      - "加入 A1 後它從早場獨有移到交集。"
---

## 為什麼要學

活動有兩個時段，同一張座位卡可能被掃 2 次。要算「兩個時段都到場的座位」時，重複掃描不該多算一席；可要查「總共掃了幾次」時，重複反而是有意義的資料。集合（set）保留互不重複的成員，適合回答前一種問題。這堂只用虛構的座位代碼，不需姓名、帳號或其他能辨認個人的資料。

## 核心概念

可以把串列交給 `set(...)`，得到由不同值組成的新集合；也可寫 `{"A1", "B2"}` 直接列出成員。空集合必須用 `set()`，單獨的 `{}` 是空字典。成員測試（membership test）用 `in` 問某個值是否在集合裡，答案是布林值，不是它坐在第幾格。集合沒有承諾插入順序，不能靠 0 號索引取「第一個到場」；若順序或次數要保留，就先把原始紀錄留著。

交集（intersection）用 `a & b` 取兩邊都有的成員，交換左右不會改答案。差集（difference）用 `a - b` 取左邊有、右邊沒有的成員；方向一改，就在回答另一個問題。聯集（union）用 `a | b` 取至少一邊有的成員。畫兩個重疊圓時，先在紙上把問題用一句中文圈出範圍，再選運算子；不要因為有兩份名單就習慣性把它們加在一起。

## 範例：先留掃描紀錄，再比對座位

在 `C:\dev\stackway-lab\python-data` 存成 `seats.py`。在此以 PowerShell 執行 `py seats.py`；macOS 或 Linux 用 `python3 seats.py`。`sorted` 在這裡只把結果整理成固定順序方便讀，之後在[〈排序鍵與 lambda〉](#/lesson/fd-python-data-06-sort)會細講排序依據。

```python
morning_scans = ["A1", "B2", "B2", "C3"]
evening_scans = ["B2", "D4"]
morning = set(morning_scans)
evening = set(evening_scans)
print(len(morning_scans), len(morning))
print("both", sorted(morning & evening))
print("morning only", sorted(morning - evening))
print("evening only", sorted(evening - morning))
print("C3" in evening)
```

先數掃描行數再數座位：上午有 4 次掃描，只有 3 個不同座位。兩場都出現的只有第 2 號那張座位卡，不是出現 2 次就算成 2 席。上午獨有 2 席，晚場獨有 1 席，正好展示差集交換方向的效果。最後一個問題針對晚場，輸出為假不能說明這張卡從沒出現；它明明在上午清單裡。

再給晚場加一次相同的第 2 號，預測哪些輸出會改變。晚場原始掃描筆數增加，但成員沒增加，所以交集、兩個差集都應維持原狀。反過來加一張原本只在上午的座位，這張就會從上午獨有移到交集。這兩個測試一正一反，能驗明你在算的是「哪些座位」，而非碰巧把這一組輸入算對。

## 常見錯誤

看到集合列印的次序換了，就判定有成員不見；應比較成員或數量，需要穩定展示再排序。也別一開始就把原始清單覆寫成集合，這樣即使有人追問哪張卡被重掃幾次也無從回答。若需求是「依掃描順序保留第一次」，那同時有去重和保序兩個條件，只保留集合不足以交付。

## 小結

交付前把問題讀一遍：只知道某席出現過，無法反推它排第幾個進場。先決定要保住次數、順序還是成員，再決定用串列或集合。把兩個方向的差集連同問題文字留在報表裡，別交出一串不知道是早場還是晚場獨有的座位碼。
