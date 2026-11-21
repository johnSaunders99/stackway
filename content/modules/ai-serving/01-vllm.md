---
id: ai-serving-01-vllm
module: ai-serving
order: 1
title: vLLM 推論端點
subtitle: 先成功送出一個最短請求
status: ready
minutes: 40
level: 4
prereqs: []
objectives:
  - 從快速入門找出支援條件、模型與端點設定
  - 將一筆正常與一筆無效請求對到預期回應，無相容硬體時標記推演
tags:
  - serving
  - vllm
resources:
  - title: vLLM：啟動與呼叫本機服務
    url: https://docs.vllm.ai/en/stable/getting_started/quickstart/
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: vLLM：模型服務名稱與監聽參數
    url: https://docs.vllm.ai/en/stable/cli/serve/
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-01-vllm-name
    prompt: 請求中模型名稱要依哪個來源填？
    answer: 端點公布的模型識別字。
    mcq:
      options:
        - 模型下載頁上的名稱，不必查端點是否取了別名
        - 端點公布的模型識別字
        - 清單上第一個模型的檔案路徑，不用識別字
        - 引擎套件名稱，不用載入的模型名稱
      answer: 1
      explain: 服務可以給權重另取名稱；名稱要跟此端點的清單一致。
  - id: ai-serving-01-vllm-shape
    prompt: 文字補全端點的最小測試該送什麼？
    answer: 模型名稱、提示字串與短輸出上限。
    mcq:
      options:
        - 用 GET 查詢模型清單，將結果當成補全文字
        - 向補全端點只送聊天格式的 messages
        - 模型名稱、提示字串與短輸出上限
        - 把服務啟動參數當成提示送到模型清單端點
      answer: 2
      explain: 清單只能測到查詢路徑；送出提示才能檢查生成路徑。
  - id: ai-serving-01-vllm-fault
    prompt: 已收到未知模型的結構化錯誤，優先查哪裡？
    answer: 請求名稱與清單是否一致。
    mcq:
      options:
        - 先調高最大輸出長度，再原樣重送名稱
        - 先改提示模板，不查它送到哪個服務
        - 只等待更長時間，不檢查模型欄位
        - 請求名稱與清單是否一致
      answer: 3
      explain: 能收到回應代表已到某個服務，先確認端點與名稱，而非直接更動模型。
    interview:
      question: 沒有 GPU 時，怎麼交付一份可信的端點驗收？
      points:
        - 列出相容條件
        - 保留正反請求
        - 區分預期與實收
      answer: 我會先留下能重送的用戶端和預期欄位，清楚註記未連線。等相容主機就緒，再用同一份提示測清單內和不存在的模型，補上實際狀態與回應。
practice:
  - id: ai-serving-01-vllm-p1
    title: 留下最短請求的驗收紀錄
    minutes: 14
    kind: code
    steps:
      - 儲存程式並跑預設分支，建立 endpoint-notes.txt
      - 記錄主機條件、兩筆請求與預期欄位，有可用服務才補實測
    checks:
      - 兩筆只有模型名稱不同
      - 未連線時沒有填寫實收狀態碼
---
## 為什麼要學：先證明哪一段通了
聊天畫面一直轉圈時，最不划算的第一步是換模型。畫面、用戶端、伺服器和模型之間有好幾道門。推論端點（inference endpoint）是伺服器接收請求的入口；不用先做聊天畫面，也能單獨檢查它。這堂的成果是成對的請求紀錄：讓一筆通過，另一筆只改錯模型名稱。兩筆都說得通，才有理由開始測速度。

## 核心概念：找到服務，再指定模型
vLLM 是負責載入模型並執行推論的引擎。先從快速入門的安裝條件確認作業系統、裝置後端、驅動與套件是否相容，再確認有權使用的模型架構、權重及可用記憶體。能在 Windows 寫用戶端，不等於同一套安裝步驟能在原生 Windows 啟動服務。本課的實機啟動指令未在 GPU 上執行；沒有符合條件的機器，走下方離線分支即可。

若已有裝好 vLLM 的相容環境，且目前資料夾有可供文字生成的本機模型目錄 `model`，可在那裡執行 `vllm serve ./model --served-model-name lab-model --host 127.0.0.1 --port 8000`。等模型載入完成，從同一主機的另一個終端機查詢。僅監聽本機，不開公網、不需要雲端帳號。用戶端不應把硬碟路徑猜成服務名稱。

## 範例：用同一個提示做正反對照
為端點測試與量測建立 `C:\dev\stackway-lab\serving`。建立 `endpoint.py`。先看要送出的模型識別與請求內容。組得出請求，不代表端點已上線；這兩種證據請分開記。

在該目錄執行：Windows PowerShell 用 `py endpoint.py`；macOS／Linux 用 `python3 endpoint.py`。

```python
import json, sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError

base = "http://127.0.0.1:8000/v1"
live = "--live" in sys.argv
model = "lab-model"
if live:
    with urlopen(base + "/models", timeout=15) as r:
        model = json.load(r)["data"][0]["id"]
for name in (model, model + "-absent"):
    body = dict(model=name, prompt="Color of snow:", max_tokens=4, temperature=0)
    if not live:
        expected = "2xx + choices" if name == model else "4xx + error"
        print("SIMULATION POST /v1/completions", json.dumps(body), "expect", expected)
        continue
    req = Request(base + "/completions", data=json.dumps(body).encode(),
                  headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=60) as r:
            print(name, r.status, json.load(r)["choices"][0]["text"])
    except HTTPError as e:
        print(name, e.code, e.read().decode()[:240])
```

預設程式只印預期結果，不建立連線。在端點已就緒的同一環境，執行時加上 `--live` 才會送出請求。第一步取回清單，第二步把清單上的識別字帶入文字補全（completion）請求；這個介面收提示字串，不是聊天訊息陣列。輸出上限以詞元（token）計，不是字數；不要用回答剛好幾個中文字作為通過條件。

### 如何讀這一對回應
若正常請求回了文字，而負例也成功生成，先查服務是否真的檢查請求中的模型欄，或兩個名稱是否恰好都是有效別名。反過來，兩筆都回找不到模型時，不要只記「測試失敗」：把查清單的時刻與送出提示的時刻並列，確認是否查了甲服務卻送到乙服務。這種成對測法只改一個欄位，即使答案不是預期，也能縮小下一次要查的範圍。

## 常見錯誤：沒有回應不等於收到拒絕
連線被拒通常連狀態碼都沒有，應先核對主機、連接埠和程序。若已有結構化錯誤回應，才回頭查路徑、模型名稱與欄位。列得出模型但無法生成，至少證明伺服器能回清單，不能證明記憶體足以跑完生成。也別把所有用戶端錯誤都寫成同一個固定代碼；把當次回應照實記下。

## 小結
驗收證據不是一張「啟動成功」截圖。保留請求方法、路徑、模型、狀態與回應欄位，旁邊註明是推演還是實測。下一堂[〈推論基準與暖機〉](#/lesson/ai-serving-01-baseline)量暖機效果時，就能沿用已經驗過的短請求，不必再猜到底是介面不通還是模型太慢。
