---
id: fd-network-08-versions
module: fd-network
order: 8
title: HTTP/2 與 HTTP/3
subtitle: 多個請求如何共享一條連線
status: ready
minutes: 25
level: 2
prereqs:
  - fd-network-04-tls
objectives:
  - 分辨 HTTP 語意與底層傳輸
  - 比較 HTTP/2 的多工和 HTTP/3 使用的 QUIC
tags:
  - network
  - versions
resources:
  - title: MDN：HTTP 的演進
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: IETF：HTTP/3 的傳輸設計
    url: https://www.rfc-editor.org/rfc/rfc9114.html
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
    note: 讀第 2 節，對照 QUIC 串流與 HTTP 語意。
concepts:
  - id: fd-network-version-semantics
    prompt: HTTP 升版後，404 的意思會改變嗎？
    answer: 不會；方法與狀態的語意和承載方式分開。
    mcq:
      question: 從 HTTP/2 換成 HTTP/3，哪項應保留？
      options:
        - GET 與 404 的語意
        - 底層一定使用 TCP
        - 每條串流一定同時完成
        - 每次載入耗時完全相同
      answer: 0
      explain: 語意被保留；傳輸與耗時可以改變。
    interview:
      question: 一張大圖掉了一段，為什麼兩版的等待情形可能不同？
      points:
        - HTTP/2 多工仍用 TCP
        - TCP 依序交付
        - QUIC 將順序按串流區分
      answer: 兩版都能多工，但 HTTP/2 下方只有 1 條有序位元組流，有缺口時其他資料也可能卡住。HTTP/3 用 QUIC，不同串流不必為那個順序缺口一起等；我不會因此保證整頁必然更快。
  - id: fd-network-h2-streams
    prompt: HTTP/2 的多工指什麼？
    answer: 多條串流可把訊框交錯送過同一條 TCP 連線。
    mcq:
      question: 三筆 HTTP/2 請求意味著什麼？
      options:
        - 一定建立 3 條 TCP 連線
        - 可能共用連線的不同串流
        - 必定只有一份回應
        - 必須前一份傳完才可送下一份
      answer: 1
      explain: 多工區分串流，不合併請求語意，也不要求逐份送完。
  - id: fd-network-quic-loss
    prompt: QUIC 如何減少跨串流的阻塞？
    answer: 按串流處理交付順序；獨立串流不必因另一串流的缺口等待同一條 TCP 位元組序列。
    mcq:
      question: HTTP/3 中，哪一層負責在資料報之上補足可靠串流？
      options:
        - UDP 本身按序補送
        - 另一條承載所有串流的 TCP 連線
        - QUIC 的串流與遺失復原機制
        - 靠 HTTP 狀態碼替每段內容補送
      answer: 2
      explain: 資料報本身沒有可靠順序，這裡由 QUIC 提供。
practice:
  - id: fd-network-b04-08-p1
    title: 分開保存協定與狀態
    kind: hands-on
    minutes: 8
    steps:
      - 開啟 Protocol 欄並選主文件；離線則選正文中的模擬收據，明確標成樣本
      - 在 protocol-note.md 記下協定、狀態與觀察方式，沒有值就照實填寫
      - 在下面畫兩條串流，註記丟掉一段時各版本的差異
    checks:
      - 紀錄沒有把狀態碼當版本
      - 同時說明了 QUIC 仍可提供可靠交付與不能保證整頁更快
---

## 一頁網站，不只 1 張收據

一頁圖文說明可能需要主文件、樣式和插圖。每一項都能有自己的方法、路徑和回應狀態；問題是這些交換怎樣穿過同一條網路連線。如果看到 3 筆請求，就認定瀏覽器建立了 3 條連線，會把應用層的單位和底下的傳輸單位混在一起。

## 語意保留，送法可以換

HTTP 語意 (semantics) 描述 GET 是什麼、狀態碼表示什麼、標頭怎樣影響回應。HTTP/2 與 HTTP/3 沿用這些語意；換版本不會把查無資源的 404 變成成功的 200。不同的是如何編碼與運送。在 HTTP/2 中，一次交換可在自己的串流 (stream) 上進行；不同串流的訊框 (frame) 可以交錯送出。這種共用一條連線交錯傳送的做法叫多工 (multiplexing)。

HTTP/2 在 TCP 上運作。底下仍是一條按序交付的位元組串流；中間一段遺失，後面即使屬於另一張圖片，也可能得等缺口補上。HTTP/3 改用建立在 UDP 上的 QUIC，讓可靠性與順序的處理能區分不同串流。某條串流的資料遺失，不必因為單一共用位元組序列的缺口，強迫另一條獨立串流跟著等。這不是關掉可靠傳輸；同條串流該按序到齊的資料依然需要處理。

## 範例：在公開文件分清楚 2 種欄位

在 Chrome 或 Edge 開本課的 MDN 延伸資源。按 F12 到網路 (Network) 面板，在請求表格的欄位標題按右鍵，勾選 Protocol，再重整頁面。先選主文件，而不是某個圖示。記下這次看到的協定和狀態，它們是同一列上的不同欄。請勿為了讓欄位出現指定結果而修改瀏覽器設定。

在同一頁的開發者工具主控台 (Console) 手動輸入下面一行，Windows、macOS 與 Linux 相同，不需檔案。這是向瀏覽器詢問本次文件導覽紀錄，不會送出新請求。

```js
performance.getEntriesByType("navigation")[0]?.nextHopProtocol
```

`h2` 是 HTTP/2，`h3` 是 HTTP/3；有時看到 HTTP/1.1 或空值。空值表示這個觀察欄位沒有提供版本，不等於連線失敗。離線時用這張模擬收據練習：「文件 h2／200；樣式 h2／404」。兩個版本相同、狀態不同；只憑這兩列還不知道是否同一條連線。請在筆記標成樣本，不必開網頁也能判讀。重新整理後結果也可能不同，取決於兩端支援、網路條件與中間服務。把「我這次看見的版本」和「這個版本的傳輸特性」寫在不同欄，就不會把一次觀察當成全球網站的設定。

假設文件與樣式兩列都標成同一個版本，但前者成功、後者查無資源。此時要找走失的樣式檔，應該核對請求路徑和狀態，而不是因為兩列版本相同就斷言兩個請求都成功。

## 常見錯誤

把網路面板同時出現的幾條時間線當作同一條連線的證明。欄位最多先告訴你版本；若要證明共用哪條連線，還需要連線識別等其他資料。也不要用一次重新整理的總毫秒數宣布新版比較快；快取、內容量與路徑都可能不同。多工是能力，不是保證每張圖片同時完成。

## 小結

用同一張收據回答兩個層次的問題：「回的是不是我要的內容？」看 HTTP 語意；「遺失一段資料會讓誰等待？」再看這次採用的傳輸方式。
