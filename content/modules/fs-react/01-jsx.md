---
id: fs-react-01-jsx
module: fs-react
order: 1
title: JSX 語法
subtitle: 把一張靜態卡片搬進元件
status: ready
minutes: 35
level: 3
prereqs: []
objectives:
  - 將一段 HTML 改成合法 JSX
  - 用大括號插入取自物件的文字與屬性
tags:
  - react
  - jsx
resources:
  - title: React：以 JSX 撰寫標記
    url: https://react.dev/learn/writing-markup-with-jsx
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: "2026-11-20"
    note: 閱讀 JSX 的根元素與結束標記規則。
  - title: Vite：建立第 1 個練習專案
    url: https://vite.dev/guide/
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: "2026-11-20"
    note: 查 React 與 TypeScript 範本和啟動指令。
concepts:
  - id: fs-react-01-jsx-expression
    prompt: JSX 裡寫文字和寫大括號，結果有什麼不同？
    answer: 文字照字面顯示，大括號裡的 JavaScript 表達式先求值再帶入。
    mcq:
      question: 物件的 title 是「讀路徑」，哪個標題會讀出該值？
      options:
        - <h2>{lesson.title}</h2>
        - <h2>lesson.title</h2>
        - <h2>"lesson.title"</h2>
        - <h2>{'lesson.title'}</h2>
      answer: 0
      explain: 最後一種雖有大括號，裡面仍是常值字串；屬性存取不能被引號包成文字。
    interview:
      question: 把靜態卡搬成 JSX，你怎麼證明它真的接上資料？
      points:
        - 指出固定文字與資料欄位
        - 區分子內容與屬性綁定
        - 用換值驗證
      answer: 我會保留「預計」和「分鐘」這些固定文字，數字與提示則分別放進內容和屬性的大括號。只改物件的值再看畫面，能比對哪些地方該變，避免只是重抄 HTML。
  - id: fs-react-01-jsx-attribute
    prompt: 如何把物件欄位的值交給 JSX 屬性？
    answer: 在等號後用大括號放表達式，例如 title={lesson.hint}。
    mcq:
      question: 想讓滑鼠提示跟著物件 hint 改變，屬性要怎麼寫？
      options:
        - title="lesson.hint"
        - title="{lesson.hint}"
        - title="hint"
        - title={lesson.hint}
      answer: 3
      explain: 帶引號的寫法都是固定文字；大括號才讀當次資料。
  - id: fs-react-01-jsx-root
    prompt: 兩個並排的頂層標記如何從元件一起回傳？
    answer: 用一個父元素或片段包住，使整個回傳值是單一 JSX 表達式。
    mcq:
      question: 不想多出一層實際網頁元素，如何包住標題和段落？
      options:
        - 只移除段落結束標記
        - 把兩段寫成 HTML 字串
        - 以片段 <>…</> 包住
        - 把 class 換成 className 即可
      answer: 2
      explain: 片段可分組而不新增包裝節點，屬性拼法不會修正頂層結構。
practice:
  - id: fs-react-01-jsx-p1
    title: 做一張由資料驅動的課程卡
    kind: code
    minutes: 12
    steps:
      - 在新 react-lab 建立範例並預覽
      - 只改物件的分鐘為 30 與提示為另一句，不改 JSX
      - 將 App.tsx 另存並留下畫面
    checks:
      - 顯示 30 分鐘而非物件欄位名稱
      - 卡片提示改變，固定文字不變
---

## 為什麼要學：卡片上的 25 應該只寫一次
你會寫一張 HTML 課程卡，也會在 JavaScript 物件裡存標題和分鐘數。現在把分鐘改成 30，頁面上卻還寫 25，因為兩份文字各改各的。這堂只做一件事：讓卡片從物件讀值。改資料、存檔、看卡片改變，不用自己到頁面上找某個節點再手動換字。

## 核心概念：標記裡留出能算值的地方
JSX 是在 JavaScript 裡描述畫面的語法，不是塞給瀏覽器的一段 HTML 字串。元件（component）在這裡是一個回傳畫面描述的函式；以大寫字母開頭的 `App` 是我們寫的元件，小寫的 `article` 則是網頁原生標記。工具會先轉換 JSX，再由 React 把結果顯示出來。元件的分工之後在[〈React 元件與 props〉](#/lesson/fs-react-01-components)會細講。

標記中間的文字照寫就照顯示；遇到大括號，裡面才是 JavaScript 表達式（expression），也就是能算出一個值的式子。在屬性右邊，`title="lesson.title"` 傳的是字面文字，而 `title={lesson.title}` 才會讀物件。不要同時把大括號包進引號裡，那樣並不會再幫你執行一次。

## 範例：建立自己的課程卡
這裡沿用[〈let 與 const 宣告〉](#/lesson/fs-js-01-variables)裝好的 Node.js。Vite 是把 JSX 轉成瀏覽器能執行的程式並提供本機預覽的工具；建立專案是為了取得這套轉換流程。

Windows 在自己的 `C:\dev\stackway-lab` 開 PowerShell；macOS 或 Linux 則到自己的練習目錄開終端機。使用受支援的 Node.js LTS，以下只在**全新且名稱未被使用**的 `react-lab` 建立練習專案，不要拿現有產品當範本覆寫。選一般的 React 與 TypeScript 範本，不加額外編譯器；若精靈問是否立即安裝並啟動，選否，再依序執行後續指令。

```powershell
npm.cmd create vite@latest react-lab -- --template react-ts
cd react-lab
npm.cmd install
npm.cmd run dev
```

macOS 或 Linux 把 `npm.cmd` 寫成 `npm`。保持終端機開著，瀏覽器開啟工具印出的本機位址。用編輯器只替換新專案的 `src/App.tsx` 為下列完整內容。`.tsx` 讓同一個檔案能寫 TypeScript 與 JSX；目前不需修改入口檔。

```tsx
const lesson = { title: '路徑練習', minutes: 25, hint: '打開工作目錄' };

export default function App() {
  return (
    <article className="lesson" title={lesson.hint}>
      <h2>{lesson.title}</h2>
      <hr />
      <p>預計 {lesson.minutes} 分鐘</p>
    </article>
  );
}
```

看畫面上的標題，再把游標停在卡片上看提示。它們分別驗證內容位置和屬性位置都讀到資料。把物件的分鐘改成 30，只有那個數字需要改，其他文字仍然由標記提供。這是開發工具在存檔後更新預覽，並不是說一般使用者可以在網頁上直接修改物件。

工具啟動後若還看到範本歡迎頁，先核對編輯器所開的目錄是不是剛才那個練習專案，再看檔名與儲存狀態。不要同時開兩個伺服器又隨意挑一個分頁測；那樣程式即使改對，也可能在另一個沒有變更的畫面上找半天。

## 常見錯誤
從 HTML 搬過來時，沒有子內容的標記也要結束，例如 `<hr />`；樣式類別用 `className`；並排的兩個頂層標記必須用一個父標記或片段（fragment，`<>…</>`）包住。若看不到結果，先讀編輯器最靠近錯誤的結束標記，再看是不是回傳了兩個並排元素。不要為了消除語法錯誤把整段變成字串。

## 小結
留下可重開的元件和改成 30 後的畫面。後續每堂可用同一個練習專案；要保留各版，先在專案根目錄新建 `snapshots` 資料夾，將每堂的 `App.tsx` 以不同檔名另存，例如 `snapshots/01-jsx.tsx`，再替換 `src/App.tsx`。
