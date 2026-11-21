---
id: fs-html-04-rules
module: fs-html
order: 4
title: CSS 選擇器與宣告
subtitle: 只讓提示段落改變顏色
status: ready
minutes: 25
level: 2
prereqs:
  - fs-html-02-form
objectives:
  - 在 HTML 載入外部樣式表
  - 用元素與類別選擇器對照哪些節點被選中
tags:
  - html
  - rules
resources:
  - title: "MDN：元素與類別選擇器"
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Basic_selectors
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-html-04-rules-link-sheet
    prompt: "外部 CSS 要怎樣連進 HTML 文件？"
    answer: "在 head 以 link 指定 rel=\"stylesheet\"，href 寫相對於文件的樣式檔位置。"
    mcq:
      question: "同目錄有 desk.css，link 的哪個屬性放這個檔名？"
      options:
        - "href"
        - "src"
        - "class"
        - "rel"
      answer: 0
      explain: "rel 描述關係，href 才給出檔案位置。"
  - id: fs-html-04-rules-match
    prompt: "CSS 中 p 與 .hint 各依什麼條件挑元素？"
    answer: "p 依元素名稱選；.hint 依 class 是否含 hint 選，不限元素種類。"
    mcq:
      question: "兩個 p 只有第二個有 class=\"hint\"，如何只選第二個？"
      options:
        - "p"
        - ".hint"
        - "hint"
        - ".p"
      answer: 1
      explain: "類別選擇器前加點；p 會選兩個段落，hint 則在找同名元素。"
    interview:
      question: "樣式檔好像沒作用，但部分文字確實變色。你先查什麼？"
      points:
        - "以已生效規則確認有載入"
        - "核對失效規則的選擇器與 class"
        - "一次改一個條件"
      answer: "既然同檔的另一條規則有效，我先不改路徑。我會檢查點號、類別拼字，再把同一類別移到另一段驗證；這樣能區分載入問題和沒選到目標。"
  - id: fs-html-04-rules-declaration
    prompt: "宣告中的屬性與值如何分隔？"
    answer: "在大括號內用冒號分開要改的屬性與它的值，以分號結束宣告。"
practice:
  - id: fs-html-04-rules-p1
    title: "留下可以搬動的提示樣式"
    kind: build
    minutes: 10
    steps:
      - "在新的 rules-room 資料夾建立頁面與樣式兩檔，重整查看兩個段落。"
      - "把 hint 類別從第二段移到第一段，僅更動 HTML；觀察線條或底色是否跟著移動。"
      - "將標記移回，把觀察寫成三句驗收紀錄。"
    checks:
      - "兩段共享段落規則，提示底色只出現在有類別的那一段。"
      - "樣式檔可以單獨打開編輯，不含 HTML 標籤。"
---

## 為什麼要學：提示只該改一段，不該整頁都變色

作品頁有兩段文字，第一段交代用途，第二段提醒要先備份。你希望提示一眼可見，但不想把每一段都標成警告。階層式樣式表（CSS）負責外觀，HTML 仍負責內容。這次把兩者各自存檔，測試時只移動一個名稱，看看樣式究竟跟著文字、位置，還是跟著標記走。

## 核心概念：先選誰，再說怎麼改

選擇器（selector）寫在大括號之前，回答「要套用到哪些元素」。元素選擇器 `p` 選中每個段落；類別選擇器 `.hint` 選中具有該類別的成員。同一個類別可給多個元素，在 HTML 的 `class` 裡寫名稱本身，不加點號。點號是樣式表用來表達「找類別」的語法，不是名稱的一部分。

宣告（declaration）寫在大括號內，每項包含屬性、冒號、值及分號。`color` 管文字顏色，`background-color` 管背景顏色。兩條規則可以同時選到同一個元素，不必二選一。本例先讓兩條規則改不同事情，方便從結果看出兩條都有作用，而不是先去背一大串規則先後的細節。

## 範例：2 個檔案，各做一件事

在 `C:\dev\stackway-lab` 裡新建 `rules-room`，第一份存為 `index.html`。`link` 表示本頁和另一個資源的關係；放進文件資訊區，`rel` 指明它是樣式表，`href` 給出檔案位置。這裡用同一目錄的相對網址，不用網路。

```html
<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><title>練習提示</title>
<link rel="stylesheet" href="desk.css"></head>
<body><main><h1>校對筆記</h1>
<p>2 行數字應分開保留。</p>
<p class="hint">提示：先保留原稿，再改副本。</p>
</main></body></html>
```

第二份存為同一個 `rules-room` 裡的 `desk.css`，只貼下方規則，不包含任何標籤。用瀏覽器開啟 HTML，不是開啟樣式檔。

```css
p { color: #243342; }
.hint { background-color: #fff1bf; border-left: 4px solid #785713; }
```

粗線在左側，淡色在背景，而「提示」兩字也保留，即使看不清顏色仍知道那段用途。把第二段的類別移到第一段，重新儲存並重整，色塊應跟著位置移走。兩段文字仍維持段落的深色；若把類別移回再依原樣顯示，就完成了一次可逆的控制實驗。

再問一個反問題：把提示段落換成標題，但保留原本的類別，哪些規則仍會生效？它不再是段落，因此不受段落選擇器影響；可是類別條件依舊成立，底色與線條會留下。這說明同一份內容可以同時具有元素角色和樣式分組，兩種分類不必綁死。

## 常見錯誤：一看到沒變色就把所有地方改一遍

先分清範圍。如果兩條規則都沒生效，檢查檔名、所在目錄、連結的關係值，以及是不是把樣式檔存成文字檔的雙重副檔名。如果一般段落已變色而提示底色沒有，檔案 8 成已載入，先查類別名稱和點號。兩個檔案都要儲存；只把瀏覽器重整，讀不到編輯器裡尚未寫入的變更。

## 小結：留下能說明因果的 2 張畫面

只看一次「顏色很好看」不能知道目標選得對不對。把移動類別前後的差異記下來：相同的是兩段的一般文字設定，移動的是提示的底與線。下次想新增第二個提示，只要替需要的段落加同一類別，不必複製整份樣式。
