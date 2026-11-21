---
id: fs-html-02-links
module: fs-html
order: 2
title: 超連結、圖片與替代文字
subtitle: 換個資料夾，圖片還找得到嗎
status: ready
minutes: 25
level: 2
prereqs:
  - fs-html-01-structure
objectives:
  - 用相對網址連到另一頁並顯示本機圖片
  - 依用途決定替代文字或空替代文字
tags:
  - html
  - links
resources:
  - title: "MDN：連結與相對網址"
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: "W3C WAI：圖片替代文字決策樹"
    url: https://www.w3.org/WAI/tutorials/images/decision-tree/
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-html-02-links-relative-url
    prompt: "相對網址沒有以斜線開頭時，從哪裡開始找？"
    answer: "在未另設基準網址的本例，從目前 HTML 文件所在的資料夾解讀。"
    mcq:
      question: "從 pages/detail.html 找同層級外的 media/chart.png，網址怎麼寫？"
      options:
        - "media/chart.png"
        - "pages/media/chart.png"
        - "../media/chart.png"
        - "detail.html/media/chart.png"
      answer: 2
      explain: "先回到 pages 的上一層，再進入並列的 media。"
  - id: fs-html-02-links-src-href
    prompt: "想顯示圖片與想點連結前往另一頁，各要指定什麼？"
    answer: "img 用 src 指定圖片來源；a 用 href 指定啟動連結時的目的地。"
    mcq:
      question: "頁面已有圖片，想讓一段文字可點到另一頁，用哪種標記？"
      options:
        - "帶 src 的 img"
        - "只有 alt 的 img"
        - "只有 id 的 p"
        - "帶 href 的 a"
      answer: 3
      explain: "圖片來源不會自動替文字建立導覽目的地。"
  - id: fs-html-02-links-purpose
    prompt: "何時用空的 alt 而不是省略它？"
    answer: "純裝飾或已由相鄰文字完整重複傳達的圖片可用空 alt；有功能或資訊時要描述用途或資訊。"
    interview:
      question: "同一張箭頭放在兩個位置，替代文字一定相同嗎？"
      points:
        - "依圖片任務決定"
        - "純裝飾使用空 alt"
        - "單獨作連結時描述目的"
      answer: "我會先想把圖拿掉會少什麼。標題旁的裝飾箭頭可以留空；如果箭頭是唯一通往下一頁的連結，替代文字就要讓人知道它會帶到哪裡，而不是只說有一支箭。"
practice:
  - id: fs-html-02-links-p1
    title: "交付可整資料夾搬走的 2 頁導覽"
    kind: build
    minutes: 10
    steps:
      - "建立正文的兩頁與 PNG，用自己的兩格示意圖代表先讀再做。"
      - "由入口到內頁，再回首頁；檢查圖片能顯示。"
      - "將整個練習資料夾複製到另一個新的位置，重開副本測一次。"
    checks:
      - "兩份資料夾各自能往返，沒有靠 C 槽完整路徑。"
      - "圖片無法顯示時，文字仍交代了兩個步驟。"
---

## 為什麼要學：自己電腦看得到，搬走也要看得到

作品首頁連到一頁說明，裡面還有張你畫的流程圖。如果在程式中寫死桌面上的完整地址，換一台電腦就找不到。另一種失敗比較安靜：檔案都在，但看不見圖片的人完全不知道流程。今天把這兩件事一起驗收：能帶著走的相對網址（relative URL），以及不看圖也能取得的資訊。

## 核心概念：先找到出發文件，再問圖是做什麼用的

超連結（hyperlink）用 `a` 元素包住可點的文字，`href` 寫目的地。圖片用 `img`，`src` 寫要載入的來源，`alt` 寫替代文字（alternative text）。圖片直接放進文件，不必替它再打結束標籤。路徑用正斜線分隔，沒有設定其他基準時，起點是目前這份網頁所在的目錄，不是終端機工作位置，也不是瀏覽器第一次開啟的首頁。

若圖片傳達步驟，替代文字就說步驟；若只是旁邊文字的裝飾，明寫 `alt=""`，讓輔助工具知道可略過。省略屬性與留空不相同，省略時可能只剩檔名當線索。若一張圖是連結內唯一的內容，先想使用者按下去會到哪裡，目的地往往比描述圖的顏色形狀更有用。

## 範例：2 頁、一張自製的小圖

在練習區 `C:\dev\stackway-lab` 內新建 `web-route`，在裡面建兩個並列的子目錄 `pages`、`media`。用小畫家畫「先讀、再做」兩格流程，以 PNG 格式另存為 `media/steps.png`；不要只把其他圖片的副檔名改成 PNG。以下第一份檔存為 `web-route/index.html`。

```html
<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><title>練習首頁</title>
<h1>練習首頁</h1><a href="pages/detail.html">查看練習流程</a>
</html>
```

第二份存為 `web-route/pages/detail.html`。從檔案總管開第一頁，點進第二頁，看圖，再按「回練習首頁」往回走。

```html
<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><title>練習流程</title>
<h1>練習流程</h1>
<img src="../media/steps.png" alt="第 1 步讀題，第 2 步自己動手做">
<p><a href="../index.html">回練習首頁</a></p>
</html>
```

內頁已經在子目錄裡，兩個句點先退回作品目錄，才找得到並列的圖片目錄。用紙把三個檔案畫在各自的格子，手指從寫這條網址的檔案出發走一次。如果只搬走內頁，起點和其他檔案的關係就被改掉；搬走整個作品目錄，關係才會保留。

搬完後要從副本的首頁重新開始，不要只重整舊分頁。看一下網址列的目錄是否確實換了，再沿連結走一趟，否則可能一直測到舊作品，卻以為驗證了新位置。

## 常見錯誤：圖片不見了就把檔案到處複製

先在內頁核對真實檔名、大小寫、位置與副檔名，再沿相對路徑走，不要複製到每個資料夾去碰運氣。要測替代文字，可以暫時把內頁中的圖片檔名改成不存在的名字，儲存並重整，觀察後改回來。若文字只寫「圖片」，讀者仍然無法得知流程；這是資訊缺少，不是路徑錯。

## 小結：2 次不同的搬運測試

把整個作品資料夾複製到新位置，驗證連結與圖片仍有效；再想像把圖片的視覺拿走，確認留下的字仍交代了用途。前者證明檔案關係可攜，後者證明你傳達的意思不只存在像素裡。
