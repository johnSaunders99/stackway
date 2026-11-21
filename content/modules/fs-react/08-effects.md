---
id: fs-react-04-effects
module: fs-react
order: 8
title: Effect 與外部同步
subtitle: 只在需要同步外界時用 Effect
status: ready
minutes: 35
level: 3
prereqs:
  - fs-react-03-forms
objectives:
  - 分辨衍生值與外部同步
  - 在卸載或切換時清理訂閱
tags:
  - react
  - effect
resources:
  - title: React：使用 Effect 同步
    url: https://react.dev/learn/synchronizing-with-effects
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 閱讀事件訂閱的建立與清理。
concepts:
  - id: fs-react-04-effects-need
    prompt: 什麼需求適合用 Effect 而不是直接在渲染時計算？
    answer: 要在元件存在或相依資料改變期間與外部系統保持同步，例如註冊瀏覽器監聽。
    mcq:
      question: 哪一項最適合由 Effect 管理？
      options:
        - 課名長度
        - 由分鐘換算小時
        - 從現有清單計算列數
        - 面板存在期間的鍵盤訂閱
      answer: 3
      explain: 其他項目直接由已知資料推得，不需要和外部系統建立關係。
  - id: fs-react-04-effects-cleanup
    prompt: Effect 的清理函式在什麼時候執行？
    answer: 相依變動而重建前先清理上一輪，卸載時也清理；開發嚴格模式可能額外測試一輪。
    mcq:
      question: 移除鍵盤監聽時，該把什麼傳給 removeEventListener？
      options:
        - 任何原始碼看起來一樣的新函式
        - 目前的畫面計數
        - 同一事件種類與先前註冊的同一函式，捕捉設定相符
        - 註冊當下的時間
      answer: 2
      explain: 事件系統用處理函式的身分配對，不比對兩段原始碼長相。
    interview:
      question: 一個面板關掉後仍回應按鍵，你會如何重現並修正？
      points:
        - 先測關閉時還有沒有紀錄
        - 成對註冊與移除同一函式
        - 重開後只應收到一次
      answer: 我會做打開、按一次、關閉、再按一次的對照。找到監聽後在 Effect 回傳清理，移除同一個函式；修完除了測關閉時安靜，也要測重開時不會收到兩次。
  - id: fs-react-04-effects-deps
    prompt: 什麼時候不該直接照抄空相依陣列？
    answer: 同步會讀到隨渲染改變的值時，應讓對應值參與相依或改寫同步邏輯。
    mcq:
      question: 監聽需針對目前課程 id 訂閱不同來源，id 改了該怎麼辦？
      options:
        - 永久留著第一次的來源
        - 清理舊來源，依新 id 訂閱
        - 新增監聽但永不清理
        - 把 id 寫成畫面標題就好
      answer: 1
      explain: 訂閱對象取決於 id；空陣列會讓初始同步和現在畫面脫節。
practice:
  - id: fs-react-04-effects-p1
    title: 留下開關面板的訂閱測試紀錄
    kind: code
    minutes: 14
    steps:
      - 打開面板、按一次 Escape、記錄行數
      - 關閉後按一次，再打開並按一次
      - 留下操作順序與主控台新增行數
    checks:
      - 開啟、關閉、重開的新增行數分別為 1、0、1
      - 重開面板的新計數從頭開始
---

## 為什麼要學：離開面板後，它還在回應按鍵嗎？
打開一個捷徑說明面板，希望它在你按 Escape 時給提示；關掉面板後，這個行為也應消失。如果每次打開都加一個監聽、離開卻不移除，畫面雖然乾淨，瀏覽器仍然保留舊的工作。這和「標題有幾個字」不同：算字數只需要既有資料，鍵盤監聽卻是 React 以外真的存在的東西。

## 核心概念：建立一段同步關係，並寫出它的反向動作
副作用同步（Effect）讓元件在畫面提交後，和外部系統保持一致。`useEffect` 接受建立同步的函式及相依值（dependencies）；當相依值改變，React 先清理上一輪，再使用新的值開始同步。元件卸載（unmount）時也會執行清理。若程式沒有讀取會隨渲染改變的值，空陣列才適合表達這段訂閱不需因資料改變而重設。

判斷方式不是「只要有變化就加 Effect」。畫面能直接從輸入求出的字數，在渲染時算；使用者按「送出」才該做的事，放在事件處理函式；需要在面板存在期間持續接收瀏覽器通知，才在 Effect 建立連結。先釐清**什麼時候應該停止**，通常比急著挑相依陣列更能設計出正確的清理。

## 範例：打開、關閉、再打開鍵盤面板
在 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）保留舊版，將 `src/App.tsx` 換成下面的完整內容，開啟瀏覽器的開發者主控台（console）。切換按鈕控制面板是否存在，面板本身只訂閱鍵盤。測試時讓焦點回到網頁，否則按鍵可能由開發工具接走。

```tsx
import { useEffect, useState } from 'react';
function KeyPanel() {
  const [hits, setHits] = useState(0);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape' || e.repeat) return;
      console.log('panel:escape');
      setHits(n => n + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return <p>面板收到 Escape：{hits} 次</p>;
}
export default function App() {
  const [open, setOpen] = useState(false);
  return <main><button onClick={() => setOpen(value => !value)}>切換面板</button>
    {open && <KeyPanel />}</main>;
}
```

打開、按一次、關閉、再按一次。第一次要有 1 行紀錄，關閉後那次不該再有；重新打開後按一次也只能多一行。畫面計數重新從 0 起是另一回事：新的面板擁有新的本機狀態，並不是舊的監聽復活。用函式型設定 `n => n + 1` 讀上一個計數，因此監聽不必捕捉第一次渲染的數字。

也可以把「打開但還沒按鍵」記成基準。在主控台只計算面板的專屬記號，不要將開發工具的其他訊息算成第二次回應。如果面板內數字沒有變，主控台卻多了一行，仍應追查是不是已卸載的舊處理函式收到了按鍵；只看螢幕上最後的數字會漏掉它。

## 常見錯誤
移除時另寫一個外觀相同的匿名函式；瀏覽器要的是先前登記的**同一個函式物件**。開發模式的嚴格檢查可能額外建立、清理、再建立一次；這是在測反向動作是否可靠，不應藉著關閉檢查掩蓋重複訂閱。若監聽其實會用到變動的課程代號，則不能照抄空陣列來凍結舊資料。

## 小結
驗收要含「關閉後沒有新增那一行」。只測打開時有反應，正確和漏清理的程式都能過關；加上停用期間的反例，才能證明元件的生命週期真的涵蓋外部關係。
