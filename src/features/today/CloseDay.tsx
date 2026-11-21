import {useEffect,useId,useRef,useState} from 'react'
import {ArrowRight,Flag,X} from 'lucide-react'
import {useWork} from '../../ui/context'
import {ReviewPicker} from '../../ui/ReviewPicker'
import {Amount} from '../../ui/common'
import {accuracy,streaks} from '../../lib/metrics'
import type {Budget,Choice} from '../../lib/model'
export function DayTotals(){const {data,day}=useWork(),st=data.dayStats.find(r=>r.day===day),pct=accuracy(data.reviewLogs.filter(r=>r.day===day))
 const pairs=[['專注分鐘',Math.round(st?.activeMinutes??0)],['完成堂數',st?.lessonsDone??0],['複習次數',st?.reviewsDone??0],['記得率',pct===null?'—':pct+'%'],['連續天數',streaks(data.dayStats,day).current],['今天學到的知識點',data.cards.filter(c=>c.firstLearnedDay===day).length]]
 return <dl className="day-totals">{pairs.map(([label,v])=><div key={label}><dt>{label}</dt><dd>{v}</dd></div>)}</dl>
}
export function CloseDay({closing,choice,setChoice,budget,setBudget,save,close}:{closing:boolean;choice:Choice;setChoice:(v:Choice)=>void;budget?:Budget;setBudget:(v:Budget|undefined)=>void;save:()=>Promise<void>;close:()=>void}){
 const {s,notify}=useWork(),ref=useRef<HTMLDialogElement>(null),saving=useRef(false),[busy,setBusy]=useState(false),id=useId()
 useEffect(()=>{const d=ref.current!;d.showModal();d.querySelector<HTMLButtonElement>('[aria-checked=true]')?.focus({preventScroll:true});return ()=>d.close()},[])
 async function submit(){if(saving.current)return;saving.current=true;setBusy(true);try{await save()}catch{notify('沒能儲存安排，請再試一次。')}finally{saving.current=false;setBusy(false)}}
 return <dialog className="closing-sheet" ref={ref} aria-labelledby={id} onCancel={e=>{if(busy)e.preventDefault();else close()}}>
   <header className="closing-head"><div className="eyebrow"><Flag size={15}/> {closing?'收工手記':'明日手記'}</div><button className="ghost" aria-label="關閉" disabled={busy} onClick={close}><X size={19}/></button><h2 id={id}>明天怎麼複習？</h2><p>{closing?'今天走過的路，明天再走熟一點。':'先選好練習方式，明天打開就能開始。'}</p></header>
   <div className="closing-body"><DayTotals/><ReviewPicker tomorrow value={choice} onChange={setChoice} onEnter={submit}/>
   <div className="optional-amount"><label className="toggle"><input type="checkbox" checked={!!budget} onChange={e=>setBudget(e.target.checked?s.budget:undefined)}/> 明天也預先排好份量</label>{budget&&<Amount value={budget} onChange={setBudget}/>}</div></div>
   <footer className="closing-foot"><small>依明天整個學習日估算，開始前還能調整。<span className="closing-keys">方向鍵選方式 · Enter 儲存</span></small><button className="primary" disabled={busy} onClick={submit}>{closing?'收工，明天見':'儲存明天的安排'} <ArrowRight size={16}/></button></footer>
 </dialog>
}