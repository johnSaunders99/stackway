import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Routes, Route } from 'react-router-dom';
import { expect, it, vi, afterEach, beforeEach } from 'vitest';
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(message => {
    throw Error(String(message));
  });
});
afterEach(() => vi.restoreAllMocks());
import {assembleCatalog} from '../src/content/catalog';
import { inspect } from '../tools/content.mjs';
import { Context, type Workspace } from '../src/ui/context';
import type { Catalog } from '../src/content/types';
import { defaults, type Data } from '../src/lib/model';
import { MapPage, ModulePage } from '../src/features/map/Map';
import Today from '../src/features/today/Today';
import { ReviewPage, Session } from '../src/features/review/Review';
import Onboarding from '../src/features/onboarding/Onboarding';
import {CloseDay} from '../src/features/today/CloseDay';
import {newCard} from '../src/lib/scheduler';
import Projects from '../src/features/projects/Projects';
import Stats from '../src/features/stats/Stats';
import Bank from '../src/features/bank/Bank';
import Help from '../src/features/help/Help';
import SettingsPage from '../src/features/settings/Settings';
const r = inspect('fixtures/content'),
  cat: Catalog = {
    ...r.index,
    concepts: r.deck.concepts,
    questions: r.deck.interviews.flatMap(s => s.questions.map(q => ({
      ...q,
      track: s.track
    })))
  },
  data: Data = {
    settings: [defaults],
    lessonProgress: [],
    cards: [],
    reviewLogs: [],
    dayPlans: [],
    dayStats: [],
    practice: [],
    projects: [],
    interviewAnswers: []
  },
  w: Workspace = {
    cat,
    data,
    s: defaults,
    day: '2026-11-20',
    done: new Set(),
    notify: () => {}
  };
function render(el: ReactElement, path = '/', route = '*', work = w) {
  return renderToStaticMarkup(<StaticRouter location={path}>
      <Context.Provider value={work}>
        <Routes>
          <Route path={route} element={el} />
        </Routes>
      </Context.Provider>
    </StaticRouter>);
}
it.each([[<Onboarding />, '兩個都要'], [<Today />, '檔案與資料夾：替筆記找個家'], [<MapPage />, '搜尋學習地圖'], [<ReviewPage />, '完成第一堂課後'], [<Session />, '回到今天'], [<Projects />, '一頁工程筆記'], [<Stats />, '最近 26 週'], [<Bank />, '練這題'], [<SettingsPage />, '匯入備份']] as const)('renders the relevant next action in a fixture page', (el, text) => {
  expect(render(el)).toContain(text);
});
it('close panel shows all six totals, all five cards, explicit fallback coverage and tomorrow-specific scope wording',()=>{
 const lesson=cat.lessons.find(l=>l.id==='fd-demo-01-files')!,cards=cat.concepts.filter(c=>c.lessonId===lesson.id).map(c=>newCard(c,w.day,new Date(w.day+'T17:00:00'),3,.9))
 const html=render(<CloseDay closing choice={{format:'interview',scope:'yesterday',tracks:defaults.tracks}} setChoice={()=>{}} setBudget={()=>{}} save={async()=>{}} close={()=>{}}/>,'/today','*',{...w,data:{...data,cards}})
 expect(html.match(/role="radio"/g)).toHaveLength(5)
 for(const label of ['專注分鐘','完成堂數','複習次數','記得率','連續天數','今天學到的知識點','只複習今天學的','3 個中 1 個有面試題，其餘用閃卡','收工，明天見'])expect(html).toContain(label)
 expect(html).not.toContain('<select')
});
it('module view exposes stubs but does not offer to schedule them', () => {
  const html = render(<ModulePage />, '/module/ai-demo', '/module/:id');
  expect(html.match(/內容準備中/g)).toHaveLength(2);
  expect(html.match(/>加入今天</g)).toHaveLength(1);
});
it('opens a standalone question in interview mode without requiring a card', () => {
  const q = cat.questions[0],
    html = render(<Session />, '/session?q=' + q.id);
  expect(html).toContain(q.question);
  expect(html).toContain('對照參考答案');
});
it('composer and saved plan both offer useful alternatives when no ready lesson remains',()=>{
 const done=new Set(cat.lessons.filter(l=>l.status==='ready').map(l=>l.id))
 const plan={day:w.day,budget:defaults.budget,focus:defaults.focus,format:defaults.format,scope:defaults.scope,tracks:defaults.tracks,items:[],reviewIds:[],reviewDone:[],createdAt:'2026-11-20T10:00:00Z'}
 for(const dayPlans of [[],[plan]]){const html=render(<Today/>,'/today','*',{...w,done,data:{...data,dayPlans}})
 for(const t of ['下一批課程還在準備中','提前複習','作品里程碑','到題庫練一題'])expect(html).toContain(t)}
});
it('composer takes yesterday’s format and amount, not the global defaults', () => {
  const p = {
    day: '2026-11-19',
    items: [],
    reviewDone: [],
    reviewIds: [],
    createdAt: '2026-11-19T10:00:00Z',
    closedAt: '2026-11-19T11:00:00Z',
    focus: defaults.focus,
    budget: defaults.budget,
    scope: defaults.scope,
    format: defaults.format,
    tracks: defaults.tracks,
    nextReview: {
      day: w.day,
      format: 'interview' as const,
      scope: 'yesterday' as const,
      tracks: defaults.tracks,
      budget: {
        mode: 'count' as const,
        value: 1
      }
    }
  };
  const html = render(<Today />, '/today', '*', {
    ...w,
    data: {
      ...data,
      dayPlans: [p]
    }
  });
  expect(html).toContain('今天的複習 · 面試問答 ／ 只複習昨天學的');
  expect(html).toContain('＋ 新課 1 堂');
});

