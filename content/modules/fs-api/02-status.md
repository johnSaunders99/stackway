---
id: fs-api-02-status
module: fs-api
order: 2
title: HTTP 狀態與錯誤格式
subtitle: 找不到與驗證失敗不該共用一句話
status: ready
minutes: 30
level: 3
prereqs:
  - fs-api-01-routes
objectives:
  - 為建立、查無資源與格式錯誤選擇適當狀態碼
  - 定義可給程式判讀又不洩漏內部細節的回應
tags:
  - api
  - status
resources:
  - title: "MDN：HTTP 回應狀態碼"
    url: "https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Reference/Status"
    kind: "doc"
    lang: "zh-Hant"
    minutes: 7
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-api-response-contract"
    prompt: "狀態碼、錯誤代碼與提示文字各給誰用？"
    answer: "狀態碼分類 HTTP 結果，穩定代碼供程式分支，提示文字指引人修正。"
    mcq:
      question: "要調整提示文字而不破壞前端分支，應判讀哪個內容？"
      options:
        - "整句中文文案"
        - "訊息長度"
        - "穩定的錯誤代碼"
        - "堆疊第一行"
      answer: 2
      explain: "顯示文案會改，內部堆疊不應是公開契約。"
    interview:
      question: "同事想把所有失敗都包在 200 裡，你會怎麼改？"
      points:
        - "保留 HTTP 分類"
        - "提供穩定代碼與欄位"
        - "讓內部紀錄與對外訊息分開"
      answer: "我會先拿查無項目和空白標題做例子：前者回 404，後者按契約回 422 和欄位名。這樣畫面能選對提示，監控也看得出錯誤，而不必公開內部堆疊。"
  - id: "fs-api-json-status"
    prompt: "本課如何區分不合法的 JSON 和不合法的欄位？"
    answer: "解析失敗回 400；解析成功但欄位不符約定回 422。"
    mcq:
      question: "送出合法物件但標題全是空白，本課選哪個狀態？"
      options:
        - "201"
        - "422"
        - "404"
        - "500"
      answer: 1
      explain: "物件已能解析，不是找不到項目或伺服器故障。"
  - id: "fs-api-public-error"
    prompt: "為什麼不把例外堆疊原樣交給呼叫端？"
    answer: "它揭露內部細節，且無法直接告訴使用者如何修正。"
    mcq:
      question: "查無單筆時哪組最合適？"
      options:
        - "404 與公開代碼 NOT_FOUND"
        - "500 與磁碟路徑"
        - "201 與空物件"
        - "200 與資料庫查詢全文"
      answer: 0
      explain: "查無資料是可預期結果，不需要公開內部除錯資訊。"
practice:
  - id: "fs-api-02-status-p1"
    title: "做一份回應樣本簿"
    kind: "code"
    minutes: 10
    steps:
      - "執行腳本，將四行輸出存到 responses.jsonl"
      - "逐筆標出呼叫端下一步"
      - "把標題提示換句話，確認代碼與狀態不變"
    checks:
      - "同一份樣本能分辨 400、422、201、404"
      - "只有能定位欄位的失敗樣本帶 field"
---

## 為什麼要學：畫面該重試，還是請你改字？
伺服器一律回「處理完畢」，畫面就分不出新項目真的建立、編號打錯，還是服務本身壞掉。HTTP 狀態碼（status code）先把結果分成大家都認得的類別；錯誤內容再說明這個應用到底哪裡需要修正。兩者配合，呼叫端才能決定要顯示詳細頁、標示欄位或暫停重試。

## 核心概念：對機器的約定，對人的說明
此處約定：成功建立用 201，附上新項目的位置；查不存在的單筆用 404；內容不是可解析的 JSON，用 400；內容能解析、卻不符欄位規則，用 422。後兩者都是用戶端送來的資料有問題，但應採取的修正不同。這是一份明講的 API 契約，不是規定所有服務對欄位錯誤都只能用同一個數字。之後在[〈API 輸入驗證〉](#/lesson/fs-api-02-validation)會把欄位規則寫成可執行的檢查。真正的非預期伺服器錯誤才走 500，不把程式內部故障推給使用者。

在回應內把穩定代碼 `code` 與給人看的 `message` 分開；若能定位欄位，再附 `field`。文字可以改善、翻譯，代碼則供前端選擇行為。不要把堆疊、磁碟路徑、原始查詢或整包輸入放進公開訊息。需要工程師追查時，可用不含敏感資料的請求識別碼對照內部紀錄，不讓呼叫端負責讀除錯資訊。

## 範例：把回應契約變成可以檢查的樣本
在 `C:\dev\stackway-lab\api-notes` 建立 `responses.mjs`，用 `node responses.mjs` 執行；bash 在自己的練習資料夾用相同指令。這是處理程式回傳給 HTTP 層的資料模型，不會開連接埠。先看狀態，再看同一類錯誤能靠哪個欄位細分。
```js
const error = (status, code, message, field) => ({
  status, body: { code, message, ...(field ? { field } : {}) }
});
function create(raw) {
  let input;
  try { input = JSON.parse(raw); }
  catch { return error(400, 'BAD_JSON', 'JSON 格式有誤'); }
  if (typeof input?.title !== 'string' || !input.title.trim())
    return error(422, 'TITLE_REQUIRED', '請填寫標題', 'title');
  return { status: 201, headers: { Location: '/tasks/1' },
           body: { id: 1, title: input.title.trim() } };
}
const samples = [create('{'), create('{"title":" "}'),
  create('{"title":"read"}'), error(404, 'NOT_FOUND', '找不到這筆項目')];
for (const response of samples) console.log(JSON.stringify(response));
```
觀察第一筆連物件都還沒有，無法可靠地標示哪個表單欄位錯了；第二筆則能直接請人回去改標題。第三筆是固定樣本，不會寫資料，也不用靠錯誤代碼描述成功。第四筆是模擬查無項目的回應，不是因為空白標題而找不到路由。

### 讀者要做的事就是契約的一部分
把每筆回應交給沒看過腳本的人，請他只憑回應決定下一步。建立成功應該能開啟剛才的項目，查無資料應該回到清單，欄位錯誤應該保留原輸入並把焦點送回要改的地方。如果他仍然只能重按一次送出，可能是回應缺少可行動的資訊，而不只是畫面上的提示不夠醒目。

## 常見錯誤
若用 200 包住所有錯誤，監控與一般用戶端會把失敗當成功。反過來，只回數字也不夠：兩個欄位可能都回 422，畫面還需要知道要標紅哪一格。測試時比對狀態、代碼和必要欄位即可；若把整句提示文字鎖在測試裡，一次用語改善就會造成無關的失敗。

## 小結
好的失敗回應能讓人知道下一步，同時不透露伺服器裡面怎麼運作。把可預期的錯誤情境和成功範例一起放入契約，前後端便可各自測試，不用等到整個畫面接好。
