---
id: cr-behavior-03-unknown
module: cr-behavior
order: 3
title: 未知問題與驗證
subtitle: 不會的事怎麼回答
status: ready
minutes: 30
level: 4
prereqs:
  - cr-behavior-02-conflict
objectives:
  - 分開已知、未知與可驗證的猜測
  - 用一個小步驟把不確定性縮小
tags:
  - behavior
  - uncertainty
resources:
  - title: Google SRE：用假設和觀察定位問題
    url: https://sre.google/sre-book/effective-troubleshooting/
    kind: book
    lang: en
    minutes: 10
    required: false
    checked: '2026-11-20'
  - title: Microsoft Careers：技術面試中的解題與測試
    url: https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-behavior-03-unknown-observation
    prompt: 下面哪一句是觀察而非根因判斷？
    answer: 具體指出在同一樣本、哪個邊界看到了哪些值。
    mcq:
      options:
        - 資料庫一定遺失資料
        - 有人忘記部署
        - 重啟一定會好
        - 轉換前有 11、12、13，轉換後沒有 12
      answer: 3
      explain: 轉換前後的編號可以從當次輸出核對；漏資料的原因、部署狀態與修復效果都需要額外證據。
  - id: cr-behavior-03-unknown-discriminate
    prompt: 哪個測試最能分辨漏讀與轉換時被濾掉？
    answer: 固定同一批輸入，比較轉換前後的識別碼。
    mcq:
      options:
        - 比較同一批資料在轉換前後的識別碼
        - 同時更換資料與程式
        - 只看最後總數再看一次
        - 先重啟所有服務
      answer: 0
      explain: 兩種假設會在轉換前產生不同的預測，才有區辨力。
    interview:
      question: 如果你沒用過出問題的資料庫，現在怎麼回應？
      points:
        - 坦白還不能判根因
        - 提出競爭解釋與預測
        - 用低風險觀察縮小範圍
      answer: 我還不能判定是資料庫。我會先取同一批去識別樣本的轉換前後編號。前面就缺，我往讀取條件查；後面才缺，我先問篩選規則。這一步不需要先改正式設定。
  - id: cr-behavior-03-unknown-contract
    prompt: 已找到空標籤被濾掉，還缺什麼才能判定是缺陷？
    answer: 需要確認資料契約是否要求保留空標籤的那筆資料。
practice:
  - id: cr-behavior-03-unknown-p1
    title: 留下一份可被推翻的假設筆記
    kind: code
    minutes: 12
    steps:
      - 建立 unknown.md，分欄記已知、未知、兩個假設及各自預測。
      - 跑 boundary.py，再將空標籤換成一般文字重跑，寫清兩次觀察與仍需確認的規則。
    checks:
      - 原始樣本只少 12，換掉空標籤後差集為空。
      - 筆記沒有把合成資料的結果寫成真實服務根因，下一步能區分兩種契約。
---

## 不知道原因，還能給出好答案嗎？
面試官說：「匯出檔突然少了一列，是不是資料庫壞了？」如果你沒看過現場，回答「一定是」沒有根據；只說「我不知道」也讓對話停在原地。面試想看的是你遇到陌生問題時，能否保留觀察、提出兩個說得通的解釋，再設計一個小到今天就能做的檢查。坦白未知與展現判斷力並不衝突。

## 分出觀察、假設、尚不可判斷的事
觀察 (observation) 是在特定條件下真正看到的結果；假設 (hypothesis) 是能預測另一個結果的可能解釋。已知「畫面顯示 3 筆、下載內容有 2 筆」，還不知道是讀取少拿一筆、格式轉換跳過一筆，或畫面顯示的是不同時間的資料。先確認畫面與檔案是不是同一批識別碼、同一時刻、同一篩選條件。不然光比總數就可能把兩個本來就不同的集合當作異常。

挑測試時問：「如果答案是甲，我會看到什麼；若是乙，又會看到什麼？」固定 3 筆無個資的樣本，把轉換前後的識別碼各列一次。若轉換前已少了一筆，先往輸入查；若轉換前齊全、轉換後才少，先把注意力放在轉換條件。這不是證明儲存層永遠沒問題，而是針對這次樣本把搜尋範圍縮到一個邊界。沒有授權時請負責角色提供去識別觀察，不自行去正式系統試錯。

## 範例：在 2 個邊界間找出消失的那筆
在 `C:\dev\stackway-lab\behavior` 存 `boundary.py`，執行 `py boundary.py`；macOS／Linux 用 `python3 boundary.py`。這是自建的示範轉換，只用合成編號，不在真實服務上做診斷。

```python
rows = [(11, "draft"), (12, ""), (13, "ready")]
before = [key for key, label in rows]
after = [key for key, label in rows if label]
print("before", before, "after", after)
print("missing", sorted(set(before) - set(after)))
```

兩端的差集只剩 12；目前可以說的是「這個樣本在排除空標籤的條件下少了 12」。能不能說這是錯誤，還要問產品是否允許空標籤。若本來就要排除，應改說明或數量標示；若應保留，就以原樣本當驗收，改動後確認其餘 2 筆的行為也沒變。下一個問題因此是資料契約，而不是立刻重啟資料庫。

追問若改成「現在能承諾多久修完？」可以先承諾一次更新的時間與內容，例如下一次回覆會列出哪個邊界先出現差異。尚未定位原因時不估修復工時，卻仍能讓等候的人知道什麼時候取得下一筆有用資訊。

## 常見錯誤
只測自己的第一個猜想，沒有先寫會讓它失敗的觀察，看到什麼都能解釋成「猜對了」。另一個陷阱是混在一起改篩選、換資料、重啟服務，結果改善卻無法指出哪一步有效。如果測試結果兩個假設都說得通，就承認這次沒分出來；保留結果，下一步改選更靠近分岔點的觀察。

## 小結
一句值得信任的回答有三段：「我目前只確定這些；我想區分這兩種原因；我會先做這個檢查，看到不同結果時分別往哪走。」這比假裝立刻知道答案，更接近真正能一起工作的同事。
