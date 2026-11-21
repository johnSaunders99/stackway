---
id: fd-docker-01-desktop
module: fd-docker
order: 1
title: Docker Desktop 起步
subtitle: 先確認引擎真的能回應
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 辨認 Docker Desktop、CLI 與引擎的位置
  - 確認 Windows 的 WSL 2 條件，將啟動失敗與指令拼錯分開
tags:
  - docker
  - desktop
resources:
  - title: "Docker：Windows 安裝與 WSL 條件"
    url: "https://docs.docker.com/desktop/setup/install/windows-install/"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-docker-client-engine"
    prompt: "用戶端與引擎各自負責什麼？"
    answer: "用戶端送出要求；引擎建立及管理容器，並回傳執行結果。"
    mcq:
      question: "哪個結果證明選定的引擎回覆了？"
      options:
        - "桌面有捷徑"
        - "docker version 列出 Server 區段"
        - "docker --version 印出數字"
        - "終端機成功開啟"
      answer: 1
      explain: "其餘結果最多證明程式或終端機存在，並未收到服務端的回覆。"
    interview:
      question: "同事說 Docker 裝好了卻不能跑，你先收集哪些證據？"
      points:
        - "區分找不到指令與連線失敗"
        - "說出 Server 回覆的意義"
        - "核對本機連線設定與後端狀態"
      answer: "我先看用戶端能不能印版號，再看 docker version 有沒有本機 Server 回覆。若只有 Client，我會核對目前選的連線與 Desktop 的後端狀態，而不是先重裝。"
  - id: "fd-docker-wsl-generations"
    prompt: "發行版旁的 VERSION 2 代表什麼？"
    answer: "該發行版使用 WSL 2 架構，不是 WSL 軟體的發行版本。"
    mcq:
      question: "要核對 WSL 軟體版本應先讀什麼？"
      options:
        - "wsl --version"
        - "wsl --list 的發行版名稱"
        - "Docker 的 Client 版號"
        - "映像檔標籤"
      answer: 0
      explain: "架構世代與安裝套件的版本是不同欄位。"
  - id: "fd-docker-connection-context"
    prompt: "為何有 Server 回覆仍要確認連線設定？"
    answer: "用戶端可以指向別臺主機；只有選到本機引擎才能診斷本機。"
    mcq:
      question: "要先查 CLI 目前選到哪組連線設定，用哪個指令？"
      options:
        - "docker image ls"
        - "wsl --version"
        - "docker --version"
        - "docker context show"
      answer: 3
      explain: "context 是連線目的地的設定；映像清單和軟體版號都不能代替它。"
practice:
  - id: "fd-docker-01-desktop-p1"
    title: "留下本機引擎狀態卡"
    kind: "hands-on"
    minutes: 9
    steps:
      - "在練習資料夾新增 docker-status.md，寫下 WSL 條件、Client、Server 3 列"
      - "執行範例，把實際版本或無法確認的原因填入"
      - "檢查是否為本機連線，補上一句下一步"
    checks:
      - "狀態卡沒有個人路徑或帳號"
      - "看得出哪個結果來自引擎，而非只來自 CLI"
---

## 為什麼要學：圖示亮了，誰在工作？
你要把同一個小工具交給同事，卻不想讓對方逐一安裝它需要的軟體。Docker 把執行環境包成映像檔（image），再依它建立隔離的執行個體，叫做容器（container）。之後在[〈映像檔與容器〉](#/lesson/fd-docker-01-image)會親手建立它們。今天先不下載映像檔，只回答一件事：這臺電腦有沒有收到引擎的回覆？

## 核心概念：視窗、指令、引擎
Docker Desktop 是管理本機容器環境的桌面程式；你可以在視窗裡看狀態，也可以在終端機用命令列用戶端（CLI）發出同樣的要求。引擎（engine）才是接單並執行工作的服務。關掉終端機視窗不是停止引擎，找到可執行檔也不表示引擎已經啟動。這兩個判斷要分開驗證。

這裡選用 Windows 上的 Linux 容器模式。Windows 子系統 WSL 2 提供 Linux 核心，Desktop 管理後端；你不必進入 Ubuntu 才能用 Docker。如果電腦還沒裝 Desktop，先對照本課資源的 Windows 版本、硬體虛擬化及 WSL 版本條件，再選 WSL 2 後端完成安裝。配發的電腦若禁止開啟虛擬化，請向管理者確認，不要靠重裝繞過限制。安裝、重新開機的等候時間不算在練習內。

## 範例：從左到右讀診斷結果
若前面的 WSL 版本檢查卡住，先用[〈WSL 2 與 Ubuntu〉](#/lesson/fd-linux-01-setup)分辨子系統與發行版；Docker 的用戶端能顯示版本，不代表後端引擎已啟動。

在 Windows Terminal 開 PowerShell，任何資料夾都可以。前兩行看子系統，後兩行看 Docker；不用管理員權限來抄一份版本號。
```powershell
wsl --version
wsl --list --verbose
docker --version
docker version
```
第一行看 WSL 軟體本身的版本（官方目前的 WSL 2 後端要求 WSL 2.1.5 以上）；第二行最右欄是各發行版採用第幾代架構，欄位中的 2 不是軟體版本。若第一行只有使用說明，不能據此判定已符合目前安裝條件。到官方頁核對支援範圍，別把缺少版本資訊寫成「已通過」。

開啟 Desktop，等它顯示引擎就緒，再看最後一行。`Client` 來自用戶端，`Server` 來自這次指令連到的引擎。若只看到前者和連線錯誤，留下錯誤類型，不要把引擎版本填成用戶端版本。macOS 開 Desktop；Linux 開本機引擎。兩者在終端機執行最後兩行即可，不用 WSL。

### 用 2 份觀察決定下一步
試著向同事口述兩種情況。第一種是終端機能印版本，但桌面程式還在啟動：你已排除「指令不存在」，現在該等本機服務就緒。第二種是引擎正常回覆，之後下載映像卻失敗：這是另一條連線，應另外詢問來源與網路狀態。把診斷切在這條界線，就不會因為一次下載失敗而重做整套安裝。

## 常見錯誤
「找不到指令」時，連用戶端都還沒啟動；先確認安裝完成，重開終端機讀取新的搜尋路徑。若有用戶端版本卻連不上，先看 Desktop 狀態，再用 `docker context show` 確認這個終端機選的連線設定；別為了湊出成功畫面切到公司的遠端引擎。成功看到遠端版本也不能證明本機正常。

## 小結
留一張不含帳號或路徑的狀態卡：子系統是否符合條件、用戶端能否執行、本機引擎是否回覆。下次碰到「Docker 不能用」，你就知道應該從哪一層問起。
