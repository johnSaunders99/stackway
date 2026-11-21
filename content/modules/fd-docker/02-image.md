---
id: fd-docker-01-image
module: fd-docker
order: 2
title: 映像檔與容器
subtitle: 映像檔與執行個體
status: ready
minutes: 25
level: 3
prereqs:
  - fd-docker-01-desktop
objectives:
  - 從同一映像建立兩個獨立容器
  - 區分停止程式與刪除資料
tags:
  - docker
  - container
resources:
  - title: "Docker Learn：容器與映像檔"
    url: "https://docs.docker.com/learn/content/what-is-a-container/"
    kind: "doc"
    lang: "en"
    minutes: 7
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-docker-image-instance"
    prompt: "同一映像建立的兩個容器，哪裡相同、哪裡不同？"
    answer: "起始檔案來自相同唯讀範本，容器的可寫層與執行狀態各自獨立。"
    mcq:
      question: "沒有掛載共用儲存時，A 寫入的檔案會在哪裡？"
      options:
        - "基底映像"
        - "所有同標籤容器"
        - "A 的可寫層"
        - "B 的可寫層"
      answer: 2
      explain: "容器不會把執行時的新檔寫回映像。"
    interview:
      question: "重開能看到檔案，重建卻看不到，你怎麼解釋？"
      points:
        - "區分 start 和 run"
        - "指出資料寫在可寫層"
        - "說出應獨立保存的情況"
      answer: "我會先查兩次用的是不是同一個容器。重開會保留原本的可寫層；依同一映像重建則不會帶走那份資料。需要跨重建保存時，我會另外掛載儲存空間。"
  - id: "fd-docker-stopped-layer"
    prompt: "停掉程式與移除容器對可寫層有何不同？"
    answer: "停止會保留可寫層；移除該容器則失去該層。"
    mcq:
      question: "要重跑原本的指令並保留該容器的檔案，該用什麼？"
      options:
        - "docker run 新名稱"
        - "docker start"
        - "docker build"
        - "docker pull"
      answer: 1
      explain: "run 建立另一個體；下載或建置只處理映像。"
  - id: "fd-docker-exited-list"
    prompt: "短程式退出後怎麼找到容器？"
    answer: "用 docker ps -a 列出包含已停止的容器。"
    mcq:
      question: "指令成功後 docker ps 沒有項目，先看什麼？"
      options:
        - "包含已停止容器的清單"
        - "主機的連接埠"
        - "新的映像標籤"
        - "桌面是否有瀏覽器"
      answer: 0
      explain: "成功執行不保證程式持續常駐。"
practice:
  - id: "fd-docker-01-image-p1"
    title: "保留兩個容器的觀察紀錄"
    kind: "hands-on"
    minutes: 10
    steps:
      - "先預測三次輸出再執行範例"
      - "新增 layers.md 寫下實際輸出並標示每次的容器名"
      - "僅在確認是自己剛建的已停止樣本後，用 docker rm 加上這兩個實驗名稱收尾"
    checks:
      - "紀錄依序為 blank、ink、blank"
      - "能指出停止並非刪除資料的那次證據"
---

## 為什麼要學：同一份工具，可以有 2 份工作嗎？
想像你和同事各拿一份空白表格。兩份表格長得相同，但你填了資料，對方那份不會跟著改。映像檔（image）比表格更嚴格：它是唯讀的範本，含有檔案、工具與預設啟動方式。容器（container）則是依範本建立的個體，有自己的名稱、狀態和可寫入的檔案層。今天用一個字證明兩者的界線。

## 核心概念：建立、結束、再次啟動
`docker run` 會建立新容器並啟動程式；本機沒有指定的映像檔時，預設會先下載。冒號後的標籤（tag）是選擇映像版本的名稱，不是容器名稱。`--name` 取的才是這次個體的名字。容器內的主要程式一結束，狀態就變成停止，不代表檔案消失了。`docker start` 重新啟動同一個體，會再次執行它原本的主程式。

可寫層適合短暫工作，不是可靠的資料備份。只要移除這個容器，僅存在該層的檔案就跟著消失；用同一個映像檔再建立，只會拿到範本原先的內容。之後在[〈Docker 資料卷〉](#/lesson/fd-docker-04-volume)會把要保存的資料移出這個生命週期。

## 範例：看第 1 行，而不是只看最後狀態
先確認本機引擎在運作。PowerShell 與 bash 都可在任意資料夾逐行執行下列指令；用的是精簡 Linux 映像，首次需要網路。先用第一行確認沒有下列實驗名稱，若已被占用，把範例中對應的名稱一致換成新名字。
```powershell
docker ps -a --format '{{.Names}}'
docker run --name sw-layer-a alpine:3 sh -c 'if test -f /tmp/mark; then cat /tmp/mark; else echo blank; fi; echo ink > /tmp/mark'
docker start -a sw-layer-a
docker run --name sw-layer-b alpine:3 sh -c 'if test -f /tmp/mark; then cat /tmp/mark; else echo blank; fi'
docker ps -a --filter name=sw-layer
```
`sh -c` 是讓容器內的 shell 解讀後方那段文字；引號使重新導向發生在容器裡，而不是寫到 Windows。第一個容器先報告檔案不存在，印出 `blank`，才寫下 `ink`。再次啟動時，`-a` 讓終端機接收它的輸出，這次讀到了先前的字。最後建立的第二個容器仍印出 `blank`。若兩者共享了可寫層，最後的結果就不會如此。

### 不動容器也能做的預測
若現在再啟動第二個容器，它讀到的會是什麼？答案仍是空白，因為它的主程式只讀、不寫；反過來，再啟動第一個容器仍會印出先前的字。這項預測同時用到了兩個條件：你啟動的是哪個個體，以及那個個體的程式到底做了什麼。只記「重開會保留」卻忽略它從未寫過檔，是很容易做錯的一步。

## 常見錯誤
執行完只看 `docker ps` 會以為「都沒建立」。不帶選項只列執行中的個體，示範的程式做完就退出了。另一種誤判是用相同名稱再 `run`，看到名稱衝突就以為映像被鎖住；真正被保留的是已停止容器的名字。先查清單，不要刪除碰巧同名的其他工作。

## 小結
把「哪一份範本、哪一個容器、哪一層資料」分三欄寫下來。能解釋為什麼中間那次讀得到字，而最後那次讀不到，就能判斷重開程式和重建環境對資料有何不同。
