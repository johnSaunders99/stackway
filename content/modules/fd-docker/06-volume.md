---
id: fd-docker-04-volume
module: fd-docker
order: 6
title: Docker 資料卷
subtitle: 重新建立服務仍保留資料
status: ready
minutes: 35
level: 3
prereqs:
  - fd-docker-05-network
objectives:
  - 辨識應該掛載的資料目錄
  - 用拋棄式樣本驗證重建前後筆數
tags:
  - docker
  - volume
resources:
  - title: "Docker：資料卷的生命週期"
    url: "https://docs.docker.com/engine/storage/volumes/"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-docker-volume-lifetime"
    prompt: "容器移除後，具名資料卷為什麼還讀得到？"
    answer: "卷獨立於容器；新容器掛回同一個卷，便可讀取其中的檔案。"
    mcq:
      question: "新讀取端要找回本例的紀錄，最關鍵的是什麼？"
      options:
        - "使用相同容器名稱"
        - "使用相同埠號"
        - "掛回同一卷並讀取正確路徑"
        - "複製原本的啟動時間"
      answer: 2
      explain: "名稱或埠號不能帶回資料；卷名與路徑才描述來源和位置。"
    interview:
      question: "你怎麼證明不是同一個容器剛好還活著？"
      points:
        - "先記寫入的內容與筆數"
        - "移除原容器"
        - "另一容器掛同名卷唯讀比對"
      answer: "我用可拋棄的寫入端留下兩筆樣本，確認程式結束且容器已移除，再從新容器唯讀掛回資料卷，比對內容和行數。"
  - id: "fd-docker-volume-target"
    prompt: "目的掛載路徑應根據什麼來選？"
    answer: "根據程式實際寫入成果的目錄，而非映像或執行檔名稱。"
    mcq:
      question: "程式只寫在 /ledger，掛哪裡才能保住這些檔案？"
      options:
        - "執行 shell 的目錄"
        - "程式寫入的 ledger 目錄"
        - "主機下載目錄"
        - "任意空目錄"
      answer: 1
      explain: "只掛一個卷不夠，資料必須真的寫進掛載點。"
  - id: "fd-docker-volume-backup"
    prompt: "具名卷和獨立備份差在哪裡？"
    answer: "卷解決重建容器的保存問題，不能單獨防止卷誤寫、誤刪或主機故障。"
    mcq:
      question: "用唯讀掛載重新數到 2 筆，主要證明什麼？"
      options:
        - "新容器可讀取同一卷的樣本"
        - "已有異地副本"
        - "可以還原任意日期"
        - "程式永遠不會寫壞檔案"
      answer: 0
      explain: "重讀同一份資料不是從備份還原。"
practice:
  - id: "fd-docker-04-volume-p1"
    title: "保存一張重建前後的對照單"
    kind: "hands-on"
    minutes: 12
    steps:
      - "選未使用的卷名，只執行一次範例寫入端"
      - "用另一容器唯讀核對內容與筆數"
      - "將卷名、路徑、前後筆數及文字存入 ledger-check.md"
    checks:
      - "前後都是 2 筆，依序為 red、blue"
      - "對照單指出哪個容器已移除、哪份儲存仍存在"
---

## 為什麼要學：服務可以重建，登記簿呢？
假設容器每天登記完成的工作。重新啟動還能看到昨天的清單，不代表移除容器後也看得到。程式適合從映像檔重建，紀錄卻不能從空白範本生出來。你要決定的不是「整個容器要不要備份」，而是哪個目錄的內容屬於工作成果，必須有獨立的生命週期。

## 核心概念：資料的名字和程式看的路徑
資料卷（volume）是由 Docker 管理的儲存空間。具名資料卷（named volume）有穩定的名稱，容器啟動時把它掛載（mount）到程式使用的路徑。名稱在 Docker 這一側，路徑在容器這一側。從程式的觀點仍是普通檔案；從維運的觀點，移除容器不會順手移除這個具名卷。掛載到別的位置，不會讓程式自動改用新位置。

如何決定路徑？先查程式的設定或文件，看它把真正的資料寫去哪裡，別拿執行檔所在的目錄來猜。這次自己控制寫入端，約定它只寫 `/ledger/events.txt`；因此掛載整個 `/ledger`，而不是把其他和成果無關的系統檔案也包進去。

## 範例：先寫、再換容器、最後數行數
在任意資料夾用 PowerShell 或 bash 執行。用 `docker volume ls` 看清單，自選未使用的實驗名稱；若下方名稱已存在，整段一致換名。這裡故意只寫虛構樣本，不拿現有資料卷試驗。
```powershell
docker volume create sw-ledger-sample
docker run --rm --mount type=volume,src=sw-ledger-sample,dst=/ledger alpine:3 sh -c 'echo red >> /ledger/events.txt; echo blue >> /ledger/events.txt; wc -l /ledger/events.txt'
docker run --rm --mount type=volume,src=sw-ledger-sample,dst=/ledger,readonly alpine:3 cat /ledger/events.txt
docker run --rm --mount type=volume,src=sw-ledger-sample,dst=/ledger,readonly alpine:3 wc -l /ledger/events.txt
```
每個 `run --rm` 都建立新容器，程式結束便移除它。寫入端數到 2 行就退出；接手的容器沒有繼承它的可寫層，卻能讀到相同的紅、藍兩筆紀錄。`readonly` 是讓讀取端唯讀掛載，避免你在核對時改動待驗的內容。把文字和計數一起核對，比看到「有一個同名檔」更有說服力。

### 寫下能推翻自己結論的對照
如果新容器不掛這個卷，只從同一個映像檔啟動，它不應憑空擁有這份登記簿。反過來，如果換了映像名稱卻仍掛回同一個卷，而且新程式有權讀取同一個路徑，它未必會失去資料。這組對照能幫你把「程式從哪裡來」和「紀錄存在何處」分開。因為這次的目標不是刪資料，保留這個小樣本卷供比對即可。

## 常見錯誤
這裡用的追加符號會保留舊資料；若再跑一次寫入指令，變成 4 行不是掛載失敗，而是同一份資料又被追加。想從 0 對照就換一個新卷。另一個陷阱是用空的掛載位置遮住映像裡原有內容，便推斷資料遭刪除。容器此刻看見的是掛載後的目錄，應先核對來源卷名與目的路徑。

## 小結
能跨容器保存不等於能跨主機故障復原，更不等於有歷史版本。這次留下卷名、目的路徑、兩次筆數和讀到的內容；若是重要資料，還需要獨立備份及還原驗證。不要用全機清理指令當作實驗的結尾。
