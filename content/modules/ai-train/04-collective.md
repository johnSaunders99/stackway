---
id: ai-train-02-collective
module: ai-train
order: 4
title: All-reduce 與梯度同步
subtitle: 一次更新為何要等待別人
status: ready
minutes: 30
level: 3
prereqs:
  - ai-train-03-ddp
objectives:
  - 以 2 個梯度手算平均
  - 畫出集合通訊前後各順位的數值
tags:
  - train
  - all-reduce
resources:
  - title: NCCL：集合操作的輸入與輸出
    url: https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
  - title: PyTorch：分散式資料平行與同步點
    url: https://docs.pytorch.org/tutorials/intermediate/ddp_tutorial.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-train-02-collective-element
    prompt: 向量 [2,6] 與 [4,2] 做加總 all-reduce，結果是什麼？
    answer: 每人 [6,8]。
    mcq:
      options:
        - 每人 [6,8]
        - 每人 [2,6,4,2]
        - 只有 0 號得到 [6,8]
        - 每人一個純量 14
      answer: 0
      explain: 要對齊位置逐元素歸約，且每個成員都有完整結果。
  - id: ai-train-02-collective-normalize
    prompt: 顯式指定 SUM，為了得到 2 個等權局部平均梯度的平均要做什麼？
    answer: 若尚未縮放，將和除以 2 一次。
    mcq:
      options:
        - 直接用和，不看後續期待的語意
        - 若尚未縮放，將和除以 2 一次
        - 以 2 個分量的平方和取代群組平均
        - 先將每個局部向量除以 2，求和後再除以 2
      answer: 1
      explain: 求和與平均是不同語意，需知道縮放由誰負責。
  - id: ai-train-02-collective-participate
    prompt: 同一群組有一個順位完全略過該次歸約，會有什麼風險？
    answer: 其他成員等不到匹配操作而停滯或出錯。
    mcq:
      options:
        - 靜默當成該順位的 0 向量
        - 群組會自動依實到人數變小
        - 其他成員等不到匹配操作而停滯或出錯
        - 未略過的人仍保證拿到完整群組的平均
      answer: 2
      explain: 同一集合操作要有相應的參與者，不會默默補資料。
    interview:
      question: 你如何區分「同步做了 2 次縮放」和「梯度真的變小」？
      points:
        - 手算固定局部值
        - 分開擷取和與平均
        - 檢查更新前縮放
      answer: 我會用 2 個已知向量列出局部值、預期的和及平均，核對框架交出的梯度。若已是平均，卻在更新前又除以順位數，就能直接定位是哪一步縮小了。
practice:
  - id: ai-train-02-collective-p1
    title: 交出兩個順位的梯度收據
    minutes: 10
    kind: code
    steps:
      - 儲存程式與輸出
      - 分別標上原梯度、和、平均與新參數，再手算其中一欄
    checks:
      - 2 個順位都拿到和 [6,8]
      - 用平均更新後 2 人都是 [0.7,0.6]
---
## 為什麼要學：等的是同一個更新方向
上一堂的模型只有 1 個參數。真實模型可能有數 1000000 個，不能讓每個順位挑一個「比較好的梯度」當代表。全體歸約（all-reduce）是在同一個通訊群組內，對每個相對位置執行同一種歸約運算，再讓每個成員都有完整結果。這個動作有兩個關鍵：相同位置相遇，以及人人得到結果。

## 核心概念：加總是操作，平均是你的語意
把梯度想成印有欄位名稱的收據。順位 0 對參數甲乙分別算出 2、6，順位一算出 4、2。用加總（sum）歸約時，甲只與甲相加得 6，乙只與乙相加得 8；不是把整張收據所有數都相加，也不是把兩張收據串成更長的一張。每個順位都得到向量 6、8。若 2 個等大批次各自先取平均，群組平均才是再除以 2 得到 3、4。

操作可指定求和、取最大等不同規則。「歸約」這個名字本身沒有承諾要除以世界大小；讀框架時要查它交給最佳化器的梯度已經如何縮放。若框架已交出平均，使用者又除一次，更新就無端縮小。若本地損失是總和或各批大小不同，還須核對目標究竟是每樣本平均，還是各順位等權。

## 範例：手算後再讓程式驗一遍
在 `C:\dev\stackway-lab\train` 新建 `reduce_grad.py`。每個參與者先寫自己的值，再問合併結果最後留在哪些順位。算出的數字相同，不表示輸入原本相同。

在該目錄執行：Windows PowerShell 用 `py reduce_grad.py`；macOS／Linux 用 `python3 reduce_grad.py`。

```python
rows = [[2,6],[4,2]]
total = [sum(col) for col in zip(*rows)]
mean = [x/len(rows) for x in total]
for rank, before in enumerate(rows):
    after = [round(w-.1*g, 2) for w,g in zip([1,1],mean)]
    print(rank, "input", before, "sum",total, "mean",mean, "weights",after)
```

先遮住程式輸出，把前後兩列畫在紙上。輸入時兩人不同，歸約後兩人各有同一個完整向量，不是 0 號收到向量、1 號清空。以學習率 0.1 做更新時，2 份舊參數都減同一組平均梯度。這個 Python 程式只演算值的語意，沒有重現通訊耗時、資料傳輸順序或裝置精度。

### 從一個看似合理的錯解倒查
若參考更新後第一個參數應該是 0.7，你卻算出 0.85，不妨把學習率先固定，往前倒推實際用到的梯度只有 1.5，而預期是 3。局部值若正確，問題就在歸約之後或更新之前的縮放；反過來，若 2 個順位收到的和本來就不同，先查參與者和欄位對齊。這樣做不必從頭翻每一層的微分，就能用小數字指出該量哪個中間量。

## 常見錯誤
把 all-reduce 當成所有人必須完全停止工作的全域柵欄。通訊可以非同步啟動，也可能和其他計算重疊；重點是使用結果前必須讓這次操作完成，且群組成員都要參與對應呼叫。若只有 0 號進入歸約、其他順位跳過，等不到的不是神祕的數值，而是缺少配對的參與者。

## 小結
讀一段梯度同步程式時請標出群組、元素順序、操作與縮放位置，再標哪一步需要結果。想要的若只是每人一段、而非每人全份，之後在[〈收集與分散歸約〉](#/lesson/ai-train-05-gather)會看到更貼近需求的資料交換方式。
