---
id: fs-market-stack-01-java
module: fs-market-stack
order: 1
title: Java 資料型別
subtitle: 用 Java 表達既有的資料型別
status: ready
minutes: 35
level: 3
prereqs: []
objectives:
  - 將筆記欄位寫成帶型別的資料結構
  - 分辨編譯失敗與不合法的輸入資料
tags:
  - market-stack
  - java
resources:
  - title: Oracle Java 教學：類別、欄位與建構子
    url: https://docs.oracle.com/javase/tutorial/java/javaOO/classes.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: Oracle：javac 如何把原始檔編譯成類別檔
    url: https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
  - title: Oracle：Java 開發工具組下載
    url: https://www.oracle.com/java/technologies/downloads/
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
    note: 選 JDK 的 Windows 安裝檔，不只安裝執行環境。
concepts:
  - id: fs-market-stack-01-java-compile
    prompt: 建構子接收 int，卻在 Java 原始碼傳入字串 "7"，何時出錯？
    answer: 編譯時就找不到符合參數型別的建構方式。
    mcq:
      options:
        - 連上網頁之後
        - 編譯階段
        - 列印時自動變 0
        - 只在標題也無效時
      answer: 1
      explain: Java 不會像讀表單那樣自動把字串解析成這個整數參數。
  - id: fs-market-stack-01-java-domain
    prompt: 為什麼 0 編號能通過型別檢查卻被範例拒絕？
    answer: 0 是 int，但不符合筆記編號必須為正的資料規則。
    mcq:
      options:
        - int 只能表示正數
        - final 會拒絕 0
        - 資料規則比型別範圍窄
        - 建構子不能接收數字
      answer: 2
      explain: 型別與資料有效性是不同層次，需明寫業務條件。
    interview:
      question: 若前端說欄位型別對了，為什麼 Java 後端仍要驗證？
      points:
        - 區分編譯期和外部資料
        - 說明型別不能涵蓋業務條件
        - 用具體反例說明檢查位置
      answer: 我可以在 Java 呼叫點擋住把字串傳給整數參數，卻擋不了合法型別的 0 或空白標題。外部資料進來後我會先解析，再在建立筆記的邊界檢查規則，不把它留給畫面猜。
  - id: fs-market-stack-01-java-reference
    prompt: 判斷 title 為 null 為何要放在呼叫 isBlank 之前？
    answer: 空參照不能呼叫方法；利用短路判斷先拒絕它。
practice:
  - id: fs-market-stack-01-java-p1
    title: 收集兩種不同階段的錯誤
    kind: code
    minutes: 12
    steps:
      - 保存 NoteDemo.java，先編譯執行；再將第二筆改為正編號與全空白標題後重新編譯執行，隔離標題條件。
      - 將第一筆編號暫改成字串，只跑編譯，將兩種現象記入 java-note.md 後還原重編。
    checks:
      - '合法筆記輸出 7: Index；編號為正、標題全空白時仍印出 invalid note。'
      - 筆記能區分無法產生新版與新版在執行時拒絕資料，沒有把舊類別檔當成新版。
---

## 筆記編號是數字，還是剛好長得像數字？
你要把原本由 JavaScript 傳出的筆記搬到 Java。練習契約只有兩個欄位：`id` 是正整數，`title` 是不能全空白的字串。呼叫端拿編號做數字比較，所以把 7 換成字串「7」不是無害的格式調整。先學會在單一 Java 程式中表達這兩項承諾，再談把資料放到網路上；這一步不需要設定伺服器或資料庫。

## 型別與資料規則分兩關
類別 (class) 描述物件有哪些欄位、物件怎麼建立。`int` 是有範圍的整數型別，`String` 是可指向字串物件的參照型別。建構子 (constructor) 名稱和類別相同、沒有回傳型別，負責建立可用的初始狀態。`this.id = id` 左側是這個物件的欄位，右側是本次傳入的參數。`final` 表示這個欄位初始化後不能再次指派，不等於替所有資料加上業務驗證。

編譯器能在執行前檢查把字串拿去填整數欄的錯誤；但 0 仍是合法整數，空字串仍是合法字串。是否接受它們，是程式必須明寫的規則。另外，字串參照可能是 `null`，代表沒有指向任何字串；先判斷空參照，再呼叫字串的方法，才不會讓錯誤在意料之外的位置發生。

## 範例：先編譯，再故意給邊界值
在 `C:\dev\stackway-lab` 下新建 `java-note` 資料夾，存為 `NoteDemo.java`。在 PowerShell 用 `java --version` 和 `javac --version` 分別確認執行環境與編譯器；若只有前者，依延伸資源的 Oracle 下載頁取得完整的 Java 開發工具組（JDK），開新終端機再試。本例的 `isBlank` 需要 Java 11 以上，下一堂[〈Spring 控制器與路由〉](#/lesson/fs-market-stack-02-spring)的 Spring 專案請選支援的 Java 17 以上版本。不要將編譯檔放進另一個專案的原始碼目錄。

```java
public class NoteDemo {
    static final class Note {
        final int id;
        final String title;
        Note(int id, String title) {
            if (id < 1 || title == null || title.isBlank())
                throw new IllegalArgumentException("invalid note");
            this.id = id;
            this.title = title;
        }
    }
    public static void main(String[] args) {
        Note note = new Note(7, "Index");
        System.out.println(note.id + ": " + note.title);
        try {
            new Note(0, "Index");
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }
}
```

在放檔案的目錄，PowerShell 或 bash 先執行 `javac NoteDemo.java`，編譯成功才執行 `java NoteDemo`。第一行印出合法筆記，第二行是程式自己拒絕 0 編號。再把第一筆的整數改成帶雙引號的字串，單獨重跑編譯；這次連新的程式都不能產生。做完請還原並重新編譯。先前成功留下的類別檔仍可能存在，編譯失敗後硬執行，不小心跑到舊版會誤以為錯誤沒有作用。

可以把合法筆記想成能進入下一段流程的入場券。建立物件以前，資料只是尚待檢查的輸入；建立成功後，下游才可以依賴編號為正、標題不是空白。若把驗證分散在每個顯示畫面，以後改成從背景匯入就可能繞過，明明建立同一種筆記卻有兩套規則。

## 常見錯誤
用 `int` 就宣稱能容下任意整數，或因字串型別正確就直接接受全空白標題。遷移前先看舊契約允許的範圍：若既有識別碼是可能有前導 0 的文字，本堂的數字範例就不適合直接套用。範例不把標題偷偷修剪或改字母大小寫；拒絕什麼、保留什麼，都和資料含義有關。

## 小結
靜態型別把欄位形狀釘住；建構時的檢查把資料條件釘住。看到錯誤時，先辨認是編譯前後的哪一關，再決定要改呼叫方式還是處理不合法的輸入。
