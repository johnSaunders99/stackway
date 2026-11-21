---
id: fd-systems-02-memory
module: fd-systems
order: 2
title: 記憶體與生命週期
subtitle: 為什麼清單一直長大
status: ready
minutes: 25
level: 2
prereqs:
  - fd-systems-01-process
objectives:
  - 區分暫存的記憶體與磁碟
  - 以小輸入觀察累積配置的趨勢
tags:
  - systems
  - memory
resources:
  - title: "Python：用 tracemalloc 追蹤配置"
    url: https://docs.python.org/3/library/tracemalloc.html
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-systems-02-memory-lifetime
    prompt: "迴圈已跑完，為何加入外層清單的資料仍在？"
    answer: "清單仍保留物件的參照，工作完成不會替它決定保存期限。"
    mcq:
      options:
        - "清單仍參照它"
        - "離開迴圈會寫到磁碟"
        - "物件只能在行程結束時釋放"
        - "只要有變數名稱就永久保存"
      answer: 0
      explain: "判斷能不能回收，要看是否仍能從存活的物件找到它。"
    interview:
      question: "批次工作每跑一輪記憶體就上升，你會先找什麼？"
      points:
        - "固定每批大小再量目前值"
        - "檢查跨批次持有資料的容器"
        - "清除參照後再對照"
      answer: "我會用小批次重現，記下處理前後的目前值。若每批都把內容塞進長期存在的清單，就改成處理完只留摘要，再用同一份輸入比較，不先把一次尖峰當成外洩。"
  - id: fd-systems-02-memory-peak
    prompt: "清空清單後峰值還很高，代表什麼？"
    answer: "峰值是開始追蹤以來的最高點，不代表目前配置仍一樣多。"
    mcq:
      options:
        - "清空必定失敗"
        - "代表目前仍占用同樣多記憶體"
        - "每個物件都還在使用"
        - "先前到過這個高度"
      answer: 3
      explain: "比較清空前後要看目前值；峰值是歷史紀錄。"
  - id: fd-systems-02-memory-scope
    prompt: "tracemalloc 的目前值量到什麼？"
    answer: "它反映追蹤範圍內仍配置的 Python 記憶體，不是整個行程的工作集。"
    mcq:
      options:
        - "整個行程向系統取得的記憶體"
        - "整台電腦可用記憶體"
        - "追蹤中尚存的配置"
        - "自開始追蹤以來的單一最高值"
      answer: 2
      explain: "工具的觀測範圍不同，不能直接拿數字相減當成外洩量。"
practice:
  - id: fd-systems-02-memory-lab
    title: "畫出一份配置對照筆記"
    kind: code
    minutes: 10
    steps:
      - "執行 memory.py，記錄各階段的目前值和峰值。"
      - "把每批 4 塊改成 2 塊再執行；保留兩輪輸出於 memory-notes.txt。"
    checks:
      - "清空前兩輪目前值都逐批上升，較小批次的增加量較小。"
      - "我能指出清空後下降的是哪一欄，而不要求回到 0。"
---

## 為什麼要學：已經處理完的資料去了哪裡？

把一批檔案的內容讀進來，只是為了算總長度；如果每處理完一份還把原文放進清單，下班前那份清單可能比結果本身大許多。要問的不是「電腦還有幾成空間」，而是「工作做完，哪個物件還替我留著哪些內容」。這個問題不用真的塞滿電腦就能研究。

## 核心概念：資料需要活多久？

記憶體（memory）是執行中放置資料的空間。變數可以持有指向物件的參照（reference），容器也可以持有參照。把剛建立的物件加入外層清單以後，即使下一輪換了新的區域變數，舊物件仍然可從清單找到。你看不見它的原始變數名稱，不表示它已離開記憶體。

磁碟上的檔案與這個生命週期不同。清空清單不會替你刪除當初讀取的檔案；反過來，把一個計數放在清單裡，也不會替你存檔。行程結束時，作業系統收回行程占用的記憶體。若要下次啟動還能取回結果，就要明確寫入可持續保存的地方。

## 範例：同一份工作量，比目前值和峰值

在練習區的 `systems` 資料夾建立 `memory.py`，用 `py memory.py` 執行；macOS 或 Linux 用 `python3 memory.py`。這個實驗只保留約數百 KiB 的內容，不必開大型檔案。

```python
import tracemalloc

tracemalloc.start()
kept = []
def sample(label):
    current, peak = tracemalloc.get_traced_memory()
    print(label, current // 1024, peak // 1024)

sample("start")
for batch in range(3):
    for _ in range(4):
        kept.append(bytearray(32 * 1024))
    sample(batch + 1)
kept.clear()
sample("clear")
```

第一欄是階段，後兩欄是換算成 KiB 的目前配置與歷史峰值。每批新增 4 個各約 32 KiB 的區塊，預測目前值約增加 128 KiB 再看輸出。不是剛好增加這個數字也很合理，因為清單、物件本身與輸出也有成本。清空以後應觀察方向，而不是要求它精準回到起點。

### 把觀察變成設計決定

如果今天只想保留每批的總位元組數，下批計算不需要上批原文，你就可以累加長度而不把區塊放進外層清單。可是如果使用者要回頭查看上批的原文，直接丟掉就改變了功能。應該先約定保留最近幾批，或把值得保留的結果存檔，再討論省下多少。能否縮短生命週期取決於下一位使用者需要什麼，而不是容器夠不夠大。

試著把同樣長度的文字標籤留在清單裡，讓大區塊不再被它參照。若標籤數目仍增長、目前值卻小了很多，說明要檢查的是「每筆留下多少」，不只是哪一個清單最長。

## 常見錯誤

工作管理員看到的是整個行程，不是只看這些受追蹤的配置。直譯器可能留下可重用的空間，所以清空後那一列不一定立即縮小。也別把峰值沒有下降當成清空失敗：峰值回答「曾經多高」，拿它判斷「現在多少」本來就不會得到答案。

## 小結

同樣大小的輸入重複幾批，觀察目前值是否一直長，然後找出誰保留參照。先寫下要保留的是原文還是摘要，才能在不破壞用途的前提下縮短資料的生命週期。
