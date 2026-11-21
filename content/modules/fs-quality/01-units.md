---
id: fs-quality-01-units
module: fs-quality
order: 1
title: 單元測試與相依隔離
subtitle: 選一個規則寫單元測試
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 把純計算與外部相依分開
  - 驗證一般、邊界與錯誤輸入
tags:
  - quality
  - unit-test
resources:
  - title: "Node.js：內建測試執行器"
    url: "https://nodejs.org/api/test.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-quality-01-units-unit"
    prompt: "運費滿額規則的單元測試，哪個邊界最有價值？"
    answer: "門檻前、剛好等於門檻以及超過門檻"
    mcq:
      options:
        - "只測一筆很大的金額"
        - "只確認畫面排版正確"
        - "只測付款服務登入成功"
        - "門檻前、剛好等於門檻以及超過門檻"
      answer: 3
      explain: "兩側與等號能區分大於和大於等於，畫面及外部登入不是這個規則。"
    interview:
      question: "需要讀取活動設定的運費功能，單元測試該測哪裡？"
      points:
        - "分開取得門檻與套用規則"
        - "用固定整數金額和門檻"
        - "驗證等號與非法值"
      answer: "我先把金額和門檻傳進純函式，測門檻前後、剛好相等與負數。讀遠端設定另寫整合測試，這樣網路掛了不會被誤報成運費公式壞掉。"
  - id: "fs-quality-01-units-pure"
    prompt: "要讓運費測試每次可重播，應如何處理今日優惠門檻？"
    answer: "把已取得的門檻當參數傳給計算函式。"
    mcq:
      options:
        - "把已取得的門檻當參數傳給計算函式。"
        - "每次測試都問正式服務。"
        - "在函式內讀目前時間碰運氣。"
        - "測試只要沒拋錯就通過。"
      answer: 0
      explain: "把外部相依留在邊界，核心規則就能用固定輸入比對。"
  - id: "fs-quality-01-units-error"
    prompt: "負數不符合金額規格時，要驗證什麼？"
    answer: "函式明確拒絕負數，而非回傳合法運費。"
    mcq:
      options:
        - "只檢查一般金額仍可計算。"
        - "函式明確拒絕負數，而非回傳合法運費。"
        - "允許負數自動變成免運。"
        - "略過該案例以保持全綠。"
      answer: 1
      explain: "錯誤輸入的行為也是契約，需用能捕捉拒絕的斷言。"
  - id: fs-quality-01-units-oracle
    prompt: "為何不能直接用同一個運費函式產生預期值？"
    answer: "若函式錯了，實際值與預期值會一起錯。預期應來自規格、已知案例或獨立的計算。"
practice:
  - id: "fs-quality-01-units-p1"
    title: "寫下能抓到等號錯誤的測試"
    kind: "hands-on"
    minutes: 12
    steps:
      - "儲存運費測試並執行"
      - "把比較運算子改成嚴格大於重跑"
      - "保留失敗的案例名稱與修正後的通過結果"
    checks:
      - "只有等於門檻的有效案例會抓到這次改壞"
      - "負數案例確實驗證拋出錯誤"
---

## 為什麼要學：差一元，這筆訂單該不該收運費？

規格寫「滿 500 元免運」，類似的程式可能有兩種：大於 500 才免運，或剛好 500 就免運。用 800 元測試兩個版本都會過。單元測試（unit test）把一個小規則獨立拿出來，替容易寫錯的差異選擇有辨識力的輸入，不能只挑最討喜的成功例子。

## 核心概念：隔開資料從哪來與規則怎麼算

純函式（pure function）只根據參數算結果，不依賴現在時間、資料庫、網路或畫面。活動門檻可能來自設定服務，運費函式不用自己打開連線，把已取得的門檻當參數即可。這就是相依隔離：把變動留在外層，不是把所有東西都替換成假的。若函式只是做加減與比較，本來就不用建假的資料庫。

測試分成安排、執行、斷言（arrange, act, assert）。安排固定條件，呼叫正在驗證的函式，再用斷言比對結果；預期答案須來自規格，不能用被測函式自己算自己。以分為單位的整數可讓金額界線明確。一般案例驗證常態，邊界案例辨認等號，錯誤案例確定不合法資料不會被當成一張免運訂單。

## 範例：讓 Node 自己回報是哪條規則壞掉

為能獨立重跑的測試建立 `C:\dev\stackway-lab\quality`。建立 `shipping.test.mjs`，執行 `node --test shipping.test.mjs`。使用 Node 內建測試執行器，不需安裝套件。為方便第一次重播，把函式與測試放在同一檔；專案裡可以改成匯入實際函式，而不要複製第二份公式來測。

```js
import test from "node:test";
import assert from "node:assert/strict";
function fee(cents, threshold) {
  if (![cents,threshold].every(Number.isSafeInteger) || cents < 0 || threshold <= 0)
    throw new RangeError("invalid amount");
  return cents >= threshold ? 0 : 6000;
}
for (const [cents,expected] of [[20000,6000],[49999,6000],[50000,0],[50001,0]]) {
  test("fee for " + cents, () => assert.equal(fee(cents,50000),expected));
}
test("reject negative", () => assert.throws(() => fee(-1,50000), RangeError));
```

先看每個測例名稱，再只改等號。若測試永遠全綠，不代表程式完美，也可能是樣本沒碰到有差異的位置。這個小小的刻意更動讓你確定測試真的能保護那條需求；試完把規則還原，別順手把預期改成錯的答案以換回綠燈。

### 把行銷決定和程式錯誤分開

現在活動只調整免運門檻，沒有修改運費公式。用同一個金額和兩種門檻各呼叫一次，就能驗證活動設定確實由參數進入；如果兩次永遠一樣，可能是函式裡偷偷寫死了一個值。再把測試的預期結果寫成不含程式碼的話：「同一筆消費在舊活動未滿額，在新活動剛好滿額」。這句話可以拿給決定規格的人核對，避免程式和測試都用了同一個錯字還互相認證。這也說明為什麼不是樣本越多越好：十筆都遠離門檻的訂單，未必比一筆剛好站在線上的訂單有效。

## 常見錯誤與小結

不要把「函式被呼叫一次」當作金額算對的證據。對外承諾是收多少錢或拒絕哪些輸入，不是內部用哪一個條件式。若要證明畫面顯示免運，還要在元件層驗；若要證明訂單實際寫入，則留給整合測試。把每種證據留在能回答那個問題的最低一層。
