---
id: cr-portfolio-03-evidence
module: cr-portfolio
order: 3
title: 履歷成果與證據
subtitle: 把成果寫成可核對的履歷句
status: ready
minutes: 30
level: 4
prereqs:
  - cr-portfolio-02-scope
objectives:
  - 把形容詞換成條件、動作與結果
  - 標示量測範圍而不放大影響
tags:
  - portfolio
  - resume
resources:
  - title: "UC San Diego Career Center：履歷中的成果敘述"
    url: https://career.ucsd.edu/resources/guides/resume.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-portfolio-03-evidence-baseline
    prompt: "要用什麼當作改動前後的基準？"
    answer: "兩個版本都執行同一批輸入，使用相同判準，比較原始結果。"
    mcq:
      question: "哪種比較能支持本機測例改善？"
      options:
        - "舊版只測重複，新版只測空白"
        - "新版只看列數不比順序"
        - "比較兩位使用者的主觀印象"
        - "兩版使用相同的 3 個測例和預期清單"
      answer: 3
      explain: "改變輸入或通過條件，就無法把差異歸給這次改動。"
    interview:
      question: "你說改善資料品質，怎麼證明，又有哪些沒證明？"
      points:
        - "交代原本失敗案例"
        - "同條件比較兩版"
        - "限定為本機樣本"
      answer: "同一批 3 個案例，舊版照抄所以重複案例失敗，新版保留首次順序後全過。腳本裡能看到輸入和預期清單；我沒量過這會省下多少現場工時。"
  - id: cr-portfolio-03-evidence-scope
    prompt: "本機測例全過能主張到什麼程度？"
    answer: "它支持在指定條件、這組案例中符合預期，不代表正式環境表現。"
    mcq:
      question: "3 個本機測例全過，哪句合適？"
      options:
        - "所有輸入皆正確"
        - "客訴率降低到 0"
        - "正式資料從未重複"
        - "通過列出的 3 個本機案例"
      answer: 3
      explain: "測例不是所有可能輸入，也沒有量測客訴或正式環境。"
  - id: cr-portfolio-03-evidence-ownership
    prompt: "履歷怎麼交代個人貢獻？"
    answer: "用具體動詞指出自己修改的規則或產物，連到可核對的結果。"
    mcq:
      question: "哪句最能看出個人貢獻？"
      options:
        - "參與團隊的重要專案"
        - "善用現代科技提升品質"
        - "為交班代號實作保序去重並補上重複案例"
        - "團隊完成大型系統"
      answer: 2
      explain: "「實作保序去重」界定了個人負責的規則，測例則可核對成果；團隊成績本身看不出分工。"
practice:
  - id: cr-portfolio-03-evidence-p1
    title: "留下成果句及它的原始證據"
    kind: build
    minutes: 14
    steps:
      - "執行 cases.py，把兩版輸出存進 evidence.md"
      - "新增一組相鄰重複的案例，兩版重跑"
      - "分別寫一條改動結果與一句適用限制"
    checks:
      - "同一組案例的兩版分母相同"
      - "成果句可對回一個檔案和一個失敗案例"
      - "沒有把測例數換成使用者人數"
---

## 為什麼要學：數字旁邊少了什麼？

「將處理速度提升 1 倍」聽起來醒目，面試官接著問：「原本多久？哪一批資料？還是同一台機器嗎？」如果回答不出來，數字反而遮住了你真正做好的事。履歷成果句（accomplishment statement）不必寫得像廣告；它要讓人從一句話找到可核對的動作、條件和結果，知道這是你完成的哪一部分。

## 核心概念：先有證據，再壓成一句

先寫一張證據卡（evidence card）。左邊是輸入、環境和基準（baseline），也就是改動前要拿來比較的狀態。中間寫你真正做的改動；右邊寫產物、結果及侷限。若目標是正確性，可以數出測例通過幾個；若要談速度，就要量同一件工作花多久。通過測例數不能換算成使用者節省的時間，程式跑得快也不保證結果正確。

假設工具彙整交班事件，同一工作代號可能出現多次。需求是每個代號只保留首次出現的順序，而非把所有代號依字母排序。你把簡單的逐行照抄改成保序去重。這項改動的證據可以很小：保留輸入、預期清單、舊輸出、新輸出，就能在面試現場重跑。沒有正式使用者，就別把省下的輸出列數描述成減少客訴。

## 範例：建立有分母的正確性證據

在 `C:\dev\stackway-lab` 新資料夾 `evidence-demo` 把以下存為 `cases.py`，執行 `py cases.py`；macOS 或 Linux 用 `python3 cases.py`。測例包含重複、空清單，以及容易被排序弄錯的次序。

```python
cases = [(["b", "a", "b"], ["b", "a"]), ([], []), (["z"], ["z"])]
for name, run in [("before", list), ("after", lambda xs: list(dict.fromkeys(xs)))]:
    results = [run(xs) == want for xs, want in cases]
    print(name, results, sum(results), "/", len(results))
```

舊版是照抄，因此通過空清單和單筆案例，但重複案例失敗；新版在這組資料通過全部。現在你可以寫：「針對交班代號重複，實作保序去重；同一組 3 個本機測例由 2 個通過變為 3 個，附可重跑腳本。」這比「大幅改善資料品質」短不了多少，卻讓人知道從哪個失敗行為追問，也讓你不必猜正式環境的情況。

### 把範圍放回數字旁邊

假如之後增加第四個測例，證據卡要註記是另一組測試。不要拿舊版的 2 除以 3 和新版的 4 除以 4 直接說成同一組的改善。要比較，就讓兩版都跑過新資料，保存整組結果。若找不到舊版，寫「涵蓋哪些邊界案例」仍然有價值，沒有基準時不需要硬湊提升百分比。

## 常見錯誤

用真實客戶檔案來「增加說服力」反而造成不必要的揭露；合成資料若能穩定重現問題就足夠。也不要把團隊整個產品的成果掛到個人名下。請把「我們做了系統」縮成「我補上保序規則及重複案例測試」，再指出哪份檔案可以看到。誠實不是把句子寫弱，而是讓每個動詞都有落點。

## 小結

先問「別人能用什麼反駁這句話」。說得出輸入、原本結果、現在結果和適用範圍，就有一條能被追問、也能被驗收的履歷成果。
