import {catalogIndex} from '../content/catalog';
import {useEffect,useMemo,useRef} from 'react'
import {Check, Layers2,ListChecks,MessagesSquare,Shuffle,SquareTerminal} from 'lucide-react'
import {useWork} from './context'
import {formats,scopes} from './common'
import {now,shiftDay} from '../lib/clock'
import {reviewPreview,scopeOrder,tomorrowCutoff,usedSlots} from '../lib/reviewPlan'
import type {Choice,Format} from '../lib/model'

const icons={flashcard:Layers2,quiz:ListChecks,interview:MessagesSquare,'hands-on':SquareTerminal,mixed:Shuffle}
const descriptions={flashcard:'先在心裡回想，再翻開答案',quiz:'選出答案，用解說釐清觀念',interview:'看題目、寫下回答，再對照要點','hands-on':'重做課程任務，逐項檢查成果',mixed:'交替用回想、選擇與問答練習'}
const coverageNames:Partial<Record<Format,string>>={quiz:'選擇題',interview:'面試題','hands-on':'練習任務'}
export function ReviewPicker({value,onChange,tomorrow=false,onEnter}:{value:Choice;onChange:(v:Choice)=>void;tomorrow?:boolean;onEnter?:()=>void}){
  const {cat,data,s,day}=useWork(), group=useRef<HTMLDivElement>(null)
  const target=tomorrow?shiftDay(day,1):day, at=tomorrow?tomorrowCutoff(day,s.dayStartHour):now()
  const result=useMemo(()=>reviewPreview(data.cards,value,cat,at,target,s,tomorrow?0:usedSlots(data,day)),[data,value,cat,+at,target,s,day,tomorrow])
  const disabledHands=result.formats.find(f=>f.format==='hands-on')!.disabled
  const selected=value.format==='hands-on'&&disabledHands?'flashcard':value.format
  useEffect(()=>{if(selected!==value.format)onChange({...value,format:selected})},[selected,value,onChange])
  return <div className={'review-picker '+(tomorrow?'expanded':'compact')}>
    <div className="picker-label"><span>01</span><h3>怎麼複習？</h3></div>
    <div ref={group} className="format-grid" role="radiogroup" aria-label="複習方式" onKeyDown={e=>{
      if(e.key==='Enter'&&onEnter){e.preventDefault();onEnter();return}
      if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(e.key))return
      e.preventDefault()
      const buttons=Array.from(group.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')),i=buttons.indexOf(document.activeElement as HTMLButtonElement)
      const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length
      buttons[next].focus();buttons[next].click()
    }}>
      {result.formats.map(({format,count,covered,minutes,disabled})=>{const Icon=icons[format];return <button type="button" role="radio" aria-checked={selected===format} tabIndex={selected===format?0:-1} disabled={disabled} key={format} onClick={()=>onChange({...value,format})}>
        <span className="format-heading"><Icon size={19}/><strong>{formats[format]}</strong><i>{selected===format&&<Check size={12}/>}</i></span>
        <span className="format-description">{descriptions[format]}</span>
        <span className="format-estimate">{tomorrow?'明天約 ':'本輪 '}{count} 個知識點 · 約 {minutes} 分鐘</span>
        {disabled?<small>這個範圍沒有可做的練習任務</small>:covered<count&&<small>{count} 個中 {covered} 個有{coverageNames[format]}，其餘用閃卡</small>}
      </button>})}
    </div>
    <div className="picker-label"><span>02</span><h3>複習哪些知識點？</h3></div>
    <div className="scope-chips" role="group" aria-label="複習範圍">{scopeOrder.map(scope=><button type="button" key={scope} aria-pressed={scope===value.scope} onClick={()=>onChange({...value,scope})}>{tomorrow&&scope==='yesterday'?'只複習今天學的':scopes[scope]} <b>{result.scopes[scope].length}</b></button>)}</div>
    {value.scope==='tracks'&&<div className="track-choices" role="group" aria-label="要複習的路線">{catalogIndex(cat).tracks.map(t=><button type="button" key={t.id} aria-pressed={value.tracks.includes(t.id)} onClick={()=>onChange({...value,tracks:value.tracks.includes(t.id)?value.tracks.filter(x=>x!==t.id):[...value.tracks,t.id]})}>{t.short}</button>)}</div>}
  </div>
}