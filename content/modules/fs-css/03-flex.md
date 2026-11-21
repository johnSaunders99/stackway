---
id: fs-css-03-flex
module: fs-css
order: 3
title: Flexbox 對齊與伸縮
subtitle: 一排按鈕擠不下怎麼排
status: ready
minutes: 30
level: 2
prereqs:
  - fs-css-02-units
objectives:
  - 標出主軸與交叉軸
  - 改變伸縮與換行設定，比對窄畫面中的按鈕位置
tags:
  - css
  - flex
resources:
  - title: MDN：彈性盒排版
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-css-03-axes
    prompt: "橫寫頁面把 flex-direction 改成 column，主軸變成哪個方向？"
    answer: "變成直向，交叉軸則橫向。"
    mcq:
      question: "在水平書寫的頁面中，flex-direction: column 讓容器的主軸朝哪裡？"
      options:
        - "沿水平方向"
        - "沿文字基線方向"
        - "永遠沿視窗較長的一邊"
        - "沿垂直方向"
      answer: 3
      explain: "主軸由排列方向決定，不是永久水平。"
    interview:
      question: "一排按鈕在窄畫面擠出邊界，你先查什麼？"
      points:
        - "找到父容器與排列軸"
        - "檢查起算尺寸和換行"
        - "核對按鈕可見且焦點順序合理"
      answer: "我先找直接包住按鈕的容器，看它是否允許換行，再量按鈕加間距能否放下。我會保留文字，讓窄時換行，最後用 Tab 走過全部操作。"
  - id: fs-css-03-wrap
    prompt: "哪個設定直接允許空間不足時另開一行？"
    answer: "在容器設定 flex-wrap: wrap。"
    mcq:
      question: "想保留按鈕順序並允許換行，調哪個？"
      options:
        - "align-items: center"
        - "justify-content: center"
        - "flex-wrap: wrap"
        - "flex-grow: 0"
      answer: 2
      explain: "對齊與伸展只分配現有空間，並不是開啟換行。"
  - id: fs-css-03-line
    prompt: "最後一行只剩一顆按鈕，為何可能特別寬？"
    answer: "各行獨立分配空間；它可獨佔該行的剩餘寬度。"
    mcq:
      question: "一個允許換行的 Flexbox 裡，按鈕都用 flex: 1 1 8rem。最後一行只有一顆，為什麼它特別寬？"
      options:
        - "每一行都沿用上一行的欄寬"
        - "該行單獨分配伸展空間"
        - "gap 會加進最後一個按鈕的寬度"
        - "align-items 自動把橫向按鈕撐寬"
      answer: 1
      explain: "不是所有行合用固定欄軌，這正是與網格的差別。"
practice:
  - id: fs-css-03-p1
    title: "留下一組可換行的操作列"
    kind: hands-on
    minutes: 12
    steps:
      - "存好 flex.html，觀察寬版的一行按鈕。"
      - "把容器限制到 20 rem，截取換行後畫面。"
      - "比較伸展比例一與 0，再還原並逐一按 Tab。"
    checks:
      - "窄時看得到全部三顆按鈕。"
      - "能指出最後一顆變寬的時機。"
      - "焦點順序為儲存、預覽、回到清單。"
---

## 為什麼要學

「儲存、預覽、回到清單」三個按鈕在桌機排得開，可是把視窗縮窄後，最後一顆不見了。你可以硬切成 3 等分，結果只是讓最長的名稱換兩行。彈性盒（Flexbox）更適合這種需求：同一組項目按順序排列，允許它們依空間伸縮，必要時換到下一行。這堂要做到的是窄時仍能操作，而不是在每個尺寸都湊出同一張截圖。

## 核心概念

在父元素設定 `display: flex`，它成為彈性容器（flex container），直接子元素才是彈性項目（flex item）。主軸（main axis）是排列項目的方向，交叉軸（cross axis）與它垂直。在這個橫寫頁面，預設的 `row` 讓主軸橫向；換成 `column` 後，主軸直向。`justify-content` 沿主軸分配剩餘空間，`align-items` 沿交叉軸對齊，所以不能把這兩個屬性死背成水平與垂直。

`flex: 1 1 8rem` 依序表示伸展比例、收縮係數與起算尺寸。先用起算尺寸估算項目能不能排進這行，再分配這行剩下的空間；當尺寸受限時還得尊重內容的最小尺寸。`gap` 預留項目之間的間距；`flex-wrap: wrap` 允許空間不足就另開一行，不會更改按鈕在文件中的順序。每一行獨立分配空間，最後單獨留下的項目也能伸展。

## 範例：量出一顆按鈕何時換行

在 `C:\dev\stackway-lab\css-lab` 將以下頁面存成 `flex.html`，在瀏覽器開啟。這是排版樣本，按鈕不用連到任何服務。

```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>路線操作列</title>
<style>
.actions { display: flex; flex-direction: row; flex-wrap: wrap;
  gap: .5rem; align-items: center; max-width: 34rem;
  padding: .5rem; background: #e5ede8; }
button { flex: 1 1 8rem; padding: .6rem; font: inherit; }
</style>
<div class="actions" role="group" aria-label="路線操作">
<button>儲存</button><button>預覽路線</button><button>回到清單</button>
</div>
</html>
```

先在寬視窗觀察按鈕填滿一列。用工具把容器的最大寬度暫改成 `20rem`，不用換手機就能讓第三顆掉到下一行。第二行只有一顆，它會比上面單顆寬；這不是格線沒對齊，而是彈性盒依行分配。把首個數字改為 0，三顆不再吃光剩餘寬度，這時試著切換 `justify-content: flex-end`，才容易看清楚整組沿主軸移動了多少。

再把容器方向改成直排，保持按鈕順序，在工具裡暫停按鈕的 `flex` 宣告，切換 `align-items` 的 `center` 與 `stretch`。此時交叉方向是橫向，按鈕從置中變成填滿寬度；你剛用同一個屬性得到與橫排不同的視覺方向。把最初橫排、可以換行的設定存回檔案，以鍵盤逐一按 Tab，焦點應照原本三顆按鈕的閱讀順序走過。

若只允許改一個數字試驗，先把起算尺寸提高。按鈕的文字完全相同，卻會較早換行；這表示換行門檻不只是由名稱長度決定。

## 常見錯誤

把 `display: flex` 寫在每顆按鈕上，只會影響它們各自的內容，不會安排兄弟按鈕。想靠主軸對齊讓項目移動，卻已經用伸展吃掉所有空間，也會看不出差異。先在工具面板標出容器邊界、確認剩餘空間，再調整對齊，比任意換一排屬性有效。

## 小結

先畫兩條軸，再決定要換行、伸縮或對齊。保留一寬一窄兩個畫面，特別注意最後一行的寬度；下一堂[〈CSS Grid 網格〉](#/lesson/fs-css-04-grid)用網格處理「多行仍要對欄」的另一種需求。
