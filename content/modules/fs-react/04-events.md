---
id: fs-react-04-events
module: fs-react
order: 4
title: React 事件處理
subtitle: 按下按鈕才執行，不是在畫面出現時
status: ready
minutes: 25
level: 3
prereqs:
  - fs-react-03-typed
objectives:
  - 把處理函式傳給 onClick
  - 從輸入事件讀取目前值並決定狀態更新
tags:
  - react
  - events
resources:
  - title: React：回應事件
    url: https://zh-hant.react.dev/learn/responding-to-events
    kind: doc
    lang: zh-Hant
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 對照傳入函式和立即呼叫。
concepts:
  - id: fs-react-04-events-handler
    prompt: onClick 收函式和直接呼叫函式有何差異？
    answer: 前者在互動時執行，後者在計算畫面當下就執行並交出回傳值。
    mcq:
      question: 確認函式無參數，只想在啟用按鈕後呼叫，該傳什麼？
      options:
        - onClick={confirmDraft()}
        - onClick="confirmDraft"
        - 在元件開頭直接 confirmDraft()
        - onClick={confirmDraft}
      answer: 3
      explain: 傳函式保留呼叫時機；執行後的回傳值或字串不是這裡要的處理函式。
    interview:
      question: 畫面一打開就送出資料，你會先查哪一段？
      points:
        - 檢查 JSX 是否立即呼叫
        - 區分渲染與互動
        - 測未點擊和已點擊兩個時刻
      answer: 我先看 onClick 收到的是函式還是函式的執行結果，把應該延後的動作包進處理函式。驗收時先開頁不操作，再打一段字，最後才點確認，檢查回條只變一次。
  - id: fs-react-04-events-input
    prompt: 文字框的 onChange 如何取得這次編輯後的新字？
    answer: 從 e.currentTarget.value 讀取，交給草稿的設定函式。
    mcq:
      question: 事件安裝在文字輸入框上，哪個值應更新預覽？
      options:
        - e.type
        - e.currentTarget.name
        - e.currentTarget.value
        - e.timeStamp
      answer: 2
      explain: 後面三者描述事件種類、欄位名稱與時間，不是輸入內容。
  - id: fs-react-04-events-receipt
    prompt: 預覽與上次確認回條為何不該在每次打字時一起更新？
    answer: 兩者代表不同時點，回條應記住上次確認的草稿，而非目前正在編輯的值。
    mcq:
      question: 先確認「路徑」，再改草稿成「權限」但不確認，預期畫面是？
      options:
        - 兩者都是權限
        - 預覽權限，回條路徑
        - 兩者都是路徑
        - 回條消失，預覽不變
      answer: 1
      explain: 輸入只更新草稿，確認事件才建立新的回條。
practice:
  - id: fs-react-04-events-p1
    title: 截下預覽與回條不同的瞬間
    kind: code
    minutes: 10
    steps:
      - 在 App.tsx 建立輸入框與確認按鈕
      - 輸入「路徑」並確認，再改成「權限」但不按
      - 留下兩行文字不同的截圖
    checks:
      - 輸入即更新預覽，單靠輸入不更新回條
      - 用鍵盤啟用確認後回條變成權限
---

## 為什麼要學：打開頁面不等於按下按鈕
文字框裡的草稿一邊輸入一邊變動；旁邊的確認訊息卻應該只在按下按鈕那一刻更新。如果畫面剛出現就彈出通知，或一打字就被當成已送出，程式可能把「描述按鈕」和「按鈕被使用」當成同一步。這堂把兩種互動拆開，讓你能預測每一次操作後哪一行會變、哪一行該保持原樣。

## 核心概念：交出函式，讓 React 在事件發生時呼叫
事件（event）是點擊或輸入等已發生的互動。事件處理函式（event handler）描述那時要做的事；在 JSX 寫 `onClick={confirmDraft}` 會交出函式本身，寫 `confirmDraft()` 則是現在就運算呼叫結果。若需要附帶參數，可交出一個小函式，由它在稍後才帶參數呼叫真正的處理工作。畫面渲染（render）是 React 計算要顯示什麼，不應在這個計算過程要求使用者確認。

`useState` 是讓元件記住值並要求更新畫面的 Hook，回傳目前值與設定函式；本例先用它記兩種不同時間點的文字，之後在[〈元件狀態與狀態提升〉](#/lesson/fs-react-02-state)會細講由誰持有。輸入事件的 `currentTarget` 是安裝此處理函式的元素，在文字框上讀它的 `value`，就是這次編輯後的新文字。不要把整個事件物件當成要顯示的字串。

## 範例：輸入預覽和按鈕回條
在 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）的本機預覽，把上一版留在 `snapshots`，再以這段作為完整的 `src/App.tsx`。先不操作，記下兩行提示。之後輸入、確認、再輸入，把三個時刻的結果分開觀察。這是本機互動示範，不會寫入檔案或傳送網路請求。

```tsx
import { useState } from 'react';

export default function App() {
  const [draft, setDraft] = useState('');
  const [receipt, setReceipt] = useState('尚未確認');
  function confirmDraft() {
    setReceipt(draft.trim() || '沒有內容');
  }
  return <main>
    <label>課名 <input value={draft}
      onChange={e => setDraft(e.currentTarget.value)} /></label>
    <p>預覽：{draft}</p>
    <button type="button" onClick={confirmDraft}>確認</button>
    <p>上次確認：{receipt}</p>
  </main>;
}
```

輸入「路徑」時只該動預覽；按確認後回條也變成「路徑」；接著改成「權限」，回條仍是「路徑」。這表示處理函式讀取的是確認那次畫面所提供的草稿，而不是把兩個變數綁成永遠相等。用鍵盤定位到原生按鈕再啟用，也應該走同一條確認流程，不必另外寫一份鍵盤專用的業務邏輯。

試著在空白的文字框按一次確認：回條會變成「沒有內容」，並非什麼都沒有發生。這和打開頁面、尚未按鍵時的「尚未確認」不同。刻意安排兩種可辨認的文字，可以在不用讀原始碼時，也能分清是不是有人提早呼叫了處理函式。

## 常見錯誤
把設定函式直接放進 JSX 並呼叫，會在計算畫面時一直要求更新，可能導致反覆渲染，並不是「按下去反應特別快」。另一個誤會是對一般區域變數直接賦值，期待 React 自動知道要更新。用設定函式表達哪個畫面值改變；與畫面無關的一次性工作才放在一般敘述中。

## 小結
用截圖保留「預覽是權限、回條是路徑」的時刻。它比兩邊都顯示同一段字更有辨識力：只有把輸入事件和點擊事件確實分開，才做得出這張圖。
