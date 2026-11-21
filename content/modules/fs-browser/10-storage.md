---
id: fs-browser-05-storage
module: fs-browser
order: 10
title: 瀏覽器本機儲存
subtitle: 重新整理後留下哪些狀態
status: ready
minutes: 35
level: 3
prereqs:
  - fs-browser-04-race
objectives:
  - 選擇適合本機保留的小量偏好
  - 示範清除網站資料後的預設行為
tags:
  - browser
  - storage
resources:
  - title: "MDN：使用 Web Storage"
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-browser-05-storage-scope
    prompt: "為什麼相同網域換了連接埠會讀不到原本的偏好？"
    answer: "localStorage 以來源區隔；通訊協定、主機和連接埠都是來源的一部分。"
    mcq:
      options:
        - "它屬於另一個來源"
        - "關閉上一個分頁時偏好必然被清掉了"
        - "同網域的資料一定已到期"
        - "每個路徑都會分配自己的本機儲存區"
      answer: 0
      explain: "讀不到不表示被刪除，可能只是讀了另一個來源的儲存區。"
    interview:
      question: "使用者說昨天選的閱讀模式消失，你會先問什麼？"
      points:
        - "核對來源與瀏覽器環境"
        - "區分缺鍵、無效值與禁止儲存"
        - "保留可用的預設介面"
      answer: "我會先比對網址與是否換了瀏覽器或私密視窗。同來源才查那個偏好鍵；找不到或值不認得就回預設。即使禁止儲存，當次操作也應能正常使用。"
  - id: fs-browser-05-storage-string
    prompt: "用 localStorage 存布林偏好時要留意什麼？"
    answer: "它存的是字串，取回時要按約定解析，不能直接相信字串的真假。"
    mcq:
      options:
        - "所有值都維持原型別"
        - "沒有鍵一定回傳空字串"
        - "重新整理會自動解碼 JSON"
        - "字串 false 本身仍是真值"
      answer: 3
      explain: "非空字串作為條件是真，缺鍵回傳 null；都要明確處理。"
  - id: fs-browser-05-storage-reset
    prompt: "要測試自己的偏好回到預設，最小的清除動作是什麼？"
    answer: "只移除這個練習自己的鍵，再重新載入或重新讀取。"
    mcq:
      options:
        - "清空整個瀏覽器"
        - "對這個來源呼叫 localStorage.clear()"
        - "removeItem 指定鍵"
        - "把偏好設為字串 null 來模擬缺鍵"
      answer: 2
      explain: "測缺鍵只需移除該鍵，不應破壞同來源的其他資料。"
practice:
  - id: fs-browser-05-storage-lab
    title: "留下能記住也能忘記偏好的閱讀頁"
    kind: code
    minutes: 14
    steps:
      - "在專用的 fetch-lab 以本機服務開啟 prefs.html，切成寬版後重新整理。"
      - "使用還原按鈕，再重新整理；只在此練習來源測試清除網站資料。"
    checks:
      - "正常儲存時重整保持寬版；還原後重整顯示標準。"
      - "不必清除其他網站資料，缺鍵仍能開頁並再次選擇。"
---

## 為什麼要學：閱讀寬度值得記，搜尋中的轉圈不用記

昨天選了寬版閱讀，今天打開頁面還希望這樣排。可是昨天離開時正在查詢，今天不應該一開頁就永遠顯示查詢中。要保存狀態之前，先回答「重新開啟仍應該算數嗎」。小量而不敏感的偏好，適合使用瀏覽器本機儲存（localStorage）；正在進行的操作通常不適合。

## 核心概念：一個來源，一組字串鍵值

來源（origin）由通訊協定、主機與連接埠共同決定。`localhost` 和 `127.0.0.1` 即使都指自己的電腦，也不是同一個主機名稱。請固定用同一網址測試，不要用直接雙擊本機檔案的行為推斷網站儲存規則。不同瀏覽器或不同使用者設定檔也不是同一份儲存空間。

`setItem` 用鍵名存字串，`getItem` 取回字串，找不到鍵則回傳 `null`。這次只在讀到已知的 `wide` 時啟用寬版，其餘都顯示標準寬度；不必把整個頁面存成一段文字。讀到陌生的舊設定，就使用合理預設。`removeItem` 只移除一個鍵；清除整個網站資料則會影響這個來源的其他內容，兩者的範圍差很多。

## 範例：保留寬度，允許乾淨重來

在上堂本機服務專用的 `fetch-lab` 存成 `prefs.html`。從該目錄執行 `py -m http.server 8765 --bind 127.0.0.1`，其他系統用 `python3`；開啟 `http://127.0.0.1:8765/prefs.html`。

```html
<!doctype html>
<meta charset="utf-8">
<title>閱讀偏好</title>
<button id="wide">使用寬版</button><button id="reset">還原偏好</button>
<p id="sample" style="border-bottom:1px solid">閱讀欄位</p><output></output>
<script>
const key = "lab.reader.width";
const out = document.querySelector("output");
function draw(wide) {
  document.querySelector("#sample").style.maxWidth = wide ? "42rem" : "24rem";
  out.textContent = wide ? "寬版" : "標準";
}
try { draw(localStorage.getItem(key) === "wide"); }
catch { draw(false); out.textContent += "（無法讀取偏好）"; }
document.querySelector("#wide").onclick = () => {
  draw(true);
  try { localStorage.setItem(key, "wide"); }
  catch { out.textContent += "（僅本次有效）"; }
};
document.querySelector("#reset").onclick = () => {
  draw(false);
  try { localStorage.removeItem(key); }
  catch { out.textContent += "（無法移除舊偏好）"; }
};
</script>
```

先按寬版，再重新整理，標籤與底線寬度應一致。按還原再重整，這次測的不是另一個保存值，而是根本沒有鍵時的預設。若真要觀察瀏覽器清除網站資料的效果，請只對這個專用測試來源操作，確認沒有自己的其他內容；不要清整台電腦的瀏覽資料。

### 哪些值值得保留？

假設閱讀頁又加了搜尋框、錯誤通知與稍後閱讀清單。閱讀寬度遺失，頂多重新選一次；錯誤通知是上次操作的結果，不應在全新工作開始時再次嚇人；稍後閱讀清單卻可能是使用者花一晚整理的成果，不能不告知風險就把唯一副本放在可隨時清除的地方。用「資料消失會讓誰重做多少事」來決定儲存方法，比看到有輸入欄就自動保存可靠。對這堂的偏好，遺失後應走正常啟動路徑，而不是報出嚴重事故；對真正的作品，則要另行設計匯出與復原。偏好遺失的代價，和作業成果遺失的代價並不相同。

## 常見錯誤

將文字 `"false"` 直接當條件，它是非空字串，判斷反而為真。另一個錯誤是把儲存成功當作使用介面的前提；空間不足或隱私設定都可能讓寫入失敗。先讓當次畫面能使用，再誠實告知沒有保存。也別放密碼或權杖，同來源腳本能讀這些值。

## 小結

偏好應該可遺忘：缺鍵仍能開始、陌生值回到預設、寫不進去仍能操作。能用一個鍵還原，就不要拿清空全站當作修理偏好的工具。
