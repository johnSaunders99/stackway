---
id: fs-react-03-typed
module: fs-react
order: 3
title: React props 型別
subtitle: 少傳一個欄位，先在編輯器發現
status: ready
minutes: 30
level: 3
prereqs:
  - fs-react-01-components
objectives:
  - 用 TypeScript 定義元件 props 與選填回呼
  - 比較編譯時漏傳欄位與執行時資料無效的差異
tags:
  - react
  - typed
resources:
  - title: React：使用 TypeScript
    url: https://react.dev/learn/typescript
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 看元件 props 與回呼的型別。
  - title: React：傳遞 props
    url: https://react.dev/learn/passing-props-to-a-component
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: "2026-11-20"
    note: 複習哪些輸入由呼叫者提供。
concepts:
  - id: fs-react-03-typed-required
    prompt: 什麼情況應把 props 欄位設為必填？
    answer: 元件要完成基本用途時不可缺少的值應必填，不應為了消除診斷隨便加問號。
    mcq:
      question: 哪一個使用端應在型別檢查階段被指出有錯？
      options:
        - 給 id 與 title，省略 onPick
        - 給齊兩個字串並傳相容回呼
        - 只給 id 的 Card
        - 給 id 和空字串 title
      answer: 2
      explain: title 必填；空字串仍是字串，若不允許空值要另外做內容驗證。
  - id: fs-react-03-typed-callback
    prompt: 選填回呼不存在時，怎樣讓行為符合介面？
    answer: 只有提供回呼才提供操作，元件呼叫時交回定義好的參數。
    mcq:
      question: "onPick 的約定是 (id: string) => void，課程卡應交回什麼？"
      options:
        - 整個滑鼠事件
        - 該卡的字串識別碼
        - 顯示分鐘數
        - 元件函式本身
      answer: 1
      explain: 約定的是業務識別碼，不是觸發手勢或元件細節。
    interview:
      question: 同一張卡有時能選、有時只能看，你會怎麼設計 props？
      points:
        - 基本識別與標題必填
        - 回呼可省略且有參數型別
        - 無回呼時不顯示假按鈕
      answer: 我會讓 id 與 title 必填，另外收一個選填的 onPick。唯讀情境根本不顯示選取按鈕；可選時只把 id 交回父層。若資料來自外部，我還會先驗證才交給卡片。
  - id: fs-react-03-typed-runtime
    prompt: 有 TypeScript 型別後，外部 JSON 還需要驗證嗎？
    answer: 需要，靜態型別不會在執行時自動檢查收到的資料。
    mcq:
      question: 網路回覆缺 title，硬寫成 CardProps 能達到什麼？
      options:
        - 不能補上缺值，也沒有完成執行時驗證
        - 自動補一個預設標題
        - 自動拒收錯誤 JSON
        - 保證傳進來的一定是字串
      answer: 0
      explain: 型別斷言不是檢查程式，執行時仍可能讀到無效資料。
practice:
  - id: fs-react-03-typed-p1
    title: 為卡片做一組通過與不通過的呼叫
    kind: code
    minutes: 12
    steps:
      - 放入範例，觀察唯讀與可選卡
      - 暫拿掉一個必填標題，記下診斷後還原
      - 按可選卡並保存最終版檔案
    checks:
      - 沒有回呼的卡不出現按鈕
      - 漏標題會被型別檢查指出，補回後可選卡交回 rights
---

## 為什麼要學：在有人按下按鈕之前，就知道欄位漏了
卡片一定要有課名，但有些卡片只供閱讀，不提供「選取」功能。若靠記憶約定參數，少傳一個標題可能到瀏覽器才看到空白；為了省事把所有欄位都設成可省略，又會讓真正必要的東西無法被檢查。這堂把介面寫成明確的約定，並用兩個呼叫端測試「必填」和「選填」是否真的不同。

## 核心概念：型別描述呼叫者的責任
輸入資料的型別（props type）描述元件可以接收的欄位及各自的值。`title: string` 要求課名是字串；`onPick?: (id: string) => void` 的問號表示可省略，若提供，必須是可以接收識別碼的回呼函式（callback）。`void` 表示呼叫者不使用回傳值，不是要求函式一定要印出文字。

傳入回呼讓卡片告訴父層「哪張被選」，至於要顯示提示、更新選擇或記錄操作，則由提供函式的一方決定。這裡只用瀏覽器的訊息框當可見證據。按鈕的 `onClick` 需要一個等點擊才呼叫的函式，下一堂[〈React 事件處理〉](#/lesson/fs-react-04-events)會比較傳函式與立即執行的差異。

## 範例：一張可選，另一張唯讀
在前面的 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）開啟開發預覽，將前一版另存後，以這個檔案作為 `src/App.tsx`。不需要新增套件。第一張只看文字，第二張則示範把識別碼交回；條件成立才建立按鈕，所以不會留一個按了沒有作用的控制項。

```tsx
type CardProps = {
  id: string;
  title: string;
  onPick?: (id: string) => void;
};

function Card({ id, title, onPick }: CardProps) {
  return <article>
    <h2>{title}</h2>
    {onPick && <button onClick={() => onPick(id)}>選取</button>}
  </article>;
}

export default function App() {
  return <main>
    <Card id="paths" title="讀路徑" />
    <Card id="rights" title="查權限" onPick={id => window.alert(id)} />
  </main>;
}
```

先確認只出現一個按鈕，點下後看見 `rights` 而不是畫面標題。接著暫時移除第一張的 `title`，在編輯器看錯誤指出缺少哪個屬性，再補回原值。也可以在專案根目錄另開 PowerShell 執行 `npm.cmd run build`，macOS 或 Linux 用 `npm run build`；本練習使用的 Vite TypeScript 範本，其建置指令含型別檢查。開發伺服器能更新畫面，本身不是檢查已通過的證據。

還可以做一次更細的對照：把課名改成空字串，型別檢查不會因為空白而拒絕，因為它仍是字串；但使用者可能看到沒有名字的卡。這提醒我們「型別正確」和「符合業務規則」不是同一份保證。如果產品要求必須有可見文字，就另外檢查修剪空白後的長度。

## 常見錯誤
把型別註記當成執行時的資料清洗。若課名來自剛收到的 JSON，寫一個型別斷言不會替它補上缺的字串；外部值仍要先驗證形狀，再交給元件。相反地，自己在 JSX 寫死欄位的呼叫，正是靜態檢查擅長抓錯的地方。不要用可以接受任何值的型別把這條提醒消音。

## 小結
保留一張唯讀卡、一張可選卡，以及漏填標題時診斷訊息的筆記。判斷是否要加問號時，先問「這個值不在時，產品有沒有合理的行為？」本例沒有回呼仍可完整閱讀，沒有課名卻無法辨認內容，所以兩個欄位的規則不同。
