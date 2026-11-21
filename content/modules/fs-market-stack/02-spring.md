---
id: fs-market-stack-02-spring
module: fs-market-stack
order: 2
title: Spring 控制器與路由
subtitle: 在 Spring 接住第一個 GET 請求
status: ready
minutes: 30
level: 3
prereqs:
  - fs-market-stack-01-java
objectives:
  - 辨認控制器與路由標註
  - 讓回應符合既有端點的欄位契約
tags:
  - market-stack
  - spring
resources:
  - title: Spring 入門：建立 REST Web 服務
    url: https://spring.io/guides/gs/rest-service/
    kind: course
    lang: en
    minutes: 12
    required: false
    checked: '2026-11-20'
  - title: Spring Initializr：產生練習專案
    url: https://start.spring.io/
    kind: tool
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-market-stack-02-spring-mapping
    prompt: 哪個標註負責把 GET 路徑配到此方法？
    answer: '@GetMapping 負責方法與路徑；@PathVariable 只取出路徑值。'
    mcq:
      options:
        - '@PathVariable'
        - '@RestController'
        - '@GetMapping'
        - package
      answer: 2
      explain: 類別標註讓框架辨識控制器，套件界定命名範圍，都不單獨定義這條 GET 路由。
    interview:
      question: 呼叫 7 和 8 都回 404，你會先從哪裡分辨原因？
      points:
        - 先確認服務可達與路徑
        - 比對自己的錯誤物件
        - 檢查元件掃描與套件位置
      answer: 我會看 404 的內容是不是我定義的 not_found。兩個結果若都是框架預設頁，我會先查方法、路徑與套件掃描，不急著改資料；如果連不上，則先確認服務在哪個埠。
  - id: fs-market-stack-02-spring-missing
    prompt: 查無筆記時，哪種回覆符合範例契約？
    answer: HTTP 404 加上 error 為 not_found 的 JSON。
    mcq:
      options:
        - 200 與空標題
        - 204 且無內容
        - 只有終端機印出 not_found
        - 404 與固定錯誤物件
      answer: 3
      explain: 前端依 HTTP 狀態與內容區分查無資料，寫日誌不是回應。
  - id: fs-market-stack-02-spring-serialization
    prompt: 為什麼回傳數字 7 而不是字串 "7"？
    answer: JSON 型別是用戶端可見的契約，不由路徑本身是文字來決定。
practice:
  - id: fs-market-stack-02-spring-p1
    title: 保留兩筆原始 HTTP 回應
    kind: build
    minutes: 15
    steps:
      - 在練習專案建立控制器並啟動本機服務，分別查詢 7 和 8。
      - 用 curl.exe -i 取得狀態、媒體型別與本文，將兩組結果記入 spring-route.md 後停止服務。
    checks:
      - 找到時為 200 且 id 是數字；未找到時為 404 且 error 是 not_found。
      - 可在原始碼指出路徑宣告、變數擷取與設定狀態碼的各一處。
---

## 換了後端，不該讓筆記卡片跟著改欄位
上一堂的筆記已經能在 Java 程式裡成立；這次要讓瀏覽器真的讀到它。控制器 (controller) 接收網路請求，路由 (route) 把方法與路徑配到特定處理函式。重點不是把熟悉的 Node.js 語法逐字翻譯，而是用另一套框架交付同一件事：找得到編號 7 時回數字編號和標題；找不到時有明確狀態，不把空畫面假裝成成功。

## 建立一個只讀的練習專案
在 Spring Initializr 選 Maven、Java、支援指定 JDK 的穩定 Spring Boot 版本，加入 Spring Web；本練習可選 Java 17 並使用相同或相容的 JDK。設定群組 `lab`、成品名 `notes`、套件名 `lab.notes`。將產生的專案解到 `C:\dev\stackway-lab\notes`，確認這一層看得到 `pom.xml` 與 `mvnw.cmd`。不用動你原來的筆記服務。首次啟動包裝器需要可取得相依套件，與已備妥專案後的本機請求是兩件事。

在專案的 `src/main/java/lab/notes/NoteController.java` 建立下列完整類別，與產生的應用主類別放在相同套件。套件是 Java 類別的命名範圍；應用預設會從主類別所在套件往下找元件。`@RestController` 讓這個類別提供回應內容，`@GetMapping` 定義只接受指定讀取路徑，`@PathVariable` 取出該段路徑文字。

```java
package lab.notes;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class NoteController {
    @GetMapping("/notes/{id}")
    public ResponseEntity<?> get(@PathVariable("id") String id) {
        if ("7".equals(id))
            return ResponseEntity.ok(Map.of("id", 7, "title", "Index"));
        return ResponseEntity.status(404).body(Map.of("error", "not_found"));
    }
}
```

## 範例：看一次成功，再看一次明確的查無資料
沿用[〈Java 資料型別〉](#/lesson/fs-market-stack-01-java)驗過的 JDK。這裡新增的是有 Web 相依套件的專案，不是再裝一次 Java。

在專案根目錄用 PowerShell 執行 `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.address=127.0.0.1"`；macOS／Linux 用 `./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.address=127.0.0.1`。保留該終端機，另開視窗用 `curl.exe -i http://127.0.0.1:8080/notes/7` 與同一路徑尾端改為 8 的請求；bash 把 `curl.exe` 改為 `curl`。完成後在服務視窗按 Ctrl+C。

第一筆應為 200、內容含數字 7 與字串標題，第二筆為 404、含字串錯誤碼。路徑本質上是文字；本例只用固定鍵來教路由，沒有冒充已接上資料庫。框架把回傳物件序列化 (serialization) 成 JSON；欄位順序不是承諾。回傳的是結構而非印到終端機的字串，狀態碼則由回應物件設定，缺一不可。

### 從用戶端的方向讀一次程式
請求到達時，框架先找方法與路徑是否匹配，再把路徑中的那段文字交給你的方法。因此筆記不存在與控制器根本不存在，都有機會得到相同的狀態碼；只有前者走過你寫的分支。反方向看，回應物件先決定狀態，再交給訊息轉換器把內容寫到網路。把這四步分別標在紙上後，就能指出哪個位置負責查找，哪個位置才會影響呼叫端讀到的欄位型別。

## 常見錯誤
兩筆都得 404，要先看是不是找不到控制器，不要馬上改查詢規則。請比對錯誤內容是否為自己定義的錯誤碼，再查套件位置與路徑；如果服務根本沒啟動，則連 HTTP 狀態碼都不會出現。若 8080 已被占用，不要結束別人的程式，在啟動參數改用空閒連接埠並同步更改測試網址。

## 小結
從請求方法、路徑、路徑變數一路追到狀態與回應物件。之後在[〈跨語言 API 契約測試〉](#/lesson/fs-market-stack-03-verify)會把這兩筆手動驗收同時用在 Node.js 與 Spring，避免「頁面看起來沒壞」成為唯一證據。
