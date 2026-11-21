---
id: fs-api-06-jwt
module: fs-api
order: 6
title: JWT 簽章與有效期限
subtitle: 看得到內容不等於可以相信它
status: ready
minutes: 35
level: 3
prereqs:
  - fs-api-03-session
objectives:
  - 分辨編碼、簽章與加密
  - 列出接受權杖前要核對的簽章、發行者、受眾與到期時間
tags:
  - api
  - jwt
resources:
  - title: "IETF RFC 7519：JWT 宣告"
    url: "https://www.rfc-editor.org/rfc/rfc7519"
    kind: "doc"
    lang: "en"
    minutes: 7
    required: false
    checked: "2026-11-20"
  - title: "IETF RFC 8725：JWT 驗證實務"
    url: "https://www.rfc-editor.org/rfc/rfc8725"
    kind: "doc"
    lang: "en"
    minutes: 6
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-api-token-acceptance"
    prompt: "接收已簽章 JWT 時，除了驗簽還要看什麼？"
    answer: "按用途核對預期發行者、受眾和有效時間等必要宣告；驗簽本身也必須使用受信任設定。"
    mcq:
      question: "已驗簽、未過期，但只發給其他 API，該怎麼做？"
      options:
        - "延長期限後採用"
        - "重新編碼後採用"
        - "因受眾不符而拒絕"
        - "只要有發行者就接受"
      answer: 2
      explain: "真實簽發不等於適用於本服務。"
    interview:
      question: "收到一枚外部 JWT，你如何描述驗收順序？"
      points:
        - "先定可信來源、金鑰與演算法"
        - "由函式庫完成驗簽"
        - "檢查用途、受眾與時間"
      answer: "我先從服務設定決定信任誰，不看來件自稱可信。讓函式庫按設定驗簽，再核對發行者、受眾與期限；即使通過，也要另外判斷這次資源操作的權限。"
  - id: "fs-api-token-visibility"
    prompt: "只簽章的 JWT 是否隱藏內容？"
    answer: "不會；一般可解碼讀取，簽章提供完整性與來源驗證而非保密。"
    mcq:
      question: "哪個操作只能讀內容，不能證明來源？"
      options:
        - "使用可信金鑰驗簽"
        - "Base64url 解碼"
        - "核對允許的演算法後驗簽"
        - "使用可信函式庫完成簽章驗證"
      answer: 1
      explain: "解碼不使用任何信任根據。"
  - id: "fs-api-expiry-boundary"
    prompt: "若不設時鐘容許差，現在時間剛好等於 exp 時還有效嗎？"
    answer: "無效；現在必須早於到期時間，兩者以相同的秒數單位比較。"
    mcq:
      question: "現在為 500 秒，何者已到期？"
      options:
        - "exp 為 500"
        - "exp 為 501"
        - "exp 為 510"
        - "exp 為 600"
      answer: 0
      explain: "到期邊界本身不屬於有效時間。"
practice:
  - id: "fs-api-06-jwt-p1"
    title: "建立權杖接受條件卡"
    kind: "code"
    minutes: 12
    steps:
      - "執行五筆測試報告並把結果記入 token-policy.md"
      - "補一筆受眾清單含本服務的正對照"
      - "在卡上註明哪些是模擬結果、哪些必須由正式驗證器提供"
    checks:
      - "原始結果依序為 accepted、signature、issuer、audience、expiry"
      - "筆記沒有把解碼或用戶端旗標當成驗簽"
---

## 為什麼要學：看得懂，不代表能採信
有些服務之間不共用工作階段資料，而是傳遞一份有簽章的聲明。JSON Web Token（JWT）是裝載宣告（claim）的格式，宣告可以寫明「誰發行、交給誰、何時失效」。看到一段字串能解出這些欄位，只證明你知道怎麼讀，不證明內容真的是發行者寫的。這是接收權杖時最要緊的分界。

## 核心概念：拆開閱讀與驗證
本課談的是常見的已簽章格式，由標頭、內容、簽章三段組成。前兩段通常用 Base64url 編碼，目的是讓資料適合傳輸，不是讓別人看不懂。簽章（signature）讓接收端按約定的演算法與可信金鑰核對來源及完整性；加密（encryption）處理的是保密。不要把原始密碼或祕密資料塞進只簽章的權杖。

依本服務事先設定的信任關係選發行者、金鑰與允許的演算法，不讓來件自行指定信任規則。用維護中的函式庫驗簽並驗證宣告：`iss` 對應預期發行者，`aud` 包含本服務，`exp` 是期限，以 Unix 秒數表示，現在時間必須早於它。其他用途還可能要求不同類型或尚未生效時間。驗簽成功而受眾不同，仍然不能接受；通過這些檢查也不等於有權讀任何資料。

## 範例：先做驗收表，不自己實作簽章
在 `api-notes` 寫入 `token-policy.mjs`，用 `node token-policy.mjs` 執行。這是對**驗證器測試報告**做決策的離線練習，不接收外部權杖。`verified` 在此是測試夾具模擬的函式庫結果，正式程式絕不能從來件讀取同名旗標當證明。固定時鐘比拿一枚真實權杖練習更容易看清到期邊界。
```js
const now = 500;
function decide({ verified, iss, aud, exp }) {
  if (!verified) return 'signature';
  if (iss !== 'lab-issuer') return 'issuer';
  if (![aud].flat().includes('tasks-api')) return 'audience';
  if (!Number.isFinite(exp) || now >= exp) return 'expiry';
  return 'accepted';
}
const sample = { verified: true, iss: 'lab-issuer', aud: 'tasks-api', exp: 501 };
for (const change of [{}, { verified: false }, { iss: 'other' },
                      { aud: ['other-api'] }, { exp: 500 }])
  console.log(decide({ ...sample, ...change }));
```
第一筆是固定的正對照；後面每筆只改一個輸入，拒絕理由就能對到一個條件。範例接受字串或清單形式的受眾，並假設宣告的格式先經函式庫核對。請勿把這個簡化表格當權杖剖析器，也不需要到網站貼任何真實權杖。

### 把 2 種拒絕寫成不同的維修線索
如果所有樣本都在期限檢查被拒，優先核對時鐘與單位；若只有提供給另一個服務的樣本被拒，這可能正是預期的保護。拿一筆完全符合本地規則的正例放在旁邊，才能分辨「政策有在挑選」與「驗證器根本沒有成功過」。

## 常見錯誤
用系統時鐘取出毫秒值，直接跟以秒記錄的期限比較，會讓幾乎所有樣本都像已過期。另一個盲點是只要驗簽成功便接受其他服務的權杖。它可以是真正簽發、尚未過期，卻是發給另一個接收者使用的；這種錯誤無法靠延長期限修正。

## 小結
閱讀內容、驗證來源、限制使用情境是不同工作。把預期發行者、受眾、時間界線和演算法政策寫進驗收條件，比畫面上顯示一個「解碼成功」更接近完成。
