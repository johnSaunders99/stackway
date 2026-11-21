---
id: fd-git-11-sshkey
module: fd-git
order: 11
title: GitHub SSH 金鑰
subtitle: 連線時該交出哪一半
status: ready
minutes: 25
level: 2
prereqs:
  - fd-git-10-pull
objectives:
  - 辨認將公鑰登錄到自己帳號的步驟
  - 區分主機指紋與使用者金鑰，不展示私鑰內容
tags:
  - git
  - sshkey
resources:
  - title: GitHub：新增 SSH 驗證金鑰
    url: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: GitHub：官方 SSH 主機指紋
    url: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-git-11-halves
    prompt: "GitHub 的 Authentication Key 欄位應填什麼？"
    answer: "貼上自己的完整公鑰，不是私鑰或指紋。"
    mcq:
      question: "登錄自己的 SSH 驗證金鑰應交出哪一項？"
      options:
        - "自己的私鑰"
        - "私鑰的口令"
        - "主機指紋"
        - "自己的完整公鑰"
      answer: 3
      explain: "服務用公鑰核驗簽章，不需要任何私密材料。"
    interview:
      question: "首次看到的主機指紋不符，你會換自己的金鑰重試嗎？"
      points:
        - "區分主機與使用者"
        - "獨立核對官方主機指紋"
        - "不相符則停止"
      answer: "不會。現在有疑問的是對端，我會停在信任提示前，核對主機名稱與官方同演算法的指紋。換本地金鑰不能解釋主機為什麼不同。"
  - id: fd-git-11-host
    prompt: "首次連線看到主機指紋應和什麼比？"
    answer: "比對該主機官方公布的同演算法指紋。"
    mcq:
      question: "SSH 首次連線顯示某演算法的主機指紋，應以哪筆資料比對？"
      options:
        - "自己的使用者公鑰指紋"
        - "同演算法但不同主機的指紋"
        - "官方同主機同演算法的指紋"
        - "同主機但不同演算法的指紋"
      answer: 2
      explain: "這步是你確認主機，不是主機驗證你的身分。"
  - id: fd-git-11-comment
    prompt: "只改公開金鑰行尾的註解，指紋會變嗎？"
    answer: "不會，註解不是計算金鑰指紋的材料。"
    mcq:
      question: "只修改公鑰行尾的用途註解，再執行 ssh-keygen -l，指紋會怎樣？"
      options:
        - "改變，因為整行文字不同"
        - "維持不變，公鑰材料相同"
        - "改變，因為註解用來指定身分"
        - "只有檔名也不變時才保持相同"
      answer: 1
      explain: "註解方便人區分用途，不授權也不改變金鑰。"
practice:
  - id: fd-git-11-p1
    title: "製作一張不含任何祕密的 SSH 交接卡"
    kind: hands-on
    minutes: 10
    steps:
      - "只建立範例公開檔，在同目錄讀指紋。"
      - "改註解後再讀，保留兩次的比對結果。"
      - "在庫外筆記畫出主機指紋、公鑰、私鑰三者的流向。"
    checks:
      - "兩次指紋相同。"
      - "交接卡寫明網站接收完整公鑰。"
      - "筆記沒有真實金鑰、帳號或口令。"
---

## 為什麼要學

第一次連到代管網站，畫面問你是否信任主機；稍後網站又要求新增金鑰。這兩個問題看似都是「你是誰」，方向卻相反。安全殼層協定（Secure Shell，SSH）讓用戶端與主機建立受保護的連線。辨認對方的主機，與向對方證明你持有某把金鑰，是兩次不同的驗證。今天不必登入、不必交出任何自己的資料，就能學會分清楚。

## 核心概念

使用者金鑰對（key pair）有兩半。公鑰（public key）可以交給需要辨認你的服務；私鑰（private key）只能留在你控制的環境。連線時由用戶端用私鑰完成簽章來證明持有權，服務端用登錄的公鑰檢查，不需要取得私鑰。口令（passphrase）用於保護本地私鑰，也不應填進網站的公鑰欄位。檔名常以 `.pub` 結尾的是公鑰，但不能光靠改副檔名讓一個祕密變得可公開。

主機也有自己的金鑰。指紋（fingerprint）是從一把金鑰算出的短摘要，方便人比對。首次連線時，若出現主機指紋，應對照官方另行發布的資料，確認主機名稱、演算法與指紋一致再接受。這時比較的是對方主機，不是你那份使用者公鑰；看到「兩個指紋不一樣」不一定有事，先問比較的兩筆是不是同一個角色。

## 範例：只用公開樣本辨認指紋

在 `C:\dev\stackway-lab` 新建 `key-cards`，用編輯器建立 `sample.pub`，存成 UTF-8 純文字，內容只有下一行。它是教學用公開測試資料，沒有附上私鑰；不要把這份樣本登錄到任何帳號。

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1Ea training-card
```

在這個新目錄開 PowerShell。若已有 OpenSSH 工具，只讀取剛建的公開樣本：

```powershell
ssh-keygen -l -E sha256 -f sample.pub
```

結果中應有 `SHA256:` 開頭的指紋與金鑰類型。最後的 `training-card` 是便於辨識的註解，把它換成 `lab-card` 再算，指紋應不變。macOS 或 Linux 可在相同檔案所在目錄用 bash 執行同一行。若目前沒有工具，可先完成角色對照筆記，別為了找材料去讀電腦裡既有的私鑰。

### 真正登錄時的交接順序

只有你日後決定連自己的帳號時，才在受信任的裝置產生自己專用的金鑰對，妥善保護私鑰。到 GitHub 個人設定的 SSH and GPG keys，新增 SSH key，選 Authentication Key、填可辨認的用途標題，貼上自己公鑰的整行後確認。不是貼指紋、不是貼口令，也不是貼本課樣本。網站若要求再次驗證登入，這是帳號操作，不會因此需要私鑰文字。

## 常見錯誤

主機指紋與官方對不上，不要直接答應、刪除既有信任紀錄，或以為重新產生自己的金鑰就會好。停止連線，從可信來源確認主機資訊。對方若索取私鑰來「幫你測試」，也不應交付；取得公鑰與驗證簽章已足夠。

## 小結

把箭頭寫出來：你核對的是主機指紋，服務端登錄的是你的公鑰，私鑰不走這兩條交接路線。能分別說出三者的目的，才算會讀第一次連線的提示。
