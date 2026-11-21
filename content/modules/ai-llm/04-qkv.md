---
id: ai-llm-04-qkv
module: ai-llm
order: 4
title: 自注意力與查詢鍵值
subtitle: 下一個詞最該看前面哪個位置
status: ready
minutes: 35
level: 3
prereqs:
  - ai-llm-03-position
objectives:
  - 說明 Q、K、V 分別提供什麼
  - 手推 2 個位置的權重如何組成加權輸出
tags:
  - llm
  - qkv
resources:
  - title: 動手學深度學習：注意力分數
    url: https://d2l.ai/chapter_attention-mechanisms-and-transformers/attention-scoring-functions.html
    kind: course
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 讀縮放點積與遮罩的算例。
  - title: Attention Is All You Need：模型架構
    url: https://arxiv.org/html/1706.03762v7
    kind: paper
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
    note: 看圖 1 與第 3 節，沿資料流讀區塊。
concepts:
  - id: ai-llm-qkv-roles
    prompt: 自注意力裡哪兩種量決定權重，哪種提供內容？
    answer: 查詢和鍵決定相容分數與權重，值是被權重混合的內容。
    mcq:
      question: 2 個值為 4、12，2 個權重都非零。保持 Q、K 不變，只把第二個值加倍，哪個量不變？
      options:
        - 注意力權重
        - 混合輸出
        - 第二個位置的加權貢獻
        - 值向量的大小
      answer: 0
      explain: 權重在讀值之前已算好，範例中第二個位置有非零權重。
    interview:
      question: 怎麼用最小算例證明注意力不是只複製最相似的位置？
      points:
        - 固定 2 個鍵與一個查詢
        - 算出非零且合計為 1 的權重
        - 用不同值示範混合輸出
      answer: 我會固定權重為 1/4 及 3/4，給 2 個位置 4 和 12。答案是 10 而非 12；再只改第一個值，結果還會動，但權重沒動。
  - id: ai-llm-weighted-read
    prompt: 權重為 0.25、0.75，值為 4、12，輸出是多少？
    answer: 輸出是 1 加 9，等於 10。
    mcq:
      question: 若 2 個值同為 8，權重仍為 0.25、0.75，輸出是多少？
      options:
        - "6"
        - "8"
        - "16"
        - "4"
      answer: 1
      explain: 每個值乘自己的權重再加；2 個相同的值混合後仍是原值。
  - id: ai-llm-row-softmax
    prompt: 注意力的 softmax 對哪一組分數正規化？
    answer: 對同一查詢與所有可見鍵的分數正規化，不跨不同查詢列。
practice:
  - id: ai-llm-04-lab
    title: 留下一列注意力帳本
    kind: code
    minutes: 12
    steps:
      - 在 mix-notes.txt 列出鍵、指數比例、權重和值
      - 執行程式，將第一個值改成 8，再補上兩次輸出
    checks:
      - 原輸出 10，修改後 11
      - 2 次權重皆為 0.25、0.75
---

## 為什麼要學

看車站看板時，你拿「我要去海邊」去比各列的目的地；最像的那列，提供的是月台號碼，不是再給你一次目的地。自注意力（self-attention）也分成「拿什麼去比」「和誰比」「比完帶回什麼」。分清楚這三件事，才不會把看板旁的相似分數誤讀成模型預測下一個詞的機率。

## 查詢問路，鍵供比對，值供取用

對同一串輸入表示，模型用三組學得的投影產生查詢（query，Q）、鍵（key，K）與值（value，V）。固定其中一個查詢，與每個可見位置的鍵作點積：對應維度相乘再加總。標準縮放點積會再除以鍵寬度的平方根，以免寬度變大時分數過於極端。

接著用 softmax 把各分數取指數、除以這一列的指數總和，得到非負且總和為 1 的注意力權重。每個權重乘上對應位置的值，逐維相加，就是此查詢帶回的內容。每個查詢都有自己的一列權重，不是整句共用一排名次。多頭注意力是分組做這種比對，再整合結果；先弄懂一個頭、一次查詢就夠了。

## 範例：手算 2 個來源的混合

讓鍵寬度等於 1，所以縮放因子也是 1。查詢取 1，2 個鍵取 0 和自然對數 ln(3)。指數還原為 1 與 3，分母是 4。先不看程式：若值為 4 與 12，輸出會是 12，還是介於兩者之間？

在 `C:\dev\stackway-lab\llm` 新建 `mix_values.py`。先追蹤哪個量拿來算相似程度，哪個量最後被加權混合。不要把分數本身誤認為輸出內容。

在該目錄執行：Windows PowerShell 用 `py mix_values.py`；macOS／Linux 用 `python3 mix_values.py`。

```python
from math import exp, log
q, keys, values = 1, [0, log(3)], [4, 12]
scores = [q * k for k in keys]
mass = [exp(s - max(scores)) for s in scores]
weights = [m / sum(mass) for m in mass]
print([round(w, 2) for w in weights])
print(round(sum(w * v for w, v in zip(weights, values)), 2))
```

程式先減掉列中的最大分數才取指數。這等於把所有未正規化的重量除以同一個常數，最後的比例不變，卻較不容易因分數太大而溢位。你可先用原來的 1 比 3 算一遍，再用程式得到的 1/3 比 1 算一遍；不要把這個穩定計算的小步驟誤當成篩掉較小的鍵。

### 換個查詢，值不用搬家

試把查詢改成 0。2 個點積現在都等於 0，2 個指數一樣大，所以帶回來的是 4 與 12 的普通平均。再把查詢改成負 1，第二個鍵原本較高的分數反而較低，2 個來源的重要性對調。你沒有移動看板、沒有更改任何月台號碼，改的只是提問方向。

若某同事只交給你一張權重圖，沒附上值的內容，你最多知道各位置占多少份量，不能由此算出最後交出的向量。即使同一張權重圖，每個位置的值完全相同與彼此截然不同，也會帶回不同資訊。

## 常見錯誤

注意力不是投票取第一名。即使第二個位置占 3/4，第一個位置仍有貢獻。也別把鍵和值弄反：只改某個值會改輸出，不會改這次已由查詢與鍵算出的權重。輸出向量還要經過後續網路才會變成候選詞的分數，注意力權重本身不是最終答案。

## 小結

把一次比對記成「哪個查詢、看哪些鍵、取回哪些值」。算完用兩個界線查錯：同一列權重應合計為 1，本例是純量加權平均，結果應介於最小值與最大值之間。
