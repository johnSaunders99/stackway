import { Fragment, useId, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { History, MessageSquare } from 'lucide-react';
import { useWork } from '../../ui/context';
import { Pill, Select, Title } from '../../ui/common';
import {catalogIndex} from '../../content/catalog';

function TagFilter({tags,value,apply}:{tags:string[];value:string;apply:(tag:string,partial:boolean)=>void}) {
  const [text,edit]=useState(value), list=useId();
  const needle=text.trim().toLowerCase();
  const suggestions=tags.filter(tag=>tag.toLowerCase().includes(needle)).slice(0,12);
  return <form className="field bank-tags" onSubmit={e=>{
    e.preventDefault();
    const exact=tags.find(tag=>tag.toLowerCase()===needle);
    apply(exact??text.trim(),!exact);
  }}>
    <label htmlFor={list+'-input'}>搜尋標籤</label>
    <div><input id={list+'-input'} type="search" list={list} value={text} onChange={e=>edit(e.target.value)}
      placeholder="輸入全部或部分標籤" autoComplete="off" />
      <button type="submit">套用</button></div>
    <datalist id={list}>{suggestions.map(tag=><option key={tag} value={tag}/>)}</datalist>
  </form>;
}

export default function Bank() {
  const {cat,data} = useWork(), [params,setParams] = useSearchParams();
  const track=params.get('track')??'', module=params.get('module')??'', tag=params.get('tag')??'', practiced=params.get('practiced')??'all';
  const tagQuery=params.get('tagQuery')??'', index=catalogIndex(cat);
  function filter(key:string, value:string) {
    const next=new URLSearchParams(params);
    if (value) next.set(key,value); else next.delete(key);
    if(key==='track') next.delete('module');
    if(key==='tag'||key==='tagQuery') next.delete(key==='tag'?'tagQuery':'tag');
    next.delete('page');
    setParams(next,{replace:true});
  }
  const history=useMemo(()=>{
    const groups=new Map<string,typeof data.interviewAnswers>();
    for(const answer of data.interviewAnswers) {
      const group=groups.get(answer.questionId)??[];
      group.push(answer); groups.set(answer.questionId,group);
    }
    for(const group of groups.values()) group.sort((a,b)=>b.ts.localeCompare(a.ts));
    return groups;
  },[data.interviewAnswers]);
  const tags=useMemo(()=>{
    const counts=new Map<string,number>();
    for(const q of cat.questions) for(const tag of new Set(q.tags)) counts.set(tag,(counts.get(tag)??0)+1);
    return [...counts.keys()].sort((a,b)=>counts.get(b)!-counts.get(a)! || a.localeCompare(b,'zh-Hant'));
  },[cat]);
  const qs=useMemo(()=>cat.questions.filter(q=>(!track||q.track===track) && (!module||q.module===module) &&
    (!tag||q.tags?.includes(tag)) && (!tagQuery||q.tags?.some(t=>t.toLowerCase().includes(tagQuery.toLowerCase()))) && (practiced==='all'||history.has(q.id)===(practiced==='yes'))),[cat,track,module,tag,tagQuery,practiced,history]);
  const pages=Math.max(1,Math.ceil(qs.length/50)), page=Math.min(pages,Math.max(1,Math.floor(Number(params.get('page')))||1)), offset=(page-1)*50;
  function turn(n:number){const next=new URLSearchParams(params);next.set('page',String(n));setParams(next)}
  const pager=(label:string)=><nav className="bank-pager" aria-label={label}>
    <button disabled={page===1} onClick={()=>turn(page-1)}>上一頁</button>
    <span>第 {page} / {pages} 頁</span>
    <button disabled={page===pages} onClick={()=>turn(page+1)}>下一頁</button>
  </nav>;
  return <>
      <Title k="面試手冊　 /　問答索引" title="題庫" sub="用自己的話說清楚，再和上次的回答比較。" />
      <div className="panel fields">
        <Select label="路線" value={track} options={{
        '': '所有路線',
        ...Object.fromEntries(index.tracks.map(t => [t.id, t.short]))
      }} onChange={v=>filter('track',v)} />
        <label className="field">模組
          <select value={module} onChange={e=>filter('module',e.target.value)}>
            <option value="">所有模組</option>
            {index.tracks.filter(t=>!track||t.id===track).map(t=><optgroup key={t.id} label={t.short}>
              {index.ordered.filter(m=>m.track===t.id).map(m=><option key={m.id} value={m.id}>{m.title}</option>)}
            </optgroup>)}
          </select>
        </label>
        <TagFilter key={tag+'|'+tagQuery} tags={tags} value={tag||tagQuery} apply={(v,partial)=>filter(partial?'tagQuery':'tag',v)}/>
        <Select label="練習狀態" value={practiced} options={{
        all: '全部',
        yes: '已練過',
        no: '未練過'
      }} onChange={v=>filter('practiced',v)} />
      </div>
      <div className="bank-range"><p role="status">共 {qs.length} 道問題{qs.length>0 && <> · 顯示第 {offset+1}–{Math.min(offset+50,qs.length)} 題</>}</p>{pages>1&&pager('題庫上方分頁')}</div>
      {qs.slice(offset,offset+50).map((q,i) => {
      const answers = history.get(q.id)??[];
      const owner=q.module?index.moduleById.get(q.module):undefined;
      return <Fragment key={q.id}>
        {q.set && (i===0 || q.set.id!==qs[offset+i-1]?.set?.id) && <h2 className="bank-set"><small>獨立題組</small>{q.set.title}</h2>}
        <article className={'panel stripe tone-' + q.track}>
        <div className="between">
          <Pill track={q.track} />
          <small>{answers.length ? '已練過 ' + answers.length + ' 次' : '尚未練過'}</small>
        </div>
        {owner && <Link className="bank-module" to={'/module/'+owner.id}>{owner.title}</Link>}
        <h3>{q.question}</h3>
        <div className="tags">{q.tags?.map(t => <span key={t}>{t}</span>)}</div>
        <Link className="button" to={'/session?q=' + q.id}><MessageSquare size={15} /> 練這題</Link>
        {answers.length > 0 && <details>
          <summary><History size={14} /> 我的回答紀錄</summary>
          {answers.map(a => <blockquote key={a.id}>
            <small>{new Date(a.ts).toLocaleString('zh-TW')} · 涵蓋 {Math.round(a.coverage * 100)}% 要點</small>
            <p className="wrap">{a.text || '（這次沒有留下文字）'}</p>
          </blockquote>)}
        </details>}
      </article></Fragment>;
    })}
      {pages>1&&pager('題庫下方分頁')}
      {!qs.length && <div className="empty">
        <p>沒有符合條件的問題。</p>
        <button onClick={() => setParams({},{replace:true})}>清除篩選</button>
      </div>}
    </>;
}
