---
id: fs-react-13-hooks
module: fs-react
order: 13
title: 自訂 Hook
subtitle: 讓兩個畫面共用同步邏輯
status: ready
minutes: 35
level: 3
prereqs:
  - fs-react-12-routing
objectives:
  - 從元件抽出使用狀態的函式
  - 以兩個呼叫端驗證共用的是邏輯而非狀態實例
tags:
  - react
  - hooks
resources:
  - title: React：用自訂 Hook 重用邏輯
    url: https://react.dev/learn/reusing-logic-with-custom-hooks
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 比較重用同一套邏輯與共享狀態。
concepts:
  - id: fs-react-13-hooks-reuse
    prompt: 兩個元件呼叫同一個自訂 Hook，共用的是什麼？
    answer: 共用邏輯；各元件呼叫所得的本機狀態實例仍獨立。
    mcq:
      question: 兩個 Editor 各呼叫 useDraft 並用不同鍵，改第一格應怎樣？
      options:
        - 第二格保有自己的值
        - 兩格必定即時同步
        - 必定清空第二格
        - 必定重建整頁
      answer: 0
      explain: 重用函式定義不代表共享狀態實例。
  - id: fs-react-13-hooks-rules
    prompt: 為什麼不要在一般條件分支內呼叫 useState 等 Hook？
    answer: React 靠每次渲染一致的呼叫順序配對狀態，應在元件或自訂 Hook 頂層呼叫。
    mcq:
      question: 依忙碌狀態決定顯示提示，應把條件放在哪裡？
      options:
        - 只在忙碌時才臨時呼叫 useState
        - 放在按鈕事件內呼叫 useDraft
        - 對每個陣列元素在迴圈中呼叫 useEffect
        - 保持 Hook 呼叫固定，用條件決定畫面
      answer: 3
      explain: 呈現可以有條件，需要穩定的是每次渲染的 Hook 呼叫順序。
  - id: fs-react-13-hooks-slot
    prompt: 兩份獨立的草稿為何仍需不同的外部儲存鍵？
    answer: 即使各有本機狀態，寫到相同外部位置仍會覆蓋對方的保存結果。
    mcq:
      question: 打字時不同步，重新整理卻都取回同一份內容，先查什麼？
      options:
        - 是否有兩個輸入標籤
        - 是否少寫 CSS 類別
        - 是否誤用了同一個儲存鍵
        - 兩份函式名稱是否相同
      answer: 2
      explain: 即時狀態獨立不代表儲存位置獨立，應先對照保存與讀回的鍵。
    interview:
      question: 兩個編輯器各打各的，重新開頁時卻讀到同一份文字，你怎麼查？
      points:
        - 分開核對執行中與重載後
        - 查外部儲存鍵
        - 用不同文字重試
      answer: 我先確認打字時另一格是否不動，再比較儲存鍵。若兩格都寫同一鍵，最後一次寫入會蓋掉前面。我會讓兩個目的地固定分開，重新整理確認各自回到原格。
practice:
  - id: fs-react-13-hooks-p1
    title: 保存一個 Hook、兩份獨立草稿
    kind: code
    minutes: 15
    steps:
      - 建立兩個 Editor 並給不同 slot
      - 第一格寫一句備註、第二格寫一個問題
      - 同一網址重新整理，記錄兩格內容與保存提示
    checks:
      - 打第一格不會改第二格
      - 允許本機寫入時兩格各回原文，若受限制則記下未能保存而非宣稱成功
---

## 為什麼要學：2 個草稿要共用存檔規則，不要共用內容
課程備註與複習問題都需要一個文字框，在這個瀏覽器裡重新整理後仍能接著寫。如果兩邊各抄一份讀寫儲存的程式，日後修一邊容易漏另一邊。可是把草稿全部放進同一個變數又不對，因為你是在寫兩件事。要抽出的不是「那段文字」，而是「依指定名稱讀取、編輯並保存一段文字」這個行為。

## 核心概念：Hook 是可重複使用的配方，每次呼叫各煮一鍋
自訂 Hook（custom Hook）是名稱以 `use` 開頭、可組合其他 Hook 的函式。它可以回傳呼叫者需要的狹小介面，而隱藏背後如何使用狀態與外部同步。在元件或其他 Hook 的最上層呼叫，不能依某個按鈕是否點過才臨時呼叫；React 依每次渲染穩定一致的呼叫順序配對狀態。沒有使用任何 Hook 的字串格式化函式，取一般名稱就好。

每個掛載的元件呼叫一次，都有自己的狀態實例。兩次呼叫不會只因使用同一支函式就彼此同步。若它們同時碰同一個外部儲存鍵，寫入仍可能互相蓋過；這是共用外部資源，不是兩份 React 狀態自動合併了。本例替每個草稿固定不同的儲存鍵（storage key），且只在自己的練習網站存不敏感的短字。

## 範例：2 個欄位，一套保存方式
先在 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）留存舊檔，將 `src/App.tsx` 換成下列完整程式。`localStorage` 是瀏覽器依網站來源區分的本機儲存，讀寫可能被隱私設定阻擋；因此練習即使無法保存，仍讓使用者編輯並說明限制。`useState` 收下函式做初始讀取，不在每一次按鍵後重讀舊值。

```tsx
import { useEffect, useState } from 'react';
function useDraft(key: string) {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
  });
  const [stored, setStored] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(key, text); setStored(true); }
    catch { setStored(false); }
  }, [key, text]);
  return { text, setText, stored };
}
function Editor({ label, slot }: { label: string; slot: string }) {
  const draft = useDraft(slot);
  return <p><label>{label} <input value={draft.text}
    onChange={e => draft.setText(e.currentTarget.value)} /></label>
    <small>{draft.stored ? '本機可保存' : '尚未確認可保存'}</small></p>;
}
export default function App() {
  return <main><Editor label="課程備註" slot="lab:note" />
    <Editor label="複習問題" slot="lab:question" /></main>;
}
```

在兩格各輸入不同文字；打第一格時第二格不動，再於相同網址重新整理。若本機可保存，兩格都應取回各自的字。這裡 `slot` 在元件的一生固定；若以後要將同一個編輯器切換到另一份文件，不能假設初始化會自動重跑，應以文件身分區分實例或明確設計載入流程。

測試保存時不要換成另一個開發伺服器的位置。即使檔案內容相同，不同連接埠也可能是不同的網站來源，拿不到剛才的值。先固定這個條件，再判斷問題出在鍵值、儲存政策還是寫入流程。

## 常見錯誤
想讓兩個使用者同步看見同一份草稿，只是分別呼叫同一個 Hook。那仍是兩份獨立狀態；真的要即時共用，可由共同父層持有再傳入，或訂閱同一個會通知變動的外部來源。本例不處理跨分頁協作，也不應拿來保存私密資料。

## 小結
把測試寫成兩句：「打第一格，第二格不動」驗證獨立性；「重新整理，各回原格」驗證保存規則共用且鍵值不同。單看兩個輸入框長得一樣，沒有辦法證明這兩件事。
