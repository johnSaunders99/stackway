---
id: fs-market-stack-03-verify
module: fs-market-stack
order: 3
title: 跨語言 API 契約測試
subtitle: 換語言但不換驗收條件
status: ready
minutes: 35
level: 3
prereqs:
  - fs-market-stack-02-spring
objectives:
  - 對相同輸入比較 Node.js 與 Spring 回應
  - 以 Web 層測試保住錯誤與成功案例
tags:
  - market-stack
  - contract-tests
resources:
  - title: Spring Framework：MockMvc 測試範圍
    url: https://docs.spring.io/spring-framework/reference/testing/mockmvc.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: Spring Framework：控制器測試與完整設定測試
    url: https://docs.spring.io/spring-framework/reference/testing/mockmvc/setup-options.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-market-stack-03-verify-oracle
    prompt: 兩個後端回應完全相同，是否足以證明符合契約？
    answer: 不足；兩端都要對照獨立、事先寫好的預期。
    mcq:
      options:
        - 足夠，相同代表正確
        - 只要狀態是 200 即可
        - 只比較回應長度即可
        - 不足，還要對照預期
      answer: 3
      explain: 相同錯誤可能出現在兩個實作，成功和查無資料也有不同預期。
  - id: fs-market-stack-03-verify-semantic
    prompt: 如何檢查 JSON 而不被欄位順序干擾？
    answer: 解析為資料結構，再比較約定欄位、型別與值。
    mcq:
      options:
        - 解析後比結構與型別
        - 直接比整段原始文字
        - 先把所有值轉成字串
        - 只比較字元總數
      answer: 0
      explain: 轉字串會抹掉數字差異，純文字比對又會把不重要的格式當失敗。
  - id: fs-market-stack-03-verify-layer
    prompt: 直接掛控制器的 MockMvc 通過，哪件事仍不能確認？
    answer: 無法確認真實連接埠、部署路由及完整應用設定；需另做整合驗證。
    interview:
      question: 為何同時保留探針與控制器測試，而不只留一個？
      points:
        - 指出共同的契約預期
        - 解釋兩層不同的邊界
        - 說明一筆負向對照
      answer: 我會讓兩邊都對同樣的 7 與 8 作答。控制器測試幫我快速找欄位錯誤；外部探針才能看到真正跑起來的服務。把編號暫改成字串時應該失敗，還原後才應變綠。
  - id: fs-market-stack-03-verify-negative
    prompt: 為何故意把 id 改為字串再跑測試？
    answer: 做負向對照，確認測試真的會攔下型別差異，而非永遠通過。
    mcq:
      options:
        - 把字串加入允許契約
        - 證明所有欄位都正確
        - 確認測試會抓到要攔的差異
        - 直接以壞資料更新預期
      answer: 2
      explain: 要檢查的是測試的辨識力，還原後正常案例仍應通過。
practice:
  - id: fs-market-stack-03-verify-p1
    title: 保存一份真的會失敗的契約檢查
    kind: code
    minutes: 17
    steps:
      - 在練習資料夾保存 old.mjs 與 probe.mjs，啟動兩端跑探針；在 Spring 練習專案跑 Web 層測試。
      - 只在 Node.js 參考端把 id 改為字串，重啟後確認失敗，再還原重啟並重跑；結果記入 contract-check.md。
    checks:
      - 正常時兩個連接埠各有成功與查無資料的 PASS；Web 層亦驗兩種狀態。
      - 失敗紀錄指出數字與字串不符，不用更改契約預期讓它通過。
---

## 同樣看到 Index，不代表 2 個後端相容
筆記卡片只顯示標題，即使新服務把編號改成字串，畫面仍可能正常。但選取卡片時，前端拿數字 7 比對字串就會失敗。契約測試 (contract test) 從呼叫端出發，固定一組請求與預期狀態、媒體型別、資料欄位，再讓不同實作各答一次。不要只把兩邊互比：兩邊若同時回錯，也會看起來完全相同。

