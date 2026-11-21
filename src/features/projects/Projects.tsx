import {catalogIndex} from '../../content/catalog';
import {useEffect} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { useWork } from '../../ui/context';
import { Empty, Pill, Title } from '../../ui/common';
import { db, mutate } from '../../db';
import type { Project } from '../../content/types';
import type { ProjectRecord } from '../../lib/model';
function progress(p:Project,r?:ProjectRecord) {
  const checks=p.milestones.flatMap(m=>m.checks.map((_,i)=>m.id+':'+i));
  const count=checks.filter(k=>r?.done.includes(k)).length;
  const status=count>0 && count===checks.length?'已完成':count||r?.notes||r?.repoUrl?'進行中':'未開始';
  return {count,total:checks.length,status};
}
function Card({
  p
}: {
  p: Project;
}) {
  const {
      data,
      cat,
      notify
    } = useWork(),
    blank = {
      projectId: p.id,
      notes: '',
      done: [],
      repoUrl: ''
    },
    r = data.projects.find(x => x.projectId === p.id) ?? blank,
    update = (f: (old: ProjectRecord) => ProjectRecord) => mutate(async () => db.projects.put(f((await db.projects.get(p.id)) ?? blank))),
    {count,total,status} = progress(p,r);
  return <article className={'panel stripe tone-' + p.track}>
      <div className="between">
        <Pill track={p.track} />
        <span className="status">{status}</span>
      </div>
      <h2>{p.title}</h2>
      <p>{p.summary}</p>
      <div className="inset">
        <b>這份作品證明什麼？</b>
        <p>{p.why}</p>
      </div>
      <p>建議先完成：{catalogIndex(cat).ordered.filter(m=>p.modules.includes(m.id)).map(m => <Link key={m.id} to={'/module/' + m.id}>{m.title}　</Link>)}</p>
      <div className="progress-track">
        <i style={{
        width: 100 * count / (total || 1) + '%'
      }} />
      </div>
      <small>完成 {count} / {total} 項 · 預計 {p.hours} 小時</small>
      {p.milestones.map((m, j) => <div className="milestone" key={m.id} id={'milestone-'+p.id+':'+m.id} tabIndex={-1}>
        <h3><Flag size={15} /> {j + 1}. {m.title}</h3>
        {m.checks.map((v, i) => {
        const key = m.id + ':' + i;
        return <label className="toggle" key={key}>
          <input type="checkbox" checked={r.done.includes(key)} onChange={() => update(old => ({
            ...old,
            done: old.done.includes(key) ? old.done.filter(x => x !== key) : [...old.done, key]
          }))} />
          {v}
        </label>;
      })}
      </div>)}
      <label className="field">程式碼儲存庫網址<input type="url" defaultValue={r.repoUrl} placeholder="貼上作品的網址" onBlur={e => {
        const url = e.target.value.trim();
        if (url && !/^https?:\/\//i.test(url)) {
          e.target.value = r.repoUrl;
          notify('請使用 http 或 https 網址。');
          return;
        }
        if (url !== r.repoUrl) void update(v => ({
          ...v,
          repoUrl: url
        }));
      }} /></label>
      <label className="field">作品筆記<textarea defaultValue={r.notes} placeholder="記下做過的選擇、遇到的問題…" onBlur={e => {
        const notes = e.target.value;
        if (notes !== r.notes) void update(v => ({
          ...v,
          notes
        }));
      }} /></label>
      <details>
        <summary>怎麼在面試中展示？</summary>
        <p>{p.showcase}</p>
        {p.stretch?.length && <p>延伸挑戰：{p.stretch.join('；')}</p>}
      </details>
    </article>;
}
export default function Projects() {
  const [params]=useSearchParams(),target=params.get('milestone');
  useEffect(()=>{if(!target)return;const el=document.getElementById('milestone-'+target);el?.scrollIntoView({block:'center'});el?.focus({preventScroll:true})},[target]);
  const {cat,data} = useWork();
  const selected=cat.projects.find(p=>p.id===(target?.split(':')[0]??params.get('project')));
  return <>
      <Title k="實作檔案　 /　作品紀錄" title="作品集" sub="從第一個里程碑開始，把會做的事留下證據。" />
      {selected ? <><Link className="project-back" to="/projects">← 所有作品</Link><Card key={selected.id} p={selected}/></> :
        <div className="project-grid">{cat.projects.map(p=>{
          const {count,total,status}=progress(p,data.projects.find(r=>r.projectId===p.id));
          return <Link className={'panel stripe project-tile tone-'+p.track} to={'/projects?project='+p.id} key={p.id}>
            <div className="between"><Pill track={p.track}/><span className="status">{status}</span></div>
            <h2>{p.title}</h2><p>{p.summary}</p>
            <div className="project-meta"><small>{p.milestones.length} 個里程碑 · 約 {p.hours} 小時</small>
              <div className="progress-track"><i style={{width:100*count/(total||1)+'%'}}/></div>
              <div className="between"><small>完成 {count} / {total} 項</small><b>開啟作品 →</b></div></div>
          </Link>
        })}</div>}
      {!cat.projects.length && <Empty>目前還沒有作品題目，先累積課程練習。</Empty>}
    </>;
}
