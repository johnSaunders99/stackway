---
id: fs-html-02-form
module: fs-html
order: 3
title: HTML 表單與標籤
subtitle: 讓欄位能被叫出名字
status: ready
minutes: 25
level: 2
prereqs:
  - fs-html-02-links
objectives:
  - 配對標籤與輸入欄位
  - 只用鍵盤完成表單一輪
tags:
  - html
  - forms
resources:
  - title: "W3C WAI：為表單控制項加上標籤"
    url: https://www.w3.org/WAI/tutorials/forms/labels/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: "看明確配對與按標籤聚焦的範例。"
concepts:
  - id: fs-html-02-form-label-target
    prompt: "label 的 for 要跟輸入欄位的哪個屬性相同？"
    answer: "要等於該欄位在頁內唯一的 id，讓文字和控制項有明確關聯。"
    mcq:
      question: "欄位 id 是 memo、name 是 note，標籤的 for 應是什麼？"
      options:
        - "note"
        - "label"
        - "input"
        - "memo"
      answer: 3
      explain: "for 指到頁內識別名稱，不是送出資料時使用的名字。"
    interview:
      question: "畫面有「練習主題」四個字，但點它不會進入欄位。你怎麼查？"
      points:
        - "確認是真正的 label"
        - "檢查 for 和唯一 id 是否一致"
        - "用點標籤及鍵盤分別驗收"
      answer: "我會先看那段文字是不是 label，再比對 for 與 id，尤其要排除重複 id。修好後點文字應聚焦到正確欄位，再用 Tab 從頭走一遍，確認不用滑鼠也能送出。"
  - id: fs-html-02-form-placeholder
    prompt: "有輸入提示字樣時為何仍需可見標籤？"
    answer: "提示會在輸入後消失，不能取代欄位持續可見且有程式關聯的名稱。"
    mcq:
      question: "打字後哪種資訊仍應留著，讓人知道填的是什麼？"
      options:
        - "欄位的可見標籤"
        - "只有空欄時才顯示的範例"
        - "游標顏色"
        - "送出按鈕的大小"
      answer: 0
      explain: "標籤回答欄位是什麼；範例只示範怎麼填。"
  - id: fs-html-02-form-submit
    prompt: "表單中 id 和 name 分別給誰用？"
    answer: "id 在本頁識別元素並配對標籤，name 則是送出有名稱的欄位資料時使用的鍵。"
practice:
  - id: fs-html-02-form-p1
    title: "用鍵盤完成並驗收一張本機練習單"
    kind: build
    minutes: 10
    steps:
      - "在同一個新目錄存好 form.html 和 receipt.html，用瀏覽器開啟表單。先點標籤確認焦點，再重新載入。"
      - "不碰滑鼠，用 Tab 到欄位、輸入虛構主題 lab、Tab 到按鈕並按 Enter。"
      - "在紙上記下欄位名稱、送出的鍵與操作順序，回到初始頁面。"
    checks:
      - "點標籤會出現輸入游標；填完仍看得到標籤。"
      - "留空時仍在原表單；填好後開啟 receipt.html，顯示「已抵達收據頁」。"
---

## 為什麼要學：會打字，不代表知道在填什麼

一個空框旁邊寫「練習主題」，用滑鼠看起來很自然。但輸入幾個字提示就消失了，或是點左邊的文字完全沒反應，讀者還得猜兩者是不是一組。表單（form）不只負責收文字，也應清楚交代正在問哪一題。今天做一張只用鍵盤也能完成的小表單，填好後按下送出，你會抵達另一張能叫出名字的收據頁。

## 核心概念：名稱、控制項、送出鍵各司其職

`form` 包住同一次收集的欄位與按鈕。`input` 是輸入控制項，`label` 是告訴人欄位用途的標籤。用 `id` 替控制項取一個頁內唯一的識別名稱，再讓標籤的 `for` 完全等於它。這樣即使兩者隔著一些排版空間，瀏覽器也知道點標籤應把輸入焦點（focus）送到哪裡。

另有一個容易混淆的名稱 `name`：它是送出時這筆資料的鍵。標籤跟 `id` 配對，資料用 `name` 取名，兩者可以不同。`placeholder` 只在空欄顯示範例；填入第一個字後就會消失，不能當永久標籤。`button type="submit"` 清楚表示按下會送出，而不是一段外觀像按鈕的文字。

## 範例：送到另一頁，取得看得見的收據

在練習區 `C:\dev\stackway-lab\html-desk` 內建立新的 `form-lab` 子目錄，在裡面建立 `form.html`，以 UTF-8 儲存後用 Chrome 或 Edge 開啟。這份表單只用練習資料，不需要連上伺服器（server，也就是接收網路請求的程式）。這裡用 GET 指定送出方式；在一般網站上，瀏覽器會把有名稱的欄位附在目的網址上。之後在[〈HTTP 方法、狀態與標頭〉](#/lesson/fd-network-03-message)會細講這種請求，今天只填虛構字樣。

```html
<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><title>練習單</title>
<main><h1>今日練習</h1>
  <form action="receipt.html" method="get">
    <label for="study-topic">練習主題</label>
    <input type="text" id="study-topic" name="topic" placeholder="例如 lab" required>
    <button type="submit">查看練習單</button>
  </form>
</main></html>
```

再於同一個 `form-lab` 資料夾建立 `receipt.html`。這頁只作為到達記號，不會讀取或儲存你填的內容。

```html
<!doctype html>
<html lang="zh-Hant"><meta charset="utf-8"><title>收據</title>
<main><h1>已抵達收據頁</h1><a href="form.html">返回練習單</a></main></html>
```

回到 `form.html`，點「練習主題」，輸入游標應出現在空框內。重新載入，按 Tab 到輸入欄位，打 `lab`，再按 Tab 到按鈕並按 Enter。頁面應顯示「已抵達收據頁」，分頁名稱也換成「收據」。本機檔案網址是否顯示查詢字串，不列入驗收。這只證明通過必填檢查、抵達正確目的地，不代表內容已被保存。

做一個精準的對照：把欄位的 `name` 暫時換成 `subject`，不要碰識別名稱。點標籤仍會聚焦原欄。這時讀原始碼，有名稱的欄位會用 `subject` 而非 `topic` 作為資料的鍵；目的檔名仍是同一個。把它改回原樣。這能把「誰指向誰」和「用什麼鍵送出」分開驗證，不必憑兩個英文名稱猜。

## 常見錯誤：有看到提示字，卻叫不到欄位

如果打完只剩孤零零的字，檢查是不是只有提示而沒有標籤。如果按標籤跑到另一欄，檢查是否有兩個欄位重複使用識別名稱。另一個有用的反例是留空直接送出，`required` 表示必填，瀏覽器應先請你填寫；這次沒看到新的收據是預期行為，不要為了讓畫面換頁就移除必填限制。

## 小結：分開驗收操作與資料

用滑鼠點文字只測到標籤關聯，用鍵盤走完整輪才能測到順序與送出。最後核對收據頁標題與表單原始碼中的資料鍵，不只看按鈕有沒有變色。把這三個觀察寫在紙上，這張小表單就有一份可重做的驗收紀錄。
