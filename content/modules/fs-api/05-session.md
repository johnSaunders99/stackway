---
id: fs-api-03-session
module: fs-api
order: 5
title: Cookie 與工作階段
subtitle: 伺服器如何記住登入狀態
status: ready
minutes: 30
level: 3
prereqs:
  - fs-api-04-password
objectives:
  - 區分工作階段與使用者身分
  - 說明登出時需失效的資料
  - 從 Set-Cookie 到下一次請求的 Cookie 畫出工作階段識別碼的往返，區分識別碼與伺服器紀錄
tags:
  - api
  - session
resources:
  - title: "OWASP：工作階段識別碼與生命週期"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-api-session-roundtrip"
    prompt: "工作階段識別碼如何往返？"
    answer: "伺服器以 Set-Cookie 交給瀏覽器；瀏覽器用 Cookie 帶回，伺服器再查有效紀錄。"
    mcq:
      question: "哪一步才把識別碼對應到已登入主體？"
      options:
        - "瀏覽器畫出登入按鈕"
        - "伺服器查有效的階段紀錄"
        - "把字串長度當角色"
        - "看到任意 Cookie 就接受"
      answer: 1
      explain: "攜帶識別碼不代表一定有效，仍要查詢與判斷期限。"
    interview:
      question: "為何登出時不能只把瀏覽器導回首頁？"
      points:
        - "各請求靠識別碼而非頁面狀態"
        - "使伺服器紀錄失效"
        - "讓瀏覽器清除對應 Cookie"
      answer: "換頁只是換畫面。我會撤銷這個階段，並送出清除相同範圍 Cookie 的回應；之後即使舊識別碼又出現，也不能通過伺服器檢查。"
  - id: "fs-api-session-revoke"
    prompt: "伺服器端階段要怎麼登出才會失效？"
    answer: "撤銷階段紀錄並讓瀏覽器清除相符 Cookie，不必刪除帳號。"
    mcq:
      question: "哪項直接讓舊識別碼不再能找到有效階段？"
      options:
        - "撤銷伺服器端紀錄"
        - "隱藏按鈕"
        - "清空目前頁面"
        - "只修改顯示名稱"
      answer: 0
      explain: "介面或名稱變化都不會撤銷階段。"
  - id: "fs-api-cookie-attributes"
    prompt: "HttpOnly 與 Secure 分別限制什麼？"
    answer: "前者限制網頁腳本讀取，後者限制透過安全通道傳送。"
    mcq:
      question: "哪個屬性用來防止網頁腳本直接讀取 Cookie？"
      options:
        - "Secure"
        - "Path"
        - "Max-Age"
        - "HttpOnly"
      answer: 3
      explain: "Secure 管傳輸，Path 管路徑，Max-Age 管保存時間。"
practice:
  - id: "fs-api-03-session-p1"
    title: "留下工作階段往返圖"
    kind: "explain"
    minutes: 11
    steps:
      - "執行範例後，在 session-flow.md 畫瀏覽器與伺服器兩欄"
      - "標出 Set-Cookie 與 Cookie 的方向，在伺服器旁畫出識別碼對紀錄的查詢"
      - "對照有效、到期、登出三次結果，不抄識別碼"
    checks:
      - "圖上瀏覽器只保存憑據而非可信任的角色"
      - "能用最後的 null 解釋舊值為何無效"
---

## 為什麼要學：通過登入之後，下一頁怎麼認得你？
第一次請求已經驗過密碼，打開下一頁卻是另一個 HTTP 請求。伺服器不該要求每一頁都附上密碼，也不能因為兩次請求來自同一臺電腦，就斷定是同一個人。工作階段（session）讓伺服器在一段時間內記得「這次登入已經通過」，並且能在登出後收回這項承認。

## 核心概念：2 個箭頭，一份紀錄
建立階段時，伺服器產生不可預測的識別碼，在自己管理的儲存空間建立對應紀錄，內含已驗證的主體及有效期限。回應透過 `Set-Cookie` 標頭請瀏覽器保存識別碼；下一次對符合範圍的位址送出請求時，瀏覽器以 `Cookie` 標頭帶回它。伺服器查得到仍有效的紀錄，才知道這個請求代表誰。識別碼不是帳號名稱，也不是有效權限的永久證明。

正式網站應使用 HTTPS，設定 `Secure` 限制透過安全連線傳送、`HttpOnly` 避免網頁腳本直接讀取，並依流程選擇 `SameSite` 限制跨站攜帶。這些屬性不取代伺服器端期限與撤銷。登出要使紀錄失效，同時用相符的名稱、路徑與網域範圍清除瀏覽器的 Cookie；只清畫面上的名字沒有終止階段。

## 範例：只畫方向，不列印真的識別碼
在 `api-notes` 將以下程式存為 `session.mjs`，用 `node session.mjs` 執行，PowerShell 和 bash 相同。這是記憶體裡的往返模型，不開網站；瀏覽器會處理的保存與回送在此用變數表示。
```js
import { randomBytes } from 'node:crypto';
const sessions = new Map();
const sid = randomBytes(32).toString('hex');
sessions.set(sid, { subject: 'role-a', expires: 2000 });
const response = { 'Set-Cookie': 'sid=' + sid + '; Path=/; HttpOnly; Secure; SameSite=Lax' };
const request = { Cookie: response['Set-Cookie'].split(';')[0] };
function lookup(cookie, now) {
  const row = sessions.get(cookie.slice('sid='.length));
  return row && now < row.expires ? row.subject : null;
}
console.log(lookup(request.Cookie, 1000), lookup(request.Cookie, 2000));
sessions.delete(sid);
console.log(lookup(request.Cookie, 1000));
```
程式只有一種固定格式，`split` 與 `slice` 只是把這個範例的箭頭接起來，不是正式網站的 Cookie 解析器。時間用同一尺度的兩個示意刻度，讓到期邊界可以重現。第一次查詢認得主體，到達期限就不認；刪掉紀錄後，即使模擬的請求還帶原值，也找不到階段了。

### 用時間線檢查你的圖
在圖下方再畫一條時間線：先通過登入，接著讀取一頁，最後登出。用筆圈出伺服器必須改動資料的兩個時刻，分別是建立階段與撤銷階段。中間那次讀取即使不改資料，仍必須查核紀錄；這就是為什麼登入成功的畫面不能直接當成下一個請求的證據。若同一人使用兩個瀏覽器，兩段登入也可以各有自己的識別碼。

## 常見錯誤
把 `Set-Cookie` 畫在瀏覽器送出的那一邊，等於把「告知要保存」與「帶回作為憑據」畫反了。還有一個常見混淆是把階段期限只放在瀏覽器；伺服器自己不核對，就無法保證超時後失效。正式登入應建立新的識別碼，避免把登入前的階段原封不動升成已驗證狀態。

## 小結
在紙上遮住伺服器端的紀錄，只留下 Cookie，還能從這串隨機數字知道角色嗎？不能。正因為判斷在伺服器端，你才能讓單次登入失效，而不必刪除使用者本身。
