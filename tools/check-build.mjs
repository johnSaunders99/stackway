// Exercise the installed toolchain without replacing the learner's real dist/ or public/content/.
import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {source} from './content.mjs'
import {scratch} from './scratch.mjs'

const args=process.argv.slice(2), src=source(args), box=scratch(), root=box.dir
try {
  for (const key of ['src','docs','tools','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts']) {
    fs.cpSync(key,path.join(root,key),{recursive:true})
  }
  fs.cpSync('public',path.join(root,'public'),{recursive:true,filter:p=>path.resolve(p)!==path.resolve('public/content')})
  fs.cpSync(src,path.join(root,'content'),{recursive:true})
  fs.mkdirSync(path.join(root,'node_modules')) // keep Vite's transient config local
  function run(script) {
    const r=spawnSync(process.execPath,['tools/'+script],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024,env:{...process.env,STACKWAY_CONTENT:'content'}})
    if(r.status!==0) throw Error(r.error?.message??(r.stdout+r.stderr))
    return r.stdout
  }
  const stamp=()=>fs.statSync(path.join(root,'dist/.build-stamp.json')).mtimeMs
  if(args.includes('--touch')) {
    const ensure=()=>run('ensure-build.mjs').includes('重新建置中')
    assert.equal(ensure(),true)
    const before=stamp()
    assert.equal(ensure(),false);assert.equal(stamp(),before)
    const modules=path.join(root,'content/modules')
    const candidates=fs.readdirSync(modules).filter(n=>!n.startsWith('.')&&fs.lstatSync(path.join(modules,n)).isDirectory())
    const lesson=candidates.flatMap(n=>fs.readdirSync(path.join(modules,n)).filter(f=>!f.startsWith('.')&&f.endsWith('.md')).map(f=>path.join(modules,n,f)))[0]
    const st=fs.statSync(lesson)
    fs.utimesSync(lesson,st.atime,new Date(st.mtimeMs+5000))
    assert.equal(ensure(),true);assert.notEqual(stamp(),before)
    const after=stamp()
    assert.equal(ensure(),false);assert.equal(stamp(),after)
    console.log('Launcher: initial build → unchanged skipped → touched '+path.relative(root,lesson)+' rebuilt → unchanged skipped.')
  } else {
    console.log(run('build.mjs').trim())
  }
  assert.ok(fs.readFileSync(path.join(root,'docs/guide.md')).equals(fs.readFileSync(path.join(root,'使用說明.md'))))
} finally {box.clean()}
