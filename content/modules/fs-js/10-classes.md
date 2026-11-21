---
id: fs-js-10-classes
module: fs-js
order: 10
title: JavaScript 類別
subtitle: 為每張清單建立獨立狀態
status: ready
minutes: 30
level: 2
prereqs:
  - fs-js-04-scope
objectives:
  - 宣告 constructor 與實例方法
  - 用兩個實例解釋 this 所指的對象
tags:
  - js
  - classes
resources:
  - title: MDN：使用類別
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-method-receiver
    prompt: 在 today.add(...) 中，普通實例方法的 this 指向誰？
    answer: 指向這次點號呼叫的接收者 today。
    mcq:
      question: 改用 tomorrow.add(...)，方法會對誰的 items 動手？
      options:
        - 類別名稱上的 items
        - 永遠是第一張清單
        - tomorrow 的 items
        - 建構子的參數本身
      answer: 2
      explain: 呼叫形式決定接收者，不由實例建立先後決定。
    interview:
      question: 兩張不同標題的清單仍然一起新增，會怎麼定位？
      points:
        - 先造兩個實例
        - 只修改一側
        - 檢查建構時是否共用同一陣列
      answer: 我會驗證只呼叫今天的 add 時，明天的長度是否增加，再比較 items 的身分。如果是同一個陣列，我會回建構子，讓每次初始化都新建一份。
  - id: fs-js-constructor-run
    prompt: new 建立實例時，constructor 有何用途？
    answer: 初始化這一個新實例的欄位與起始狀態。
    mcq:
      question: 哪個是替兩張清單各自建立空陣列的做法？
      options:
        - 在外層只造一個陣列再指定給所有實例
        - 把兩個變數指向同一張清單
        - 只為每張清單換標題
        - 在建構子裡指定 this.items = []
      answer: 3
      explain: 每次執行陣列常值會新建陣列；標題不同不會隔離共享參照。
  - id: fs-js-instance-check
    prompt: 怎樣用最少操作測兩個實例的內部集合是否獨立？
    answer: 只向第一個新增，再檢查第二個的長度或兩個集合身分。
practice:
  - id: fs-js-b04-10-p1
    title: 替明日清單做獨立性測試
    kind: code
    minutes: 12
    steps:
      - 儲存 shelves.js，核對原本兩個計數
      - 只向 tomorrow 新增一堂，重印兩邊
      - 在註解留下操作順序與期望
    checks:
      - 第一次是 2 和 0，第二次是 2 和 1
      - 兩個 items 的身分不同
      - 沒有手動再次呼叫建構子
---

## 每張清單都有新增按鈕，但內容不能混在一起

今天和明天各有一張待讀清單。兩張都要能新增、計數，規則完全相同，內容卻各自不同。上堂課用閉包保留狀態；另一種常見寫法是把狀態及操作整理成類別 (class)，讓每次建立的實例 (instance) 擁有自己的欄位，並以同一套方法操作它們。

## 建立時做什麼，呼叫時對誰做

`class` 後面是類別名稱，大括號裡放方法 (method)。建構子 (constructor) 是以 new 建立實例時執行的初始化程式。參數是這次建立時傳入的資料；`this.title = title` 把它存成新實例的欄位。等號兩邊同名並不多餘，右側是參數，左側是跟著實例保留下來的屬性。普通方法不必加 function 關鍵字，也不必手動呼叫建構子第二次。

讀 `today.add("DNS")` 時先看點號左邊。以這種方法呼叫形式，this 是這次接收呼叫的物件，所以同一組方法可以操作今天或明天的清單。若在建構子裡用陣列常值新建空清單，每次建立都得到獨立陣列。方法定義能共用，不代表方法操作的每份資料也應該共用。

## 範例：證明空白的明日清單真的獨立

在 `C:\dev\stackway-lab\javascript` 新建 `shelves.js`。追蹤實際收到方法呼叫的物件。建立第二份實例後，確認修改其中一份時哪份資料應保持不變。

在該目錄的終端機執行 `node shelves.js`；各系統指令相同。

```js
class Shelf {
  constructor(title) {
    this.title = title;
    this.items = [];
  }
  add(topic) {
    this.items.push(topic);
  }
  count() {
    return this.items.length;
  }
}
const today = new Shelf("today");
const tomorrow = new Shelf("tomorrow");
today.add("DNS");
today.add("SQL");
console.log(today.count(), tomorrow.count());
console.log(today.items === tomorrow.items);
```

`push` 在陣列末尾加入一項。先建立兩張空清單，再只對今天呼叫兩次新增；第一行數字應該是 2 和 0，第二行比較兩個陣列的身分應該是假。這三個觀察比只看兩張清單標題不同更有力：標題不同的物件也可能誤用同一個陣列，必須看真正會被修改的欄位。

### 改一行，分辨設計和巧合

想像把空陣列放到類別外面，取一個共用名字，再在每次建構時都指定同一個名字給 items。兩張清單仍各有自己的標題，看似分開；但其中一張新增時，另一張也會多出一項。問題不在類別天生共享，而在初始化時放進去的是不是同一個參照。要測獨立性，至少建立兩個實例，只改一個，再讀另一個。

若要區分「新建」和「別名」，可先把今天的清單指定給另一個名字，再透過那個名字新增。這次兩個名字讀到相同計數才是正確結果，因為你並沒有再次呼叫建構子。它與明天那份真正獨立的清單應該刻意對照。

## 常見錯誤

直接呼叫 `Shelf.add`，以為宣告方法就能在類別名字上新增。這裡的 add 是實例方法，先用 new 建出一張清單，才談得上新增到哪裡。也不要把方法單獨取出當普通函式呼叫後仍假定 this 指向原本的物件；看清這次呼叫的形式，而不是只看方法寫在哪一行。

## 小結

類別把共通規則寫一次；建構子替每一份狀態安家。判斷新增會改到誰，先找呼叫的接收者，再確認它持有哪一個陣列。
