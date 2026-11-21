import {it,expect} from 'vitest'
import {inspect} from '../tools/content.mjs'
import {assembleCatalog,catalogIndex,searchModules} from '../src/content/catalog'
import {newCard,queue,present} from '../src/lib/scheduler'
import {shiftDay,studyDay} from '../src/lib/clock'
import {reviewPreview,startOfDay,tomorrowCutoff} from '../src/lib/reviewPlan'
import {repeatAfter,sessionQueue} from '../src/lib/relearning'
import {moduleSatisfied,moduleDone,available,buildDayPlan} from '../src/lib/planner'
import {defaults,type Choice} from '../src/lib/model'
const r=inspect('fixtures/content'),cat=assembleCatalog(r.index,r.deck)
const day='2026-11-20',after=shiftDay(day,1),s={...defaults,dayStartHour:7},ch:Choice={format:'interview',scope:'due',tracks:['foundations']}
const fd=cat.lessons.find(l=>l.id==='fd-demo-01-files')!,concepts=fd.concepts.map(id=>catalogIndex(cat).concepts.get(id)!),at=new Date(day+'T22:30:00')
it.each([1,3] as const)('first regular review lands exactly at next study-day start for initial grade %s',g=>{
 const c=newCard(concepts[0],day,at,g,.9,7),cut=startOfDay(after,7)
 expect(+c.card.due).toBe(+cut);expect(studyDay(c.card.due,7)).toBe(after)
 expect(queue([c],ch,new Date(+cut-1),s).ids).toEqual([]);expect(queue([c],{...ch,scope:'weak'},at,s).ids).toEqual([])
 expect(queue([c],ch,cut,s).ids).toEqual([c.conceptId])
})
it('a late-night completion still uses the configured calendar boundary',()=>{
 const early=new Date(after+'T06:59:59'),c=newCard(concepts[0],studyDay(early,7),early,3,.9,7)
 expect(+c.card.due-+early).toBe(1000)
})
it('tomorrow scopes use today as yesterday, tomorrow’s whole day, and a fresh cap',()=>{
 const cards=concepts.map(c=>newCard(c,day,at,3,.9,7)),end=tomorrowCutoff(day,7)
 cards[1].firstLearnedDay=shiftDay(day,-1);cards[2].card.due=new Date(+end+1)
 const p=reviewPreview(cards,ch,cat,end,after,s,0)
 expect(p.scopes.due).toHaveLength(2);expect(p.scopes.yesterday).toEqual([cards[0].conceptId]);expect(p.scopes.tracks).toHaveLength(2)
 expect(reviewPreview(cards,{...ch,tracks:[]},cat,end,after,s,0).scopes.tracks).toEqual([])
})
it('format estimates share the real fallback and grouped practice presentations',()=>{
 const cards=concepts.map(c=>newCard(c,day,at,3,.9,7)),p=reviewPreview(cards,ch,cat,tomorrowCutoff(day,7),after,s,0)
 expect(p.formats.find(f=>f.format==='interview')).toMatchObject({count:3,covered:1,minutes:4})
 expect(p.formats.find(f=>f.format==='hands-on')).toMatchObject({count:3,covered:3,minutes:5,disabled:false})
 const bare={...cat,lessons:cat.lessons.map(l=>({...l,practice:[]}))}
 expect(reviewPreview(cards,ch,bare,tomorrowCutoff(day,7),after,s,0).formats.find(f=>f.format==='hands-on')).toMatchObject({disabled:true,covered:0})
 expect(present(fd.concepts,ch,cat,day,s.weights).map(i=>i.fallback)).toEqual([undefined,'interview','interview'])
})
it('Again appends one admitted item after the original queue, never recursively; undo removes its pending tail',()=>{
 const initial=present(fd.concepts,{...ch,format:'flashcard'},cat,day,s.weights),repeat=repeatAfter(initial[0],1,initial[0].ids)!
 expect(sessionQueue(initial,[{repeat}])).toEqual([...initial,repeat]);expect(repeatAfter(repeat,1,repeat.ids)).toBeUndefined()
 expect(sessionQueue(initial,[])).toEqual(initial);expect(repeatAfter(initial[0],3,initial[0].ids)).toBeUndefined()
 expect(repeatAfter(initial[0],1,[])).toBeUndefined()
})
it('hands-on repeats only admitted concepts; a standalone interview may repeat without a card',()=>{
 const task=present(fd.concepts,{...ch,format:'hands-on'},cat,day,s.weights)[0]
 expect(repeatAfter(task,1,task.ids.slice(0,1))?.ids).toEqual(task.ids.slice(0,1))
 expect(repeatAfter({format:'interview',ids:[]},1,[],true)?.relearning).toBe(true)
})
it('all ready lessons satisfy a prerequisite; stubs remain in mastery and stub-only modules are locked',()=>{
 const ai=cat.lessons.filter(l=>l.module==='ai-demo'),ready=ai.filter(l=>l.status==='ready'),done=new Set(ready.map(l=>l.id))
 expect(moduleSatisfied('ai-demo',cat,done)).toBe(true);expect(moduleDone('ai-demo',cat,done)).toBe(false)
 expect(moduleSatisfied('ai-demo',{...cat,lessons:cat.lessons.filter(l=>l.module!=='ai-demo'||l.status!=='ready')},done)).toBe(false)
 const next={...cat,modules:cat.modules.map(m=>m.id==='cr-demo'?{...m,prereqs:['ai-demo']}:m)}
 expect(available(next,done,'recommended','1:1').some(l=>l.module==='cr-demo')).toBe(true)
})
it('when every ready lesson is finished the planner never substitutes a stub',()=>{
 const done=new Set(cat.lessons.filter(l=>l.status==='ready').map(l=>l.id))
 expect(buildDayPlan({catalog:cat,done,day,at:at.toISOString(),budget:s.budget,focus:s.focus,choice:ch,ratio:s.ratio,reviewIds:[],reviewMinutes:0,forceOne:true}).items).toEqual([])
})
it('map index searches module/lesson subtitles, prompts, objectives and case-insensitive tags without rebuilding',()=>{
 expect(catalogIndex(cat)).toBe(catalogIndex(cat))
 expect(searchModules(cat,'all','位置與程式')[0].m.id).toBe('fd-demo')
 expect(searchModules(cat,'all','關掉編輯器')[0].hits[0].id).toBe(fd.id)
 for(const q of [concepts[0].prompt,fd.objectives[0],fd.tags[0].toUpperCase()])expect(searchModules(cat,'all',q).some(r=>r.hits.some(l=>l.id===fd.id))).toBe(true)
 expect(searchModules(cat,'aiinfra','關掉編輯器')).toEqual([])
})

