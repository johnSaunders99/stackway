---
id: ai-observe-03-gpu
module: ai-observe
order: 3
title: GPU 使用率與等待
subtitle: GPU 使用率低不一定是浪費
status: ready
minutes: 30
level: 3
prereqs:
  - ai-observe-02-histogram
objectives:
  - 對照利用率、記憶體與等待時間
  - 辨認應再觀察哪個流程階段
tags:
  - observe
  - gpu-metrics
resources:
  - title: NVIDIA：裝置利用率欄位
    url: https://docs.nvidia.com/deploy/nvidia-smi/index.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: 找 GPU 利用率與記憶體用量的定義。
  - title: NVIDIA：DCGM Exporter
    url: https://docs.nvidia.com/datacenter/cloud-native/gpu-telemetry/latest/dcgm-exporter.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: 看裝置欄位如何成為可收集的指標。
concepts:
  - id: ai-observe-util-meaning
    prompt: GPU 利用率和已用顯示記憶體量各描述什麼？
    answer: 前者依指標定義描述採樣時段的核心活動，後者描述容量占用，兩者都不直接等於有效吞吐量。
    mcq:
      question: 沒有請求、利用率很低，但顯示記憶體仍被占用，哪個解釋合理？
      options:
        - 頻寬一定飽和
        - 所有核心都在運算
        - 入口必定有大量排隊
        - 已載入的模型仍保留在裝置
      answer: 3
      explain: 容量可以在無運算時被保留，不能據此推出流量或排隊。
    interview:
      question: 值班看到「GPU 利用率低於 20%」就想擴容，你怎麼回應？
      points:
        - 確認有無需求與症狀
        - 分開容量與時間活動
        - 追到提交邊界再決定
      answer: 我先對同一分鐘的到達數與等待。若沒需求，沒理由擴容；若排隊長但裝置不忙，我先找是哪段準備或排程沒送出工作，再用追蹤驗證。
  - id: ai-observe-gpu-queue
    prompt: 看到低裝置活動時，先用哪類服務資料區分沒事做與餵不進去？
    answer: 對齊到達量、排隊等待、提交時間與裝置時窗，先確認有需求。
    mcq:
      question: 有 40 筆到達且等待上升，裝置多半空閒，下一步最有區辨力的是？
      options:
        - 對齊資料準備、提交與裝置開始的追蹤
        - 直接換更大的卡
        - 只比較兩版已用記憶體的單次快照
        - 只延長逾時掩蓋等待
      answer: 0
      explain: 要找上游或排程缺口；這些讀數尚不足以歸因。
  - id: ai-observe-idle-null
    prompt: 沒有請求時，為什麼等待中位數不應填成 0？
    answer: 沒有樣本所以未定義；0 代表觀察到請求且無等待，是不同情況。
practice:
  - id: ai-observe-03-lab
    title: 寫三張時窗診斷卡
    kind: code
    minutes: 10
    steps:
      - 將 A、B、C 的數字與各自可下的結論存入 gpu-windows.txt
      - 為 B 補一個競爭解釋及能區分的時間戳記
    checks:
      - A 寫無需求而非零等待
      - B 建議查入隊、提交與裝置開始，不直接宣稱 CPU 故障
---

## 為什麼要學

儀表板顯示 GPU 使用率只有兩成，記憶體卻占了 7 成，該加大批次嗎？如果服務此刻根本沒有請求，低使用率完全合理；若外面排著長隊而裝置仍空閒，問題才值得追。單 100 分比沒有告訴你有沒有人在等，也沒有告訴你資料是否已送到裝置。

## 把活動、容量與需求分成 3 欄

以 NVIDIA 報表的 GPU 利用率（GPU utilization）為例，它描述取樣時段中至少有核心在執行的時間比例，不是所有運算單元平均幾成滿載。一個很小的核心連續跑，也可能讓這個時間比例很高。顯示記憶體已用量（framebuffer memory used）描述容量占用，例如模型權重長時間放在裝置上，即使當下沒有運算也不會自動歸零。它不是每秒搬運多少資料，更不代表記憶體頻寬打滿。

等待時間要註明起訖；這裡是從請求入隊到開始服務。使用相同部署、同一裝置與對齊的時窗，把到達數、等待、裝置活動及已用容量放在一起。硬體資料可透過 DCGM Exporter 匯出，但硬體工具不會自動知道入口排隊多久；後者必須由服務留下時間點。在一張卡由多個工作共用時，也要核對活動是否來自同一服務。

## 範例：低利用率有 2 種故事

這是 3 段互不重疊的合成視窗，每段 1 分鐘。等待欄是該視窗入隊並取得起始時刻之請求的中位數；沒有請求的時窗用空值而非虛構的 0 毫秒。讀完每列，選一個值得深入的階段，而不是替卡打分數。

開啟 `C:\dev\stackway-lab\observe`，將範例另存為 `align_windows.py`。把等待中的請求與 GPU 使用率放回同一段時間。若兩張圖的視窗沒對齊，看起來的相關可能只是巧合。

在該目錄執行：Windows PowerShell 用 `py align_windows.py`；macOS／Linux 用 `python3 align_windows.py`。

```python
windows = [("A", 0, None, 3, 7100),
           ("B", 40, 220, 18, 7100),
           ("C", 40, 12, 82, 7100)]
for label, arrivals, wait_ms, util_pct, used_mib in windows:
    if arrivals == 0:
        check = "idle demand"
    elif wait_ms > 100 and util_pct < 30:
        check = "inspect dispatch trace"
    else:
        check = "compare baseline"
    print(label, arrivals, wait_ms, util_pct, used_mib, check)
```

若要在已有 NVIDIA 工具的裝置核對欄位，可在 PowerShell 或終端機執行 `nvidia-smi --query-gpu=name,utilization.gpu,memory.used --format=csv,noheader`。這只是一張當下的活動與容量快照，沒有 A、B、C 的服務等待，也沒有自然形成一條時間線，不可拿來充當本題 3 個視窗的來源。

### 把 2 種等待分開

考慮一筆到了入口、進入佇列、離開佇列、送進裝置才完成的請求。入隊到出隊若占了大半，而出隊後很快就提交，較該查批次何時湊齊或工作者何時能接單；若出隊後到提交前特別長，上游前處理或搬運才變得可疑。這兩種情況可能有幾乎相同的分鐘利用率，卻需要不同改動。把每個邊界的時間留下來，比直接把同一張卡的取樣頻率調得更高，更能區分它們。

## 常見錯誤

不要用 1 秒採樣的使用率去解釋某筆幾毫秒的停頓。粗時窗會把尖峰攤平，記憶體容量也看不出核心執行的效率。若要查短時間空白，需要能把主機準備、傳輸、裝置核心對齊的追蹤；那比單看另一條百分比曲線更能區分相競的解釋。

## 小結

先證明有需求和使用者等待，再問裝置是乾等、忙碌，還是別的工作占住它。每個結論都帶著指標定義、時窗和下一個可驗的階段，不把警示顏色當成診斷。
