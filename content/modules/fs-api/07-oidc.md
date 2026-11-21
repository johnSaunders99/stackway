---
id: fs-api-07-oidc
module: fs-api
order: 7
title: OAuth 與 OIDC
subtitle: 授予讀取權不等於證明身分
status: ready
minutes: 35
level: 3
prereqs:
  - fs-api-06-jwt
objectives:
  - 畫出使用者、用戶端、授權伺服器與資源服務
  - 分辨授權碼、存取權杖與 ID 權杖的用途
tags:
  - api
  - oidc
resources:
  - title: "OpenID Connect Core：授權碼流程"
    url: "https://openid.net/specs/openid-connect-core-1_0.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "IETF RFC 9700：授權碼與 PKCE"
    url: "https://www.rfc-editor.org/rfc/rfc9700"
    kind: "doc"
    lang: "en"
    minutes: 6
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-api-oidc-purpose"
    prompt: "OAuth 委派授權與 OIDC 登入分別回答什麼問題？"
    answer: "前者授予用戶端有限的資源操作權，後者讓用戶端驗證這次登入的身分。"
    mcq:
      question: "排程網站要確認登入主體，應驗證哪項？"
      options:
        - "任一 API 的存取權杖"
        - "網址列中的授權碼字串"
        - "使用者按過同意按鈕"
        - "發給該用戶端的 ID 權杖"
      answer: 3
      explain: "同意、授權碼、存取權杖各有用途，都不等同完成身分驗證。"
    interview:
      question: "「外部登入」和「代讀清單」同時出現，你怎麼畫？"
      points:
        - "指出使用者、用戶端、授權端與資源端"
        - "授權碼只用來兌換"
        - "分出兩種權杖的接收者"
      answer: "我先畫工具、授權端和清單 API，再加上決定是否同意的使用者。工具用授權碼兌換後，自己驗證 ID 權杖以完成登入；讀清單時改帶給該 API 的存取權杖。"
  - id: "fs-api-code-exchange"
    prompt: "授權碼交給誰，換得什麼？"
    answer: "用戶端將它交給授權伺服器的權杖端點，以交換權杖，不直接交給資源 API。"
    mcq:
      question: "用戶端有授權碼，下一步在哪裡使用？"
      options:
        - "待辦清單查詢端點"
        - "前端身分顯示欄"
        - "權杖端點"
        - "使用者資料庫的主鍵欄"
      answer: 2
      explain: "授權碼是短效的交換憑據，不是資源或身分本身。"
  - id: "fs-api-pkce-binding"
    prompt: "PKCE 在授權碼流程中連結哪兩件事？"
    answer: "發起時的挑戰值與兌換時提交的驗證字串，讓授權碼交換綁定原本的請求。"
    mcq:
      question: "哪個角色要在交換時檢查驗證字串與挑戰是否相符？"
      options:
        - "顯示待辦的瀏覽器畫面"
        - "授權伺服器"
        - "資源 API 的清單路由"
        - "負責儲存待辦的資料表"
      answer: 1
      explain: "確認交換條件的是核發權杖的一端。"
  - id: "fs-api-token-destination"
    prompt: "存取權杖與 ID 權杖的預期接收者如何區分？"
    answer: "存取權杖給資源服務判斷權限；ID 權杖給用戶端驗證身分。"
    mcq:
      question: "要讀取已獲授權的清單，用戶端送出什麼？"
      options:
        - "該 API 的存取權杖"
        - "ID 權杖"
        - "剛用過的授權碼"
        - "發起交易時的挑戰值"
      answer: 0
      explain: "只有發給資源服務的存取權杖具有此用途。"
practice:
  - id: "fs-api-07-oidc-p1"
    title: "畫出兌換後的兩條路"
    kind: "explain"
    minutes: 12
    steps:
      - "執行流程稿並在 oidc-flow.md 畫出四個角色"
      - "把授權碼、存取權杖與 ID 權杖各放在正確箭頭上"
      - "為拒絕讀取授權的情況寫一句畫面提示"
    checks:
      - "授權碼沒有被送去讀清單"
      - "分支清楚標出誰驗證身分、誰驗證資源存取權"
