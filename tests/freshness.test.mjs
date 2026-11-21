import {it,expect} from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {scratch} from './scratch.mjs'
import {needsBuild,inputs,retainAssets} from '../tools/freshness.mjs'
it('normal check conditionally invokes the real validator; explicit isolation does not inspect the concurrent source',()=>{
 const b=scratch(),tool=path.resolve('tools/check-real-content.mjs'),env={...process.env,STACKWAY_FIXTURE_ONLY:''}
 try{fs.mkdirSync(path.join(b.dir,'tools'));fs.writeFileSync(path.join(b.dir,'tools/check-content.mjs'),"if(process.argv.slice(2).join(' ')!=='--src content')process.exit(1);console.log('validation-called')")
 const run=(e)=>spawnSync(process.execPath,[tool],{cwd:b.dir,env:e,encoding:'utf8'});expect(run(env).stdout).not.toContain('validation-called');fs.mkdirSync(path.join(b.dir,'content'));fs.writeFileSync(path.join(b.dir,'content','tracks.yaml'),'[]');expect(run(env).stdout).toContain('validation-called');expect(run({...env,STACKWAY_FIXTURE_ONLY:'1'}).stdout).not.toContain('validation-called')
 }finally{b.clean()}
})
it('rebuilds for source switches, missing artifacts, tracked edits/additions/removals but not generated content',()=>{
 const b=scratch(),root=b.dir,src=path.join(root,'course'),put=(p,s)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s)},stamp=()=>{const guide=path.join(root,'docs/guide.md');if(fs.existsSync(guide))fs.copyFileSync(guide,path.join(root,'使用說明.md'));put('dist/.build-stamp.json',JSON.stringify(inputs(root,src)))}
 try{put('course/tracks.yaml','[]');expect(needsBuild(root,src)).toBe(true);put('dist/index.html','ok');stamp();expect(needsBuild(root,src)).toBe(false)
 put('public/content/index.json','one');expect(needsBuild(root,src)).toBe(false)
 for(const file of ['src/a.ts','docs/guide.md','public/logo.svg','tools/tool.mjs','package.json','index.html','course/tracks.yaml']){put(file,'new input');expect(needsBuild(root,src)).toBe(true);stamp();expect(needsBuild(root,src)).toBe(false)}
 put('使用說明.md','changed generated copy');expect(needsBuild(root,src)).toBe(true);stamp();expect(needsBuild(root,src)).toBe(false)
 fs.unlinkSync(path.join(root,'src/a.ts'));expect(needsBuild(root,src)).toBe(true);stamp();expect(needsBuild(root,path.join(root,'different'))).toBe(true)
 }finally{b.clean()}
})

it('ignores hidden folders, editor files and unreferenced assets, but detects edits to referenced assets',()=>{
 const b=scratch(),src=path.join(b.dir,'course')
 try{
  for(const file of ['assets/used.svg','assets/unused.svg','modules/.drafts/test.md','editor.tmp']){
    const p=path.join(src,file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,'x')
  }
  fs.mkdirSync(path.join(b.dir,'dist'));fs.writeFileSync(path.join(b.dir,'dist/index.html'),'ok')
  const stamp=inputs(b.dir,src);retainAssets(stamp,['assets/used.svg']);fs.writeFileSync(path.join(b.dir,'dist/.build-stamp.json'),JSON.stringify(stamp))
  for(const f of ['assets/unused.svg','modules/.drafts/test.md','editor.tmp'])fs.appendFileSync(path.join(src,f),'changed')
  expect(needsBuild(b.dir,src)).toBe(false);fs.appendFileSync(path.join(src,'assets/used.svg'),'changed');expect(needsBuild(b.dir,src)).toBe(true)
 }finally{b.clean()}
})
