---
id: fs-quality-03-keyboard
module: fs-quality
order: 4
title: 可及性與鍵盤驗收
subtitle: 從欄位名稱找到送出按鈕
status: ready
minutes: 30
level: 3
prereqs:
  - fs-quality-02-integration
objectives:
  - 用使用者可見的名稱尋找元件
  - 只用鍵盤重播錯誤後再成功的流程
tags:
  - quality
  - accessibility
resources:
  - title: "W3C WAI：表單的錯誤與成功通知"
    url: "https://www.w3.org/WAI/tutorials/forms/notifications/"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-quality-03-keyboard-label"
    prompt: "哪種做法最能讓輸入框的用途清楚且可定位？"
    answer: "使用可見的 label，並與輸入框明確關聯。"
    mcq:
      options:
        - "只在輸入框內放會消失的範例。"
        - "只替邊框換顏色。"
        - "使用可見的 label，並與輸入框明確關聯。"
        - "用上一個兄弟節點的 CSS 類別命名。"
      answer: 2
      explain: "可見標籤和程式化關聯讓眼睛與輔助工具能找到同一欄。"
    interview:
      question: "滑鼠測試都過了，如何補驗表單的鍵盤操作？"
      points:
        - "依正反向順序觀察焦點"
        - "只用鍵盤觸發與修復錯誤"
        - "檢查文字關聯與成功回饋"
      answer: "我從頁首按 Tab，看焦點能否到欄位和送出。先故意空白送出，確認錯誤說明和修正位置，再填值完成。不把這個結果冒充完整的螢幕閱讀器驗證。"
  - id: "fs-quality-03-keyboard-focus"
    prompt: "送出後發現必填欄空白，哪種回饋最有助修正？"
    answer: "用文字說明原因，把焦點導回可修正的欄位。"
    mcq:
      options:
        - "清空表單並把焦點移到頁尾。"
        - "只把背景變紅。"
        - "立即關閉視窗。"
        - "用文字說明原因，把焦點導回可修正的欄位。"
      answer: 3
      explain: "錯誤需要原因和能採取的下一步，單靠顏色並不夠。"
  - id: "fs-quality-03-keyboard-path"
    prompt: "只用鍵盤驗收表單時，應驗證到哪一步？"
    answer: "從找到欄位、觸發錯誤，一直到修正後成功。"
    mcq:
      options:
        - "從找到欄位、觸發錯誤，一直到修正後成功。"
        - "按一次 Tab 就完成。"
        - "只檢查每個元素都有 tabindex。"
        - "只確認滑鼠點得到送出。"
      answer: 0
      explain: "單一按鍵事件不能證明完整流程可操作。"
  - id: fs-quality-03-keyboard-reading
    prompt: "鍵盤走得完整能證明螢幕閱讀器的宣讀也正確嗎？"
    answer: "不能。鍵盤驗證可到達與可操作；名稱、說明與動態訊息的實際宣讀仍要另驗。"
practice:
  - id: "fs-quality-03-keyboard-p1"
    title: "留下錯誤與修正的鍵盤路線"
    kind: "hands-on"
    minutes: 12
    steps:
      - "打開 keyboard.html，放下滑鼠"
      - "用 Tab 到按鈕後 Enter 送空值，再補一個標題重送"
      - "記錄焦點、錯誤文字及成功狀態"
    checks:
      - "可見焦點由欄位到按鈕且可逆向回去"
      - "錯誤後不用滑鼠便能修正並看見成功"
---

## 為什麼要學：錯誤出現後，手還在鍵盤上的人怎麼辦？

試著只用鍵盤提交一張空表單。如果按鈕會變紅，焦點卻不知去向，使用者仍不知道哪裡需要修改。可及性（accessibility）不是為了通過元素數量檢查，而是讓使用不同方式的人真的能完成工作。這堂用能從失敗走回成功的短路徑驗收，不把「可以按到」誤認成「可以用完」。

## 核心概念：名稱、焦點、回饋各做一件事

可及名稱（accessible name）說明控制項用途。可見的標籤用 `for` 連到欄位的 `id`；提示文字可以舉例，但輸入後就消失的提示不能當唯一標籤。鍵盤焦點（focus）表示下一次按鍵落在哪裡，順序應符合閱讀與操作順序。原生按鈕自帶鍵盤行為；若用普通區塊塗成按鈕，外觀相同也不會自動取得相同操作。

錯誤要用文字說明問題、指出修正位置，並與欄位關聯。`aria-invalid` 標記目前值無效，`aria-describedby` 連到說明；兩者不是拿來取代可見文字。成功也要有回饋，例如預先存在的狀態區（status region），在完成時更新內容。別為了讓每段提示都搶話，把沒有必要的控制項塞進焦點順序。

## 範例：錯誤之後不用滑鼠也能繼續

在 `C:\dev\stackway-lab\quality` 將下段存為 `keyboard.html`，用瀏覽器開啟。範例沒有外部資源，不會儲存或送出任何輸入；練習要觀察介面如何回應。先按 Tab 走到欄位，再到按鈕，按 Shift+Tab 看能否回到同一欄。

```html
<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>書籤標題</title>
<style>:focus-visible{outline:3px solid #11634f;outline-offset:3px}</style>
<form novalidate><label for="title">書籤標題（必填）</label>
<input id="title" required aria-describedby="hint"><span id="hint"></span>
<button>儲存</button></form><p role="status"></p>
<script>
const field = document.querySelector("input"), hint = document.querySelector("#hint");
const statusBox = document.querySelector('[role="status"]');
document.querySelector("form").onsubmit = e => {
  e.preventDefault();
  const ok = field.value.trim() !== "";
  field.setAttribute("aria-invalid", String(!ok));
  hint.textContent = ok ? "" : "請輸入書籤標題。";
  statusBox.textContent = ok ? "已儲存：" + field.value.trim() : "";
  if (!ok) field.focus();
};
</script></html>
```

空白送出後，應同時看到錯誤原因、欄位的焦點外框；直接輸入標題便能修正。再按 Tab 到儲存並按 Enter，確認舊錯誤消失，成功訊息帶有剛才的標題，不是固定一行與輸入無關的文字。只靠截圖看得出顏色，看不出焦點移動順序，所以還要寫一行按鍵路線。

### 讓驗收紀錄能區分 3 種失敗

假如按鍵到不了輸入框，先記最後一次看見焦點的位置，這是焦點路徑問題。如果到得了也輸入得了，卻不知道要填什麼，就是名稱或說明的問題。如果按得下送出，卻不知道成功或失敗，應檢查回饋是否與欄位及目前操作對得上。三種情況的截圖可能都是同一張表單，但修法完全不同。可讓另一位練習者只照你的文字路線重播，不先告知滑鼠要點哪裡；只要有一步需要猜位置，便把那一步的名稱和預期焦點補清楚。

## 常見錯誤與小結

不要用正的 `tabindex` 逐一硬排順序來補救不合理的文件結構；之後新增欄位時，畫面順序與鍵盤順序更容易分家。鍵盤驗收也不能取代螢幕閱讀器的實際宣讀測試。能確定的是這條從錯誤回到成功的路不需要滑鼠；其他輔助工具及瀏覽器組合應分開記錄。
