---
id: ai-train-05-straggler
module: ai-train
order: 12
title: 落後順位與等待分析
subtitle: 所有卡都在等，先看哪個順位
status: ready
minutes: 40
level: 3
prereqs:
  - ai-train-04-resume
objectives:
  - 對照各順位資料讀取與集合通訊時間
  - 設計只改一項條件的診斷實驗
tags:
  - train
  - straggler
resources:
  - title: PyTorch：分散式資料平行與同步點
    url: https://docs.pytorch.org/tutorials/intermediate/ddp_tutorial.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
  - title: NCCL：分辨通訊路徑與應用效能問題
    url: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/troubleshooting/performance_and_tuning.html
    kind: doc
    lang: en
    minutes: 5
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-05-straggler-wait
    prompt: 0 號較早進入相同集合呼叫，為何它量到的區段可能更長？
    answer: 其中包括等其他順位到齊。
    mcq:
      options:
        - 其中包括等其他順位到齊
        - 量到的全部時間都是在網路上搬資料
        - 早到的順位一定擁有較大的梯度
        - 先進集合表示該順位本地計算較慢
      answer: 0
      explain: 長區段不等於裝置一直在傳輸，要對照各順位到達。
  - id: ai-train-05-straggler-control
    prompt: 要檢驗 1 號資料載入慢的假說，應先改什麼？
    answer: 只替換 1 號的讀取來源並維持批次形狀。
    mcq:
      options:
        - 同時換卡、換讀取來源、換批次形狀
        - 只替換 1 號的讀取來源並維持批次形狀
        - 先取消梯度同步再比整步
        - 只增加 1 號的每卡批次並和原步時比較
      answer: 1
      explain: 只改讀取條件，才能判斷等待和整步是否跟著縮短。
  - id: ai-train-05-straggler-clock
    prompt: 未對齊的跨機絕對時刻不宜直接相減，先看什麼？
    answer: 相同步號下各順位自己量到的區段耗時。
    mcq:
      options:
        - 對齊日誌行號，不管它們是否為同一步驟
        - 直接用不同機器的絕對時間戳排序
        - 相同步號下各順位自己量到的區段耗時
        - 只比較整場作業開始與結束，略過各順位區段
      answer: 2
      explain: 各機自量的區段與共同步號可先比較；絕對先後需對時。
    interview:
      question: 所有卡都顯示在等集合，你如何選第一個診斷實驗？
      points:
        - 找最晚準備者
        - 拆解前置讀取計算
        - 只改一項並預告反證
      answer: 我會先對齊步號與到達時刻。若 1 號總是晚在讀取，我只換它的輸入來源，預期其他順位等待和整步會一起縮短；若不同步改善，就回頭查通訊或其他重疊階段。
practice:
  - id: ai-train-05-straggler-p1
    title: 交付一份有反證條件的步時分析
    minutes: 14
    kind: code
    steps:
      - 保存腳本與兩組時間線
      - 另試兩邊都讀 20、傳輸改 70 毫秒，寫出這次該查的不同原因
    checks:
      - 原例為 120 與 60 毫秒
      - 改成傳輸 70 時整步回到 120 毫秒，但沒有人等同伴
---
## 為什麼要學：等待最久的卡，不一定是拖慢大家的卡
一個訓練步驟中，0 號在集合呼叫裡等了 70 毫秒，1 號只花了 10 毫秒。直覺可能先去修 0 號的網路；但如果 1 號在讀資料時晚了 60 毫秒，0 號其實是最早準備好的人。落後順位（straggler）是拖慢共同進度的成員，不是單看哪張卡顯示等待時間最大。

## 核心概念：把時間軸貼到同一個步驟
在同一個更新步，分別標出各順位開始取資料、資料就緒、計算完成而進入集合、集合完成的時刻。簡化為序列執行時，最後到達者決定集合何時能全員到齊；先到者在集合裡看見的時間還含等人。若大家幾乎同時進入卻都花很多時間才結束，才有較好的理由查傳輸量、路徑或裝置端排程。

以下假設同一時基、無前一步殘留、沒有預取或重疊，且全員到齊後傳輸固定 10 毫秒。真實系統的主機時鐘未必同步，非同步呼叫的返回時間也不一定是裝置完成時刻。可先用同一順位的區段耗時與共同的步驟編號比對；要跨機比較絕對時刻，得先有對齊方法和誤差範圍。

## 範例：只改較慢順位的讀取時間，不動網路
開啟 `C:\dev\stackway-lab\train`，將範例另存為 `late_rank.py`。先找最晚抵達同步點的是哪個順位，再標記其餘順位等了多久。等待時間長的未必是拖慢全隊的那個。

在該目錄執行：Windows PowerShell 用 `py late_rank.py`；macOS／Linux 用 `python3 late_rank.py`。

```python
def trace(read, compute=30, wire=10):
    enter = [x+compute for x in read]
    last = max(enter)
    end = last+wire
    for r, t in enumerate(enter):
        print(r, "read",read[r],"enter",t,"wait_peer",last-t,"collective",end-t)
    print("step_ms",end)
trace([20,80])
trace([20,20])
```

第一組 0 號讀 20 毫秒、1 號讀 80 毫秒，計算時間相同；兩者都在同一個完成點離開集合。第二組只把 1 號資料讀取降到 20，其餘條件不變。若資料延遲才是原因，應同時看到 0 號等待縮短、整步縮短，而傳輸成本仍是 10。這是針對假說設計的推演，不是已經改善了某個實體叢集。

### 同一個總步時可以來自不同病因
把兩人資料讀取都設回 20 毫秒，並把到齊後的傳輸改成 70 毫秒，總步時竟與原先慢的那組一樣。差別在於這次所有人同時抵達，沒有人能靠提早讀完來縮短步驟。若監控只有整步的單一數字，兩個情境完全分不出來。多保留進入集合的事件，就能讓下一輪實驗從替換資料來源轉向核對傳輸量與路徑。

## 常見錯誤
只抄一個順位或只看平均步時。0 號的「集合時間」和 1 號的「資料時間」可能都大，卻是同一個根因投射在不同位置。另一次若每個順位進入時間差很小，卻同時拖長，就不能沿用這個病例說一定是資料；改查資料量相同時的通訊路徑或背景競爭。一次只改一項，否則無法知道哪個推論被支持。

## 小結
診斷報告寫出觀察、假說、介入和反證條件。可在下一輪只讓落後順位改讀已預備的同形狀批次，保持模型、卡數、批次大小及同步資料量不變。若讀取變快卻整步不變，就留下這個負面結果，回頭看真正限制步驟完成的那一段。
