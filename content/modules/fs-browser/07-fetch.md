---
id: fs-browser-03-fetch
module: fs-browser
order: 7
title: fetch 與 HTTP 錯誤
subtitle: 資料還沒來時畫面做什麼
status: ready
minutes: 30
level: 3
prereqs:
  - fs-browser-06-loop
objectives:
  - 顯示載入、成功與空結果
  - 分辨網路失敗與 HTTP 錯誤
tags:
  - browser
  - fetch
resources:
  - title: "MDN：使用 Fetch API"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-03-fetch-status
    prompt: "fetch 收到 404 時，第一個 await 通常得到什麼？"
    answer: "得到帶 404 狀態的 Response；成功取得回應不等於資源存在。"
    mcq:
      options:
        - "自動變成空陣列"
        - "一個 Response"
        - "一定拋出網路例外"
        - "已解析的 JSON"
      answer: 1
      explain: "HTTP 錯誤仍可能有完整回應，應先看 ok 或 status。"
    interview:
      question: "使用者都說「沒看到資料」，怎麼分辨是 404、空清單或連不上？"
      points:
        - "取得回應後先看 HTTP 狀態"
        - "成功解析才判斷是否為空"
        - "沒有 Response 就不編造狀態碼"
      answer: "我會把載入、HTTP 失敗、內容異常與空結果分開。用存在、空白清單和不存在的檔名各走一次，再停掉本機服務測一次；每種情況應有能指向下一步的文字。"
  - id: fs-browser-03-fetch-body
    prompt: "為什麼拿到 Response 後還要等待 json()？"
    answer: "回應標頭與內容讀完是不同時刻；json() 回傳讀完並解析內容的 Promise。"
    mcq:
      options:
        - "還要讀取及解析內容"
        - "它要重新送一次 GET"
        - "它只檢查狀態碼"
        - "陣列一定存放在標頭裡"
      answer: 0
      explain: "資料仍可能在傳輸，或內容根本不是合法 JSON。"
  - id: fs-browser-03-fetch-empty
    prompt: "200 回傳空陣列該顯示什麼？"
    answer: "查詢已成功但沒有項目，應顯示空結果，而不是繼續載入或顯示連線失敗。"
    mcq:
      options:
        - "網路中斷"
        - "檔案必然不存在"
        - "永遠維持載入中"
        - "目前沒有項目"
      answer: 3
      explain: "空陣列仍是合法資料，與傳輸失敗分屬不同狀態。"
  - id: fs-browser-03-fetch-fault
    prompt: "未取得可使用的回應，就能斷言伺服器回了 500 嗎？"
    answer: "不能；沒有狀態碼就不應捏造狀態，應描述無法取得回應。"
practice:
  - id: fs-browser-03-fetch-lab
    title: "保留四種結果的查詢頁"
    kind: code
    minutes: 14
    steps:
      - "建立 fetch.html 與 bins.json，在專用資料夾啟動本機服務。"
      - "依序測試有項目、空陣列、缺檔；最後停掉服務，在已開頁面再按讀取。"
    checks:
      - "有資料與空結果的訊息不同。"
      - "缺檔顯示 HTTP 404，停止服務後則不會出現虛構的狀態碼。"
---

## 為什麼要學：沒有列出資料，可以有完全不同的原因

查詢庫位時畫面空白，可能正在等、貨架本來就空、檔案找不到，或伺服器根本沒有回應。若通通顯示「沒有項目」，使用者就不知道要等、要補資料，還是要檢查連線。這堂做一個可以自己切換輸入的查詢頁，不依賴公開服務今天剛好在線。

## 核心概念：分清收到回應與讀懂資料

瀏覽器用 `fetch` 發出請求（request）。等待它通常先取得回應（response），可以看狀態碼，內容卻不一定已讀完。`response.ok` 反映狀態碼是否落在 200 到 299；收到 404 也代表確實有伺服器回答，不是連不上。接著等待 `response.json()` 才能取得解析後的值，這步也可能因格式不對而失敗。

為了不讓「載入中」蓋過最後的訊息，順序固定：開始時清掉舊結果，讀取期間只送一筆，完成後依結果顯示文字並恢復按鈕。之後在[〈請求競爭與過期回應〉](#/lesson/fs-browser-04-race)會讓多筆同時在途，那時就需要額外判斷誰有權改畫面。

## 範例：用自己的資料夾當服務

在練習區建立新的 `fetch-lab`，存一個 `bins.json`，內容是 `["A2","B1"]`。同一資料夾存入下面的 `fetch.html`。在該目錄用 PowerShell 執行 `py -m http.server 8765 --bind 127.0.0.1`，其他系統用 `python3 -m http.server 8765 --bind 127.0.0.1`。瀏覽器網址列輸入 `http://127.0.0.1:8765/fetch.html`；這個服務只對自己的電腦開放。

```html
<!doctype html>
<meta charset="utf-8">
<title>庫位查詢</title><button>讀取</button><output></output>
<script>
const btn = document.querySelector("button"), out = document.querySelector("output");
btn.onclick = async () => {
  btn.disabled = true;
  out.textContent = "讀取中";
  try {
    let res;
    try { res = await fetch("bins.json", { cache: "no-store" }); }
    catch { out.textContent = "無法取得回應"; return; }
    if (!res.ok) { out.textContent = "HTTP " + res.status; return; }
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.every(x => typeof x === "string"))
      throw new Error("unexpected rows");
    out.textContent = rows.length ? rows.join("、") : "目前沒有庫位";
  } catch { out.textContent = "內容無法讀取"; }
  finally { btn.disabled = false; }
};
</script>
```

先按一次，再將資料檔內容改成 `[]`，存檔後在同一頁再按一次。下一輪把資料檔暫時改名，測完再改回來。最後在服務的終端機按 Ctrl+C，保留瀏覽器已開啟的頁面，別重新整理，直接再按一次才能觀察請求失敗。每輪只改一個條件，才知道是哪一層出了變化。

### 把訊息寫給下一位要處理的人

查無檔案時，修正檔名的人需要看狀態碼；查詢成功但沒有庫位時，要做的是新增庫位，不是修網路。你還可以在資料檔只放一個空物件，保留合法的格式，卻故意不給陣列。若頁面把它當成 0 筆，就證明程式把「是否符合資料約定」和「陣列有多長」混在一起了。實驗後把資料檔恢復，保留每種輸入對應的那一句訊息。即使沒有開發工具，使用者只看頁面也應能分辨下一步該重試連線、修正資料還是繼續正常操作。這次觀察的是回應契約，不只是讀檔成功與否。

## 常見錯誤

直接雙擊頁面是以本機檔案方式開啟，不等於從同一個網站取得資料；用網址列確認來源。也不要拿伺服器回的錯誤頁硬做 JSON 解析，否則會把真正的缺檔問題說成格式錯誤。即使內容能解析，物件和字串陣列也不是同一種清單。

## 小結

回應狀態、內容格式、資料筆數分別回答不同的問題。把這三關依序檢查，空畫面就能變成一組可驗證、可告知使用者的結果。
