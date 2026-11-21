---
id: fs-quality-04-journey
module: fs-quality
order: 5
title: 端對端測試
subtitle: 一條端對端驗收路徑
status: ready
minutes: 35
level: 3
prereqs:
  - fs-quality-03-keyboard
objectives:
  - 用瀏覽器操作建立再編輯一筆資料
  - 改用明確狀態等待而非固定秒數
tags:
  - quality
  - e2e
resources:
  - title: "Playwright：以可見行為驗收"
    url: "https://playwright.dev/docs/best-practices"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-quality-04-journey-journey"
    prompt: "端對端測試與單一元件測試的差異在哪裡？"
    answer: "從使用者入口跨過本次產品的真實邊界，核對整個結果。"
    mcq:
      options:
        - "一定要用正式使用者資料。"
        - "只測一個函式回傳值。"
        - "必須把每個內部變數都記錄。"
        - "從使用者入口跨過本次產品的真實邊界，核對整個結果。"
      answer: 3
      explain: "邊界取決於產品，本機工具可能以瀏覽器儲存為終點，遠端產品則不同。"
    interview:
      question: "只能保留一條書籤工具的端對端測試，你選哪條？"
      points:
        - "建立可辨認的一筆"
        - "編輯並等待明確完成"
        - "重新載入核對唯一與持久化"
      answer: "我用乾淨練習環境建書籤，再改掉標題，等可見收據顯示成功，重新整理確認只有新標題沒有多一筆。這條路短，但能抓到按鈕接錯、更新變新增與沒有保存。"
  - id: "fs-quality-04-journey-wait"
    prompt: "如何等待儲存完成，而不猜一個秒數？"
    answer: "在有限逾時內等到會隨實際完成才出現的狀態。"
    mcq:
      options:
        - "在有限逾時內等到會隨實際完成才出現的狀態。"
        - "每次固定等 5 秒就繼續。"
        - "只要按鈕可按就認定已寫入。"
        - "無限重試直到找到任何文字。"
      answer: 0
      explain: "穩定等待的是可觀察的契約，逾時則留下目前畫面協助判斷。"
  - id: "fs-quality-04-journey-persist"
    prompt: "編輯後重新整理頁面驗到什麼？"
    answer: "從持久層重新載入的仍是編輯後那筆資料。"
    mcq:
      options:
        - "所有伺服器一定正常備份。"
        - "從持久層重新載入的仍是編輯後那筆資料。"
        - "原本的輸入框能顯示剛打的字。"
        - "任何瀏覽器都會共用同一筆資料。"
      answer: 1
      explain: "重新載入排除了只在暫時畫面中變更的假成功。"
practice:
  - id: "fs-quality-04-journey-p1"
    title: "交一份建立到編輯的瀏覽器驗收紀錄"
    kind: "hands-on"
    minutes: 12
    steps:
      - "在全新的練習分頁依範例建立再修改"
      - "依標題收據而非秒數判斷可繼續"
      - "重新整理並保存最後畫面與操作順序"
    checks:
      - "先見初稿再見定稿"
      - "重新整理後紀錄仍為 1 筆且顯示定稿"
---

## 為什麼要學：文字在輸入框裡，不代表真的存好了

一個書籤工具有三項分開測都會過的功能：輸入標題、按儲存、顯示紀錄。但接在一起時，第二次儲存可能誤建一筆，重新整理之後也可能只剩初稿。端對端測試（end-to-end test，E2E）從真實入口走完一條有價值的旅程，驗的是各部分串起來之後交付的內容，而不是每個內部函式是否曾被呼叫。

## 核心概念：每一步由可觀察的結果接棒

寫下起點、操作、完成訊號、最後從何處重讀。本課的產品邊界是瀏覽器中的單筆便條與其本機儲存（localStorage），沒有遠端資料庫。如果正式產品會呼叫後端，把後端全換成假資料就不能宣稱整個線上儲存路徑都測過。測試名稱與報告都應指出走到哪裡，不用把小例子說大。

等待條件要和業務完成有關。按了按鈕或轉圈消失不必然代表資料已寫入；本例要看到帶正確標題的保存收據。自動化工具如 Playwright 可用角色與名稱定位，再用會重試的斷言在合理期限內等到指定文字。固定睡眠（fixed sleep）在慢機器可能太短，在快機器又白等；逾時應保留當時畫面及預期，別讓流程無限等下去。

## 範例：做一個重新整理也能驗收的便條

在 `C:\dev\stackway-lab` 新建僅放教材的 `journey-lab` 子目錄，存下 `journey.html`。在該子目錄以 PowerShell 執行 `py -m http.server 8765 --bind 127.0.0.1`；macOS／Linux 改用 `python3`。瀏覽器開本機位址 `127.0.0.1:8765/journey.html`，用新的無痕視窗開始，不必清除一般瀏覽器資料。完成後以 Ctrl+C 停止教材伺服器。

```html
<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>單筆便條</title>
<label for="draft">標題</label><input id="draft"><button>儲存</button>
<p role="status"></p><ul></ul>
<script>
const key = "stackway-journey-note-v1", box = document.querySelector("input");
const statusBox = document.querySelector('[role="status"]'), list = document.querySelector("ul");
function read() {
  const old = localStorage.getItem(key);
  list.replaceChildren();
  if (old !== null) {
    const item = document.createElement("li");
    item.textContent = old;
    list.append(item);
    box.value = old;
  }
}
document.querySelector("button").onclick = () => {
  const value = box.value.trim();
  if (!value) return;
  localStorage.setItem(key, value);
  read();
  statusBox.textContent = "已保存：" + value;
};
read();
</script></html>
```

先填「初稿」，儲存並等到相符收據；把輸入框改成「定稿」，再儲存。重新整理後，先看清單有幾列，再讀那一列內容。最後顯示一列定稿，才能同時排除「只改輸入框」與「把編輯當新增」。若只查畫面上任何地方有定稿兩字，收據本身就可能讓錯誤實作通過。

### 把失敗停在第 1 個不一致的位置

若第一次儲存後連收據都沒出現，先保留當時輸入與畫面，問題在送出或回饋之前；若兩次收據都正確，重新整理才出錯，持久化或載入才是更窄的檢查方向。還有一個容易忽略的情況：重整後畫面看似正確，其實是上一回測試殘留的相同標題。讓新一輪從空清單開始，也可把測試標題換成當輪能辨認的詞，這樣最後的一列確實得由本輪操作產生。不要讓失敗的腳本跳過中間步驟繼續跑到底，那樣最後的錯誤常常離原因最遠。

## 常見錯誤與小結

不要把日常使用中的便條拿來測，更不要為了回到乾淨狀態清除整個網站儲存。讓這條旅程有獨立的測試來源、已知起點和容易辨認的資料。保留一條有代表性的完整旅程就很有價值；各種非法輸入和金額邊界留給較小、較快且失敗原因更明確的測試。
