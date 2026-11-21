---
id: fs-react-01-components
module: fs-react
order: 2
title: React 元件與 props
subtitle: 同一張卡片顯示不同資料
status: ready
minutes: 25
level: 3
prereqs:
  - fs-react-01-jsx
objectives:
  - 以 props 傳入顯示資料
  - 從需求切出有意義的元件邊界
tags:
  - react
  - props
resources:
  - title: React：傳遞 props 給元件
    url: https://react.dev/learn/passing-props-to-a-component
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 比較父層提供與子層讀取的寫法。
concepts:
  - id: fs-react-01-components-flow
    prompt: props 如何從父元件進入子元件？
    answer: 父元件在 JSX 指定屬性，React 把它們組成一個輸入物件交給子元件。
    mcq:
      question: 同一個 LessonCard 被呼叫兩次，哪裡決定兩張課名不同？
      options:
        - 子元件在檔案中的行號
        - 兩個呼叫位置傳入的 title
        - 函式名稱是否包含數字
        - 第一張卡片上次顯示什麼
      answer: 1
      explain: 每個元件實例各讀自己的輸入，不會自動根據呼叫次數產生課名。
  - id: fs-react-01-components-ownership
    prompt: 誰應負責修改父元件傳入的 props？
    answer: 子元件將收到的資料視為唯讀；變更由擁有資料的一方提供新值。
    mcq:
      question: 子元件只想顯示格式化課名，應怎麼做？
      options:
        - 在渲染時計算顯示文字
        - 直接寫回 props.title
        - 改掉另一張卡片的輸入
        - 先把固定值寫進父層檔案
      answer: 0
      explain: 格式化是呈現工作，不必改寫呼叫者的資料。
  - id: fs-react-01-components-boundary
    prompt: 兩張卡片適合共用哪一條元件邊界？
    answer: 把相同的卡片結構與顯示規則放在元件內，課名與時數由外部提供。
    mcq:
      question: 所有卡片的時間前綴都要改，哪種設計只動一處？
      options:
        - 每個父層手寫一份完整卡片
        - 每張用固定課名的新函式
        - 把時間和課名都改成全域常值
        - 共用 LessonCard，前綴由元件渲染
      answer: 3
      explain: 共用外觀不等於共用資料；各卡仍要能讀自己的課名與時數。
    interview:
      question: 什麼時候會把一段 JSX 抽成卡片？
      points:
        - 說明會一起變更的畫面規則
        - 保留每筆資料的彈性
        - 能用兩個案例驗證
      answer: 如果同一張卡的結構與前綴要一起維護，我會抽一個元件，只收課名和時數。改第二筆不該動第一張，改共同前綴卻該兩張都動；這兩個測試能確認邊界。
practice:
  - id: fs-react-01-components-p1
    title: 留下一個定義、兩種資料的卡片頁
    kind: code
    minutes: 10
    steps:
      - 建兩個 LessonCard 呼叫，給不同課名與時數
      - 只改第二張的時數，接著改共同前綴
      - 保存元件檔並標註兩次改動位置
    checks:
      - 第一個改動只更新第二張
      - 第二個改動讓兩張同步換前綴，不必複製元件
---

## 為什麼要學：第 2 張卡片不是複製第 1 張再改字
有兩堂課想用相同版面呈現。複製整段標記固然很快，但將來要替分鐘加上單位或改善標題層級，就容易只改到其中一張。先問需求中哪些東西總是一起改，哪些每次都不同：卡片的結構是一個決定，課名與時間卻是每一筆資料的決定。這條界線正好可以變成元件的輸入。

## 核心概念：由呼叫端提供資料，由元件決定怎麼畫
元件（component）是可重用的畫面單位。父元件（parent）在 JSX 上寫屬性，把輸入資料（props）交給子元件（child）。React 呼叫子元件時，把這些欄位包在同一個物件裡；它們不是依位置分別傳進來的參數。子元件可以讀、格式化或選擇呈現方式，不該直接改父元件傳來的物件。下次上層提供不同值，子元件會依新的輸入描述畫面。

先用一句話定義邊界：「給我一個課名和分鐘數，我畫一張課卡。」這比「第一張卡」「側欄第二行」更穩定，因為需求換順序時不必更改元件名稱。也不必為了讓檔案看起來細緻，就把單一冒號、單一單位都拆成新元件；抽出來應該能說清楚共用的是什麼行為或版面。

## 範例：同一種卡片，資料各自不同
在上一堂建立的 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）保留本機開發伺服器，先把舊檔另存到 `snapshots`，再將 `src/App.tsx` 換成下列內容。Windows 若已關掉伺服器，在專案根目錄開 PowerShell 執行 `npm.cmd run dev`；其他系統用 `npm run dev`。不必再安裝套件。參數後面的冒號是在說這個物件要有哪些型別，下一堂[〈React props 型別〉](#/lesson/fs-react-03-typed)會細講。

```tsx
function LessonCard(props: { title: string; minutes: number }) {
  return (
    <article>
      <h2>{props.title}</h2>
      <p>練習時間：{props.minutes} 分鐘</p>
    </article>
  );
}

export default function App() {
  return (
    <main>
      <h1>今天的課表</h1>
      <LessonCard title="讀路徑" minutes={15} />
      <LessonCard title="查權限" minutes={30} />
    </main>
  );
}
```

先只把第二次呼叫的 30 改成 35，預測哪裡會變。再不動兩個呼叫位置，只把子元件的「練習時間」改成「預計用時」。這次兩張都會改。兩次編輯刻意分開：第一次證明資料可獨立設定，第二次證明版面與共同用語確實只有一個來源。不是因為頁面恰好出現兩張長得很像的卡，就能宣稱已完成重用。

想替卡片換位置時，可以先把兩個呼叫前後對調。若資料仍各自跟著課名，而不是跟著上面或下面的位置，就表示你沒有偷偷把位置當成內容的一部分。

## 常見錯誤
呼叫時寫成小寫開頭，React 會把它當成原生或自訂標籤而不是這支函式；或把 `minutes={15}` 改成帶引號的數字，結果傳出字串。若兩張突然顯示一樣的課名，查看子元件有沒有偷讀檔案最上面的固定資料，而不是讀自己的輸入。元件也不需要知道父層稱它為第一張還是第二張。

## 小結
保留「一個定義、兩個呼叫」的檔案，並用一句話寫出誰擁有課表、誰負責卡片外觀。如果要新增第三堂，應該只需給新的資料，不用先複製一份卡片函式。這個判準比計算程式碼少了幾行更有用。
