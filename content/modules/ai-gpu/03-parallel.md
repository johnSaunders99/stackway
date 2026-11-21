---
id: ai-gpu-02-parallel
module: ai-gpu
order: 3
title: CUDA 網格、區塊與執行緒
subtitle: 用小矩陣想像平行工作
status: ready
minutes: 30
level: 3
prereqs:
  - ai-gpu-02-arch
objectives:
  - 把元素配到執行緒與區塊
  - 解釋為何小工作不一定比較快
tags:
  - gpu
  - cuda
resources:
  - title: NVIDIA：CUDA 程式設計模型
    url: https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: 讀主機、執行緒群組與硬體對應。
  - title: NVIDIA：撰寫 SIMT 核心函式
    url: https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html
    kind: doc
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
    note: 看索引、區塊與記憶體空間的例子。
concepts:
  - id: ai-gpu-grid-address
    prompt: 區塊座標和塊內座標怎麼合成資料欄號？
    answer: 區塊橫座標乘區塊寬度，再加上塊內橫座標。
    mcq:
      question: 區塊寬 4，區塊橫座標 1、塊內橫座標 0，對應哪一欄？
      options:
        - "0"
        - "1"
        - "5"
        - "4"
      answer: 3
      explain: 塊內 0 是這塊的起點，不是整張矩陣的起點。
    interview:
      question: 如何驗證一個二維啟動配置有覆蓋全部元素又不重複寫？
      points:
        - 兩方向向上取整
        - 先檢查二維界線
        - 用非整除尺寸逐格計次
      answer: 我會挑 5 乘 3 這種兩邊都有尾塊的資料，逐格累加寫入次數，每格應為 1。若只驗總和，漏一格和重複一格可能互相抵銷。
  - id: ai-gpu-grid-edge
    prompt: 二維網格的邊緣為什麼要分別檢查列與欄？
    answer: 跨出合法欄的線性地址可能落在下一列，單查總長度會誤寫。
    mcq:
      question: 寬 5 的矩陣中，列 0 欄 5 算出的地址 5 有什麼問題？
      options:
        - 欄越界，與列 1 欄 0 撞址
        - 一定超過整個陣列尾端
        - 是第 0 列最後一個合法元素
        - 只要目的陣列多留一格就能當合法座標
      answer: 0
      explain: 合法欄是 0 至 4；地址在陣列內不代表二維座標合法。
  - id: ai-gpu-launch-overhead
    prompt: 為什麼少量元素上 GPU 不保證比較快？
    answer: 傳輸與啟動有固定成本，小工作未必能用平行吞吐量抵銷準備時間。
  - id: ai-gpu-grid-cover
    prompt: 如何確認每個資料元素都恰好分到一個寫者？
    answer: 使用邊長不能整除塊寬或塊高的資料，逐格統計合法寫入次數，每格都應等於 1。
    mcq:
      question: 被分配到的總次數等於元素數，為何還要逐格檢查？
      options:
        - 每個元素的寬度可能不同
        - 漏一格與重複一格可能互相抵銷
        - 向上取整不會留任何空位
        - 全域索引從 1 起算
      answer: 1
      explain: 總數對不能排除重複及遺漏，逐格驗收能找出兩種錯誤。
practice:
  - id: ai-gpu-03-lab
    title: 保存一張覆蓋地圖
    kind: code
    minutes: 10
    steps:
      - 把 3 列區塊編號存進 grid-notes.txt，標出合法與啟動位置數
      - 將寬改為 4 比較右側區塊是否還需要
    checks:
      - 原題啟動 32 個位置、有效 15 個
      - 寬度整除後只有 1 個橫向區塊且每格仍只訪問一次
---

## 為什麼要學

把一張 3 列、5 欄的票價格子全部加 1，你會寫雙層迴圈。在 GPU 上也可以交同一份工作說明，讓許多執行緒各自算出「我該改哪格」。真正容易出錯的不是加法，而是把第五欄算成下一列、讓 2 條執行緒改同一格，或忘記最後沒有填滿的小區塊。

## 2 個層級的座標合成一個地址

一次啟動的區塊集合叫網格（grid）。區塊座標（block index）指定哪一塊，區塊內的執行緒座標（thread index）只在自己的小塊中編號。假設每塊寬 4、高 2，某條執行緒所在欄是「區塊橫座標乘 4，再加區塊內的橫座標」，列也用相同方式乘高度。記住橫座標是欄，直座標是列；用列優先排列時，一維地址等於列乘實際矩陣寬度再加欄。

要覆蓋所有資料，兩個方向各自向上取整。整數算式 `(n + b - 1) // b` 可求長度 n 需要幾塊寬 b 的區塊。注意整塊啟動意味著邊緣可能有空位，必須先檢查列與欄都合法，再換成地址。單看一維地址是否在範圍內不夠，因為超過列尾的欄可能剛好指到下一列合法的地址。

## 範例：列印每格由哪一塊負責

以 CPU 迴圈逐一枚舉座標。這是核對分工的地圖，並不是模擬 GPU 保證的執行次序。每格記負責的區塊號，另外只對有效位置記一次寫入，方便分別檢查覆蓋與重疊。

開啟 `C:\dev\stackway-lab\gpu`，將範例另存為 `grid_map.py`。在紙上挑一個區塊和本地編號，算出它負責哪個元素，再用輸出檢查其他區塊有沒有重複工作。

在該目錄執行：Windows PowerShell 用 `py grid_map.py`；macOS／Linux 用 `python3 grid_map.py`。

```python
w, h, bw, bh = 5, 3, 4, 2
gx, gy = (w + bw - 1) // bw, (h + bh - 1) // bh
visits, owners = [0] * (w*h), [-1] * (w*h)
for by in range(gy):
    for bx in range(gx):
        for ty in range(bh):
            for tx in range(bw):
                x, y = bx*bw + tx, by*bh + ty
                if x < w and y < h:
                    i = y*w + x
                    visits[i] += 1
                    owners[i] = by*gx + bx
for y in range(h):
    print(owners[y*w:(y+1)*w])
print("slots", gx*gy*bw*bh, "valid", sum(visits))
assert all(v == 1 for v in visits)
```

若把矩陣攤開，位置 4 和 5 是相鄰的兩個元素，在紙面上卻分別是上一列末端和下一列起點。請用這一對地址沿程式反推區塊編號。刻意選不方正的測資，就是為了讓「誤用高度當寬度」這種錯法無處藏身。

### 拿右下角倒推一次

右下角在列 2、欄 4。先各自用塊高與塊寬做整數除法，可以找出它在直向第一塊、橫向第一塊；再看餘數，發現這個元素在那塊的左上角。於是你得到一個不依賴迴圈順序的檢查：用座標找負責者，再用負責者算回座標，來回必須一致。

若畫出的最下面一列少了右下角，不用從頭檢查每格。先看網格除法是否向上取整；若那一塊根本沒有啟動，改寫塊內索引也無法救回漏掉的資料。若有啟動才檢查界線是否誤把最後一欄排除了。

## 常見錯誤

只有 15 格的小題不適合拿來證明 GPU 比 CPU 快。啟動有固定成本，若還要跨裝置搬移，可能連準備時間都比實際加法長。區塊越大也不保證越好；過大的規格可能超過上限或降低同時可用的工作數。先修對索引，再拿代表性尺寸計時。

## 小結

把網格畫成覆蓋資料的磁磚：塊內座標只從磚角起算，必須加上整塊的位移才是矩陣座標。驗收時問「每個合法元素是否恰好一次」，不要只問程式有沒有跑完。
