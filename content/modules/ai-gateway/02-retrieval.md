---
id: ai-gateway-02-retrieval
module: ai-gateway
order: 2
title: 檢索增強生成流程
subtitle: 答案錯在檢索還是生成
status: ready
minutes: 30
level: 3
prereqs:
  - ai-gateway-01-gateway
objectives:
  - 區分文件切段、索引與重排
  - 固定候選文件測試生成端是否有變
tags:
  - gateway
  - retrieval
resources:
  - title: "Microsoft Learn：檢索增強生成的文件與查詢流程"
    url: https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-gateway-02-retrieval-chunk
    prompt: "切段時為何不能只取數字附近的句子？"
    answer: "條件可能與數字分離，需保留標題、適用範圍及版本等解讀線索。"
    mcq:
      question: "「保留 7 天」最不能漏掉哪項？"
      options:
        - "這條規則適用測試環境"
        - "前一個範例所採用的檔案格式"
        - "相鄰段落的示範指令"
        - "這頁的閱讀時間估計"
      answer: 0
      explain: "同一文件可能有多種環境，數字必須帶著條件。"
    interview:
      question: "模型答錯保留天數，你怎麼判斷是找錯還是說錯？"
      points:
        - "追初取、重排與最終封包"
        - "核對適用條件和引用"
        - "固定證據比較生成"
      answer: "我先看測試環境那段有沒有被取到，又是否進了實際封包。如果模型只看到正式環境，先查搜尋路徑；若明明拿到測試 7 天卻答 30，再固定封包回放生成端。"
  - id: ai-gateway-02-retrieval-rerank
    prompt: "重排能否救回沒進候選的文件？"
    answer: "不能，它只調整當前候選；漏取要往切段、索引及初取查。"
    mcq:
      question: "正確片段完全不在初取清單，應優先查什麼？"
      options:
        - "只改候選內排序"
        - "在同一批候選中換一種重排評分"
        - "只降低生成端的取樣隨機性"
        - "切段、索引版本與初取方式"
      answer: 3
      explain: "排序和表達無法讓不存在的候選進入封包。"
  - id: ai-gateway-02-retrieval-freeze
    prompt: "怎麼分隔檢索變動與生成差異？"
    answer: "固定同一問題、實際送入的證據與其他條件，再比較生成回覆。"
    mcq:
      question: "要比較兩個生成版本，哪項控制最重要？"
      options:
        - "兩版收到完全相同的問題與證據封包"
        - "分別換成各自最新索引"
        - "只固定文件庫名稱"
        - "各挑一題最好看的回答"
      answer: 0
      explain: "索引名同不代表候選與封包相同，要固定生成端真正收到的內容。"
practice:
  - id: ai-gateway-02-retrieval-p1
    title: "做一份可回放的證據封包"
    kind: code
    minutes: 14
    steps:
      - "執行 packet.py，在 rag-trace.md 記候選、排序、封包與兩個答案"
      - "拿掉 t1 後執行同一組答案"
      - "將兩種失敗分別標為缺證據或有證據仍作答錯誤"
    checks:
      - "原始封包固定且只有 7 天有依據"
      - "拿掉 t1 後兩個回答都無測試段落支持"
      - "紀錄沒有把回放當成真實模型呼叫"
---

## 為什麼要學：引用了一份文件，還是答錯了

同事問「測試報表保留幾天」，模型信心十足地回答 30 天，旁邊還附了文件代號。打開才發現，那是正式報表的規則。檢索增強生成（retrieval-augmented generation，RAG）是先找資料，再讓模型依取回的內容作答。要修這種錯誤，先追問正確規則在哪一步消失，而不是第一時間把模型換得更大。

## 核心概念：建索引和回答問題是 2 條流程

準備資料時，先將文件切段（chunking），讓一段文字小到可以取用，又保留必要的標題、適用環境和例外。若切在「測試環境」和「保留 7 天」中間，搜尋很容易拿到失去條件的數字。為每段保留文件代號、段落代號及版本，再建立索引（index），也就是能按關鍵字或向量等線索找出候選的結構。原文件改版後，索引版本也要能追溯，不然你可能找到已廢止的段落。

查詢來時，先在有權讀取的範圍內找候選，再做重排（reranking），依與問題的相關程度調整候選順序。重排只能重排已取到的段落，正確段落若根本不在候選中，就不能靠重排救回來。最後把選定段落、版本和問題交給生成端；交出去的實際內容可能比原候選更短，因此還要分清「曾經找到」和「最後真的進了模型」兩件事。

## 範例：把證據封包固定，再比較 2 份答覆

在 `C:\dev\stackway-lab` 新建 `rag-lab`，將以下存成 `packet.py` 並執行 `py packet.py`；macOS 或 Linux 用 `python3 packet.py`。以合成段落和已錄好的兩種答案模擬回放，不呼叫模型、也不假裝這是向量搜尋。

```python
chunks = {"p1": ("prod", 30), "t1": ("test", 7)}
candidates = ["p1", "t1"]
ranked = sorted(candidates, key=lambda k: chunks[k][0] != "test")
packet = tuple((k, *chunks[k]) for k in ranked[:1])
for answer_days in (7, 30):
    print("packet", packet, "answer", answer_days,
          "supported", ("t1", "test", answer_days) in packet)
```

排序把測試段落放前面，兩次都交出同一份「測試、7 天」封包。答案 7 在這份證據有依據，30 沒有。若正式環境下用相同問題、封包和生成設定比較候選模型，至少可排除檢索差異；模型存在隨機性時還要重複觀察，不能用一次回答斷言品質改變。接著從候選清單拿掉 t1，會發現連 7 都沒有封包支持：答案碰巧正確，不表示系統找對證據。

### 留哪幾段痕跡才查得回來？

替每次離線調查留下查詢版本、索引版本、初取清單、重排後清單、實際封包與答覆引用。若初取失敗先看切段和索引，初取成功卻在封包中不見就查重排、截斷或篩選，正確封包仍答錯再看生成端。實際服務可保存受保護的識別碼或必要摘要，不需為了除錯保留完整敏感問題。

## 常見錯誤

看到引用代號就算有根據，卻沒對照該段說的是哪個環境；或把沒有文件時的流暢回答算作成功。證據不足時要能清楚表示無法依資料作答，再引導補條件。之後在[〈檢索評估與回歸〉](#/lesson/ai-gateway-03-evaluation)會把這類例子編成固定題組，不必每次靠印象選一個好看的回答。

## 小結

診斷時一路追正確段落：有沒有進索引、進候選、進封包，最後是否真的支持答案。沿著這條路找第一個斷點，比同時換搜尋與生成模型更容易學到原因。
