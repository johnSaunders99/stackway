---
id: ai-gpu-04-trace
module: ai-gpu
order: 8
title: GPU 工作時間軸
subtitle: 從時間軸找等待
status: ready
minutes: 35
level: 3
prereqs:
  - ai-gpu-07-roofline
objectives:
  - 標示 CPU 發出工作與裝置完成的不同時刻
  - 挑出一段可驗證的效能假設
tags:
  - gpu
  - profiling
resources:
  - title: PyTorch：效能剖析實作
    url: https://docs.pytorch.org/tutorials/recipes/recipes/profiler_recipe.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: 對照 CPU、裝置活動與時間軸。
  - title: NVIDIA：Nsight Systems 使用指南
    url: https://docs.nvidia.com/nsight-systems/UserGuide/index.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: 聚焦單段擷取與時間軸的對齊方式。
concepts:
  - id: ai-gpu-async-submit
    prompt: 主機提交耗時與裝置核心耗時各量哪段？
    answer: 前者量呼叫到返回，後者量裝置開始到完成；非同步提交可先返回。
    mcq:
      question: 主機呼叫在 1 毫秒返回，裝置到 6 毫秒才完成，可下哪個結論？
      options:
        - 返回時尚未代表裝置完成
        - 核心只跑 1 毫秒
        - 2 段一定要相加成 7 毫秒
        - 主機記錄必定出錯
      answer: 0
      explain: 不同軌道代表不同事件，非同步下兩者不必同時結束。
    interview:
      question: 看到相鄰核心之間有 4 毫秒空白，你會如何查？
      points:
        - 描述空白的兩個端點
        - 看下一個核心何時提交
        - 只改一個上游步驟作對照
      answer: 我先比前一核心結束與下一次提交。若提交本身就晚，我會預先備妥同批輸入再抓一次追蹤；若提交早已完成，改查串流依賴而非先改核心。
  - id: ai-gpu-trace-overlap
    prompt: 不同軌道重疊時怎麼看一次迭代耗時？
    answer: 以共同時鐘上的起點與完成點做差，沿相依路徑解讀，而非逐軌加總。
    mcq:
      question: 主機準備花 8 毫秒，與裝置核心重疊 5 毫秒，為何不能直接相加？
      options:
        - 只需採用較長的那一段，不必檢查起訖
        - 重疊區間在牆鐘時間只經過一次
        - 重疊就等於 2 段工作必定同時開始與結束
        - 有重疊就沒有相依性
      answer: 1
      explain: 要看兩區間聯集和交付終點，不能用工作量總和取代經過時間。
  - id: ai-gpu-trace-idle
    prompt: 裝置時間軸的一段空白能直接證明 CPU 太慢嗎？
    answer: 不能，需對照提交、搬移、相依與收集範圍，再做能驗證的改動。
practice:
  - id: ai-gpu-08-lab
    title: 在時間軸上標一個可推翻的假設
    kind: code
    minutes: 12
    steps:
      - 把輸出的文字時間軸存進 trace-notes.txt
      - 圈出 A 完成到 B 開始的空白，註記一個可能原因和反證
    checks:
      - 圈出 6 到 10 毫秒，而非 1 到 10
      - 有寫出若提早備妥 B 卻未縮短空白，就要查其他依賴
---

## 為什麼要學

你在 CPU 上看見一次函式呼叫只花 1 毫秒，使用者卻等了十幾毫秒才拿到結果。兩邊不一定有人量錯：主機可能只是很快地把工作放進佇列，真正的資料搬移和運算晚一點才發生。工作時間軸（timeline）讓你把「已交辦」與「已完成」分開看。

## 在同一時鐘上讀多條軌道

追蹤（trace）把一段活動記成開始、結束與所屬軌道。主機軌道可能有準備資料、提交與等候；裝置軌道可能有複製與核心執行。CUDA 串流（stream）是一條有先後關係的操作序列；同串流的相依工作按順序執行，不同軌道的長條卻可能重疊。不要把同一時間牆上發生的兩件事算兩次。

讀一個迭代時，先圈起起點與可交付結果的終點，再找哪些工作非等到前一步完成不能開始。這條會決定交付時間的依賴路徑，比「所有長條耗時的總和」更接近你要改善的對象。GPU 軌道的空白表示在這次收集範圍內沒有相應活動，原因可能是尚未提交、正在等另一條串流，或根本漏收一類活動。空白不是原因欄。

## 範例：對齊一筆手動標記的工作

合成追蹤只含一條裝置串流，時間單位是毫秒。第一個核心是 A，主機同時準備 B。先用端點做減法，看 A 結束至 B 開始有多少空白，再與 B 的主機端提交時間對齊。

在時間線圈出主機端有動作但裝置端仍空白的地方；空白是查下一項證據的起點，不是瓶頸的名稱。把下面的範例存成 `C:\dev\stackway-lab\gpu` 裡的 `trace_gap.py`。

在該目錄執行：Windows PowerShell 用 `py trace_gap.py`；macOS／Linux 用 `python3 trace_gap.py`。

```python
events = {"submit_A": (0, 1), "kernel_A": (1, 6),
          "prepare_B": (1, 9), "submit_B": (9, 10),
          "kernel_B": (10, 14)}
for name, (start, end) in events.items():
    print(f"{name:10}", "."*start + "#"*(end-start), end-start)
gap = events["kernel_B"][0] - events["kernel_A"][1]
print("device_gap_ms", gap, "span_ms", events["kernel_B"][1])
```

在這張圖裡，A 執行的幾毫秒已被主機準備工作蓋住。若只把 A 從 5 毫秒縮到 3 毫秒，而 B 的提交時間毫無改變，最後完成點依然是 14。反而是裝置軌道看起來更空了；那不是改壞了，也不能用空白百分比代替交付時間。

### 把可推翻的假設寫成 2 欄

第一欄寫「我真的看到的事」：核心 A 已結束，但 B 的主機提交到較晚才開始。第二欄寫「如果提前備妥 B，下一次提交應該更早，裝置空白也應縮短」。兩欄之間還缺一次對照，不能只因為時間剛好對上就把第二欄當成結果。

對照時要使用相同輸入大小與啟動配置，並確認 B 的輸出仍正確。如果改動後提交確實提早，裝置開始時間卻不動，這也是有用的結果：它把懷疑範圍縮到提交後的等待，你可以改查先行操作或其他相依工作，而不必一直加速主機準備。

## 常見錯誤

CPU 使用同步呼叫而停住，不表示 GPU 同時閒著，它可能正在完成主機要取回的結果。反之，把多個核心加總也不一定等於迭代長度。若沒有相關識別值或共享時鐘，不能只靠兩條長條在畫面上很靠近，就認定其中一條造成另一條。

## 小結

一份可用的追蹤註記包括「哪一段是觀察」「我懷疑什麼」「哪個改動能推翻猜測」。先記兩條軌道的起訖，再查同一段空白是否跨多次迭代重現。
