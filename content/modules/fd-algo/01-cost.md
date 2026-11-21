---
id: fd-algo-01-cost
module: fd-algo
order: 1
title: Big-O 時間與空間複雜度
subtitle: 先數操作，再談複雜度
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 估計輸入翻倍時比較次數的變化
  - 把一次掃描與雙層掃描配到案例
tags:
  - algo
  - complexity
resources:
  - title: 'Open Data Structures：漸近記號'
    url: 'https://opendatastructures.org/ods-python/1_3_Mathematical_Background.html'
    kind: book
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '讀 Big-O 小節，把次數和成長級別連起來。'
concepts:
  - id: fd-algo-cost-linear
    prompt: '一次完整掃描 n 筆資料，其固定成本比較次數如何成長？'
    answer: '每筆比較一次，次數為 n，時間為線性成長。'
    mcq:
      question: '8 筆改為 16 筆，一次完整掃描的比較次數如何改變？'
      options:
        - '保持不變'
        - '變 2 倍'
        - '變 4 倍'
        - '少一半'
      answer: 1
      explain: '每新增一筆就多比較一次，這不是平方成長。'
  - id: fd-algo-cost-pairs
    prompt: '為什麼每一對不同位置各比一次仍是平方時間？'
    answer: '共有 n(n-1)/2 對，除以常數不改變最高次項的成長級別。'
    mcq:
      question: '4 個不同位置，不比自己也不重複方向，共幾對？'
      options:
        - '4'
        - '8'
        - '6'
        - '16'
      answer: 2
      explain: '依序是 3、2、一對；16 則包含自比與反向重複。'
    interview:
      question: '同一個程式掃兩圈，能直接說它是平方時間嗎？'
      points:
        - '說清楚輸入大小'
        - '區分依序掃描與巢狀配對'
        - '用次數推導級別'
      answer: '不能。我會先數內層到底對每筆做幾次。2 趟完整掃描加起來是 2 倍筆數；若每筆還要配對後面所有筆，累加起來才是平方級。'
  - id: fd-algo-cost-space
    prompt: '只在迴圈中累計次數，為何輔助空間可視為常數？'
    answer: '使用固定數量的計數器與位置，沒有隨筆數保留每一對結果。'
practice:
  - id: fd-algo-cost-lab
    title: '留下一份操作次數對照'
    kind: code
    minutes: 9
    steps:
      - '儲存 count_work.py，先算 4 筆與 8 筆的預期次數。'
      - '再加 n=5，核對一次掃描與配對的數量。'
      - '在檔尾註解寫出次數與對應的成長級別。'
    checks:
      - '5 筆是 5 次掃描、10 對比較。'
      - '我能解釋沒有相同值時仍需要比較 10 對。'
---
## 為什麼要學
重複編號檢查在 4 筆範例上幾乎立刻完成，換成 4 10000 筆卻可能等很久。小資料上的秒數容易被電腦速度和背景工作淹沒。先別拿碼表，先數你要做多少次比較：多 1 倍資料，是多 1 倍工作，還是接近 4 倍？這個估算能在你拿到正式資料以前，就淘汰明顯不合適的做法。

## 核心概念
演算法 (algorithm) 是把輸入變成結果的一組步驟。時間複雜度 (time complexity) 看輸入規模成長時，基本操作的次數如何增加。本例用 `n` 表示編號個數，假定比較兩個小整數的成本固定。大 O 記號 (Big O notation) 描述漸近上界，實務比較通常挑能反映成長的緊上界；它不是秒數預測，也不是小樣本的速度排名。

一次掃描每個編號一次，工作量和筆數成正比，記作 `O(n)`。若要讓每 2 筆不重複的位置相互比較，第一筆配後面全部，第二筆少配一個，一直加到一；共 `n(n-1)/2` 對。除以 2 不會把平方成長變回線性，所以這段是 `O(n²)`。空間複雜度 (space complexity) 則問要留多少資料；以下只算輸入以外的輔助空間，不把已經收到的串列再算一遍。

## 範例：掃一次，還是把每一對都比過？
在 `C:\dev\stackway-lab\algorithms` 新建 `count_work.py`。先用紙筆數一輪比較做了幾次，再把輸入加長。看的是工作量的成長方式，而不是某台電腦剛好快幾毫秒。

在該目錄執行：Windows PowerShell 用 `py count_work.py`；macOS／Linux 用 `python3 count_work.py`。

```python
def work(ids):
    scans = 0
    near_zero = 0
    for item in ids:
        scans += 1
        if item < 2:
            near_zero += 1
    pairs = 0
    matches = 0
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            pairs += 1
            if ids[i] == ids[j]:
                matches += 1
    return scans, pairs, near_zero, matches

for n in [4, 8, 16]:
    print(n, work(list(range(n))))
```

輸出的前兩欄是做了幾次掃描與配對，後兩欄才是找到幾筆小於 2 的值、幾對相同值。找到 0 對不等於做了 0 次比較。對 4 筆先在紙上列配對位置：第 0 筆配第一、2、3 筆，第 1 筆再配第 2、3 筆，第 2 筆只配第 3 筆，共 6 對。換到 8 筆，一次掃描由 4 次變 8 次，配對則由 6 次變 28 次，不是剛好 4 倍。式子的低次項在小規模時還看得見。程式故意不提前退出，所以即使沒有任何相同編號，它仍需檢查每一對。

2 個計數器和 2 個迴圈位置不會隨輸入多存一整串結果，在通常的計數模型下，演算法輔助空間是 `O(1)`。若需求改為把所有配對都留下來，輸出本身就可能平方成長，不能只看巢狀迴圈外面有幾個變數。之後在[〈雜湊表與集合〉](#/lesson/fd-algo-02-hash)會細講：若只想知道有無重複，改記已看過的編號就能避開逐對檢查。

## 常見錯誤
不是看到兩個迴圈就判定平方。先掃一遍算總數、再掃一遍印結果，是相加而不是相乘；內層若固定跑 3 次，工作量同樣仍是線性。相反地，結果只有一個真假值，也不表示只做一次操作。要指定輸入規模、數哪項操作，以及是在最壞情況還是典型情況下說話。

## 小結
把工作量寫成能核對的次數，再把式子化為成長級別。分開看時間、輔助空間與輸出大小；這樣即使沒跑大資料，也能說清楚為什麼某種解法值得進一步測量。
