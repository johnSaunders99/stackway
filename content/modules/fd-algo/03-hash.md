---
id: fd-algo-02-hash
module: fd-algo
order: 3
title: 雜湊表與集合
subtitle: 用集合找重複紀錄
status: ready
minutes: 25
level: 2
prereqs:
  - fd-algo-02-array
objectives:
  - 以集合取代逐對比較
  - 說明節省時間付出的空間成本
tags:
  - algo
  - hash
resources:
  - title: 'Open Data Structures：雜湊碰撞與查找'
    url: 'https://opendatastructures.org/ods-python/5_1_ChainedHashTable_Hashin.html'
    kind: book
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '用碰撞示意圖理解查找成本，不必先讀推導。'
concepts:
  - id: fd-algo-hash-order
    prompt: '為什麼檢查重複時要先查集合才加入？'
    answer: '集合應表示當前項目以前出現過的鍵，先加入會讓它與自己命中。'
    mcq:
      question: 'K、M、M、K 依序掃描，第一個再度出現的是誰？'
      options:
        - 'K'
        - 'M'
        - '兩者同時'
        - '沒有'
      answer: 1
      explain: '按第二次出現的時間判斷，第三筆的 M 早於第四筆的 K。'
  - id: fd-algo-hash-payload
    prompt: '需要回報重複箱號的首見位置，集合少了什麼？'
    answer: '集合只記存在；應改用字典保存鍵與首見索引。'
    mcq:
      question: '哪種資料最適合直接查到某箱號第一次出現在哪裡？'
      options:
        - '只有箱號的集合'
        - '只存目前列號'
        - '箱號到首見索引的字典'
        - '按字母排序的箱號清單'
      answer: 2
      explain: '鍵對值能保留位置，而集合不附帶這項資訊。'
  - id: fd-algo-hash-trade
    prompt: '集合掃描的平均時間與最壞額外空間如何估算？'
    answer: '在一般短鍵查找假設下平均線性時間；全不重複時集合最壞佔線性空間。'
    interview:
      question: '換成集合之後，能向同事保證什麼、不能保證什麼？'
      points:
        - '平均成員查詢快'
        - '全不同時需要線性空間'
        - '不保證每次固定成本'
      answer: '我可以避免每讀一筆就把所有舊資料逐一重比。短鍵且雜湊分布正常時平均線性，但不會保證每次都只比較一次；箱號全不同時也得留下一整批鍵。'
practice:
  - id: fd-algo-hash-lab
    title: '輸出第一次撞號的位置'
    kind: code
    minutes: 10
    steps:
      - '保留 first_repeat.py 的集合版本，另寫會回報位置的函式。'
      - '以 enumerate 取得索引，用字典只記第一次見到的位置。'
      - '用原 4 筆資料印出箱號、首見索引與重複索引。'
    checks:
      - 'K、M、M、K 得到 M 與 0 起算的 1、2。'
      - '兩個不同箱號會回 None，不會回第一筆的索引。'
---
## 為什麼要學
匯入一串箱號時，要指出「掃描途中第一個再度出現的號碼」。把所有箱號排好再找相鄰重複，可能找出有重複，卻改掉了原來的出現順序。逐筆回頭檢查先前每個號碼雖然正確，資料一長會反覆做同樣的比對。這次讓已經看過的箱號自己形成一份查詢簿。

## 核心概念
集合 (set) 只保存不同元素，適合回答成員資格：「這個鍵以前有沒有出現？」字典 (dictionary) 則讓鍵連到值，適合記錄首見位置。Python 的集合和字典利用雜湊表 (hash table) 查找：先從鍵的雜湊值縮小候選位置，再確認鍵是否相等。兩個鍵可能有相同雜湊值，這叫碰撞 (collision)，不代表程式應把兩個不相等的鍵合併。

開始時集合是空的。準備處理某筆之前，它要剛好包含這筆以前出現過的不同箱號。先查詢，若命中就有一筆先前紀錄作證；沒命中才加入。這個先後順序不是寫法喜好：若先把眼前的箱號加入再問有沒有，每一筆都會替自己作證，連第一個號碼也被誤判成重複。

## 範例：按原順序抓第 1 次撞號
開啟 `C:\dev\stackway-lab\algorithms`，將範例另存為 `first_repeat.py`。在加入集合之前先查一次。把順序反過來時，連第一次出現的值也會被判成已經看過。

在該目錄執行：Windows PowerShell 用 `py first_repeat.py`；macOS／Linux 用 `python3 first_repeat.py`。

```python
def first_repeat(codes):
    seen = set()
    for code in codes:
        if code in seen:
            return code
        seen.add(code)
    return None

for batch in [["K", "M", "M", "K"], ["A", "B"], [], ["X", "X"]]:
    print(batch, first_repeat(batch))
```

第一批的第一個字母最先出現，卻不是最早重複的字母。前兩筆都未命中，集合內已有 2 種候選；掃到第三筆時命中的是第二種，答案就確定了，不需再看末筆。用集合保存歷史不等於照集合順序走訪；順序來自外層對原串列的掃描。若題目其實是找「首見位置最前且後來有重複的箱號」，答案可能不同，動手前要先問清楚出題者的意思。

在鍵是短箱號、雜湊分布正常的假設下，一次成員查詢和加入平均為常數時間，掃整份平均是線性時間。碰撞嚴重時不能保證每次固定只做一次比較。空間則隨已見的不同箱號成長，最壞所有箱號都不同，得保留整批。相較逐對檢查，這是拿額外空間換取較少的查詢工作，不是免費得到兩項改善。

## 常見錯誤
`{}` 在 Python 是空字典，不是空集合；空集合要寫 `set()`。若需求升級成「回報兩個位置」，僅用集合就少了首見位置，需要用字典把箱號映到索引，而且不要在重複時覆蓋原索引。測試也要有完全沒有重複的例子，確定掃到底才回 `None`，而不是在第一筆未命中時就提早結案。

## 小結
先用一句話定義「第一個重複」是哪個時刻，再讓集合精確代表那個時刻以前的歷史。只問存在就用集合，需要附帶位置或次數才用字典；做出這個選擇，也就能說清楚節省了哪些操作、額外保存了什麼。
