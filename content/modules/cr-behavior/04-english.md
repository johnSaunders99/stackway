---
id: cr-behavior-04-english
module: cr-behavior
order: 4
title: 英文事件交班
subtitle: 用英文交代一次服務異常
status: ready
minutes: 35
level: 4
prereqs:
  - cr-behavior-03-unknown
objectives:
  - 以短句說出影響、證據與下一步
  - 把不清楚的術語改成可觀察的條件
tags:
  - behavior
  - english
resources:
  - title: Google Technical Writing：一句話表達一個重點
    url: https://developers.google.com/tech-writing/one/short-sentences
    kind: course
    lang: en
    minutes: 7
    required: false
    checked: '2026-11-20'
  - title: Google SRE Workbook：事件中的角色與溝通
    url: https://sre.google/workbook/incident-response/
    kind: book
    lang: en
    minutes: 8
    required: false
    checked: '2026-11-20'
concepts:
  - id: cr-behavior-04-english-impact
    prompt: 英文事件交班最先該說哪一項？
    answer: 指出使用者失去的功能及仍可用的部分。
    mcq:
      options:
        - 通知延遲，但報名仍可用
        - 系統看起來很奇怪
        - 某項元件可能有錯
        - 請大家繼續加油
      answer: 0
      explain: 影響範圍比模糊感受、推測根因或情緒更能支持下一班決策。
  - id: cr-behavior-04-english-threshold
    prompt: 門檻是 at least 15 minutes，觀察值剛好 15 時該怎麼辦？
    answer: 條件已成立，依約保持提醒暫停並通知支援角色。
    mcq:
      options:
        - 等到超過 15 才處理
        - 執行約定的通報
        - 宣布全部恢復
        - 把 15 解讀成待送件數
      answer: 1
      explain: at least 包含等於；量的是最老等待年齡，不是長度。
  - id: cr-behavior-04-english-evidence
    prompt: 交班稿要如何區分已做的動作與尚未驗證的原因？
    answer: 用明確時態記已做項目，未確定根因直接標示未知，不把推論當作事實。
    interview:
      question: Please hand off a delayed message queue in plain English.
      points:
        - 說明延遲的是通知而非報名
        - 給帶時間與單位的觀察
        - 指定接手角色、檢查時間與門檻
      answer: Registration still works, but messages are late. At 08:10 UTC, the oldest was 12 minutes old. At 08:20 UTC, the on-call engineer will check again. If the oldest has waited at least 15 minutes, keep reminders paused and notify support.
  - id: cr-behavior-04-english-readback
    prompt: 回讀交班稿時，接班者最好重述哪件事？
    answer: 下一個檢查的角色、時間、信號及觸發後的行動，不只重複事件標題。
    mcq:
      question: 接班者回覆哪一句，最能確認理解的是下一步而非事件標題？
      options:
        - I understand that messages are delayed.
        - At 08:20 UTC I will check the oldest wait and notify support if it reaches 15 minutes or more.
        - The team has a queue.
        - Thanks, I will look later.
      answer: 1
      explain: 重述檢查時間、最老等待與含等號的通報門檻，才知道接班者能行動；只說收到或稍後再看仍不夠具體。
practice:
  - id: cr-behavior-04-english-p1
    title: 寫一份可回讀的英文交班
    kind: explain
    minutes: 15
    steps:
      - 保存 handoff.txt，把含糊的「狀況很糟」改成一個時間點、一個功能與兩個觀察值。
      - 用英文念出交班，再扮演接班者：分別遇到 14 與 15 分鐘時，寫下你的下一步。
    checks:
      - 英文明確區分已暫停的提醒、仍可報名與尚未確認的根因。
      - 接班者在 15 分鐘時會通報，不會把未達門檻解讀為已恢復。
---

## 交班不考華麗英文，考下一班能不能接
交班 (handoff) 發生在接手者沒有你整晚的上下文時。「The service is unstable. Please monitor it.」字都不難，卻沒說哪個功能、多少人受影響、看哪個信號、何時決定。先在中文草稿中回答這些問題，再翻成幾句短英文。即使不使用專有名詞，接班的人也應該知道現在能告訴使用者什麼。

## 用影響、證據、下一步排順序
第一句先交代誰失去哪種能力，再指出仍可用的部分。第二句給出帶時間和單位的觀察；用 UTC 或完整時區，避免跨班別的時間各說各話。第三句說明已做或尚未做的動作。最後安排一個角色、一個檢查時間、一個如果條件不符就採取的行動。若不知道根因，用「We have not confirmed the cause.」就夠了，不必用很多可能性把未知藏起來。

### 一份可以直接交給下一班的示範
以下是虛構演練，不是服務公告。保留數字與時區，但不要放姓名、真實帳號或內部連結。將英文段落存成練習目錄 `C:\dev\stackway-lab\behavior` 下的 `handoff.txt`。

```text
Confirmation messages are delayed. Registration still works.
At 08:10 UTC, 40 messages were waiting. The oldest was 12 minutes old.
We paused optional reminders. We have not confirmed the cause.
At 08:20 UTC, the on-call engineer will check the oldest message.
If it is at least 15 minutes old, keep reminders paused and notify support.
```

第一句把「通知慢」和「不能報名」分開。第二句中，40 是件數，12 是最老待送時間，兩者不可互換。第三句用了過去式說明已暫停的是選用提醒，不是所有確認通知；後兩句用未來式交付責任，而非暗示已經驗完。門檻是「至少」，所以剛好 15 分鐘也要通知。若新資料只有 14，不能直接說完全恢復；你只能說這次未達通報門檻，仍需照約定繼續觀察。

在同一目錄用 PowerShell 執行 `Select-String -Path .\handoff.txt -Pattern 'UTC|If it'`，快速找出有時間與條件的行。macOS／Linux 在同一目錄可用 `grep -E 'UTC|If it' handoff.txt`。這不是英文文法檢查器：如果你寫了時間卻沒說誰看什麼，指令仍會找到那一行。接著嘗試回讀 (read-back)，假裝自己是接班者，不看中文解釋，用一句話重述第一個該做的動作，再與原稿核對。

### 把模糊的代名詞換回具體對象
試著把範例中的「最老待送通知」改成「它」。若前一句恰好同時說了佇列和提醒，接手者就可能誤會要看的是最早暫停的提醒。英文不是寫得越短越好；需要時寧可重複名詞，也不要省掉判斷對象。回讀時故意問「時間到了由誰看哪一筆」，讓另一個人不用猜就能答出來。若你是在對支援團隊交代，則另補一句可以對外說的現況，不必讓支援人員自行翻譯內部術語。

## 常見錯誤
「Everything is back to normal」常是過度宣告：能報名不代表等待中的通知已補送。把「high latency」改成具體功能與等待多久，但不要把單次最慢當成所有人的體驗。也不要說「Check later」把時間和責任都留白。若條件觸發，接班者應能照稿行動，而不用反問你所謂嚴重是什麼意思。

## 小結
寫給下一班的英文越短，越需要每個名詞指向一個真實對象。先讓對方知道影響，再給足以驗證的證據，最後交出有負責角色與時間的條件句。
