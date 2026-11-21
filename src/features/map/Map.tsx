import { useEffect,useMemo,useRef,useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown,LocateFixed,LockKeyhole,Search } from 'lucide-react';
import { useWork } from '../../ui/context';
import { Empty, Pill, Projection, Title } from '../../ui/common';
import {catalogIndex,curriculumTitle,searchModules} from '../../content/catalog';
import {usedSlots} from '../../lib/reviewPlan';
import { plannedBefore, planPrerequisites, preferenceFor, moduleSatisfied,available } from '../../lib/planner';
import type { Lesson, TrackId } from '../../content/types';
import { now } from '../../lib/clock';
import { queue } from '../../lib/scheduler';
import { editPlan, putPlan } from '../../db';
export function Ring({
  n,
  total
}: {
  n: number;
  total: number;
}) {
  const p = total ? n / total : 0;
  return <svg className="ring" viewBox="0 0 44 44" aria-label={n + ' / ' + total}>
      <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx="22" cy="22" r="18" pathLength="100" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={p * 100 + ' 100'} transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" fill="currentColor" fontSize="11">{Math.round(p * 100)}%</text>
    </svg>;
}
const foldKey='stackway.map.folded.v1'
function readFolded():number[]{try{const v:unknown=JSON.parse(localStorage.getItem(foldKey)??'[]');return Array.isArray(v)?v.filter(i=>Number.isInteger(i)&&i>=0&&i<=4):[]}catch{return []}}
export function MapPage(){
 const {cat,done,data,s,day}=useWork(),[track,setTrack]=useState<TrackId|'all'>('all'),[text,setText]=useState(''),[query,setQuery]=useState(''),[searchFold,setSearchFold]=useState<{query:string;stages:number[]}>({query:'',stages:[]}),[folded,setFolded]=useState(readFolded),[jump,setJump]=useState(0),jumped=useRef(0)
 useEffect(()=>{const id=setTimeout(()=>setQuery(text.trim()),120);return ()=>clearTimeout(id)},[text])
 const rows=useMemo(()=>searchModules(cat,track,query),[cat,track,query])
 const current=useMemo(()=>{const p=data.dayPlans.find(p=>p.day===day&&!p.closedAt),id=p?.items.find(id=>!done.has(id)&&cat.lessons.some(l=>l.id===id&&l.status==='ready'))
   return cat.lessons.find(l=>l.id===id)?.module??available(cat,done,s.focus,s.ratio)[0]?.module
 },[data.dayPlans,day,done,cat,s.focus,s.ratio])
 function fold(v:number[]){setFolded(v);try{localStorage.setItem(foldKey,JSON.stringify(v))}catch{/* Storage can be unavailable in private browsing. */}}
 function go(){const m=cat.modules.find(m=>m.id===current);if(!m)return
   if(track!=='all'&&track!==m.track)setTrack('all')
   if(text.trim()!==query||!rows.some(row=>row.m.id===current)){setText('');setQuery('')}
   setSearchFold({query,stages:[]});if(folded.includes(m.stage))fold(folded.filter(i=>i!==m.stage));setJump(n=>n+1)
 }
 useEffect(()=>{if(jump===jumped.current||!current)return;const node=document.getElementById('module-'+current);if(!node)return;jumped.current=jump;node.scrollIntoView({block:'center'});node.querySelector('a')?.focus({preventScroll:true})},[jump,rows,folded,current])
 return <><Title k="課程索引　 /　路線總覽" title="學習地圖" sub="從共同基礎出發，沿著模組走向你的目標。"/><Projection/>
 <div className="toolbar map-filter"><div className="chips"><button aria-pressed={track==='all'} onClick={()=>setTrack('all')}>全部</button>{catalogIndex(cat).tracks.map(t=><button key={t.id} aria-pressed={track===t.id} onClick={()=>setTrack(t.id)}>{t.short}</button>)}</div>
 <label className="search"><Search size={16}/><input id="map-search" placeholder="搜尋課名、目標或知識點" aria-label="搜尋學習地圖" value={text} onChange={e=>setText(e.target.value)}/><kbd>/</kbd></label>{current&&<button onClick={go}><LocateFixed size={15}/>跳到目前位置</button>}</div>
 {['起步','基礎','核心','進階','求職'].map((stage,i)=>{const band=rows.filter(row=>row.m.stage===i);if(!band.length)return null
 const visibleFolds=query?(searchFold.query===query?searchFold.stages:[]):folded,collapsed=visibleFolds.includes(i)
 const toggle=()=>{const stages=collapsed?visibleFolds.filter(v=>v!==i):[...visibleFolds,i];if(query)setSearchFold({query,stages});else fold(stages)}
 return <section className="stage" key={i}><h2><button className="stage-toggle" aria-expanded={!collapsed} aria-controls={'band-'+i} onClick={toggle}><span className="index">0{i}</span>{stage}<small>{band.length} 個模組</small><ChevronDown size={16}/></button></h2>
 <div id={'band-'+i} hidden={collapsed}>{!collapsed&&<div className="module-grid">{band.map(({m,rows:ls,hits})=>{
 const missing=catalogIndex(cat).ordered.filter(p=>m.prereqs.includes(p.id)&&!moduleSatisfied(p.id,cat,done)).map(p=>p.title),pending=ls.filter(r=>r.lesson.status!=='ready').length
 return <article id={'module-'+m.id} key={m.id} className={'panel stripe module-card tone-'+m.track+(current===m.id?' current-module':'')}>
 <div className="between"><Pill track={m.track}/>{current===m.id&&<span className="position-tag"><LocateFixed size={13}/>目前位置</span>}</div>
 <div className="module-main"><div><h3><Link to={'/module/'+m.id}>{m.title}</Link></h3><p className="module-subtitle" title={m.subtitle??m.summary}>{m.subtitle??m.summary}</p></div><Ring n={ls.filter(r=>r.lesson.status==='ready'&&done.has(r.lesson.id)).length} total={ls.length}/></div>
 <div className="between"><small>{ls.length} 堂 · {m.hours} 小時{pending>0&&<> · 另有 {pending} 堂內容準備中</>}</small>{missing.length>0&&<span className="lock-tip" tabIndex={0} aria-label={'先修：'+missing.join('、')}><LockKeyhole size={15}/><span role="tooltip">建議先完成：{missing.join('、')}</span></span>}</div>
 {hits.length>0&&<ul className="map-results">{hits.map(l=><li key={l.id}>{l.status==='ready'?<Link to={'/lesson/'+l.id}>{l.title}</Link>:l.title+' · 內容準備中'}{l.subtitle&&<small>{l.subtitle}</small>}</li>)}</ul>}</article>
 })}</div>}</div></section>})}
 {!rows.length&&<div className="empty">找不到符合的模組。<button onClick={()=>{setText('');setQuery('');setTrack('all')}}>清除篩選</button></div>}</>
}
export function ModulePage() {
  const {
      id
    } = useParams(),
    {
      cat,
      done,
      data,
      s,
      day,
      notify
    } = useWork(),
    m = cat.modules.find(x => x.id === id);
  if (!m) return <Empty>找不到這個模組。</Empty>;
  const p = data.dayPlans.find(x => x.day === day);
  const appendDone = plannedBefore(done,p?.items ?? []);
  const titles = (ids: string[]) => ids.map(id=>curriculumTitle(cat,id)).join('、');
  async function add(l: Lesson, missing: string[]) {
    if (missing.length && !confirm('建議先完成：' + titles(missing) + '。仍要加入今天？')) return;
    if (p) await editPlan(day, x => ({
      ...x,
      items: [...new Set([...x.items, l.id])]
    }));else {
      const c = preferenceFor(data.dayPlans, s, day) ?? s,
        reviewIds = queue(data.cards, c, now(), s, false, usedSlots(data,day)).ids;
      await putPlan({
        day,
        createdAt: now().toISOString(),
        format: c.format,
        scope: c.scope,
        tracks: c.tracks,
        focus: s.focus,
        budget: ('budget' in c ? c.budget : undefined) ?? s.budget,
        items: [l.id],
        reviewIds,
        reviewDone: []
      });
    }
    notify('已加入今天的清單。');
  }
  return <>
      <Link to="/map">← 學習地圖</Link>
      <Title k={cat.tracks.find(t => t.id === m.track)!.title + '　 /　模組'} title={m.title} sub={m.subtitle??m.summary} />
      <div className="panel">
        {m.subtitle&&<p>{m.summary}</p>}
        <h2>學完能做到</h2>
        <ul>{m.outcomes.map(o => <li key={o}>{o}</li>)}</ul>
        {m.prereqs.length > 0 && <p>先修模組：{catalogIndex(cat).ordered.filter(p=>m.prereqs.includes(p.id)).map(p => <Link key={p.id} to={'/module/' + p.id}>{p.title}　</Link>)}</p>}
      </div>
      <h2 className="sub-title">模組課程</h2>
      {(catalogIndex(cat).rows.get(m.id)??[]).map(({lesson:l}) => {
      const st = data.lessonProgress.find(p => p.lessonId === l.id)?.status,
        ready = l.status === 'ready',
        canAdd = ready && !done.has(l.id) && !p?.closedAt && !p?.items.includes(l.id),
        prerequisites = canAdd ? planPrerequisites(l,cat,done,appendDone) : {missing:[], scheduled:[]};
      return <div className={'panel lesson-row stripe tone-' + m.track} key={l.id}>
        <span className="index">{String(l.order).padStart(2, '0')}</span>
        <div>
          <b>{ready ? <Link to={'/lesson/' + l.id}>{l.title}</Link> : l.title}</b>
          {l.subtitle&&<small>{l.subtitle}</small>}
          {prerequisites.scheduled.length>0 && <small>今天稍早已排入：{titles(prerequisites.scheduled)}</small>}
          <small>{!ready ? '內容準備中' : st === 'done' ? '已完成' : st === 'skipped' ? '已跳過' : st === 'started' ? '進行中' : '未開始'} · {l.minutes} 分</small>
        </div>
        {ready && !done.has(l.id) && <button disabled={!!p?.closedAt || p?.items.includes(l.id)} onClick={() => add(l,prerequisites.missing)}>{p?.items.includes(l.id) ? '已加入' : p?.closedAt ? '今天已收工' : '加入今天'}</button>}
      </div>;
    })}
    </>;
}
