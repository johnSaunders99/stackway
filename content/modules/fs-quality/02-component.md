---
id: fs-quality-02-component
module: fs-quality
order: 2
title: React 元件測試
subtitle: 按下送出後應該看到什麼
status: ready
minutes: 35
level: 3
prereqs:
  - fs-quality-01-units
objectives:
  - 用角色與可見名稱查找元件
  - 模擬一次互動並斷言可見結果，而非內部狀態
tags:
  - quality
  - component
resources:
  - title: "Testing Library：測試 React 互動"
    url: "https://testing-library.com/docs/react-testing-library/example-intro/"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-quality-02-component-role"
    prompt: "要找到讀者點的儲存按鈕，哪種查詢最接近操作意圖？"
    answer: "按角色 button 與可及名稱「儲存」查找。"
    mcq:
      options:
        - "按角色 button 與可及名稱「儲存」查找。"
        - "查第三個 div。"
        - "查 CSS 顏色名稱。"
        - "查元件內部狀態變數。"
      answer: 0
      explain: "角色說明能做的動作，名稱分辨是哪個控制項。"
    interview:
      question: "換掉內部狀態名稱，測試要不要跟著改？"
      points:
        - "優先測操作契約"
        - "從角色與名稱定位"
        - "斷言可見結果而非實作"
      answer: "若使用者行為沒變，我不希望測試跟著重寫。我會點有名字的儲存按鈕，等待已儲存或失敗提示；若讀不到按鈕，先查是不是介面真的失去了可辨認的名稱。"
  - id: "fs-quality-02-component-wait"
    prompt: "按下送出後何時應核對成功？"
    answer: "等待使用者可見的成功結果出現。"
    mcq:
      options:
        - "固定睡 1 秒後假定成功。"
        - "等待使用者可見的成功結果出現。"
        - "點擊函式有呼叫就視為完成。"
        - "讀 React 私有欄位當結果。"
      answer: 1
      explain: "互動結束和非同步儲存完成不一定是同一刻。"
  - id: "fs-quality-02-component-isolate"
    prompt: "用測試提供的儲存函式檢查元件，能證明到哪裡？"
    answer: "給定成功或失敗結果時，元件呈現的行為正確。"
    mcq:
      options:
        - "真實資料庫一定寫入。"
        - "登入權限一定有效。"
        - "給定成功或失敗結果時，元件呈現的行為正確。"
        - "所有瀏覽器都能使用鍵盤。"
      answer: 2
      explain: "控制外部相依讓結果穩定，但完整服務與真實裝置需其他驗證。"
  - id: fs-quality-02-component-before
    prompt: "立即完成的儲存替身能充分證明等待中的畫面嗎？"
    answer: "不能。應使用可由測試控制完成時間的替身，先驗未完成時的畫面，再讓它完成並驗成功狀態。"
practice:
  - id: "fs-quality-02-component-p1"
    title: "留下一張按鈕互動的測試收據"
    kind: "hands-on"
    minutes: 12
    steps:
      - "在獨立練習專案放入 Save.test.jsx 並執行"
      - "把按鈕文字改成「另存」重跑"
      - "改回後把內部狀態改名並比較結果"
    checks:
      - "改操作名稱會讓查找失敗"
      - "只改內部變數且畫面不變時測試仍通過"
---

## 為什麼要學：函式算對，不等於按鈕真的有用

使用者想知道「我按下儲存之後，頁面會不會告訴我完成了？」就算儲存函式的單元測試都通過，也可能忘了把按鈕接上事件，或在失敗時仍顯示成功。元件測試（component test）掛載一小塊真正的 React 介面，從讀者可以採取的動作出發，核對它產生的可見結果。

## 核心概念：以角色和名稱找，不以程式的骨架找

原生按鈕帶有按鈕角色（role），文字通常提供它的可及名稱（accessible name）。角色告訴你這是可操作的按鈕，名稱則從多個按鈕中指出哪一個。Testing Library 的 `getByRole` 在當下找不到或找到太多都會報錯；`findByText` 可等候稍後才出現的文字。讀取 React 內部狀態就算成功，也不能證明螢幕上有人看得到結果。

把測試環境提供的儲存函式傳入元件，讓互動不必等待真服務。這裡的承諾只到「儲存函式完成後顯示成功」，不宣稱真的寫進資料庫。使用 `userEvent` 模擬點擊，等待互動完成，再等待結果；這比自己呼叫處理函式更接近讀者途徑，也能抓出元件雖有函式卻沒接上按鈕的問題。

## 範例：讓一個真的 React 按鈕接受測試
先依[〈JSX 語法〉](#/lesson/fs-react-01-jsx)的方法在 `C:\dev\stackway-lab\quality` 內建立測試用的 `react-lab`，或開啟已能啟動的練習副本。切到有 `package.json` 的目錄，用 PowerShell 執行 `npm.cmd install -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/dom`。把下方元件與測試一起存成專案根目錄的 `Save.test.jsx`，執行 `npx.cmd vitest run --environment jsdom Save.test.jsx`；macOS／Linux 的兩條指令分別用 `npm`、`npx`。

```jsx
import React, {useState} from "react";
import {test, expect} from "vitest";
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
function Save({save}) {
  const [message, setMessage] = useState("尚未儲存");
  return <><button onClick={async () => { await save(); setMessage("已儲存"); }}>
    儲存</button><p role="status">{message}</p></>;
}
test("shows the result after saving", async () => {
  const user = userEvent.setup();
  render(<Save save={async () => {}} />);
  expect(screen.getByRole("status").textContent).toBe("尚未儲存");
  await user.click(screen.getByRole("button", {name:"儲存"}));
  const result = await screen.findByText("已儲存");
  expect(result).toBe(screen.getByRole("status"));
});
```

第一個斷言讓這題不能靠一開始就顯示成功蒙混過關。最後不只找成功文字，還核對是狀態區的內容。試著把按鈕移到新的排版容器；只要角色與名稱不變，測試就不需知道它是第幾個子元素。

### 分辨「真的等到完成」和「按了就先報喜」

把儲存想成一張要等別人蓋章的單子。按鈕被點時只是送件，章還沒蓋前不應宣布完成。目前這個立即成功的測試替身能證明最終畫面：這是可見結果，不是後端寫入的證明。它不能單獨證明等待途中一定正確。若這是產品要求，可再做一個由測試自行決定何時完成的儲存函式：先點按鈕，確認還沒顯示成功，再讓它完成，這才等待成功收據。若有人把更新文字移到等待之前，這個新增的反例就會揭露「假成功」，而不是單純因為電腦慢而突然失敗。

## 常見錯誤與小結

找不到按鈕時，不要第一時間換成能抓到內部節點的選擇器。先讀測試列出的角色與名稱，看是不是按鈕真的改名或不再可用。相反地，若需求沒有要求某個顏色或排版，就不要把它寫死在這個測試裡。一份好的互動證據在重構之後仍成立，在讀者真的無法完成操作時才變紅。
