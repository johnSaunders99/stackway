---
id: fs-html-04-layout
module: fs-html
order: 6
title: Flexbox 入門
subtitle: 讓卡片隨空間換行
status: ready
minutes: 30
level: 2
prereqs:
  - fs-html-03-box
objectives:
  - 在 flex 容器並排兩個項目，再比較換行前後的寬度
  - 選擇 Flexbox 或 Grid 的排列方向
  - 測試兩種寬度而不隱藏內文
tags:
  - html
  - layout
resources:
  - title: "MDN：Flexbox 的主軸、項目與換行"
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-html-04-layout-container
    prompt: "display: flex 該設在哪裡才能排列兩張並列卡片？"
    answer: "設在它們的共同父元素上，直接子元素才成為彈性項目。"
    mcq:
      question: "兩張卡是同一個 section 的直接子元素，誰該設為 flex 容器？"
      options:
        - "每張卡內的第一段文字"
        - "第一張卡的標題"
        - "包住兩張卡的 section"
        - "兩張卡之間的空白字元"
      answer: 2
      explain: "容器控制直接子項的排列，設在更深層只會改卡片內部。"
  - id: fs-html-04-layout-wrap
    prompt: "flex-wrap: wrap 允許什麼？"
    answer: "當同一列放不下項目及間距時允許分到下一列，而不是保證固定欄數。"
    mcq:
      question: "寬時兩卡並排、窄時想自然分列，應優先設定哪個？"
      options:
        - "flex-wrap: nowrap"
        - "把文字設透明"
        - "把溢出內容裁掉"
        - "flex-wrap: wrap"
      answer: 3
      explain: "換行保留整張卡；不換行或裁切不是重排。"
  - id: fs-html-04-layout-dimension
    prompt: "何時選 Grid 比 Flexbox 合適？"
    answer: "主要沿著一條軸排列可選 Flexbox；橫列和直欄都要對齊的版面可先考慮 Grid。"
    interview:
      question: "兩排作品卡的第二欄一定要上下對齊，你會怎麼選？"
      points:
        - "辨認是否有跨列對齊需求"
        - "說明 flex 各行獨立分配空間"
        - "需要二維軌道時選 Grid"
      answer: "若只是讓卡片隨空間自然流動，我會用 Flexbox；若不同列的欄線也要共用，我會優先用 Grid。不會為了湊齊外觀而塞空卡或把較長的內文藏掉。"
practice:
  - id: fs-html-04-layout-p1
    title: "留下兩種寬度下的完整卡片"
    kind: build
    minutes: 12
    steps:
      - "存好 layout.html，讓容器先取寬模式，觀察兩張卡的上緣。"
      - "依課文只改容器寬度成 280px，重新整理後讀完兩張卡。"
      - "再改回寬版，保存兩份觀察或裁切到作品區的截圖。"
    checks:
      - "寬模式同列，窄模式第二張在下一列。"
      - "兩種寬度下文字與閱讀順序都沒變，沒有按裝置名稱寫兩套內容。"
---

## 為什麼要學：讓版面自己決定下一張卡坐哪裡

作品頁要放兩張卡，「輸入」一張、「輸出」一張。桌面寬時並排方便對照，視窗變窄時則希望上下閱讀，不能為了塞在同一列把最後一句裁掉。彈性盒排版（Flexbox）讓你向一組項目的共同父元素描述排列方式，而不是為每張卡指定一個螢幕座標。

## 核心概念：容器管排列，項目表達空間需求

把父元素設為 `display: flex`，它就成為容器（flex container），直接子元素成為項目（flex item）。預設方向是一列；在本例一般橫排中文頁面，主軸（main axis）由左到右，交叉軸與它垂直。如果在每張卡本身設定，改到的是卡片內部內容的排列，不會讓兩張卡互相並排。

預設不換行。`flex-wrap: wrap` 才允許一行不夠時另起一行。`gap` 設項目之間的間距，並不是每張卡自己的內距。`flex: 1 1 180px` 的三份設定依序允許分到多餘空間、在需要時縮小，並以 180 像素當作分配前的基準。基準不是強制鎖死的最終寬度；有空間的那一行仍可以把卡片展寬。

## 範例：同一頁只換一個可用寬度

在 `C:\dev\stackway-lab\html-desk` 新增 `layout.html`，用瀏覽器在足夠寬的桌面視窗開啟。外層用 `max-width: 100%` 防止試驗區比視窗還寬。以下兩張卡都是容器的直接子元素，文件裡先放輸入，再放輸出。

```html
<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><title>2 張作品卡</title>
<style>
.deck { display: flex; flex-wrap: wrap; gap: 12px; width: 500px; max-width: 100%; }
.card { box-sizing: border-box; flex: 1 1 180px; padding: 12px; border: 1px solid #426254; }
</style></head><body><main><h1>分鐘報表</h1><div class="deck">
  <section class="card"><h2>輸入</h2><p>原稿保留 3 筆分鐘數。</p></section>
  <section class="card"><h2>輸出</h2><p>摘要可重跑，仍只有 1 行。</p></section>
</div></main></body></html>
```

容器足 500 像素時，2 個基準加一個間距可以放在同一列；扣掉間距，2 張卡平分後各約 244 像素。只把容器的 500 改成 280，2 個基準加間距已放不下，第二張就另起一列。這時每列只有 1 張，各自得到整列空間，並不是 2 張縮成 140。用兩張卡的上緣和右框位置比對，而不是只憑字有沒有換行猜測。

還可以遮住第二張卡的內文，只看卡片起點：窄時第二張的左框會回到第一張的左框下方；若只是文字折行，第二張卡自己的上緣並不會跑去下一列。把「字在卡內換行」與「整張卡換列」分開看，日後才知道要改文字規則還是容器規則。之後在[〈CSS Grid 網格〉](#/lesson/fs-css-04-grid)會再練跨列共用欄線。

## 常見錯誤：以為彈性排版會替所有格子排出棋盤

Flexbox 主要處理一個方向，換到下一行後那行會獨立分配空間，不保證上下兩行的欄線相同。若作品列表要求每列的第二欄都落在同一條線，格線排版（Grid）能同時定義列與欄，通常更貼近需求。這不是其中一個比較新或比較好，而是你究竟要排一串東西，還是要對齊一張二維格子。

如果只剩一張卡片看不出排列差異，先把其他卡片放回去，再觀察同一條主軸上的剩餘空間。

## 小結：保留內容，而不是保留欄數

寬版看能不能並排，窄版看能不能自然換行；兩次都要讀得到輸入與輸出，順序也應一致。留下這兩組尺寸和讀到的最後一句，下次改間距後就知道該用什麼條件重新查版面。
