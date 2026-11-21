---
id: cr-portfolio-02-scope
module: cr-portfolio
order: 2
title: 設計決策與取捨
subtitle: 挑一個可以說清楚的取捨
status: ready
minutes: 30
level: 4
prereqs:
  - cr-portfolio-01-reader
objectives:
  - 區分自己的設計與框架預設
  - 以具體限制解釋沒選另一方案的原因
tags:
  - portfolio
  - tradeoff
resources:
  - title: "Microsoft Learn：架構決策紀錄"
    url: https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-portfolio-02-scope-constraint
    prompt: "怎麼區分選擇理由與共同條件？"
    answer: "理由必須能在符合限制的選項之間做出區別。"
    mcq:
      question: "兩個做法皆可離線，哪項可支持以文字檔起步？"
      options:
        - "現場沒有網路"
        - "兩者皆能表示狀態"
        - "交班者必須用文字編輯器直接檢查資料"
        - "兩種工具都已安裝"
      answer: 2
      explain: "可離線是共同前提，不足以分出高下。"
    interview:
      question: "你為什麼沒有直接選 SQLite？"
      points:
        - "描述實際限制"
        - "公平指出替代方案的長處"
        - "說出何時會改選"
      answer: "這版重點是讓單人用編輯器核對清單，不是文字檔一定比較快。SQLite 也能離線，而且有交易。若需要兩個視窗同時寫，我會先測是否丟失更新再決定。"
  - id: cr-portfolio-02-scope-credit
    prompt: "框架或函式庫提供的功能應如何歸因？"
    answer: "指出工具提供什麼，並另外指出自己選定或實作的規則。"
    mcq:
      question: "哪項是這個交班範例作者的選擇？"
      options:
        - "SQL 提供依條件篩選資料的語法"
        - "Python 提供迭代清單的能力"
        - "SQLite 提供記憶體資料庫連線"
        - "以工作代號和狀態表示事項"
      answer: 3
      explain: "資料表示與篩選是此作品的選擇，底層能力是沿用。"
  - id: cr-portfolio-02-scope-trigger
    prompt: "什麼是能重新評估選擇的條件？"
    answer: "可觀察的新需求或證據，足以改變原本取捨的權重。"
    mcq:
      question: "何時最值得重新評估交班簿的寫入方式？"
      options:
        - "工作代號由英文縮寫改成完整名稱"
        - "規格改為多視窗同時修改同一筆"
        - "輸出改為按狀態分組顯示"
        - "在讀取時略過空白列"
      answer: 1
      explain: "同時寫入改變資料一致性的要求；其他改動未改變儲存條件。"
practice:
  - id: cr-portfolio-02-scope-p1
    title: "寫一張方案比較卡"
    kind: explain
    minutes: 14
    steps:
      - "執行最小對照並把輸出貼入 decision.md"
      - "補上限制、兩個候選方案及此次無法驗證的主張"
      - "寫一個會改選的條件"
    checks:
      - "兩個方案都能完成原任務"
      - "有一個共同條件未被當作勝出理由"
      - "標出工具預設與自己實作的分界"
---

## 為什麼要學：哪一行是你的決定？

面試時對方指著交班簿問：「為什麼把清單存在檔案？」如果只回答「因為 Python 可以寫檔」，你說的是工具的能力，不是自己的判斷。真正值得放進作品的設計決策（design decision），是當時有不只一條路可走，你依照某項限制選了其中一條，也願意承擔這條路帶來的不便。

## 核心概念：把選項放在同一個問題下

假設現場只有一台離線電腦，交班時同一時間只會有一人寫入，而且下一班需要用文字編輯器檢查資料。這是限制。候選方案可以是逐行文字檔，也可以是內嵌式資料庫 SQLite，不必故意找一個荒謬選項當陪襯。兩者都能離線，不要把「可離線」寫成文字檔勝出的獨有理由；差異在於前者可直接閱讀，後者在交易與查詢上有現成功能。

分清楚「我做了什麼」和「工具原本就有什麼」。設計每列包含工作代號與狀態，是你的格式選擇；語言提供讀檔函式，不是你開發了檔案系統。說得出邊界，審查者才知道可以繼續追問你哪一段。作品不必一開始就解決多人協作，但說明應寫出什麼條件一變，你會重新評估現在的選擇。

## 範例：讓一次取捨留下證人

在練習目錄 `C:\dev\stackway-lab` 的新子資料夾 `decision-demo` 建立 `compare_storage.py`。在裡面用 `py compare_storage.py` 執行；macOS 或 Linux 用 `python3 compare_storage.py`。這是兩種表示法的最小對照，不是資料庫效能測試。

```python
import sqlite3
sample = "inspect,open\nrestock,done"
rows = [line.split(",") for line in sample.splitlines()]
print([task for task, state in rows if state == "open"])
db = sqlite3.connect(":memory:")
db.execute("create table tasks (task text, state text)")
db.executemany("insert into tasks values (?, ?)", rows)
print(db.execute("select task from tasks where state = 'open'").fetchall())
db.close()
```

兩行都選到 inspect，第二行多了代表資料列的括號。這次實際確認的是：對同一份小樣本，兩種表示法都能答「還有什麼沒完成」。資料庫在記憶體裡，程式關掉就消失，所以不能拿這兩行證明資料已安全保存。若你的理由是讓接班者能手動檢查，下一個小驗證應該是拿真的文字檔請人指出未完成項目，而不是對這段程式計時。

### 寫出會讓你改變主意的訊號

一段可用的決策紀錄是：「此版給單機單人交班，用可閱讀的文字檔；需要依狀態查詢時先逐行讀取。代價是多人同時修改會難以判斷誰的內容應保留。若需求改成兩個視窗都能修改，先測重疊寫入，再評估交易。」條件具體到能被新事實推翻，比宣稱「以後流量大再優化」容易交接。

## 常見錯誤

用程式碼行數少推論維護費用一定低，忽略了資料損壞時要花多少時間復原。另一個陷阱是替沒試過的方案捏造缺點，例如說資料庫必須連網；SQLite 就是可在本機使用的反例。沒量過的部分標成推測，再寫最便宜的驗證方法，不需要為了讓作品有結論就先填上一個數字。

## 小結

拿掉工具名稱再讀一遍：讀者還能看見限制、選項、代價及改選條件嗎？如果可以，這段寫的才是你的判斷，而不只是一張技術清單。
