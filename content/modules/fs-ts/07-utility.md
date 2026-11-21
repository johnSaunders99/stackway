---
id: fs-ts-07-utility
module: fs-ts
order: 7
title: TypeScript 工具型別
subtitle: 編輯表單不必重寫整份模型
status: ready
minutes: 30
level: 3
prereqs:
  - fs-ts-04-generic
objectives:
  - 以 Pick、Omit 與 Partial 產生輸入型別
  - 驗證工具型別不會在執行時移除欄位
tags:
  - ts
  - utility
resources:
  - title: "TypeScript：工具型別"
    url: https://www.typescriptlang.org/docs/handbook/utility-types.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-ts-07-utility-pick
    prompt: "只有 title 和 note 可編輯時，哪種方式能列出明確的允許欄位？"
    answer: "用 Pick 選定可編輯鍵，再依需求將欄位改為選填。"
    mcq:
      options:
        - "Pick 指定這兩個鍵"
        - "Partial 整個模型"
        - "把模型改成 any"
        - "讓每個欄位都必填"
      answer: 0
      explain: "Partial 改的是是否必填，不負責限制哪些鍵可編輯。"
  - id: fs-ts-07-utility-omit
    prompt: "Omit 與 Partial 各改變什麼？"
    answer: "Omit 從型別移除指定鍵；Partial 保留鍵但把它們改成選填。"
    mcq:
      options:
        - "兩者都會刪除實際屬性"
        - "前者使全部選填，後者使唯讀"
        - "兩者都會驗證輸入"
        - "前者減少鍵，後者改必填性"
      answer: 3
      explain: "工具型別處理的是描述方式，不直接動到物件的值。"
  - id: fs-ts-07-utility-runtime
    prompt: "把含 id 的物件指派給 Omit 掉 id 的型別，執行時會怎樣？"
    answer: "那個物件仍有 id；若要輸出不含 id 的物件，就必須實際建出新值。"
    mcq:
      options:
        - "自動移除 id"
        - "把 id 變成 undefined"
        - "仍保有原本的 id"
        - "序列化時自動忽略 id"
      answer: 2
      explain: "縮小靜態視角不等於執行時投影資料。"
    interview:
      question: "回應型別已拿掉內部欄位，送出去的資料為什麼還看得到它？"
      points:
        - "靜態型別不改變物件"
        - "指派可能仍指向原物件"
        - "明確建新物件並檢查序列化結果"
      answer: "我不會只更換回傳型別。實際送出前我會挑出允許欄位建一個新物件，再看序列化後的鍵。型別可防止一些誤用，不能代替真正的資料篩選。"
  - id: fs-ts-07-utility-whitelist
    prompt: "模型可能增加內部欄位時，為何以 Pick 描述固定公開欄位？"
    answer: "它明列允許的鍵，新增的內部欄位不會自動進入這個型別；實際輸出仍要明確挑選值。"
practice:
  - id: fs-ts-07-utility-lab
    title: "留下一份可見的欄位投影對照"
    kind: code
    minutes: 12
    steps:
      - "儲存 patch.ts，比較 view 與 payload 的 JSON。"
      - "在 Card 與 source 加入必填的內部欄位。觀察 Omit 連帶要求該欄位，再把 Public 改為只 Pick 標題與備註；重跑後檢查輸出。"
    checks:
      - "view 仍列出 id，payload 不列出 id。"
      - "只更新 note 的物件可通過，直接寫帶 id 的新編輯物件會被提示。"
---

## 為什麼要學：編輯一行備註，不需要重送所有欄位

庫位卡有識別碼、標題與備註。編輯表單只改一行備註，卻被要求填完識別碼與標題才可送出。若另抄一份模型來遷就表單，之後模型改名時就得維護兩份。工具型別（utility type）把「從既有模型選什麼、哪些可以不填」寫成規則，而不是再抄一次欄位。

## 核心概念：3 種工具，2 個不同問題

`Pick` 拿白名單，指定要保留哪些鍵；`Omit` 從模型扣掉指定鍵。兩者都在回答「有哪些欄位」。`Partial` 則把傳入型別的欄位改成選填，回答「哪些欄位一定要出現」。把兩者組合時從內往外讀：先挑選可以編輯的部分，再允許只提供這次要改的欄位。它不會自動深入巢狀物件逐層改成選填。

`Pick` 適合固定的輸出清單：將來來源增加新欄位，不會不小心進入清單。`Omit` 適合表達和原模型大致相同、只有少數例外的視角。兩種都不是執行時的資料清洗工具；改變型別不會讓同一個物件少一個鍵。

## 範例：比較縮小視角與真的建出新物件

在 `ts-lab`（見[〈tsconfig 與型別檢查〉](#/lesson/fs-ts-01-config)）建立 `patch.ts`。從專案目錄以 `.\node_modules\.bin\tsc.cmd -p .` 編譯（其他系統用 `./node_modules/.bin/tsc -p .`），通過後執行 `node js/patch.js`。

```ts
type Card = { id: number; title: string; note: string };
type Public = Omit<Card, "id">;
type Patch = Partial<Pick<Card, "title" | "note">>;
const source: Card = { id: 7, title: "工具", note: "待補" };
const change: Patch = { note: "已補" };
const updated = { ...source, ...change };
const view: Public = updated;
const payload: Public = { title: updated.title, note: updated.note };
console.log(JSON.stringify(view));
console.log(JSON.stringify(payload));
```

大括號中的展開語法複製欄位，後面的更新蓋過前面同名的值。`view` 只是用較窄的型別看同一個物件；`payload` 則真的列出新物件應有的鍵。觀察兩行輸出比只看編輯器提示更有力：提示不列出識別碼，並不保證序列化之後沒有它。

### 編輯請求與公開資料不是同一件事

把欄位想成兩張表：一張是允許別人改什麼，另一張是允許別人看什麼。即使兩張表今天恰好都是標題與備註，也不表示它們明天應該一起變。假設新增最後盤點時間，使用者可以看卻不能手改；若為了省事直接用公開型別當編輯輸入，就把不該出現的入口也打開了。替兩種用途分別取名，並用「只改備註」與「讀取完整公開卡片」各寫一個範例，往後改欄位時就能直接知道是哪一份約定受影響。命名不是裝飾，它說的是誰可以拿這種資料做什麼。兩張表各有自己的使用者與變更理由。

## 常見錯誤

把整份模型套上 `Partial` 就拿去接受編輯，識別碼會變成「可以填也可以不填」，不是「禁止編輯」。也不要把新物件字面值的額外欄位診斷，誤解成所有執行中的物件都只會包含宣告過的欄位。外部資料仍要做執行階段檢查，尤其是要送出、儲存或顯示給其他人的資料。

## 小結

先選鍵，再選是否必填，最後檢查實際送出的值。把型別設計與資料投影分開，表單就能維持輕量，輸出的每個欄位也都有清楚理由。
