---
id: fs-html-03-box
module: fs-html
order: 5
title: CSS 盒模型
subtitle: 找出是哪一層撐寬畫面
status: ready
minutes: 30
level: 2
prereqs:
  - fs-html-04-rules
objectives:
  - 畫出 content、padding、border 與 margin 的界線
  - 用盒模型分辨內容與間距
  - 在窄視窗找出並修正溢位
tags:
  - html
  - box-model
resources:
  - title: "MDN：盒模型與 2 種寬度算法"
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-html-03-box-layers
    prompt: "從文字走到相鄰盒子，四層依序是什麼？"
    answer: "內容、內距、邊框、外距；最後的外距位於邊框外。"
    mcq:
      question: "想讓字不要貼住自己的框線，先改哪層？"
      options:
        - "margin"
        - "padding"
        - "outline"
        - "兩盒之間的 gap"
      answer: 1
      explain: "字與自家框線中間是內距，外距調的是框外空間。"
  - id: fs-html-03-box-arithmetic
    prompt: "content-box 時，宣告寬 200、左右內距各 12、框各 2，邊框外緣寬多少？"
    answer: "228 像素；兩側內距與邊框都要加上，外距不算入這個尺寸。"
    mcq:
      question: "若只改為 border-box 並保持同樣設定，邊框外緣寬多少？"
      options:
        - "224"
        - "228"
        - "200"
        - "176"
      answer: 2
      explain: "border-box 把兩側內距與邊框包進指定寬度，並未再加到 200 上。"
    interview:
      question: "卡片設寬度 100%，又加內距後超出容器，你會怎麼確認原因？"
      points:
        - "看寬度指的是哪層"
        - "算兩側內距和邊框"
        - "改用 border-box 並在窄寬下重測"
      answer: "我會先用開發者工具看內容寬和框線外緣的差，手算是否正好是兩側內距加邊框。如果符合，就把這張卡換成 border-box，重測窄寬並確認文字和右框都沒被裁掉。"
  - id: fs-html-03-box-overflow
    prompt: "為何用隱藏超出部分不能證明版面已合身？"
    answer: "內容可能只是被裁切；要看框線是否在可用空間內以及文字是否仍完整。"
practice:
  - id: fs-html-03-box-p1
    title: "留下可核算的盒模型修正前後圖"
    kind: build
    minutes: 12
    steps:
      - "存好 box.html，畫四層並在每側標出像素。"
      - "用瀏覽器開發者工具選到卡片，核對框寬，將指定的模式改掉後重整。"
      - "窄、寬各看一次，保存兩組框寬與完整最後一句。"
    checks:
      - "修正前邊框外緣比父內容寬 36 像素。"
      - "修正後外緣與父內容等寬，右框和最後一句仍看得到。"
---

## 為什麼要學：明明寫 100%，右邊卻被擠出去了

一張卡片應該剛好放進作品欄。你指定了 100% 的寬度，又加點內側留白讓文字好讀，結果右框超過欄位。問題不是瀏覽器不識百分比，而是你和它量的可能不是同一層。先用紙畫出邊界，再用實際像素核對，比把右邊多出來的部分藏起來可靠。

## 核心概念：同一個盒子有 4 個邊界

盒模型（box model）由內往外是內容（content）、內距（padding）、邊框（border）、外距（margin）。內容放文字；內距是文字到自家邊框之間的距離；邊框本身有厚度；外距用來隔開框外其他東西。想把兩張卡拉開，跟想讓文字離開框線，是不同的要求，不要都靠多打幾個空白來解決。

一般區塊預設使用 `content-box`：指定寬度只量內容，兩側內距與邊框另外加上。若改用 `border-box`，同樣的寬度改量兩側邊框的外緣，內距越大，能放文字的空間就越少。外距在兩種算法中都不算進宣告的盒寬。說「卡片寬 300」之前，先指出尺的兩端落在哪裡。

## 範例：找出多出來的 36 個像素

在練習區 `C:\dev\stackway-lab\html-desk` 新增 `box.html`，整份存好再用瀏覽器開。為了只量這個例子，用 `style` 在同一頁放規則。外層欄位取可用寬度的 8 成，最大 300 像素；虛線外框是量尺，不會吃掉內容空間。

```html
<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><title>量一張卡</title>
<style>
.lane { width: 80%; max-width: 300px; outline: 1px dashed #426254; }
.card { box-sizing: content-box; width: 100%; padding: 16px;
        border: 2px solid #704f2c; margin: 0; }
</style></head><body>
<main><h1>寬度實驗</h1><div class="lane">
  <p class="card">完整紀錄：原稿 3 筆，摘要一行。這是最後一句。</p>
</div></main></body></html>
```

外層內容寬 300 時，卡片的內容也是 300；左右內距各 16，邊框各 2，邊框外緣就是 336。在瀏覽器按 F12，用選取元素工具點卡片，看盒模型示意圖，分清楚哪些是單側、哪些是總數。只把規則裡的 `content-box` 改成 `border-box`，儲存並重整，現在外緣應是 300，內容剩 264。

縮窄視窗讓外層不到 300，手算便改用當下量到的欄寬。即使頁面沒出現整頁的橫向捲軸，卡片仍可能漏出外層的虛線；這裡測的是**子盒有沒有超過父盒**，不是一定要看到瀏覽器捲軸才算問題。

如果看見虛線被實線蓋住，不必猜兩個框到底差幾格。把滑鼠移到開發者工具的盒模型圖，依序指向內容、內距與邊框，看頁面高亮的區域。記錄的是水平左右兩側，上下內距不會把卡片橫向撐寬。

## 常見錯誤：裁掉內容，冒充修好版面

隱藏溢位（overflow）可能讓突出部分看不見，卻也讓右框和最後幾個字消失。不要靠它通過這個測試。若改了盒模型仍然太寬，還要看是否另外加了左右外距或遇到不能折行的長內容；本例特別將卡片外距設為 0，就是為了把這些原因分開。

開啟開發者工具的盒模型圖，指出你量的是內容邊緣還是邊框外緣。同一張卡片量出不同寬度，不一定有一把尺壞了。

## 小結：把尺放在對的地方

在紙上畫四層，註明哪個模式量到內容、哪個量到框外緣。再記錄一次窄視窗下的前後差異：尺寸合身而且全文還在，才是有效的修正。
