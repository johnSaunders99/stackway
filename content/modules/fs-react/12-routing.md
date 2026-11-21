---
id: fs-react-12-routing
module: fs-react
order: 12
title: React Router 路由
subtitle: 直接貼上第二頁網址也能到達
status: ready
minutes: 30
level: 3
prereqs:
  - fs-react-11-context
objectives:
  - 將路徑與參數對應到元件
  - 比較連結導覽、上一頁與巢狀路由的結果
tags:
  - react
  - routing
resources:
  - title: React Router 6：路由功能概覽
    url: https://reactrouter.com/6.30.1/start/overview
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: "2026-11-20"
    note: 閱讀巢狀路由、動態區段與連結。
concepts:
  - id: fs-react-12-routing-param
    prompt: 路由裡的 :id 與 useParams 如何配合？
    answer: 動態區段從位置匹配一段文字，元件透過 useParams 取得它，再查相應資料。
    mcq:
      question: "在 #/lessons/rights 進到詳情元件後，id 是什麼？"
      options:
        - lessons/:id
        - 整個網址
        - 查權限
        - rights
      answer: 3
      explain: 參數是路徑中的文字，不是路由樣式或資料庫中的顯示標題。
  - id: fs-react-12-routing-outlet
    prompt: 子路由已匹配，父版面要在哪裡顯示它？
    answer: 父版面在 Outlet 的位置插入匹配的子頁。
    mcq:
      question: 外框和導覽存在，卻一直沒有匹配的子頁，先檢查什麼？
      options:
        - 課名是否全用英文
        - 瀏覽器是否沒有歷史
        - 外框是否渲染 Outlet
        - 是否為每堂課重建伺服器資料夾
      answer: 2
      explain: 巢狀子頁需要出口，檔案或文字名稱不等於出口。
  - id: fs-react-12-routing-history
    prompt: 為什麼可貼上的詳情路徑比只改元件狀態適合分享？
    answer: 位置本身含選擇，能在新分頁重建畫面，也可依各分頁的導覽歷史使用返回鍵。
    mcq:
      question: 在全新分頁直接貼第二堂的網址，哪個結果是必要的？
      options:
        - 上一頁必回第一堂
        - 能直接顯示第二堂
        - 一定先點總覽才可進入
        - 清除井字號仍必須保留同一堂
      answer: 1
      explain: 新分頁有位置但沒有原分頁的歷史；直接開啟與原分頁內返回應分開測。
    interview:
      question: 路由頁在選單裡能開就算完成嗎？你會補什麼驗收？
      points:
        - 測直接貼網址與重新整理
        - 測同一分頁的返回
        - 測未知參數與未知路徑
      answer: 我會把第二堂的完整位置貼進新分頁，重新整理仍要是那堂。回原分頁測上一頁是否回前一堂，再分別打一個不存在的課程 id 和不存在的頁面，確認都有出口。
practice:
  - id: fs-react-12-routing-p1
    title: 保留兩個可直達的詳情位置
    kind: code
    minutes: 14
    steps:
      - 在練習專案安裝第 6 版路由套件並建立範例
      - 依序開兩堂課，用上一頁返回，再在新分頁直開第二堂
      - 記下兩段路徑和未知識別碼的提示
    checks:
      - 重新整理第二堂仍讀到查權限
      - 同一分頁返回是讀路徑，未知識別碼不冒充第一堂
---

## 為什麼要學：貼網址到新分頁，還是同一堂課嗎？
用一個布林值切換「清單」和「詳情」看起來也能換頁。可是把網址傳給另一個人，對方還是只看到首頁；按瀏覽器上一頁，也沒回到你剛才那堂。當一個選擇應可加入書籤、重開或分享，位置就不該只藏在元件狀態裡。這堂讓課程識別碼成為網址的一部分，並留一個共同的導覽外框。

## 核心概念：路徑比對元件，參數描述選中的資料
路由（route）是一條「位置符合某個樣式時，顯示哪個元件」的規則。`:id` 是動態區段（dynamic segment），可匹配一段路徑文字；`useParams` 讓詳情元件讀到實際內容。能匹配路徑不等於資料真的存在，所以未知識別碼要顯示找不到的提示，不能默默換成第一堂。

巢狀路由（nested route）讓父層固定保留導覽與標題，`Outlet` 是顯示目前子頁的位置。索引路由（index route）在父路徑沒有更多子區段時填入預設內容。`Link` 提供真正能用鍵盤操作、也能複製位置的連結，導覽時由路由管理瀏覽器歷史。這和按鈕僅僅切換本機狀態不同；返回鍵應該依實際瀏覽順序往回走。

## 範例：做 2 個能直接重開的詳情網址
在個人 `react-lab`（見[〈JSX 語法〉](#/lesson/fs-react-01-jsx)）根目錄，Windows PowerShell 執行 `npm.cmd install react-router-dom@6`，macOS 或 Linux 用 `npm install react-router-dom@6`。這份既有練習採用第 6 版的宣告式介面；請在專用練習專案操作，不必為它更動其他專案。將前一版另存，再以此完整替換 `src/App.tsx`。`HashRouter` 把應用程式路徑放在井字號之後，靜態主機只需能提供原本入口，不必針對每個課名建立伺服器目錄。

```tsx
import { HashRouter, Link, Outlet, Route, Routes, useParams } from 'react-router-dom';
const names = new Map([['paths', '讀路徑'], ['rights', '查權限']]);
function Frame() {
  return <main><h1>練習書架</h1><nav aria-label="書架">
    <Link to="/">總覽</Link>{' · '}<Link to="/lessons/paths">讀路徑</Link>{' · '}
    <Link to="/lessons/rights">查權限</Link>
  </nav><Outlet /></main>;
}
function Detail() {
  const { id } = useParams();
  const title = names.get(id ?? '');
  return <h2>{title ?? '沒有這堂課，請回總覽'}</h2>;
}
export default function App() {
  return <HashRouter><Routes><Route path="/" element={<Frame />}>
    <Route index element={<p>請選一堂課</p>} />
    <Route path="lessons/:id" element={<Detail />} />
    <Route path="*" element={<p>找不到這個頁面，請回總覽</p>} />
  </Route></Routes></HashRouter>;
}
```

先從總覽點讀路徑、再點查權限；上一頁應回到前一堂，不是離開網站。在新分頁貼上第二堂的完整本機網址，或直接在該頁重新整理，標題仍應是查權限。新分頁沒有原本那一串瀏覽歷史，所以不要要求它的上一頁也回到第一堂。

檢查詳情時，不要只在總覽點到一個合法名稱就收工。保留同一個路徑形狀，將最後一段替換成沒有登記的代號；這時外框與導覽都該留下，讓讀者還有回到已知課程的路。再換成完全不符合詳情樣式的位置，才會走萬用頁。兩種錯誤長得相似，表示的卻分別是資料問題與路由問題。

## 常見錯誤
父層成功出現卻沒有內容，可能是漏了出口，不是子路徑一定沒匹配。測試時也要分開不存在的頁面與已匹配但不存在的課程：前者用萬用路由，後者應在詳情核對資料。不要把識別碼當成可以直接執行的命令，它只是由網址讀到的文字。

## 小結
留下井字號之後的兩條路徑與一次返回的觀察，不用保存含個人資訊的網址。能由位置重建同一頁，才是路由相對於單純切換畫面的價值。
