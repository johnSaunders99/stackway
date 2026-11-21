---
id: cr-portfolio-01-reader
module: cr-portfolio
order: 1
title: 作品 README 結構
subtitle: 從審查者的第一分鐘開始
status: ready
minutes: 25
level: 4
prereqs: []
objectives:
  - 把用途與啟動方法放在 README 開頭
  - 為沒有帳號的讀者設計示範資料
tags:
  - portfolio
  - readme
resources:
  - title: "GitHub Docs：README 與相對路徑"
    url: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-portfolio-01-reader-entry
    prompt: "README 的第一屏應回答什麼？"
    answer: "誰遇到什麼問題、怎麼跑出第一個結果，以及成功時會看到什麼。"
    mcq:
      question: "交班工具的第一句最適合放什麼？"
      options:
        - "列出所有相依套件名稱"
        - "讓接班者從清單找出未完成事項"
        - "列出每次修訂日期"
        - "解釋檔案為何這樣命名"
      answer: 1
      explain: "其餘資訊可往後放；先讓讀者辨認用途。"
    interview:
      question: "不給測試帳號，怎麼讓我在 1 分鐘內判斷你的工具能不能用？"
      points:
        - "指出讀者的任務"
        - "提供不含個資的正反例"
        - "說出最短步驟與預期輸出"
      answer: "我會先給你兩筆虛構交班事項和一行指令。印出未完成的那筆才算通過；這只驗證篩選，不代表我測過登入。"
  - id: cr-portfolio-01-reader-fixture
    prompt: "用哪種示範資料能看出篩選有效？"
    answer: "混合應被保留和應被排除的合成項目。"
    mcq:
      question: "哪組資料最能驗收未完成事項篩選？"
      options:
        - "未完成的 10 筆"
        - "已完成與未完成各 1 筆"
        - "空白清單"
        - "同一筆未完成事項重複兩次"
      answer: 1
      explain: "全是未完成就算原樣輸出也會通過；混合資料可檢查正反例。"
  - id: cr-portfolio-01-reader-result
    prompt: "如何把「執行成功」改成可核對的敘述？"
    answer: "明列可觀察輸出與不該出現的結果。"
    mcq:
      question: "哪句最能幫讀者確認這次執行正確？"
      options:
        - "只印出 inspect，不含 restock"
        - "指令已經結束"
        - "畫面看起來正常"
        - "電腦已安裝 Python"
      answer: 0
      explain: "環境就緒和程式結束都不能證明篩選規則正確。"
practice:
  - id: cr-portfolio-01-reader-p1
    title: "寫一份可離線驗收的 README"
    kind: build
    minutes: 12
    steps:
      - "在新資料夾儲存並執行範例"
      - "寫 README.md，含用途、環境、指令及預期項目"
      - "遮住程式碼，只按說明重跑"
    checks:
      - "README 沒有要求帳號或金鑰"
      - "我能對到 1 筆保留與 1 筆排除的資料"
---

## 為什麼要學：讀者的第 1 分鐘

審查者打開一個叫「交班簿」的作品，首頁滿是套件徽章，卻看不出來是誰要交班、交的是什麼。問題不在於少了一張漂亮封面，而是讀者沒有理由繼續往下看。專案說明檔（README）是作品的入口：先讓人判斷「這是不是我在找的工具」，再讓人親手確認你說的是真的。

## 核心概念：用途、入口、成功畫面

把開頭寫成一個具體動作：「值班者貼入待辦清單，工具會列出還沒完成的項目，方便下一班接手。」這比「提升團隊協作效率」有用，因為你已經交代使用者、輸入及輸出。接著只教最短的成功路徑：在哪個資料夾、需要什麼環境、執行哪個檔案、第一眼會看到什麼。架構與效能可以往下放，不能擋住入口。

示範資料（fixture）是你為了重現特定情況而刻意編的小樣本，不是從正式環境抽出來的紀錄。例子至少要有一筆會被留下、一筆會被濾掉，否則讀者分不出篩選真的有效，還是工具原樣印出全部內容。把示範和正式登入分開；如果作品的核心就是驗證身分，要說清楚離線版本僅示範哪一段，不假裝驗過完整流程。

## 範例：先造出 README 能承諾的小結果

在 `C:\dev\stackway-lab` 新建 `handover-demo` 資料夾，用編輯器把下列內容存成裡面的 `open_items.py`。在該資料夾開 PowerShell，執行 `py open_items.py`；在 macOS 或 Linux 的終端機則用 `python3 open_items.py`。不用額外安裝套件。

```python
items = [("restock", True), ("inspect", False)]
for title, done in items:
    if not done:
        print(title)
```

現在寫給第一次來的人：「這是讓下一班看到未完成事項的離線範例。需要 Python 3。在含有程式的資料夾執行指令後，只會看到 inspect；已完成的 restock 不會列出。」把指令獨立放一行。刻意把第二筆改成已完成再跑一次，這回畫面應該沒有項目。空輸出在這個情境是成功，不是壞掉；寫清楚這點，比貼整張終端機截圖更能消除疑問。

### 換一雙眼睛讀第一屏

先不看程式，照說明想像手邊只有一份剛解開的作品。若指令要求先進入某個目錄，說明裡應該能找到辨認它的檔名；若第一步叫人申請帳號，問自己不登入是否也能看出工具做了什麼。需要放圖片時使用作品內的相對路徑，讓資料夾搬家後仍然看得到。完整設計理由可以另闢一節，之後在[〈設計決策與取捨〉](#/lesson/cr-portfolio-02-scope)會細講。

## 常見錯誤

「安裝後正常啟動」不是成功判準：啟動可能只代表程式沒有立刻退出。「我這裡可以跑」也沒告訴讀者你從哪裡開始。別把電腦上的絕對路徑、測試帳號或真實交班資料貼上去。若示範裡的資料是虛構的，就直接標明；讀者評估的是你會不會設計可驗證的例子，不是名單有多逼真。

## 小結

把工具交給陌生人之前，先問一句：不用問你，對方能不能指出哪一筆應該出現、哪一筆不該出現？把這兩個答案連同最短指令留在首頁，作品就有了可以驗收的入口。
