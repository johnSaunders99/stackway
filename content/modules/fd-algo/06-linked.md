---
id: fd-algo-06-linked
module: fd-algo
order: 6
title: 鏈結串列
subtitle: 抽掉中間一張卡，前後如何接回
status: ready
minutes: 35
level: 2
prereqs:
  - fd-algo-03-queue
objectives:
  - 手繪節點與下一個節點的參照
  - 比較插入、刪除與依位置查找的成本
tags:
  - algo
  - linked
resources:
  - title: 'Open Data Structures：單向鏈結串列'
    url: 'https://opendatastructures.org/ods-python/3_1_SLList_Singly_Linked_Li.html'
    kind: book
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '沿節點圖檢查 head、next 與尾端。'
concepts:
  - id: fd-algo-linked-reach
    prompt: '刪除中間節點時，哪個參照必須更新？'
    answer: '讓它的前驅指向它原本的下一個節點，從頭走就會跳過它。'
    mcq:
      question: 'A 接 B 接 C，若要從 A 跳過 B，應改什麼？'
      options:
        - '將 B 的標籤設空'
        - '將 A 的 next 改指 C'
        - '讓 C 指回 A'
        - '只改暫存名字 B'
      answer: 1
      explain: '走訪依 next 決定，內容空白不等於從路線移除。'
  - id: fd-algo-linked-insert
    prompt: '插入新節點時，為什麼先接住舊後段？'
    answer: '否則覆寫前驅的 next 後可能失去原後段參照，甚至指回新節點本身。'
    mcq:
      question: '插在 A 與 C 中間，哪個順序保留後段？'
      options:
        - '只把 A 指向新卡，不設新卡的下一站'
        - '先讓新卡指 A，再讓 A 指新卡'
        - '先讓 A 指新卡，再用 A 更新後的 next 接到新卡後面'
        - '先讓新卡指 C，再讓 A 指新卡'
      answer: 3
      explain: '新卡先接住 C，再替換 A 的出口。反過來讀已更新的 A.next，取到的會是新卡自己。'
  - id: fd-algo-linked-cost
    prompt: '依位置刪除與已知前驅後刪除，成本差在哪？'
    answer: '已知前驅只需常數次改線；按位置找前驅最壞要從頭線性走訪。'
    interview:
      question: '有人說刪除串列的第 5000 個元素是常數時間，你同意嗎？'
      points:
        - '釐清是否拿到前驅'
        - '區分定位和改線'
        - '考慮頭節點'
      answer: '若只有串列頭和位置，我得先沿線找前驅，不能跳 5000 格。真正只花常數時間的是找到前驅之後的改線；若刪的是頭，更新入口即可。'
practice:
  - id: fd-algo-linked-lab
    title: '畫出拆卡與插卡的三個狀態'
    kind: code
    minutes: 12
    steps:
      - '儲存 linked_cards.py，把三次輸出畫成帶有 next 箭頭的圖，另存圖或文字檔。'
      - '在末尾直接更新 head 來移除第一張卡，再走訪。'
      - '另以 None 當頭呼叫 labels。'
    checks:
      - '原 3 次順序分別有 3、2、3 張，最後一張皆為 ship。'
      - '移除第一張後只剩 review、ship；空頭得到空串列。'
---
## 為什麼要學
把三張任務卡依次接起來，每張卡只寫「做完之後去哪張」。如果中間那張取消了，其後所有卡的內容都不需要複製；只要前一張改指到後一張。這個做法很省搬動，卻也有代價：只拿到第一張時，你不能直接跳到第五張，得順著線索找過去。這是鏈結串列和靠索引取值的陣列很不一樣的地方。

## 核心概念
單向鏈結串列 (singly linked list) 由節點 (node) 接成一條路。每個節點保存資料和指向下一個節點的參照 (reference)。串列頭 (head) 是進入整條路的名字，最後一張的下一站是 `None`。這裡用你已經會的字典代表節點，不另要求學過類別。字典裡存的是下一張本身的參照，不是它的編號，也不是把整張卡內容複製一份。

插入時先讓新節點接住原本的後段，再讓前驅指向它；刪除時，則把前驅的下一站改成目標的下一站。若已持有前驅，這些改線都只動固定數量的參照，是常數時間。若題目只給位置或某張卡的文字，必須從頭尋找前驅，整體最壞仍是線性時間。說「鏈結串列刪除很快」以前，要先交代手上已經拿到什麼。

## 範例：先追箭頭，再改箭頭
開啟 `C:\dev\stackway-lab\algorithms`，將範例另存為 `linked_cards.py`。從起點順著下一個節點追到尾端。先畫要保留的箭頭，再改參照，才不會把後半段意外弄丟。

在該目錄執行：Windows PowerShell 用 `py linked_cards.py`；macOS／Linux 用 `python3 linked_cards.py`。

```python
def node(label, after=None):
    return {"label": label, "next": after}

def labels(head):
    result = []
    while head is not None:
        result.append(head["label"])
        head = head["next"]
    return result

tail = node("ship")
middle = node("check", tail)
head = node("draft", middle)
print(labels(head))
head["next"] = middle["next"]
print(labels(head))
new = node("review", head["next"])
head["next"] = new
print(labels(head))
```

畫三個方框，不要用方框的左右位置代表相鄰；真正表示順序的是箭頭。刪除中間卡時，在第一張通往第二張的箭頭上畫叉，另畫一支通往第三張。第二張可能仍由變數 `middle` 指著，所以「從主路線走不到」並不等於「這個物件立刻不存在」。再次走訪應只得到草稿和出貨。接下來新卡先指向出貨，再讓草稿指向新卡，後段才能完整保留下來。

`labels` 為了讓結果看得到，額外建了輸出串列；這是展示順序的成本；改動鏈結的那兩行並沒有複製節點。刪除頭節點另有一個情況：因為頭前面沒有前驅，須直接更新 `head` 為原頭的下一站。空串列以空值當頭，走訪應立刻回傳空串列，不能先試圖讀取第一張的資料欄位。

## 常見錯誤
若先把前驅改指新卡，再以修改後的前驅尋找「舊後段」，可能讓新卡指回自己而形成圈，走訪不會停。可以從尾端反著安排插入步驟，確保每次改線前還有名字握著需要的後段。也不要只改某個區域變數的名字就以為已經拆開鏈結：下一次從頭能不能走到那張，取決於節點裡的參照。

## 小結
鏈結串列省的是已知位置附近的搬移，不是替你免費找到位置。用一張箭頭圖交代從何進入、哪個節點持有下一站、改完後哪些仍可到達，通常比背插入刪除的複雜度更能說服人。
