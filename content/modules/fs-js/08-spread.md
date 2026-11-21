---
id: fs-js-08-spread
module: fs-js
order: 8
title: 解構與展開語法
subtitle: 複製後只替換一個欄位
status: ready
minutes: 30
level: 2
prereqs:
  - fs-js-02-array
objectives:
  - 用物件與陣列解構取得指定欄位
  - 用展開語法建立新物件並驗證它不是深層複製
tags:
  - js
  - spread
resources:
  - title: MDN：展開語法與淺層複製
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-spread-depth
    prompt: 展開一般物件後，巢狀物件是否也成為新物件？
    answer: 不會自動複製內層；外層新建，原本的參照仍然共用。
    mcq:
      question: draft = { ...lesson } 後什麼通常仍為真？
      options:
        - draft.style === lesson.style
        - draft === lesson
        - 舊物件會失去 style
        - 每個內層都已複製
      answer: 0
      explain: 展開複製屬性值；若值是參照，兩邊仍指同一個物件。
    interview:
      question: 預覽明明展開了原卡，調整字級怎麼還動到舊版？
      points:
        - 外層新但內層共用
        - 比較兩層身分
        - 重建修改路徑
      answer: 我會先比兩張卡，再比兩張卡的 style。若只有內層相同，就重建 style 並覆蓋字級，不需要連沒動的標籤一起深層複製。
  - id: fs-js-spread-order
    prompt: 同一物件常值中鍵重複時，哪個值保留？
    answer: 後面寫入的值覆蓋先前同名的值。
    mcq:
      question: 要用新標題覆蓋來源，哪個順序正確？
      options:
        - 先寫標題再展開含舊標題的來源
        - 先展開來源再寫標題
        - 只解構舊標題
        - 只展開來源不指定新值
      answer: 1
      explain: 先帶入舊欄位，最後指定的新值才留得住。
  - id: fs-js-destructure-selector
    prompt: 陣列與物件解構分別依什麼配對？
    answer: 陣列依位置，物件依屬性名稱。
  - id: fs-js-copy-update-path
    prompt: 預覽只想改巢狀字級，需要在哪些層級建立新容器？
    answer: 新建外層卡片和要改的樣式物件，再覆蓋字級；未改的分支可共用。
    mcq:
      question: 若 draft 與舊卡共用 style，怎麼只改草稿的字級？
      options:
        - 直接指定 draft.style.size
        - 把舊卡改用 const 宣告
        - 新建 style，再把新 style 放入新草稿
        - 只複製草稿外層再寫原本的 style.size
      answer: 2
      explain: 只複製外層仍會拿到原樣式參照。應沿修改路徑建立新容器，不必複製未改的資料。
practice:
  - id: fs-js-b04-08-p1
    title: 保留一組不互相污染的預覽
    kind: code
    minutes: 12
    steps:
      - 建立 preview.js，比較外層與樣式兩次相等判斷
      - 倒轉草稿標題的順序，記錄差別再還原
      - 加入第二個標籤並用陣列解構讀出它
    checks:
      - 舊版字級 16、新版 20
      - 外層比較為假而原始草稿的樣式比較為真
      - 第二個標籤按位置讀出
---

## 改一張卡的外觀，不能把舊版一起改掉

清單提供編輯預覽：左邊是已儲存的課程，右邊是尚未套用的草稿。只是為了改標題就把每個欄位重新抄一次，很容易漏掉之後新增的欄位；可是直接指定給另一個名字，兩邊又共用整個物件。你需要兩種工具，一種簡潔地取出值，另一種建立要改動的新容器。

## 解構負責取，展開負責放

解構指定 (destructuring assignment) 按既有形狀取出值。物件用大括號、依鍵名取，宣告時 `const { title } = lesson` 等於從該物件讀取 title 放進同名變數。陣列用中括號、依位置取，第一個名字得到第一格，跟名字是否叫 first 無關。解構不會刪掉原欄位，也不會幫你把巢狀物件整份複製。

展開語法 (spread syntax) 用三個點，在新物件的大括號裡帶入來源自己的可列舉屬性，或在新陣列裡帶入可走訪的元素。一般資料物件若同一個鍵出現兩次，後面寫的值勝出。所以「保留其他欄位，只改標題」的順序，是先展開舊卡，再寫新的標題。外層是新的；欄位若是另一個物件，值仍是原本的參照，稱為淺層複製 (shallow copy)。

## 範例：比較 3 支箭頭，而不是只看畫面

在預覽資料改值前先畫出哪一層是新物件；不要只因為最外層是新的，就預測裡面每一層都已複製。把下面的範例存成 `C:\dev\stackway-lab\javascript` 裡的 `preview.js`。

在該目錄的終端機執行 `node preview.js`；各系統指令相同。

```js
const lesson = { title: "SQL", tags: ["db"], style: { size: 16 } };
const { title, tags } = lesson;
const [firstTag] = tags;
const draft = { ...lesson, title: "SQL lab" };
console.log(title, firstTag, draft.title);
console.log(draft === lesson, draft.style === lesson.style);
const larger = { ...draft, style: { ...draft.style, size: 20 } };
console.log(lesson.style.size, larger.style.size);
```

第一行結果中，同時出現舊標題和新標題，並不表示解構能觀察未來的修改；title 保存的是當下讀到的字串。第二行先比整張卡是不同物件，再比裡面的 style 還是同一個。第三行另建一層樣式物件，才能放心把新字級存為 20 而讓左邊保留 16。沒有要改的 tags 可以繼續共用，無須為了獨立一個字級就把整份資料複製到底。

### 把展開次序倒轉

在草稿那一行，把新標題移到展開之前再跑一次。兩個物件仍不是同一個，但畫面上的新標題消失了；原因不是複製失敗，而是後來展開的舊值蓋回去。除錯時把「是否獨立」和「重複鍵最後取誰」分開測，才能知道要修的是哪一行。

你也可以反過來問：如果下一步要改的是第一個標籤而非字級，該另建哪個容器？答案會從樣式物件換成標籤陣列。要複製幾層，取決於修改走過的路，不是由資料總共有幾層決定。

## 常見錯誤

看到三個點就認為沒有任何共享，接著直接寫 `draft.style.size = 20`。外層不同仍可能一路走到同一個樣式物件。另一個陷阱是猜陣列解構依欄位名稱拿值，實際只要元素順序一換，第一個標籤也會跟著換。

## 小結

讀資料時選名字或位置；寫預覽時沿著要修改的路徑建立新容器。驗證方法是讓舊版與新版同時留在畫面上，分別比外層身分、內層身分和最後數值。
