---
id: fs-market-stack-04-vue
module: fs-market-stack
order: 4
title: Vue 元件與事件
subtitle: 把清單卡片換成 Vue 元件
status: ready
minutes: 35
level: 3
prereqs:
  - fs-market-stack-03-verify
objectives:
  - 將同一份資料映射為 props 與事件
  - 比較輸入狀態由誰擁有，不背框架對照表
tags:
  - market-stack
  - vue
resources:
  - title: Vue：元件的屬性與事件
    url: https://zh-hk.vuejs.org/guide/essentials/component-basics.html
    kind: doc
    lang: zh-Hant
    minutes: 10
    required: false
    checked: '2026-11-20'
  - title: Vue 官方單檔元件演練場
    url: https://play.vuejs.org/
    kind: interactive
    lang: en
    minutes: 6
    required: false
    checked: '2026-11-20'
concepts:
  - id: fs-market-stack-04-vue-owner
    prompt: 清單同時只能選一張，選取編號最適合放在哪裡？
    answer: 放在共同父層，子卡由輸入推得是否被選取。
    mcq:
      options:
        - 清單共同父層
        - 每張卡各自保存布林值
        - 只存在按鈕樣式
        - 由標題文字推測
      answer: 0
      explain: 各卡互不知情，分散保存會產生多個互斥狀態同時為真。
    interview:
      question: 從 React 換成 Vue，你怎麼驗證互動沒變？
      points:
        - 比較狀態所有權而非語法
        - 追事件與 props 的往返
        - 以重排及型別案例驗收
      answer: 我會先畫出誰擁有選取編號。子卡點擊只送數字 id，父層更新後再給每張卡是否選取。我會連點兩張再反轉清單，確認只有同一筆編號保持選取，不是原位置留下顏色。
  - id: fs-market-stack-04-vue-payload
    prompt: 子卡送出 pick 時，最穩定的內容是什麼？
    answer: 送筆記的數字編號，不送目前排序中的位置。
    mcq:
      options:
        - 列索引
        - 筆記 id
        - 按鈕畫面文字
        - 整張清單的長度
      answer: 1
      explain: 順序與文字可能變動，穩定編號才代表同一筆資料。
  - id: fs-market-stack-04-vue-direction
    prompt: 為什麼子元件不應直接修改傳入的筆記來切換選取？
    answer: 資料所有權在父層；用事件描述意圖，由父層統一更新後再傳入。
  - id: fs-market-stack-04-vue-key
    prompt: 反轉清單後，要以什麼辨認原本被選取的卡？
    answer: 穩定的筆記編號；反轉只換顯示位置，不改資料身分。
    mcq:
      question: 若標題相同的兩張卡互換位置，哪個選取依據仍能分辨它們？
      options:
        - 按鈕文字
        - 目前索引
        - 標題排序
        - 各筆唯一且不變的 id
      answer: 3
      explain: 標題和文字可能重複，位置會改變；穩定編號才不依附呈現順序。
practice:
  - id: fs-market-stack-04-vue-p1
    title: 留下元件與重排前後的證據
    kind: build
    minutes: 15
    steps:
      - 在演練場建立兩檔並保留本機副本，先點 7 再點 8，再反轉清單。
      - 將畫面或觀察記入 vue-notes.md；暫把事件內容轉成字串，對照型別不一致的現象後還原。
    checks:
      - 正常時只剩 8 顯示已選取，反轉後它移到第一個位置。
      - 能指出哪一行送事件、哪一行改變父層值，以及改成字串後為何沒有卡片被標記。
---

## 點了筆記卡，究竟是誰的選取狀態改了？
假設後端照契約回數字編號和標題，現在只把顯示清單的元件從 React 換成 Vue。使用者不在意兩邊怎麼宣告元件，只在意點選後哪一張卡變成選取，以及把清單重排後選取有沒有跑到別張。移植要保留的是資料與互動，不是把原本的每行語法硬找一個長得相像的替代品。

## 父層擁有答案，子層只描述一次操作
屬性 (props) 是父層給子元件的輸入，例如筆記與它目前是否被選取。事件 (event) 是子元件對外說「使用者剛剛挑了這個編號」，不是命令父層一定如何儲存。這裡同時只能有一張被選取，所以讓父層保存唯一的選取編號；清單根據這個值計算每張卡的狀態，再從父層往下送。這和 React 中由父層持有狀態並提供回呼的設計相近，但不要在兩個框架裡都新增一份無法對齊的本地選取值。

## 範例：在 2 個檔案之間追一次點擊
用官方 Vue 單檔元件演練場 (SFC Playground) 開一份新練習，新增 `NoteCard.vue`，貼入下段。檔案也存一份在 `C:\dev\stackway-lab\vue-notes` 供交接；本例不需要讓線上演練場連你的本機後端。`defineProps` 宣告可讀的資料，`defineEmits` 宣告會送出的事件名；兩者可直接用在這種 script setup 區段中。

```vue
<script setup>
const props = defineProps({ note: Object, selected: Boolean })
const emit = defineEmits(['pick'])
</script>
<template>
  <button :aria-pressed="props.selected" @click="emit('pick', props.note.id)">
    {{ props.note.title }} · {{ props.selected ? '已選取' : '選取' }}
  </button>
</template>
```

同一份演練的 `App.vue` 放入下段。`ref` 是可追蹤的狀態容器；在程式裡用 `.value` 更新，在模板直接讀取即可。`:` 將後面的值當運算式傳入，`@` 表示監聽事件，`:key` 讓 Vue 用穩定編號而非畫面位置辨認每張卡。

```vue
<script setup>
import { ref } from 'vue'
import NoteCard from './NoteCard.vue'
const notes = ref([{id: 7, title: 'Index'}, {id: 8, title: 'Draft'}])
const selected = ref(null)
function pick(id) { selected.value = id }
</script>
<template>
  <NoteCard v-for="note in notes" :key="note.id" :note="note"
    :selected="selected === note.id" @pick="pick" />
  <button @click="notes.reverse()">反轉清單</button>
  <p>目前編號：{{ selected ?? '尚未選取' }}</p>
</template>
```

點第二張卡，再按反轉。編號 8 仍被選取，只是換到第一個位置。這直接驗了兩件事：事件傳的是資料的身分，不是列的位置；畫面輸入應由父層的值推得，而不是每張卡各自記住「我曾被點過」。如果直接點兩張卻留下兩個已選取標記，不必先查樣式，先找畫面是否從兩份狀態讀資料。

再試一次鍵盤操作：用定位鍵移到卡片按鈕，以空白鍵觸發，再看目前編號與選取文字。這裡使用原生按鈕而非可點擊的普通區塊，所以不必另外寫一套不同的鍵盤選取邏輯；顏色不是唯一的狀態提示。

## 常見錯誤
把選取的編號轉成字串，再與後端的數字做嚴格相等比較，父層明明收到事件，畫面卻沒有任何卡被選中。也不要直接改傳入的筆記物件來偷渡更新：即使巢狀資料技術上能被動到，也繞過了父層的決定。若有草稿輸入，先約定誰保存草稿、何時提交，不必為所有暫時狀態都提升到最外層。

## 小結
從按鈕一路指回唯一資料來源：子層送出哪個事件、父層保存哪個值、哪個屬性把結果傳回畫面。能用這三步解釋重排後的選取，就掌握了移植的核心。
