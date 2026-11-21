---
id: cr-design-01-frame
module: cr-design
order: 1
title: 需求訪談與範圍
subtitle: 先談使用者而不是畫方塊
status: ready
minutes: 25
level: 4
prereqs: []
objectives:
  - 以兩個問題界定範圍
  - 寫出一個可以計算的服務目標
tags:
  - design
  - scope
resources:
  - title: Atlassian：工程面試中的系統設計與協作
    url: https://www.atlassian.com/company/careers/resources/interviewing/engineering
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Google SRE Workbook：從使用者事件訂服務目標
    url: https://sre.google/workbook/implementing-slos/
    kind: book
    lang: en
    minutes: 12
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-design-01-frame-scope
    prompt: 哪一問最能決定報名回應之前要做多少工作？
    answer: 問學員要的是受理排隊還是確定取得席次。
    mcq:
      options:
        - 按鈕用什麼顏色
        - 畫面上的成功指受理還是確認
        - 先選哪個資料庫品牌
        - 通知信有幾段
      answer: 1
      explain: 「成功」的語意決定同步路徑，工具和外觀並不能回答這個問題。
    interview:
      question: 如果我只說「設計報名」，你最先問我什麼？
      points:
        - 釐清成功畫面的意思
        - 確認最後一席與衝突規則
        - 說明暫定範圍或品質目標
      answer: 我想先知道看到成功的人是不是已經拿到席次，再問最後一席撞在一起時能不能抽籤。若一定即時確認，我先設計單場不超收，付款先不放進來，另外和你約定多久要給出明確結果。
  - id: cr-design-01-frame-invariant
    prompt: 「不超收」與「95% 在 2 秒內答覆」的關係是什麼？
    answer: 前者是不能違反的正確性條件，後者是指定期間的品質目標。
    mcq:
      options:
        - 兩者平均後達標即可
        - 只要速度達標就可超收
        - 兩者分開驗收
        - 不超收代表回覆夠快
      answer: 2
      explain: 它們的失敗形式不同，不能互相抵銷。
  - id: cr-design-01-frame-full
    prompt: 正確且及時的「名額已滿」能否算入範例 SLO 的分子？
    answer: 可以。目標承諾的是快速給出正確結果，不是人人都錄取。
practice:
  - id: cr-design-01-frame-p1
    title: 寫出可反問的一頁範圍卡
    kind: explain
    minutes: 10
    steps:
      - 建立 scope.md，把兩個問題、暫定答案與不處理的事項寫在上半頁。
      - 下半頁列出正確性條件與速度公式，用範例計算；再改成只承諾受理，標出要改寫的那一句。
    checks:
      - 分母包含 200 筆有效嘗試，189 筆合格不達 95%。
      - 兩種成功語意的差異可從文件讀出，不靠資料庫品牌提示。
---

## 收到「設計報名系統」，先別畫資料庫
同一句題目，可能是社團替 20 人保留座位，也可能是熱門活動同時開賣。你準備談座位圖，面試官卻只想知道最後一個名額會不會被兩個人拿走。需求訪談 (requirements interview) 不是拖時間；你要用最少的問題找出會讓方案分岔的地方。問完之後，用對方能修正的一句話重述，不把自己的假設偷偷寫成事實。

## 用 2 個問題界定要守的承諾
第一個問題是「學員看到什麼就能放心離開畫面：已排隊，還是確定拿到名額？」這決定成功回應以前必須完成多少工作。第二個問題是「最後一席同時被兩人送出時，可以都受理後抽籤，還是必須當場只有一人成功？」這決定我們能不能延後確認。題目若沒有人回答，就明說先按「單場活動、即時確認、不超收」來設計；若答案改成抽籤，你會重畫受理流程。付款、選位和跨場改票先不處理。

功能需求說明使用者要做什麼，品質條件則界定做到什麼程度才算可用。不超收是正確性條件，一筆都不應容忍；回應有多快是服務水準目標 (SLO)，要附可觀察的分母、門檻與期間。滿額後盡快告知「未錄取」其實也是正確服務，不要讓速度指標誤獎勵超收，也不要為了漂亮的數字而把失敗送件從分母拿掉。

## 範例：把「秒回」換成能重算的一句話
本次練習約定：開放首 10 分鐘的所有有效報名嘗試中，至少 95% 在 2 秒內收到正確且明確的結果。時間從入口收到請求到回覆；成功取得席次或正確回覆滿額都算，逾時與不明狀態不算。假設當期確實收到 200 筆，其中快速確認 120 筆、快速且正確告知滿額 69 筆。其餘超時。建立 `C:\dev\stackway-lab\design-interview`，把 `scope.py` 存在裡面，執行 `py scope.py`；macOS／Linux 用 `python3 scope.py`。

```python
eligible, fast_confirmed, fast_full = 200, 120, 69
good = fast_confirmed + fast_full
print(f"{good / eligible:.1%}", good >= .95 * eligible)
```

結果是 94.5%，差 1 筆才達標。這不告訴你有沒有多賣，後者要另查已確認席次是否超過容量。反過來說，不超收也不代表每個人都等得起。白板上兩句分開，聽者才知道在追問延遲時不用犧牲名額正確性當交換條件。

## 常見錯誤
「可承受很多使用者」不是需求量；是同一分鐘造訪，還是一整天登入過？詢問的是能改變方案的尺度，必要時標上暫用的數字和待確認角色。也別一開始就把通知送達當完成條件；先問使用者是否能以報名結果頁為準。之後在[〈API 邊界與資料流〉](#/lesson/cr-design-02-api)會沿著這個結果頁，追到真正能證明席次的紀錄。

請對方用一筆快速但結果錯誤的回覆檢查承諾。它不應只因為夠快就被算進成功分子。

## 小結
畫第一個方塊前，應有一段可讀給對方聽的範圍：服務誰、何時算完成、哪一條絕不能破、這版刻意沒做什麼。這段話是後面每個取捨的判準。
