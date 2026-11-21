---
id: fd-network-02-connect
module: fd-network
order: 2
title: IP 位址與連接埠
subtitle: 從兩台電腦到一條連線
status: ready
minutes: 25
level: 2
prereqs:
  - fd-network-01-names
objectives:
  - 區分位址與連接埠的用途
  - 用一張圖標出傳送端與接收端
tags:
  - network
  - tcp
resources:
  - title: MDN：連接埠
    url: https://developer.mozilla.org/en-US/docs/Glossary/Port
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-network-port-endpoint
    prompt: 位址和連接埠分別解決什麼問題？
    answer: 位址用來送往網路介面；傳輸協定用埠區別該端的端點。
    mcq:
      question: 兩個 TCP 程式要分別在同一 IP 上獨立監聽，最直接怎麼區分服務？
      options:
        - 同一埠下不同的 URL 路徑
        - 不同的用戶端臨時埠
        - 不同的伺服器監聽埠
        - 同一埠下不同的查詢字串
      answer: 2
      explain: 路徑和查詢要在接到連線後才看得到；用戶端的埠則不是服務的監聽埠。
    interview:
      question: 如何在圖上表示兩個本機程式建立了一條 TCP 連線？
      points:
        - 兩端都有位址與埠
        - 標出監聽端與發起端
        - 兩端看到的方向相反
      answer: 我會把這次輸出的兩組端點各畫一個方框，用箭頭從主動連線的一端指向監聽埠。位址都可以是回送位址；要保留埠號才能看出差別。
  - id: fd-network-loopback-target
    prompt: 另一台電腦輸入 127.0.0.1 會找哪裡？
    answer: 找它自己，不會因為使用相同埠號就連到你的筆電。
    mcq:
      question: 哪個位址適合讓範例只接待本機的連線？
      options:
        - 路由器對外位址
        - 同學電腦的位址
        - 學校網站的位址
        - 127.0.0.1
      answer: 3
      explain: 回送位址不把封包送往其他主機。
  - id: fd-network-client-port
    prompt: 從用戶端改到伺服器看同一條連線，兩端如何改稱？
    answer: 用戶端的本地端點就是伺服器眼中的遠端端點，另一端亦然。
  - id: fd-network-ephemeral-bind
    prompt: 範例裡綁定埠 0，為什麼實際連線的目的埠不是 0？
    answer: 綁定 0 是請作業系統挑一個可用埠；用戶端要使用綁定後取得的實際端點。
    mcq:
      question: 監聽程式綁定回送位址和埠 0 後，用戶端該用哪個埠？
      options:
        - 永遠固定為 0
        - 預設的 HTTP 埠
        - 監聽端取得的實際埠
        - 用戶端自己分到的來源埠
      answer: 2
      explain: 0 是分配請求，不是服務公布的目的埠；用戶端的來源埠則屬於另一端。
practice:
  - id: fd-network-b04-02-p1
    title: 畫出交換視角的兩行端點
    kind: build
    minutes: 12
    steps:
      - 儲存並執行 endpoints.py，把第一行畫成一條有向線
      - 用第二行核對並在筆記標上本地端與遠端
      - 再跑一次，註記哪些數字不應寫死
    checks:
      - 圖上有兩組實際位址與埠
      - 換到伺服器視角時，本地埠等於第一行的目的埠
---

## 為什麼同一台電腦能同時提供 2 種服務？

把筆電當成一間教室：找到教室，不代表找到今天負責收作業的人。網際網路位址 (IP address) 用來把資料送向某個網路介面；連接埠 (port) 是傳輸協定用來區分端點的數字。知道目的地的位址，還得知道要以哪個協定找哪個埠。埠不是電腦外殼上的插槽，也不是檔案系統裡的資料夾。

## 誰先等，誰先說話

伺服器 (server) 先在指定的位址和埠上監聽 (listen)，意思是準備接待連線。用戶端 (client) 主動要求連線；它也有本地埠，通常由作業系統臨時分配，不必和服務埠相同。回應不是寄往一個籠統的「用戶端」，而是沿著已建立的連線回去。兩個程式可以同在一台電腦上；這裡的角色是依行為區分，不是依設備大小區分。

`127.0.0.1` 是回送位址 (loopback address)，表示這台電腦自己。隔壁同學即使輸入完全相同的數字，找的也是對方自己的機器。下面使用 TCP，也就是先建立連線、再依序交換位元組的傳輸協定；之後在[〈TCP 與 UDP〉](#/lesson/fd-network-03-transport)會細講它提供哪些保證。

## 範例：印出一條真的本機連線

若 PowerShell 找不到 `py`，先完成[〈Windows 安裝 Python〉](#/lesson/fd-python-01-interpreter)的環境確認，再回來照著執行。這堂課只要認出輸出的兩個端點，不要求你已經會寫網路程式。

把位址和連接埠寫成一對。先預測只改其中一項，會讓請求送往哪一個不同的入口。在檔案總管建立 `C:\dev\stackway-lab\network`，將範例存成裡面的 `endpoints.py`。

在該目錄執行：Windows PowerShell 用 `py endpoints.py`；macOS／Linux 用 `python3 endpoints.py`。

```python
import socket

with socket.socket() as listener, socket.socket() as client:
    listener.bind(("127.0.0.1", 0))
    listener.listen()
    client.connect(listener.getsockname())
    with listener.accept()[0] as peer:
        print("client", client.getsockname(), "->", client.getpeername())
        print("server", peer.getsockname(), "->", peer.getpeername())
```

不用先學會寫這段 Python 才能觀察。數字 0 是請系統挑一個可用的服務埠，不是叫用戶端連到 0 號埠。第一行輸出的左側是發起端，右側是接待端；第二行改從接待端看，剛才的兩個端點交換了位置。離開程式就關閉這次用到的連線，不會留一個服務在背景等待。

### 畫圖時保留箭頭

把第一行畫成一個箭頭，箭尾寫「來源位址：來源埠」，箭頭前端寫「目的位址：目的埠」。在第二行圈出相同的兩個埠。再跑一次，埠號可能不同，卻不影響圖的結構。現在想像另一個用戶端也來連：服務端不必更換招牌，只要能區別來自不同來源的連線，就能在同一個監聽埠接待不只一個訪客。

若要把這張圖交給同學，寫下「這是本機實驗」比只抄一個數字重要。把你的回送位址當成對外公布的地址，對方會敲錯門；反過來，為了證明你看懂了端點，也完全不需要把練習服務開放到家裡的網路。

## 常見錯誤

把網址的路徑當作埠，例如把斜線後的數字讀成服務埠。明寫埠時，它在主機後以冒號分開。網址沒明寫也不代表沒有埠，工具可按協定採用預設值。另一個誤會是覺得連過一次就永遠有人監聽；這個範例已經結束，再找同一組數字不能沿用先前成功的結論。

## 小結

先標兩端，再說方向。當你能解釋為什麼兩行的位址一樣、埠號卻對調，就能從連線紀錄認出誰發起、誰接待。
