---
id: fd-delivery-02-artifact
module: fd-delivery
order: 2
title: 建置產物與版本
subtitle: 同一份成品逐站發布
status: ready
minutes: 30
level: 3
prereqs:
  - fd-delivery-01-pipeline
objectives:
  - 分辨建置時設定與執行時設定
  - 以版本識別測試與上線是否同一份成品
tags:
  - delivery
  - artifact
resources:
  - title: "GitHub Actions：工作流程產物"
    url: "https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-delivery-02-artifact-identity"
    prompt: "如何確認測試與發布的是同一份檔案內容？"
    answer: "比對同一演算法計算的內容摘要。"
    mcq:
      options:
        - "比對同一演算法計算的內容摘要。"
        - "只看檔名都叫 latest。"
        - "只看檔案大小相同。"
        - "只看兩次建置來源分支相同。"
      answer: 0
      explain: "同名、同大小或同一來源都可能產生不同位元組。"
    interview:
      question: "部署到正式站前再建一次比較乾淨嗎？"
      points:
        - "來源與位元組不同"
        - "推進同一已驗證產物"
        - "執行設定獨立驗收"
      answer: "我會建一次、記下版本和摘要，在測試站驗收後推進同一份檔。若正式站需要不同設定，讓服務啟動時讀，不在最後一刻另外造一份沒測過的成品。"
  - id: "fd-delivery-02-artifact-runtime"
    prompt: "哪種設定可以不改建置產物而逐站調整？"
    answer: "由執行中的伺服器讀取的環境設定"
    mcq:
      options:
        - "已編入瀏覽器程式碼的固定網址"
        - "由執行中的伺服器讀取的環境設定"
        - "已寫進圖片像素的標籤"
        - "已替換進靜態檔的字串常數"
      answer: 1
      explain: "能否逐站調整取決於讀取時機，不取決於變數名稱。"
  - id: "fd-delivery-02-artifact-cache"
    prompt: "依賴套件快取能替代待發布產物嗎？"
    answer: "不能；前者加速建置，後者是要驗收及發布的結果。"
    mcq:
      options:
        - "能；有檔案就等同已通過驗收。"
        - "能；只要快取名稱含版本號。"
        - "不能；前者加速建置，後者是要驗收及發布的結果。"
        - "不能；因為產物永遠不應保存。"
      answer: 2
      explain: "快取可以失效後重建；回復時需要明確保留的已測版本。"
  - id: fd-delivery-02-artifact-trust
    prompt: "發布檔與收據的摘要相同，足以證明來源可信嗎？"
    answer: "不足。摘要用來辨認位元組，還須另確認收據來源與建置、存取的權限。"
practice:
  - id: "fd-delivery-02-artifact-p1"
    title: "留下兩份可比對的發布收據"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 parcel.mjs 並記下兩站摘要"
      - "改動產物中的一個字元再跑"
      - "寫下哪些改變需要重新驗收"
    checks:
      - "同一輪兩站摘要相同但環境標籤不同"
      - "改內容之後摘要改變"
---

## 為什麼要學：同樣叫 release，內容一樣嗎？

測試站驗收過的網頁到了正式站卻顯示舊文案。兩站都從同一個版本建置，檔名也一樣，還是可能用到不同的相依套件、設定或建置時間。建置產物（build artifact）是一次建置實際交付的結果，例如壓縮包、可執行檔或一組靜態檔。承諾「測過才發布」，應追蹤的是這份結果，而不只是產生結果的原始碼。

## 核心概念：製作一次，逐站交接

把來源版本、建置編號與產物摘要（digest）寫在一張收據上。版本方便人討論，內容摘要讓機器辨識位元組有沒有變。用同一個雜湊演算法（hash algorithm）算出相同摘要，是檢查交接內容的一種方式；但摘要本身不證明來源可信，也不證明程式正確。測試紀錄要能連回同一份收據，而不是只寫「某天測試成功」。

建置時設定（build-time configuration）會變成產物的一部分，例如打包時取代瀏覽器程式裡的網址。執行時設定（runtime configuration）則由服務啟動或運作時讀取，例如伺服器要連哪個測試服務。靜態檔一旦交給瀏覽器，不會因主機上的環境變數改變而自己改內容。先找出誰在何時讀設定，再決定同一個產物怎麼跨環境使用。

## 範例：把站名與成品分開列印

在 `C:\dev\stackway-lab\delivery` 建立 `parcel.mjs`，執行 `node parcel.mjs`。腳本以小段位元組代替真實壓縮檔，用相同資料產生兩站的收據。沒有任何一步會連到正式站。

```js
import {createHash} from "node:crypto";
const artifact = Buffer.from("catalog format v1\n");
const digest = data => createHash("sha256").update(data).digest("hex");
for (const site of ["test", "live-model"]) {
  console.log({site, release: "catalog-17", sha256: digest(artifact)});
}
```

改變站名再執行，觀察摘要；再只改內容中的一個字元，保留建置編號不動。後者的摘要不同，正好說明編號如果任人重用就不值得單獨信任。實際交接要由接收端對拿到的檔案重算，而不是把寄件人附的摘要複製到下一張紀錄，就宣告比對成功。

### 讀 2 張幾乎相同的發布單

第一張寫著「測試站通過，建置 17 號」，第二張只寫「正式站，同一個分支」。少的不是一個站名，而是能連回那次驗收的產物身分。即使程式原始碼沒改，若建置時剛好讀到不同的設定，也可能把測試網址包進成品。交接人應能從第二張逆向找回第一張，另外找得到正式站自己那份執行設定。若摘要相同而行為不同，先查兩站的設定與相依服務；若摘要已不同，先承認換了成品，不要假設先前的驗收仍然有效。

## 常見錯誤與小結

套件快取（cache）可以讓下一次安裝變快，但可以隨時重建，不是已通過驗收的成品。不要把工作結束後會消失的暫存目錄當成回復倉庫。至少確定前一個可用版本保留到什麼時候、誰能取回，以及配套的設定是否仍有效。往回走時才能指出要拿哪份成品，而不是臨時再造一個同名版本。
