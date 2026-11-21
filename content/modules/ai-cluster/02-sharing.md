---
id: ai-cluster-02-sharing
module: ai-cluster
order: 2
title: MIG 分割與時間切片
subtitle: 2 組工作能否真正隔開記憶體
status: ready
minutes: 35
level: 4
prereqs:
  - ai-cluster-01-inventory
objectives:
  - 比較 MIG 的硬體資源分割與時間切片的交錯執行
  - 針對記憶體隔離和機型支援說出選擇理由
tags:
  - cluster
  - sharing
resources:
  - title: NVIDIA：MIG 硬體分割與支援機型
    url: https://docs.nvidia.com/datacenter/tesla/mig-user-guide/
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: NVIDIA GPU Operator：時間切片的限制
    url: https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/gpu-sharing.html
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-cluster-02-sharing-isolation
    prompt: 工作要求硬體記憶體隔離，優先查哪一項？
    answer: 機型支援的 MIG 配置及單槽容量。
    mcq:
      options:
        - 時間切片名額是否剛好等於工作數
        - 節點平均使用率是否低於一半
        - 機型支援的 MIG 配置及單槽容量
        - 兩個工作的容器記憶體限制是否相同
      answer: 2
      explain: 獨立資源來自受支援的硬體分割，不是把申請單拆成兩張。
  - id: ai-cluster-02-sharing-replica
    prompt: 時間切片公布 8 個名額，能推論什麼？
    answer: 有 8 個可申請名額，不能推出有 8 份專屬記憶體。
    mcq:
      options:
        - 資源名稱有 8 份便代表有 8 張實體卡
        - 每份固定占有 1/8 的裝置記憶體
        - 每份都保證取得相同比例的運算時間
        - 有 8 個可申請名額，不能推出有 8 份專屬記憶體
      answer: 3
      explain: 公布資源數與實際隔離、效能保證是不同層的事。
  - id: ai-cluster-02-sharing-fit
    prompt: 2 個獨立 20 GiB 槽要各跑 28、8 GiB，為何不行？
    answer: 第一個工作超過單槽上限。
    mcq:
      options:
        - 第一個工作超過單槽上限
        - 第二個工作沒有用滿 20 GiB，所以不能放入
        - 2 個工作必須都剛好等於相同大小
        - 總需求必須小於單一槽，而不是各自符合單槽
      answer: 0
      explain: 總量能放不代表每項需求能放進指定槽。
    interview:
      question: 兩個團隊共用一張卡，如何決定要不要用時間切片？
      points:
        - 先問隔離底線
        - 核對機型與尖峰
        - 保留不可行的選項
      answer: 我會先問能否容忍彼此搶資源。若硬性要求記憶體隔離，就查可用 MIG 配置或獨立卡；若能共享，才看同時尖峰和實際延遲，不保證每個名額有固定容量。
practice:
  - id: ai-cluster-02-sharing-p1
    title: 保存共享模式的淘汰理由
    minutes: 12
    kind: code
    steps:
      - 儲存三列結果並各加一欄是否要求隔離
      - 替第二列列出一個可行的硬體配置方向
    checks:
      - 28 加 8 通過總量但不通過單槽
      - 不把通過總量寫成具備隔離
---
## 為什麼要學：2 張申請單可能用的是同一塊記憶體
一張 40 GiB 的卡讓 2 個工作同時申請名額，看起來像每人分到 20 GiB。若平台只是讓 2 個工作輪流用同一裝置，第二個工作突然長大，第一個也可能受影響。選擇共享方法之前，先問「一定要隔開的是時間、容量，還是故障影響？」再問這張卡與這種配置是否真的提供所需保證。

## 核心概念：切硬體和輪流執行不同
多執行個體 GPU（Multi-Instance GPU，MIG）在支援機型上依既有規格，把卡劃成有專屬運算與記憶體資源的 GPU 執行個體。不是任意填個百分比就能產生一份切片；要核對型號、支援的配置組合，以及工作能否放進單一執行個體。記憶體有獨立資源邊界，不代表整台主機、供電和網路也各自獨立。

時間切片（time-slicing）讓工作共享同一裝置的執行機會；外掛可把較多資源名額公布給排程器。名額增加不會變出新的實體卡，也不提供硬體分割帶來的記憶體與故障隔離。請求多個名額也不等於契約保證取得等比例算力。適合能容忍互相干擾且有額外容量管理的工作，不適合拿來兌現硬性隔離承諾。

## 範例：同一組需求交給 2 種政策
畫出一份工作實際可用的記憶體邊界。輪到它執行，和它擁有專用的一塊硬體，是兩個不同的承諾。把下面的範例存成 `C:\dev\stackway-lab\cluster` 裡的 `gpu_sharing.py`。

在該目錄執行：Windows PowerShell 用 `py gpu_sharing.py`；macOS／Linux 用 `python3 gpu_sharing.py`。

```python
for need in [(18,18), (28,8), (28,18)]:
    slots = (20,20)
    fits_isolated = all(a<=b for a,b in zip(need,slots))
    fits_total = sum(need)<=sum(slots)
    print(need, "fits slots", fits_isolated, "fits pooled bytes", fits_total)
```

這裡的 20 GiB 是教具中既有的 2 個獨立容量槽，不是在指定任何商品的可選配置。第一組工作各需 18 GiB，可各自放進一槽；第二組一大一小，在共享總量上看起來足夠，卻不能在 2 個固定槽中互借。輸出中的共享判斷只測總容量，並未判斷是否有記憶體隔離、時間保證或延遲保證。

### 用 2 個問題讀申請單
請先讓工作擁有者填「最高同時需要多少記憶體」和「旁邊的工作突增時自己可否被拖慢」。第一題決定容量能不能放下，第二題決定能不能接受沒有隔離的安排。兩個答案彼此獨立：一個很小但需穩定回應的服務，可能比一個可重跑的大型離線工作更需要獨立資源。不要只按工作大小或團隊名稱替它選共享方式。

## 常見錯誤
將獨立槽的剩餘量加起來，拿去承諾一個跨不過槽界的單工作。反過來，把共享卡上目前沒人用的記憶體標成專屬保留量，也是不成立的保證。做決策時要記工作尖峰而非平均，另留執行環境開銷；不然紙上剛好放下，一啟動便滿載。

## 小結
先排除無法滿足硬條件的模式，再討論如何提高利用率。若工作需要硬體記憶體隔離，而機型不支援所需分割，答案可以是改派獨立卡或暫緩排程，不是偷偷以時間切片取代。留下選擇理由，比只寫「支援共享」可靠。
