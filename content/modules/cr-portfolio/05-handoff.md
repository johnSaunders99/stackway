---
id: cr-portfolio-05-handoff
module: cr-portfolio
order: 5
title: 作品交接與重現
subtitle: 交給沒看過程式的人重跑
status: ready
minutes: 35
level: 4
prereqs:
  - cr-portfolio-04-walkthrough
objectives:
  - 從乾淨資料開始驗證說明
  - 根據卡住的步驟補上一段必要資訊
tags:
  - portfolio
  - handoff
resources:
  - title: "Diátaxis：引導讀者看見成果"
    url: https://diataxis.fr/tutorials/
    kind: article
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: "GitHub Docs：README 與相對路徑"
    url: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-portfolio-05-handoff-clean
    prompt: "乾淨目錄重跑能排除哪種假相？"
    answer: "能排除依賴原目錄的暫存與舊輸出，但不會清空系統層級的環境。"
    mcq:
      question: "新空目錄測試成功能證明什麼？"
      options:
        - "這組交付檔在目前工具環境可重跑"
        - "所有作業系統都能跑"
        - "不必裝 Python"
        - "所有系統套件都被隔離"
      answer: 0
      explain: "新目錄隔開的是檔案狀態，不是整台電腦的環境。"
    interview:
      question: "你怎麼確認下一位接手者不必找你救場？"
      points:
        - "只取清單列出的交付物"
        - "記第一個差異並改說明"
        - "限定已測環境"
      answer: "我在新建空目錄只放說明列出的檔案。看到缺檔提示後我補上附件位置和預期筆數，再從另一個空目錄重跑成功。目前只證明同一台機器，不是所有平台都驗過。"
  - id: cr-portfolio-05-handoff-checkpoint
    prompt: "交接失敗先記哪個現象？"
    answer: "第一個與說明預期不一致的步驟及實際輸出。"
    mcq:
      question: "讀者缺少 sample.txt，最有用的紀錄是？"
      options:
        - "只記作者在原目錄重跑成功"
        - "在哪步預期有檔案、實際得到何種缺檔提示"
        - "只記程式最後未印出預期筆數"
        - "只留下「重裝後再試」的建議"
      answer: 1
      explain: "第一個差異可定位說明缺口，不必從後續連鎖錯誤猜起。"
  - id: cr-portfolio-05-handoff-manifest
    prompt: "為何要列出明確的交付物？"
    answer: "只用這些檔案重跑，才知道是否偷偷依賴了工作目錄裡的其他資料。"
    mcq:
      question: "哪種交付方式最能抓出漏附輸入？"
      options:
        - "複製作者整個桌面"
        - "把前次結果當作輸入"
        - "在作者舊目錄執行一次"
        - "只複製說明列出的檔案到新目錄"
      answer: 3
      explain: "工作目錄或舊結果可能讓本來缺檔的流程看起來成功。"
practice:
  - id: cr-portfolio-05-handoff-p1
    title: "交出一份不需要口頭補充的交接包"
    kind: build
    minutes: 16
    steps:
      - "先做缺檔測試，再加入合成 sample.txt"
      - "建立 HANDOFF.md，寫交付檔名、指令、預期輸出及缺檔時的動作"
      - "只複製清單列出的檔案到新資料夾重跑並記錄"
    checks:
      - "缺檔和 0 筆待辦可以區分"
      - "交接目錄實際印出 open: 2"
      - "紀錄有修改前後與已測環境"
---

## 為什麼要學：你記得的設定不會一起交出去

有個工具照著 README 執行後印出 0 筆待辦。作者說「要先把範例檔放進去」，但這句話只存在作者的記憶裡。交接（handoff）不只是把作品傳走，而是下一個人不靠你的口頭補充，也能從已知的起點得到相同結果。真正值得測的對象是「交付物加上說明」，不是你用了一個月的工作目錄。

## 核心概念：乾淨不等於刪光

用新的空資料夾代表新讀者，不必清掉你的電腦。只放明列為交付物的檔案，確認沒有舊輸出、暫存或私人設定。讀者仍需要的工具及版本範圍要另行列出；換資料夾沒有換作業系統、直譯器或已安裝套件，所以通過本機交接測試時，不能把結果寫成「在全新機器測試通過」。

把步驟寫成能觀察的轉折：從哪裡開始，什麼動作會產生什麼，看到什麼才可以往下走。遇到失敗時，抄下第一個與預期不同的現象，而不是硬走到最後再說整個教學不能用。補一句必要資訊就能修正的問題，不必用一整頁疑難排解淹沒所有讀者。

## 範例：檔案明明在旁邊，為什麼找不到？

在 `C:\dev\stackway-lab` 新建 `handoff-clean`，先只存下面的 `count_open.py`。在這個資料夾用 `py count_open.py` 執行；macOS 或 Linux 用 `python3 count_open.py`。第一次缺少輸入，畫面應出現有檔名的提示，而不是一個貌似正確的 0。

```python
from pathlib import Path
source = Path(__file__).with_name("sample.txt")
if not source.exists():
    raise SystemExit("Missing sample.txt beside count_open.py")
states = source.read_text(encoding="utf-8-sig").splitlines()
print("open:", sum(state == "open" for state in states))
```

現在用編輯器在程式旁建立 `sample.txt`，存成 UTF-8，3 行依序為 open、done、open。再跑一次應顯示 `open: 2`。程式用自身的路徑找相鄰檔案，讀者不必猜資料來自哪個桌面目錄。要交付的是程式、合成範例與說明，不是連同整份私人目錄一起打包。試著只把這三份檔案複製到另一個新資料夾，再照說明走一次。

### 用卡住的位置改文件

想像讀者第一次看到缺檔提示，卻不知道檔案應該自行建立，還是漏拿了附件。把「準備資料」改成「確認 sample.txt 和 count_open.py 在同一層；範例已有 3 行，執行後應看到 2 筆未完成」。若你選擇讓讀者手動建立，則要一併寫出三行內容及編碼。兩種交付方式都行，但不要把第一種的附件和第二種的說明拼在一起。

## 常見錯誤

從原本工作目錄複製全部檔案，往往連同舊結果也帶過去，遮住了缺少的步驟。另一種錯誤是要求人先刪除整個設定目錄來「重設」，讓讀者承擔不必要的資料風險。改用未使用過的目錄名，保留失敗現場；重跑完成後在紀錄裡並列原本卡點、修改的句子和新結果，接手的人就知道改動確實對症。

## 小結

好的交接留下兩份證據：實際交出的檔案清單，以及有人從乾淨資料出發走過的紀錄。把通過的環境範圍和仍沒測的部分寫在旁邊，下次換人時就不用重新猜一次。
