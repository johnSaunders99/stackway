---
id: fs-api-04-password
module: fs-api
order: 4
title: 密碼雜湊與驗證
subtitle: 登入時不需要還原密碼
status: ready
minutes: 30
level: 3
prereqs:
  - fs-api-02-validation
objectives:
  - 區分加密、雜湊與密碼專用慢速雜湊
  - 說明鹽值、工作因子與函式庫驗證流程
tags:
  - api
  - password
resources:
  - title: "OWASP：密碼儲存、鹽值與工作因子"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-api-verify-derivation"
    prompt: "登入時如何在不還原原文的情況下驗證密碼？"
    answer: "取回該筆紀錄，用同一演算法、鹽與參數對新輸入計算並安全比對。"
    mcq:
      question: "驗證正確輸入時應使用哪個鹽？"
      options:
        - "當初該筆紀錄的鹽"
        - "每次重產的新鹽"
        - "今天的日期"
        - "所有紀錄共用的固定鹽"
      answer: 0
      explain: "改用新鹽會改變結果；固定鹽無法區分同密碼的不同紀錄。"
    interview:
      question: "如果要換新參數，你會怎麼處理已有的驗證紀錄？"
      points:
        - "保留舊演算法和參數"
        - "先依原紀錄驗證"
        - "成功後再產生新紀錄"
      answer: "我不會拿新參數硬比舊值。先由函式庫按紀錄驗證，成功登入時再用較新的建議設定重新產生紀錄，並確認服務承受得住驗證成本。"
  - id: "fs-api-salt-purpose"
    prompt: "隨機鹽主要解決什麼？"
    answer: "讓相同輸入在不同紀錄產生不同結果，減少共用預計算的價值。"
    mcq:
      question: "鹽應如何保管？"
      options:
        - "驗證後永久丟棄"
        - "拿來當解密金鑰"
        - "用使用者的密碼充當鹽"
        - "和該筆驗證值一起保存"
      answer: 3
      explain: "鹽需要能取回但不要求保密，它不是解密金鑰。"
  - id: "fs-api-work-cost"
    prompt: "為何不用高速通用雜湊直接存密碼？"
    answer: "密碼專用函式能調整運算成本，使每次猜測更昂貴。"
    mcq:
      question: "提高工作因子主要改變什麼？"
      options:
        - "是否能解密原文"
        - "密碼能用的字元"
        - "每次計算的資源需求"
        - "是否需要再存鹽"
      answer: 2
      explain: "成本與可逆性、字元規則及鹽的用途不同。"
practice:
  - id: "fs-api-04-password-p1"
    title: "製作不含密碼的驗證摘要"
    kind: "code"
    minutes: 10
    steps:
      - "儲存並執行範例，只保留三個布林值"
      - "在 password-check.md 為每個值寫下它比較的兩個東西"
      - "加註為什麼不能在登入時另產新鹽"
    checks:
      - "輸出依序為 true、true、false"
      - "摘要沒有原文、鹽值或雜湊內容"
---

## 為什麼要學：伺服器不必知道原來那串字
登入要回答的是「這次輸入是否和當初相同」，不是「請把使用者當年的密碼唸出來」。加密（encryption）讓持有金鑰的一方能取回原文，適合需要解密的資料；密碼驗證卻沒有這項需求。雜湊（hash）產生用來比較的結果，不提供解密步驟。單純選很快的通用雜湊仍不夠，因為密碼是人選的，猜測成本太低。

## 核心概念：讓每一筆都有自己的驗證配方
密碼專用函式會使用鹽值（salt）與工作因子（work factor）。鹽值是每筆隨機產生的資料，不必保密；即使兩人選了同一密碼，儲存結果也不該相同。工作因子決定每次計算需要花多少時間或記憶體，必須保留，否則日後不知要用哪套參數驗證。選擇成熟函式庫及其建議設定，而不是自己設計演算法。

註冊時產生新鹽，讓函式庫導出驗證值，存放演算法、參數、鹽與結果；登入則讀出原紀錄，將本次輸入交給同一套驗證流程。若函式庫提供完整的雜湊字串和驗證介面，就讓它管理編碼與比對。新系統優先考慮 Argon2id；本課示範的是沒有這項支援時可選用的 scrypt，利用 Node.js 內建實作觀察資料流，不提供公開登入端點。

## 範例：只印 3 個判斷，不印密碼或驗證值
在練習區 `api-notes` 建立 `password.mjs`，PowerShell 與 bash 都執行 `node password.mjs`。輸入是公開的練習字串，請勿替換成自己的密碼。以下為單機教學指令稿；同步函式會阻塞，不適合直接搬進處理多個連線的伺服器。
```js
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
const params = { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
function enroll(input) {
  const salt = randomBytes(16);
  const digest = scryptSync(input, salt, 32, params);
  return { algorithm: 'scrypt', params, salt, digest };
}
function verify(input, record) {
  const derived = scryptSync(input, record.salt, record.digest.length, record.params);
  return timingSafeEqual(derived, record.digest);
}
const a = enroll('sample-only'), b = enroll('sample-only');
console.log(!a.digest.equals(b.digest), verify('sample-only', a), verify('other', a));
```
第一個判斷用兩次註冊的不同結果觀察隨機鹽；後面兩個才是登入驗證。比較的是等長的位元組，不是把原文和驗證值直接比較。這個程式只有一種受信任的紀錄格式，所以驗證函式固定使用 scrypt；真正有多代紀錄的系統應委由維護中的函式庫處理格式與升級。

### 從備存紀錄想回下一次驗證
若備份只有驗證值，卻漏掉與它配對的鹽，即使使用者輸入完全正確，也沒有辦法重走原來的計算。把隨機鹽與結果放在同一份紀錄並不違反設計；真正不應被保留的是可直接拿去登入的原文。

## 常見錯誤
每次登入都另產新鹽，連正確輸入也會對不上。用全站固定鹽則失去每筆獨立的效果。另一個陷阱是通知信直接寄回舊密碼；既然系統不該能還原它，就應設計有期限的重設流程。不要把原文或可供驗證的紀錄放進偵錯輸出，只保留本次檢查通過與否。

## 小結
看一份設計時問：它有沒有復原原文的需要？每筆鹽是否獨立？未來能否依原參數驗證？三個答案比記住某個固定長度的雜湊字串實用得多。
