---
id: fs-production-05-proxy
module: fs-production
order: 5
title: Caddy 反向代理
subtitle: 一個入口同時服務頁面與 API
status: ready
minutes: 35
level: 4
prereqs:
- fs-production-04-cache
objectives:
- 將靜態頁與 API 對到不同處理端
- 用本機測試請求核對代理前後的路徑與狀態碼
tags:
- production
- proxy
resources:
- title: Caddy：互斥的 handle 分支
  url: https://caddyserver.com/docs/caddyfile/directives/handle
  kind: doc
  lang: en
  minutes: 5
  required: false
  checked: '2026-11-20'
- title: Caddy：反向代理與上游請求
  url: https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
  kind: doc
  lang: en
  minutes: 6
  required: false
  checked: '2026-11-20'
concepts:
- id: fs-production-05-proxy-preserve
  prompt: Caddy 的 handle 與 handle_path 在路徑處理上有何關鍵差別？
  answer: handle 按條件分支但保留路徑；handle_path 會額外去除相符的前綴，須符合後端約定。
  mcq:
    question: 後端只認 /api/slots，希望入口原樣轉送，應選哪個做法？
    options:
    - 無條件剝掉 /api
    - 先把所有請求改成 /index.html
    - 用 handle 匹配 API 再 reverse_proxy
    - 直接用 file_server 開啟 API 名稱
    answer: 2
    explain: 需要保留原始路徑；剝掉前綴或讓靜態檔接手都改變了後端看到的請求。
- id: fs-production-05-proxy-separation
  prompt: 為什麼要將 API 和靜態頁分成互斥的處理分支？
  answer: 避免 API 錯誤被頁面後備規則吞掉，保留狀態碼與回應格式。
  mcq:
    question: /api/missing 在後端回 404，入口回 200 HTML，最值得先查哪裡？
    options:
    - 瀏覽器字型
    - 資料庫的磁碟容量
    - API 的 JSON 是否縮排
    - API 是否落入靜態頁的後備分支
    answer: 3
    explain: 成功 HTML 與預期 API 錯誤不同，先查路徑分流而非美觀或儲存。
- id: fs-production-05-proxy-compare
  prompt: 確認代理有保留路徑，為什麼要測直連和經入口兩次？
  answer: 直連建立後端基準，經入口再比對收到的路徑、狀態碼與內容，才能定位差異。
  interview:
    question: 首頁是好的，API 卻是 502，你如何在本機縮小原因？
    points:
    - 辨認首頁與 API 不同分支
    - 用相同路徑直連後端
    - 查位址、埠與後端是否在聽
    answer: 我會先直連教學後端的同一路徑。若直連也失敗，就先找行程與監聽埠；若直連正常才查代理目的地。首頁成功只證明靜態檔能讀。
practice:
- id: fs-production-05-proxy-p1
  title: 做一張直連與經入口的驗收單
  kind: hands-on
  minutes: 13
  steps:
  - 建立 lab-proxy 的三個檔案，先啟動 Node 後端並量直連 200、404。
  - 已有 Caddy 就啟動代理，以同樣兩個路徑重測，再測首頁；沒有則依規則填預測。
  - 在 proxy-check.txt 分欄記錄實測與預測、狀態、內容格式及後端收到的路徑，結束時按 Ctrl+C。
  checks:
  - 直連好路徑為 JSON 200、錯路徑為 JSON 404。
  - 我沒有把沒有啟動的入口列為實測成功，且首頁不會替 API 回成功頁。
---

## 為什麼要學：同一個位址打開首頁，也查得到剩餘席位

瀏覽器希望用同一個來源讀頁面與 API，應用程式卻可能分成靜態檔案和一個獨立後端。反向代理（reverse proxy）是在服務前面接請求，依規則轉交合適的處理端。它不是讓瀏覽器跳到新的網址；對瀏覽器來說仍是同一個入口。若分流邊界寫錯，最難發現的症狀不是報錯，而是拿到狀態成功卻根本讀不懂的內容。

## 核心概念：先約定後端收到的路徑

這裡規定 `/api` 及其子路徑給後端，其他請求給靜態檔。Caddy 的 `handle` 區塊提供互斥的處理分支；無匹配條件的那個負責其餘請求。`reverse_proxy` 指定上游（upstream），也就是實際回應資料的服務。若沒有其他改寫，請求會帶原來路徑向上游送出。`handle_path` 會拿掉匹配的前綴，不是較短的同義寫法。

## 範例：用 2 支溫度計量同一條路徑

在 `C:\dev\stackway-lab` 建立 `lab-proxy` 及其中的 `site`。在 `site/index.html` 用 UTF-8 存入 `<!doctype html><title>Reserve</title><h1>Reserve desk</h1>`。下面第一段存成 `lab-proxy/api.cjs`，第二段存成無副檔名的 `lab-proxy/Caddyfile`。站台位址用來比對請求；另寫 `bind 127.0.0.1` 才明確限制代理只監聽本機介面。後端也只監聽本機，這不是公開上線或憑證設定教學。

```js
const http = require("node:http");
http.createServer((req, res) => {
  const ok = req.url === "/api/slots";
  res.writeHead(ok ? 200 : 404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ path: req.url, ...(ok ? { seats: 1 } : { error: "not found" }) }));
}).listen(4181, "127.0.0.1");
```

```text
http://127.0.0.1:4180 {
    bind 127.0.0.1
    @api path /api /api/*
    handle @api {
        reverse_proxy 127.0.0.1:4181
    }
    handle {
        root * ./site
        file_server
    }
}
```

在 `lab-proxy` 以 PowerShell 執行 `node api.cjs`。另一個終端機用 `curl.exe -i http://127.0.0.1:4181/api/slots` 直連，改成 `/api/missing` 再測，分別取得 200 與 404。若已安裝 Caddy，在同一目錄的另一個終端機執行 `caddy run --config Caddyfile --adapter caddyfile`，把測試指令中的埠換成 4180 再做兩次，最後用瀏覽器開入口首頁。macOS 或 Linux 將 `curl.exe` 換成 `curl`；其餘測試順序相同。

上游刻意回報它實際看到的路徑，所以不是只看有沒有收到一包 JSON。兩個入口測到的路徑與狀態碼應相同，首頁卻由檔案服務回 HTML。若沒有 Caddy，仍可完成直連並逐條手動對照規則；在驗收單註明後半是預測，不能算入口真的運作。若本機埠已被占用，別停止陌生行程，選一組未用的埠並同步更新設定和測試。

兩條路徑加一個反例才完整：不要只把 `/api/slots` 換成不存在的名稱，還可以在紙上問 `/apix` 應該走哪裡。它不是 API 前綴的一個完整路徑元素，本規則會交給靜態檔服務；即使最終也是找不到檔案，其內容與處理端都不同。驗收單若把「誰回了這個狀態」一併記下，就能避免看到兩個相同錯誤碼便當成同一個故障。

## 常見錯誤

前端要支援深層路徑時，把回首頁的規則套到所有路徑，連不存在的 API 都回一份 HTML。這會讓程式在解析時才失敗，真正的 404 反而不見了。若要加前端後備規則，也只應放在靜態分支內。另一個問題是從別的目錄啟動服務，導致相對的 `./site` 找不到首頁；先確認工作目錄再判斷代理壞了。

## 小結

用相同路徑、相同方法，比對直連與入口的狀態及內容。首頁、正確 API、錯誤 API 都要各測一次：三者是不同承諾，不會因為其中一個成功就全部成立。