## 範例：同一支探針打 2 個本機服務
接續上一堂的 Spring 服務。為移植前後的契約探針建立 `C:\dev\stackway-lab\migration`。建立 `old.mjs`，執行 `node old.mjs`，這是只供兩筆樣本比對的 Node.js 參考端，不是舊系統的所有功能。只在自己的回送位址監聽；結束時到該視窗按 Ctrl+C。

```js
import { createServer } from 'node:http';
createServer((req, res) => {
  const ok = req.method === 'GET' && req.url === '/notes/7';
  res.writeHead(ok ? 200 : 404, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(ok ? {id: 7, title: 'Index'} : {error: 'not_found'}));
}).listen(3100, '127.0.0.1', () => console.log('Node reference ready on 3100'));
```

先寫下兩個編號各自應有的狀態和型別，留下不依賴任一服務產生的對照答案。同目錄另存 `probe.mjs`，在第三個終端機執行 `node probe.mjs`；上述指令在 PowerShell 與 bash 相同，使用有內建 fetch 的 Node.js。兩個服務都要在跑；連線失敗是環境問題，不是查無筆記。此練習以固定樣本要求完整物件相等；若正式契約允許擴充欄位，就只斷言必要欄位，不應硬把額外欄位判為破壞相容。

```js
import assert from 'node:assert/strict';
const ports = process.argv.includes('--node-only') ? [3100] : [3100, 8080];
for (const port of ports) {
  for (const [id, status, body] of [
    [7, 200, {id: 7, title: 'Index'}], [8, 404, {error: 'not_found'}]
  ]) {
    const r = await fetch('http://127.0.0.1:' + port + '/notes/' + id);
    assert.equal(r.status, status);
    assert.match(r.headers.get('content-type') ?? '', /^application\/json(?:;|$)/i);
    assert.deepEqual(await r.json(), body);
    console.log(port, id, 'PASS');
  }
}
```

若 Spring 尚未備妥，可以先執行 `node probe.mjs --node-only` 確認參考端與探針。這只測 3100，不是兩端相容的證據；完整驗收時不要帶這個選項。

### 不啟動伺服器也能守住 Web 層
在上一堂專案的 `src/test/java/lab/notes/NoteControllerTest.java` 存下測試。使用產生專案的測試相依，須含 JUnit Jupiter、Spring Test 與 JSONPath。MockMvc 經過框架的請求對應和訊息轉換，但使用模擬請求，不開網路連接埠。這裡直接掛控制器，能測欄位與錯誤，不會測到正式應用的整套設定。

```java
package lab.notes;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class NoteControllerTest {
    @Test void bothOutcomes() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new NoteController()).build();
        mvc.perform(get("/notes/7")).andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.id").value(7))
            .andExpect(jsonPath("$.title").value("Index"));
        mvc.perform(get("/notes/8")).andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("not_found"));
    }
}
```

在含有 `pom.xml` 的練習專案根目錄執行 `.\mvnw.cmd "-Dtest=NoteControllerTest" test`；macOS／Linux 用 `./mvnw -Dtest=NoteControllerTest test`。對照兩層的證據：外部探針可發現實際媒體型別與連接埠設定不對；內部測試可在改控制器後快速指出哪個斷言破了。兩者都不驗證登入權限、寫入競爭或資料庫故障，沒測的事情不要納入相容宣告。

### 失敗訊息要能導向下一個檢查
如果連線還沒建立就中止，先確認服務視窗與連接埠；若有狀態碼但不是預期值，回到路由與查無資料分支；若只有物件比較失敗，才沿相應欄位找轉型或命名差異。兩個服務不必同時重寫，也不要為了讓測試全部變綠就放寬每一條斷言。只在契約真的允許另一種表示時，才把那項差異列為例外，並留下呼叫端如何解讀它的例子。

## 常見錯誤
直接比 JSON 文字，空白或欄位順序不同也會被判失敗；先解析再比結構。反過來只比標題，可能放過錯誤狀態或編號型別。把數字改成字串做一次負向對照，兩邊都回復後再跑成功案例，才能知道這個測試真的能抓到你在意的改動。

## 小結
兩個執行環境，共用一份預期；一種測試跨過真實 HTTP 邊界，一種留在 Web 層。失敗時先問是哪一層看見什麼，而不是把所有紅字都叫成「移植失敗」。
