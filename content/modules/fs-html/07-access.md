---
id: fs-html-05-access
module: fs-html
order: 7
title: 鍵盤操作與焦點
subtitle: 不靠顏色也能找到下一步
status: ready
minutes: 35
level: 2
prereqs:
  - fs-html-04-layout
objectives:
  - 保留焦點外框與合理順序
  - 為圖片及錯誤提示補上文字替代
tags:
  - html
  - accessibility
resources:
  - title: "W3C WAI：可見的鍵盤焦點"
    url: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: "W3C WAI：可辨認、可修正的表單訊息"
    url: https://www.w3.org/WAI/tutorials/forms/notifications/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-html-05-access-focus
    prompt: "只用鍵盤時怎麼知道下一次 Enter 會作用在哪裡？"
    answer: "看目前可見的焦點指示，按 Tab 或 Shift+Tab 往前後移動，確認外框跟著真正有焦點的控制項。"
    mcq:
      question: "拿掉 outline 後沒有其他指示，最直接失去哪項資訊？"
      options:
        - "欄位送出的名稱"
        - "表單的文字編碼"
        - "圖片的檔案類型"
        - "目前操作對象的位置"
      answer: 3
      explain: "鍵盤可能仍能操作，但讀者看不見焦點停在哪裡。"
  - id: fs-html-05-access-order
    prompt: "如何讓鍵盤順序符合閱讀順序？"
    answer: "先照任務順序安排原生連結、欄位與按鈕的文件順序，別用正數 tabindex 硬插隊。"
    mcq:
      question: "希望先看說明再填欄位、最後送出，哪個做法優先？"
      options:
        - "依此順序排列可操作元素"
        - "替每個元素塞同一個正數 tabindex"
        - "只用顏色標示 1、2、3"
        - "把段落畫成按鈕樣式"
      answer: 0
      explain: "文件順序搭配原生控制項自然形成路線，樣式本身不會創造操作能力。"
  - id: fs-html-05-access-message
    prompt: "錯誤提示不能只是一圈紅色，還要說什麼？"
    answer: "說明是哪個欄位、錯在哪裡及如何修正，並讓欄位可以關聯到提示。"
    interview:
      question: "有人回報無法完成表單，但滑鼠點起來正常，你會怎麼驗收？"
      points:
        - "只用鍵盤逐站往返並檢查焦點"
        - "測缺值和修正後送出"
        - "不靠顏色仍能理解錯誤與圖片用途"
      answer: "我會先放開滑鼠走完一次，記下焦點消失或跳錯的那一站。再送出空值，看是否知道要回哪欄、怎麼修；最後補值重試。看得到紅框或能用滑鼠按到都不能代替這幾項檢查。"
practice:
  - id: fs-html-05-access-p1
    title: "交一份不靠滑鼠的驗收紀錄"
    kind: hands-on
    minutes: 13
    steps:
      - "在有收據頁的 form-lab 裡建立 access.html，只用 Tab、Shift+Tab 與 Enter 往返，依序記下三個停靠點。"
      - "試送空表單，再填 lab 重送。把錯誤的欄位與修正方式各寫一句。"
      - "檢查說明中的符號若不顯示，是否仍能讀懂狀態；再做正文的圖片替代練習，留下修改後的欄旁說明。"
    checks:
      - "每一站都有可見外框，倒走能回到前一站。"
      - "不辨顏色也能說出必填與修正方法；修正後抵達「已抵達收據頁」。"
---

## 為什麼要學：滑鼠放下來，頁面還會告訴你下一步嗎？

在熟悉的頁面，你用滑鼠一下就能點到「送出」。換成只靠鍵盤，沒有外框就可能完全不知道現在停在連結還是按鈕；看不出紅色也可能不知道哪一欄要修。這一堂最後的作品不是多一組裝飾，而是一份可重做的驗收紀錄：從讀說明、填資料、遇到錯誤到修正送出，每一站都有線索。

