---
id: fs-css-07-variables
module: fs-css
order: 7
title: CSS 變數與自訂屬性
subtitle: 只改一處就換整頁的提示色
status: ready
minutes: 25
level: 2
prereqs:
  - fs-css-06-responsive
objectives:
  - 宣告並以 var 讀取共用樣式值
  - 用元件作用域覆寫局部顏色而不影響其他卡片
tags:
  - css
  - variables
resources:
  - title: MDN：CSS 自訂屬性
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-css-07-read
    prompt: "宣告 --route-ink 後，怎麼讓文字真的使用它？"
    answer: "在 color 中用 var(--route-ink) 讀取。"
    mcq:
      question: "已宣告 --route-ink，自訂值要怎麼用在標題的文字顏色？"
      options:
        - "把 --route-ink 直接寫在 color 後面而不用 var"
        - "只在標題加上名為 route-ink 的類別"
        - "只在根宣告自訂屬性就會自動套色"
        - "把 var(--route-ink) 指給 color"
      answer: 3
      explain: "自訂屬性儲存值，不會自行選擇要繪製的屬性。"
    interview:
      question: "改整頁提示色但要保留注意卡，你會在哪裡下手？"
      points:
        - "命名共用的用途"
        - "根提供預設而卡片局部覆寫"
        - "檢查受影響與不受影響的元素"
      answer: "我會讓邊線和標題都讀同一個提示色，根元素供一般值，注意卡只覆寫這個名稱。改根之後我會同時看兩張卡，確認只有一般卡跟著換色。"
  - id: fs-css-07-scope
    prompt: "注意卡覆寫自訂屬性，隔壁一般卡會跟著變嗎？"
    answer: "不會，隔壁不是注意卡的後代。"
    mcq:
      question: "兩張卡互為相鄰元素，只有注意卡重新宣告 --route-ink。一般卡會跟著換色嗎？"
      options:
        - "會，只要排在注意卡後面"
        - "會，因為兩張卡共用同一類別"
        - "不會，並非其後代"
        - "會，因為兩張卡讀取同名變數"
      answer: 2
      explain: "繼承沿著文件樹，不沿著相鄰元素的閱讀順序。"
  - id: fs-css-07-fallback
    prompt: "本例找不到 --route-ink 時，var 的第二項有什麼用途？"
    answer: "提供可以替代缺失值的備用色。"
    mcq:
      question: "宣告 color: var(--route-ink, #333)，但元素和祖先都沒有這個名稱。第二項有何用途？"
      options:
        - "永遠蓋過第一項"
        - "提供缺失時的替代值"
        - "與第一項混成介於兩者之間的顏色"
        - "把顏色回寫成根元素的預設值"
      answer: 1
      explain: "讀取的名稱不存在，才選用備用值。"
practice:
  - id: fs-css-07-p1
    title: "保留一組有局部覆寫的狀態卡"
    kind: hands-on
    minutes: 10
    steps:
      - "建立 variables.html，找出兩張卡各自的顏色來源。"
      - "將根提示色改藍，停用後再還原注意卡的宣告。"
      - "保存正常頁面與兩張卡的結果說明。"
    checks:
      - "一般卡標題與線條一起變藍。"
      - "注意卡兩處仍褐色。"
      - "停用局部宣告時注意卡才跟著變藍。"
---

## 為什麼要學

入口牌、提示文字和左側線條用了同一種綠，但它們究竟是「都剛好是綠色」，還是「都在表達路線狀態」？前者要改三處，後者可以共用一個有意義的名字。自訂屬性（custom property）讓樣式表保存可重用的值，也常被稱為 CSS 變數。這堂故意做兩張很像的卡：一般卡沿用整頁提示色，注意卡只在自己的範圍換色。

## 核心概念

宣告名稱以兩個連字號開始，例如 `--route-ink`；冒號後是值。宣告本身不會畫東西，要在一般屬性裡用 `var(--route-ink)` 取出來。名稱區分大小寫，取名時最好描述用途而不是當前色名。若叫「綠色」後來改成褐色，每個使用處都會像寫錯了；若叫「路線提示色」，換色時名字仍說得通。

本例的一般自訂屬性預設會繼承（inheritance），所以放在 `:root` 根元素上的值可以傳到後代。作用範圍（scope）不是「檔案中宣告後的每一行」，而是看元素在文件樹上的位置，以及它自己和祖先上有哪些勝出的宣告。注意卡自己重新指定值，裡面的標題便會取得新的值；隔壁的卡不是它的後代，不會被染色。`var(--route-ink, #333)` 的第二項是找不到可用自訂屬性時的備用值，不會搶過已經定義好的顏色。

## 範例：只動宣告，不複製卡片樣式

在 `C:\dev\stackway-lab\css-lab` 建立 `variables.html`，以瀏覽器開啟。兩張卡只有狀態類別與文字不同，不必為第二張再寫一套邊線和標題樣式。

```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>2 種路線狀態</title>
<style>
:root { --route-ink: #175b45; }
.card { border-left: .35rem solid var(--route-ink, #333);
        padding: .5rem 1rem; margin: 1rem; background: #f6f5ef; }
.card h2 { color: var(--route-ink, #333); }
.caution { --route-ink: #773600; }
</style>
<main><h1>路線狀態</h1>
<article class="card"><h2>開放</h2><p>北段可通行。</p></article>
<article class="card caution"><h2>注意</h2><p>橋面濕滑。</p></article></main>
</html>
```

先預測注意卡的標題與左線是否同色，再用工具檢查其中一個標題，在樣式區追溯自訂屬性的來源。將根元素上的值改成 `#274883`；一般卡的左線與標題一起轉藍，注意卡仍為褐色。這是一個局部覆寫確實生效的正反例：受影響的地方變了，不該受影響的沒變。把注意卡的局部宣告暫停，它才會回到和一般卡相同的藍。

還有一個容易混淆的實驗：只把根的屬性名稱拼成 `--route-Ink`，保留兩處讀取原樣，並恢復注意卡的局部宣告。一般卡會用備用灰，注意卡仍有自己的值。若只是把已存在的值寫成不適合顏色的長度，不能期待備用色替你做型別檢查；問題會發生在使用它的顏色宣告。做完還原拼字，將正常的藍色一般卡與褐色注意卡存下。

## 常見錯誤

只改名稱卻忘記在需要的屬性使用 `var`，畫面當然沒有變。另一個問題是為了改一張卡而改根值，讓其他元件無意間一起變色。用工具選中實際元素，先找哪個祖先提供目前的值，再決定應在根、區塊還是卡片上覆寫。

## 小結

把同一個設計意義命名一次，需要差異時才在最小範圍改值。除了驗證顏色，保留「開放」「注意」這些文字，讓狀態不只靠讀者辨色來傳達。
