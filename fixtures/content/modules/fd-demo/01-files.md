---
id: fd-demo-01-files
subtitle: 關掉編輯器，也能找回同一份筆記
module: fd-demo
order: 1
title: 檔案與資料夾：替筆記找個家
status: ready
minutes: 20
level: 1
prereqs: []
objectives:
  - 分辨內容與存放位置
  - 用資料夾和副檔名描述一份筆記
tags:
  - 檔案
  - 副檔名
resources:
  - title: 認識目錄的內容
    url: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/get-childitem?view=powershell-7.5
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: 2026-11-20
concepts:
  - id: files-unit
    prompt: 檔案與資料夾各負責什麼？
    answer: 檔案保存內容；資料夾整理檔案和其他資料夾。
    mcq:
      question: 哪一項適合存放一段筆記內容？
      options:
        - 文字檔案
        - 資料夾名稱
        - 工作列
      answer: 0
      explain: 檔案保存內容；資料夾整理檔案和其他資料夾。
    interview:
      question: 要交給別人一份筆記，你會指出哪兩件事？
      points:
        - 指出哪個檔案裝著內容
        - 說明到哪個資料夾找它
      answer: 檔案保存內容；資料夾整理檔案和其他資料夾。
  - id: files-ext
    prompt: 把筆記的副檔名改成 .png，會變成圖片嗎？
    answer: 不會。副檔名是辨識格式的線索，重新命名不會轉換內部資料。
    mcq:
      question: 改副檔名之後，什麼不會自動改變？
      options:
        - 顯示名稱
        - 內容格式
        - 檔名尾端
      answer: 1
      explain: 不會。副檔名是辨識格式的線索，重新命名不會轉換內部資料。
  - id: files-copy
    prompt: 複製與搬移有什麼差異？
    answer: 複製會另外建立一份，搬移則改變原檔的位置。
    mcq:
      question: 保留原稿再做修改要用哪個操作？
      options:
        - 複製
        - 搬移
        - 重新命名
      answer: 0
      explain: 複製會另外建立一份，搬移則改變原檔的位置。
practice:
  - id: fd-demo-01-files-p1
    title: 建立自己的練習角落
    kind: hands-on
    minutes: 5
    steps:
      - 在文件資料夾新增 study 資料夾。
      - 用記事本建立 notes.txt，輸入今天想學的事並儲存在 study。
      - 關閉記事本，再從資料夾開啟筆記。
    checks:
      - 我能在沒有最近開啟清單的情況下找到筆記
      - 重新開啟後仍讀得到文字
---
## 為什麼要學：明天還找得到嗎？
把一句話打在螢幕上，和把它保存起來，是兩件不同的事。想像今天在記事本寫下「第一天」，關掉視窗之後，要靠什麼把它找回來？這堂課的成果不是背一串名稱，而是留下一份明天還打得開的筆記。
## 核心概念：內容和位置分開想
檔案 (file) 是有名稱的一份資料。資料夾 (folder) 則容納檔案，也能容納其他資料夾。可以把一間工作室想成好幾層抽屜；標籤寫「筆記」的抽屜本身不是一篇筆記，裡面的每張稿紙才有實際內容。
![study 資料夾中的文字筆記與網頁](assets/worktree.svg)
### 名稱是線索，不是內容
檔名最後一個點後方常有副檔名 (extension)。看到 notes.txt，你可以先猜它是一份純文字，但要打開檢查才知道裡面寫什麼。把名稱改成 notes.png，原本的文字不會變成圖畫。
## 範例：讀一張目錄清單
下面是範例，不用輸入。從上一行的資料夾往下看，兩個不同用途的檔案可以放在一起；它們不會因為放在相同位置而合併。
```text
study/
  notes.txt
  index.html
```
| 操作 | 到另一個位置看到什麼？ |
| --- | --- |
| 複製 | 原處和新位置各有一份 |
| 搬移 | 到新位置找原本那一份 |
### 做一次「找回來」的測試
請想像明天的你只收到一張紙條。上面若只寫「打開筆記」，能找到同名的哪一份呢？改寫成「打開文件裡的練習資料夾，再開文字筆記」，就多了可追蹤的線索。儲存之後關閉視窗再重開，是成本很低的確認方式。
## 常見錯誤：看見文字就以為存好了
記事本的視窗顯示的是正在編輯的內容。第一次儲存時，請留意對話框上方的位置和下方的檔名。不要只按確定；先說出「它要被放進哪個資料夾」。如果看不到副檔名，可在檔案總管的檢視選項開啟顯示副檔名。
> [!TIP]
> 只在自己剛建立的練習資料夾操作。要比較兩種做法時，先另存一份副本。
## 小結
從檔案總管重新打開你的筆記，比從記事本的最近清單開啟更能檢查理解。前者需要你真的知道位置；後者只證明程式還記得你。下次請別人幫忙找檔案時，先說資料夾，再說完整檔名。