## 核心概念：焦點、順序與說明要一起成立

鍵盤焦點（keyboard focus）標出目前接收鍵盤操作的元素。Tab 移向下一個可聚焦項目，Shift+Tab 往回；不是每段內文都應停一站。原生連結、輸入欄位和按鈕本來就能用鍵盤操作，先把它們按閱讀順序寫在文件裡，再排版，比用正數 `tabindex` 硬指定一串順序更容易維護。

保留瀏覽器的預設外框，或用 `:focus-visible` 加上清楚可辨的替代外框。這個選擇器讓瀏覽器在適合顯示鍵盤焦點時套用樣式。錯誤訊息應指出欄位、問題和修正方法，不能只有紅色。`aria-describedby` 讓控制項引用頁面上已有說明的識別名稱，它補充可見標籤，並不是用來取代標籤。

## 範例：故意失敗一次，再把路走完

在[〈HTML 表單與標籤〉](#/lesson/fs-html-02-form)建立的 `C:\dev\stackway-lab\html-desk\form-lab`（內有 `receipt.html`）把下方存為 `access.html`，用瀏覽器開啟。說明裡的菱形只是裝飾；即使沒看到它，後面的「必填」仍交代了要求。表單保留瀏覽器的原生必填檢查，不需安裝輔助軟體即可做第一輪鍵盤驗收。

```html
<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><title>鍵盤驗收頁</title>
<style>:focus-visible { outline: 3px solid #154d77; outline-offset: 3px; }</style>
</head><body><main><h1>練習登記</h1>
<a href="#guide">查看填寫說明</a>
<p id="guide"><span aria-hidden="true">◆</span> 必填：請在練習主題輸入一個詞，例如 lab。</p>
<form action="receipt.html" method="get">
  <label for="topic">練習主題（必填）</label>
  <input id="topic" name="topic" required aria-describedby="guide">
  <button type="submit">送出練習</button>
</form></main></body></html>
```

從頁面起點按 Tab，依序應到說明連結、主題欄與送出按鈕；從按鈕按 Shift+Tab 應回到欄位。先保持空白，在按鈕按 Enter，觀察瀏覽器阻擋送出並引導你回到必填欄。提示原文可能因瀏覽器語言而異，驗收的是能辨認缺哪一欄、知道怎麼補。填入 `lab` 後重送，應抵達已準備好的收據頁；用瀏覽器的返回功能再回來，確認仍可以重新操作。

測的不是能不能背出「按兩次就到了」。在第二站停住，不看先前的操作次數，只憑畫面指出接下來的打字會落在哪一欄。能指出並實際輸入，才算同時驗到焦點位置與操作結果。

## 常見錯誤：不想看見外框，就把所有外框關掉

用滑鼠測不到焦點遺失，外框若只在一瞬間閃一下也不夠。請真的把雙手放在鍵盤上走一輪。若改用圖片表達狀態，純裝飾菱形可用空替代文字；若圖片是唯一的「尚缺主題」資訊，就要提供等價文字，最好在欄旁直接說「練習主題未填，請輸入一個詞」。替代文字不是只把紅叉描述成紅色的叉。

### 把裝飾圖和錯誤分開驗收

若要把菱形換成自己的小圖，用小畫家在本堂的目錄存一張 `mark.png`。只替換說明段落裡的 `span`，寫成 `<img src="mark.png" alt="" width="12" height="12">`，保留後面的必填文字。現在把圖片檔名暫時改錯，頁面仍應說得出怎麼修正。若改作只有圖片的狀態提示，替代文字就應寫「主題未填」，並在旁邊明寫「請輸入一個詞」；試完把圖片路徑還原。

## 小結：留下路線、失敗與恢復

紙上記下正走與倒走的停靠點、第一次為何送不出去、補正後看見什麼。這不能替代所有輔助科技的檢測，但足以發現「只有滑鼠使用者才找得到下一步」的問題，也能讓下一位修改頁面的人知道該從哪裡重新驗收。
