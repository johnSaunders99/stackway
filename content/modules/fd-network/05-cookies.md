---
id: fd-network-05-cookies
module: fd-network
order: 5
title: Cookie 與請求狀態
subtitle: 第二次請求如何認得第一次造訪
status: ready
minutes: 30
level: 2
prereqs:
  - fd-network-03-message
objectives:
  - 從 Set-Cookie 與 Cookie 分辨儲存和寄送
  - 用範例判斷期限、路徑與安全屬性
tags:
  - network
  - cookies
resources:
  - title: MDN：HTTP Cookie
    url: https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Guides/Cookies
    kind: doc
    lang: zh-Hant
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-network-cookie-direction
    prompt: Set-Cookie 與 Cookie 各出現在哪個方向？
    answer: 回應可用 Set-Cookie 要求保存，之後瀏覽器在符合條件的請求附上 Cookie。
    mcq:
      question: 哪一項能證明第二次請求有帶回偏好？
      options:
        - 第一次回應的狀態碼
        - 該次請求的 Cookie 標頭
        - 第一次回應的 Set-Cookie
        - 第二頁使用相同字體
      answer: 1
      explain: 保存要求不等於實際寄送，畫面相同也可能是預設值。
    interview:
      question: 看到保存標頭，下一頁卻沒帶偏好，你會先核對什麼？
      points:
        - 分開看回應與下一個請求
        - 核對主機和路徑
        - 檢查期限及傳輸條件
      answer: 我會先看第二個請求真正帶了什麼，再比對保存時的主機、路徑和期限。有 Secure 的話也看傳輸條件，而不是先把問題歸給登入。
  - id: fd-network-cookie-path
    prompt: Path=/read 是否涵蓋 /reader？
    answer: 不涵蓋；它不是 /read 本身或下面的子路徑。
    mcq:
      question: 主機與其餘條件相同，哪個路徑符合 Path=/read？
      options:
        - /reading
        - /reader/today
        - /read/today
        - /re
      answer: 2
      explain: 以路徑界線匹配，不是只比開頭字母。
  - id: fd-network-cookie-httponly
    prompt: HttpOnly 限制誰讀取 Cookie？
    answer: 限制網頁腳本直接讀取；瀏覽器仍可按規則附帶它。
    mcq:
      question: 哪個屬性主要限制腳本直接讀取？
      options:
        - Path
        - Max-Age
        - Secure
        - HttpOnly
      answer: 3
      explain: 期限、路徑及傳輸條件各有用途，不等同限制腳本讀取。
  - id: fd-network-cookie-age
    prompt: Max-Age=600 的期限是多久？
    answer: 從設定起 600 秒，也就是 10 分鐘；不保證瀏覽器一定保留到期。
practice:
  - id: fd-network-b04-05-p1
    title: 做一份路徑寄送清單
    kind: hands-on
    minutes: 10
    steps:
      - 保留 cookie_path.py，抄下三列輸出
      - 把 Path 改成根路徑，比較哪一列改變
      - 把 Max-Age 改成 0，再記一次結果
    checks:
      - 原本只有前兩條路徑帶偏好
      - 清除後 3 列都沒有偏好
      - 紀錄只有虛構的字級值
---

## 網站怎麼記住你的字級？

你選了大字，下一頁仍然是大字。不是因為同一條網路連線有記憶，而是兩次獨立的 HTTP 交換之間，有人保存了偏好。Cookie 是瀏覽器管理的小筆資料；重點不是背一串屬性，而是能說出誰要求保存、誰在什麼條件下把資料帶回去。

## 沿著 2 封信讀

第一次讀文章，伺服器可在回應標頭放 `Set-Cookie: size=large; Path=/read; Max-Age=600`。意思是請瀏覽器保存一個名為 size、值為 large 的項目，使用範圍是指定路徑，期限的單位是秒，600 秒就是 10 分鐘。若瀏覽器接受並保存，下次請求符合條件時，送出的請求標頭才是 `Cookie: size=large`。路徑與期限是瀏覽器用來決定要不要寄的規則，不是每次都附在值後面的留言。

省略 Domain 時，這筆資料只屬於設定它的主機。路徑 (path) 匹配的是目錄界線：`/read` 與 `/read/one` 可以符合，`/reader` 卻不行。安全屬性也有不同工作：Secure 限制在安全傳輸條件下寄送；HttpOnly 不讓網頁腳本直接讀取，並不阻止瀏覽器在合適請求中附帶它。SameSite 限制某些跨站情境的寄送。光靠得知這些屬性，不能推論使用者一定已經登入。

## 範例：在記憶體裡檢查哪些請求會帶回字級

以下用標準函式庫的 Cookie 容器 (cookie jar) 模擬一個只屬於練習主機的偏好。它測的是路徑選擇，不是測瀏覽器的 SameSite 實作，也不會真的連線。你只需要改待比較的路徑，不必改容器的內部設定。

先替請求填上目的路徑，再判斷哪些 Cookie 符合送出條件。曾經收到不等於每次都會附上。把下面的範例存成 `C:\dev\stackway-lab\network` 裡的 `cookie_path.py`。

在該目錄執行：Windows PowerShell 用 `py cookie_path.py`；macOS／Linux 用 `python3 cookie_path.py`。

```python
from http.cookiejar import CookieJar
from email.message import Message
from urllib.request import Request

class Reply:
    def info(self):
        headers = Message()
        headers["Set-Cookie"] = "size=large; Path=/read; Max-Age=600"
        return headers

base = "http://127.0.0.1"
jar = CookieJar()
jar.extract_cookies(Reply(), Request(base + "/read"))
for path in ["/read", "/read/one", "/reader"]:
    req = Request(base + path)
    jar.add_cookie_header(req)
    print(path, req.get_header("Cookie", "(none)"))
```

先遮住輸出，預測最後一行。字母開頭看來相同，卻不是該目錄或它底下的路徑。把範例的 Path 換成斜線再跑，第三個請求便會多帶一份原本沒有的資料。這項修改只擴大寄送範圍，沒有改變原先字級的值。反過來，若把期限改為 0，這筆偏好就不該繼續出現在後面的請求裡。

如果同一份練習紀錄只寫「有 Cookie」，隔天幾乎不能用它除錯。可以改寫成「先收到設定字級的回應，再向閱讀目錄發出帶字級的請求」，並列出不在該目錄的對照組。這樣不需要記住任何真實使用者的資料，就能重建自己的判斷。

## 常見錯誤

在請求裡找 Set-Cookie，會把保存的證據看反。只看到伺服器要求保存也不能寫成「下次一定有帶」：使用者可能清除紀錄，時間可能已過，路徑也可能不同。練習只用虛構偏好，不複製瀏覽器裡真實網站的 Cookie；登入憑證不是適合放在作業截圖的範例資料。

## 小結

畫兩個箭頭：先是回應要求保存，再是條件符合的請求帶回。兩者中間留一格寫下期限與適用範圍，就能解釋為何同一個網站有時認得偏好、有時沒有。