it('paginates after filtering and clamps stale page numbers',()=>{
  const questions=Array.from({length:119},(_,i)=>({...cat.questions[0],id:'q'+i,question:'問題-'+i,track:i<65?'foundations' as const:'fullstack' as const,module:i<65?'fd-demo':'fs-demo'}))
  const work={...w,cat:{...cat,questions}}
  const page=(q:string)=>render(<Bank/>,'/bank'+q,'*',work)
  expect(page('').match(/>練這題| 練這題/g)).toHaveLength(50)
  const last=page('?page=3');expect(last.match(/ 練這題/g)).toHaveLength(19);expect(last).toContain('問題-118');expect(last).not.toContain('問題-99<')
  const filtered=page('?track=foundations&module=fd-demo&page=999')
  expect(filtered.match(/ 練這題/g)).toHaveLength(15);expect(filtered).toContain('問題-64');expect(filtered).not.toContain('問題-65<')
  expect(page('?track=fullstack&module=fd-demo')).toContain('沒有符合條件')
});
it('shows the project shelf, individual workspaces and direct milestone links',()=>{
  const base=cat.projects[0], projects=Array.from({length:8},(_,i)=>({...base,id:'p'+i,title:'作品 '+i}))
  const work={...w,cat:{...cat,projects}}, page=(q:string)=>render(<Projects/>,'/projects'+q,'*',work)
  expect(page('').match(/class="panel stripe project-tile/g)).toHaveLength(8);expect(page('')).not.toContain('<textarea')
  for(const q of ['?project=p5','?milestone=p5:'+base.milestones[0].id]){
    const detail=page(q);expect(detail).toContain('id="milestone-p5:'+base.milestones[0].id+'"');expect(detail).toContain('作品筆記');expect(detail).not.toContain('id="milestone-p0:');
  }
});

it('renders a compiled, offline guide and links to it from Settings',()=>{
  const html=render(<Help/>)
  expect(html).toContain('<h1>使用說明</h1>');expect(html).toContain('啟動棧道.cmd');expect(html).toContain('C:\\dev\\stackway-lab')
  for(const text of ['閃卡回想','選擇題','面試問答','動手練習','混合','取代並還原','Ctrl+Z'])expect(html).toContain(text)
  expect(render(<SettingsPage/>)).toContain('href="/help"')
});

it('renders path-ordered module groups and links each concept question back to its module',()=>{
  const fs=r.index.modules.find(m=>m.id==='fs-demo')
  const other={...fs,id:'fs-z',title:'下一個模組',order:0}
  const testCat=assembleCatalog({...r.index,tracks:[...r.index.tracks].reverse(),modules:[other,...r.index.modules],path:{recommended:['cr-demo','fs-demo','fs-z','fd-demo','ai-demo']}},r.deck)
  const work={...w,cat:testCat}, bank=render(<Bank/>,'/bank','*',work)
  expect([...bank.matchAll(/<optgroup label="([^"]+)"/g)].map(m=>m[1])).toEqual(['基礎','全端','AI Infra','求職'])
  const group=bank.match(/<optgroup label="全端">([\s\S]*?)<\/optgroup>/)![1]
  expect([...group.matchAll(/option value="([^"]+)"/g)].map(m=>m[1])).toEqual(['fs-demo','fs-z'])
  const links=[...bank.matchAll(/class="bank-module" href="\/module\/([^"]+)">([^<]+)<\/a>/g)]
  expect(links.map(m=>m[1])).toEqual(testCat.questions.filter(q=>q.conceptId).map(q=>q.module))
  for(const [,id,title] of links)expect(title).toBe(testCat.modules.find(m=>m.id===id)!.title)
  expect(bank).toContain('<small>獨立題組</small>'+r.deck.interviews[0].title)
  const stats=render(<Stats/>,'/stats','*',work)
  expect([...stats.matchAll(/href="\/module\/([^"]+)"/g)].map(m=>m[1])).toEqual(testCat.path.recommended)
  const review=render(<ReviewPage/>,'/review','*',work)
  expect([...review.matchAll(/class="panel stripe tone-([^"]+)"/g)].map(m=>m[1])).toEqual(['foundations','fullstack','aiinfra','career'])
})
it('keeps suggestions short and finds exact and partial tags outside the most frequent suggestions',()=>{
  const qs=Array.from({length:120},(_,i)=>({...cat.questions[0],id:'q'+i,tags:['共同','常用-'+(i%20),i<118?'tag-'+i:'罕見-'+i]}))
  const work={...w,cat:{...cat,questions:qs}}, page=(suffix:string)=>render(<Bank/>,'/bank'+suffix,'*',work)
  const list=(html:string)=>html.match(/<datalist[^>]*>([\s\S]*?)<\/datalist>/)![1]
  const initial=list(page(''));expect(initial.match(/<option/g)).toHaveLength(12);expect(initial.startsWith('<option value="共同"')).toBe(true)
  expect(initial).not.toContain('罕見-118')
  const partial=page('?tagQuery='+encodeURIComponent('罕見'))
  expect([...partial.matchAll(/href="\/session\?q=([^"]+)"/g)].map(m=>m[1])).toEqual(['q118','q119'])
  expect(list(partial)).toContain('罕見-118')
  const exact=page('?tag='+encodeURIComponent('罕見-119'))
  expect(exact).toContain('/session?q=q119"');expect(exact).not.toContain('/session?q=q118"')
})
it('repeats the standalone set heading when a filtered page starts midway through its set',()=>{
  const qs=Array.from({length:54},(_,i)=>({...cat.questions[0],id:'q'+i,set:{id:'set',title:'情境面談'}}))
  const page=render(<Bank/>,'/bank?page=2','*',{...w,cat:{...cat,questions:qs}})
  expect(page.match(/<h2 class="bank-set">/g)).toHaveLength(1)
  expect(page).toContain('<small>獨立題組</small>情境面談</h2>')
  expect(page.match(/ 練這題/g)).toHaveLength(4)
})

it('labels earlier scheduled prerequisites when adding, but uses real completion on the saved checklist',()=>{
  const [first,second,third]=cat.lessons.filter(l=>l.module==='fd-demo').sort((a,b)=>a.order-b.order)
  const plan={day:w.day,budget:defaults.budget,focus:defaults.focus,format:defaults.format,scope:defaults.scope,tracks:defaults.tracks,items:[first.id],reviewIds:[],reviewDone:[],createdAt:w.day+'T08:00:00Z'}
  const work={...w,data:{...data,dayPlans:[plan]}}
  expect(render(<ModulePage/>,'/module/fd-demo','/module/:id',work)).toContain('今天稍早已排入：'+first.title)
  const saved={...work,data:{...data,dayPlans:[{...plan,items:[first.id,second.id,third.id]}]}}
  const page=(done:Set<string>)=>render(<Today/>,'/today','*',{...saved,done})
  const outOfOrder=page(new Set([second.id]))
  expect(outOfOrder).toContain('建議先完成：'+first.title)
  expect(outOfOrder).not.toContain('建議先完成：'+second.title)
  for(const lesson of [first,second,third])expect(outOfOrder).toContain('href="/lesson/'+lesson.id+'"')
  expect(page(new Set([first.id,second.id]))).not.toContain('建議先完成：')
})
