---
id: ai-mlops-03-pipeline
module: ai-mlops
order: 3
title: 模型訓練管線
subtitle: 失敗的訓練要從哪一站重來
status: ready
minutes: 35
level: 3
prereqs:
  - ai-mlops-02-registry
objectives:
  - 把資料驗證、訓練與評估建成相依圖
  - 訂定每站可重試但不重複發布的規則
tags:
  - mlops
  - pipeline
resources:
  - title: "Kubeflow Pipelines：執行快取的條件"
    url: https://www.kubeflow.org/docs/components/pipelines/user-guides/core-functions/caching/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-mlops-03-pipeline-edge
    prompt: "管線相依圖上的箭頭代表什麼？"
    answer: "下一站消費上一站指定且完整的產物，而非單純排在後面。"
    mcq:
      question: "評估啟動前最該驗哪項？"
      options:
        - "指定模型已完成、可載入且驗證集已就緒"
        - "訓練資料夾已存在"
        - "訓練程序已啟動且暫時未報錯"
        - "模型檔名看起來正確"
      answer: 0
      explain: "順序、目錄及檔名都不能保證可用產物。"
    interview:
      question: "訓練成功、評估失敗，如何恢復又不多發一個版本？"
      points:
        - "驗證模型完整及訓練依賴"
        - "只重做失敗評估"
        - "登錄以穩定鍵防重"
      answer: "我先對來源和完成標記，模型可載入才從評估重跑。報告過關後查候選鍵，讓登錄端以唯一條件寫入；我不依賴執行程序裡的一個變數阻止雙重發布。"
  - id: ai-mlops-03-pipeline-reuse
    prompt: "評估暫時失敗，什麼情況可以不重訓？"
    answer: "模型完整，訓練依賴、設定與環境仍相容，只重試相關評估。"
    mcq:
      question: "只修正評估程式且原模型可載入，合理起點是？"
      options:
        - "沿用舊失敗報告直接登錄"
        - "重跑評估產生新報告"
        - "重新收集所有訓練資料"
        - "重新訓練才准看評估"
      answer: 1
      explain: "改的是評估依賴，模型本身沒有因此失效。"
  - id: ai-mlops-03-pipeline-dedup
    prompt: "快取訓練結果能否保證登錄不重複？"
    answer: "不能，外部登錄有副作用，需要持久的唯一鍵與一致性控制。"
    mcq:
      question: "兩個工作同時發布同一候選，最可靠的防重位置是？"
      options:
        - "每個程序自己的集合"
        - "兩個不同的隨機名稱"
        - "登錄端的持久唯一條件與原子寫入"
        - "在登錄後才查看畫面"
      answer: 2
      explain: "本機集合無法跨程序協調，事後查看不能阻止雙重寫入。"
practice:
  - id: ai-mlops-03-pipeline-p1
    title: "畫出失敗重跑的相依圖"
    kind: code
    minutes: 16
    steps:
      - "保存 resume.py 及原始 3 次呼叫的輸出"
      - "新增第四次用 data-b 成功執行"
      - "在 pipeline.md 畫箭頭並標示輸入、可重用產物與登錄鍵"
    checks:
      - "前 3 次只有 1 次 train 和 1 次 register"
      - "換資料後有新的 train"
      - "說明重開程序會失去哪項保證"
---

## 為什麼要學：評估壞了，非得再訓練一晚嗎？

模型已訓練完成，評估報告卻因缺一欄而失敗。如果整條流程只是一個從頭跑到尾的按鈕，你得付出整晚算力，還可能再次登錄同一個產物。訓練管線（training pipeline）把每一站的輸入、輸出與成功條件拆開，讓下一站用的是「已完成而可核對」的結果，不是恰好出現在資料夾裡的檔案。

## 核心概念：先畫箭頭，再決定從哪裡重來

最小相依圖是「資料驗證 → 訓練 → 評估 → 核准後登錄」。箭頭表示後一站需要前一站的產物，不只是執行時間排在後面。資料驗證輸出可接受的快照識別；訓練讀取那份快照和設定，寫模型；評估讀模型與固定驗證集，寫含判準的報告。只有報告通過才提請登錄，且還要確認同一候選是否已登記。資料損壞是輸入問題，重試同一份壞資料不會自行復原。

快取（cache）是依條件重用已完成的輸出。相依站的輸入版本、參數、程式或環境改變時，可能要重算，不能只靠檔名相同就跳過。也不要以「檔案存在」當作成功：一半寫完的模型同樣有檔名。較可靠的交接是先寫到暫存位置，完整性檢查通過才發布完成標記，下游只讀帶標記且可載入的結果。

## 範例：切開計算與發布副作用

在 `C:\dev\stackway-lab` 新建 `pipeline-lab`，將以下存成 `resume.py` 後執行 `py resume.py`；macOS 或 Linux 用 `python3 resume.py`。用記憶體模擬同一工作內的重試，觀察哪一站真的被做了 2 次。

```python
trained, registered = {}, set()
def run(data_id, eval_ok):
    key = (data_id, "trainer-v1", "cfg-a")
    if key not in trained:
        print("train", data_id)
        trained[key] = "model:" + "/".join(key)
    if not eval_ok:
        print("evaluation failed")
        return
    release = trained[key]
    if release not in registered:
        registered.add(release)
        print("register", release)
    else:
        print("already registered")

run("data-a", False)
run("data-a", True)
run("data-a", True)
```

第一次留下模型但評估失敗，第二次重用模型並登錄，第三次遇到同一登錄鍵就回報已登錄。這裡把資料視為已驗證，並固定訓練程式和設定；布林值是手動注入的評估成敗，不是實際模型分數。換資料代號再跑第四次，就應重新訓練。若只改評估程式，則需重做報告，不應無故重訓；登錄還要依你的政策判斷是更新證據，還是真的需要新模型版本。

### 跨程序後還剩下什麼保證？

範例退出後字典和集合就消失，不能宣稱能保證重開機後不重複發布。正式管線要用持久化的產物紀錄，登錄端也必須以唯一鍵及不可分割的寫入防止兩個工作同時通過檢查。已經造成外部副作用的步驟，不要像純計算站一樣按整站重跑；先依鍵查詢既有結果，確定沒完成才補做。

## 常見錯誤

看到上游有變動就全跑，看似保險卻浪費算力；反過來，看到昨天的模型檔就直接評估，也可能混入過期輸入。沿著箭頭找出改變的依賴，只保留與新條件相容且完整的產物。失敗報告最好寫出哪站、哪個輸入、留下什麼可用結果，接班者才敢從正確的站重來。

## 小結

能省掉重算，是因為你知道輸入沒變且產物完整；能避免重複發布，則是因為發布有穩定身分和防重機制。這是兩個需要分別驗證的承諾。
