---
id: fs-api-04-ownership
module: fs-api
order: 8
title: 物件層級授權
subtitle: 登入後也只能讀自己的紀錄
status: ready
minutes: 35
level: 3
prereqs:
  - fs-api-07-oidc
objectives:
  - 在伺服器端檢查資料歸屬
  - 用兩個測試角色核對允許與拒絕
tags:
  - api
  - authorization
resources:
  - title: "OWASP：每次請求都檢查授權"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-api-owner-query"
    prompt: "依擁有者限制單筆讀取時，查詢必須同時使用什麼？"
    answer: "使用要求的物件編號與伺服器已驗證的主體，核對紀錄的擁有者。"
    mcq:
      question: "哪個條件符合「只能讀自己的待辦」？"
      options:
        - "編號符合且擁有者等於可信主體"
        - "編號符合即可"
        - "是一般成員就能讀所有編號"
        - "表單說自己是擁有者"
      answer: 0
      explain: "知道編號或自報角色都不是對該物件的許可。"
    interview:
      question: "如何證明讀取政策不是把所有人一律拒絕？"
      points:
        - "兩個主體各有自己的正例"
        - "交叉配對得到拒絕"
        - "拒絕回應不含內容"
      answer: "我建兩個合成角色與兩筆資料，各讀自己的應成功，交叉讀應被拒絕。成功內容要對得上擁有者，拒絕回應也不應包含標題。"
  - id: "fs-api-authn-authz"
    prompt: "登入與物件授權各回答什麼？"
    answer: "登入回答主體是誰；物件授權回答此主體能否對這筆資料執行該動作。"
    mcq:
      question: "兩個人都已登入，為何結果仍可不同？"
      options:
        - "HTTP 方法一定不同"
        - "兩人的頁面必須用不同程式"
        - "狀態碼會隨機改變"
        - "資料歸屬不同"
      answer: 3
      explain: "同樣的讀取操作在不同主體與物件組合下可有不同結果。"
  - id: "fs-api-deny-output"
    prompt: "為何拒絕案例還要檢查回應欄位？"
    answer: "只改狀態碼可能仍夾帶資料，應核對未回傳不該公開的內容。"
    mcq:
      question: "對方的草稿在本課契約應得到什麼？"
      options:
        - "404 但回傳標題"
        - "200 與完整草稿"
        - "404 且無標題"
        - "401 即使已登入"
      answer: 2
      explain: "本課不揭露該筆存在與否；拒絕結果也不能帶出內容。"
practice:
  - id: "fs-api-04-ownership-p1"
    title: "交付一份權限矩陣"
    kind: "code"
    minutes: 12
    steps:
      - "執行本機政策腳本"
      - "在 ownership.md 畫出角色對待辦的 4 格，逐格填狀態和有無標題"
      - "另列匿名案例及它和交叉讀取的差別"
    checks:
      - "2 格為 200 且內容各自正確，2 格為 404 且無標題"
      - "匿名樣本為 401"
---

## 為什麼要學：知道你是誰，仍不能替每筆資料放行
清單服務已能登入，接下來要不要讓登入者讀取一筆待辦？答案取決於「哪一筆」。身分驗證（authentication）辨認請求代表的主體，授權（authorization）才決定該主體能否對指定物件執行這個動作。兩個使用者都是普通成員，並不表示兩人能讀彼此的草稿。這堂只用虛構角色和記憶體資料，寫下伺服器應遵守的讀取規則。

## 核心概念：把規則翻成資料範圍
先用一句話劃界：「登入者只能讀到自己的待辦。」這句話包含主體、動作和物件三部分。待辦編號來自請求，只是要找哪筆；主體必須來自伺服器已驗證的工作階段，而不是表單自報的角色。把兩個條件一起帶進查詢：編號符合，而且資料紀錄的擁有者等於目前主體。沒有明確允許的條件時，以拒絕為預設。

找不到編號和不屬於這個人，在本服務的讀取契約中都回 404，不額外說明其他人的紀錄是否存在。若某些產品明確需要告知「已知資源但不可操作」，也可以約定 403；本課重點是判斷在伺服器發生，而且狀態與對外說明一致。沒有通過登入則先走身分驗證失敗，而不進行物件查詢。

## 範例：用 2 個虛構角色做允許矩陣
在 `api-notes` 建立 `owner.mjs`，用 `node owner.mjs` 執行。資料都在程式裡，不需帳號、網路或外部服務。第一個參數模擬伺服器驗證後交下來的主體，第二個才代表請求指定的項目。
```js
const tasks = [
  { id: 1, owner: 'group-a', title: 'draft-a' },
  { id: 2, owner: 'group-b', title: 'draft-b' }
];
function read(subject, id) {
  if (!subject) return { status: 401 };
  const t = tasks.find(row => row.id === id && row.owner === subject);
  return t ? { status: 200, title: t.title } : { status: 404 };
}
for (const s of ['group-a', 'group-b'])
  for (const id of [1, 2]) console.log(s, id, read(s, id));
console.log('anonymous', read(null, 1));
```
先把兩個角色排成列、兩筆待辦排成欄，自己預測 4 格，再看輸出。對角線的兩次成功要各自拿到不同的標題；另外 2 格不能有標題。匿名樣本是額外對照，提醒你「沒登入」與「已登入但沒有此物件權限」走的是不同判斷。這些都是對本機政策函式的單元測試，不必對任何網站操作。

### 用集合與單筆互相核對
假設角色甲從自己的清單進入詳細畫面，兩邊都應該看得到同一筆。如果集合已經過濾，詳細頁卻沒有套相同條件，就不是單純的畫面差異，而是讀取政策在兩處出現不同結果。把政策集中在取資料的邊界，比要求每個畫面記得補檢查可靠。

## 常見錯誤
列表只顯示自己的項目，但單筆讀取卻只按編號查詢，兩條讀取路徑的規則就不一致。另一個盲點是把隱藏按鈕當成授權；介面可以少顯示不能用的功能，不能取代伺服器的判斷。若日後加上更新或刪除，要為那些動作各自列出允許條件，而不是沿用「看得到就能改」。

## 小結
不要只測「自己的資料讀得到」。一份能交接的政策紀錄應該同時回答誰被允許、誰被拒絕，拒絕時又有哪些欄位絕不會離開服務。
