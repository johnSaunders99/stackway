import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {performance} from 'node:perf_hooks'
import ts from 'typescript'
import {build} from 'vite'
import {makeLargeFixture} from './make-large-fixture.mjs'
import {buildContent} from './content.mjs'
const {root,src}=makeLargeFixture(),publicDir=path.join(root,'public'),out=path.join(publicDir,'content')
const validate=spawnSync(process.execPath,['tools/check-content.mjs','--src',src],{stdio:'inherit'})
if(validate.status!==0)process.exit(validate.status??1)
buildContent(src,out)
for(const n of fs.readdirSync('public'))if(n!=='content')fs.cpSync(path.join('public',n),path.join(publicDir,n),{recursive:true})
await build({publicDir,build:{outDir:path.join(root,'dist')}})
const output=path.join(root,'dist/content'),index=fs.readFileSync(path.join(output,'index.json'),'utf8'),deck=fs.readFileSync(path.join(output,'concepts.json'),'utf8')
const [indexBytes,conceptBytes]=[index,deck].map(s=>Buffer.byteLength(s))
const js=ts.transpileModule(fs.readFileSync('src/content/catalog.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const {assembleCatalog,searchModules}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))
const samples=[];let cat
for(let i=0;i<11;i++){const t=performance.now();cat=assembleCatalog(JSON.parse(index),JSON.parse(deck));samples.push(performance.now()-t)}
if(!searchModules(cat,'all','條件').length)throw Error('查詢索引沒有結果')
console.log(JSON.stringify({output,counts:cat.counts,indexBytes,conceptBytes,totalBytes:indexBytes+conceptBytes,firstMs:samples[0],median10Ms:samples.slice(1).sort((a,b)=>a-b).slice(4,6).reduce((a,b)=>a+b)/2},null,2))
if(indexBytes+conceptBytes>2500000)throw Error('目錄與知識點超過 2.5 MB')
