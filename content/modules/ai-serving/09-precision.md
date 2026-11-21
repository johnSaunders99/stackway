---
id: ai-serving-04-precision
module: ai-serving
order: 9
title: 量化與推測解碼的驗收
subtitle: 量化與推測解碼怎麼驗收
status: ready
minutes: 35
level: 3
prereqs:
  - ai-serving-08-draft
objectives:
  - 用固定輸入比較品質與速度
  - 解釋草稿模型接受率如何影響收益
tags:
  - serving
  - quantization
resources:
  - title: vLLM：量化方法與硬體相容性
    url: https://docs.vllm.ai/en/stable/features/quantization/
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: vLLM：推測解碼的適用情境
    url: https://docs.vllm.ai/en/stable/features/speculative_decoding/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: NVIDIA NIM：串流延遲與吞吐量
    url: https://docs.nvidia.com/nim/benchmarking/llm/metrics
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-04-precision-ab
    prompt: 要分辨品質改變是否來自量化，先對照哪兩列？
    answer: 只有權重格式不同的配對列。
    mcq:
      options:
        - 基線與量化、草稿同時開啟的列
        - 只有權重格式不同的配對列
        - 同模型但提示與輸出上限都改過的列
        - 兩個都已量化、只更換草稿的列
      answer: 1
      explain: 一次只改一個因素才能追原因，組合列不能單獨分離效果。
  - id: ai-serving-04-precision-gate
    prompt: 規則是 4 題全對；有 1 列快但錯 1 題，該怎麼記？
    answer: 速度改善但品質未通過。
    mcq:
      options:
        - 以平均耗時達標取代逐題正確門檻
        - 刪除該錯題再重新計算通過率
        - 速度改善但品質未通過
        - 用較高的草稿接受率抵銷錯題
      answer: 2
      explain: 已經訂好的品質門檻不應在看到結果後放寬。
  - id: ai-serving-04-precision-na
    prompt: 沒有使用草稿的基線，接受率怎麼填？
    answer: 不適用，沒有提議作分母。
    mcq:
      options:
        - 0，表示草稿一個都沒猜中
        - 100%，因為全由目標生成
        - 填分類標籤答對的比例
        - 不適用，沒有提議作分母
      answer: 3
      explain: 草稿命中率不是任務正確率；沒提議就無比率。
    interview:
      question: 如何向同事交代「量化加草稿最快但不採用」？
      points:
        - 指出既定門檻及錯例
        - 拆開兩項改動
        - 保留可回退基線
      answer: 我會把錯題和基線答案放旁邊：兩個含量化的組合都錯同一題，單開草稿這輪過關。先留原權重測更大的評估集，不把接受率高當作品質及格。
practice:
  - id: ai-serving-04-precision-p1
    title: 寫一份優化驗收決議
    minutes: 12
    kind: code
    steps:
      - 儲存腳本並寫下門檻、最快列與最快合格列
      - 保留錯題編號及一項下一輪要補的測試
    checks:
      - 最快列 both 沒過關，最快合格列是 draft
      - 草稿列接受率 0.75，與 4 題全對分開呈現
---
## 為什麼要學：交付決定，不交付最快的一行
推論優化常同時涉及品質、等待和硬體。如果把權重量化和推測解碼同時打開，看到時間少了一半，卻發現固定格式偶爾壞掉，該撤回哪一個？驗收（acceptance test）先定義不能退的底線，再用同一組輸入逐項比較。本課交的是一張可說明「保留、拒絕、補測」的表，不是最佳化功能清單。

## 核心概念：保留對照與失敗樣本
第一列放未量化、未用草稿的基線；第二列只換權重格式；第三列在基線上只開草稿。若想測兩者同用，再加第四列，比對時說明是從哪列只改了哪個因素。所有列固定模型修訂、提示順序、解碼規則、輸出上限、裝置、並行度與暖機方式。保留原始回應、實收詞數和未完成樣本，避免速度的改善其實只是提前停止。

先訂可判定的品質門檻。本例的 4 張分類卡已有標準標籤，回應必須逐張答對，關鍵卡不能用其他卡抵銷。速度則用同一段請求完成時間，不用「看起來比較順」。小集合適合演練配對比較，不代表足以估計真實正確率；實務上應依任務分層，保留未參與調整的評估案例。

## 範例：找出誰快、誰通過
開啟 `C:\dev\stackway-lab\serving`，將範例另存為 `acceptance.py`。分開檢查品質門檻與速度門檻。跑得更快的候選若答錯更多題，不能只拿耗時來決定採用。

在該目錄執行：Windows PowerShell 用 `py acceptance.py`；macOS／Linux 用 `python3 acceptance.py`。

```python
gold = ["A","C","B","A"]
runs = [("base","ACBA",100,0,0), ("quant","ABBA",60,0,0),
        ("draft","ACBA",75,6,8), ("both","ABBA",56,5,8)]
for name, pred, ms, accepted, proposed in runs:
    bad = [i for i,(p,g) in enumerate(zip(pred,gold),1) if p!=g]
    ok = len(pred)==len(gold) and not bad
    print(name, "errors", bad, "pass", ok, "ms", ms,
          "acceptance", accepted/proposed if proposed else None)
```

每列耗時是相同觀測條件下的假想數字。量化列最快卻錯了第二題；草稿列沒有改基線答案，也縮短這組工作的時間。這叫通過此小組測試，不叫證明對所有語言和長度都能無損。表裡只列草稿提議和接受數的地方才計接受率，沒有啟用草稿的列應是「不適用」，不是命中率 0。

### 為沒有過關的列保留再測方向
假如錯的是一個特別少見但不能漏掉的標籤，就把該輸入與預期答案留作固定回歸題。下一輪別只用同題調到會答為止；另外留幾個寫法不同、標籤相同的新例，檢查修正是否有效。若是某列因少輸出了文字才變快，先用相同實收長度或任務完成條件重比，再決定要不要把數字寫進效能摘要。

## 常見錯誤
若拿抽樣輸出逐字比對，把任何不同都算品質退步，可能只測到隨機性。固定設定、用任務可檢查的規則評分；要檢驗抽樣分布則另做有足夠樣本的統計，不以幾句通順文字代替。正確推測演算法的分布保證也不會自動修好已量化目標模型的誤差，兩個因素要分清楚。

## 小結
交付時附上第一個錯例與未測條件。草稿接受率解釋「為何可能省時」，能否採用仍以真正交付的品質與端到端時間決定。若門檻未過就回到基線；若只有推演紀錄就提出下一輪實機測試，不把模擬列當成上線許可。
