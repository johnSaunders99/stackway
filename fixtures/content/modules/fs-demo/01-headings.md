---
id: fs-demo-01-headings
module: fs-demo
order: 1
title: 用標題替頁面做目錄
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 用元素標出主題與段落
  - 從標題判讀頁面結構
tags:
  - HTML
  - 標題
resources:
  - title: HTML 標題元素
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: 2026-11-20
concepts:
  - id: headings-role
    prompt: 標題元素傳達什麼？
    answer: 標題層級描述段落之間的關係，不只是控制字體大小。
    mcq:
      question: 需要一個同層級的新段落，應怎麼做？
      options:
        - 使用相同層級的標題
        - 一律使用最小標題
        - 只把文字加粗
      answer: 0
      explain: 標題層級描述段落之間的關係，不只是控制字體大小。
    interview:
      question: 兩個看起來相同的標題一定有相同意義嗎？
      points:
        - 分辨結構與外觀
        - 指出標題層級的用途
      answer: 標題層級描述段落之間的關係，不只是控制字體大小。
  - id: headings-main
    prompt: 一篇筆記的主標題通常用哪個元素？
    answer: 以 h1 標示整篇主題，再以 h2 標示主要段落。
    mcq:
      question: 本文主題最適合放在哪裡？
      options:
        - p
        - h1
        - 檔案副檔名
      answer: 1
      explain: 以 h1 標示整篇主題，再以 h2 標示主要段落。
  - id: headings-para
    prompt: 普通的說明文字用什麼元素？
    answer: 段落元素 p 包住正文；不要把整篇文章都寫成標題。
    mcq:
      question: 哪個元素適合兩句說明文字？
      options:
        - p
        - h1
        - h2
      answer: 0
      explain: 段落元素 p 包住正文；不要把整篇文章都寫成標題。
practice:
  - id: fs-demo-01-headings-p1
    title: 開啟你的第一頁筆記
    kind: hands-on
    minutes: 5
    steps:
      - 用純文字編輯器複製範例，另存為 index.html。
      - 在瀏覽器開啟檔案，改一個小標題，再重新整理。
    checks:
      - 頁面有清楚的主題
      - 改動的是小標題而不是正文
---
## 為什麼要學：讓讀者知道現在讀到哪裡
你寫了一段很好的筆記。讀者卻不知道前半是在描述問題，還是在交代解法。網頁不只裝文字，也能表達文字之間的關係。先不碰顏色和字型，我們要讓只讀標題的人也能知道整頁在說什麼。
## 核心概念：用元素包住內容
超文字標記語言 (HTML) 把內容標上用途。元素 (element) 通常有開始標籤和結束標籤，中間是讀者要看到的內容。主標題標示整頁的主題，下一層標題標示其中的一段；普通說明則放在段落裡。就像書的章與節，不用等到排版完成才決定層次。
## 範例：把一頁筆記存成檔案
複製下面的原始碼，用純文字格式儲存。檔名請用 index.html，在瀏覽器中打開。這裡不需要伺服器：瀏覽器可以直接解讀本機檔案。
```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<title>工作筆記</title>
<h1>工作筆記</h1>
<h2>我遇到的問題</h2>
<p>忘記筆記放在哪個目錄。</p>
<h2>我試過的方法</h2>
<p>先列出目前位置，再找檔案。</p>
</html>
```
### 看不到標籤是正常的
瀏覽器把一對標籤解讀為一個元素，畫面上不一定會顯示尖括號。分頁上的文字來自 title，內文的大標題則來自 h1。可以把它們改成不同的內容，確認兩者負責的位置不同。
### 用另一種方式讀自己的頁面
請把兩個小標題各抄在一張紙上，不寫內文。交換紙張位置，看故事還讀得通嗎？如果先講「我試過的方法」而沒交代問題，讀者可能看不懂你為什麼那樣做。這時應調整段落順序，而不是單純把標題放大。也可以再加一個同層級的「我怎麼確認」，讓文章從問題一路走到驗證。每個標題最好能說明下一段要解答哪一個疑問。
## 常見錯誤：因為喜歡小字就跳級
如果想讓字小一點，不要因此把第二層標題改為第五層。讀者可能使用輔助工具按層級巡覽，跳級會讓結構變得難以預測。外觀是下一堂的工作，先讓元素忠實描述這段文字在文章中的角色。
## 小結
把所有段落遮住，只看標題。如果你仍然能說出頁面的主題與順序，結構就已經發揮作用。把今天的檔案留下來，下一堂將不必更動文字就能改變它的外觀。
