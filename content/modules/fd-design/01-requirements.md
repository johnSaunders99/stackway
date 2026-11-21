---
id: fd-design-01-requirements
module: fd-design
order: 1
title: 服務目標與需求
subtitle: 把需求變成可測量的承諾
status: ready
minutes: 30
level: 3
prereqs: []
objectives:
  - 把流量、延遲與可用性分開記錄
  - 標出仍待確認的需求假設
tags:
  - design
  - slo
resources:
  - title: "Google SRE：服務水準指標與目標"
    url: https://sre.google/sre-book/service-level-objectives/
    kind: book
    lang: en
    minutes: 9
    required: false
    checked: '2026-11-20'
concepts:
  - id: fd-design-01-requirements-indicator
    prompt: "指標與目標有何差別？"
    answer: "指標描述量到的結果，目標是事先約定的門檻及觀察窗口。"
    mcq:
      question: "哪一項是服務目標？"
      options:
        - "每 7 天至少 99% 有效查詢成功"
        - "今天實測成功 4/5"
        - "清單資料有 5 筆"
        - "預估尖峰每秒 20 次"
      answer: 0
      explain: "門檻與時間範圍構成目標；實測、資料量與環境假設不是目標。"
    interview:
      question: "主管要你把服務做快，你先問什麼？"
      points:
        - "辨認使用者任務和量測邊界"
        - "分開成功率與耗時"
        - "確認窗口及尖峰證據"
      answer: "我先問是要首頁出現，還是待辦清單真的顯示。我會定義有效查詢、成功比例和延遲門檻，並問尖峰是否量過，不拿 5 筆示範資料宣布整週達標。"
  - id: fd-design-01-requirements-boundary
    prompt: "入口延遲為何不能代替瀏覽器完成畫面時間？"
    answer: "量測起訖不同，入口未涵蓋用戶端傳輸與繪製的完整等待。"
    mcq:
      question: "若承諾清單已顯示，哪個量測終點合適？"
      options:
        - "使用者端清單實際呈現"
        - "資料庫開始查詢"
        - "入口收到請求"
        - "伺服器剛開始回應"
      answer: 0
      explain: "較早的事件都無法證明讀者已看見清單。"
  - id: fd-design-01-requirements-eligible
    prompt: "快速成功占比的分母怎麼選？"
    answer: "看目標是全部有效請求還是成功請求，兩者不能互換。"
    mcq:
      question: "5 筆有效、4 筆成功、3 筆又快又成功，成功中夠快占多少？"
      options:
        - "3/5"
        - "4/5"
        - "1/5"
        - "3/4"
      answer: 3
      explain: "條件是已成功，分母為 4；對所有有效請求才是 3/5。"
  - id: fd-design-01-requirements-assumption
    prompt: "如何處理訪談估出的尖峰流量？"
    answer: "記為待驗證假設，指定觀察窗口和入口計數方式。"
    mcq:
      question: "哪個數字不能直接當成正式量測？"
      options:
        - "逐筆紀錄的有效請求數"
        - "同窗口回應的錯誤數"
        - "入口記錄的完成時間"
        - "憑經驗猜的交班尖峰量"
      answer: 3
      explain: "估計可用來起步，但不能冒充實測。"
practice:
  - id: fd-design-01-requirements-p1
    title: "寫一張可驗收的服務需求卡"
    kind: build
    minutes: 14
    steps:
      - "執行範例並將兩種分母寫入 service-goal.md"
      - "新增一筆快速失敗，預測並核對結果"
      - "寫下目標窗口、觀察點和待驗證的流量假設"
    checks:
      - "加失敗後可用性變 4/6，成功中夠快仍 3/4"
      - "沒有用入口耗時冒充畫面完成"
      - "卡片有收集假設證據的方法"
---

## 為什麼要學：「很快」無法驗收

值班者說查交班單要很快。工程師把首頁做得不到半秒就出現，值班者卻還要等 10 秒才看到待辦事項。兩人談的不是同一段時間。系統設計的第一步不是挑機器，而是選一個使用者動作，把「做得好」翻譯成能觀察的條件。這樣當成本不足以同時滿足所有期待時，你才知道哪個承諾不能犧牲。

## 核心概念：分開記錄負載、指標與目標

流量（traffic）是系統收到多少工作，例如交接時段每秒 20 個查詢。延遲（latency）是一次工作要等多久；可用性（availability）可以定義為有效請求中成功取得清單的比例。流量是量測發生的條件，不是使用者成功與否。平均耗時可能掩蓋少數等很久的人，所以可以問「有多少比例的成功查詢在指定時間內完成」，不只問平均幾秒。

服務水準指標（SLI）是實際量出的數值；服務水準目標（SLO）是事先約定的判準。例：「過去 7 天，至少 99% 的有效查詢成功；在成功查詢中至少 95% 於 300 毫秒內完成。」還要定義有效查詢和觀察點，例如從入口收到格式正確、具讀取權限的請求，到傳回完整清單。若要承諾瀏覽器已畫出資料，則必須從使用者端測，不能把入口耗時拿來代替。

## 範例：很快失敗，算快還是算壞？

在 `C:\dev\stackway-lab` 新建 `slo-lab`，將以下存成 `measure.py`；在該處執行 `py measure.py`，macOS 或 Linux 用 `python3 measure.py`。5 筆都是有效請求，第一欄為是否成功，第二欄為從入口量得的毫秒數。

```python
requests = [(True, 120), (True, 180), (False, 10), (True, 300), (True, 600)]
success_ms = [ms for ok, ms in requests if ok]
fast = sum(ms <= 300 for ms in success_ms)
print("available:", len(success_ms), "/", len(requests))
print("fast among successes:", fast, "/", len(success_ms))
```

得到 4/5 成功、成功中 3/4 夠快。那筆 10 毫秒的失敗仍計入可用性的分母，不該被算作快速成功。也可以另設「又快又成功占全部有效請求的比例」，那就是 3/5；它回答不同的問題。先把問題及分母寫在數字旁邊，否則兩位工程師可能都算對了，卻在會議裡爭論不同的比例。

### 哪些數字仍然是假設？

交接尖峰每秒 20 次若來自訪談猜測，要標「待量」，並說明下一個交接時段要從入口計數。同樣地，範例的 5 筆只用來核對指標定義，沒有涵蓋整週，也不足以宣布正式達標。若觀察期完全沒有有效請求，2 個比例都沒有足夠資料，不要用 100% 填空。另列高峰、背景作業及允許延後的需求，之後在[〈流量與容量估算〉](#/lesson/fd-design-02-capacity)會細算。

## 常見錯誤

把伺服器程序還在執行當成服務可用；如果每次都回空白錯誤頁，使用者依然拿不到清單。另一個陷阱是事後才排除慢請求，讓數字好看。排除條件應在觀察之前定義，並保留失敗原因供診斷，而不是用排除規則替代改善工作。

## 小結

需求卡要能回答：誰做什麼、從哪量到哪、用哪個分母、多久看一次、未確認的假設如何驗證。有了這張卡，快慢才是能共同驗收的承諾。
