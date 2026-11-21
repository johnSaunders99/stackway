---
id: cr-coding-09-practice
module: cr-coding
order: 9
title: 演算法分週練習
subtitle: 隔天不看答案再做一次變形題
status: ready
minutes: 30
level: 4
prereqs:
  - cr-coding-08-grid
objectives:
  - 用 CSES 遞增陣列與場次安排規劃前 2 週：先掃描，再練排序與貪婪法
  - 用課程排序與網格路徑規劃後 2 週：先標圖的入度，再手推二維狀態
  - 每週選 2 次半小時；第一次做基準解與反例，隔日不看解答重做，週末用 5 分鐘口述取捨
tags:
  - coding
  - practice
resources:
  - title: CSES：遞增陣列
    url: https://cses.fi/problemset/task/1094
    kind: interactive
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: CSES：場次安排
    url: https://cses.fi/problemset/task/1629
    kind: interactive
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: CSES：課程先後順序
    url: https://cses.fi/problemset/task/1679
    kind: interactive
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: CSES：有障礙的網格路徑
    url: https://cses.fi/problemset/task/1638
    kind: interactive
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-coding-09-practice-recall
    prompt: 第二次半小時最能測到獨立回想的安排是什麼？
    answer: 隔日關掉解答，從空白檔重作並跑一筆變形。
    mcq:
      options:
        - 跟著前次程式逐行打
        - 閉卷重作再跑變形
        - 重看相同影片
        - 只計算本週開過幾個題目
      answer: 1
      explain: 熟悉畫面和獨立重建是不同能力，變形可進一步測適用條件。
    interview:
      question: 同一題第二次寫得更快，怎樣確認不是背起來而已？
      points:
        - 隔日閉卷
        - 改動能區分策略的案例
        - 說出前提與反例
      answer: 我會先不看舊程式，換一筆連續下降的輸入，要求自己指出每一步的比較基準。如果能預測原始前項解法在哪一步少算，我才會把這個觀念打勾。
  - id: cr-coding-09-practice-scan
    prompt: 遞增陣列掃到低谷時，應拿哪個高度來補？
    answer: 前方已修正後必須維持的高度。
    mcq:
      options:
        - 原始前一項必然足夠
        - 下一項的原始高度
        - 已修正的前方高度
        - 整個陣列的最小值
      answer: 2
      explain: 連續低谷時，原始前項可能也已被往上補過。
  - id: cr-coding-09-practice-transfer
    prompt: 週末只有 5 分鐘，留下什麼比背程式碼有用？
    answer: 口述策略的成立理由、付出的成本與一種使原策略失效的前提改動。
practice:
  - id: cr-coding-09-practice-p1
    title: 排好四週而不預支完成紀錄
    kind: build
    minutes: 12
    steps:
      - 建立 weeks.md，依序放入四道題；每週預留兩個相隔 1 天的半小時，以及週末 5 分鐘。
      - 每列寫基準解、隔日變形與口述追問，今天只完成第一題的小例與預期。
    checks:
      - 週表分清已排定與已完成；四道題各有不同的變形。
      - 遞增陣列範例輸出 5 與 0，能指出連續低谷錯解在哪一項少算。
---

## 為什麼隔天要換一筆資料再做？
看過詳解後重新打出相同程式，往往比第一次快很多，卻不能證明遇到變形也會做。本堂要產出的不是今天再過一題，而是一張能用 4 週的練習表。每週選 2 次半小時，相隔 1 天；週末再排 5 分鐘只用口頭說明。能抽走範例、改一個前提，仍說得出哪裡要改，才把那一格記為完成。

## 第 1 次留下基準，第 2 次測回想
第一次練習用前 5 分鐘把題目改寫成自己的輸入輸出，中間 15 分鐘做小規模可信的基準解 (baseline)，最後 10 分鐘挑出一筆能打敗直覺算法的資料，寫上預期。隔日關掉前次程式，以空白檔重作；先跑昨天那筆，再改一條規則或資料特性。這樣可以分辨自己記住的是測資排列，還是成立的理由。週末口述時不開編輯器，只講選擇、代價與失效條件。

### 4 週各自帶走一項證據
1. 遞增陣列：一次操作只把一個值加 1，使序列不下降。先手動補平每個低谷，再掃描目前須維持的高度。原本相等不用補；隔天用連續下降測你是否錯拿原始前一項比較。
2. 場次安排：先用少量場次列出所有相容選項，再與最早結束法比。隔天加一場跨過兩個短場的長場，並解釋改成票價最大時哪句交換證明不再夠用。
3. 課程排序：畫入度表再列一份合法順序，隔天加一條反向邊。要能分清在環上的工作和單純被堵住的下游；別因兩份合法順序不同而判錯。
4. 網格路徑：從可走的起點畫箭頭，用紙列出最小圖的全部走法，再填格子。隔天把障礙搬到第一列，解釋為何不能把整條邊界初始化為 1。

## 範例：從第 1 週抽出可跑的驗收題
在 `C:\dev\stackway-lab\coding` 存 `raises.py`，執行 `py raises.py`；macOS／Linux 用 `python3 raises.py`。非空整數序列中第一項不用動；後一項只需補到能和已修正的前項相接。

```python
def raises(a):
    high, moves = a[0], 0
    for x in a[1:]:
        moves += max(0, high - x)
        high = max(high, x)
    return moves
print(raises([5, 3, 2]), raises([2, 2, 3]))
```

先把 3 補成 5 要 2 步，接著 2 面對的是已修正的 5，又要 3 步。若只記原始的 3，會把第二次少算 2 步。這種「錯在哪個時刻」的記錄，比把同一段解答貼四份更值得留在週表上。

若某週只能做第一次，第二次保留為待練，下一次從那筆反例接續；不必補填一個其實沒有進行的閉卷成績。

## 常見錯誤
把觀看解答的時間也填作閉卷練習；或者一題卡住便馬上換掉整週主題。若時間到還沒跑通，照樣保留當時的失敗樣本，註明卡在理解題意、設計狀態或實作邊界。第二次先針對那一項工作，不必把其他已會的步驟全部從頭讀一遍。

## 小結
週表記的是能重現的證據，不只是題數。第一次取得對照，隔日證明能遷移，週末說出代價；4 週後，拿最容易忘的那一項再變形一次。
