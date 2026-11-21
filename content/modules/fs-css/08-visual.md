---
id: fs-css-08-visual
module: fs-css
order: 8
title: 間距、字級與色彩對比
subtitle: 不用加框也看得出閱讀順序
status: ready
minutes: 35
level: 2
prereqs:
  - fs-css-07-variables
objectives:
  - 用固定間距與字級尺度區分標題和內文
  - 檢查文字與背景對比並補上非色彩提示
tags:
  - css
  - visual
resources:
  - title: USWDS：字體與字級
    url: https://designsystem.digital.gov/components/typography/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: W3C：文字最低對比要求
    url: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-css-08-grouping
    prompt: "要讓標題與原因看成一組，間距怎麼安排最直接？"
    answer: "讓組內距離小於與下一組之間的距離。"
    mcq:
      question: "同一頁有一組標題與原因，以及另一組集合指示。怎樣用距離讓分組更清楚？"
      options:
        - "組內近、組間遠"
        - "所有段落距離相同"
        - "只把背景換色"
        - "每行都加粗"
      answer: 0
      explain: "距離差本身表達關係，不必多一層裝飾。"
    interview:
      question: "設計說附註要淡一點，你怎麼兼顧閱讀層級？"
      points:
        - "先量實際背景上的文字對比"
        - "用間距字級分層"
        - "驗收小字與非色彩提示"
      answer: "我會先量附註和背景，不用淡到不合格來表達次要。改用位置與較小字級，再確認數值達標；狀態另外寫成文字，去掉顏色也讀得懂。"
  - id: fs-css-08-ratio
    prompt: "一般大小的內文要達到文字對比 AA，至少要多少？"
    answer: "一般文字至少 4.5 比 1。"
    mcq:
      question: "依 WCAG AA 的一般文字對比要求，白底小字附註最低應達幾比一？"
      options:
        - "3 比 1"
        - "2 比 1"
        - "只要看得見即可"
        - "4.5 比 1"
      answer: 3
      explain: "大字才有較低門檻，小字不能因資訊次要就放寬。"
  - id: fs-css-08-label
    prompt: "若讀者無法區分綠色與褐色，哪種狀態提示仍成立？"
    answer: "用明確文字寫出注意或開放，顏色只輔助。"
    mcq:
      question: "要讓無法分辨兩種提示色的讀者知道路線是「注意」或「開放」，應採哪個做法？"
      options:
        - "只改顏色飽和度"
        - "只改兩種色相"
        - "保留狀態文字"
        - "把狀態藏到滑鼠移入"
      answer: 2
      explain: "色票再漂亮也不會自動傳達語意，狀態要有可讀線索。"
practice:
  - id: fs-css-08-p1
    title: "交付可讀的改道通知"
    kind: hands-on
    minutes: 15
    steps:
      - "存下通知頁，標出同組與跨組的兩種間距。"
      - "量原附註與淺灰候選色在白底的比值，再還原。"
      - "暫停提示色，請自己只用文字說出狀態與集合地點。"
    checks:
      - "筆記有兩組前景、背景、實測比值。"
      - "正式附註至少 4.5 比 1。"
      - "沒有提示色仍知道要改到東門。"
---

## 為什麼要學

路線通知裡有集合時間、改道原因、最後更新時間。如果三段都同樣大、同樣粗，讀者得逐字念完才知道要先做哪件事。視覺層級（visual hierarchy）是用位置、留白與字級引導順序；清楚的版面不必替每句話加框。這堂要交付一張通知：先看得到改道，再看到行動，最後才是附註。即使拿掉顏色，也不會把「注意」誤讀成「開放」。

## 核心概念

間距尺度（spacing scale）是替常用距離選少量有意義的值。相同群組內用小間距，不同群組之間用較大間距；比起所有地方各加一點，近與遠的差別更能傳達關係。字級尺度（type scale）同理：一個主要標題、一種內文、一種次要資訊即可。字小不等於灰到看不見；用字重、位置和明確的標籤就能分出層次，不必犧牲附註的可讀性。

色彩對比（contrast ratio）比較前景、背景的相對亮度，不是用色相名稱猜能不能讀。依 WCAG 的一般文字對比判準，普通文字至少要達 4.5:1，大字至少3:1；大字有尺寸與粗細條件，不是叫作標題就能降低門檻。本例為了容易驗收，連小附註與標題都以至少 4.5:1 為目標。這只是文字對比檢查，不代表整頁通過所有可及性要求。

## 範例：不用新增外框的通知

在 `C:\dev\stackway-lab\css-lab` 建立 `visual.html`。用瀏覽器開啟，瞇起眼看一眼：最大的資訊應是改道本身，不是更新時間。再從上往下讀一次，確認視覺順序與文字順序一致。

```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>步道公告</title>
<style>
:root { --small: .5rem; --group: 1.5rem; }
body { margin: 1rem; background: #fff; color: #20372e;
       font: 1rem/1.6 system-ui, sans-serif; }
main { max-width: 34rem; }
h1, p { margin: 0; }
h1 { font-size: 2rem; line-height: 1.25; }
.lead { margin-top: var(--small); }
.action { margin-top: var(--group); }
.meta { margin-top: var(--group); font-size: .875rem; color: #48574f; }
strong { color: #783700; }
</style>
<main><h1>北段今天改道</h1><p class="lead"><strong>注意：</strong>橋面維修。</p>
<p class="action">集合地點改到東門，請不要在舊入口等候。</p>
<p class="meta">更新時間：上午 8 點</p></main>
</html>
```

檢查附註文字，在開發者工具的樣式面板點開 `color` 旁的色票，讀取它與實際白底的對比值。若工具對這個頁面不顯示比值，到開發者工具的無障礙色彩選擇器或可讀取對比的檢查介面，輸入同一對前景與背景色。先自己量，再核對參考值：附註與白底約為 7.63:1；把顏色暫改為 `#999999`，同一白底降為約 2.85:1，不能因為「不是重點」就當合格。記下兩次的數字並還原。

再暫時把 `strong` 的顏色設為和內文相同。你仍能讀到「注意」與原因，所以顏色只是輔助，不是唯一線索。把兩個間距值暫時改成相同，重新掃一眼：標題與原因的群組感會變弱。依序只改一件事，才知道改善來自對比、字級，還是彼此之間的距離。

## 常見錯誤

只測標題與白底，忽略最小最淡的附註；或把頁面截圖轉灰階，就當成已量過數值。前者漏測，後者只適合看資訊是否過度依賴色彩，不能取代亮度對比測量。高對比也無法補救內容順序混亂；最後要回到讀者的問題：改了哪條路，我現在該去哪裡？

## 小結

留下通知頁、前後對比值與一次去色判讀。字級指出先讀什麼，間距說明哪些資訊同組，文字本身則把狀態說清楚；三件事各有工作，不必讓顏色一肩扛起。
