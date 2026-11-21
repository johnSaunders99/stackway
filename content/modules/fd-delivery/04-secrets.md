---
id: fd-delivery-04-secrets
module: fd-delivery
order: 4
title: 機密設定管理
subtitle: 把私密設定留在原始碼之外
status: ready
minutes: 35
level: 3
prereqs:
  - fd-delivery-03-cloud
objectives:
  - 分隔應用程式設定與憑證
  - 列出替換測試憑證後的驗證方式
tags:
  - delivery
  - secrets
resources:
  - title: "GitHub Actions：在工作流程使用機密"
    url: "https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-delivery-04-secrets-secret"
    prompt: "哪個值必須當機密保管？"
    answer: "可代表服務取得私有資源的憑證"
    mcq:
      options:
        - "介面的背景色"
        - "重試次數上限"
        - "可代表服務取得私有資源的憑證"
        - "顯示語言"
      answer: 2
      explain: "判準是持有者能否取得能力，而不是字串看來是否複雜。"
    interview:
      question: "怎麼證明換好憑證又不在紀錄裡洩漏它？"
      points:
        - "以最小操作驗新值"
        - "確認所有消費者切換"
        - "撤舊值並只記結果"
      answer: "我用測試身分做一次有權的讀取，只記版本標籤與成敗。確認舊工作者也換好後撤舊值；最後再測舊身分被拒，而不是印出兩個值比對。"
  - id: "fd-delivery-04-secrets-scope"
    prompt: "機密應交給哪些流程步驟？"
    answer: "只有真正需要該能力的執行步驟"
    mcq:
      options:
        - "每個步驟以方便除錯"
        - "瀏覽器端所有頁面"
        - "所有測試報告的附件"
        - "只有真正需要該能力的執行步驟"
      answer: 3
      explain: "縮小能接觸值的範圍，比單靠遮蔽輸出可靠。"
  - id: "fd-delivery-04-secrets-rotate"
    prompt: "一般計畫性輪替的完成條件是什麼？"
    answer: "新值已驗證、消費者已切換，舊值撤銷後不能再用。"
    mcq:
      options:
        - "新值已驗證、消費者已切換，舊值撤銷後不能再用。"
        - "新值存入保管處就完成。"
        - "只改變憑證的名稱。"
        - "把舊值移出畫面但仍保持有效。"
      answer: 0
      explain: "發出新憑證不會自動撤銷舊能力，兩端都要驗證。"
practice:
  - id: "fd-delivery-04-secrets-p1"
    title: "替模擬憑證完成輪替"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 rotate.mjs"
      - "在撤銷前後各記錄新舊的布林結果"
      - "寫下一個仍使用舊值的工作者會在何時失敗"
    checks:
      - "新值成功且撤銷後舊值失敗"
      - "紀錄只有標籤與結果，沒有任何真正的憑證"
---

## 為什麼要學：設定都寫在同一檔，可以嗎？

服務的畫面語言、讀取逾時與能打開私有檔案的憑證，都可能在啟動時讀入，卻不代表它們應放在一起。一般設定（configuration）描述怎麼工作；機密（secret）一旦被別人取得，可能讓對方以你的服務身分做事。把機密從程式中移除還不夠，還得知道誰會拿到它，以及不用時怎麼收回能力。

## 核心概念：把名稱寫進程式，把值交給環境

程式可明訂需要哪個設定名稱，從執行環境取得值，缺少時回報「缺少必要設定」而不印值。環境變數（environment variable）是傳遞方式，不是能保證保密的保險箱。負責保管的服務控制誰能取得值；執行流程只把它交給需要的步驟，避免傳給所有子程序。可使用短效身分時，不要為了省事而保留長效金鑰。

若將值編入前端程式，即使介面沒顯示，交到瀏覽器的檔案仍然帶著它。放入忽略清單也不會追回已存進歷史、附件或紀錄裡的值。不要為了確認設定成功就列出整份環境；測的是服務能否做一件允許的事，不是人能否在畫面看到那串字。遇到真正外洩要依事件程序立即限制風險，不能照例行排程慢慢等待換班。

## 範例：只拿沒有能力的標籤演練

在 `C:\dev\stackway-lab\delivery` 存 `rotate.mjs`，執行 `node rotate.mjs`。此處的兩個字串只是記憶體集合的標籤，不會讀你電腦裡的環境、連任何服務或要求填入真值。把集合想成發行端還承認的資格，變數則代表應用目前使用哪一張。

```js
const valid = new Set(["old-demo"]);
let configured = "old-demo";
const check = label => valid.has(label);
valid.add("new-demo");
console.log("candidate works", check("new-demo"));
configured = "new-demo";
console.log("app uses active credential", check(configured));
valid.delete("old-demo");
console.log("old accepted", check("old-demo"));
console.log("app still works", check(configured));
```

一般輪替先讓新舊短暫並存，再測新值、切換消費者、撤掉舊值。先撤後換可能讓尚未重啟的工作者全部中斷；只換不撤則留下兩份都有效的能力。這段程式的最後兩行要一起看：只看到舊值失敗，還不能說服務已恢復。

### 找出忘記換班的消費者

假設白天的網頁已切到新值，每晚才執行一次的匯出工作卻只在啟動時載入設定。這時看一眼網站首頁不能代表兩邊都換好了。把讀取同一機密的消費者逐項列出，標明何時取值、能否重新載入，以及要用哪個不改資料的操作驗證。若尚有工作無法核對，把它記為未完成，而不是把測試成功的網站算兩次。反過來，若撤銷後舊值還能讀，也別再繼續發新值；先分清是撤錯對象，還是測試碰到不需授權的公開資源。

## 常見錯誤與小結

「平台會遮蔽機密」不等於可以安心輸出。轉換格式或拋出整個設定物件，未必會被同一套遮蔽規則識別。練習紀錄只留下測試環境、操作種類、憑證版本標籤與成功或拒絕的結果；能支持輪替判斷就夠了，不需要複製真值來當證據。
