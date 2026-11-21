---
id: ai-train-01-shards
module: ai-train
order: 1
title: 資料分片與工作順位
subtitle: 每個工作行程負責哪些資料
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 依照順位分派不重疊的批次
  - 用樣本數檢查是否重複訓練
tags:
  - train
  - sharding
resources:
  - title: PyTorch：DistributedSampler 的取樣規則
    url: https://docs.pytorch.org/docs/2.15/data.html#torch.utils.data.distributed.DistributedSampler
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
  - id: ai-train-01-shards-rank
    prompt: 順位 1、總行程數 2，按位置取餘分片應讀哪些位置？
    answer: 1、3、5 等奇數位置。
    mcq:
      options:
        - 0、2、4 等偶數位置
        - 1、3、5 等奇數位置
        - 從位置 1 起連續取完整資料
        - 每個樣本的後半部特徵
      answer: 1
      explain: 切的是樣本位置；餘數 1 分給順位 1。
  - id: ai-train-01-shards-coverage
    prompt: 2 個順位各讀 6 筆，什麼能證明涵蓋了指定 12 筆？
    answer: 核對逐筆身分、重複次數與全集缺漏。
    mcq:
      options:
        - 總讀數剛好是 12
        - 2 個順位各自都沒有重複讀到同一筆
        - 核對逐筆身分、重複次數與全集缺漏
        - 兩份分片長度相同
      answer: 2
      explain: 讀取次數不能區分重讀和漏讀。
  - id: ai-train-01-shards-tail
    prompt: 資料數不能整除時，為什麼應註記尾端政策？
    answer: 補齊可能重複，丟尾可能漏掉樣本。
    mcq:
      options:
        - 補齊會自動製造新的獨有樣本
        - 只要總讀數正確就一定沒有補齊
        - 取樣器的尾端與批次載入器的尾批永遠同義
        - 補齊可能重複，丟尾可能漏掉樣本
      answer: 3
      explain: 有意的填補與錯誤重複需分辨；批次端也可能另丟尾批。
    interview:
      question: 你如何驗證兩個順位真的分攤了資料？
      points:
        - 保留樣本編號
        - 檢查交集與聯集
        - 核對尾端政策
      answer: 我會用一輪固定排列列出兩人的編號，確認聯集覆蓋預期資料，再數重複次數。若數量不能整除，我會先扣除約定的填補或丟尾，才判斷是否有錯。
practice:
  - id: ai-train-01-shards-p1
    title: 製作一輪樣本稽核表
    minutes: 11
    kind: code
    steps:
      - 儲存腳本，分別保留正常與誤分片的清單
      - 為每個順位圈出第二個本機批次
    checks:
      - 正常情況有 12 個不同樣本且無缺漏
      - 誤分片仍讀 12 次但只涵蓋 6 個
---
## 為什麼要學：明明讀了 12 次，怎麼只看過 6 題？
2 個訓練行程各跑完 6 筆資料，合計 12 筆，看似完成整輪。如果兩者恰好從同一筆開始、照同一順序走，後半資料可能一次都沒看過。資料分片（data sharding）先決定樣本的歸屬，再在各行程內湊批次。驗收要看樣本身分與次數，不能只看進度條。

## 核心概念：先給每個位置一個主人
工作順位（rank）是行程在這個群組內的編號；總行程數（world size）決定有幾份工作。從 0 起算的位置可以用「位置除以總數的餘數」指定順位。2 個順位時，0 號拿偶數位置，1 號拿奇數位置。這裡分的是這輪排列中的位置，不是把每張圖片切成兩半，也不是讓每個行程自己決定要負責哪些題。

假設有 12 個樣本、每順位每批 3 筆。每人拿 6 筆，每輪要做 2 個本機批次；同一步 2 人合計看 6 筆。若要打亂資料，先取得同一輪的一份共同排列，再按順位切。不可以讓兩邊各自亂排後用相同索引規則切，否則仍可能撞樣本。PyTorch 的分散式取樣器（DistributedSampler）管理這件事，每輪迭代前用相同輪次呼叫 `set_epoch` 以更新洗牌順序。

## 範例：讓重複和遺漏都現形
為各順位的分片紀錄建立 `C:\dev\stackway-lab\train`。建立 `shards.py`。把每個順位拿到的索引並排，先找交集再找遺漏。總筆數看似正確，也可能是重複樣本抵消了漏項。

在該目錄執行：Windows PowerShell 用 `py shards.py`；macOS／Linux 用 `python3 shards.py`。

```python
from collections import Counter
items = list(range(12))
good = [items[r::2] for r in range(2)]
for shards in [good, [good[0], good[0]]]:
    counts = Counter(i for shard in shards for i in shard)
    print("batches", [[s[j:j+3] for j in range(0,len(s),3)] for s in shards])
    print("reads, distinct", sum(counts.values()), len(counts),
          "duplicate", sorted(i for i in counts if counts[i]>1),
          "missing", sorted(set(items)-set(counts)))
```

第一輪分配把全集分成互斥兩集；第二輪刻意讓兩人拿同一份。兩輪的讀取次數相同，但集合聯集和計數表一比較，就會看到一半題目被讀 2 次、一半不見了。固定樣本識別字能找出是哪幾筆，不必保存影像、姓名等原始內容。

### 先分全域順序，再討論批次
把 12 張寫著編號的紙條排成一列，輪流發到兩個盤子，再把每個盤子分成 2 疊。交換發牌前相鄰的兩張紙條，會改變哪個順位拿到它們，但整輪仍各出現一次。若先複印整疊給兩人再請他們自由抽，2 疊大小雖可能相同，卻缺少互斥保證。抽查時把這一輪的編號和樣本識別字放在一起，才不會把第二輪合法再讀同一筆誤判為同輪重複。

## 常見錯誤
當總數不能整除時，別默默假設每份長度相等。對分散式取樣器而言，保留尾端時可用重複索引補齊，丟棄尾端時則會少看一些樣本；對批次載入器而言，丟棄最後不足一批又是另一層選擇。請分別記錄填補或省略的筆數，不把有意補齊誤報為程式重複讀取。

## 小結
用「實讀次數、不同樣本數、重複與缺漏名單」核對一次完整資料輪。若每個順位都要做相同步數的同步更新，尾端政策也要一起設計；之後在[〈資料平行與 DDP〉](#/lesson/ai-train-03-ddp)會說明為何不能讓某個順位提早離場。
