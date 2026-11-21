---
id: fs-react-05-lists
module: fs-react
order: 6
title: 清單與穩定的 key
subtitle: 重新排序也不丟失輸入
status: ready
minutes: 35
level: 3
prereqs:
  - fs-react-02-state
objectives:
  - 選擇穩定的資料識別值當 key
  - 用插入首列的案例檢查元件狀態
tags:
  - react
  - keys
resources:
  - title: React：渲染清單
    url: https://zh-hant.react.dev/learn/rendering-lists
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 讀鍵值的用途與來源。
concepts:
  - id: fs-react-05-lists-identity
    prompt: 在可重排清單中，key 應辨認資料還是位置？
    answer: 使用同層唯一且跨渲染穩定的資料識別碼辨認那一筆。
    mcq:
      question: 新課插到最前而舊課的備註要跟著課走，哪個 key 適合？
      options:
        - 目前索引
        - 建立資料時固定的課程 id
        - 這次渲染的亂數
        - 顯示分鐘數
      answer: 1
      explain: 索引會換對象，亂數會換身分，分鐘也可能重複或改變。
    interview:
      question: 列表插入一列後，為什麼輸入看起來跑到別的課？
      points:
        - 辨認索引跟位置
        - 說明舊元件狀態配到新資料
        - 用固定 id 重測
      answer: 我會先查有沒有用索引當 key。新增首列時舊位置換了課，輸入狀態卻留下。我會改用資料 id，再先打一段獨特備註才插入，檢查它是否跟著原課名。
  - id: fs-react-05-lists-location
    prompt: 把 key 放在 Row 內層的 li，能替父層配對 Row 嗎？
    answer: 不能，父層應在迭代直接回傳的 Row 上給 key。
    mcq:
      question: rows.map 直接回傳 Row 時，哪個元素該帶兄弟清單的 key？
      options:
        - Row 呼叫本身
        - Row 裡的 input
        - 包住整份清單的 ul
        - 頁面唯一的 main
      answer: 0
      explain: React 在同一父層的直接子項目間比對，內部的鍵不會替外面標記身分。
  - id: fs-react-05-lists-test
    prompt: 怎樣測出索引鍵造成的狀態錯配？
    answer: 先在一筆具名資料輸入獨特草稿，再於首列插入資料，檢查草稿是否仍屬於同一課。
    mcq:
      question: 哪個測試即使列數正確，也能抓到狀態跑錯列？
      options:
        - 只看總列數變多
        - 只看第一列課名
        - 只看主控台是否安靜
        - 核對備註是否仍跟著原課名
      answer: 3
      explain: 排版和列數都對仍可能錯配，必須追蹤有身分的狀態。
practice:
  - id: fs-react-05-lists-p1
    title: 留下穩定鍵與索引鍵的對照畫面
    kind: code
    minutes: 15
    steps:
      - 用穩定 id 在查權限打獨特備註後插入
      - 只改成索引鍵，重新整理重做一次
      - 留下兩次插入後的畫面，最後改回 id
    checks:
      - 兩次清單都變成 3 列
      - 穩定鍵讓備註留在查權限，索引鍵下備註錯配
---

## 為什麼要學：多加一堂課，草稿竟跑到隔壁列
在第二列輸入「回家再練」，接著把一堂新課插到清單開頭。畫面上的課名全都正確，備註卻換了主人。這個錯誤靠數一數有幾列不會被發現；必須先讓其中一列擁有不同於其他列的狀態，再改變順序，才看得出畫面是否仍把同一堂課當成同一列。

## 核心概念：位置會變，資料的身分不該變
陣列的 `map` 把每筆資料轉成一個畫面元素。鍵值（key）讓 React 在同一個父元素的子項目之間，辨認前後兩次渲染的哪一項對應同一身分。搭配相同元件型別時，即使位置改變，React 仍能把那一列自己的狀態留給它。鍵值只須在同一組兄弟項目中唯一，不是整個網站共用的流水號，也不是排序指令。

陣列索引（index）回答「排第幾」；資料識別碼回答「是誰」。若清單會插入或重排，兩個問題的答案不會永遠一致。用目前時間或每次重新抽亂數更糟：它讓同一筆資料每次看來都像新人，元件可能被卸載再建立，輸入焦點或草稿就遺失。若資料沒有識別碼，在建立資料的那一刻給它穩定的值，而不是在畫面重算時才產生。

## 範例：先寫備註，再插入首列
在 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）把上一版另存，將 `src/App.tsx` 換成下面的完整元件。這次讓每列自己保存練習備註；新增首列只允許一次，避開重複插入相同識別碼的混淆。清單列採用真正的標籤關聯，點課名也能把焦點移到該列輸入框。

```tsx
import { useState } from 'react';
const initial = [{ id: 'b', title: '讀路徑' }, { id: 'c', title: '查權限' }];
function Row({ title }: { title: string }) {
  const [note, setNote] = useState('');
  return <li><label>{title} <input value={note}
    onChange={e => setNote(e.currentTarget.value)} /></label></li>;
}
export default function App() {
  const [rows, setRows] = useState(initial);
  const added = rows.some(row => row.id === 'a');
  return <main>
    <button disabled={added} onClick={() => setRows([{ id: 'a', title: '看終端機' }, ...rows])}>
      插入首列
    </button>
    <ul>{rows.map(row => <Row key={row.id} title={row.title} />)}</ul>
  </main>;
}
```

先在「查權限」打字，再插入。它從第二列變成第三列，草稿應跟課名一起移動。要做反例，只把迭代改成 `rows.map((row, index) => <Row key={index} title={row.title} />)`，重新整理清空舊狀態後重做同一組動作。原本第二個位置的草稿現在可能掛在「讀路徑」上。比較完改回穩定識別碼。

想知道問題是否來自輸入元件本身，可以先只改課名但不重排。它通常還能正常打字，表示「能不能編輯」並不是足夠的測試。再用完全相同的文字和順序比較穩定鍵與索引鍵，兩種做法只有插入時才分出差異。若重新整理清空備註，要先重打再插入，別拿全空的列當對照，因為它們的狀態肉眼看不出差別。

## 常見錯誤
把鍵值放在 Row 內的 `li` 上，外面的清單仍然看不出三個 Row 的身分；應該標在 `map` 直接回傳的元素上。另一個錯誤是想在子元件讀 `props.key`。這個識別記號由 React 使用，若子元件也需要資料識別碼，另外傳一個普通屬性。

## 小結
驗收寫成「備註跟著課程，不是跟著第幾列」。留一張插入後的截圖，並在旁邊標明你輸入時的課名。即使將來由排序、刪除或過濾取代插入，同一個判準仍然有用。
