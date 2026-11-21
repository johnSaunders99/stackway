---
id: ai-iac-01-state
module: ai-iac
order: 1
title: 基礎設施狀態檔
subtitle: 設定、實際資源與狀態檔
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 解釋三者不同步時的後果
  - 指出狀態檔不能當公開範例的理由
tags:
  - iac
  - terraform
resources:
  - title: "HashiCorp：Terraform 狀態檔的用途"
    url: https://developer.hashicorp.com/terraform/language/state/purpose
    kind: doc
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: "HashiCorp：狀態與計畫中的敏感資料"
    url: https://developer.hashicorp.com/terraform/language/manage-sensitive-data
    kind: doc
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: ai-iac-01-state-binding
    prompt: "狀態檔中的綁定解決什麼問題？"
    answer: "把設定中的資源位址對到真正外部物件的識別碼。"
    mcq:
      question: "兩個外部物件容量相同，應依什麼選擇受管物件？"
      options:
        - "挑容量最接近期望者"
        - "挑標籤最好讀者"
        - "一律挑最近建立者"
        - "狀態裡的位址與識別碼對應"
      answer: 3
      explain: "屬性可以相同，綁定才標出管理對象。"
    interview:
      question: "畫面上已有同名資源，為何 Terraform 還想新增？"
      points:
        - "先查資源位址與綁定"
        - "區分狀態及現場"
        - "不手改狀態或立即執行"
      answer: "我會先確認環境與受保護的狀態裡是否有該位址的綁定。同名不代表受管理；可能是不同物件或綁定遺失。我先停下檢查計畫，不用手改代號或立刻建立。"
  - id: ai-iac-01-state-freshness
    prompt: "狀態裡的上次觀察為何可能不準？"
    answer: "現場可在兩次讀取之間改變，需重新觀察再規劃。"
    mcq:
      question: "只把設定從 2 改成 3 尚未執行，能確定什麼？"
      options:
        - "期望值已改，現場不一定改"
        - "現場已增加副本"
        - "狀態一定已更新"
        - "原資源已換新識別碼"
      answer: 0
      explain: "設定代表意圖，不會僅憑編輯檔案改變外部服務。"
  - id: ai-iac-01-state-privacy
    prompt: "為什麼標為敏感的狀態仍要保護？"
    answer: "顯示時遮蔽不代表儲存時移除；狀態可能仍包含敏感值或環境細節。"
    mcq:
      question: "對外展示綁定最適合用什麼？"
      options:
        - "自製的虛構位址與物件代號"
        - "整份正式狀態檔"
        - "只遮畫面上的密碼再附原狀態檔"
        - "節錄真實輸出但未檢查內部端點"
      answer: 0
      explain: "更名或遮住檔名不會移除內容，合成資料已足以表示關係。"
practice:
  - id: ai-iac-01-state-p1
    title: "替合成資源畫 3 欄對照"
    kind: code
    minutes: 14
    steps:
      - "執行 ledger.py，將位址、外部代號與三個數值記在 state-map.md"
      - "只改期望成 3，再跑並記下改變的欄位"
      - "寫一句狀態遺失時的風險與一種不能公開的資料"
    checks:
      - "沒有把 obj-29 當成目標"
      - "能區別重新觀察和修改現場"
      - "所有範例資料都是合成的"
---

## 為什麼要學：同名的機器，不一定是同一台

你在設定裡寫「需要一個搜尋服務」，雲端上已經有一個標籤叫搜尋的資源。工具能不能直接認定那就是你要管理的東西？不能只猜名字。基礎設施即程式碼（infrastructure as code，IaC）把希望維持的環境寫成設定；Terraform 還需要一份狀態檔（state），記住設定中的資源位址和外部系統識別碼的對應。否則下次要改容量時，連該改誰都不確定。

## 核心概念：桌上有 3 張不同的紙

設定（configuration）說明「我希望如何」；狀態記錄「哪個真實物件由我管理，上次觀察到什麼」；實際資源（remote object）則是外部系統此刻真的有什麼。把它們想成設計圖、登記簿和現場。去現場換了一台機器，不會讓設計圖自己改字；編輯設計圖，也不等於現場已施工。狀態可能過期，所以規劃變更通常會透過提供者（provider，也就是與外部服務溝通的元件）重新讀取受管理物件。

設計圖與現場的差異應該先看清楚，再決定是否變更。只改設定但未執行，現場可以仍維持原樣；有人手動改現場後，狀態裡的屬性則可能還是舊值。狀態若遺失了綁定，工具可能規劃另外建立一份，也可能遇到名稱衝突而失敗，並不保證它會自動認領同名物件。先釐清綁定，之後在[〈Terraform 變更計畫〉](#/lesson/ai-iac-02-plan)會細讀預定動作。

## 範例：不用雲端，也能看見三者不一致

在 `C:\dev\stackway-lab` 新建 `state-lab` 並存下 `ledger.py`，於該處執行 `py ledger.py`；macOS 或 Linux 用 `python3 ledger.py`。字典是合成登記簿，不是 Terraform 真正的狀態檔格式。

```python
wanted = {"search.main": 2}
ledger = {"search.main": ("obj-17", 2)}
observed = {"obj-17": 3, "obj-29": 2}
for address, target in wanted.items():
    remote_id, last = ledger[address]
    print(address, remote_id, "last", last, "now", observed[remote_id], "want", target)
```

輸出把位址、外部代號、上次、現在、期望排在一列。雖然另一個物件剛好也是 2，程式沒有選它，因為登記簿綁定的是 obj-17。試著只把期望改成 3：現場數字看來已符合需求，但上次觀察還是 2。這正是要分開「重新觀察」與「實際修改」的原因，前者可以修正認知，不需要憑空再變更一台機器。

### 為什麼不能上傳真的狀態檔當作品？

狀態可能含內部端點、資源關係，以及提供者回傳的敏感屬性。把輸出標為敏感通常只是避免在一般畫面顯示，不代表值一定不會存進狀態。團隊應限制誰能讀寫、使用受保護的儲存位置及備份。示範只需要展示位址如何連到物件，用自行編的代號和數字即可，不需下載現場狀態或把它貼到公開問題單。

## 常見錯誤

把狀態當作可以隨手改的設定檔，直接把副本數改漂亮，現場不會因此調整，反而可能破壞日後管理。另一個錯是以為備份狀態等於備份服務資料：登記簿能幫你找回綁定，不能救回資料庫裡的列。兩種備份要有不同的驗收方法。

## 小結

先指認是哪個物件，再比較想要、上次看到和現在看到的值。看懂這三欄，才有資格解釋下一份計畫，而不只是照著加減符號按下執行。
