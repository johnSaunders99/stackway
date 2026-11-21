---
id: fs-css-01-cascade
module: fs-css
order: 1
title: CSS 階層與優先順序
subtitle: 兩條規則都選到標題，誰說了算
status: ready
minutes: 30
level: 2
prereqs: []
objectives:
  - 用來源、優先度與順序解釋勝出的宣告
  - 在開發者工具找出被覆蓋的屬性
tags:
  - css
  - cascade
resources:
  - title: MDN：CSS 階層規則
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-css-01-match
    prompt: "某條規則能參與標題的顏色比較，首先必須符合什麼？"
    answer: "選擇器命中該元素，且宣告適用於該屬性。"
    mcq:
      question: "有三條規則都寫了 color。某規則要參與標題的顏色比較，第一個條件是什麼？"
      options:
        - "在文件最後"
        - "選到標題並宣告顏色"
        - "至少使用兩個類別"
        - "一定要用重要宣告"
      answer: 1
      explain: "再靠後的規則若沒有命中，也不會決定此元素的顏色。"
    interview:
      question: "你如何區分選擇器寫錯與顏色被覆蓋？"
      points:
        - "先檢查正確元素"
        - "區分未出現與被劃掉"
        - "對照計算值及勝出來源"
      answer: "我會直接檢查那個標題。規則沒出現先查類別與載入；出現但被劃掉，就展開計算值看是哪條規則勝出，再挑最小修改。"
  - id: fs-css-01-tie
    prompt: "同來源同層的一般類別規則明確度相同時，誰勝出？"
    answer: "這裡由樣式表中較晚出現的宣告勝出。"
    mcq:
      question: "同來源、同層的普通規則各用一個類別選到同一標題，哪條 color 宣告勝出？"
      options:
        - "樣式表較晚出現者"
        - "標籤 class 較晚列出者"
        - "名稱字母較前者"
        - "顏色較深者"
      answer: 0
      explain: "HTML 類別清單的次序不決定樣式宣告順序。"
  - id: fs-css-01-property
    prompt: "顏色被覆蓋會讓同規則裡的底線也失效嗎？"
    answer: "不會，階層針對各個屬性分別選值。"
    mcq:
      question: "類別規則的 color 被另一條規則覆蓋。原規則沒有競爭對手的底線宣告會一起消失嗎？"
      options:
        - "會，被覆蓋的是整條規則"
        - "會，除非把底線移到行內樣式"
        - "會，除非另一條規則也宣告底線"
        - "不會，各屬性分別比較"
      answer: 3
      explain: "另一條規則只競爭顏色，沒有競爭底線。"
practice:
  - id: fs-css-01-p1
    title: "存下兩次階層判讀"
    kind: hands-on
    minutes: 12
    steps:
      - "建立 cascade.html，截取第一次的樣式面板。"
      - "交換兩條類別規則並重整。"
      - "只交換 HTML 類別順序再比一次，將結論寫在自己的練習筆記。"
    checks:
      - "第一次褐色並有底線。"
      - "交換樣式規則後變綠。"
      - "只交換類別清單不改結果。"
---

## 為什麼要學

你把標題文字設成紫色，重新整理後它仍然是綠色。這不一定是快取，更不表示瀏覽器漏讀了最後一行。階層（cascade）是在同一元素的同一屬性收到不只一個宣告時，用來挑出有效值的規則。這堂不靠猜：你會先預測標題和內文各是什麼顏色，再在瀏覽器找出一條命中卻沒勝出的宣告。

## 核心概念

樣式規則有兩部分：選擇器（selector）挑元素，宣告（declaration）指定屬性和值。先排除根本沒選到這個元素的規則，再比來源與重要性（origin and importance）。瀏覽器有自己的預設樣式，頁面作者也能寫樣式；一般情況下作者的一般宣告可蓋過瀏覽器的一般預設。重要宣告、階層層級等會改變比較條件；本例全是作者寫的普通、未分層規則，沒有行內樣式，才可以專心比較下一關。

明確度（specificity）衡量選擇器寫得多具體。在本例中，類別選擇器比元素名稱具體；兩個同樣是單一類別的選擇器，明確度相同，才由後出現者勝出。順序看的是樣式表中的宣告，不是 HTML 的類別名稱先寫哪個。這個比較針對每個屬性各做一次：兩個規則爭文字顏色，不會順便把較早規則的底線也取消掉。

## 範例：把猜測變成 2 次可驗證的預測

在 `C:\dev\stackway-lab` 新建 `css-lab` 資料夾，用編輯器把下方完整頁面存成其中的 `cascade.html`。以 Chrome 或 Edge 開檔；其他系統在自己的練習目錄開同一檔案即可，不需要伺服器。

```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>標題用哪個顏色？</title>
<style>
.notice { color: #165b45; text-decoration: underline; }
.alert { color: #793600; }
h1 { color: #6233a1; }
</style>
<h1 class="alert notice">北線改道</h1>
<p>請從東門出發。</p>
</html>
```

先預測：最後的元素規則會贏嗎？用右鍵「檢查」點選標題，在元素面板的樣式（Styles）區找 `color`，你應看到兩個被劃掉的顏色，實際使用褐色，底線仍在。內文段落不是這三個選擇器的目標，不會和標題爭同一個值。切到計算後樣式（Computed），展開顏色來源，對照真正用來繪製標題的數值。

現在只把兩條類別規則的先後交換，元素規則仍在最後，儲存後重整。標題變為綠色，是因為同樣具體的兩條規則改變了順序，不是元素規則失效。如果只交換標籤裡兩個類別名稱，顏色就不應改變。兩種交換看起來很像，卻只有一種改動了階層實際比較的條件。

## 常見錯誤

樣式面板根本找不到預期規則，卻一直調整優先順序；先查選中的元素、類別拼法以及檔案是否儲存。看到宣告被劃掉，表示它有命中但輸給別人，才值得追比較條件。別急著加 `!important`，否則暫時蓋住結果，卻沒找到原本衝突在哪一關。

## 小結

診斷順序是先問「選到了嗎」，再問「誰有資格優先」，最後才比明確度與先後。留下兩次結果與勝出的選擇器，這比抄一張權重表更能幫你解決下次改色無效的問題。
