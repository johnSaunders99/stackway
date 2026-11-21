---
id: fd-network-03-transport
module: fd-network
order: 3
title: TCP 與 UDP
subtitle: 送達順序是誰負責的
status: ready
minutes: 30
level: 2
prereqs:
  - fd-network-02-connect
objectives:
  - 比較可靠位元流與資料報的交付特性
  - 為文字傳輸與即時通話各解釋一次選擇
tags:
  - network
  - transport
resources:
  - title: MDN：TCP 的交付特性
    url: https://developer.mozilla.org/en-US/docs/Glossary/TCP
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: MDN：UDP 資料報
    url: https://developer.mozilla.org/en-US/docs/Glossary/UDP
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-network-stream-boundary
    prompt: TCP 如何保留順序？會保留每次寫入的邊界嗎？
    answer: 交付按序的位元組，但不保留應用程式的寫入邊界。
    mcq:
      question: 用 TCP 傳兩行文字，接收端怎樣可靠地分行？
      options:
        - 把每次讀取當一行
        - 假設每個封包都是一行
        - 每等 1 秒切一次
        - 依約定的換行符號切分
      answer: 3
      explain: 訊息邊界由應用程式約定，不能依傳輸切片或到達時間猜。
    interview:
      question: 下載文字和即時語音，你會怎樣比較傳輸需求？
      points:
        - 文字完整且按序
        - 語音有播放期限
        - 說出上層責任
      answer: 文字少一個字都可能改變意思，我會用可靠串流並自己切句。語音則要先訂播放延遲上限，序號可以幫忙認出缺段，但不一定值得等它補齊。
  - id: fd-network-datagram-delivery
    prompt: UDP 的資料報保留什麼，又缺少什麼保證？
    answer: 保留單筆邊界，但可能遺失、重複或順序顛倒。
    mcq:
      question: 單靠 UDP 可依賴哪項特性？
      options:
        - 交付時仍區分資料報
        - 資料必定全部到齊
        - 依送出順序交付
        - 同一筆不會重複
      answer: 0
      explain: 資料報是單筆訊息；其他條件需要上層機制。
  - id: fd-network-audio-deadline
    prompt: 即時語音為何不一定要等待每一段重送？
    answer: 超過播放期限的聲音可能已無用，無限等候會拖慢後面的對話。
practice:
  - id: fd-network-b04-03-p1
    title: 留下兩種交付的對照紀錄
    kind: hands-on
    minutes: 10
    steps:
      - 執行 delivery.py，記下菜名與缺少的序號
      - 改變前兩段文字的切點但不改拼字，再執行
      - 在程式末尾用註解為菜單與語音各寫一項不可妥協的要求
    checks:
      - 切點改了，兩個菜名不變
      - 我能分別指出一筆重複與一筆遺失
---

## 少一個字，和晚 1 秒鐘

下載菜單時，你不希望「不加糖」少了第一個字；講電話時，卻不想等上一句補齊，讓下一句也跟著遲到。這不是哪種網路比較高級，而是兩種工作對「交付」有不同要求。先說明什麼算成功，再來選傳輸協定 (transport protocol)。

## 一條連續的帶子，或一封一封的信

傳輸控制協定 (TCP) 把連線上的資料交付成按順序排列的位元組串流 (byte stream)。底下傳送的片段可能遺失或顛倒，協定會嘗試補送與重排。讀取端拿到的是連續的內容，沒有「這裡是第一次寫入的結尾」這種附註。程式自己約定用換行或長度欄位切開訊息。若連線終究失敗，程式還是得處理錯誤；可靠不等於永遠成功。

使用者資料報協定 (UDP) 交付的是一封一封的資料報 (datagram)。每一封保有邊界，但協定不保證抵達、不保證順序，也不負責消掉重複項目。可以在內容加上序號，讓接收端知道這是第幾封；是否補送或直接跳過，取決於上層程式。如果這段聲音的播放時間已過，補上一個太遲的音節可能比短暫留白更擾人。

## 範例：讓同樣的字走 2 種閱讀規則

開啟 `C:\dev\stackway-lab\network`，將範例另存為 `delivery.py`。先想像有資料延遲或順序互換。要由傳輸層保證的事與應用程式自己要處理的事，分別記在哪裡？

在該目錄執行：Windows PowerShell 用 `py delivery.py`；macOS／Linux 用 `python3 delivery.py`。

```python
writes = [b"TE", b"A\n", b"RICE\n"]
stream = b"".join(writes)
print("lines:", stream.splitlines())
arrivals = [(3, "C"), (1, "A"), (3, "C")]
print("arrival:", [number for number, sound in arrivals])
print("missing:", sorted({1, 2, 3} - {n for n, sound in arrivals}))
```

這是紙上推演的程式版，沒有送出封包。第一行把三次寫入接起來，以換行切出兩道菜；刻意把茶的拼字拆開，不會改變收件人讀到的菜名。第二組是已給定的抵達紀錄。照抵達順序，你會先看見 3，再看見一，3 還重複一次。程式標出缺 2，沒有把它變出來；練習的是「如何描述現在手上的證據」。

### 把數字換成產品決定

假設這三項不是聲音，而是下單的三個欄位。缺少數量時送出整張單，就算其餘兩欄都沒錯，也不是一筆完整的訂單。此時等資料齊全再交付可能比較合理。反之，語音可以使用有期限的等待，不能因為追求完整而無限制堆積延遲。兩者都要處理錯誤，只是對錯誤的容忍方式不同。

判讀第二行時要把「目前看不到 2 號」和「2 號永遠不會到」分開。序號能提供缺口的證據，卻不能預言未來；什麼時候停止等待，要由播放端的期限決定。

## 常見錯誤

以為一次寫入就會對應一次讀取，常會在短句測試通過、長句卻被拆開時才露餡。也不要看到 UDP 就寫「一定比較快」：協定少做一些事，不表示當下的路徑更短或一定來得及播放。一次恰好照順序的測試，也不能替協定新增保證。

## 小結

保留順序、保留訊息邊界、趕上期限，是三個不同的問題。選擇前先指出哪一項是這個服務不能犧牲的條件。
