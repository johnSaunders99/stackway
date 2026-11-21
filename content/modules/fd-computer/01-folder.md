---
id: fd-computer-01-folder
module: fd-computer
order: 1
title: 資料夾與檔案路徑
subtitle: 先有一個找得回來的資料夾
status: ready
minutes: 20
level: 1
prereqs: []
objectives:
  - 在檔案總管建立並重新找到練習資料夾
  - 用上層與下一層描述檔案的位置
tags:
  - computer
  - folder
resources:
  - title: Microsoft：Windows 檔案總管
    url: https://support.microsoft.com/en-us/windows/experience/fileexplorer/file-explorer-in-windows
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
    note: 看開啟總管、位址列與檢視。
  - title: MDN：檔案與資料夾的安排
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Dealing_with_files
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
    note: 只看檔名和資料夾的例子。
concepts:
  - id: folder-kind
    prompt: 檔案與資料夾各自裝什麼？
    answer: 檔案保存內容；資料夾用來安排檔案與其他資料夾的位置。
    mcq:
      question: 想把同一週的練習放在一起，應先建立什麼？
      options:
        - 建立一個指向單一文件的捷徑
        - 建立一個資料夾
        - 把同週文件加入搜尋結果
        - 替每份文件改用相同副檔名
      answer: 1
      explain: 資料夾提供一個真實位置；搜尋結果只是符合條件的清單。
  - id: path-identity
    prompt: 兩份檔案名稱一樣，如何分辨是哪一份？
    answer: 比較從磁碟位置、各層資料夾到檔名的完整路徑。
    mcq:
      question: 兩個資料夾各有一份同名筆記。最可靠的分辨線索是？
      options:
        - 最後一段檔名
        - 預設開啟工具
        - 包含磁碟機與上層資料夾的完整路徑
        - 檔案的副檔名
      answer: 2
      explain: 名字只是最後一段。上一層不同，就是不同位置的檔案。
  - id: address-vs-search
    prompt: 位址列和搜尋框分別回答哪個問題？
    answer: 位址列顯示或切換位置；搜尋框在指定範圍尋找符合條件的項目。
    mcq:
      question: 已知資料夾位置，該把它貼在哪裡直接前往？
      options:
        - 搜尋框
        - 新資料夾的命名欄
        - 右上方的篩選選單
        - 檔案總管的位址列
      answer: 3
      explain: 要抵達一個位置，用位址列。搜尋是用線索找項目，不會直接把你帶到指定層級。
practice:
  - id: fd-computer-01-p1
    title: 關掉視窗後再找回自己的資料夾
    kind: hands-on
    minutes: 8
    steps:
      - 用 Windows 鍵＋E 開檔案總管，在 C 槽建立或進入 dev，只在可寫的位置練習。
      - 在 dev 裡找到或建立 stackway-lab，再進去建立本模組的 desk 資料夾，核對完整位置。
      - 關閉視窗，從同一磁碟機走第二次，不用最近使用清單。
    checks:
      - 我能從上一層找到這次建立的資料夾。
      - 我能指出顯示位置的是位址列，而不是搜尋框。
---

## 為什麼要學
今天的成品不是程式，而是一個你明天還能找到的資料夾（folder）。往後寫好的程式、看到的錯誤紀錄、要給別人重跑的練習，都是放在某處的檔案。若只記得「昨天桌面上那個圖示」，換個開啟方式就容易迷路。這堂先練一件比較有用的事：即使最近使用清單是空的，你仍能從固定起點抵達目的地。

## 核心概念
檔案（file）可以裝一段文字或一張圖片；資料夾則替檔案和其他資料夾安排位置。想像兩個抽屜都放了叫「筆記」的本子。只給名字，別人不一定找得到；說出是哪個櫃子的哪個抽屜，就能分辨。電腦用路徑（path）記這串位置。Windows 路徑裡的反斜線把相鄰兩層分開，不是名稱的一部分。

用 **Windows 鍵＋E** 開啟檔案總管（File Explorer）。上方的位址列（address bar）回答「我在哪裡」，搜尋框（search box）回答「我要找誰」。點進位址列空白處，原本一格一格可點的資料夾名稱就會變成一串文字。先看，不必背。今天的練習放在 `C:\dev\stackway-lab\desk`。從磁碟機走過 `dev`、`stackway-lab`，最後一層 `desk` 才是本模組放筆記的位置。這個位置不在桌面或預設的雲端同步目錄裡，往後也方便輸入。

## 範例：建一個只有你這次練習會用的角落
先開啟檔案總管，點位址列，輸入 `C:\` 再按 Enter。在空白處按右鍵，選「新增 → 資料夾」，命名為 `dev`；如果已有這層資料夾，直接雙擊進入。在 `dev` 裡用同一種方法建立 `stackway-lab`，雙擊進去，再建立 `desk`。若已經存在，確認它是你這門課的工作區才沿用，不開啟或移動別人的檔案。若 C 槽不允許建立或目標不是你的，改在可寫的 D 槽按相同步驟建立 `D:\dev\stackway-lab\desk`；沒有可寫的指定位置就先觀察步驟，不要提升權限。

現在雙擊進入你建立的資料夾。想檢查完整位置，不用另寫任何檔案：從任一位置按 **Windows 鍵＋R**，在「執行」輸入下面一行。它只會開啟剛才建好的資料夾；路徑開頭要和剛建立的位置一致。

```text
explorer.exe "C:\dev\stackway-lab\desk"
```

現在到上一層，找到剛才的名字，再進去一次。這個來回動作比一張截圖更能證明你知道它在哪裡。

> [!TIP]
> 先遮住位址列，說出上一層的名字，再點一下位址列核對。下次即使看不到「最近使用」，也能沿著「磁碟機 → dev → stackway-lab → desk」走回來。

## 常見錯誤
如果畫面列出一堆「搜尋結果」，多半是把位置打進搜尋框。回到位址列，輸入 `C:\dev\stackway-lab\desk` 再按 Enter 即可。左邊導覽列的小箭頭只是展開一棵樹，不代表右邊已換資料夾；以右邊上方的位址列為準。關閉檔案總管只是關掉看東西的視窗，不會刪掉剛才的資料夾。若沒有 Windows 鍵，也可從開始功能表開啟檔案總管，再使用位址列。

## 小結
把視窗整個關掉，從同一起點再找到自己的練習資料夾。能說出它的上一層、能重新抵達它，就是這堂的完成條件。下一堂[〈純文字檔與副檔名〉](#/lesson/fd-computer-02-note)才讓裡面多出第一份檔案。
