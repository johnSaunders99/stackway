---
id: ai-mlops-01-lineage
module: ai-mlops
order: 1
title: 資料與模型來源追蹤
subtitle: 回答這個模型從哪裡來
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 為一次執行保留輸入、設定與產物識別
  - 重跑時比對哪些條件真的相同
tags:
  - mlops
  - lineage
resources:
  - title: "MLflow Tracking：執行、參數與產物"
    url: https://mlflow.org/docs/latest/ml/tracking/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-mlops-01-lineage-event
    prompt: "執行識別碼與模型內容摘要有何不同？"
    answer: "前者指向一次事件，後者辨識產物的位元組；不同執行可以產出相同模型。"
    mcq:
      question: "原樣跑兩次，哪個值應不同？"
      options:
        - "相同資料的摘要"
        - "相同模型的摘要"
        - "此次執行代號"
        - "相同參數值"
      answer: 2
      explain: "識別碼區分兩次執行，不是在量資料或模型差異。"
    interview:
      question: "昨天的模型比今天好，你從哪裡開始比？"
      points:
        - "定位兩個產物及來源執行"
        - "核對資料切分、程式和參數"
        - "區分相同指標與相同內容"
      answer: "我會從兩個模型找到各自的執行收據，比資料快照、切分、程式、環境和參數。即使都叫 best，或平均分相同，也不能當成同一個檔案。先固定變因再重跑。"
  - id: ai-mlops-01-lineage-recover
    prompt: "只有資料摘要為什麼不足以重跑？"
    answer: "摘要可核對取回的檔案，不能由摘要重建輸入，仍需可取得的版本。"
    mcq:
      question: "資料位置已消失，只留摘要，還缺什麼？"
      options:
        - "同一摘要的另一種文字編碼"
        - "新模型在相同測例的分數"
        - "可取回的原資料快照及適當讀取權限"
        - "一份只含原始欄位名稱的清單"
      answer: 2
      explain: "摘要是核對依據，不是資料副本。"
  - id: ai-mlops-01-lineage-split
    prompt: "為何除了資料集版本還要記錄切分？"
    answer: "同一份資料可用不同列訓練與驗證，會改變學到的結果及評估條件。"
    mcq:
      question: "兩次來源檔相同但驗證列不同，可直接比較分數嗎？"
      options:
        - "只要檔名相同就可以"
        - "只看哪次較晚"
        - "不能視為同條件，要先核對切分"
        - "只比模型大小"
      answer: 2
      explain: "分數受驗證題目影響，同一來源並不保證同一評估集。"
practice:
  - id: ai-mlops-01-lineage-p1
    title: "保存三份模型來源收據"
    kind: code
    minutes: 14
    steps:
      - "跑 receipt.py 兩次，將輸出另存 run-a.json、run-b.json"
      - "把 6 改成 9，另存 run-c.json"
      - "寫下三組代號、門檻與哪些摘要改變"
    checks:
      - "前兩次執行代號不同而模型摘要相同"
      - "第三次門檻由 4 變 5"
      - "能解釋本例為何資料及程式摘要一起變動"
---

## 為什麼要學：「昨天那個好模型」是哪個？

同一支訓練程式，昨天給出的分數比今天高。你把昨天的模型取名 best，今天又把另一個檔案取了同樣的名字。就算現在能下載檔案，也答不出它看過哪一批資料。來源追蹤（lineage）是替模型保留一條可以反查的路：從交付的產物找到產生它的那次執行，再找回當時的輸入、程式、參數和環境。

## 核心概念：一次執行需要自己的收據

每次執行（run）要有不同的識別碼，即使兩次輸入完全相同；識別碼辨認一次事件，不保證結果一定不同。資料不能只記容易被覆寫的路徑，應保留可取回的快照、版本或內容摘要。程式版本要能定位實際執行的內容，參數要包含會影響結果的預設值。若做了資料切分，除了原資料還要知道哪些列被分到訓練或驗證，否則評分條件已經改變。

產物（artifact）是執行留下的檔案，例如模型權重、前處理設定和驗證報告。雜湊（hash）可用來辨識位元組是否一致，但一串摘要不能還原原始檔，也不證明模型有用。要同時保留產物所在位置及讀取權限，避免半年後帳上只剩一串完全無法取回的代號。紀錄不該包含原始個資或憑證；指到受保護資料版本即可。

## 範例：替一個只有門檻的模型留下收據

在 `C:\dev\stackway-lab` 新建 `lineage-lab`，將下列存成 `receipt.py` 後執行 `py receipt.py`；macOS 或 Linux 用 `python3 receipt.py`。這個玩具模型以樣本平均值當門檻，足以觀察「改輸入，產物怎麼變」而不需要安裝機器學習套件。

```python
import hashlib, json, platform, uuid
from pathlib import Path
pack = lambda x: json.dumps(x, sort_keys=True).encode()
digest = lambda b: hashlib.sha256(b).hexdigest()
data = [2, 4, 6]
config = {"offset": 0}
model = {"cutoff": sum(data) / len(data) + config["offset"]}
receipt = {"run": uuid.uuid4().hex, "data": data, "config": config,
           "data_sha": digest(pack(data)), "code_sha": digest(Path(__file__).read_bytes()),
           "python": platform.python_version(), "model": model, "model_sha": digest(pack(model))}
print(json.dumps(receipt, indent=2))
```

保存兩次原樣執行的輸出。執行代號不同，資料摘要與模型摘要應相同，門檻都是 4。把樣本最後一筆從 6 改成 9 再跑，門檻變 5。因為這個小例子把資料直接寫在程式裡，程式摘要也跟著變了；在真實專案應讓資料快照和程式版本獨立，才能更容易分辨是誰造成差異。

### 如果 2 份收據的數字看起來一樣

換一組剛好平均也是 4 的資料，模型門檻可以沒變，資料來源卻不同。不要從同一項指標或同一個檔名推論整條來源鏈一致。反過來，即使記下相同亂數種子，執行環境、平行運算或硬體仍可能使結果不完全相同。追蹤資訊的價值是協助縮小差異，而不是保證任意平台都能位元級重現。

## 常見錯誤

只保存評分圖，不存輸入版本與產物；或把「資料夾叫 final」當成不可變版本。要驗收收據，可從產物反問：「是哪次執行寫出來？輸入還取得到嗎？我能分別核對資料與程式嗎？」有一題答不出來，就先補那段連結，不用先搭整套追蹤平台。

## 小結

執行代號定位事件，內容摘要比較檔案，版本與保存位置讓人取回材料。三者回答不同的問題；把它們接起來，之後在[〈實驗追蹤與模型登錄〉](#/lesson/ai-mlops-02-registry)才有可信的候選來源。
