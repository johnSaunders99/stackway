import fs from 'node:fs'
import path from 'node:path'
const prefix='@curriculum/assets/'
export function inputs(root,src,previousAssets){
 const manifest={}
 const walk=(abs,key,curriculum=false)=>{
   if(!fs.existsSync(abs))return
   const st=fs.lstatSync(abs)
   if(st.isDirectory()){
     for(const name of fs.readdirSync(abs).sort()){
       if(curriculum && name.startsWith('.'))continue
       const child=key+'/'+name
       if(child!=='public/content')walk(path.join(abs,name),child,curriculum)
     }
   }else if(st.isFile()){
     if(curriculum){
       if(key.startsWith(prefix)){if(previousAssets && !previousAssets.has(key))return}
       else if(!/\.(md|yaml)$/.test(key))return
     }
     manifest[key]=[st.mtimeMs,st.size]
   }
 }
 walk(src,'@curriculum',true)
 for(const key of ['src','public','tools','docs/guide.md','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts'])walk(path.join(root,key),key)
 return {version:2,source:path.relative(root,src).split(path.sep).join('/'),inputs:manifest}
}
// Capture times before compilation, then narrow the asset list to the ones the compiler actually used.
export function retainAssets(stamp,assets){
 const keys=new Set(assets.map(a=>'@curriculum/'+a))
 for(const key of Object.keys(stamp.inputs))if(key.startsWith(prefix)&&!keys.has(key))delete stamp.inputs[key]
}
export function needsBuild(root,src){
 try{if(!fs.existsSync(path.join(root,'dist/index.html')))return true
 const guide=path.join(root,'docs/guide.md')
 if(fs.existsSync(guide) && !fs.readFileSync(guide).equals(fs.readFileSync(path.join(root,'使用說明.md'))))return true
 const stamp=JSON.parse(fs.readFileSync(path.join(root,'dist/.build-stamp.json'),'utf8'))
 return JSON.stringify(stamp)!==JSON.stringify(inputs(root,src,new Set(Object.keys(stamp.inputs))))
 }catch{return true}
}
