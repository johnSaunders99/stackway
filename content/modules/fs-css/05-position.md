---
id: fs-css-05-position
module: fs-css
order: 5
title: CSS 定位與包含區塊
subtitle: 徽章應該貼在哪張卡片上
status: ready
minutes: 30
level: 2
prereqs:
  - fs-css-04-grid
objectives:
  - 找出絕對定位參照的包含區塊
  - 比較 relative、absolute、fixed 與 sticky 對捲動的影響
tags:
  - css
  - position
resources:
  - title: MDN：position 屬性
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-css-05-block
    prompt: "此頁卡片為什麼只設 relative 而不移動？"
    answer: "要建立徽章的定位參考，又保留卡片原位。"
    mcq:
      question: "卡片沒有偏移量，子徽章卻用了 absolute。卡片的 relative 在這裡有什麼用途？"
      options:
        - "讓卡片固定在視窗"
        - "給子徽章定位基準"
        - "讓卡片脫離文流"
        - "讓徽章保留原位空間"
      answer: 1
      explain: "建立參考框不必真的挪動卡片。"
    interview:
      question: "兩張卡的徽章疊在同一個角落，你怎麼定位原因？"
      points:
        - "檢查徽章是否絕對定位"
        - "向上找各自的包含區塊"
        - "測試捲動並保留文字空間"
      answer: "我先在工具裡找每個徽章的定位祖先。如果兩個都跳過自己的卡片，就讓卡片建立參考框，再捲動和放大文字，確認徽章跟對且沒有遮字。"
  - id: fs-css-05-flow
    prompt: "哪種定位在本例不替徽章保留正常流的空間？"
    answer: "absolute，所以必須自行安排不遮文字的留白。"
    mcq:
      question: "卡片內的徽章需要脫離正常流、以這張已定位卡片作座標基準，應選哪種定位？"
      options:
        - "absolute"
        - "static"
        - "未偏移的 relative"
        - "保有文流位置的 sticky"
      answer: 0
      explain: "脫離正常流後，其他內容不會自動繞開它。"
  - id: fs-css-05-sticky
    prompt: "清單標題暫貼上緣，跟固定提示的關鍵差異是什麼？"
    answer: "標題保有正常位置並受捲動門檻與容器限制。"
    mcq:
      question: "標題在可捲動清單內使用 sticky 與 top: 0，另一個提示用 fixed 貼在視窗。哪個敘述正確？"
      options:
        - "兩者都固定於視窗"
        - "標題一定脫離文流"
        - "提示跟著卡片捲走"
        - "標題受清單與門檻限制"
      answer: 3
      explain: "固定提示以視窗為基準，不會因為清單捲動而改變位置。"
practice:
  - id: fs-css-05-p1
    title: "替三種標記畫出參考框"
    kind: hands-on
    minutes: 13
    steps:
      - "存下頁面並截取清單捲動前後兩個畫面。"
      - "在圖上標記卡片、清單、視窗三個參考範圍。"
      - "暫停卡片的相對定位再還原。"
    checks:
      - "捲動時北門徽章隨卡離開。"
      - "標題留在清單上緣，提示留在視窗角落。"
      - "還原後兩個徽章不共用同一個角落。"
---

## 為什麼要學

卡片右上角的「新」本來應該跟著卡片，頁面往下一捲卻還貼在視窗。另一種錯誤更隱晦：兩張卡的徽章竟疊在同一處。要解決的不是把座標再調 2 個像素，而是弄清楚每個座標是從哪裡量起，以及這個元素還有沒有替自己保留原來的位置。

## 核心概念

正常流（normal flow）是瀏覽器平常安放內容的方式。相對定位（relative positioning）保留原本的空間；就算用偏移把元素畫到旁邊，後面的內容仍照原來位置排列。只設 `position: relative` 而不給偏移，一般不會讓卡片自己移動，卻能成為絕對定位子元素的包含區塊（containing block）。本頁沒有變形等其他建立包含區塊的效果，所以往上找最近的已定位祖先，就是找徽章座標的起點。

絕對定位（absolute positioning）脫離正常流，不替徽章留空格；在該包含區塊用 `top` 與 `right` 各量一段距離。固定定位（fixed positioning）也脫離正常流，本例參考的是視窗，頁面捲動仍在原處。黏著定位（sticky positioning）則先保有正常位置，捲到設定的門檻後才在捲動區邊緣暫時貼住，還受所屬容器邊界限制。它不是「比較慢才啟動的固定定位」。

## 範例：讓 3 個標記各自跟對地方

在 `C:\dev\stackway-lab\css-lab` 存成 `position.html`。開啟後只捲動有邊框的清單，觀察標題、徽章與右下角提示各自以誰為參考。

```html
<!doctype html>
<html lang="zh-Hant">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>捲動觀察窗</title>
<style>
.list { height: 12rem; overflow: auto; border: 2px solid #486052; }
h1 { position: sticky; top: 0; z-index: 1; margin: 0; background: #e1efe7; }
.card { position: relative; min-height: 9rem; padding: 1rem 4rem 1rem 1rem; }
.badge { position: absolute; top: .5rem; right: .5rem; }
.hint { position: fixed; right: 1rem; bottom: 1rem; background: #fff2cd; }
</style>
<section class="list"><h1>路線清單</h1>
<article class="card">北門<span class="badge">新</span></article>
<article class="card">東門<span class="badge">更新</span></article></section>
<small class="hint">操作示意</small>
</html>
```

每張卡是自己徽章最近的已定位祖先，所以兩個徽章各在一張卡上。卡片右側內距是刻意留的：絕對定位的文字不會自動替旁邊的內文騰空間。標題用不透明背景與較高的堆疊順序，讓內容滑過時不會透出底下的字。把清單捲到底後，第一個徽章應隨北門離開，標題仍在清單上緣，提示仍在視窗右下。

在工具中暫時關掉兩張卡共用的 `position: relative`。此頁的徽章找不到原本的定位祖先，會改以起始包含區塊為基準，兩個右上角可能重疊。重新打勾，兩個位置應各自回到卡片。這個反向實驗比反覆調整 `right` 更能說明真正的原因。

別只測一張卡，因為參考框寫錯時，第一顆徽章有時剛好看起來位置正確。加上第二張並捲走第一張後，如果兩顆仍黏在同一角，就能排除只是邊距不夠大的猜測。

## 常見錯誤

把標題設為黏著卻沒指定 `top` 等門檻，便看不到預期效果；或以為在捲整頁，其實可捲的是內層清單。先指出誰真的在捲，再查門檻。固定提示在視窗很小或放大字級時可能遮到操作，不要把非必要的漂浮元素放在主要按鈕上。

## 小結

逐一問：還佔不佔原位、座標從哪量、捲的是誰？留下一張捲動前後的標記圖，就能分辨要修的是參考框、文流，還是遮住內容的留白。
