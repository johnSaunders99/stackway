---
id: ai-ml-06-autograd
module: ai-ml
order: 6
title: 自動微分與梯度
subtitle: 用一個純量驗算反向傳播
status: ready
minutes: 35
level: 3
prereqs:
  - ai-ml-05-nn
objectives:
  - 以 requires_grad 建立可微分運算，呼叫 backward
  - 與手算梯度比對並說明梯度何時累積
tags:
  - ml
  - autograd
resources:
  - title: "PyTorch：自動微分與梯度累積"
    url: "https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html"
    kind: "doc"
    lang: "en"
    minutes: 8
    required: false
    checked: "2026-11-20"
concepts:
  - id: "ai-ml-gradient-context"
    prompt: "梯度與損失分別描述什麼？"
    answer: "損失衡量目前誤差；梯度描述損失對參數的局部變化，不是更新後的參數。"
    mcq:
      question: "w 為 2，目標為 1，平方損失對 w 的導數是多少？"
      options:
        - "1"
        - "4"
        - "2"
        - "0"
      answer: 2
      explain: "導數為差值的 2 倍；1 是此時的損失，不是導數。"
    interview:
      question: "梯度剛好多 1 倍，你怎麼分辨公式錯還是累積？"
      points:
        - "固定一個可手算的參數與損失"
        - "每次重新做前向"
        - "對照清除與不清除梯度的結果"
      answer: "我先把題目縮成平方損失，手算單次應有的梯度。用同一參數重新前向兩次，比較清除與不清除的數值；如果只有後者加倍，問題在累積而不是導數。"
  - id: "ai-ml-backward-effect"
    prompt: "backward 會更新參數嗎？"
    answer: "不會，它沿圖計算梯度並累積到參數；更新是另一個步驟。"
    mcq:
      question: "只執行本例的 2 次 backward，w 的值是多少？"
      options:
        - "4"
        - "3"
        - "8"
        - "1"
      answer: 1
      explain: "4 與 8 是梯度觀察，不代表 w 已變動。"
  - id: "ai-ml-grad-accumulate"
    prompt: "為何重算相同損失再反向，grad 可能變成 2 倍？"
    answer: "兩張新圖都把梯度加到同一參數，沒有先清掉原本的貢獻。"
    mcq:
      question: "要只觀察第三次反向的貢獻，應先怎麼做？"
      options:
        - "將葉參數的 grad 清空"
        - "把參數改為 0"
        - "把目標改為 0"
        - "只清掉列印輸出"
      answer: 0
      explain: "清梯度不需要改模型值或標籤。"
practice:
  - id: "ai-ml-06-autograd-p1"
    title: "留下單一參數的梯度帳本"
    kind: "code"
    minutes: 11
    steps:
      - "先為 w 等於 3 畫出損失、當次導數和累積梯度三欄，再執行腳本"
      - "把起點改成 2 重算"
      - "將兩組手算與實際輸出存入 grad-note.md"
    checks:
      - "起點為 3 時梯度為 4、8、4"
      - "起點為 2 時為 2、4、2，參數值沒有自行改變"
---

## 為什麼要學：答錯了，要往哪個方向改？
模型能吐出一個分數，還不表示它知道怎麼進步。你需要知道「若把某個參數稍微調高，誤差會變大還是變小？」梯度（gradient）描述誤差對參數的局部變化方向與速率。先不用整個網路，今天只留一個可調的數字。小到能手算，你才能分辨是導數理解錯了，還是程式只是忘了清掉上一輪的紀錄。

## 核心概念：一次運算留下 2 種數
讓可調參數是 `w`，目標是 1，把損失（loss）定義為差值的平方。當參數等於 3，差值為 2，損失為 4。導數是「2 乘以差值」，此刻也剛好是 4，但 2 個 4 的意思不同：一個描述目前錯多遠，一個描述再移動時誤差會怎麼變。把參數換成 2，就得到損失 1、導數 2，差異更容易辨認。

自動微分（automatic differentiation）不是用猜的。讓浮點張量帶上 `requires_grad=True`，框架便為相關運算建立計算圖（computation graph），記下各步驟的依賴。針對純量損失呼叫 `backward()`，它沿著這些關係用連鎖律往回算，把結果加到葉節點參數的 `.grad`。它不會自動改寫參數；之後在[〈訓練迴圈與參數更新〉](#/lesson/ai-ml-04-train)才讓最佳化器根據梯度更新數字。

## 範例：同一個參數，2 張新的計算圖
在 `ml-notes` 將以下內容存為 `gradient.py`。PowerShell 使用 `.\.venv\Scripts\python.exe gradient.py`；bash 使用 `.venv/bin/python gradient.py`。先預測第二次會得到同樣的梯度還是 2 倍，再執行。
```python
import torch
w = torch.tensor(3.0, requires_grad=True)
for _ in range(2):
    loss = (w - 1).square()
    loss.backward()
    print("loss", loss.item(), "grad", w.grad.item(), "w", w.item())
w.grad = None
(w - 1).square().backward()
print("fresh", w.grad.item())
```
迴圈內每次重新計算損失，各自形成一張新圖，但它們的葉節點是同一個 `w`。因此 2 次損失都為 4、參數都為 3，梯度欄卻從 4 變成 8。設為 `None` 後再重算，第三次只留下本次貢獻 4。這是刻意展示累積機制；若每批都要獨立更新，就應在開始前清零，而不是把兩批當一批。

### 用斜坡想像導數的正負
如果現在的參數是 0，它位於目標的另一側；增加一點反而更靠近目標，導數應該是負的。放在圖上，橫軸寫參數，縱軸寫平方損失，最低點在參數為 1 的地方。最低點的損失是 0，斜率也為 0，但這是這個特殊例子，不是所有損失函式都能降到 0。這張小圖能幫你說明梯度是一個局部方向線索，並沒有交代一次應該移動多遠。 把這個負梯度例子和原先的正梯度放在同一張圖，就能直接從位置判讀方向。

## 常見錯誤
把 `loss.item()` 取出的 Python 數字拿去呼叫反向傳播，它不再帶有計算圖；本例只在列印時取值。另一個陷阱是對同一個舊損失連續反向兩次，期待得到這裡的示範效果。預設反向後會釋放所需的中間資訊，範例第二次是重新做前向運算，不是重用舊圖。

## 小結
一行輸出上最好分別寫出參數、損失、梯度。看見梯度不代表參數已更新，看見數值變大也不一定是模型變差，可能只是你讀到累加的梯度。
