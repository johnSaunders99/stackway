---
id: fs-react-02-state
module: fs-react
order: 5
title: 元件狀態與狀態提升
subtitle: 哪一份狀態才是真的
status: ready
minutes: 30
level: 3
prereqs:
  - fs-react-04-events
objectives:
  - 把兩個畫面同步到同一來源
  - 刪掉能從既有資料推得的狀態
tags:
  - react
  - state
resources:
  - title: React：在元件間共享狀態
    url: https://react.dev/learn/sharing-state-between-components
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 追蹤共同父層、選擇值與回呼。
concepts:
  - id: fs-react-02-state-owner
    prompt: 兩個區塊要即時反映同一個選擇，狀態通常應放哪裡？
    answer: 由最近的共同父元件持有一份，透過 props 與回呼協調讀寫。
    mcq:
      question: 選擇器與摘要是兄弟元件，哪種設計最少同步責任？
      options:
        - 共同父層存選取 id，兩邊讀同一份
        - 每邊各存一份 id
        - 兩邊互改對方的網頁節點
        - 把目前標題寫死於摘要
      answer: 0
      explain: 兩個值副本會增加分歧機會，直接改節點也不維持 React 資料來源。
  - id: fs-react-02-state-derive
    prompt: 已知課表與選取 id，為什麼不用再存一份分鐘數？
    answer: 分鐘可在渲染時由課表查出，再存一份會引入不一致組合。
    mcq:
      question: 課表時數從 30 改成 35，哪個設計不需要改選擇事件？
      options:
        - 另外記一份固定為 30 的摘要狀態
        - 每個按鈕內手寫摘要字串
        - 只在首次載入複製分鐘
        - 摘要直接使用 lessons[id].minutes
      answer: 3
      explain: 直接查同一份課表會反映新內容；其他做法保留了容易落後的副本。
    interview:
      question: 兩個畫面顯示不同課名，怎樣找出多餘狀態？
      points:
        - 列出原始資料與衍生值
        - 找到最近共同父層
        - 由同一識別碼推得兩邊畫面
      answer: 我會列出「必須記住」的通常只有選取 id，再查課名與分鐘能否由現有課表求得。讓選擇器傳回 id，兩個畫面都從父層的新值渲染，不再維護第二份選擇。
  - id: fs-react-02-state-direction
    prompt: 子元件按鈕要改變上層選擇，資料怎麼流？
    answer: 子元件呼叫父層提供的回呼，父層更新狀態，再把新選擇傳回兩個讀者。
    mcq:
      question: 收到 pick 回呼的子元件應怎麼通知換課？
      options:
        - 直接修改 props.id
        - 重新建立父元件函式
        - 在事件中以新的 id 呼叫 pick
        - 只修改摘要段落的文字
      answer: 2
      explain: 回呼表達要求，真正的狀態擁有者負責更新。
practice:
  - id: fs-react-02-state-p1
    title: 畫出單一選擇的資料流
    kind: code
    minutes: 12
    steps:
      - 輸入範例並切換兩堂課
      - 將查權限改為 35 分鐘但不改點擊函式
      - 存檔並畫出兩個讀者、父層與回呼方向
    checks:
      - 查權限對應 35，讀路徑仍是 15
      - 只找到一份被保存的選取 id，摘要不另存分鐘
---

## 為什麼要學：2 個面板怎麼知道現在選了哪一堂？
左側按一下課名，右側詳情和上方摘要應該一起換。如果每個元件都記一份「目前選哪堂」，修好其中一處不代表另外兩處也會變。更麻煩的是，某次只更新標題、忘記分鐘，畫面就拼出一堂從不存在的課。問題不在於少呼叫一個設定函式，而在於用太多份彼此可能矛盾的資料表示同一個選擇。

## 核心概念：把最少的事實放在共同父層
狀態（state）是需要跨越畫面更新、又不能直接從現有輸入算出的資料。狀態提升（lifting state up）是把兩個子元件共用的那一份值移到最近的共同父元件。父層透過輸入資料（props）把目前值傳下去，再提供回呼讓子元件提出改變要求。資訊不是兩邊互相推送；父層接受要求改值，下次畫面自然會讀到同一份選擇。

衍生值（derived value）可由同一次渲染已知的資料算出。本例只需要記住一個課程識別碼，就能從課表查出標題與分鐘。不需另外儲存「選到的標題」、「選到的分鐘」或「是不是第一堂」；每增加一份副本，就多出一種可能忘記同步的情況。反過來，若本來就想保留「昨天看到的舊價格」，那是有獨立意義的歷史快照，不應和今天的即時衍生值混為一談。

## 範例：2 個區塊只接受一個選擇
在 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）保留上一版後，將下列完整內容放進 `src/App.tsx`，打開本機預覽。這張課表固定只有兩項，因此以 TypeScript 聯集限制識別碼。先追蹤一次點擊經過哪些函式，再看畫面，不要一開始就猜是哪個子元件在替另一個改文字。

```tsx
import { useState } from 'react';
const lessons = {
  paths: { title: '讀路徑', minutes: 15 },
  rights: { title: '查權限', minutes: 30 }
};
type Id = keyof typeof lessons;
function Picker({ id, pick }: { id: Id; pick: (id: Id) => void }) {
  return <nav aria-label="選課">
    <button aria-pressed={id === 'paths'} onClick={() => pick('paths')}>讀路徑</button>
    <button aria-pressed={id === 'rights'} onClick={() => pick('rights')}>查權限</button>
  </nav>;
}
function Summary({ id }: { id: Id }) {
  const item = lessons[id];
  return <p>目前選取：{item.title}，預計 {item.minutes} 分鐘</p>;
}
export default function App() {
  const [id, setId] = useState<Id>('paths');
  return <main><Picker id={id} pick={setId} /><Summary id={id} /></main>;
}
```

按第二個按鈕後摘要應從 15 改成 30，按鈕的按下狀態也跟著切換。要驗證分鐘不是另一份狀態，只把課表中的 30 改成 35，再選該堂；不改點擊函式也能顯示新值。這能排除「兩邊剛好都寫死同一個數字」的假成功。

把切換動作連續來回做一次，也要確定先前選過的值沒有殘留。例如讀路徑的標題旁出現另一堂的分鐘，就是把同一個事實分開保存後沒有同時更新的典型線索。

## 常見錯誤
在子元件再用父層傳來的識別碼初始化自己的狀態，初次顯示相同，後續卻各走各的。也不要為了通知摘要變更，就直接操作它的網頁節點；那會留下一套 React 不知道的畫面資料。檢查程式時，沿著「誰能改選擇」往上找，找出最接近兩個使用者的共同擁有者即可，不必一律移到整個網站頂端。

## 小結
畫三個框：選擇、父層、摘要。由按鈕往上畫的是請求，從父層往下畫的是資料。最後圈出唯一會存識別碼的框，並把分鐘留在課表，而不是畫成第二個需要同步的狀態。
