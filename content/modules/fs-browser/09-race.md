---
id: fs-browser-04-race
module: fs-browser
order: 9
title: 請求競爭與過期回應
subtitle: 後發先至的回應
status: ready
minutes: 35
level: 3
prereqs:
  - fs-browser-08-cancel
objectives:
  - 用延遲的假資料重現舊回應蓋過新回應
  - 以請求編號忽略過期結果
tags:
  - browser
  - promise
resources:
  - title: "React 文件：忽略已失效的查詢結果"
    url: https://react.dev/reference/react/useEffect#fetching-data-with-effects
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-04-race-latest
    prompt: "連續搜尋兩次，畫面應以哪一個條件決定結果？"
    answer: "以最新一次使用者意圖決定，不是以最後完成的回應決定。"
    mcq:
      options:
        - "最後完成的搜尋"
        - "耗時最長的搜尋"
        - "資料量最大的搜尋"
        - "最新一次發出的搜尋"
      answer: 3
      explain: "回應到達順序不能代表意圖順序。"
  - id: fs-browser-04-race-token
    prompt: "編號應該何時取，何時比？"
    answer: "送出時先遞增並保存本次編號，準備寫入畫面前比對目前最新編號。"
    mcq:
      options:
        - "完成才編號、送出前比"
        - "送出時只比一次，回來就寫入"
        - "送出時取、寫入前比"
        - "回應時才取目前最新號碼當作自己的號碼"
      answer: 2
      explain: "完成才取號會把最後抵達誤當最新意圖。"
  - id: fs-browser-04-race-other
    prompt: "錯誤與載入提示也需要檢查編號嗎？"
    answer: "需要。過期的失敗或收尾也可能蓋掉新結果或提早關掉新工作的載入提示。"
    mcq:
      options:
        - "只有成功才有先後"
        - "需要，任何畫面寫入都有可能過期"
        - "只有失敗才需比對"
        - "只要延遲固定便不需要"
      answer: 1
      explain: "守住的是目前畫面的所有狀態，不只資料內容。"
    interview:
      question: "加了取消後偶爾仍看到舊搜尋訊息，你會再加哪道檢查？"
      points:
        - "每次新意圖產生不同編號"
        - "寫入前確認仍是最新"
        - "成功、錯誤與載入收尾都要受約束"
      answer: "取消可以省去舊工作，但已經完成或不能取消的步驟仍可能回來。我會讓本次編號和最新編號比對，過期就不寫畫面；再用固定延遲反轉到達順序驗證。"
practice:
  - id: fs-browser-04-race-lab
    title: "保存一次超車的對照頁"
    kind: code
    minutes: 14
    steps:
      - "建立 race.html，開啟後分別觀察沒有保護與有保護的欄位。"
      - "將兩個延遲對調後重跑，把兩種完成順序與最後畫面寫入 race-notes.txt。"
    checks:
      - "舊工作較慢時，未保護欄停在舊字；受保護欄停在新字。"
      - "對調速度後，受保護欄仍顯示新查詢。"
---

## 為什麼要學：最後抵達的不一定是最新一筆

你先查「紙」，接著把字補成「紙膠帶」。第二次剛好比較快，畫面先顯示正確品名，過一會卻退回比較寬的搜尋。這不是資料庫把資料改回去了，而是兩筆各自正確的回應，以相反順序改了同一塊畫面。只測一筆一筆慢慢輸入，往往看不到問題。

## 核心概念：為一次意圖留下一張號碼牌

把每次開始查詢當成一個新意圖。請求編號（request ID）在這裡是頁面自己產生的流水號，不必由網路服務提供。共享的 `latest` 表示目前畫面等哪一筆；每次呼叫裡的 `mine` 則記得自己是第幾筆。兩者不能都是共享變數，否則回來時大家看到同一個號碼，根本無從辨認來源。

當作業完成，先問「現在還輪得到我嗎」，再決定要不要寫入。編號與速度無關：不是特別偏愛快速回應，也不需要猜哪個字比較長。即使後來又搜尋了相同的字，也應該被視為新的意圖，這就是不用關鍵字本身充當號碼牌的原因。

## 範例：在同一個頁面並排 2 種策略

把以下內容存成 `browser-lab/race.html` 並開啟。假查詢只回傳輸入字，透過固定延遲安排誰超車。兩欄得到的是完全相同的回應，唯一差別是寫入前的判斷。

```html
<!doctype html>
<meta charset="utf-8">
<title>查詢對照</title>
<p>直接寫：<output id="raw"></output></p>
<p>先比編號：<output id="safe"></output></p><pre id="log"></pre>
<script>
let latest = 0;
const find = (q, ms) => new Promise(ok => setTimeout(() => ok(q), ms));
async function search(q, ms) {
  const mine = ++latest;
  const value = await find(q, ms);
  document.querySelector("#log").textContent += mine + " " + value + "\n";
  document.querySelector("#raw").textContent = value;
  if (mine === latest) document.querySelector("#safe").textContent = value;
}
search("紙", 240);
search("紙膠帶", 20);
</script>
```

先看紀錄再看最後的字。第二筆先出現在紀錄中；第一筆最後也確實完成，只是不能改右欄。這裡沒有略過工作本身，略過的是已經失去資格的寫入。接著把時間對調：舊筆先完成時右欄也不該退回舊字，因為新筆已經發出，畫面等的是新意圖，而不是任意可用的資料。

### 如果搜尋字來回變動

假設輸入順序是紙、紙膠帶、紙，看起來第一筆和第三筆的文字相同。若只比字串，第一筆最後回來仍可能被誤放行；兩次查詢之間，庫存資料或篩選條件也許已經變過。流水號辨認的是一次操作而不是文字本身，所以即使文字剛好相同，第一筆也不能替第三筆宣布完成。你可以在紀錄附近寫下三個號碼，再用箭頭畫出不同抵達順序。只要最後留下的都屬於第三筆，就說明規則不依賴某一次剛好比較快。

## 常見錯誤

只在成功時比號碼，卻在任何錯誤處理中改成「載入失敗」，就會讓過期的失敗蓋掉新的成功。若在收尾時一律關閉載入提示，也會讓舊請求替新請求提前宣布完成。把所有會改變使用者所見狀態的地方圈起來，都問一次現在是否仍有資格。

## 小結

取消節省工作量，編號維護畫面正確性，兩者回答不同問題。延伸資源用另一種介面寫同樣的忽略策略；先看判斷何時失效即可，不需先會 React。
