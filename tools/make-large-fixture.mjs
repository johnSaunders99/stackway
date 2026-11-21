import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const trackDefs=[['foundations','共同基礎','wood','fd'],['fullstack','全端開發','teal','fs'],['aiinfra','AI 基礎設施','violet','ai'],['career','求職實戰','vermilion','cr']]
export function makeLargeFixture(){
 fs.mkdirSync('.cache',{recursive:true});const root=fs.mkdtempSync(path.resolve('.cache/large-')),src=path.join(root,'curriculum')
 const write=(key,data)=>{const p=path.join(src,key);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof data==='string'?data:JSON.stringify(data))}
 const tracks=trackDefs.map(([id,title,color])=>({id,title,short:title,color,summary:'規模驗證專用資料'}))
 const mids=[],roles=['fullstack','aiinfra'];write('tracks.yaml',tracks)
 const text='請先寫下輸入的條件，列出預期與實際輸出之間的差異，再調整一個變數重新檢查，以便辨認真正影響結果的原因。'
 let lesson=0,cid=0
 for(let i=0;i<45;i++){
   const [track,title,,prefix]=trackDefs[i%4],id=prefix+'-load-'+i; mids.push(id)
   write('modules/'+id+'/module.yaml',{id,track,title:title+'練習 '+(i+1),subtitle:'從觀察結果推回原因',stage:i%5,order:i*10,summary:'驗證大量教材的地圖與查詢。',hours:5,roles,prereqs:i>=4?[mids[i-4]]:[],outcomes:['整理觀察','說明差異','驗證假設']})
   const size=i<20?9:8
   for(let j=0;j<size;j++,lesson++){
     const ready=j===0||(i<15&&j===1),lid=id+'-'+(j+1),concepts=[]
     // Unpublished lessons can already have draft knowledge points. Keep each lesson at 5–6.
     for(let k=0;k<(lesson<100?6:5);k++,cid++){concepts.push({id:'load-point-'+cid,prompt:'在第 '+(lesson+1)+' 堂的條件 '+(k+1)+' 下，哪一項觀察能檢查假設？',answer:text,...(cid%5!==0?{mcq:{options:['比較相同條件下的輸出','同時替換所有輸入','只記下成功的案例'],answer:0,explain:'一次只改變一項條件，才能比較修改造成的差異。'}}:{}),...(cid%4===0?{interview:{question:'如何向下一位維護者解釋這次判斷的依據？',points:['說明輸入條件','提出可重現的觀察'],answer:text}}:{})})}
     const l={id:lid,module:id,order:j+1,title:'觀察與驗證 '+(lesson+1),subtitle:'用一個可重現的例子說明選擇',status:ready?'ready':'stub',minutes:25,level:1,objectives:['辨認輸入與輸出的關係','寫下可以重現的步驟'],tags:[track,'驗證'],concepts,practice:ready?[{id:lid+'-p',title:'驗證一次輸出',kind:'hands-on',minutes:8,steps:['記錄輸入','比較輸出'],checks:['留下可重現的紀錄']}]:[]}
     write('modules/'+id+'/'+String(j+1).padStart(2,'0')+'-case.md','---\n'+JSON.stringify(l)+'\n---\n'+(ready?'## 觀察問題\n'+text.repeat(15):''))
   }
 }
 write('roles.yaml',roles.map((id,i)=>({id,title:i?'AI 基礎設施工程師':'全端工程師',skills:[{id:'skill-'+id,title:'分析條件',weight:2,modules:[mids[i]]}]})))
 write('path.yaml',{recommended:mids})
 if(lesson!==380||cid!==2000)throw Error('規模不符')
 return {root,src}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(makeLargeFixture().src)
