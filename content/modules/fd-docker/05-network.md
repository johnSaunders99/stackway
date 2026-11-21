---
id: fd-docker-05-network
module: fd-docker
order: 5
title: Docker 網路與名稱解析
subtitle: 兩個服務不用記住彼此的位址
status: ready
minutes: 30
level: 3
prereqs:
  - fd-docker-03-ports
objectives:
  - 在自訂網路用服務名稱描述連線
  - 區分容器間互通與發布到主機的連接埠
tags:
  - docker
  - network
resources:
  - title: "Docker：自訂橋接網路與名稱解析"
    url: "https://docs.docker.com/engine/network/drivers/bridge/"
    kind: "doc"
    lang: "en"
    minutes: 7
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-docker-bridge-discovery"
    prompt: "容器間要靠名稱連線，需要什麼條件？"
    answer: "兩者加入同一個自訂網路，使用該網路可解析的名稱及服務的內部埠。"
    mcq:
      question: "讀取容器應把請求送到哪裡？"
      options:
        - "讀取容器的 localhost:80"
        - "同網路內的 sw-page:80"
        - "主機任意未用埠"
        - "網路名稱加上主機埠"
      answer: 1
      explain: "網路名稱不是服務名稱，localhost 也不指向另一個容器。"
    interview:
      question: "為什麼不把資料服務的容器位址寫進設定檔？"
      points:
        - "重建後位址可能改變"
        - "用共同網路與穩定名稱"
        - "從真正的呼叫端檢查"
      answer: "我會把服務接到同一張自訂網路，用可解析的名稱和內部埠。重建後不用去猜位址，再從用它的那個容器確認真的收到回應。"
  - id: "fd-docker-peer-publish"
    prompt: "同一自訂橋接網路內通訊一定需要發布埠嗎？"
    answer: "不需要；發布處理主機入口，成員可直接連到對方有在監聽的內部埠。"
    mcq:
      question: "docker port 沒結果，但另一容器讀到頁面，表示什麼？"
      options:
        - "使用內部網路而非主機入口"
        - "名稱解析失效"
        - "頁面只在主機上"
        - "容器自動發布了所有埠"
      answer: 0
      explain: "內部連通性不等於外部有入口。"
  - id: "fd-docker-lookup-listen"
    prompt: "名稱解析成功後仍連不上，應再查什麼？"
    answer: "核對目的埠及該服務是否就緒、是否在容器網路介面監聽。"
    mcq:
      question: "哪個結果同時測到解析與應用程式回覆？"
      options:
        - "列出網路名稱"
        - "看到容器名稱"
        - "印出本機版號"
        - "在呼叫容器內按名稱取得首頁"
      answer: 3
      explain: "列出設定不會真的送出應用層要求。"
practice:
  - id: "fd-docker-05-network-p1"
    title: "記錄沒有主機入口的成功連線"
    kind: "hands-on"
    minutes: 10
    steps:
      - "建立只供這次練習的網路並執行讀取端"
      - "新增 bridge.md 記下呼叫端、網路、服務名、內部埠及頁面標題"
      - "依正文順序移除本次建立的服務與網路"
    checks:
      - "筆記中的請求由另一容器發出"
      - "同一份紀錄同時有頁面標題與未發布埠的觀察"
---

## 為什麼要學：換了容器，還要改位址嗎？
你準備讓一個小工具讀取另一個服務的首頁。把伺服器當下的數字位址寫死，第一次可能成功，下次重建卻可能指到別處。兩個容器明明在同一臺主機上，用哪個稱呼才能在服務換位置後依然清楚？本課不開主機入口，只從真正的使用者，也就是另一個容器，驗證這條路。

## 核心概念：在同一張網路裡問名字
自訂橋接網路（user-defined bridge network）把本機加入其中的容器接在一起。Docker 提供名稱解析（name resolution），讓網路內的呼叫端依容器名稱或網路別名找到對方目前的位址。名稱回答「在哪裡」，目的埠回答「要找哪個程式」。解析成功不等於程式已開始服務，還要從呼叫端真的送出要求。

每個容器的回送位址都指它自己。因此在工具容器裡寫 `localhost`，不是指你的電腦，也不是指旁邊的網頁容器。指定共同網路、用對方的名字加上容器內部埠，才是這條路的完整描述。不要把主機瀏覽器的走法搬過來；服務間互通並不要求把內部服務也發布給主機。

## 範例：一張只有實驗成員的網路
在任意資料夾用 PowerShell 或 bash 執行。先看 `docker network ls` 和 `docker ps -a`，若下列網路或容器名稱已經存在，選新名稱並同步替換。首次下載官方映像需網路。
```powershell
docker network create sw-bridge-lab
docker run -d --name sw-page --network sw-bridge-lab nginx:alpine
docker run --rm --network sw-bridge-lab alpine:3 wget -qO- http://sw-page:80/
docker port sw-page
```
第二行讓網頁容器加入新網路；第三行另建用完即移除的讀取端。`wget -qO-` 把網頁文字送到終端機，看到歡迎頁的 HTML 就代表「名稱、埠、服務」一起通過檢查。若服務剛啟動還沒就緒，稍候重試第三行。最後一行沒有發布紀錄是預期結果，不代表上一行是從快取讀到的。

### 把故障描述成一條可檢查的敘述
「網路壞了」很難交接，試著改寫成「讀取端在指定網路內能找到網頁容器，但尚未收到首頁」。這樣下一位就知道不必先調主機的防火牆。相反地，若連目的名字都找不到，應先核對兩端加入的網路與拼法；此時去換網頁檔案也不會讓名稱出現。兩種失敗需要的下一個觀察不同。

## 常見錯誤
瀏覽器打不開 `sw-page` 不能推翻容器內的觀察：主機沒有加入這套名稱解析。若工具容器找不到名字，先查看 `docker network inspect sw-bridge-lab` 的成員，而不是隨手加上對外發布。一次性的工具在結束後已退出網路，清單沒有它是正常的；重點是它啟動時有沒有帶同一個網路選項。若錯誤說連線被拒，表示已嘗試連到一個端點，下一步查服務和監聽埠。

## 小結
服務之間的通訊不需要繞到主機的公開入口。在筆記寫下「誰發出要求、透過哪個網路、用什麼名字、連哪個埠」。收尾先停止並移除自己建立的 `sw-page`，再用 `docker network rm sw-bridge-lab` 移除這次的空網路，不碰其他網路。
