---
id: fd-python-03-assign
module: fd-python
order: 3
title: 變數與指定運算
subtitle: 替一段練習時間取名字
status: ready
minutes: 25
level: 2
prereqs:
  - fd-python-02-values
objectives:
  - 用等號將整數指定給變數，再讀取變數
  - 手算第二次指定後兩個變數各自的值
tags:
  - python
  - assign
resources:
  - title: "Python 教學：用等號保存計算結果"
    url: https://docs.python.org/zh-tw/3/tutorial/introduction.html
    kind: doc
    lang: zh-Hant
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-python-03-assign-bind
    prompt: "讀 minutes = 15 時，哪一側先求值？"
    answer: "先求右邊的值，再讓左邊的名稱指向該值。"
    mcq:
      question: "minutes 原為 15，執行 minutes = minutes + 5 後是多少？"
      options:
        - "15"
        - "5"
        - "等式不成立而報錯"
        - "20"
      answer: 3
      explain: "右側先用舊值計算，新值才交回左側；不是數學等式。"
  - id: fd-python-03-assign-snapshot
    prompt: "把 minutes 指定給 saved 後，重新指定 minutes 會改動 saved 裡的整數嗎？"
    answer: "不會。兩個名稱原先指同一個整數，重新指定只改動左側那個名稱。"
    mcq:
      question: "saved = minutes 時值為 20，之後 minutes = 30；讀 saved 得什麼？"
      options:
        - "20"
        - "30"
        - "50"
        - "沒有值"
      answer: 0
      explain: "saved 當時取得的是整數，不是每次都重新執行的公式。"
    interview:
      question: "你要留下調整前的分鐘數，會怎麼確認沒有一起被更新？"
      points:
        - "調整前先另取名稱保存整數"
        - "逐行追蹤兩個名稱"
        - "更新後分別印出兩者"
      answer: "我會先把當時的整數指定給另一個名稱，再更新目前值。最後把兩個都印出來；若原來是 15、後來多 5，應該仍能同時看到 15 和 20。"
  - id: fd-python-03-assign-unbound
    prompt: "為什麼第一次用 minutes = minutes + 5 可能失敗？"
    answer: "右側要先讀取 minutes，若這個名稱尚未指定，便沒有舊值可用。"
practice:
  - id: fd-python-03-assign-p1
    title: "留下會印出前後差異的分鐘紀錄"
    kind: code
    minutes: 8
    steps:
      - "建立 minutes.py，執行前在紙上按行標記兩個名稱的值。"
      - "把增加量由 5 改成 8，再執行一次。"
      - "將保存舊值的一行暫移到更新之後，觀察差別後移回。"
    checks:
      - "加 8 時舊值 15、新值 23。"
      - "兩種行序的輸出不同，我能指出哪行讀到了新值。"
---

## 為什麼要學：同一段時間有昨天版和今天版

原先打算讀 15 分鐘，臨時多出 5 分鐘。你想把「原訂」和「調整後」都列出來；若只寫兩個神祕數字，隔天看程式很難知道哪一個是承諾、哪一個是結果。變數（variable）讓你替值取一個有意義的名稱，不必每次從頭重寫整個算式。

## 核心概念：等號是動作，不是提問

指定（assignment）的寫法是左邊一個名稱、當中一個等號、右邊一個能算出值的式子。讀的方向是**先右後左**。`minutes = 15` 是「讓 minutes 指到整數 15」，不是問兩邊是否相等。名稱可以用英文字母和底線組合，例如 `plan_minutes`；不要把單位混進數值本身。把 15 寫成字串「15 分鐘」，就不能直接用數字加法了。

重新指定時，右邊仍然先求值。`minutes = minutes + 5` 在數學等式中不合理，放在程式卻有清楚的先後：先看舊名稱指的是幾，把加完的新整數交給同一個名稱。這不會回到前面的行重算；程式檔每次執行都是從上往下走，已讀過的行不會因為名字換了值就自動更新。

## 範例：留下不能跟著漲的原訂時間

開啟 `C:\dev\stackway-lab\python-basics`，將範例另存為 `minutes.py`。把每次指定前後的值寫在紙上。右側要先算完才換掉左側的值，往回讀並不會讓舊值重新出現。

在該目錄執行：Windows PowerShell 用 `py minutes.py`；macOS／Linux 用 `python3 minutes.py`。

```python
minutes = 15
planned = minutes
minutes = minutes + 5
print(planned)
print(minutes)
```

拿一張紙，左欄標目前時間，右欄標原訂時間。第一行後只有左欄有數字；第二行後兩邊都指向 15。第三行先把左欄的 15 拿來計算，再在左欄寫 20；右欄沒有出現在等號左邊，仍是 15。最後兩行是依序看右欄和左欄，別把紙上欄位順序誤認為程式印出的順序。

現在換一個問題：若直到加完才做 `planned = minutes`，預測印出什麼？此時右邊已是 20，2 行就都是 20。差別不在於名字的英文意思，叫作「原訂」也不會自動保存歷史，能不能留下來取決於你在哪一行讀值。

## 常見錯誤：把名字當成一直活著的公式

在試算表裡，一格可以記住另一格的公式；這裡的整數指定不是那樣。也不要省略第一行就想用舊值加 5，沒有先替名稱指定值，Python 並不知道該從什麼起算。若看到名稱不存在的錯誤，先回頭找第一次讀取的位置，核對前面是否有同樣大小寫的名字，別先把所有名稱都換掉。

遮住畫面上的輸出，把舊值畫在左邊、新值畫在右邊，再指出哪個名稱仍保留左邊的值。若無法回答，檢查你保存的是加總前還是加總後的快照；改變名稱不會讓原本的值自動出現。

## 小結：需要舊值時，就在更新前替它取名

一個有用的檢查是用手指沿程式往下移，遇到等號只修改左邊那個名字，遇到印出才讀答案。把這張前後對照紙留在程式旁，下次要加上第二次延長，就知道應該更新哪一個名稱。
