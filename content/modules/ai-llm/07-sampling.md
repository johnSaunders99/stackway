---
id: ai-llm-07-sampling
module: ai-llm
order: 7
title: 解碼策略與抽樣
subtitle: 同一個提示能不能得到不同回覆
status: ready
minutes: 35
level: 3
prereqs:
  - ai-llm-06-block
objectives:
  - 從一組分數比較貪婪與抽樣選詞
  - 說明溫度、top-k、top-p 各自改動哪個步驟
tags:
  - llm
  - sampling
resources:
  - title: Hugging Face：文字生成策略
    url: https://huggingface.co/docs/transformers/generation_strategies
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: 比較貪婪選詞與機率抽樣。
  - title: Hugging Face：生成參數
    url: https://huggingface.co/docs/transformers/main_classes/text_generation
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
    note: 找 temperature、top_k、top_p 的定義。
concepts:
  - id: ai-llm-sampling-support
    prompt: top-k 與 top-p 的候選集合各怎麼決定？
    answer: 前者固定名額，後者依排序後累積機率跨過門檻所需的名額決定。
    mcq:
      question: 機率 0.6、0.3、0.1，top-p 設 0.8 時保留誰？
      options:
        - 只留第一名
        - 全部 3 名
        - 只留個別機率超過 0.8 的詞
        - 前 2 名
      answer: 3
      explain: 前 1 名不足，前 2 名累積 0.9 已達門檻，不是逐項比大小。
    interview:
      question: 排查兩次生成不同時，如何把模型差異與選詞差異分開？
      points:
        - 固定提示與權重
        - 取第一個分岔步的分數
        - 記錄取樣設定與候選集合
      answer: 我會先比第一個分岔位置的分數，再用同一份分數試貪婪和抽樣。若分數一致，就查溫度、截斷和亂數，而不是先重訓模型。
  - id: ai-llm-temperature-order
    prompt: 正溫度降低會怎麼改變不相等的分數所對應的機率？
    answer: 原排序不變，高分選項的優勢變大。
    mcq:
      question: 要讓低分候選也較有機會，且不換詞表，應怎麼改？
      options:
        - 提高抽樣溫度
        - 降低抽樣溫度
        - 改成只留第一名
        - 改用貪婪解碼
      answer: 0
      explain: 提高溫度讓分布更平；後兩者直接排除其他選擇。
  - id: ai-llm-greedy-step
    prompt: 貪婪選詞保證了什麼，又沒有保證什麼？
    answer: 只保證每步選當下最高分，不保證整段文字最佳或整句機率最高。
    mcq:
      question: 同一步最高分是甲，選甲後下一步的分布未必理想。貪婪解碼保證哪件事？
      options:
        - 整句機率最高
        - 這一步取得最高分候選
        - 所有後續步驟分數相同
        - 所有可能路徑都比較過
      answer: 1
      explain: 這種選法只看當步分數，不向後搜尋整條路徑。
  - id: ai-llm-seed-scope
    prompt: 保存抽樣種子可以重現哪些條件？
    answer: 相同實作、分布與亂數呼叫順序下可重播抽樣，不足以保證跨引擎輸出一致。
practice:
  - id: ai-llm-07-lab
    title: 寫一張候選集合對照卡
    kind: code
    minutes: 12
    steps:
      - 將兩種門檻 0.55 和 0.85 的候選清單存成 decode-notes.txt
      - 把溫度提高到 2，預測 0.55 是否仍只留一個詞再執行
    checks:
      - 溫度 1 的 2 個門檻分別留 1、2 個詞
      - 溫度 2 且門檻 0.55 時前 1 名已不夠
---

## 為什麼要學

把同一句提示送兩次，有時得到「列車即將到站」，有時是「列車即將進站」。不同不一定是模型權重被改了：模型交出的是候選詞分數，解碼策略（decoding strategy）才決定下一格放誰。想重現錯誤或公平比較兩套服務，就要把這一步的設定一起留下。

## 先決定分布，再決定怎麼取

輸出分數（logits）還不是機率，可以有負數。貪婪解碼（greedy decoding）每步選最高分，只保證當步最高，不保證整句最佳。抽樣（sampling）則讓各候選詞按機率被選到；最高分可以常中，卻不必每次都中。選出的詞會接回提示，因此早一步的差異就能改變後面整串分數。

溫度（temperature）在取 softmax 前把各分數除以同一個正數。小於 1 讓分布更尖，大於 1 讓它更平，不改原本的大小次序。top-k 保留前 k 名；核心抽樣（top-p）從大到小累積機率，保留剛好達到門檻所需的最小前綴。不管用哪種截斷，都要在留下的候選中重新分配機率。下例分開比較兩種篩選，不假設所有引擎有相同的組合順序。

## 範例：同一份分數的 3 種去路

取 6、3、1 的對數當分數；溫度為 1 時，轉回機率正好是60%、30%、10%。先猜 top-p 門檻為 0.55 要留幾名，再對照固定留前 2 名的清單。程式最後只從保留的清單抽，不把種子當模型參數。

在 `C:\dev\stackway-lab\llm` 新建 `choose_next.py`。把最高分的候選先圈起來。再換成抽樣時，它是不是唯一可以被選到的結果？

在該目錄執行：Windows PowerShell 用 `py choose_next.py`；macOS／Linux 用 `python3 choose_next.py`。

```python
from math import exp, log
from random import Random
tokens = ["到", "進", "離"]
temp, p = 1.0, 0.55
scores = [log(n) / temp for n in (6, 3, 1)]
mass = [exp(s - max(scores)) for s in scores]
probs = [m / sum(mass) for m in mass]
rank = sorted(range(3), key=probs.__getitem__, reverse=True)
keep, total = [], 0
for i in rank:
    keep.append(i)
    total += probs[i]
    if total >= p:
        break
rng = Random(15)
print("greedy", tokens[rank[0]], "top-k", [tokens[i] for i in rank[:2]])
print("top-p", [tokens[i] for i in keep])
print([tokens[i] for i in rng.choices(keep, weights=[probs[i] for i in keep], k=8)])
```

想辨認「本來就不能中」和「這次剛好沒中」，先看候選清單再看抽出的8 筆。出現在清單裡只代表有機會；不在清單裡才是機率為 0。把這兩種情況混在一起，很容易拿少量樣本錯判設定失效。

### 用機率檢查截斷後的口袋

在門檻保留前 2 名的情境中，原始機率分別是 6 成和 3 成，總量只有 9 成。真正抽選前要除以留下的總量，於是第一名約占 2/3、第二名約占 1/3；不應把餘下的一成當成「不產生詞元」的機會。程式的加權抽樣接受未重新縮放的重量，內部是依相對比例選，與手算相同。

若工作要求是讓服務穩定輸出格式，請先把同一提示反覆送入當作檢查，而不是只憑一次答對來選較高溫度。抽樣改的是選法，不是格式驗證器；即使只挑最高分也不能保證符合約定。

## 常見錯誤

不要把溫度設成 0 代入除法；若要固定取最高分，選明確的貪婪模式。也別把 top-p 的小數看成候選詞數量的比例。即使兩次抽樣碰巧相同也不表示抽樣沒啟用，尤其是只剩 1 個候選時。固定亂數種子有助於控制這個小例子，並不保證跨硬體、版本的模型逐字一致。

## 小結

把重現條件寫完整：哪份分數、溫度多少、保留哪些候選、用什麼選法。看到差異時，先分清是模型給了不同分數，還是在同一份分布上選了不同的詞。
