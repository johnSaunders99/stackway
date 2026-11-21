---
id: fd-aws-02-iam
module: fd-aws
order: 2
title: IAM 角色與最小權限
subtitle: 服務只需要讀取一個儲存區
status: ready
minutes: 30
level: 3
prereqs:
  - fd-aws-01-cost
objectives:
  - 區分身分、角色與政策
  - 從工作所需動作及資源範圍檢查一份示意政策
tags:
  - aws
  - iam
resources:
  - title: "AWS IAM：政策與權限"
    url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "AWS IAM：角色與臨時憑證"
    url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-aws-02-iam-trust"
    prompt: "角色的信任政策主要回答什麼？"
    answer: "誰可以依條件擔任這個角色。"
    mcq:
      options:
        - "角色能讀取哪些物件。"
        - "誰可以依條件擔任這個角色。"
        - "資料應保留多少天。"
        - "應用應使用哪一條網路路由。"
      answer: 1
      explain: "取得角色的資格與角色被允許的動作分開描述。"
    interview:
      question: "新功能只能讀一小段封面路徑，你如何審政策？"
      points:
        - "先列工作身分與必要動作"
        - "比對物件資源範圍"
        - "用允許與拒絕案例驗界線"
      answer: "我先確認是應用角色在讀已知鍵，不需要列清單。只允許那個前綴的讀取，再拿同前綴寫入和隔壁前綴讀取做反例；不因一次失敗就放寬成全部資源。"
  - id: "fd-aws-02-iam-object"
    prompt: "只需取得已知封面鍵，最貼近需求的是哪個允許？"
    answer: "指定封面前綴物件的 s3:GetObject"
    mcq:
      options:
        - "整個帳號所有資源的所有動作"
        - "只允許 s3:ListBucket 就算讀出檔案"
        - "指定封面前綴物件的 s3:GetObject"
        - "允許刪除整個貯體"
      answer: 2
      explain: "列清單和讀內容是不同動作；本題已知鍵，不需要列出其他物件。"
  - id: "fd-aws-02-iam-default"
    prompt: "在只有單一允許政策的簡化情境，未列的動作如何處理？"
    answer: "沒有允許即拒絕。"
    mcq:
      options:
        - "只要網路可達就允許。"
        - "自動借用其他服務的角色。"
        - "以角色名稱猜測是否允許。"
        - "沒有允許即拒絕。"
      answer: 3
      explain: "實際權限還須綜合其他適用政策；明確拒絕優先。"
  - id: fd-aws-02-iam-session
    prompt: "角色的臨時憑證到期，等於角色本身被刪除了嗎？"
    answer: "不是。到期的是這次取得的憑證；符合信任及授權條件的主體仍可重新取得角色工作階段。"
practice:
  - id: "fd-aws-02-iam-p1"
    title: "把一份政策改成三個可核對的案例"
    kind: "hands-on"
    minutes: 12
    steps:
      - "儲存並解析 cover-policy.json"
      - "逐項寫下已知封面讀取、同鍵寫入、其他前綴讀取的預期"
      - "圈出決定結果的動作與資源"
    checks:
      - "三個答案依序為允許、拒絕、拒絕"
      - "沒有實際套用政策或取得憑證"
---

## 為什麼要學：能讀一張封面，不必拿整個書庫的鑰匙

書目服務收到查詢後，只需從已知位置取封面。如果開發時為了快，讓它也能刪資料或列出別組的檔案，以後一次程式錯誤就可能碰到不相關的工作。身分與存取管理（Identity and Access Management，IAM）處理「誰可以對什麼做什麼」。最小權限（least privilege）並不是一概拒絕，而是只給完成這份工作需要的能力。

## 核心概念：分別回答誰能接班、接班後能做什麼

身分（identity）是提出要求的主體。角色（role）像一個職務，可由符合條件的主體擔任，取得有時效的憑證。信任政策（trust policy）描述誰能擔任角色；權限政策（permissions policy）描述角色做得到哪些動作。政策不是登入密碼，把政策文字複製進程式也不會變成那個角色。

閱讀一條陳述時，先看效果（Effect）是允許還是拒絕，再看動作（Action）與資源（Resource）。資源名稱（ARN）指向特定類型與範圍。S3 是按照鍵保存檔案的物件儲存，之後在[〈S3 物件儲存〉](#/lesson/fd-aws-05-s3)會細講。讀某個已知物件，和列出貯體裡有哪些鍵，是不同的動作，對應的資源也不同。不要只看第一個動詞像不像「讀」就把列舉權限順便加上去。

## 範例：審閱政策，不把它套到帳號

在 `C:\dev\stackway-lab\aws` 存 `cover-policy.json`，貯體名稱只是假設，不指向需要操作的資源。PowerShell 執行 `Get-Content -Raw cover-policy.json | ConvertFrom-Json` 可檢查語法；macOS／Linux 用 `python3 -m json.tool cover-policy.json`。解析成功只代表格式能讀，不是雲端授權測試。

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::study-demo-catalog/covers/*"
  }]
}
```

版本字串指定政策語法，不是到期日。從左到右核對：取封面內容，動作吻合；鍵在指定的封面前綴下，資源才吻合。若同樣讀取動作改成筆記前綴，或同一封面改為寫入，兩者都沒有從這份政策得到允許。將兩個反例都留下，便能分辨是動作太寬還是資源太寬。

### 把政策讀成 3 張請求卡

先寫「讀取封面甲」，再寫「改寫封面甲」，最後寫「讀取內部筆記甲」。第二張只改動作，第三張只改資源。若第二張也成立，問題在允許的能力太多；若第三張也成立，問題在範圍太廣。不要從一張同時改了兩件事的卡片猜政策哪裡錯。再想一個需求變更：畫面要列出所有封面，此時要評估新增列舉能力與可列的前綴，而不是因為都是封面就宣稱原來的讀取權早已涵蓋。把新用途寫下才知道為何要擴大能力。

用同一個動作搭配兩個不同資源驗算，才能看出允許的是限定對象，而不是整項服務任意存取。

## 常見錯誤與小結

單看一份政策不能宣布整個帳號最後一定允許。還可能有資源政策、權限邊界與組織限制；明確拒絕優先。本課限定只有圖中的允許、沒有其他授權，不是在模擬完整 IAM 引擎。先寫工作句，記下這個職務是誰擔任的，再寫一條恰好夠用的允許，最後讓正常案例和相鄰反例一起驗收。
