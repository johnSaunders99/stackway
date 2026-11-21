---
id: ai-serving-05-engines
module: ai-serving
order: 10
title: 推論引擎選型
subtitle: 選一個引擎，不是背四份 API
status: ready
minutes: 40
level: 3
prereqs:
  - ai-serving-04-precision
objectives:
  - 區分 Triton Inference Server 的服務層與 Triton 核心函式語言
  - 對照 vLLM、SGLang、TensorRT-LLM 與 Triton 的角色
  - 以裝置、模型支援與可觀察性淘汰不適合的方案
tags:
  - serving
  - runtime
resources:
  - title: SGLang：服務框架與支援平台
    url: https://docs.sglang.io/
    kind: doc
    lang: en
    minutes: 4
    required: false
    checked: '2026-11-20'
  - title: TensorRT-LLM：推論套件與部署方式
    url: https://nvidia.github.io/TensorRT-LLM/
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
  - title: Triton Inference Server：模型設定與後端
    url: https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: Triton 語言：平行核心函式
    url: https://triton-lang.org/main/index.html
    kind: doc
    lang: en
    minutes: 3
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-serving-05-engines-names
    prompt: 哪個元件可依模型設定接收推論請求，再交給後端執行？
    answer: Triton Inference Server。
    mcq:
      options:
        - Triton 核心函式編譯器
        - GPU 驅動程式
        - Triton Inference Server
        - 負責匯出裝置指標的監控程式
      answer: 2
      explain: 核心語言描述裝置運算，伺服器才提供模型服務與後端配置。
  - id: ai-serving-05-engines-layer
    prompt: 哪個部署組合在責任上可以成立？
    answer: Triton Inference Server 搭配 TensorRT-LLM 後端。
    mcq:
      options:
        - 以 Triton 語言核心取代整個模型服務入口
        - 只部署服務層設定檔，不載入任何模型後端就生成
        - 把 TensorRT-LLM 當作用戶端的串流通訊協定
        - Triton Inference Server 搭配 TensorRT-LLM 後端
      answer: 3
      explain: 後端執行生成，服務層接請求；角色可組合。
  - id: ai-serving-05-engines-unknown
    prompt: 必要觀測欄位未知時要如何處理候選？
    answer: 先補證據，尚不列入合格排名。
    mcq:
      options:
        - 先補證據，尚不列入合格排名
        - 直接標記不支援，不留補測途徑
        - 因服務能啟動就視為具備所有觀測
        - 先以核心函式跑分取代缺少的服務端證據
      answer: 0
      explain: 未知與已反證不同，但硬門檻沒有證據就不能宣告通過。
    interview:
      question: 什麼情況會讓你不選公告吞吐最高的引擎？
      points:
        - 核對模型裝置
        - 確認服務與觀測
        - 比較同負載
      answer: 我先問能不能載入這個版本的權重、在指定卡上串流，出錯時看不看得到原因。若缺必要後端或只有不同條件下的跑分，我會先留原本通過驗收的方案。
  - id: ai-serving-05-engines-roles
    prompt: SGLang、vLLM 和 TensorRT-LLM 在候選清單中各代表什麼？
    answer: 前兩者可提供語言模型推論服務；TensorRT-LLM 提供針對 NVIDIA 平台的推論軟體。要比較具體部署組合，而非只比名稱。
practice:
  - id: ai-serving-05-engines-p1
    title: 寫一張可翻案的選型卡
    minutes: 13
    kind: code
    steps:
      - 保留程式的三種裁決
      - 為 alternate 寫下要補的具體證據，再改成 True 重跑
    checks:
      - 未知時輸出 verify
      - 補齊後只進入 benchmark，尚未宣告速度第一
---
## 為什麼要學：名字排在一起，不代表做同一件事
需求是「既有文字模型要能串流，營運端要看得到失敗與等待」。有人建議換 Triton，也有人說現有引擎本來就用 Triton。這兩句可能都合理，卻在談不同層。先畫出從請求進站、模型被呼叫，到裝置執行一小段運算的路徑，再問每個選項想替換哪一段。

## 核心概念：把候選放回它負責的層
vLLM 和 SGLang 都可以提供語言模型推論服務，負責處理生成過程和請求調度。不能因為介面相似，就假設兩者在同一裝置上支援完全相同的模型、量化方式與串流行為。TensorRT-LLM 提供針對 NVIDIA 平台的語言模型推論軟體，也有服務方式；選它時要查模型架構、支援精度及部署流程，不是只把套件名稱換掉。

Triton Inference Server 是模型服務層，可透過後端（backend）執行模型，像是用 TensorRT-LLM 後端處理生成。它能和推論引擎搭配，不必四選一。Triton 語言則是撰寫裝置核心函式（kernel）的工具；一個核心可加快局部矩陣運算，卻不會因此提供接收聊天請求、載入模型與處理錯誤的服務。

## 範例：3 道硬門檻，而非功能加總
在 `C:\dev\stackway-lab\serving` 新建 `engine_gate.py`。先列出不可妥協的相容條件，再比較通過條件的引擎；跑分高不能補救模型根本載不進去。

在該目錄執行：Windows PowerShell 用 `py engine_gate.py`；macOS／Linux 用 `python3 engine_gate.py`。

```python
evidence = {"existing": (True, True, True),
            "alternate": (True, True, None),
            "other-format": (False, None, True)}
for stack, gates in evidence.items():
    verdict = "reject" if False in gates else "verify" if None in gates else "benchmark"
    print(stack, verdict)
```

欄位依序代表裝置與格式相容、指定模型能完成串流、必要的觀測資料能取得。表內是虛構驗收卡，不是廠商支援矩陣；真實選型要註明裝置、引擎版本及後端，並給每個判斷可追溯的證據。未知不是失敗，但也還沒有資格進入速度排名。若某組合確定不支援權重格式，再多吞吐優勢也不能彌補。

### 讓決策有翻案條件
例如現有組合已能服務，替代組合只缺排隊時間的觀測。你不需要先搬整套服務；可用同一條短提示帶著請求識別字，核對用戶端起訖與服務端能否對上，並記錄看不到的是哪一段。補出欄位就進入同負載基準比較；若仍只能看到總時間，記成此部署不滿足值班需求。這樣淘汰的是指定使用條件，不是對整個專案下永久評語。

## 常見錯誤
拿別人單張高階卡的數字排自己設備上的名次，或拿一個框架整體支援的功能當成指定後端一定具備。先用同一個短請求和一筆無效請求確認介面，再用自己的負載量測。若服務必須經過外層路由，就用實際要交付的整條路徑測，不單報核心函式的執行時間。

## 小結
選型結果可以是「先保留目前能達成門檻的引擎，只補測另一組合的觀測欄」。這比背四套啟動指令更有用：別人可以知道已排除什麼、為何排除、只要補哪份證據就可能翻轉決定。速度只在同樣符合交付條件的候選之間比較。
