---
id: fs-data-05-page
module: fs-data
order: 6
title: 位移與游標分頁
subtitle: 清單一直變時如何翻頁
status: ready
minutes: 35
level: 3
prereqs:
  - fs-data-04-double
objectives:
  - 比較位移與游標分頁的穩定度
  - 用新插入的一列檢查重複與漏列
tags:
  - data
  - pagination
resources:
  - title: "PostgreSQL：LIMIT 與 OFFSET"
    url: "https://www.postgresql.org/docs/current/queries-limit.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-data-05-page-offset"
    prompt: "為何位移翻頁會在插入新資料後重複？"
    answer: "跳過的是目前排在前面的列數，不是上次已看過的識別碼。"
    mcq:
      options:
        - "分頁會複製資料到新表。"
        - "跳過的是目前排在前面的列數，不是上次已看過的識別碼。"
        - "每次排序都只看第一列。"
        - "新資料一定放在最後。"
      answer: 1
      explain: "前面新增或移除列，原有列的位置就會移動。"
    interview:
      question: "活動紀錄一直新增，你會選頁碼還是游標？"
      points:
        - "釐清跳頁或連續捲動"
        - "穩定排序與唯一決勝鍵"
        - "區分新資料和歷史快照"
      answer: "若是往舊紀錄連續捲動，我會用時間加唯一編號當邊界，新的紀錄提示回頂端看。若業務要跳到特定頁，我會說明位移的取捨；要完整匯出則另取一致快照。"
  - id: "fs-data-05-page-cursor"
    prompt: "依時間及編號降冪排列時，游標要保存什麼？"
    answer: "末列的時間與唯一編號"
    mcq:
      options:
        - "目前頁數"
        - "末列的時間就永遠足夠"
        - "末列的時間與唯一編號"
        - "已回傳的列數"
      answer: 2
      explain: "同一時間可有多筆；使用唯一編號才能確定同時間內的位置。"
  - id: "fs-data-05-page-scope"
    prompt: "游標翻頁是否保證得到某一刻的完整快照？"
    answer: "不保證，排序鍵異動或資料刪除仍會影響後續頁。"
    mcq:
      options:
        - "保證，它會鎖住整張表。"
        - "保證，只要頁面夠小。"
        - "不保證，因為游標不能搭配排序。"
        - "不保證，排序鍵異動或資料刪除仍會影響後續頁。"
      answer: 3
      explain: "游標描述邊界而非凍結資料；整批匯出另需一致視圖。"
  - id: fs-data-05-page-ties
    prompt: "只用時間當邊界，同一秒跨頁時可能出現什麼？"
    answer: "嚴格小於時間會漏掉尚未顯示的同秒資料；加入唯一編號才能判斷哪一筆接在末列之後。"
practice:
  - id: "fs-data-05-page-p1"
    title: "留下翻頁前後的四張清單"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 pages.py"
      - "把插入新列改為刪除第一頁首列"
      - "分別標出兩種方法的重複與漏列"
    checks:
      - "新增時位移頁重見 4，游標頁為 3、2"
      - "刪除首列時位移漏掉 3"
---

## 為什麼要學：昨天的第 3 名不一定是今天的第 3 名

活動紀錄每頁 2 筆，按最新在前排列。讀者看完 5 號、4 號，點下一頁之前又新增 6 號。若程式只記得「跳過 2 筆」，新的第三筆是 4 號，不是讀者以為的 3 號。分頁（pagination）要先決定延續的是第幾個位置，還是上次停在哪一筆。

## 核心概念：給邊界一個不含糊的名字

位移（offset）配合筆數限制（limit），很適合靜態報表與直接跳頁。它依本次查詢的結果跳過指定數量，前面刪了一列會往前補，前面多了一列會往後推。沒有明確排序就連「前面」都說不清；只靠顯示時間也不夠，同一秒可能產生多筆紀錄。先約定唯一的完整順序，再談哪個分頁策略比較好。當排序的兩個欄位都有對應索引，資料庫也較有機會直接從游標邊界附近開始讀取。

游標（cursor）在這裡是應用程式交給下一頁的邊界值，不是持續開在資料庫裡的一條連線。依建立時間與唯一編號一起降冪（descending）排列，記住末列的這兩個值。下一頁取時間更早的列，或同一時間但編號更小的列。條件的方向要和排序一致；若只用小於某個時間，同一秒還沒讀完的資料會整批消失。

## 範例：在按翻頁鍵之前，插入一筆

在 `C:\dev\stackway-lab\data` 儲存 `pages.py`，執行 `py pages.py`；macOS／Linux 用 `python3 pages.py`。時間暫用小整數，便於在紙上排順序。3 號和 4 號同時產生，正好驗證第二個排序欄位不是裝飾。

```python
import sqlite3
db = sqlite3.connect(":memory:")
db.executescript("CREATE TABLE event(t INTEGER,id INTEGER PRIMARY KEY); INSERT INTO event VALUES(3,5),(2,4),(2,3),(1,2),(1,1);")
tail = " ORDER BY t DESC,id DESC LIMIT 2"
def page(where="", args=(), offset=0):
    return list(db.execute("SELECT t,id FROM event "+where+tail+" OFFSET ?", (*args,offset)))
first = page()
print("first", first)
db.execute("INSERT INTO event VALUES(4,6)")
print("offset", page(offset=2))
print("cursor", page("WHERE (t,id)<(?,?)", first[-1]))
print("fresh first", page())
```

最後一行刻意從頭讀，6 號在那裡才應出現。游標不是要把中途新增的項目硬塞入已開始的閱讀，而是維持往舊資料走的方向。若讀者換成只看某個類別，請重新從第一頁開始；沿用舊游標會把新篩選結果裡排在邊界之前的資料跳掉。

### 把「漏一列」也算給自己看

另開一次乾淨練習，這次不是新增 6 號，而是在翻下一頁前移除最新的 5 號。新排序開頭變成 4 號、3 號，位移仍跳過 2 列，從 2 號才開始；3 號既不在第一頁，也不在第二頁。用原本 4 號的時間與編號作邊界就還能接到 3 號。把兩次結果各寫成識別碼清單，比對第一頁和第二頁的交集能抓重複，和原有完整順序比對則能找漏列。不要只查每頁都有 2 筆：數量正確時，資料內容仍然可能接錯。

測試時刻意讓相鄰兩筆擁有相同排序值，再跨頁讀取；如果少了唯一的次排序鍵，單看第一頁很難遇見問題。

## 常見錯誤與小結

不要把「較少重複」說成「永遠不會漏」。例如把排序鍵換成最後編輯時間，舊列編輯後跑到已看過的區域，就可能不再遇到。要產生某一時刻完整無缺的稽核檔，應另外設計一致的讀取視圖。互動清單可以接受新資料稍後再看，帳務匯出未必可以；選法要從讀者的用途往回推。
