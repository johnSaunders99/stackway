---
id: fd-algo-08-sorting
module: fd-algo
order: 8
title: 排序演算法
subtitle: 插入一張卡與合併 2 疊卡差在哪
status: ready
minutes: 35
level: 2
prereqs:
  - fd-algo-07-recursion
objectives:
  - 用 5 個數追蹤插入排序與合併排序
  - 比較最壞時間、額外空間與穩定性
tags:
  - algo
  - sorting
resources:
  - title: 'Runestone：插入排序'
    url: 'https://runestone.academy/ns/books/published/pythonds3/SortSearch/TheInsertionSort.html'
    kind: book
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
    note: '追蹤把一張卡插進有序前段。'
  - title: 'Runestone：合併排序'
    url: 'https://runestone.academy/ns/books/published/pythonds3/SortSearch/TheMergeSort.html'
    kind: book
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
    note: '對照切半與使用兩個索引的合併過程。'
concepts:
  - id: fd-algo-sorting-prefix
    prompt: '插入排序在每輪開始時，哪一段已經有序？'
    answer: '目前要插入位置之前的前段已經有序，這輪只把新卡放入該段。'
    mcq:
      question: '反向排好的資料做插入排序，主要成本是什麼？'
      options:
        - '每輪只和左鄰交換一次'
        - '每張可能向前穿過整個有序段'
        - '每輪把兩個有序片段合併'
        - '每張用二分定位就不必搬移'
      answer: 1
      explain: '反序讓前段幾乎都得右移，累計為平方時間。'
  - id: fd-algo-sorting-merge
    prompt: '合併兩段有序資料時，為何只需比兩個表頭？'
    answer: '每一側未使用資料中的最小值就在該側表頭，較小的表頭可直接交出。'
    mcq:
      question: '某側資料已全部用完，另一側剩下的元素要怎麼辦？'
      options:
        - '重新排序兩邊'
        - '捨棄所有剩餘'
        - '依原順序接到輸出'
        - '全部移到輸出最前面'
      answer: 2
      explain: '剩餘部分早已排好，且不小於已選出的末尾。'
  - id: fd-algo-sorting-stable
    prompt: '穩定排序保留的是哪一種次序？'
    answer: '排序鍵相等時，資料原本的相對先後會保留。'
    interview:
      question: '怎麼驗證排序沒把同優先工作的先後換掉？'
      points:
        - '同鍵附不同識別'
        - '實作只比較排序鍵'
        - '驗證相同鍵的識別順序'
      answer: '我會故意讓同鍵識別不是字母順序，用結果驗證原先先到的仍在前。插入時只移嚴格較大者；合併時相等先取左邊，才能保留原本的相對位置。'
practice:
  - id: fd-algo-sorting-lab
    title: '用五張卡證明穩定性'
    kind: code
    minutes: 12
    steps:
      - '執行 sort_cards.py，手繪一次插入與最後一次合併。'
      - '將兩張鍵為 1 的識別依原位置改成 Z 和 B，別更改比較式。'
      - '在檔尾保存正常版與合併等值改取右側的結果差異，再恢復正常版。'
    checks:
      - '正常版輸出鍵為 1、1、2、3、4，同鍵順序是 Z、B。'
      - '反例中數字仍有序，但兩種排序的完整結果不再相同。'
---
## 為什麼要學
5 張卡要按優先數字由小到大排，兩張同分的卡應該維持先來後到。只看最後一排數字，很難知道兩張同分卡有沒有偷偷換位。因此每張卡除了排序鍵 (sort key)，還要寫一個識別字母。這堂用同 5 張卡看兩種做法如何抵達同一答案，並找出資料快排好或完全倒序時，工作量為何不同。

## 核心概念
插入排序 (insertion sort) 把左邊視為已經排好的一疊，抽起下一張，把比它大的牌逐一往右挪，再放進空位。原本就順時，每張只需和左鄰比一比；倒序時，每張都得穿過整個前段，最壞時間平方。除了手上那張與幾個索引，這份原地版本只需常數額外空間。卡片還沒放好前，保持「手上那張」不被右移寫入蓋掉很重要。

合併排序 (merge sort) 先把資料切成兩半，各自排好，再從兩個有序片段的開頭挑較小者。剩 1 張或 0 張便已排序，是遞迴的基底。每一層合併的總工作是線性的，切半的層數約是以 2 為底的對數，所以最壞時間是 `O(n log n)`。本例用切片與新串列，尖峰額外空間是線性，不是原地做完。

## 範例：只比數字，字母用來作證
先看比較的是哪個鍵，再追蹤交換或搬移。只核對最後一串數字，解釋不了中途為什麼能保持順序。把下面的範例存成 `C:\dev\stackway-lab\algorithms` 裡的 `sort_cards.py`。

在該目錄執行：Windows PowerShell 用 `py sort_cards.py`；macOS／Linux 用 `python3 sort_cards.py`。

```python
def insertion(a):
    for end in range(1, len(a)):
        card = a[end]
        i = end
        while i > 0 and a[i - 1][0] > card[0]:
            a[i] = a[i - 1]
            i -= 1
        a[i] = card
        print("insert", a[:end + 1])

def merge_sort(a):
    if len(a) < 2:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    i = j = 0
    out = []
    while i < len(left) and j < len(right):
        if left[i][0] <= right[j][0]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    print("merge", out)
    return out

cards = [(3, "A"), (1, "B"), (2, "C"), (1, "D"), (4, "E")]
copy = cards.copy()
insertion(copy)
print("same", copy == merge_sort(cards))
```

看插入的第二張卡：一比 3 小，所以 3 右移，前 2 張變成一、3。等到後來的一進來時，走到先來的一便停止，因為只挪嚴格大於手中值的卡。合併時等值則取左側，因為左片段在原序列中更早。這兩個判斷符號雖然不同，守住的是同一個承諾：相等排序鍵的相對先後不變，稱為穩定性 (stability)。

讀最後一層合併，左邊是B 與 A，右邊依序是 D、C、E；2 個一相遇先交出 B，再輪到 D。兩邊不必每次重新找最小值，因為各自的表頭已經是該側剩餘最小。輸出其中一張後只推進該側索引，另一側的候選仍然有效。追蹤列印是為了展示步驟，比較成本時不計這些展示用的切片與輸出。

## 常見錯誤
直接比較整組元組會順便比較字母，看似穩定其實是偷偷加了第二排序鍵。若改成等值總取右側，最後數字仍然漂亮，但先後順序可能顛倒。還要區分原地與回傳新結果：本例插入版本改動傳入的副本，合併版本使用回傳值，不能印它們的回傳值就假設兩者做的是同樣的事。

## 小結
短而接近有序的資料，插入法常只需少量移動；想保證最壞仍維持對數層數的合併，就要準備暫存空間。說明選擇時，同時交代輸入形狀、空間限制與同鍵順序是否重要，而不是只背兩個時間公式。
