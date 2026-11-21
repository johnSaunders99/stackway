---
id: ai-gpu-07-roofline
module: ai-gpu
order: 7
title: Roofline 與算術強度
subtitle: 換更快的運算單元真的有用嗎
status: ready
minutes: 35
level: 3
prereqs:
  - ai-gpu-03-memory
objectives:
  - 用 FLOP 與位元組計算算術強度
  - 在雙上限圖判斷主要受頻寬或計算限制
tags:
  - gpu
  - roofline
resources:
  - title: NVIDIA：Nsight Compute 剖析指南
    url: https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 讀吞吐量指標與 Roofline 的座標軸。
concepts:
  - id: ai-gpu-roof-min
    prompt: Roofline 為何取運算與頻寬上限中的較小值？
    answer: 兩個限制都要滿足，較小者先限制可達的每秒運算量。
    mcq:
      question: 強度 2 FLOP/B、頻寬 100 GB/s、峰值 1000 GFLOP/s，上限為何？
      options:
        - 1000 GFLOP/s
        - 1200 GFLOP/s
        - 50 GFLOP/s
        - 200 GFLOP/s
      answer: 3
      explain: 資料供給最多支撐 200，不能加上或改取較高的計算峰值。
    interview:
      question: 兩個核心在屋頂線圖上分居交點兩側，你如何決定要試什麼？
      points:
        - 對齊精度與記憶體層
        - 比較兩個上限
        - 區分預測與實測差距
      answer: 我會先確認橫軸的位元組數和頻寬是同一層。左邊若貼著斜線，我會試提高重用；右邊若貼著水平線才看運算實作。離屋頂太遠要先追等待。
  - id: ai-gpu-roof-ridge
    prompt: 2 條屋頂交點的算術強度怎麼求？
    answer: 計算峰值除以同一邊界的記憶體頻寬，化成 FLOP/B。
    mcq:
      question: 若只把頻寬從 100 加到 200 GB/s，固定峰值 1000，交點移到哪？
      options:
        - 5 FLOP/B
        - 10 FLOP/B
        - 20 FLOP/B
        - 200 FLOP/B
      answer: 0
      explain: 交點是峰值除以頻寬，斜線變陡，較早碰上水平線。
  - id: ai-gpu-roof-gap
    prompt: 實測遠低於較低屋頂，能直接斷定限制來源嗎？
    answer: 不能；要查平行度、等待或存取效率，再用實際計數器驗證。
practice:
  - id: ai-gpu-07-lab
    title: 畫一張有單位的雙上限圖
    kind: code
    minutes: 12
    steps:
      - 把交點、2 個強度和預測上限畫進 roof-notes.txt
      - 分別只把 bw、只把 peak 翻倍，寫下哪個工作上限改變
    checks:
      - 原交點強度 10，2 個上限為 200、1000 GFLOP/s
      - 只倍增峰值不會改善強度 2 的屋頂
---

## 為什麼要學

有 2 張卡，一張乘法峰值高 1 倍，一張記憶體頻寬高 1 倍。你手裡只有上一堂算出的運算與搬運帳，要先借哪張做測試？屋頂線模型（Roofline）把這個問題縮成一張圖：就算沒有其他損失，工作也得同時滿足搬得動與算得完兩個限制。

## 先把 2 個上限換成相同單位

算術強度（arithmetic intensity）是浮點運算數除以穿過指定記憶體邊界的位元組數，單位 FLOP/B。若頻寬是每秒 100 GB、每搬 1 位元組可做 2 FLOP，資料最多餵得起每秒 200 GFLOP。再比硬體針對該精度與指令路徑的運算峰值；2 個上限取小，不是相加、也不是取平均。本例的 G 都取十進位 10 億，單位才會抵銷。

圖的橫軸是算術強度，縱軸是每秒浮點運算數。頻寬乘強度是一條往右上升的斜線，運算峰值則是一條水平線，兩者較低的部分形成屋頂。兩線相交處的強度等於峰值除以頻寬；交點左側較低的是頻寬屋頂，右側較低的是計算屋頂。實測點可以在屋頂下方很遠，屋頂低的一側是上限，不是瓶頸已被證實。

## 範例：在同一張屋頂圖放 2 個點

使用虛構設備，每秒 100 GB 的頻寬與每秒 1000 GFLOP 的運算峰值。每個工作都搬 1000 位元組，但從每筆資料得到的計算量不同。先算交點落在哪，再判斷各點應看斜線還是水平線。

在 `C:\dev\stackway-lab\gpu` 新建 `roof_caps.py`。記下運算速率與記憶體頻寬各自給出的上限；限制整體的是較低的那條，不是規格表上較漂亮的數字。

在該目錄執行：Windows PowerShell 用 `py roof_caps.py`；macOS／Linux 用 `python3 roof_caps.py`。

```python
bw, peak = 100, 1000
print("ridge_FLOP_per_B", peak / bw)
for flop, byte_count in [(2000, 1000), (20000, 1000)]:
    intensity = flop / byte_count
    feed = bw * intensity
    print(intensity, feed, peak, "cap_GFLOP_s", min(feed, peak))
```

有個值得停下來算的反例：若強度為 2 的核心只量到每秒 20 GFLOP，帳面上雖在交點左邊，卻只達其頻寬屋頂的 1/10。即使更換頻寬翻倍的卡，也無法從這張圖推知原來的 9 成差距會自動消失。

### 由測得的秒數補上真正的點

若某個長任務在指定邊界做了 1 GFLOP，從裝置開始到完成花了 0.01 秒，點的高度就是 100 GFLOP/s。橫向位置還需要另外知道搬過多少位元組；只拿時間和運算數無法畫出完整座標。反過來，只有運算數與位元組數能畫出屋頂下方的一條直線位置，卻不知道真正的點有多高。

把兩種證據放在一起時，不妨用空心記號畫預測、實心記號畫實測。即使落在同一個強度，兩個實作仍可有不一樣的高度，因為彼此讓硬體空等的時間不一定相同。

## 常見錯誤

不要拿半精度矩陣乘法的宣傳峰值去評估單精度普通加法，也不要用快取層的流量除出強度，卻配裝置主記憶體的頻寬。兩者必須描述同一條路。實測若看似高於屋頂，應先查位元與位元組、量測視窗與層級，再來討論超越上限。

## 小結

Roofline 幫你決定先驗哪個方向。落在斜線附近可以查資料重用；靠近水平線應看運算路徑。若離兩者都遠，下一步應找等待或有效平行度，而不是只換一個更大的峰值。
