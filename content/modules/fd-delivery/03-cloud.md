---
id: fd-delivery-03-cloud
module: fd-delivery
order: 3
title: 雲端服務資源圖
subtitle: 一個小服務需要哪些雲端資源
status: ready
minutes: 30
level: 3
prereqs:
  - fd-delivery-02-artifact
objectives:
  - 畫出運算、儲存、網路與身分邊界
  - 列出閒置仍可能產生費用的資源
tags:
  - delivery
  - cloud
resources:
  - title: "AWS：架構設計的檢視面向"
    url: "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
  - title: "AWS Billing：追查意外費用"
    url: "https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/checklistforunwantedcharges.html"
    kind: "doc"
    lang: "en"
    minutes: 5
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fd-delivery-03-cloud-layers"
    prompt: "資源圖上的運算與儲存應如何區分？"
    answer: "前者執行程式，後者在程序結束後保留需要的資料。"
    mcq:
      options:
        - "兩者只靠所在區域區分。"
        - "前者執行程式，後者在程序結束後保留需要的資料。"
        - "運算停下所有儲存都自動消失。"
        - "所有儲存都會執行應用邏輯。"
      answer: 1
      explain: "生命週期不同，應分開畫與驗收。"
    interview:
      question: "畫一個只公開入口的檔案查詢服務，你會怎麼標？"
      points:
        - "請求的方向與公開入口"
        - "程式用哪個身分及動作"
        - "資料和殘留成本"
      answer: "我先讓瀏覽器只連入口，再畫應用用自己的角色讀私有檔案。旁邊列出應用被替換後仍要保留的檔案，以及沒流量時仍要計的容量與位址。"
  - id: "fd-delivery-03-cloud-permission"
    prompt: "應用有路由能到物件儲存，是否就一定能讀檔？"
    answer: "不一定，請求身分還要有該物件的讀取權限。"
    mcq:
      options:
        - "一定，網路可達即代表授權。"
        - "一定，只要兩者同區。"
        - "不一定，請求身分還要有該物件的讀取權限。"
        - "不一定，因為不能從服務讀物件。"
      answer: 2
      explain: "路徑是否存在和操作是否獲准是兩道不同的門。"
  - id: "fd-delivery-03-cloud-idle"
    prompt: "服務不再接單後，哪項仍可能累積費用？"
    answer: "保留的磁碟、快照或配置中的位址"
    mcq:
      options:
        - "已釋出的所有位址未來使用時數"
        - "尚未建立的磁碟容量"
        - "紙上資源圖的方塊數"
        - "保留的磁碟、快照或配置中的位址"
      answer: 3
      explain: "關掉一條請求路徑，並沒有變更其他資源的生命週期。"
practice:
  - id: "fd-delivery-03-cloud-p1"
    title: "交一份資源與責任圖"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 map.mjs，把輸出存入 cloud-map.txt"
      - "在每條線旁註明誰發起與誰授權"
      - "將應用標記停止後圈出仍保留的資源"
    checks:
      - "沒有瀏覽器直連資料庫的線"
      - "列出至少兩項無請求時仍須檢查的費用"
---

## 為什麼要學：先畫出一個請求，再選服務

你要讓讀者看到某本書的封面，不一定要先背一長串雲端品牌名稱。先問：誰接收請求？誰執行程式？書的資料和封面各放哪？換掉執行程式的機器後，哪些東西還必須找得到？一張能回答這些問題的資源圖（resource diagram），比把所有圖示排整齊有用。本課只在本機畫圖，不建立雲端帳號或任何付費資源。

## 核心概念：方塊是責任，箭頭是行為

運算（compute）執行應用程式；持久儲存（persistent storage）把需要留下的資料和處理它的程序分開。資料庫適合查書號與標題的對應，物件儲存則按鍵保存整張封面檔，之後在[〈S3 物件儲存〉](#/lesson/fd-aws-05-s3)會細講。網路（network）決定請求能往哪裡走；身分（identity）決定走到之後能做什麼。即使程式可以到達放封面的服務，沒有讀取權仍不能拿檔案。

畫方塊時先放瀏覽器，再放唯一對外的入口、應用、書目資料庫與封面儲存。入口負責接收並轉送，應用查書目取得封面鍵，再用服務角色讀檔。角色是程式代為執行操作時使用的身分，之後在[〈IAM 角色與最小權限〉](#/lesson/fd-aws-02-iam)會細講。用箭頭標出發起端、目的端與動作，不要用一條無方向的線同時表示「網路相通」和「可以修改資料」。

## 範例：讓文字圖也能被核對

在 `C:\dev\stackway-lab\delivery` 存 `map.mjs`，執行 `node map.mjs > cloud-map.txt`，再用編輯器打開檔案。這份清單每一列只寫一件事，方便在設計審查時逐條刪減。如果把封面讀取拿掉，仍可說明不含圖片的書目頁會怎樣運作。

```js
const edges = [
  ["browser", "入口", "HTTPS 查書"],
  ["入口", "應用", "轉送書號"],
  ["應用", "私有資料庫", "查標題與封面鍵"],
  ["應用角色", "私有物件儲存", "讀取指定封面"]
];
for (const [from,to,why] of edges) console.log(from, "→", to, "：", why);
```

在每個方塊旁補上「停用應用後是否還在」。讀者停止查詢，不代表資料就要消失；若保留磁碟、快照或配置給服務的位址，仍可能有費用。費用另有區域、數量與時間等條件，圖上先列待查項目，不把沒有流量直接換算成 0 元。

### 用一次故障檢查圖上有沒有少一條線

假設查書可以拿到標題，卻讀不到封面。沿圖逆向推：有書名表示入口與查書目這段至少處理過這次請求，先別把所有方塊都重啟。從書目取得的鍵是否正確？應用角色能不能讀這個前綴？如果書名和封面都拿不到，才往共用的入口與應用查。你可以用虛線畫出圖上尚未驗證的關係，旁邊寫要用哪一次只讀操作查明。比起把每條線都畫成正常，標出還不知道的部分更能指引下一個動作。

## 常見錯誤與小結

不要因為瀏覽器最後看得到封面，就把整個封面儲存區畫成公開。讀者看到結果和讀者能直接列出所有檔案，是不同的授權需求。試著拿掉運算方塊：能說出服務為何暫停、資料為何仍在、哪些帳單還需查看，這張圖就能用來討論真正的部署決定。
