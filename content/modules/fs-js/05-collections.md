---
id: fs-js-05-collections
module: fs-js
order: 5
title: 陣列與物件屬性
subtitle: 一列資料該用位置還是名字來讀
status: ready
minutes: 30
level: 2
prereqs:
  - fs-js-04-functions
objectives:
  - 用陣列描述有順序的紀錄、物件描述一筆紀錄
  - 示範索引、屬性存取與新增欄位
tags:
  - js
  - collections
resources:
  - title: MDN：以屬性描述物件
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-js-record-position
    prompt: 多筆有順序、每筆有具名欄位的資料適合什麼形狀？
    answer: 外層用陣列表示順序，內層用物件描述各筆欄位。
    mcq:
      question: 要讀第二堂的標題，該寫哪一項？
      options:
        - lessons[2].title
        - lessons[1].title
        - lessons.title[1]
        - lessons[0].title
      answer: 1
      explain: 先選陣列第二格，再讀該物件的具名屬性。
    interview:
      question: 清單排序後完成記號跑錯堂，你會先查資料還是樣式？
      points:
        - 分辨位置與資料身分
        - 檢查更新目標
        - 選穩定識別值
      answer: 我會先看寫入用的是「當時第二格」還是課程自己的識別值。重新排序會換位置，但不該換課；我會找對那筆物件才寫完成欄。
  - id: fs-js-computed-key
    prompt: 欄位名稱存於 key 變數，怎樣讀對應的值？
    answer: 使用 row[key]，點號後面的 key 會被當成固定名稱。
    mcq:
      question: key 的值為 minutes，哪項會依這個變數選欄？
      options:
        - row.key
        - row.length
        - row[key]
        - row[0]
      answer: 2
      explain: 中括號可求出運算式的值；點號不會查同名變數。
  - id: fs-js-new-property
    prompt: 替第二筆物件新增欄位，第一筆會跟著新增嗎？
    answer: 若它們是各自建立的物件，不會；屬性寫入作用在被選的物件上。
practice:
  - id: fs-js-b04-05-p1
    title: 替課表加一筆並核對位置
    kind: code
    minutes: 10
    steps:
      - 儲存 lesson-list.js
      - 加第三個不同標題與分鐘數的物件
      - 印出第三堂的標題，再用指定欄位名讀它的分鐘
    checks:
      - 長度為 3，第三堂的索引是 2
      - 只有原本第二堂有 done
      - 改變 key 的值會改到所讀的欄位
---

## 第 2 堂課，和課程的第 2 個欄位，是同一件事嗎？

今日清單排了三堂課。使用者說「把第二堂往前挪」，是在說順序；說「在第二堂旁邊寫上分鐘數」，是在說那堂課的特徵。如果把標題、時間、完成狀態全塞進一長串值，改了順序就可能把標題配給錯誤的分鐘數。資料的形狀應該讓這兩種操作看起來也不同。

## 位置交給陣列，意義交給屬性

陣列 (array) 是有順序的集合，用中括號寫，第一格索引是 0。它的 length 表示長度；對這份連續清單而言，最後合法索引是長度減 1。物件 (object) 把一個個屬性 (property) 放在具名的鍵之下，例如 title 對應標題、minutes 對應時間。用大括號建立物件，鍵和值之間用冒號，各欄位間用逗號。要表示一份有順序的課表，就把每堂課寫成一個物件，再把這些物件放進陣列。

讀固定欄位可以用點號；欄位名由變數決定時則用中括號。`row.key` 從字面找名為 key 的屬性；`row[key]` 先算出變數 key 的值，再到物件上查那個名字。兩者外觀只差一點，意思卻不同。寫入尚未存在的普通屬性會在該物件上新增一欄，不會替其他物件一起補上。

## 範例：替第 2 堂課加一個完成記號

先用索引找到指定的那筆資料，再用屬性名稱找欄位；如果順序對調，拿到的會是什麼？把下面的範例存成 `C:\dev\stackway-lab\javascript` 裡的 `lesson-list.js`。

在該目錄的終端機執行 `node lesson-list.js`；各系統指令相同。

```js
const lessons = [
  { title: "DNS", minutes: 25 },
  { title: "SQL", minutes: 30 },
];
const target = lessons[1];
const key = "minutes";
target.done = true;
console.log(lessons.length, target.title, target[key]);
console.log(lessons[0].done, lessons[1].done, target.key);
```

先從左往右念 `lessons[1].done`：「找清單、取第二格、到那筆資料讀完成欄。」這比把整串符號當成一個神祕名字容易除錯。範例先拿出第二筆的參照，再改屬性；由原陣列讀回去也看得到 true。第一筆沒有這個屬性，讀到的是 undefined，不是自動填了一個 false。最後一項同樣是 undefined，原因則是沒有叫作 key 的欄位。

### 什麼時候不能只記位置？

列表永遠可以重新排序；今天第二個是 SQL，不代表明天也是。如果需求是「目前第二格」，用索引很合適；若需求是「把指定課程標成完成」，應給每筆資料穩定識別值，先找出那筆再寫。欄位取名也應反映它存的是什麼：minutes 會讓下一位讀者知道 30 的單位，不必從頁面的樣式猜測。

把兩筆課程的順序交換，先預測讀取第二格會換成什麼標題；原先各筆的分鐘卻應跟著課程移動，而不是永遠綁在第二格。

## 常見錯誤

把第二筆讀成索引 2，剛好遇到只有 2 筆的清單，就會讀到不存在的格子；再接著讀它的標題會報錯。先比較索引與長度，不要期待缺資料時點號會自動跳過。另一個錯誤是為資料夾心智模型加太多層：陣列只處理順序，物件只描述一筆，把這個界線保持簡單。

## 小結

用一句話讀出每個括號：這一步是依位置挑一筆，還是依名字挑一欄？講得出來，資料形狀就能跟得上清單以後的調整。
