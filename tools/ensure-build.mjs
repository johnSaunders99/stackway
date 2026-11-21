import {spawnSync} from 'node:child_process'
import {source} from './content.mjs'
import {needsBuild} from './freshness.mjs'
const src=source(process.argv.slice(2))
if(needsBuild(process.cwd(),src)){
 console.log('教材或程式有更新，重新建置中…')
 const r=spawnSync(process.execPath,['tools/build.mjs','--src',src],{stdio:'inherit'})
 process.exitCode=r.status??1
}