it('orders map searches and track views by path, followed by track and local order',()=>{
  const base=cat.modules[0], mods=[
    {...base,id:'a',track:'fullstack' as const,order:1},
    {...base,id:'b',track:'foundations' as const,order:7},
    {...base,id:'c',track:'fullstack' as const,order:10},
    {...base,id:'d',track:'foundations' as const,order:3},
    {...base,id:'e',track:'aiinfra' as const,order:0}]
  const sample={...cat,modules:mods,path:{recommended:['c','a']}}
  expect(searchModules(sample,'all','').map(r=>r.m.id)).toEqual(['c','a','d','b','e'])
  expect(searchModules(sample,'fullstack',base.title).map(r=>r.m.id)).toEqual(['c','a'])
})

it('assembles interviews by module path, lesson order and authored concept sequence, then by bank',()=>{
  const index=r.index, seed=index.lessons[0], base=r.deck.concepts[0]
  const lesson=(id:string,module:string,order:number,concepts:string[])=>({...seed,id,module,order,concepts})
  const lessons=[lesson('second','fs-demo',2,['q2']),lesson('unlisted','fd-demo',1,['q3']),lesson('first','fs-demo',1,['qb','skip','qa'])]
  const authored=lessons.flatMap(l=>l.concepts.map(id=>({...base,id,moduleId:l.module,lessonId:l.id,interview:id==='skip'?undefined:{question:id,answer:id,points:['甲','乙']}})))
  const deck={concepts:[...authored].reverse(),interviews:r.deck.interviews}
  const result=assembleCatalog({...index,path:{recommended:['fs-demo']},lessons},deck)
  expect(result.questions.filter(q=>q.conceptId).map(q=>q.id)).toEqual(['qb','qa','q2','q3'])
  const rest=result.questions.slice(4)
  expect(rest.map(q=>q.id)).toEqual(deck.interviews.flatMap(s=>s.questions.map(q=>q.id)))
  expect(rest.every(q=>q.set?.title===deck.interviews[0].title && q.set?.id===deck.interviews[0].id)).toBe(true)
})
