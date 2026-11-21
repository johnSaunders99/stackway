import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'
import {spawnSync} from 'node:child_process'
import {buildContent,source} from './content.mjs'
import {inputs,retainAssets} from './freshness.mjs'
const src=source(process.argv.slice(2)), stamp=inputs(process.cwd(),src)
retainAssets(stamp,buildContent(src).assets)
const require=createRequire(import.meta.url)
for(const [pkg,bin,args] of [['typescript','bin/tsc',['-b']],['vite','bin/vite.js',['build']]]){
 const file=path.resolve(path.dirname(require.resolve(pkg+'/package.json')),bin)
 const r=spawnSync(process.execPath,[file,...args],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)
}
fs.copyFileSync('docs/guide.md','使用說明.md')
// Capture inputs before compiling; a concurrent edit will invalidate this successful build.
fs.writeFileSync('dist/.build-stamp.json',JSON.stringify(stamp))
