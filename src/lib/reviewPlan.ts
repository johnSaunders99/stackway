import type {Catalog} from '../content/types'
import type {Choice,Data,Format,Scope,Settings,StoredCard} from './model'
import {estimate,present,queue} from './scheduler'
import {shiftDay} from './clock'
export const formatOrder:Format[]=['flashcard','quiz','interview','hands-on','mixed']
export const scopeOrder:Scope[]=['due','yesterday','tracks','weak']
export function startOfDay(day:string,hour:number){const date=new Date(day+'T00:00:00');date.setHours(hour,0,0,0);return date}
export function tomorrowCutoff(today:string,hour:number){return new Date(+startOfDay(shiftDay(today,2),hour)-1)}
export function usedSlots(data:Pick<Data,'dayStats'|'reviewLogs'>,day:string){
  return Math.max(0,(data.dayStats.find(s=>s.day===day)?.reviewsDone??0)-data.reviewLogs.filter(r=>r.day===day&&r.relearning).length)
}
export function reviewPreview(cards:StoredCard[],choice:Choice,cat:Catalog,at:Date,day:string,s:Settings,used:number){
  const scopes=Object.fromEntries(scopeOrder.map(scope=>[scope,queue(cards,{...choice,scope},at,s,false,used).ids])) as Record<Scope,string[]>
  const ids=scopes[choice.scope],formats=formatOrder.map(format=>{
    const items=present(ids,{...choice,format},cat,day,s.weights),covered=items.filter(i=>!i.fallback).reduce((n,i)=>n+i.ids.length,0)
    return {format,count:ids.length,minutes:Math.ceil(estimate(items)),covered,disabled:format==='hands-on'&&!covered}
  })
  return {scopes,formats}
}
