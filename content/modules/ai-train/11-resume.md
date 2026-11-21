---
id: ai-train-04-resume
module: ai-train
order: 11
title: 分散式訓練續跑
subtitle: 中斷後能否接著同一步走
status: ready
minutes: 35
level: 3
prereqs:
  - ai-train-03-fsdp
objectives:
  - 列出權重以外要保留的訓練狀態
  - 從小型 CPU 工作驗證續跑步數
tags:
  - train
  - recovery
resources:
  - title: PyTorch：一般訓練檢查點的內容
    url: https://docs.pytorch.org/tutorials/beginner/saving_loading_models.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: PyTorch：非同步檢查點與完成通知
    url: https://docs.pytorch.org/tutorials/recipes/distributed_async_checkpoint_recipe.html
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-04-resume-next
    prompt: 完成 3 步、游標為 3，0 起算時下一筆是哪個？
    answer: 索引 3 的第四筆資料。
    mcq:
      options:
        - 索引 2 的第三筆資料
        - 從索引 0 重建同樣的動量
        - 索引 4 的第五筆資料
        - 索引 3 的第四筆資料
      answer: 3
      explain: 游標指向未處理的下一筆，已完成步數不是要重做的步驟。
  - id: ai-train-04-resume-motion
    prompt: 為何用動量法訓練不能只還原權重？
    answer: 後續更新還依賴累積的動量。
    mcq:
      options:
        - 後續更新還依賴累積的動量
        - 否則資料游標會自動歸零
        - 相同權重與學習率永遠能推出舊動量
        - 用最後一次損失值即可唯一決定下一個動量
      answer: 0
      explain: 即使下一筆相同，歷史狀態缺失也會改變更新。
  - id: ai-train-04-resume-proof
    prompt: 哪個驗收比「成功載入」更能證明可續跑？
    answer: 對照不中斷路徑的後續輸入、步數與結果。
    mcq:
      options:
        - 只確認每份分片的檔名對得上
        - 對照不中斷路徑的後續輸入、步數與結果
        - 只確認載入時權重形狀相同
        - 只看還原當下的完成步數相同
      answer: 1
      explain: 要再更新才能觀察資料游標或最佳化器狀態是否接錯。
    interview:
      question: 多順位的檢查點都寫完了，你怎麼驗證故障後不會重讀一批？
      points:
        - 使用同一步的完整分片
        - 記每順位資料狀態
        - 比還原後第一步與連跑
      answer: 我會固定小資料集，讓基線連跑，另一組在更新邊界存檔。還原後先核對各順位下一批的樣本編號，再比一步更新和最後步數；不只確認檔案存在。
  - id: ai-train-04-resume-boundary
    prompt: 有梯度累積時，為什麼適合挑更新完成的邊界存檔？
    answer: 該步要累積的梯度已用於更新，較容易描述下一步。若中途存，就還得保存已累積的梯度、批次進度等狀態。
practice:
  - id: ai-train-04-resume-p1
    title: 做一次中斷再續跑的 CPU 對照
    minutes: 13
    kind: code
    steps:
      - 保存腳本和第一次輸出
      - 另存副本，在載入後將動量設為 0，比較哪個檢查抓到差異
    checks:
      - 正常時下一個目標是 8、完成步數 6 且相等
      - 只清動量後步數仍相同但結果不等，斷言能抓到
---
## 為什麼要學：載入成功，不等於接著同一步走
訓練在第三步停電，隔天載回權重，畫面顯示「繼續」。若資料從頭讀、動量歸零，雖然程式沒有錯誤，這條訓練軌跡已經換了。續跑（resume）的驗收不只是某個檔案打得開，而是中斷前後的下一筆輸入、更新次數和狀態能銜接。今天用真的 CPU 更新做一次中斷對照。

## 核心概念：在更新邊界留下可重建狀態
每次完成最佳化器更新後，把當前模型、最佳化器狀態及「已完成幾步」當成一組。若還有學習率排程、混合精度縮放、打亂樣本、隨機增強或梯度累積，也要保存對應狀態，或選一個不需要保存部分累積的邊界。資料的輪次、下一筆位置和隨機數狀態通常不能只靠權重倒推出來。

分散式訓練還有各順位獨有的分片、資料游標與隨機數產生器。共同中繼資料要指向同一個完整步；舊的全域順位未必永遠對應同一片。若改變總行程數，需要確認檢查點格式可重新分片，以及資料讀取策略如何接續，不能只把目錄改名就宣告可用。本例固定資料順序與單一行程，刻意去掉這些變因。

## 範例：連跑 6 步，對照跑 3 步再還原
把續跑的下一步與未中斷路線的同一步對齊。只比較載入後第一個畫面，可能看不出最佳化器狀態遺失。把下面的範例存成 `C:\dev\stackway-lab\train` 裡的 `resume_step.py`。

在該目錄執行：Windows PowerShell 用 `py resume_step.py`；macOS／Linux 用 `python3 resume_step.py`。

```python
import json, tempfile
from pathlib import Path
data = [1,4,2,8,3,6]
def start():
    return dict(w=0., v=0., step=0, cursor=0)
def advance(s,n):
    for _ in range(n):
        y = data[s["cursor"]]
        s["v"] = .5*s["v"] + (s["w"]-y)
        s["w"] -= .1*s["v"]
        s["step"] += 1
        s["cursor"] += 1
    return s
reference = advance(start(),6)
with tempfile.TemporaryDirectory(dir=".") as folder:
    path = Path(folder)/"step3.json"
    path.write_text(json.dumps(advance(start(),3)), encoding="utf-8")
    loaded = json.loads(path.read_text(encoding="utf-8"))
    print("next target", data[loaded["cursor"]])
    resumed = advance(loaded,3)
print("step", resumed["step"], "same", resumed==reference)
assert resumed==reference
```

只在練習資料夾執行。程式用專屬暫存目錄建立真正的 JSON 快照，從磁碟重新讀出後才接後 3 步；結束時暫存會清除，可留下腳本與輸出紀錄。每次先從游標取下一個目標，再用當前權重更新動量和權重，最後推進游標與完成步數。全程和續跑走的是相同運算順序，因此這個確定性的 CPU 小例可直接比最後狀態相等。

### 做一個會失敗的還原
把動量設為 0 再跑一次，資料游標與完成步數都還會吻合，但下一步的權重已經偏離參考。反過來只把游標倒退一格，載入時的權重和動量看起來都對，實際更新用的目標卻不同。將這兩種錯誤分別留在筆記，日後遇到「續跑後損失跳動」，就知道應同時核對資料身分與最佳化器歷史，而不是只反覆比較權重檔案大小。

## 常見錯誤
把「完成步數是 3」當成還要重做第三步，造成樣本重複。應寫明編號是已完成數，還是下一步的 0 起算索引。若對照失敗，先比還原後第一筆輸入和第一個新權重，不用等全部跑完才看一個總損失。真實 GPU、不同硬體或非確定性運算則需另外設定可接受誤差，不應硬要求所有部署逐位元相等。

## 小結
將到達步數、模型狀態與資料進度列成一張斷點收據，再用不中斷的參考路徑驗證。存檔路徑存在最多只證明有檔案；可接續，是經過還原並再做更新後才有的結論。
