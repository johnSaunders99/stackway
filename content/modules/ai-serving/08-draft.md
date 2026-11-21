---
id: ai-serving-08-draft
module: ai-serving
order: 8
title: 推測解碼與候選驗證
subtitle: 小模型猜錯了還能加快嗎
status: ready
minutes: 35
level: 4
prereqs:
  - ai-serving-07-quant
objectives:
  - 標出草稿模型提議與目標模型驗證的步驟
  - 以接受率和額外運算解釋何時反而較慢
tags:
  - serving
  - draft
resources:
  - title: vLLM：推測解碼的適用情境
    url: https://docs.vllm.ai/en/stable/features/speculative_decoding/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-08-draft-prefix
    prompt: 第一個候選就被拒，後面偶然相同的候選怎麼算？
    answer: 丟棄該段後綴並依修正前綴重開。
    mcq:
      options:
        - 丟棄該段後綴並依修正前綴重開
        - 逐位置比對，只要後面字面相同就能跳過分歧繼續接受
        - 只換掉第一個錯詞，後面的猜測直接交付
        - 把所有後綴當成本輪已被目標確認的詞元
      answer: 0
      explain: 後綴依賴被否定的前綴，不能直接沿用。
  - id: ai-serving-08-draft-rate
    prompt: 提議 3 詞，接受 2 詞，另補 1 詞，接受率是多少？
    answer: 2/3。
    mcq:
      options:
        - '1'
        - 2/3
        - 1/3
        - 3/2
      answer: 1
      explain: 目標補出的詞有交付價值，但不是被接受的草稿。
  - id: ai-serving-08-draft-cost
    prompt: 哪個數字最直接檢查單串推測解碼的損益？
    answer: 每輪實花時間除以交付詞元數。
    mcq:
      options:
        - 只計草稿提出每詞所花時間
        - 只計目標模型驗證一次的延遲
        - 每輪實花時間除以交付詞元數
        - 只看提議詞元總數與請求數之比
      answer: 2
      explain: 省下的目標步數要抵過提議和驗證成本。
    interview:
      question: 草稿模型很小，為什麼打開後仍可能變慢？
      points:
        - 分歧會丟棄後綴
        - 額外運算並非免費
        - 對照同一負載
      answer: 我會先數每輪真的留下幾個詞，不把修正詞算成草稿命中，再量提議加驗證的時間。若常在第一格分歧，或原本裝置已飽和，我會保留不開草稿的基線。
  - id: ai-serving-08-draft-distribution
    prompt: 用抽樣的目標模型驗證草稿，所謂保留品質保證的是什麼？
    answer: 正確的驗證與修正規則保留目標抽樣分布，不要求兩次獨立執行逐字相同，也不會修正目標模型本身的錯誤。
practice:
  - id: ai-serving-08-draft-p1
    title: 保存三條驗證路徑
    minutes: 11
    kind: code
    steps:
      - 儲存程式並標出首次不一致的位置
      - 逐列計算每個交付詞元的假想時間，與 10 毫秒基線比
    checks:
      - XBC 的接受數為 0 但仍交付 A
      - ABD 全中時交付 ABDE，接受數仍是 3
---
## 為什麼要學：可不可以少等幾次大模型？
逐詞解碼時，下一步要等前一步選好詞才能開始。推測解碼（speculative decoding）試著把昂貴的逐步呼叫換成一次多位置驗證：先讓便宜的草稿模型（draft model）提議一小串詞元，再由目標模型（target model）決定哪些可以留下。最後說了算的仍是目標模型，而不是把草稿先顯示給使用者再偷偷改字。

## 核心概念：接受的是連續前綴
先看容易手推的貪婪解碼（greedy decoding）：每步選分數最高的詞。假設草稿依序猜「白、色、雲」，目標沿這條候選路徑驗證，前 2 格同意，第三格選「紙」。於是留下前 2 格，第三格改成目標的選擇，從修正過的上下文開新一輪。如果更早就有分歧，之後的草稿建立在錯誤前綴上，即使偶然猜中後面的字也不能算接受。

若採抽樣（sampling），驗證不再是單純比字相等；正確的接受、拒絕與修正抽樣規則，是為了保留目標的輸出分布，而非保證兩次分別執行會逐字相同。以下只演練貪婪路徑。當整段都命中，典型演算法還可取目標已算好的下一詞，範例把這個額外位置也寫出來。

## 範例：用每輪成本估算損益
從候選序列開頭逐項比對，遇到第一個不符就停。後面即使又猜中，也不能跳過缺口接回原序列。把下面的範例存成 `C:\dev\stackway-lab\serving` 裡的 `draft_round.py`。

在該目錄執行：Windows PowerShell 用 `py draft_round.py`；macOS／Linux 用 `python3 draft_round.py`。

```python
def verify(draft, target):
    out, accepted = [], 0
    for i, token in enumerate(draft):
        if token != target[i]:
            return out + [target[i]], accepted
        out.append(token)
        accepted += 1
    return out + [target[len(draft)]], accepted

for draft in ("ABC", "XBC", "ABD"):
    out, hit = verify(draft, "ABDE")
    print(draft, "".join(out), hit/len(draft), "ms/token", 15/len(out))
```

費用以假想毫秒表示，草稿提 3 詞加驗證合計 15 毫秒；這不是實機效能資料。若傳統每產 1 詞要 10 毫秒，本輪要多產幾詞才打平？看輸出的「每個交付詞元成本」，而不是只看驗證呼叫少了幾次。早早分歧時雖然也能交付目標的一詞，但草稿和驗證的成本照付。

### 看第 1 個不同的位置，不看字面總相似度
比較兩份草稿：一份開頭就錯、後面 2 格和參考相似；另一份前 2 格都對、最後才錯。若只統計兩個字串有幾格相同，可能把它們算成同分。把目標補出的第一個不同詞寫回上下文後，前一份後續 2 格已失去所依據的歷史，後一份卻已確實交付 2 個草稿詞。這也是為什麼診斷時應保留每輪接受的前綴長度，而不只是整場的平均相似度。

## 常見錯誤
把接受率當作速度比，沒記分母、草稿長度、驗證用時和額外記憶體。接受率應標明是接受草稿詞數除以提議草稿詞數；目標補出的詞不是草稿命中。高並行時裝置可能本來就很忙，額外草稿運算未必能塞進閒置時間，單筆變快也不表示整台吞吐增加。

## 小結
要問的是每花一次提議加驗證的代價，能交付多少可信詞元。先寫成功和失敗各一條路徑，再以相同提示分布比較開關兩種設定；若沒有真正的模型與時間戳，只能說明機制與損益條件，不能承諾加速倍數。
