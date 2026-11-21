---
id: fs-quality-05-defense
module: fs-quality
order: 6
title: 授權與輸入回歸測試
subtitle: 把權限與輸入限制寫成長期檢查
status: ready
minutes: 35
level: 3
prereqs:
  - fs-quality-04-journey
objectives:
  - 列出不同角色可操作的資源矩陣
  - 以固定測試資料核對越權操作會被拒絕
tags:
  - quality
  - security
resources:
  - title: "OWASP：授權與權限測試"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-quality-05-defense-matrix"
    prompt: "資源授權矩陣每個格子應代表什麼？"
    answer: "某種身分對特定資源執行某個動作的預期結果"
    mcq:
      options:
        - "某種身分對特定資源執行某個動作的預期結果"
        - "使用者帳號數量"
        - "畫面顯示哪一種顏色"
        - "系統成功請求的總數"
      answer: 0
      explain: "同一身分也可能對自己的資源可寫、對他組的只可讀或不可見。"
    interview:
      question: "新加入檢視者角色，如何避免下次改版誤給編輯能力？"
      points:
        - "固定擁有者和檢視者樣本"
        - "允許與拒絕各有反例"
        - "核對拒絕不改資料"
      answer: "我會把讀與寫分成不同案例，用同一份虛構資源讓擁有者編輯成功、檢視者被拒並保留原值。另測擁有者的空白標題，避免把授權和輸入問題混成同一種綠燈。"
  - id: "fs-quality-05-defense-unchanged"
    prompt: "測試拒絕編輯時，除了錯誤結果還要核對什麼？"
    answer: "受保護資料在請求前後保持不變。"
    mcq:
      options:
        - "錯誤文字越長越好。"
        - "受保護資料在請求前後保持不變。"
        - "輸入框完全不存在。"
        - "所有人的編輯也被停用。"
      answer: 1
      explain: "回報拒絕但已寫入，仍是授權失敗。"
  - id: "fs-quality-05-defense-validation"
    prompt: "有編輯權但送來空標題應如何處理？"
    answer: "在寫入前另行驗證資料並拒絕不合規的值。"
    mcq:
      options:
        - "因為已授權就接受。"
        - "把它算作其他組的越權操作。"
        - "在寫入前另行驗證資料並拒絕不合規的值。"
        - "只在畫面隱藏空標題。"
      answer: 2
      explain: "授權決定誰能改，輸入驗證決定可以改成什麼。"
  - id: fs-quality-05-defense-default
    prompt: "新增一個尚未定義權限的角色時，寫入應如何處理？"
    answer: "預設拒絕，直到需求明確允許某個動作與資源範圍，並用對應案例驗收。"
practice:
  - id: "fs-quality-05-defense-p1"
    title: "交一份可重跑的權限矩陣"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 policy.test.mjs"
      - "在測試筆記寫下角色、資源、動作及預期"
      - "補一個未定義角色案例並驗證資料不變"
    checks:
      - "有一個合法成功、兩種角色或關係拒絕、一個非法輸入"
      - "拒絕案例均比對資料前後"
---

## 為什麼要學：不能編輯的按鈕，不是授權規則

你為便條工具新增檢視者，希望能讀但不能改標題。畫面把編輯按鈕拿掉，這對使用者很清楚，卻不能證明服務層會拒絕寫入。授權（authorization）判斷已知身分能否對特定資源做某個動作。回歸測試（regression test）把這個判斷留下來，以後調整角色或搬動函式時，仍有辦法知道原先的界線有沒有消失。

## 核心概念：先畫格子，再測每格的前後狀態

把身分、資源關係與動作組成矩陣（matrix）。假設本組編輯者能改本組筆記，本組檢視者只能讀，不同組不能改，未知角色預設拒絕。驗證身分（authentication）回答「你是誰」，授權問「即使是你，這件事可以做嗎」。本課把已確認的身分當作固定輸入，不連任何目標系統，也不拿真帳號當樣本。

輸入驗證（input validation）是另一條規則：能改標題，不等於可以存空值。每個反例只改一個條件，例如相同標題與資源換成檢視者，或相同身分與資源換成空標題。若一個測例同時沒有權限且資料不合法，就算看到拒絕，也不知道是哪條規則在保護資料。

## 範例：測自己的政策函式與虛構便條

在 `C:\dev\stackway-lab\quality` 儲存 `policy.test.mjs`，執行 `node --test policy.test.mjs`。每個測例重建同一張小便條，先記下初值；拒絕時檢查原始物件仍未改動。沒有請求送向第三方，也不需要任何登入憑證。

```js
import test from "node:test";
import assert from "node:assert/strict";
function edit(actor, note, text) {
  if (actor.role !== "editor" || actor.group !== note.group) return "denied";
  if (typeof text !== "string" || !text.trim() || text.trim().length > 40) return "invalid";
  note.title = text.trim();
  return "saved";
}
for (const [role,group,input,result] of [
  ["editor","a","new","saved"], ["viewer","a","new","denied"],
  ["editor","b","new","denied"], ["editor","a","  ","invalid"]
]) test([role,group,result].join(" "), () => {
  const note = {group:"a", title:"old"};
  assert.equal(edit({role,group}, note, input), result);
  assert.equal(note.title, result === "saved" ? "new" : "old");
});
```

只測拒絕，永遠傳回拒絕的函式也能拿滿分；所以保留至少一個合法寫入。只測允許，又無法區分同組不同角色或同角色不同組的能力。以同一個原始值和同一個新值逐格核對，日後有人提議擴大權限時，就能指出哪些格子真的要改，而不是把所有拒絕案例刪掉。

### 用相鄰的格子審閱一次需求變更

假設檢視者以後能替本組便條加註，但仍不能改標題。這不是讓整個角色變成編輯者，而是新增「加註」這一欄；原來禁止改標題的格子應繼續保留。把動作、資源關係和輸入規則分開，需求變動就能落在特定幾格，不必把整份測試重新解釋。再想一個尚未定義的角色，固定相同資源及合法標題試一次；新角色沒有明確允許時應拒絕。若把角色判斷寫成只排除現有的檢視者，這個反例就會在未來加角色以前先抓到漏洞。

## 常見錯誤與小結

不要從畫面或請求送來的自稱角色直接建立信任。服務應從已驗證的身分與自己查到的資源資訊作判斷，並讓所有寫入路徑共用它。這裡只驗證政策函式，不保證真實路由有接上；持續檢查時可再用隔離的整合測試核對呼叫關係，讓矩陣成為一份具體的承諾。
