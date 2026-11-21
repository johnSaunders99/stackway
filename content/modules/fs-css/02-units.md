---
id: fs-css-02-units
module: fs-css
order: 2
title: CSS 尺寸與單位
subtitle: 放大文字後卡片還裝得下嗎
status: ready
minutes: 30
level: 2
prereqs:
  - fs-css-01-cascade
objectives:
  - 比較 px、rem、百分比與視窗單位的參考基準
  - 用相同元件驗證字級調整與最大寬度
tags:
  - css
  - units
resources:
  - title: MDN：CSS 值與單位
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Values_and_units
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-css-02-root
    prompt: "根字級由 16px 改成 20px，1.5rem 會是多少？"
    answer: "變成 30px，因為 rem 參考根字級。"
    mcq:
      question: "根字級從 16px 改為 20px，內距 1.5rem 現在相當於多少？"
      options:
        - "24px"
        - "20px"
        - "30px"
        - "1.5px"
      answer: 2
      explain: "原本是 24，新的基準為 20，不是固定沿用初值。"
    interview:
      question: "怎麼分辨卡片是碰到上限還是受父容器限制？"
      points:
        - "量父寬並算百分比"
        - "比較換算後的上限"
        - "縮窄或調根字級驗證"
      answer: "我先算父容器的 3/4，再把上限換成像素，較小者應該生效。接著只改一個條件，看計算值是否跟著變，同時確認文字沒有被裁掉。"
  - id: fs-css-02-percent
    prompt: "在本例中卡片的 width: 75% 以誰為基準？"
    answer: "以外層 frame 的內容寬度為基準。"
    mcq:
      question: "卡片是普通區塊，外層寬 80vw。卡片的 width: 75% 直接以什麼為基準？"
      options:
        - "視窗寬"
        - "父容器內容寬"
        - "根字級"
        - "卡片文字長度"
      answer: 1
      explain: "外層才使用 vw，卡片還要再乘上自己的比例。"
  - id: fs-css-02-cap
    prompt: "max-width 比指定的百分比寬度大時，會撐大卡片嗎？"
    answer: "不會，上限只在寬度會超過它時限制結果。"
    mcq:
      question: "百分比寬度算出 240px，最大寬度算出 384px，為什麼卡片仍是 240px？"
      options:
        - "最大寬度只是上限"
        - "最大寬度是寬度的下限"
        - "2 項要相加才是實際寬度"
        - "宣告百分比就會使最大寬度一律失效"
      answer: 0
      explain: "最大寬度不是要求至少撐到該值。"
practice:
  - id: fs-css-02-p1
    title: "保存 3 組閱讀卡尺寸"
    kind: hands-on
    minutes: 13
    steps:
      - "開 units.html，在寬、窄視窗各量外層與卡片。"
      - "固定窄視窗，提高根字級再量內距。"
      - "在筆記記下三組讀值與各自命中的限制。"
    checks:
      - "寬時能找到最大寬度上限。"
      - "窄時卡片約為父寬的 3/4。"
      - "較大字級下仍讀得到完整末句。"
---

## 為什麼要學

在大螢幕剛好放一行的步道說明，調大預設字級後換了三行。卡片如果被鎖死高度，最後一句可能擠出邊框。解方不是把字縮小到所有人都得瞇眼，而是先問：「這個尺寸本來該跟誰一起改變？」今天用同一張卡做三種改變：改根字級、改父容器寬、改視窗寬，從量到的數字分清參考對象。

## 核心概念

CSS 像素（CSS pixel，px）是排版用的長度，同一個 CSS 像素不一定正好對應面板的一顆實體像素。根字級單位（rem）參考根元素的字級；若根字級是 16 個像素，2 個 rem 就是 32 個像素。把內距用 rem 表示，是讓留白跟文字一起呼吸；細邊線若只是分隔，可以保留一個像素。不要假定每個人的根字級一定是 16。

百分比（percentage）要問的是哪個屬性。在這堂的一般區塊中，卡片的百分比寬度相對於包含區塊的內容寬度，不是相對於自己的文字行數。視窗單位（viewport unit）裡的 `vw` 以視窗寬度 1% 為一單位，不管卡片是不是放在很窄的側欄。`max-width` 是上限而不是保證尺寸；搭配可縮的寬度時，窄處能縮，寬處仍不至於讓一行長到讀者找不到下一行。

## 範例：先找上限，再找比例

在 `C:\dev\stackway-lab\css-lab` 建立 `units.html`。用 Chrome 或 Edge 開檔；其他系統可在對應練習目錄開啟同一頁。

```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>量一張閱讀卡</title>
<style>
* { box-sizing: border-box; }
.frame { width: 80vw; background: #eee; }
.card { width: 75%; max-width: 24rem; padding: 1rem;
        border: 1px solid #445; font-size: 1rem; background: white; }
</style>
<main class="frame"><article class="card">
<h1>東門集合</h1><p>請把集合地點與備用入口都讀完，再決定今天的路線。</p>
</article></main>
</html>
```

在開發者工具點選外層，再點卡片，在盒模型（box model）圖中分別讀出寬度與內距。這裡採用 `border-box`，所以指定的卡片寬度已包含內距與邊線。假設視窗寬 1000、根字級 16，外層約 800，卡片原本能拿 600，卻被 24 個根字級單位限制成 384。把視窗縮到 400，外層約 320，卡片應約 240；此時真正限制它的是百分比，而不是上限。

在樣式區暫時加入 `html { font-size: 125%; }`，保留窄視窗再讀一次。若原根字級 16，內距應由 16 變 20；窄時卡片寬度仍可能一樣，因為百分比仍是較小的限制。字變大而卡片沒變寬並不矛盾，可以改換行數並自然長高。把字級規則也存進自己的檔案，對照重整前後，而不是只記住工具面板上的暫時狀態。

## 常見錯誤

看到百分比就一律說是螢幕寬度，會讓巢狀元件的預測差一截。也不要用瀏覽器整頁縮放的截圖證明 rem 獨有的行為：整頁縮放會改變不只文字，這裡要固定視窗，單獨改根字級。最後檢查卡片的末句是否完整，而不只是量第一行有沒有對齊。

先固定瀏覽器寬度，只改父容器，再固定父容器，只改視窗。能在兩次試驗中說出哪個量跟著動，才是真的找到計算基準；只抄開發者工具的最終像素值，還不能預測下一次縮放。

## 小結

把單位當成關係：邊線維持簡單，留白跟根字級，卡片跟父層，外框跟視窗。用一寬一窄與一次字級調整，就能分辨哪一個條件真的在控制尺寸。
