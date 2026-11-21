---
id: fd-docker-05-compose
module: fd-docker
order: 7
title: Docker Compose 服務
subtitle: 一個設定啟動兩個服務
status: ready
minutes: 35
level: 3
prereqs:
  - fd-docker-04-volume
objectives:
  - 用服務名稱說明容器之間的連線
  - 以健康狀態而非啟動先後判斷可用
tags:
  - docker
  - compose
resources:
  - title: "Docker：依健康檢查控制啟動順序"
    url: "https://docs.docker.com/compose/how-tos/startup-order/"
    kind: "doc"
    lang: "en"
    minutes: 7
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-docker-compose-ready"
    prompt: "如何讓依賴者在服務健康後才啟動？"
    answer: "替被依賴的服務定義健康檢查，並在依賴者設定 condition 為 service_healthy。"
    mcq:
      question: "哪個條件檢查了應用真的能回首頁？"
      options:
        - "先建立網頁容器"
        - "映像下載完成"
        - "讀取端晚幾秒執行"
        - "網頁容器內請求首頁成功"
      answer: 3
      explain: "只有實際請求測到服務，單憑時間或建立順序都不夠。"
    interview:
      question: "為什麼服務之間不該只加固定的等待時間？"
      points:
        - "啟動時間可變"
        - "檢查實際服務功能"
        - "啟動後故障需另外處理"
      answer: "我會讓供應端用健康檢查試讀首頁，再讓讀取端等它通過。這只保證啟動當下；長時間執行的呼叫端還要能處理後來的中斷。"
  - id: "fd-docker-compose-hostname"
    prompt: "Compose 專案預設網路內用哪個名字找網頁？"
    answer: "用 services 下宣告的服務名稱 page，加上服務內部埠。"
    mcq:
      question: "reader 的目標應寫哪個？"
      options:
        - "localhost:80"
        - "reader:80"
        - "page:80"
        - "compose.yaml:80"
      answer: 2
      explain: "localhost 與 reader 都是呼叫端自己，檔名不是網路名稱。"
  - id: "fd-docker-oneshot-status"
    prompt: "一次性讀取端退出是否代表失敗？"
    answer: "不一定；核對結束碼與輸出，正常完成就應退出。"
    mcq:
      question: "哪組最能證明讀取端完成任務？"
      options:
        - "不論輸出只要仍執行"
        - "退出碼 0 且紀錄有首頁"
        - "只有映像標籤正確"
        - "只看到網路已建立"
      answer: 1
      explain: "狀態要依任務目的解讀，讀完就結束是正確行為。"
practice:
  - id: "fd-docker-05-compose-p1"
    title: "交付可重建的雙服務設定"
    kind: "build"
    minutes: 14
    steps:
      - "在新資料夾儲存設定並先檢查解析"
      - "啟動後把兩個服務的狀態與讀到的網頁標題記在 compose-check.md"
      - "執行 down 並保留 YAML 和筆記"
    checks:
      - "沒有發布主機埠仍讀到首頁"
      - "筆記能區分健康的供應端和正常退出的讀取端"
---

## 為什麼要學：啟動順序正確，第 1 個請求還是失敗？
你已經能讓兩個容器互通，但交接時要同事記住網路名稱、服務名稱和啟動順序，漏一項就無法重現。Docker Compose 用一份設定檔描述一組服務（service），把「環境應該長怎樣」留下來。這堂讓一個讀取端開工前，等另一端真的能回首頁，不靠猜測它大概要睡幾秒。

## 核心概念：從行程存在，到服務就緒
在 `compose.yaml` 中，`services` 下的每個名稱代表一種工作；`image` 選擇執行環境，`command` 可改寫預設工作。Compose 預設為同一專案建立網路，服務名稱就是網路內可用的稱呼。同一份設定從不同資料夾啟動可能形成不同專案，因此本課固定在新資料夾操作，不接手其他人的現有環境。

啟動（started）只說明容器開始執行，就緒（ready）要看服務能不能完成工作。健康檢查（health check）是週期性從容器內執行小測試，成功用結束碼 0 表示。本課測真正的首頁，而非只看主程式還在不在。`depends_on` 的長寫法指定 `service_healthy`，Compose 才會等這項檢查通過再啟動依賴者。

## 範例：一個供應首頁，一個讀取首頁
在 `C:\dev\stackway-lab` 開新的 `sw-compose-read` 資料夾，macOS/Linux 用自己的練習區。建立 `compose.yaml`，縮排用空白。這兩個位址的差別很要緊：健康檢查從網頁容器內問自己；讀取端從另一個容器按服務名稱問它。
```yaml
services:
  page:
    image: nginx:alpine
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://127.0.0.1:80/"]
      interval: 3s
      timeout: 2s
      retries: 10
  reader:
    image: alpine:3
    depends_on:
      page:
        condition: service_healthy
    command: ["wget", "-qO-", "http://page:80/"]
```
在該資料夾用 PowerShell 或 bash 執行。第一行先檢查設定能否解析；後續指令針對同一專案。
```powershell
docker compose config --quiet
docker compose up -d
docker compose ps -a
docker compose logs reader
```
預期網頁服務健康，讀取端的紀錄有 HTML，讀取端執行完以 0 退出；它不是應該常駐的伺服器。若暫時還在執行，稍後再查狀態。最後用 `docker compose down` 收掉本次環境，保留設定檔。整個練習沒有主機入口，請不要用本機瀏覽器能不能打開來評分。

### 讀對退出狀態
如果網頁正常但讀取端退出碼不是 0，先讀讀取端的紀錄，再對照兩個名字：它找的是設定中的服務名，還是誤用了自己所在容器的回送位址？如果讀取端根本沒有開始工作，則應先看網頁服務的健康狀態。兩件事看起來都像「沒有讀到首頁」，卻分別發生在相依條件通過之前和之後，查錯的起點也不一樣。

## 常見錯誤
只寫服務名稱的相依清單，不等同「等到健康」。檢查工具也必須存在於被測的映像裡，在主機安裝工具不能修好容器內的測試。最後，啟動時等過一次不表示服務永遠正常：如果供應端稍後重啟，長時間工作的用戶端仍要自行處理暫時的失敗，不要把固定等待時間當作健康訊號。

## 小結
可交接的不只是指令，還有判定成功的條件：一份設定、兩個角色、各自合適的結束狀態，以及一段能證明它們確實交談過的紀錄。
