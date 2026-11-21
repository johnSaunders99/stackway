---
id: ai-gpu-09-nsight
module: ai-gpu
order: 9
title: Nsight 剖析工具
subtitle: 先找空白時段，再研究最慢的核心
status: ready
minutes: 40
level: 3
prereqs:
  - ai-gpu-04-trace
objectives:
  - 用 Nsight Systems 找單次迭代的等待
  - 用 Nsight Compute 讀取一個核心的頻寬與執行指標
tags:
  - gpu
  - nsight
resources:
  - title: NVIDIA：Nsight Systems 使用指南
    url: https://docs.nvidia.com/nsight-systems/UserGuide/index.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: 聚焦單段擷取與時間軸的對齊方式。
  - title: NVIDIA：Nsight Compute 剖析指南
    url: https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 讀吞吐量指標與 Roofline 的座標軸。
concepts:
  - id: ai-gpu-nsight-pair
    prompt: 要定位一次迭代的等待，再解釋單一核心的行為，先後用什麼？
    answer: 先用 Systems 找時間軸上的等待與目標啟動，再用 Compute 檢查代表性核心的指標。
    mcq:
      question: CPU 準備資料時 GPU 是否空等，先看哪一項？
      options:
        - Compute 的單核心指令清單
        - Systems 的主機與裝置時間軸
        - Compute 的全域記憶體交易統計
        - 單一核心的暫存器數
      answer: 1
      explain: 問題是跨軌道的時間關係，不是核心內使用哪些指令。
    interview:
      question: 如何把兩份 Nsight 報告組成一條可信的調校建議？
      points:
        - 對齊迭代、名稱與形狀
        - 區分等待與核心內時間
        - 用獨立計時驗證
      answer: 我先用 Systems 選出穩定重現的啟動，再查 Compute 的 DRAM 與 SM 指標。如果推測是搬運，我會改一種存取方式，確認結果相同，再用正常執行比時間。
  - id: ai-gpu-counter-denom
    prompt: DRAM 與 SM 吞吐量百分比可以相加為總時間嗎？
    answer: 不行，它們分別相對不同硬體資源峰值，不是互斥的時間比例。
    mcq:
      question: DRAM 81%、SM 29%，應如何解讀？
      options:
        - 核心用了 110% 的迭代時間
        - 19% 的時間一定沒存取記憶體
        - 先查資料搬運，不能宣稱占了 110% 的時間
        - 兩者平均就是整個裝置的使用率
      answer: 2
      explain: 分母是不同資源的峰值；單 100 分比也不是主因證明。
  - id: ai-gpu-prof-replay
    prompt: 為何不能把詳細剖析時的整段牆鐘時間當正式效能？
    answer: 收集與重播可能擾動工作；應用原工作負載另做低干擾計時。
  - id: ai-gpu-critical-return
    prompt: 為什麼把單一核心耗時減半，不代表迭代時間減半？
    answer: 其他階段仍需時間；只有交付依賴路徑上縮短且未被其他工作覆蓋的部分會反映在交付時間。
    mcq:
      question: 迭代 15 毫秒，內有 8 毫秒核心完全位於依賴路徑且不重疊。核心減半後，其他不變，整體多久？
      options:
        - 7.5 毫秒
        - 4 毫秒
        - 8 毫秒
        - 11 毫秒
      answer: 3
      explain: 只省下該核心的 4 毫秒，不能將整段迭代除以 2。
practice:
  - id: ai-gpu-09-lab
    title: 寫一張雙報告判讀單
    kind: code
    minutes: 14
    steps:
      - 執行範例，以 profile-notes.txt 記下要追的啟動、相鄰空白、DRAM 及 SM 指標
      - 分別為空白和核心列一個下一步
    checks:
      - 選出 reduce#2 的 8 毫秒與前方 3 毫秒空白
      - 沒有把 81%、29% 相加或把模擬摘錄寫成實機報告
---

## 為什麼要學

同事傳來兩張剖析報告，一張有很多橫條，另一張滿是百分比。該先看哪張？先問「這一次迭代在等誰」，再問「那一個核心為什麼跑這麼久」。Nsight Systems 看跨 CPU 與 GPU 的系統時間軸，Nsight Compute 聚焦所選的核心函式與裝置計數器，兩張報告回答的不是同一個問題。

## 先縮小範圍，再看百分比

在 Systems 的時間軸把範圍縮到暖機後一次代表性迭代，展開主機呼叫、複製與 CUDA 串流。對齊同一次啟動所對應的核心名稱、資料形狀及出現次序，標出真正拖到迭代完成的工作。熱點（hotspot）可以是長核心，也可是一個短核心被重複叫了許多次；先別根據單次最長就宣布它是唯一目標。

再在 Compute 的摘要找到同名、同形狀、同配置的代表性啟動。在速度分析（Speed Of Light）檢視處理單元與記憶體吞吐量相對其參考峰值的比例；若要指認裝置主記憶體，應進一步讀明確標成 DRAM 的欄位，而不是把整個 Memory 指標當成 DRAM。不同管線的百分比不是時間切片，不能相加求忙碌率。

## 範例：把 2 張報告接到同一筆工作

以下是自行編的剖析摘錄，不是工具實測值。時間軸單位為毫秒，另張明細用各自峰值的百分比。選定迭代，再依啟動標記查明細；這個自訂標記代表你已核對名稱、形狀與序次，不是兩套工具會自動共用的全域序號。

開啟 `C:\dev\stackway-lab\gpu`，將範例另存為 `profile_pair.py`。先寫下想知道的是哪一段沒工作，還是哪個核心函式在等資料，再選能回答該問題的剖析工具。

在該目錄執行：Windows PowerShell 用 `py profile_pair.py`；macOS／Linux 用 `python3 profile_pair.py`。

```python
timeline = [("map#2", 2, 4), ("reduce#2", 7, 15)]
details = {"map#2": (18, 25), "reduce#2": (81, 29)}
for label, start, end in timeline:
    dram, sm = details[label]
    print(label, "ms", end-start, "dram_pct", dram, "sm_pct", sm)
print("gap_ms", timeline[1][1]-timeline[0][2])
```

如果已有自己的報告，請在 Systems 選取一次迭代並讀取 GPU 核心長條的開始與結束，再在 Compute 開同類啟動的 Details 頁。手寫下欄位名稱、單位與硬體。若沒有報告，保留這張摘錄就能練習判讀，但不能聲稱已收集過裝置計數器。

### 先算值得投入的上限

假設這次從開始到交付共 15 毫秒，其中目標核心占 8 毫秒，而且那段時間完整在交付路徑上、不和其他必要工作重疊。即使核心耗時減半，整體也只是少 4 毫秒，並不會讓整個迭代縮成一半。若該核心根本不是最後交付前必須等的工作，改善幅度還可能更小。

因此給同事的建議可以是「先比資料排列能不能降低這次啟動的流量，再看整次迭代是否真的提早完成」。它把工具、觀察與期待的結果連在一起，也留有改動無效時應回頭查的界線。

## 常見錯誤

對整個正式服務逐個核心收集所有指標，可能大幅改變排程。部分計數器需要分多趟重播（replay），Compute 報告的耗時不應直接加回原本的系統時間軸。先縮到一個可靠重現的小範圍，再用未受詳細剖析影響的計時去驗證改動。

## 小結

留下成對證據：系統圖上圈出優先項、核心報告上圈出支持某個假設的指標。若主要時間在 2 核心之間，下一次量測應追工作如何送達，不該因為手上有 Compute 就一定重寫核心。
