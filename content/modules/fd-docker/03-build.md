---
id: fd-docker-02-build
module: fd-docker
order: 3
title: Dockerfile 與建置層
subtitle: 逐層組出小工具
status: ready
minutes: 30
level: 3
prereqs:
  - fd-docker-01-image
objectives:
  - 為相依套件與原始碼安排建置順序
  - 預測只改一行程式會重建哪些層
tags:
  - docker
  - dockerfile
resources:
  - title: "Docker：建置快取與指令順序"
    url: "https://docs.docker.com/build/cache/optimize/"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-docker-cache-chain"
    prompt: "只改 note.py 時，為什麼安裝步驟可以重用？"
    answer: "該步驟只依賴之前的基底與清單；程式在安裝後才複製進來。"
    mcq:
      question: "哪個順序避免改程式時重裝套件？"
      options:
        - "複製整個專案、安裝"
        - "複製程式、複製清單、安裝"
        - "安裝、建立清單、複製程式"
        - "複製清單、安裝、複製程式"
      answer: 3
      explain: "要把安裝需要的輸入放前面，無關且常變的輸入留在後面。"
    interview:
      question: "改了一行程式卻重新安裝所有套件，你會看哪裡？"
      points:
        - "找第一個未命中快取的步驟"
        - "拆開相依清單與原始碼"
        - "用第二次建置的紀錄確認"
      answer: "我先找安裝步驟前複製了哪些檔案。如果整個專案都在那裡，我會把清單獨立複製，裝完才複製程式，再只改程式驗證安裝步驟被重用。"
  - id: "fd-docker-build-run-time"
    prompt: "RUN 與 CMD 何時執行？"
    answer: "RUN 在建置時執行；CMD 設定容器啟動時的預設指令。"
    mcq:
      question: "哪個步驟會在新容器啟動時印出文字？"
      options:
        - "COPY 程式檔"
        - "選擇 FROM"
        - "CMD 指定的程式"
        - "設定 WORKDIR"
      answer: 2
      explain: "寫入檔案和記錄目錄都不等於執行應用程式。"
  - id: "fd-docker-context-dot"
    prompt: "build 最後的點號代表什麼？"
    answer: "目前資料夾是這次的建置範圍，COPY 從此取用檔案。"
    mcq:
      question: "Dockerfile 找得到，COPY 卻找不到檔案，先核對什麼？"
      options:
        - "容器有沒有發布連接埠"
        - "檔案是否在建置範圍內"
        - "腳本有沒有印文字"
        - "映像是否已執行"
      answer: 1
      explain: "這是建置階段的輸入問題，尚未啟動容器。"
practice:
  - id: "fd-docker-02-build-p1"
    title: "留下可重建的小工具"
    kind: "build"
    minutes: 12
    steps:
      - "建立範例的三個檔案並完成第一次建置"
      - "只改輸出文字再建置，把兩次安裝步驟的狀態寫入 cache.md"
      - "執行新映像並記下輸出"
    checks:
      - "資料夾內能找到配方與兩個輸入檔"
      - "第二次執行印出 second，紀錄指出哪一步用了快取"
---

## 為什麼要學：改一句問候，為什麼又裝套件？
把小工具裝進容器後，你只改了顯示文字，建置卻又從頭安裝相依套件。這不只是等待時間的問題：一次改動牽連太多步驟，你就很難看出是哪個輸入改變了環境。Dockerfile 是交給建置器的配方。它的順序同時描述「下一步需要什麼」和「什麼改變時必須重做」。

## 核心概念：從檔案的變動頻率排順序
`FROM` 選起點；`WORKDIR` 設定後續指令的工作目錄；`COPY` 從建置範圍（build context）取檔；`RUN` 在建置期間執行指令，留下檔案變動。`CMD` 不會當場執行，它記錄容器日後預設要跑的程式。這樣，裝套件和使用套件是不同的時刻。

建置快取（build cache）讓先前的步驟結果可以重用。以這個單階段配方來說，只要某個複製步驟的輸入內容不同，依賴該結果的後續步驟也要重新求值；檔名不變不等於內容不變。套件清單通常比程式少改，因此先複製清單、安裝套件，最後才複製程式。若一開始就把整個資料夾複製進去，改一句問候也會影響安裝步驟的輸入。

## 範例：讓 2 次建置自己說話
在練習區 `C:\dev\stackway-lab` 新開空資料夾 `build-note`；其他系統在自己的練習區做同樣的事。用編輯器建立三個檔案：`requirements.txt` 先只寫一行 `# no external packages`；`note.py` 寫 `print("first")`；`Dockerfile` 沒有副檔名，內容如下。用空清單是為了觀察安裝步驟，不必另外選擇第三方套件。
```dockerfile
FROM python:3-slim
WORKDIR /work
COPY requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt
COPY note.py .
CMD ["python", "note.py"]
```
在這三個檔案所在的目錄開 PowerShell 或 bash，兩者指令相同。點號是交給建置器的範圍，不是映像名稱的一部分。
```powershell
docker build --progress=plain -t sw-build-note:lab .
docker run --rm sw-build-note:lab
```
把程式的 `first` 改成 `second`，保留清單及基底映像不變，再執行上方兩行。比對紀錄中的安裝步驟與複製程式步驟：前者應能看到 `CACHED`，後者讀進新的程式。`--no-cache-dir` 只關閉套件工具自身的下載快取，並沒有禁止 Docker 使用建置快取。

### 換一個輸入做反向推論
若改的不是程式，而是清單裡的一行註解呢？即使它沒有要求安裝新套件，清單本身的內容已經不同，建置器不能假設這個輸入變動無關緊要。先在筆記指出最早會重新處理的那條指令，再比較與「只改程式」的預測有何不同。這也說明為什麼有些顯示快取命中的層最後仍能組出一個行為不同的新映像。

## 常見錯誤
找不到要複製的檔案時，先對照檔名、目前目錄和最後的點號；不要把整個家目錄當範圍。若第二次也全部重建，先看最早變動的步驟，確認沒有清除快取或切換建置器。標籤可移動；這個小實驗示範順序，不保證不同日期取得完全相同的基底。

## 小結
一張好的配方不只跑得起來，還能預測改動的影響。把最常修改的檔案放在真正需要它的那一步，再用建置紀錄驗證你的預測。
