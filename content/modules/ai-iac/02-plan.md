---
id: ai-iac-02-plan
module: ai-iac
order: 2
title: Terraform 變更計畫
subtitle: 在建立前閱讀差異
status: ready
minutes: 30
level: 3
prereqs:
  - ai-iac-01-state
objectives:
  - 分辨新增、更新與替換
  - 標示可能遺失資料的變更供人審查
tags:
  - iac
  - plan
resources:
  - title: "HashiCorp：閱讀 Terraform 計畫與規劃模式"
    url: https://developer.hashicorp.com/terraform/cli/commands/plan
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-iac-02-plan-replacement
    prompt: "替換與就地更新最大的差別是什麼？"
    answer: "替換含舊物件退出與新物件建立，就地更新則針對原受管物件調整。"
    mcq:
      question: "哪個標記表示先建立後移除的替換？"
      options:
        - "~"
        - "+"
        - "+/-"
        - "-/+"
      answer: 2
      explain: "兩個複合符號都有移除，順序與風險不能顛倒。"
    interview:
      question: "摘要寫新增 1、刪除 1，你會核准嗎？"
      points:
        - "追到資源位址與動作"
        - "確認資料和下游影響"
        - "要求可還原證據與核准範圍"
      answer: "我先展開看是不是持久磁碟被替換，而不是直接依總數核准。如果是，我要看到隔離還原結果、寫入切換方式與要執行的環境；證據不足先暫緩。"
  - id: ai-iac-02-plan-unknown
    prompt: "套用後才知道的值應如何解讀？"
    answer: "目前不能確定的值，要追查依賴它的下游，不當作空值或保證不變。"
    mcq:
      question: "新磁碟識別碼未知，最值得先查？"
      options:
        - "哪些掛載或作業引用識別碼"
        - "把未知值直接填成 0"
        - "假設會和舊值相同"
        - "忽略所有下游"
      answer: 0
      explain: "未知影響依賴判斷，不是可任意填入的具體值。"
  - id: ai-iac-02-plan-approval
    prompt: "資料資源替換前，哪種證據比「有備份」更強？"
    answer: "驗證可還原的備份，加上寫入切換與新資料核對方式。"
    mcq:
      question: "換報表磁碟前哪件事最能支持復原？"
      options:
        - "在隔離位置試還原並核對內容"
        - "看到備份排程開關已啟用"
        - "把計畫另存一份"
        - "確認資源名稱相同"
      answer: 0
      explain: "排程與名稱不能證明內容能救回，計畫也不是資料備份。"
practice:
  - id: ai-iac-02-plan-p1
    title: "寫一份含人工關卡的計畫審查單"
    kind: explain
    minutes: 14
    steps:
      - "執行 review.py，在 plan-review.md 分出建立、更新、移除與替換"
      - "為磁碟和暫存各寫一個待確認的資料風險"
      - "將替換順序改成 +/-，重看哪些問題仍在"
    checks:
      - "先建後刪仍標示舊物件退出"
      - "磁碟列含可驗證的還原判準"
      - "沒有將計畫描述成已執行結果"
---

## 為什麼要學：新增一份，也可能代表原本那份要消失

變更摘要寫著要新增一個資源，你以為只是擴充服務，展開後才發現那是要替換保存報表的磁碟。變更計畫（plan）列的是工具預計如何從現況走到設定，不是已經施工的證明。閱讀的第一件事不是數綠色加號，而是找出「哪一個身分、資料或服務連續性可能消失」。

## 核心概念：先找位址，再看動作和屬性

Terraform 文字計畫常用 `+` 表示建立，`~` 表示就地更新，`-` 表示移除。替換（replacement）把舊物件換成另一個，可能呈現 `-/+` 先刪後建，或 `+/-` 先建後刪。兩種都有舊物件退出，先建不代表資料自動搬過去，也不保證完全不中斷。每項先看資源位址，再看是哪個屬性造成差異；只看摘要的新增與刪除總數，無法辨別是同一物件被替換還是兩個不相干的變更。

有些欄位寫「套用後才知道」，例如新物件的識別碼。未知不是空字串，也不等於舊值不變。要想的是哪些下游依賴它：掛載設定、讀取位置、備份策略會不會一起變？一個沒有包含刪除的就地更新也可能引起重新啟動，因此判準不是「有波浪號就安全」，而是服務承諾與資料生命週期會不會受影響。

## 範例：讀一張刻意縮小的審查單

在 `C:\dev\stackway-lab` 新建 `plan-lab` 並建立 `review.py`，用 `py review.py`；macOS 或 Linux 用 `python3 review.py`。這是手工摘錄的動作清單，不是官方計畫檔的格式，也不會建立或刪除任何資源。

```python
changes = [("+", "worker.preview", "new worker"),
           ("~", "service.batch", "replicas: 2 -> 3"),
           ("-/+", "disk.reports", "location: east -> west"),
           ("-", "cache.spare", "retired cache")]
for action, address, reason in changes:
    flag = "inspect removal" if "-" in action else "review impact"
    print(address, action, reason, flag, sep=" | ")
```

先圈出帶有移除動作的兩列。暫存是否可重建要有證據；名稱帶有 cache 並不能保證內容無人依賴。磁碟位置變更在這份合成案例被標記為必須替換，不是說所有提供者的同名屬性都一定如此。你的審查留言可以是：「暫緩磁碟替換。哪一份備份已驗證可還原？切換期間誰仍會寫入舊位置？誰核對新磁碟的報表筆數？」

### 計畫不是最後的許可

提案與實際執行之間若有人改了設定或現場資源，先前讀過的內容可能不再適用。核對目標環境、計畫來源和核准範圍，必要時重新產生計畫並重新審查。受保護的計畫檔也可能包含敏感值，不能因為它「只是預覽」就貼到公共頻道。本課停在離線閱讀，不需要雲端帳號或執行套用。

## 常見錯誤

把移除都視為不能做，會使團隊無法淘汰已安全遷移的資源；真正要阻止的是不清楚後果的移除。反過來，看到先建立就當作自動保留所有資料也很危險。請把備份、還原驗證、流量切換和人工核准分開寫，每項都要有人能指出驗收證據。

## 小結

對每一列問：誰被改、就地還是換新、資料會去哪、下游怎麼接手。能回答這幾題，才有依據決定同意、要求補證據，或暫緩執行。
