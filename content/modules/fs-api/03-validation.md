---
id: fs-api-02-validation
module: fs-api
order: 3
title: API 輸入驗證
subtitle: 先檢查再寫入
status: ready
minutes: 30
level: 3
prereqs:
  - fs-api-02-status
objectives:
  - 區分缺欄位、型別錯誤與違反規則
  - 讓錯誤回應指出可修正的欄位
tags:
  - api
  - validation
resources:
  - title: "OWASP：語法、語意與伺服器端輸入驗證"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html"
    kind: "doc"
    lang: "en"
    minutes: 7
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-api-validation-boundary"
    prompt: "前端已檢查資料，伺服器為何還要驗證？"
    answer: "伺服器可能接到不同用戶端的資料，必須在寫入前自行確認契約。"
    mcq:
      question: "哪裡能保證本例寫入前都經過檢查？"
      options:
        - "網頁選單"
        - "TypeScript 型別註記"
        - "錯誤提示的排版"
        - "伺服器共用的寫入入口"
      answer: 3
      explain: "表單和型別不能約束每個外來請求。"
    interview:
      question: "如何把「請檢查輸入」改成可用的契約？"
      points:
        - "分出缺值、型別、範圍"
        - "回傳欄位與代碼"
        - "測試失敗時不寫入"
      answer: "我會拿缺少 minutes、字串和 0 各做一個樣本，讓呼叫端收到不同原因但都指向同一欄。最後確認只有合格的整數入庫，避免只改到提示文字。"
  - id: "fs-api-missing-versus-zero"
    prompt: "如何區分 minutes 缺少與值為 0？"
    answer: "先檢查物件是否有該欄位，再獨立判斷數字與範圍。"
    mcq:
      question: "本例收到數字 0，應回哪種原因？"
      options:
        - "欄位不存在"
        - "型別是字串"
        - "超出允許範圍"
        - "JSON 無法解析"
      answer: 2
      explain: "0 是已存在的數字，只是不在允許範圍。"
  - id: "fs-api-validate-before-write"
    prompt: "拒絕不合法的資料後，要再核對哪個結果？"
    answer: "確認沒有新增紀錄或產生其他不應發生的副作用。"
    mcq:
      question: "哪個檢查看得出失敗時沒有偷偷寫入？"
      options:
        - "只讀錯誤文字"
        - "比對拒絕前後的筆數"
        - "只看畫面是否刷新"
        - "只印輸入型別"
      answer: 1
      explain: "錯誤訊息正確，不代表資料一定沒被修改。"
practice:
  - id: "fs-api-02-validation-p1"
    title: "做一份輸入邊界測試"
    kind: "code"
    minutes: 12
    steps:
      - "儲存並執行驗證腳本"
      - "另外加入 1、120、121 及 1.5 4 個 minutes 值"
      - "將各自的代碼或成功結果及最終筆數存入 validation.md"
    checks:
      - "1 與 120 都通過，121 和 1.5 都被拒"
      - "加上原本的合法樣本共存了 3 筆"
---

## 為什麼要學：表單說是數字，收到的卻是字串
你替工作清單加了「預計分鐘」欄位，網頁只能選 1 到 120，看起來不會出錯。但同一個介面也可能收到舊版畫面送來的字串，或從匯入工具送來的空物件。輸入驗證（input validation）是在接收外來資料時檢查它能不能進入系統，不是等資料庫寫壞之後才試著清理。

## 核心概念：先問有沒有，再問是什麼，最後問可不可以
把契約寫成一句人話：「請提供一個物件，其中 minutes 必須是 1 到 120 的整數。」這句話藏了幾道不同的門：根節點是否為物件、欄位是否存在、型別是否為數字、數值是否符合業務規則。缺欄位的人要補填；送字串的人要改傳送格式；送 0 的人則要重新選擇合理值。把它們混成「格式錯誤」只會讓下一次送出繼續猜。

前端驗證能讓使用者及早看到提示，TypeScript 型別能幫寫程式的人找錯，但接收到的 JSON 在執行時仍是外部資料。伺服器要自己做同一份契約的判斷。檢查完後，傳給寫入層的是挑出來的合法資料，而不是把整個原始物件原封不動往下送。

## 範例：用 4 次提交換來 1 筆紀錄
在練習區的 `api-notes` 新建 `validate.mjs`。這裡的輸入代表已經解析成功的 JSON；解析失敗的情況留在上一堂的 HTTP 邊界處理。PowerShell 或 bash 都用 `node validate.mjs` 執行。
```js
const saved = [];
function submit(input) {
  const reject = (code, field = 'minutes') => ({ status: 422, code, field });
  if (input === null || typeof input !== 'object' || Array.isArray(input))
    return reject('EXPECTED_OBJECT', 'body');
  if (!Object.hasOwn(input, 'minutes')) return reject('MISSING');
  const n = input.minutes;
  if (typeof n !== 'number') return reject('WRONG_TYPE');
  if (!Number.isInteger(n) || n < 1 || n > 120) return reject('OUT_OF_RANGE');
  saved.push({ minutes: n });
  return { status: 201, minutes: n };
}
for (const input of [{}, { minutes: '15' }, { minutes: 0 }, { minutes: 15 }])
  console.log(submit(input));
console.log('saved', saved.length);
```
讀條件時留意每個拒絕分支都會先返回；只有通過所有條件，才走得到 `saved.push`。這種寫法讓檢查點靠近輸入，寫入點只剩 1 個。學會看最後的筆數比只看到錯誤文字更重要：若程式先寫入、再告訴人失敗，畫面雖然有提示，系統其實已經收下壞資料。

### 把邊界兩側各擺一筆
檢查範圍時，不要只試 15 這類位在中間的值。想像你把允許範圍畫成一條線段，線段的兩個端點也算合法；在端點外面各放一個數字，這樣少寫一個等號就會被發現。再放一筆位於範圍內但不是整數的資料。它能通過大小比較卻仍應被拒，剛好說明「在範圍內」與「是可用的分鐘數」還差一個條件。 合法輸入也要保留，否則全部拒絕的程式反而可能通過只測壞資料的檢查。

## 常見錯誤
用 `if (!n)` 同時檢查存在與否，會把「欄位不見了」和「有填但數值為 0」混為一談。另一種寫法是先用 `Number` 轉換再檢查；對明訂只收數字的契約，這會讓字串意外通過。若需求真的要接受字串，應先寫清楚轉換規則，再測空白、邊界與小數，而不是讓語言替產品做決定。

## 小結
一個有效的測試不只問「壞輸入有沒有被拒絕」，也問「失敗後留下幾筆資料」以及「呼叫端是否知道該改哪裡」。三者都對，驗證才真正守住寫入邊界。
