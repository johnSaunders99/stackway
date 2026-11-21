---
id: fs-html-01-structure
module: fs-html
order: 1
title: HTML 文件與語意標記
subtitle: 用標題和區段排出文件
status: ready
minutes: 25
level: 2
prereqs: []
objectives:
  - 從 doctype、html、head、body 建立能在瀏覽器打開的文件
  - 用語意元素分開主內容與導覽
  - 只讀標題也能重述內容順序
tags:
  - html
resources:
  - title: "MDN：用 HTML 劃分文件區域"
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: "讀文件主要區域與標題層級。"
concepts:
  - id: fs-html-01-structure-head-body
    prompt: "瀏覽器分頁的名字和頁面上看得到的主標題分別寫在哪裡？"
    answer: "title 放在 head，h1 放在 body。兩者服務不同的閱讀位置。"
    mcq:
      question: "要改分頁名稱但不改畫面標題，應修改哪個？"
      options:
        - "h1"
        - "title"
        - "main"
        - "nav"
      answer: 1
      explain: "title 是文件資訊，h1 才是內文的主標題。"
  - id: fs-html-01-structure-regions
    prompt: "nav 和 main 告訴讀者什麼？"
    answer: "nav 標出主要導覽，main 包住這一頁獨有的主要內容；語意不靠字體大小。"
    mcq:
      question: "哪個元素最能指出作品說明的主要內容從哪裡開始？"
      options:
        - "nav"
        - "title"
        - "main"
        - "head"
      answer: 2
      explain: "導覽是找路，主要內容是這頁要讀的東西。"
    interview:
      question: "一頁用粗體字也能看出章節，為什麼還要換成語意元素？"
      points:
        - "區分外觀和內容角色"
        - "主區域與導覽可被辨認"
        - "用標題檢查閱讀順序"
      answer: "我希望拿掉樣式後，讀者仍能知道哪裡是導覽、哪裡開始讀作品。用 main、nav 和真正的標題標記，再只讀標題核對順序，比把幾段字拉大可靠。"
  - id: fs-html-01-structure-outline
    prompt: "如何只靠標題檢查文件結構？"
    answer: "先讀 h1 看全頁主題，再讀同層 h2 看小節並列關係，不因想要小字就跳級。"
practice:
  - id: fs-html-01-structure-p1
    title: "交付一頁不用樣式也讀得懂的作品說明"
    kind: build
    minutes: 10
    steps:
      - "在練習區的 html-desk 新建 structure.html，存成 UTF-8 並用瀏覽器打開。"
      - "將分頁名稱與內文大標分別改成不同文字，確認各自顯示位置。"
      - "只讀各層標題，把兩項小節在紙上畫成同層。"
    checks:
      - "分頁和畫面各顯示其所屬的標題。"
      - "頁面有一個主要區域，兩個小節同層，導覽連往觀察小節。"
---

## 為什麼要學：別讓讀者靠猜來認識作品

你要展示一個把練習分鐘加總的小工具。讀者先想知道「它做什麼」，再想知道「怎麼證明它做對了」。即使頁面完全沒有顏色，這兩個問題仍應該很好找。超文字標記語言（HTML）負責交代內容的角色；它不是把畫面拖到好看的位置，而是先幫文件安排一條可讀的路。

## 核心概念：先有文件，再有區域與標題

元素（element）通常有開始標籤、內容和結束標籤，例如 `<p>` 與 `</p>` 包住一段文字。另一個元素放在其中叫巢狀結構，先開始的外層要最後關閉。文件起頭的 `<!doctype html>` 告訴瀏覽器按標準模式處理；`html` 包住整份內容，`lang` 屬性說明主要語言。屬性（attribute）是一項寫在開始標籤裡的補充設定。

`head` 放分頁名稱、文字編碼等文件資訊；`body` 才放要在頁面上閱讀的內容。語意（semantics）指元素表達的意義：`nav` 標示主要導覽，`main` 標示本頁主要內容，`section` 可把同一主題的內容組成一節。`h1` 說這頁是什麼，`h2` 說這頁下面有哪些小節。字體大不大跟是不是標題是兩件事。

## 範例：用頁面本身驗證 2 個標題的差別

在 `C:\dev\stackway-lab` 裡建立 `html-desk`（不能用 C 槽時改 D 槽）。用編輯器新增 `structure.html`，以 UTF-8 儲存，從檔案總管用瀏覽器開啟。不需要架設伺服器。以下導覽列有一條頁內連結：開頭的井字號指到同頁的一個識別名稱，之後在[〈超連結、圖片與替代文字〉](#/lesson/fs-html-02-links)會細講連結怎麼找位置。

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>練習簿｜作品索引</title>
</head>
<body>
  <nav><a href="#result">跳到驗證紀錄</a></nav>
  <main>
    <h1>分鐘加總器</h1>
    <section><h2>用途</h2><p>把 3 筆練習合成一天的總數。</p></section>
    <section id="result"><h2>驗證紀錄</h2><p>8、15、20，共 43 分鐘。</p></section>
  </main>
</body>
</html>
```

先不看程式：瀏覽器分頁顯示作品索引，頁面最醒目的文字卻是分鐘加總器。只改 `title` 後儲存、重新整理，確認畫面內文沒有跟著改。再只讀「分鐘加總器、用途、驗證紀錄」三個標題，試著不用段落就描述這頁的閱讀順序。如果小節都叫「更多」，即使標籤寫對，讀者也不知道要往哪裡去。

和在紙上寫提綱一樣，同一層的小節是在回答不同面向，並非後一段一定附屬於前一段。假如把「驗證紀錄」降成第三層，單看提綱就會以為它隸屬「用途」，與原本想表達的並列關係不同。

## 常見錯誤：用粗體或換行裝出一個標題

粗體段落可能看起來跟小標相似，但讀取文件結構時仍是一段普通文字。不要因為想讓字縮小，就從第一層跳到第四層；外觀之後在[〈CSS 選擇器與宣告〉](#/lesson/fs-html-04-rules)調整。若瀏覽器顯示整頁程式碼，先確認檔名不是多了一層文字檔副檔名，再確認自己開的是瀏覽器而非編輯器。

## 小結：先驗收沒有裝飾的版本

留下一份可直接開啟的文件，確認分頁有意義、導覽與主要內容各有位置、只讀標題仍說得出作品與證據。這份骨架做好，下一堂[〈超連結、圖片與替代文字〉](#/lesson/fs-html-02-links)才有可靠的地方可以接上其他頁面和圖片。
