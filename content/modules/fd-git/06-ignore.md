---
id: fd-git-06-ignore
module: fd-git
order: 6
title: Git 忽略規則
subtitle: 報表要留下，暫存檔不用
status: ready
minutes: 25
level: 2
prereqs:
  - fd-git-05-history
objectives:
  - 建立 .gitignore 排除練習產物
  - 辨認忽略規則不會停止追蹤已提交的檔案
tags:
  - git
  - ignore
resources:
  - title: Git：忽略規則
    url: https://git-scm.com/docs/gitignore
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-06-tracked
    prompt: "忽略規則會讓已追蹤的 pace.txt 停止被管理嗎？"
    answer: "不會；這類規則主要篩選未追蹤路徑。"
    mcq:
      question: "為已追蹤檔新增模式再改內容，會怎樣？"
      options:
        - "會從所有提交消失"
        - "會留在磁碟但不再顯示修改"
        - "仍會列出它的修改"
        - "要移除模式後才能讀取它的歷史"
      answer: 2
      explain: "規則不會改寫索引或抹除歷史。"
    interview:
      question: "你怎麼驗收一份新加入的忽略規則？"
      points:
        - "用應排除的實際檔案驗證"
        - "檢查命中的規則與來源"
        - "用應保留的對照案例查範圍"
      answer: "我會建一份真預覽，用 check-ignore 找出命中哪一行，再確認正式檔的修改還看得到。狀態變短不一定是好事，也可能是範圍寫太寬。"
  - id: fd-git-06-pattern
    prompt: "庫根 .gitignore 的 /scratch/ 限定了什麼？"
    answer: "限定此規則檔所在層的 scratch 目錄。"
    mcq:
      question: "在庫根的 .gitignore 寫 /scratch/，這個模式限定哪個範圍？"
      options:
        - "每一層的 scratch 目錄"
        - "根部的 scratch 目錄"
        - "根部只要叫 scratch 的一般檔案"
        - "所有名字含 scratch 的路徑"
      answer: 1
      explain: "首尾斜線分別限定位置與目錄類型。"
  - id: fd-git-06-trace
    prompt: "想找出未追蹤檔被哪一行規則忽略，用什麼？"
    answer: "用 git check-ignore -v 加上該路徑。"
    mcq:
      question: "預覽檔從狀態清單消失。哪個指令加上檔案路徑後，能查出命中的忽略規則與行號？"
      options:
        - "git check-ignore -v"
        - "git status --short"
        - "git diff --cached"
        - "git ls-files"
      answer: 0
      explain: "狀態不列出某檔並不能告訴你命中哪條規則。"
practice:
  - id: fd-git-06-p1
    title: "提交經過正反例檢查的忽略清單"
    kind: hands-on
    minutes: 12
    steps:
      - "在來源庫建立規則和兩份預覽檔。"
      - "用詳細查詢及已追蹤檔的差異做對照。"
      - "復原實驗行與分鐘值，只選並提交 .gitignore。"
    checks:
      - "兩份預覽都能指認命中模式。"
      - "預覽仍可從磁碟開啟。"
      - "最後提交的規則沒有 /pace.txt。"
---

## 為什麼要學

整理路線資料時，交接的人需要規則檔，卻不需要你反覆算出的預覽紀錄。每次看到一排未追蹤檔，都靠自己記得「千萬別選錯」並不可靠。忽略規則（ignore rule）可以把這項決定寫成文字，讓下一個取得專案的人也得到相同的預設選檔環境。這堂的產物是一份有正反例可驗收的小規則，而不是一張越長越好的封鎖清單。

## 核心概念

`.gitignore` 是一個文字檔，檔名開頭有點，結尾沒有副檔名。每行是一個路徑比對模式（pattern），不是終端機指令。在庫的根目錄寫 `/scratch/`，開頭斜線把位置限定在這層，結尾斜線表示目錄；寫 `*.tmp` 則是讓這一層以下符合該副檔名的未追蹤檔被忽略。依用途選規則：如果只有一個目錄放自動產物，就不必忽略整個專案所有文字檔。

「未追蹤」是關鍵。Git 已經管理的檔案，不會因為今天新增一行規則就從歷史消失。這反而是好事：已經決定保存的報表，不會因為檔名碰巧符合某人的預覽規則就無聲退出。忽略也不是保密或備份機制，檔案仍然在磁碟上；歷史若已經收過敏感內容，更不能用一行模式當作補救。

## 範例：讓預覽安靜，留下正式規則

在 `C:\dev\stackway-lab\trail-notes` 用編輯器新增 `.gitignore`，內容是下面三行。第三行刻意拿前一堂已提交的檔案當實驗，而不是推薦把正式規則排除。

```text
/scratch/
*.tmp
/pace.txt
```

在庫裡新增 `scratch` 資料夾與其中的 `preview.txt`，再於庫根新增 `sample.tmp`。兩個檔案都寫一行 `preview` 即可。把受追蹤的 `pace.txt` 改為 `minutes=21` 並儲存。於庫根跑下面指令；bash 也用相同寫法。

```powershell
git status --short
git check-ignore -v -- scratch/preview.txt sample.tmp
git diff -- pace.txt
```

如果只看狀態找不到預覽檔，你還不知道它是真的被忽略，還是根本沒建好。先在編輯器確認檔案存在，再看 `check-ignore -v` 顯示的規則檔、行號、模式與路徑。正式分鐘數的差異依然可見，證明新的模式沒讓受追蹤檔案脫離管理。最後把分鐘改回 20，從規則檔移除實驗用第三行，僅選入並提交 `.gitignore`。前面練習留下的 `rough.txt` 仍可見，這是有意保留的對照。

> [!TIP]
> 規則檔本身也要進入提交，否則下一個副本沒有這份共識，預覽檔又會重新擠滿狀態清單。

## 常見錯誤

Windows 有時隱藏已知副檔名；若規則完全無效，先顯示副檔名，確認不是 `.gitignore.txt`。另一個誤判是把忽略成功當成刪除成功；用檔案總管打開預覽，它的內容應還在。遇到不該消失的項目，先追查是哪一條模式命中，再縮小範圍，別以強制選入來掩蓋過寬的預設規則。

## 小結

你留下的是共用的取捨：原始規則與正式資料能追蹤，可重建的暫存產物預設不列入。確認至少一個該忽略與一個該保留的例子，比只看終端機安靜更有說服力。
