---
id: fs-services-04-upload
module: fs-services
order: 4
title: 檔案上傳與儲存
subtitle: 上傳成功也不代表檔案可以公開
status: ready
minutes: 35
level: 3
prereqs:
  - fs-services-03-limit
objectives:
  - 定義大小、類型與權限檢查
  - 用伺服器產生的儲存鍵分離顯示檔名與實體位置
tags:
  - services
  - upload
resources:
  - title: "OWASP：檔案上傳檢查"
    url: "https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "fs-services-04-upload-name"
    prompt: "兩個人都上傳 report.txt，儲存時如何避免互相覆寫？"
    answer: "讓伺服器為每次受理的檔案配置獨立鍵。"
    mcq:
      options:
        - "直接以顯示名稱當儲存位置。"
        - "讓伺服器為每次受理的檔案配置獨立鍵。"
        - "用副檔名當唯一鍵。"
        - "要求所有人共用一個暫存檔。"
      answer: 1
      explain: "顯示名稱服務讀者，儲存鍵識別物件，兩者用途不同。"
    interview:
      question: "有人希望上傳後直接分享原檔名網址，你會如何設計？"
      points:
        - "顯示名與儲存鍵分離"
        - "驗證大小與格式"
        - "私有物件取用需授權"
      answer: "我會保留原名供畫面顯示，但由服務配置儲存鍵。先確認誰可上傳、實際內容合不合規，再記下擁有者。下載時重新判斷資格，而不是把檔案自動放到公開目錄。"
  - id: "fs-services-04-upload-type"
    prompt: "只允許文字附件時，哪一項檢查最完整？"
    answer: "限制大小，再依允許清單驗證格式與內容。"
    mcq:
      options:
        - "只問瀏覽器回報的類型。"
        - "檔名結尾正確就接受所有內容。"
        - "限制大小，再依允許清單驗證格式與內容。"
        - "只要小於上限就認定是文字。"
      answer: 2
      explain: "大小、宣告類型、實際內容各自回答不同問題。"
  - id: "fs-services-04-upload-access"
    prompt: "檔案完成寫入後，誰可以下載由什麼決定？"
    answer: "每次讀取時依資源與請求者檢查權限。"
    mcq:
      options:
        - "知道顯示名稱就可讀。"
        - "上傳成功就自動公開。"
        - "檔案夠小就可匿名讀。"
        - "每次讀取時依資源與請求者檢查權限。"
      answer: 3
      explain: "寫入與讀取是不同的授權決策。"
practice:
  - id: "fs-services-04-upload-p1"
    title: "替兩份同名附件開收據"
    kind: "hands-on"
    minutes: 12
    steps:
      - "執行 upload.py"
      - "再加入空檔、超過上限以及不同角色各一例"
      - "留下只含狀態與鍵的驗收紀錄"
    checks:
      - "合法同名檔鍵不同"
      - "失敗時沒有新增物件"
      - "沒有把樣本寫到公開目錄"
---

## 為什麼要學：上傳成功，不等於公開發表

課程作業允許交一份文字筆記，兩個小組湊巧都叫它 notes.txt。若直接拿原名當儲存位置，後交的可能覆蓋先交的。就算沒有撞名，把檔案放在人人可讀的靜態目錄，也改變了「只交給助教」的原意。設計上傳（file upload）時，要分開回答誰能交、什麼能收、收到後誰能拿。

## 核心概念：先受理，再產生收據

伺服器先驗證身分與上傳權限，再對請求和實際接收的位元組設上限，不因對方宣稱很小就無限制讀取。允許清單（allowlist）列出產品真正需要的類型；副檔名和瀏覽器提供的媒體類型（MIME type）只是線索。若只需要純文字，可以限制副檔名、解碼方式與允許的字元；需要圖片時就要用合適的解析器檢查，不能把文字規則搬過去。

顯示檔名留給畫面，儲存鍵（storage key）由服務產生。收據紀錄鍵、擁有者、原名與大小；讀取時透過收據檢查授權，由伺服器取得私有物件。知道鍵並非擁有權的證明。上傳權限也不會自然延伸成公布、轉寄或刪除其他人成品的權限。

## 範例：做一個只收小文字便條的收件盒

在 `C:\dev\stackway-lab\services` 存 `upload.py`，執行 `py upload.py`；macOS／Linux 用 `python3 upload.py`。以下只處理已在記憶體中的短樣本，示範業務檢查而不是完整網路上傳端點。角色來自測試環境而非表單自報，實際入口還要限制接收大小。

```python
from uuid import uuid4
items = {}
def accept(role, owner, name, data):
    if role != "author":
        return "denied"
    if not (0 < len(data) <= 64) or not name.lower().endswith(".txt"):
        return "invalid"
    try:
        content = data.decode("utf-8")
    except UnicodeDecodeError:
        return "invalid"
    if not all(c.isprintable() or c in "\n\r\t" for c in content):
        return "invalid"
    key = uuid4().hex
    items[key] = (owner, name, data)
    return key
for group in ("group-a", "group-b"):
    print(accept("author", group, "notes.txt", b"hello"))
print("saved", len(items))
```

同名卻出現兩把不同的鍵，是這次驗收的重點，不需預測每次隨機值的樣子。拒絕樣本要比較前後數量，不能只檢查有無錯誤文字；某些錯誤可能發生在檔案已落地卻尚未登錄收據之後，真正的服務要為這種未完成項目設計清理流程。

### 用相同檔名做一次真正有用的反例

把兩份合格筆記改成相同內容再交一次。若產品並沒有承諾「相同內容只保留一份」，即使位元組一樣，也應留下各自的擁有者與收據。有人撤回本組的作業，另一組的作業不能跟著消失。若產品真的要共用底層內容以省容量，也要保留分開的授權紀錄，最後一份引用消失後才考慮清理。這個反例把檔案內容、檔名、儲存鍵和使用資格分成四件事；出錯時能指出是誰配錯了對，而不是籠統說檔案有問題。

## 常見錯誤與小結

不要因為輸入框限制選擇文字檔，就省略伺服器的檢查。瀏覽器的提示是協助選檔，不是共享儲存空間的守門人。下載時若只需保存原稿，可以提供附件下載，別擅自把使用者的內容當網頁執行。驗收單應同時留下「成功的檔案歸誰」與「被拒絕時沒有留下什麼」。
