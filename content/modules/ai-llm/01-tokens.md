---
id: ai-llm-01-tokens
module: ai-llm
order: 1
title: 分詞與詞彙表
subtitle: 字數不是 token 數
status: ready
minutes: 25
level: 3
prereqs: []
objectives:
  - 用兩種字串比較切分結果
  - 以 token 而非字數估計輸入大小
tags:
  - llm
  - tokenizer
resources:
  - title: Hugging Face：從子詞到輸入索引
    url: https://huggingface.co/learn/llm-course/chapter2/4
    kind: course
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: 看子詞切分與轉換代號的兩個步驟。
concepts:
  - id: ai-llm-piece-count
    prompt: 為什麼字數相同的提示可能有不同詞元數？
    answer: 分詞器依自己的詞表與切分規則組成片段，計數的是片段，不是字元。
    mcq:
      question: 詞表有「車票、車、票、站」，每步取最長片段。「車票車站」需要幾個代號？
      options:
        - 2 個
        - 3 個
        - 4 個
        - 8 個
      answer: 1
      explain: 切成「車票、車、站」；4 是字元數，不能用某個代號的大小代替片段數。
    interview:
      question: 同樣 100 個字，有人估計一定能放進剩下的 100 個位置。你怎麼查？
      points:
        - 辨認模型與詞表
        - 依實際格式編碼
        - 以代號數對照剩餘位置
      answer: 我會取實際送出的提示，連角色分隔符號一起用配套分詞器編碼。留下片段與長度，再比容量；不會用字數乘固定比例當保證。
  - id: ai-llm-vocab-id
    prompt: 詞元代號的數值代表什麼？
    answer: 它是該詞表裡的一個索引，換詞表後不能直接沿用。
    mcq:
      question: 把另一個模型的詞表接上舊模型，最先該檢查什麼？
      options:
        - 兩張表的檔案大小是否相同
        - 索引有沒有依字典順序排列
        - 相同索引是否仍指向相同片段
        - 輸入是否都是整數
      answer: 2
      explain: 即使整數都合法，舊模型讀取的列仍可能代表別的片段。
  - id: ai-llm-prompt-count
    prompt: 如何替實際聊天輸入計算詞元預算？
    answer: 用配套的分詞器編碼含角色標記等包裝在內的完整提示，再數輸入位置。
practice:
  - id: ai-llm-01-lab
    title: 製作兩筆分詞收據
    kind: code
    minutes: 9
    steps:
      - 執行範例，把兩列輸出存成 ticket-notes.txt
      - 移除詞表中的「車票」，再次執行並記下哪列改變
    checks:
      - 原本 2 列都是 2 字，詞元數分別是 1、2
      - 移除合併片段後，「車票」改成代號 2、5，另一列不變
---

## 為什麼要學

同一個輸入框，貼上「車票」能送出，貼上同樣字數的罕見代碼卻超過限制。如果你用字串長度裁切，畫面上的字雖然留下來了，模型收到的東西卻可能根本放不下。語言模型讀的是詞元（token）：每個位置放的是一個整數代號。要估計花多少位置，先問是哪個模型、搭配哪個分詞器（tokenizer），而不是先問有幾個字。

## 先切成片段，再查代號

詞彙表（vocabulary）是一張「片段 → 代號」對照表。分詞器先按自己的規則處理文字、找出片段，再把片段換成表中的整數。一個詞可能拆成好幾個子詞（subword）；常見組合也可能整段只有 1 個代號。是否保留空白、大小寫，遇到不認識的字退回較小片段還是未知代號，都取決於規則。

把「車票」想成可用一張大積木或兩張小積木拼出的標示。兩種拼法讀起來一樣，佔用的位置不同。代號只是積木盒上的編號，不是價格或語意分數。下一堂[〈詞嵌入與向量維度〉](#/lesson/ai-llm-02-embedding)才把編號換成模型能運算的一列數字。

## 範例：2 張等長的車票

做一個能從頭看到尾的小分詞器：每一步從剩下的字串開頭找最長的已知片段，交回片段與代號。這是為了看清規則而設計的有限詞表，不是特定模型的實作；表裡沒有的字讓程式報錯，不悄悄漏字。

為分詞與序列實驗建立 `C:\dev\stackway-lab\llm`。建立 `split_ticket.py`。先用眼睛估計字數，再按範例規則切分。哪一段可以用一張票表示，哪一段反而需要更多張？

在該目錄執行：Windows PowerShell 用 `py split_ticket.py`；macOS／Linux 用 `python3 split_ticket.py`。

```python
vocab = {"車票": 8, "車": 2, "票": 5, "站": 3}
def encode(text):
    parts = []
    while text:
        hits = [s for s in vocab if text.startswith(s)]
        if not hits:
            raise ValueError("unknown piece")
        piece = max(hits, key=len)
        parts.append((piece, vocab[piece]))
        text = text[len(piece):]
    return parts

for word in ("車票", "車站"):
    parts = encode(word)
    print(word, len(word), parts, len(parts))
```

先遮住輸出，試著在紙上從左往右畫界線。看到第一個「車」時其實有兩條合法路徑；程式選長片段，是因為我們指定這條規則，而不是因為代號 8 比代號 2 大。執行後對照最後一欄。若你把詞表裡「站」的代號改成 30，清單會顯示不同數字，片段數卻不變；相反地，增加一個能跨越原先界線的片段，才可能省下一個位置。這兩個改動適合分開試，否則無法看出究竟改了哪一步。

### 留幾個位置給回答？

假設教學模型這次可用的位置總共只有 6 個，完整提示已用掉 4 個。即使輸入本身合規，也只剩 2 個位置給新產生的詞元。如果使用者要求「再給我 5 個字」，你既不能把它當成 5 個詞元，也不能承諾答案會在剩下的空間內講完。先分開記輸入、輸出上限與總容量，保留必要提示，再決定要縮短哪一部分。

## 常見錯誤

不要用這個玩具推斷中文一定比英文花多少詞元，也不要把字元數、編碼後的位元組數和詞元數印在同一欄。三者回答不同問題。服務若在文字外面加上角色、分隔符號等特殊詞元，使用者看到的短句也不是完整輸入；要把實際送出的格式一起編碼。

## 小結

保留原字串、切分後的片段與代號，你就有一張能重算的收據。要移到真正的服務，換成模型配套的分詞器，記下版本和完整提示，再用代號序列的長度做預算。
