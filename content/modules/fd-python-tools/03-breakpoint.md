---
id: fd-python-tools-03-breakpoint
module: fd-python-tools
order: 3
title: VS Code 中斷點除錯
subtitle: 讓程式停在數字第一次變錯的地方
status: ready
minutes: 30
level: 2
prereqs:
  - fd-python-tools-02-errors
objectives:
  - 在練習程式設中斷點並逐步執行
  - 查看區域變數，指出預測與實際分歧的那一步
tags:
  - python-tools
  - breakpoint
resources:
  - title: 'VS Code：Python 除錯'
    url: 'https://code.visualstudio.com/docs/python/debugging'
    kind: doc
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
    note: '讀啟動偵錯、設定中斷點與檢查變數。'
concepts:
  - id: fd-python-tools-breakpoint-before
    prompt: '中斷點停在一行時，怎麼解讀變數的值？'
    answer: '看到的是這行執行前的狀態；以逐程序執行觀察執行後的值。'
    mcq:
      question: '第二圈停在指定行，subtotal 顯示 5，這代表什麼？'
      options:
        - '本輪相加後的值'
        - '尚未執行本輪指定'
        - '函式已回傳'
        - '該值是第一圈執行前的快照'
      answer: 1
      explain: '停在下一個要執行的敘述，不表示已算完這一圈。'
  - id: fd-python-tools-breakpoint-step
    prompt: '想看當前更新後的第一個狀態，該用什麼操作？'
    answer: '用 F10 執行目前一行，再檢查區域變數。'
    mcq:
      question: '哪個操作適合只跨過目前的指定敘述？'
      options:
        - '繼續執行到下一個中斷點'
        - '執行到函式返回'
        - '逐程序執行'
        - '重新開始整段偵錯'
      answer: 2
      explain: 'F10 跨過目前一行；繼續可能多跑一圈，等函式返回則可能看不到這個區域變數。'
  - id: fd-python-tools-breakpoint-diverge
    prompt: '為什麼先找第一個與預測不符的值？'
    answer: '後面的錯可能只是傳遞結果；第一個分歧能縮小要檢查的操作範圍。'
    interview:
      question: '程式不報錯但加總不對，你如何交代定位過程？'
      points:
        - '準備小輸入與預測'
        - '比較第一個分歧的前後值'
        - '修正後重跑同一案例'
      answer: '我會用三筆算得出來的數字，在累計那行停住。第二輪明明拿到 6 且之前是 5，執行後卻只剩 6，這把範圍縮到指定而不是資料讀取；改成累加後再重播。'
practice:
  - id: fd-python-tools-breakpoint-lab
    title: '留下第二圈的偵錯筆記'
    kind: code
    minutes: 12
    steps:
      - '以 debug_total.py 設定紅點，觀察第二圈的輸入、更新前與更新後。'
      - '把這三個值及預期值寫到 debug-note.txt。'
      - '修成累加後重跑，把新的第二圈與結算值補進筆記。'
    checks:
      - '筆記可辨認錯誤版的 5、6、6 與正確的 11。'
      - '修正後最後印出 18。'
---
## 為什麼要學
報表說 3 段讀書時間共 7 分鐘，你心算卻得到 18。程式沒有出現例外，單看最後輸出不知道是哪一筆開始錯。與其到處插列印再一行一行刪掉，不如先寫出預測，讓程式停在累計更新的地方，逐筆找第一個與預測分歧的瞬間。這次要留下的不只是正確總數，還有能解釋錯誤的證據。

## 核心概念
中斷點 (breakpoint) 是請偵錯器 (debugger) 在指定位置暫停。紅點不是錯誤標記；當畫面停在某一行，表示下一步準備執行它，而不是已經做完。區域變數 (local variable) 是目前這次函式呼叫使用的值。左側變數區可看本輪的輸入和累計，呼叫堆疊則能切換目前檢視的函式位置，不必改動原始資料。

逐程序執行 (Step Over，F10) 會執行當前那行再停下；繼續 (Continue，F5) 會跑到下一個中斷點或結束。初學時先用這兩個就夠了。先在紙上依序寫下每次加總後預期是 5、11、18。沒有這條基準，即使畫面清楚列出變數，你也不容易看出是讀錯輸入、覆寫累計還是回傳錯了。

## 範例：第 2 圈就能看見差異
若還沒能用 VS Code 開啟資料夾，先回到[〈編輯器與儲存檔案〉](#/lesson/fd-computer-03-editor)；中斷點是在編輯器內暫停程式，不需要再裝一套 Python。

開啟 `C:\dev\stackway-lab\python-tools`，將範例另存為 `debug_total.py`。先挑一行設中斷點，分別記下執行該行前後的值。變數視窗顯示的是此刻，不是這一輪最終的答案。

在該目錄執行：Windows PowerShell 用 `py debug_total.py`；macOS／Linux 用 `python3 debug_total.py`。

```python
def total(rows):
    subtotal = 0
    for minutes in rows:
        subtotal = minutes
    return subtotal

print(total([5, 6, 7]))
```

在 VS Code 開啟上述練習資料夾與檔案。先確認 Microsoft 的 Python 與 Python Debugger 擴充功能可用，並從命令選擇區的 `Python: Select Interpreter` 選練習使用的 Python。點 `subtotal = minutes` 左側行號旁的空白處，看到紅點後按 F5；若首次詢問，選 Python Debugger 與 Python File，以目前檔案開始。全程不必新增偵錯設定檔。

第一次停下時，區域變數顯示分鐘為 5，累計仍是 0。按一次 F10，更新後是 5，與預測一致。按 F5 回到紅點；這次輸入是 6，執行前累計是 5。先別動鍵盤，預測它應該變成 11，再以 F10 觀察實際只剩 6。現在已找到第一個分歧，不必等到第三圈。停止偵錯，將指定改成累加，再從頭啟動並用同一筆資料回驗。

如果每一輪都停太慢，可以在紅點上設定條件，例如只在分鐘為 6 時停住。先用一般中斷點看懂一輪再加條件，否則條件寫錯而沒停住，容易被誤認為那一行從未執行。

## 常見錯誤
若紅點一直沒停，先確認不是用「執行而不偵錯」，也不是開著另一份同名檔案。把紅點放在註解或空白行通常不能對應到可執行敘述。改了程式後不要用舊的暫停畫面判讀新結果，先儲存並重啟這次執行。若函式外看不到 `subtotal`，切回對應的呼叫層，而不是急著把變數移成全域。

## 小結
最有用的偵錯筆記可以很短：第二筆更新前是 5，輸入是 6，更新後應 11 卻是 6。這三個值已足以定位覆寫的敘述。修正後重播相同輸入，才知道自己修到的是原因，而不只是偶然改對一個輸出。
