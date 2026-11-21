---
id: fs-react-03-forms
module: fs-react
order: 7
title: 受控表單與提交狀態
subtitle: 編輯中不等於已儲存
status: ready
minutes: 30
level: 3
prereqs:
  - fs-react-05-lists
objectives:
  - 區分表單草稿與提交內容
  - 保留失敗時使用者輸入的值
tags:
  - react
  - forms
resources:
  - title: React：輸入框與受控輸入
    url: https://react.dev/reference/react-dom/components/input
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 看受控文字框與 onChange 配對。
concepts:
  - id: fs-react-03-forms-controlled
    prompt: 受控文字輸入要如何讓使用者實際改得動？
    answer: value 顯示草稿，onChange 將最新輸入寫回這份草稿狀態。
    mcq:
      question: 文字框綁了固定 value，打字後總被蓋回，先查哪裡？
      options:
        - 表單是否改成 GET
        - 按鈕是否有標題
        - onChange 是否更新對應草稿
        - 已存資料有幾筆
      answer: 2
      explain: 顯示值由 React 決定，打字後不更新對應值就會恢復舊文字。
  - id: fs-react-03-forms-submit
    prompt: 把提交邏輯掛在 form 的 onSubmit 有什麼好處？
    answer: 按提交按鈕和在適合的欄位按 Enter 可走同一流程，並可阻止預設重新導覽。
    mcq:
      question: 想在提交時留在本頁，處理函式要阻止什麼？
      options:
        - 所有輸入事件
        - 表單的預設提交行為
        - 所有鍵盤事件
        - React 渲染
      answer: 1
      explain: preventDefault 針對這次表單事件，不代表凍結畫面或拒絕文字輸入。
  - id: fs-react-03-forms-failure
    prompt: 儲存失敗時，草稿和已存內容各該怎麼辦？
    answer: 保留草稿供重試，不覆寫上次成功內容，顯示失敗與下一步。
    mcq:
      question: 原本存 A，草稿為 B，這次失敗。哪個畫面可靠？
      options:
        - 草稿 B、上次成功 A、可重試
        - 草稿清空、上次成功 B
        - 草稿 A、上次成功 B
        - 草稿 B、顯示已成功
      answer: 0
      explain: 送出了不等於存成了；保留兩份有不同生命週期的值才能重試。
    interview:
      question: 表單要如何證明失敗後仍可安全重試？
      points:
        - 維護草稿與已存快照
        - 等待時顯示處理中
        - 故意失敗再以相同輸入重送
      answer: 我會先存 A，再輸入 B 並讓這次失敗；此時 B 還能編輯、回條必須是 A。解除失敗後不重打再送，成功才讓回條變 B，這比只看成功畫面扎實。
  - id: fs-react-03-forms-busy
    prompt: 停用忙碌中的儲存按鈕，是否足以保證遠端永不重複寫入？
    answer: 不足，這只保護本次畫面互動；遠端仍需處理重送等情況。
practice:
  - id: fs-react-03-forms-p1
    title: 做一張失敗也留得住草稿的表單
    kind: code
    minutes: 14
    steps:
      - 輸入新備註，切換模擬失敗並用 Enter 提交
      - 失敗時保存草稿和上次成功並列的畫面
      - 取消失敗，沿用同一草稿重送
    checks:
      - 忙碌時操作受限，失敗不覆寫已存值
      - 再次成功後回條才變新備註
---

## 為什麼要學：按儲存之前，畫面該相信哪一份字？
課程備註已儲存為「練路徑」，你在文字框改成「練權限」時，舊紀錄仍然有意義。若頁面一邊輸入一邊宣稱「已儲存」，斷線或驗證失敗時就無法告訴你哪份才是真的。這堂把草稿、最後一次成功的內容與本次提交的狀態分開，再故意讓一次儲存失敗，看看還能不能不重打就重試。

## 核心概念：輸入框回映草稿，回條只認成功結果
受控輸入（controlled input）的值由 React 狀態提供：`value` 告訴輸入框顯示什麼，`onChange` 把本次新文字寫回同一份狀態。沒有寫回就像每次打字又被舊值蓋掉。提交（submit）是表單層級的事件，用滑鼠按提交按鈕或在文字框按 Enter 都能走同一條路；`preventDefault` 避免瀏覽器執行導覽或重新載入頁面的預設行為。

按下提交時擷取草稿，標記處理中；只有成功才更新已存內容。失敗要顯示原因與下一步，保留可重送的字。這裡在忙碌期間暫停編輯，避免等候時修改了草稿，不知道回條對應哪一版。真正的伺服器還需自己處理重複提交，本機停用按鈕不等於伺服器端保證。

## 範例：可控制成敗的練習表單
使用 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）的 `src/App.tsx`，先另存前一版。下面用計時器模擬等待，用勾選框模擬服務回覆失敗，**沒有連線也沒有持久化**。保留一段短延遲，才看得見提交中的狀態；重新整理後回到初始值是預期行為。

```tsx
import { useState, type FormEvent } from 'react';
export default function App() {
  const [draft, setDraft] = useState('練路徑');
  const [saved, setSaved] = useState('練路徑');
  const [fail, setFail] = useState(false);
  const [status, setStatus] = useState<'idle'|'saving'|'ok'|'error'>('idle');
  const busy = status === 'saving';
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !draft.trim()) return;
    const value = draft.trim();
    setStatus('saving');
    await new Promise(resolve => setTimeout(resolve, 600));
    if (fail) { setStatus('error'); return; }
    setSaved(value);
    setStatus('ok');
  }
  return <form onSubmit={submit}>
    <label>備註 <input value={draft} disabled={busy}
      onChange={e => { setDraft(e.currentTarget.value); setStatus('idle'); }} /></label>
    <label><input type="checkbox" checked={fail} disabled={busy}
      onChange={e => setFail(e.currentTarget.checked)} />模擬失敗</label>
    <button disabled={busy || !draft.trim()}>儲存</button>
    <p role="status">{{idle:'編輯就緒', saving:'儲存中', ok:'儲存成功', error:'未儲存，取消模擬失敗後重試'}[status]}</p>
    <p>上次成功：{saved}</p>
  </form>;
}
```

將文字改為新備註，勾選模擬失敗再按 Enter。等待後，下方應維持上次成功值，但輸入框還在；取消勾選並重送才會換掉舊值。用兩個明顯不同的字驗證，否則即使程式錯把失敗當成功也看不出來。

再做一個邊界測試：刪掉所有字，只輸入幾個空白，儲存按鈕應無法送出。這是本機輸入檢查，和已送出後才收到失敗不同。前者沒有開始等待，不應改掉回條；後者則可能已花時間等候，必須讓使用者知道可以如何重試。把兩類失敗分開，你測到的不只是「有沒有錯誤文字」，還有回到正常流程時資料是否仍然完整。

## 常見錯誤
一開始就把草稿清空，再用錯誤訊息叫人重填；或無論成功失敗都在最後印「已儲存」。還有一種誤判是把編輯狀態當成永久資料：本例的「上次成功」只在這次頁面存在，並沒有存入瀏覽器資料庫或伺服器。說明成果時應清楚標示這個範圍。

## 小結
最有價值的截圖不是成功畫面，而是失敗時三個事實同時存在：草稿沒掉、上次成功值沒變、下一步清楚可做。再用一次成功重送證明失敗不是死路。
