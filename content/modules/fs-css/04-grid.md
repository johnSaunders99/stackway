---
id: fs-css-04-grid
module: fs-css
order: 4
title: CSS Grid 網格
subtitle: 讓標題與數字跨列對齊
status: ready
minutes: 35
level: 2
prereqs:
  - fs-css-03-flex
objectives:
  - 定義網格軌道與間距
  - 用相同項目比較二維網格與單向排列
tags:
  - css
  - grid
resources:
  - title: MDN：網格排版
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-css-04-track
    prompt: "兩欄要跨列共享邊界，欄軌定義寫在哪裡？"
    answer: "寫在共同的網格容器上。"
    mcq:
      question: "地名和分鐘數是同一容器的直接子元素。要讓分鐘數跨列對齊，欄軌寫在哪裡？"
      options:
        - "共同父容器"
        - "每個分鐘數的元素內"
        - "只寫在第一個地名上"
        - "分別寫在每個地名上"
      answer: 0
      explain: "各自建立的網格不會自動共用這個父層的軌道。"
    interview:
      question: "時間看板該用彈性盒還是網格，你怎麼決定？"
      points:
        - "確認跨列對齊需求"
        - "以單一容器定義共享欄軌"
        - "用長地名與窄視窗驗收"
      answer: "如果是這塊看板，我選網格，因為第二欄的起點要跨列一致。我會把地名加長並縮窄視窗，確認只是列變高，兩筆分鐘數仍然對齊。"
  - id: fs-css-04-fraction
    prompt: "本例固定第二欄後，1fr 分的是哪部分？"
    answer: "固定欄與間距等先扣除後的可用空間。"
    mcq:
      question: "兩欄網格含一個比例欄、5rem 固定欄與 1rem 欄間距。1fr 分得什麼？"
      options:
        - "整個容器寬度"
        - "不扣間距就平分的寬度"
        - "只扣間距未扣固定欄的寬度"
        - "扣除固定欄與間距後的空間"
      answer: 3
      explain: "比例軌分的不是未扣除任何尺寸的容器全寬。"
  - id: fs-css-04-span
    prompt: "grid-column: 1 / -1 在本例讓標題如何放置？"
    answer: "從明訂網格第一條線跨到最後一條線。"
    mcq:
      question: "網格明訂 2 欄，標題宣告 grid-column: 1 / -1。標題會佔哪個範圍？"
      options:
        - "只放第一欄"
        - "從最後一列開始放"
        - "橫跨 2 個明訂欄"
        - "讓容器多一個欄位"
      answer: 2
      explain: "線號標記起訖邊界，不是指定新增欄數。"
practice:
  - id: fs-css-04-p1
    title: "交出數字對欄的路線看板"
    kind: hands-on
    minutes: 15
    steps:
      - "建立 grid.html，開啟網格線覆疊。"
      - "加長第二個地名並縮窄，保留網格截圖。"
      - "同一批項目暫切為可換行的彈性盒並比較。"
    checks:
      - "標題跨越 2 個明訂欄。"
      - "長地名換行後分鐘數起點仍一致。"
      - "能指出彈性盒版本失去的共用欄線。"
---

## 為什麼要學

昨天的一排按鈕換行時，最後一顆可以自行撐滿。用在工具列很好，用在路線看板卻可能讓兩列的分鐘數左右跳動。這次真正的需求是「不管地名多長，第二欄的起點都要相同」。網格排版（CSS Grid）先替整個容器訂好欄與列，再把項目放進去，適合這種跨行共享邊界的安排。

## 核心概念

在父元素宣告 `display: grid`，直接子元素就是網格項目（grid item）。相鄰兩條網格線（grid line）之間的空間叫軌道（track），可沿水平或垂直方向延伸。`grid-template-columns` 從左到右描述本例的欄軌；項目預設依文件順序一格一格放下去，這一列滿了才接到下一列。沒有指定列高時，列會依內容長高，不需要先知道會有幾筆資料。

`fr` 是分配剩餘空間的比例，先扣掉固定欄和間距，才把其餘空間分給彈性欄。`minmax(0, 1fr)` 讓第一欄的軌道最小可到 0，不因項目的預設最小寬而把整個版面撐開；文字是否能換行仍要另外照顧。`gap` 留在軌道之間，不等於容器的外框內距。若要大標題橫跨所有明訂的欄，指定從第一條線到最後一條線，不要猜應該替標題設多少像素。

## 範例：替 2 條路線對齊分鐘數

在 `C:\dev\stackway-lab\css-lab` 建立 `grid.html`，用瀏覽器開啟。下列是一張短看板；若是有欄位、表頭和大量資料的表格，應使用有語意的表格元素，不能只靠視覺位置表達關係。

```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>時間看板</title>
<style>
.board { display: grid; grid-template-columns: minmax(0, 1fr) 5rem;
  gap: .5rem 1rem; max-width: 28rem; padding: 1rem; background: #eef3ed; }
h1 { grid-column: 1 / -1; margin: 0; }
.board > span { background: white; overflow-wrap: anywhere; }
</style>
<section class="board"><h1>步行時間</h1>
<span>東門到觀景臺</span><span>12 分</span>
<span>沿著溪岸走到石橋再折返</span><span>28 分</span>
</section>
</html>
```

選取容器，在開發者工具點網格標記開啟覆疊線。從左到右能數出 3 條界線，把空間隔成 2 欄。標題佔完第一列，下一個地名自動排到第二列第一欄；兩個「分」的起點落在同一條欄線。把第二個地名再加長 1 倍，縮窄視窗，觀察文字換行、該列長高，但數字沒有被推到一個新的橫向起點。

保留相同的五個項目，只在工具裡把父容器暫改成 `display: flex; flex-wrap: wrap`。原本的欄軌與跨欄設定不再為這個容器排版，項目依自己的寬度沿單一方向排列，換行後也不再共用第二欄。不要為了把比較「修好」替每個項目另寫寬度；失去對齊就是這次要觀察的差別。切回網格並保留一張能看到欄線的截圖。

## 常見錯誤

把五個子元素各自設成網格，不會讓它們共享同一批欄線；應找共同的直接父元素。另一個常見誤會是把 `1fr` 當容器寬度的 100%，又另加固定欄與留白。先扣再分才是這題的算法。遇到長字擠出格子，分別檢查軌道能否縮小、字串能否斷行，兩者不能互相代替。

換一個字比較多的標題，看看同一欄的其他卡片如何對齊；不要用每張卡片各自剛好的寬度冒充共同欄線。

## 小結

按內容順排、換行後各自伸縮，選彈性盒；多列要共享欄界，優先選網格。作決定的線索不是頁面看起來有幾個方塊，而是哪一些項目必須互相對齊。
