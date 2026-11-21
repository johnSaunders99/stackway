---
id: fs-react-11-context
module: fs-react
order: 11
title: Context 與共用狀態
subtitle: 切換主題時不逐層傳遞設定
status: ready
minutes: 30
level: 3
prereqs:
  - fs-react-10-query
objectives:
  - 用 provider 與消費元件共享設定
  - 比較應保留在元件內的值與適合用 context 的值
tags:
  - react
  - context
resources:
  - title: React：透過 Context 跨層傳值
    url: https://react.dev/learn/passing-data-deeply-with-context
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 看最近的提供者與巢狀範圍。
concepts:
  - id: fs-react-11-context-scope
    prompt: useContext 會讀取哪個提供者？
    answer: 讀取元件上方最近、使用同一 Context 物件的提供者；沒有時才用預設值。
    mcq:
      question: 標籤放在提供者旁邊而不是裡面，提供者改成夜讀，它讀到什麼？
      options:
        - 同層提供者的夜讀
        - 全站最近一次按鈕事件
        - 建立 Context 時的日讀預設值
        - 一定拋錯
      answer: 2
      explain: 是否包在後代範圍內比畫面上看起來近不近更重要。
  - id: fs-react-11-context-storage
    prompt: Context 與保存目前偏好的 state 如何分工？
    answer: state 保存可改變的值，Context 把提供者給的值傳給對應範圍的讀者。
    mcq:
      question: 切換鍵按下後，哪一項改變才讓內容讀到新模式？
      options:
        - 重新命名 Context 變數
        - 父層 state 更新，提供者收到新的 value
        - 每次重建 Context 物件
        - 子元件修改預設值
      answer: 1
      explain: 更新來源值才會傳遞新偏好；重建物件反而切斷配對。
  - id: fs-react-11-context-local
    prompt: 為什麼卡片的私人草稿不必放進主題 Context？
    answer: 只有該卡使用的資料放在卡內即可，不需要擴大共享與更新範圍。
    mcq:
      question: 下列需求何者較適合使用 Context？
      options:
        - 多層後代共用同一閱讀偏好
        - 單一輸入框的暫存字
        - 一個子元件顯示父層直接給的標題
        - 函式內一次加總的區域值
      answer: 0
      explain: 有跨層共享的實際需求才值得建立提供範圍。
    interview:
      question: 團隊想把所有 state 都丟進 Context，你怎麼選邊界？
      points:
        - 盤點哪些讀者真的共用
        - 區分傳遞途徑與資料擁有者
        - 保留元件自己的草稿
      answer: 我會讓閱讀偏好由共同父層持有，再提供給那一區的讀者。私人輸入框留在卡片；我還會放一個標籤在範圍外，確認切模式只影響該受影響的區塊。
practice:
  - id: fs-react-11-context-p1
    title: 畫一張有內外邊界的閱讀卡
    kind: code
    minutes: 12
    steps:
      - 將兩個 Badge 一個放提供者內、一個放外
      - 寫入私人草稿再切換模式
      - 保存截圖並圈出哪些值屬於共用範圍
    checks:
      - 切換後內夜外日，草稿仍在
      - 中間的 ReadingCard 不需要接收 mode 參數
---

## 為什麼要學：只是切換主題，為什麼中間的版面也得改？
閱讀頁的偏好設定在最上層，顯示「目前是夜讀模式」的標籤卻藏在卡片裡。為了這行字，把主題從頁面傳給版面、版面再傳給卡片，每個中間元件都得認識一個自己根本不用的參數。這就是適合考慮 Context 的訊號。但卡片裡尚未送出的私人草稿，不會因為也在這棵畫面樹上，就該一起搬上去。

## 核心概念：提供的是一個範圍，不是全站的變數
情境（context）讓上層提供的值能被下層直接讀到。先在元件外建立同一個 Context 物件；提供者（provider）以 `value` 指定其子樹要使用的值；消費元件（consumer）用 `useContext` 往上找最近的對應提供者。若一路都找不到，才會拿到建立時的預設值。提供者只涵蓋它包住的後代，不涵蓋旁邊另一棵樹。

Context 是傳遞途徑，並不自己記錄變更。實際的偏好仍由上層的狀態（state）保存，按鈕透過設定函式切換它。值改變時，讀取該 Context 的元件會取得新值，不必請中間層代傳。反過來，只有父子兩層要交換一次的值，用普通 props 通常更容易看出依賴；不是少寫幾個參數就值得多建一層機制。

## 範例：同一個標籤，放在範圍內外
在 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）將前一版另存後，以下列內容作為 `src/App.tsx`。本例用傳統的 `.Provider` 寫法，可在 React 18 與較新的環境使用。外部標籤故意放在提供者旁邊，讓你不必打開開發工具就能驗證「最近的提供者」這條規則。

```tsx
import { createContext, useContext, useState } from 'react';
type Mode = '日讀' | '夜讀';
const Theme = createContext<Mode>('日讀');
function Badge() {
  const mode = useContext(Theme);
  return <strong>{mode}</strong>;
}
function ReadingCard() {
  const [note, setNote] = useState('');
  return <article>卡片模式：<Badge />
    <label>私人草稿 <input value={note} onChange={e => setNote(e.currentTarget.value)} /></label>
  </article>;
}
export default function App() {
  const [mode, setMode] = useState<Mode>('日讀');
  return <main>
    <button onClick={() => setMode(m => m === '日讀' ? '夜讀' : '日讀')}>切換閱讀模式</button>
    <Theme.Provider value={mode}>
      <section style={{ background: mode === '夜讀' ? '#20242a' : '#fff', color: mode === '夜讀' ? '#fff' : '#222' }}>
        <ReadingCard />
      </section>
    </Theme.Provider>
    <p>範圍外：<Badge /></p>
  </main>;
}
```

先輸入草稿，再切到夜讀。背景與卡片內標籤應一起改，外部標籤仍是日讀；草稿保留，因為元件沒有被移除或換身分。若內外都一樣，先判斷是初始值剛好相等，還是切換後真的仍同值。把外部標籤移進提供者，再試一次，只有它讀值的範圍改變，不必修改標籤函式本身。

把卡片複製一張放在同一個提供者內，也是有用的預測：兩個標籤都會看到同一個模式，但兩個輸入框不會自動共用文字。這個差異正好把「在同一個範圍讀值」與「每個元件都有自己的狀態」放在同一頁比較。

## 常見錯誤
替每張卡重新建立一個同名 Context。名稱相同的不同物件不會自動接起來，提供與讀取必須使用同一個物件。另一種錯誤是把所有表單草稿塞進同一個高層值，讓互不相關的讀者也得感知變更。選擇邊界時先列出誰真的需要共享，而非誰剛好在同一頁。

## 小結
在元件樹上圈出提供者包住的部分，另外在卡片旁標出私人草稿。能指出「這個值從哪裡來、哪些讀者不應該一起變」比把所有狀態都稱作全域更有幫助。
