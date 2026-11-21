---
id: ai-iac-03-identity
module: ai-iac
order: 3
title: 部署身分與最小權限
subtitle: 把部署權限縮到需求範圍
status: ready
minutes: 35
level: 3
prereqs:
  - ai-iac-02-plan
objectives:
  - 分開執行工作與部署工作的身分
  - 為模擬服務畫出最小存取範圍
tags:
  - iac
  - iam
resources:
  - title: "AWS IAM：暫時憑證與最小權限"
    url: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-iac-03-identity-separate
    prompt: "為什麼部署身分與執行身分要分開？"
    answer: "發布需要的修改權不應跟著長時間運作的服務，兩者職責與取得條件不同。"
    mcq:
      question: "一般推論服務僅須載入模型，應給哪種能力？"
      options:
        - "修改所有版本參照"
        - "讀取指定環境的模型參照"
        - "刪除任意歷史模型"
        - "直接接手部署角色"
      answer: 1
      explain: "提供推論不需要發布或清理權限。"
    interview:
      question: "部署因權限不足失敗，你會先開管理權嗎？"
      points:
        - "確認實際身分與目標環境"
        - "辨認必要動作"
        - "補一正一反驗證"
      answer: "我先查它是不是拿對身分、指到對的環境。若只是測試發布缺更新參照的權限，我只補那個動作；再確認它仍不能改正式環境，執行服務也不能發布。"
  - id: ai-iac-03-identity-negative
    prompt: "怎樣用反例驗證資源範圍？"
    answer: "保持身分和動作不變，只換成不該觸及的環境或資源並預期拒絕。"
    mcq:
      question: "要測部署不能越過測試環境，最有用的是？"
      options:
        - "再做一次測試環境更新"
        - "只測執行身分讀取測試參照"
        - "測部署刪除測試環境的歷史版本"
        - "同一部署身分更新正式參照應拒絕"
      answer: 3
      explain: "只改資源的反例才對準環境邊界。"
  - id: ai-iac-03-identity-temporary
    prompt: "短效憑證與最小權限限制的東西有何不同？"
    answer: "短效限制有效時間，最小權限限制可做動作及資源範圍，兩者不能互代。"
    mcq:
      question: "短效憑證若有過大權限，哪句正確？"
      options:
        - "短效就等同唯讀"
        - "只有長效憑證需要範圍控制"
        - "到期會自動復原所有變更"
        - "未到期前仍可造成超出任務的修改"
      answer: 3
      explain: "到期不會撤銷已執行的修改，權限範圍仍需限制。"
practice:
  - id: ai-iac-03-identity-p1
    title: "畫一份雙身分權限矩陣"
    kind: code
    minutes: 16
    steps:
      - "保存 role_check.py 與 4 列輸出"
      - "在 roles.md 畫出部署、執行對測試及正式參照的允許範圍"
      - "新增部署刪除歷史模型的案例並預測"
    checks:
      - "原始 4 列依序允許、拒絕、允許、拒絕"
      - "刪除案例被拒絕"
      - "紀錄分清本機需求矩陣與雲端生效政策"
---

## 為什麼要學：能讀模型，不代表能換模型

推論服務要載入模型才能回應使用者；部署流程則要把新版本放上去。如果兩邊共用同一個無所不能的身分，程式寫錯路徑時就可能改到不該改的版本。最小權限（least privilege）不是把所有權限都關掉，而是讓每個工作能完成自己的任務，又不能順手做掉另一個工作的事。先畫誰必須做什麼，再討論用哪一套雲端設定表達。

## 核心概念：分清身分、動作、資源和條件

身分（identity）回答「誰在做」，角色（role）可用來把一組權限交給符合信任條件的工作。部署身分只應在核准的發布流程中取得所需權限；執行身分則長時間代表提供服務的程式。即使兩者都屬於同一團隊，它們需要的資源和動詞也不同。身分驗證是確認是誰，授權才是決定這個身分能不能對那個資源執行這個動作。

例如將發布拆成「驗證完畢後更新測試環境的目前版本」，執行服務只需「讀取測試環境的目前版本」。這裡的目前版本是一個指向模型的參照，不是任意檔案櫃。部署工作也不必能刪除歷史模型，因為清理歷史不是這項任務。如果真實流程還要讀回結果做健康檢查，再為這個具體步驟補必要的讀取，不用為了方便開整個環境的寫入權。

## 範例：用本機矩陣驗證正例與反例

在 `C:\dev\stackway-lab` 新建 `role-lab`，存成 `role_check.py`，於該處執行 `py role_check.py`；macOS 或 Linux 用 `python3 role_check.py`。以下是任務需求的對照，不是可交給 AWS 的政策文件，也不需要任何憑證。

```python
allow = {("runtime", "read", "test/current"), ("release", "update", "test/current")}
cases = [("runtime", "read", "test/current"),
         ("runtime", "update", "test/current"),
         ("release", "update", "test/current"),
         ("release", "update", "prod/current")]
for row in cases:
    print(*row, "ALLOW" if row in allow else "DENY")
```

依序應為允許、拒絕、允許、拒絕。中間 2 列只換身分，最後 2 列只換環境，容易看出究竟是哪個條件造成差異。若只測發布成功，你其實不知道一般服務是不是也能覆寫模型；若只測拒絕，則不知道服務是否連自己的模型都不能讀。把應能做及應不能做的案例放在一起，才是可驗收的最小範圍。

### 權限還有時間邊界

部署不需要把長效金鑰放進程式碼。實務上使用工作身分及短效憑證（temporary credentials），讓核准流程在需要時取得，工作結束後憑證會到期。到期不能補救過大的權限，縮小資源範圍也不能替代身分驗證；這些保護作用在不同地方。離線矩陣只驗證設計意圖，無法證明雲端上實際的信任或政策已如此設定。

## 常見錯誤

遇到一次存取被拒就加上全域管理權，結果雖然任務成功，卻不再能分辨原本缺的是哪個動作。先確認身分是否正確、目標是否正確，再問這個操作是否真屬於工作職責。有時候應該修掉程式指向正式環境的路徑，不是核准它跨環境修改。

## 小結

把權限句寫成「哪個身分，在什麼條件下，可對哪個資源做什麼」，並為每個允許列配一個很像、但必須拒絕的反例。設計才不會只剩下漂亮的角色名稱。
