---
id: fs-css-06-responsive
module: fs-css
order: 6
title: 響應式設計與媒體查詢
subtitle: 窄視窗改單欄，內容不消失
status: ready
minutes: 35
level: 2
prereqs:
  - fs-css-05-position
objectives:
  - 從單欄加上符合內容的中斷點
  - 驗證中斷點兩側都能操作而沒有橫向捲動
tags:
  - css
  - responsive
resources:
  - title: MDN：媒體查詢
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Media_queries
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-css-06-inclusive
    prompt: "min-width: 640px 在哪個寬度首次成立？"
    answer: "在剛好 640 個 CSS 像素時就成立。"
    mcq:
      question: "頁面用 @media (min-width: 640px) 改成雙欄。從窄拉寬時哪一點開始雙欄？"
      options:
        - "639px"
        - "641px"
        - "640px"
        - "視裝置型號而定"
      answer: 2
      explain: "min-width 包含等號，並非必須大於門檻。"
    interview:
      question: "你怎麼證明中斷點改版後沒有少掉操作？"
      points:
        - "測門檻兩側與窄端"
        - "用鍵盤找到同一操作"
        - "確認沒有橫向裁切"
      answer: "我會固定縮放測 639 與 640，再測更窄處。每次都用 Tab 找按鈕，確認文字與焦點完整；只切換欄數不能算驗收通過。"
  - id: fs-css-06-content
    prompt: "應根據什麼選出本頁的中斷點？"
    answer: "根據內容、操作及間距何時能舒適並排。"
    mcq:
      question: "怎麼選擇兩欄改單欄的中斷點，才不會漏掉桌機分割視窗的讀者？"
      options:
        - "只看最熱門手機型號"
        - "內容能否好讀好操作"
        - "固定抓螢幕實體像素的一半"
        - "只看裝置是否觸控"
      answer: 1
      explain: "同一裝置可以有多種視窗大小，名稱不保證可用空間。"
  - id: fs-css-06-overflow
    prompt: "窄版有水平捲動，優先調查什麼？"
    answer: "找第一個超過容器的元素與原因。"
    mcq:
      question: "手機寬度下出現橫向捲動，哪個做法能找出原因而不藏起內容？"
      options:
        - "定位超寬子元素"
        - "直接隱藏全部溢位"
        - "移除主要按鈕"
        - "禁止縮放"
      answer: 0
      explain: "隱藏捲動或禁止縮放可能讓內容永遠看不到。"
practice:
  - id: fs-css-06-p1
    title: "記錄兩側邊界與兩個端點"
    kind: hands-on
    minutes: 15
    steps:
      - "建立頁面並分別設定 320、639、640、900 像素寬。"
      - "逐次記下欄數、Tab 焦點和橫向溢位。"
      - "另測字級放大與雙倍長文字，保存窄版畫面。"
    checks:
      - "639 單欄、640 雙欄。"
      - "最窄版本仍可聚焦加入清單。"
      - "四個寬度皆不用左右捲動才能讀完。"
---

## 為什麼要學

讀者把瀏覽器放在另一個視窗旁，路線說明突然只剩半行，必須左右拖才能按「加入」。這不只是手機問題：桌機分割視窗、放大頁面、較長的文字，都會讓內容可用寬度變小。響應式設計（responsive design）的目標是讓同一份內容在不同空間仍好用，而不是維護一份手機版再複製一份桌機版。

## 核心概念

先設計窄時的基本排列：說明在前，行動在後，內容自然往下接。媒體查詢（media query）是一層條件，只有條件成立時，括號後面那組規則才參與階層比較。`@media (min-width: 640px)` 的意思是視窗寬度至少 640 個 CSS 像素，包含剛好等於的那一刻。條件關心的是現在可用的視窗，不是裝置品牌，更不是偵測觸控能力。

中斷點（breakpoint）應從內容需求選出來。這張卡需要給說明欄足夠閱讀寬度，再給按鈕欄和中間間距；排兩欄太擠時，就留一欄。手機文件開頭的視窗宣告（viewport meta）告訴瀏覽器使用裝置寬度當排版基準，不要把一張寬頁縮成一張小圖。不要關掉縮放，讀者放大頁面也是版面應支援的一種用法。

## 範例：用相鄰的 2 個寬度抓邊界

在 `C:\dev\stackway-lab\css-lab` 建立 `responsive.html`。開啟頁面，先從窄處讀到「加入清單」，再慢慢拉寬。頁面沒有外部素材，在其他系統開同檔即可比對。

```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>集合說明</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 1rem; }
.plan { display: grid; gap: 1rem; max-width: 64rem; margin: auto; }
article, aside { padding: 1rem; background: #edf2ec; min-width: 0;
                 overflow-wrap: anywhere; }
@media (min-width: 640px) {
  .plan { grid-template-columns: minmax(0, 1fr) 12rem; }
}
</style>
<main class="plan"><article><h1>集合前先讀</h1>
<p>先確認入口是否開放，再從步道標誌所在的一側集合。</p></article>
<aside><h2>準備出發</h2><button>加入清單</button></aside></main>
</html>
```

在瀏覽器的裝置工具列選可自訂的寬度，把單位當成 CSS 像素。先輸入 639，確認兩區由上到下，按鈕可用 Tab 聚焦；再輸入 640，控制區應移到右方。回到 320 看最窄的使用情況，最後拉到 900 看寬頁有沒有因為按鈕太遠而難找到。四個寬度驗不同的事，單看兩張漂亮的端點截圖，會錯過等號寫錯的問題。

用工具將說明文字換成 2 倍長，暫時把字放大，檢查看不看得到全文與按鈕，以及焦點外框有沒有被裁掉。當畫面明明是單欄卻仍出現橫向捲動，沿著元素邊界往內找第一個超寬的子元素，例如固定寬度的圖、很長不能斷行的代碼；修它的寬度或斷行方式，比把整頁溢位隱藏可靠。

## 常見錯誤

窄版直接隱藏主要操作雖然不會擠，卻把能完成的任務也刪了。另一個陷阱是只用滑鼠拖到「差不多手機大」就算通過；用中斷點兩邊相差 1 像素的寬度，才能知道條件和樣式有沒有剛好接上。檢查寬度時固定頁面縮放，再另外測放大，不要一次改兩個條件卻猜是哪個造成差異。

手動把視窗停在斷點前後各一個像素。頁面是否改排，應由媒體查詢的條件決定，不是由使用者拿哪一款裝置決定。

## 小結

窄版先能完成任務，寬版才增加並排。把寬度、欄數、是否能聚焦、是否橫向溢位記成四筆驗收紀錄；這張小紀錄比列出支援哪些手機型號更耐用。
