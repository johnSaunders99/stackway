import type {ReviewItem} from './scheduler'
import type {Grade} from 'ts-fsrs'
// Derive the tail from committed history. Undo removes both the rating and its pending repeat.
export function repeatAfter(item:ReviewItem,grade:Grade|null,ratedIds:string[],bankQuestion=false):ReviewItem|undefined{
 if(grade!==1||item.relearning||(!ratedIds.length&&!bankQuestion))return
 return {...item,ids:ratedIds,relearning:true}
}
export function sessionQueue(initial:ReviewItem[],history:{repeat?:ReviewItem}[]){
 return [...initial,...history.flatMap(h=>h.repeat?[h.repeat]:[])]
}
