---
id: fs-demo-02-styles
module: fs-demo
order: 2
title: 只改一行，換一種閱讀感受
status: ready
minutes: 25
level: 2
prereqs:
  - fs-demo-01-headings
objectives:
  - 辨認選擇器與屬性
  - 限制樣式的影響範圍
tags:
  - CSS
  - 選擇器
resources:
  - title: 文字顏色屬性
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: 2026-11-20
concepts:
  - id: styles-selector
    prompt: 選擇器的工作是什麼？
    answer: 選擇器決定規則套用到哪些元素；宣告才決定要怎麼畫。
    mcq:
      question: "規則 p { color: navy; } 選到誰？"
      options:
        - 段落元素
        - 所有標題
        - 只有第一行
      answer: 0
      explain: 選擇器決定規則套用到哪些元素；宣告才決定要怎麼畫。
    interview:
      question: 如何只改段落的顏色又不碰標題？
      points:
        - 用 p 選取元素
        - 指定 color 屬性
      answer: 選擇器決定規則套用到哪些元素；宣告才決定要怎麼畫。
  - id: styles-property
    prompt: color 和背景色有什麼差別？
    answer: color 設定文字等前景的顏色，不是整個區塊的底色。
    mcq:
      question: 改 color 最直接觀察哪裡？
      options:
        - 資料夾名稱
        - 文字顏色
        - 標題層級
      answer: 1
      explain: color 設定文字等前景的顏色，不是整個區塊的底色。
  - id: styles-reload
    prompt: 存檔後網頁還停在舊樣式，先檢查什麼？
    answer: 確認目前開的是剛才修改的檔案，儲存後再重新整理。
    mcq:
      question: 如何驗證真的使用新設定？
      options:
        - 儲存正確檔案並重新整理
        - 只改檔名
        - 搬動視窗
      answer: 0
      explain: 確認目前開的是剛才修改的檔案，儲存後再重新整理。
practice:
  - id: fs-demo-02-styles-p1
    title: 限制顏色的影響範圍
    kind: hands-on
    minutes: 5
    steps:
      - 打開上一堂的頁面原始碼，於標題元素前加入範例。
      - 儲存後重新整理；把 p 改成 h2，再比較畫面。
    checks:
      - 能指出變色和沒有變色的元素
      - 還原後標題結構不變
---
## 為什麼要學：同一份文字，兩種閱讀感受
頁面已有主題與段落。如果要讓段落帶一點深綠色，不必重寫每一句話，也不必改變標題層級。把外觀另外寫成規則，就能把「在說什麼」與「看起來怎樣」分開檢查。
## 核心概念：先找對象，再說要改什麼
階層式樣式表 (CSS) 用規則指定外觀。選擇器 (selector) 寫在大括號前，決定受影響的元素。大括號內則放宣告，例如文字顏色這個屬性，以及你選擇的顏色值。讀的時候先念出對象，再念出屬性與值，不會只記住一串符號。
## 範例：替昨天的網頁加上樣式
用文字編輯器打開上一堂存好的網頁，將下面這段放在第一個主標題前，再儲存並重新整理頁面。這個範例把樣式直接放在網頁內，便於觀察，不必建立其他檔案。
```html
<style>
  p { color: #205848; }
</style>
```
另一種讀法是只看其中的規則。把下面的選擇器暫時改成 h2，先預測誰會變色，再檢查畫面。改完之後，段落依然是段落，標題也沒有變成不同層級。
```css
p { color: #205848; }
```
### 怎麼知道真的選對了？
在筆記最底下多寫一個段落，用一句話描述剛才的觀察。不要替這段文字另外加顏色，直接儲存並重新整理。新段落如果也變綠，表示原來的規則不是只改動某一句話，而是能找到符合條件的元素。接著把同一句移進標題，觀察顏色是否保留。這個小測試同時比較了相同文字與不同結構，比單看畫面更容易判斷規則的作用。
## 常見錯誤：只用顏色交代意義
深綠色可以讓段落顯得平靜，但如果要傳達警告，不能只把它塗成另一種顏色。補上可讀的文字，例如「請先儲存」，讓無法分辨色彩的人也能理解。文字和底色也要有足夠對比，漂亮不等於讀得清楚。
> [!NOTE]
> 如果顏色完全沒變，先檢查選擇器是否選到頁面真的有的元素，再檢查檔案是否已儲存。
## 小結
每次只改一件事，才能知道是哪個改動造成差異。保留原先的文字與結構，只換選擇器，就能看見同一條宣告在不同對象上發揮作用。