---

## 為什麼要學：允許讀清單，不等於登入了網站
假設一個排程工具想代讀待辦清單，你不必把清單服務的密碼交給它。OAuth 2.0 處理委派授權（delegated authorization）：讓工具在同意的範圍內呼叫服務。OpenID Connect（OIDC）在這套機制之上加入身分驗證（authentication），讓工具能核對這次登入的是哪個主體。產品需求中的「連結服務」和「用同一身分登入」看似相近，實際需要的證據不同。

## 核心概念：先在紙上放好 4 個角色
使用者決定是否授權；用戶端（client）是排程工具；授權伺服器（authorization server）處理登入、同意與核發；資源伺服器（resource server）是提供清單的 API。發行者和 API 可能由同一組織營運，仍是不同角色。問「這張憑據應交給誰」比猜字串長相可靠，因為存取權杖不一定是 JWT。

授權碼流程（authorization code flow）中，用戶端先把瀏覽器導向授權端。請求包含登記的回呼位址、要的範圍與 PKCE 挑戰值；PKCE 讓兌換時能證明是發起這次要求的一方。使用者同意後，瀏覽器帶短效、單次的授權碼回到已登記的位址。用戶端檢查回呼屬於原本的交易，再把授權碼與對應的驗證字串交給權杖端點交換。授權碼是交換用的，不是讀資料的通行證。

收到存取權杖（access token）後，用戶端把它送給指定的資源服務，由該服務驗證並限制可做的操作。若發起時要求 `openid` 範圍，OIDC 的 ID 權杖（ID token）則由用戶端驗證，用來確認發行者對這次身分的聲明；核對簽章、發行者、受眾、期限，以及流程使用的 nonce 等交易連結資訊。不要把 ID 權杖拿去當 API 的授權。

## 範例：讓每張憑據有唯一目的地
在 `api-notes` 建立 `handoff.mjs`，於 PowerShell 或 bash 執行 `node handoff.mjs`。這份離線流程稿不連外，也不需要建立帳號；右欄是各接收端要解答的問題。
```js
const flow = [
  ['user + client', 'authorization server', 'consent', 'allow tasks.read?'],
  ['browser', 'client callback', 'code', 'matches the pending request?'],
  ['client', 'token endpoint', 'code + verifier', 'same transaction?'],
  ['client', 'resource API', 'access token', 'may read tasks?'],
  ['issuer', 'client', 'ID token', 'which subject signed in?']
];
for (const [from, to, item, purpose] of flow)
  console.log(from, '->', to, '|', item, '|', purpose);
```
最後兩列是兌換後兩種權杖的去向，不是說要先呼叫 API 才能收到 ID 權杖。可在紙上從「交換成功」畫出兩個分支，沿著箭頭解釋誰負責核對受眾；畫不出分支，往往代表你把登入和代讀當成同一件事了。

### 先把同意畫面上的動詞唸出來
若使用者看到的是「允許讀取清單」，接下來就不應以同一範圍修改清單。這個限制由資源服務執行，不是只靠按鈕文字。畫流程時把同意的動詞和最終呼叫的動詞並排，是檢查授權要求有沒有拿太多權限的簡單方法。

## 常見錯誤
僅憑用戶端拿到存取權杖就自行推論登入身分，並不是 OIDC 的登入驗證。另一個錯誤是把一次同意解讀為永久全權。若這次只需要讀取，就只要求讀取範圍；若被拒絕，回到畫面說明無法連結，不要改要求更大的權限試運氣。

## 小結
流程圖上應該看得見四個角色和三種憑據。每次交接時問「誰發的、誰接、拿來證明什麼」，就不會把可兌換、可讀取與已登入混在一起。
