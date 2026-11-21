import fs from 'node:fs'
import {spawnSync} from 'node:child_process'
// Explicit isolation for a concurrent curriculum rewrite. A normal check validates both sources.
if(process.env.STACKWAY_FIXTURE_ONLY==='1'){console.log('已指定隔離檢查：只使用測試教材。')}
else if(fs.existsSync('content/tracks.yaml')){
 const r=spawnSync(process.execPath,['tools/check-content.mjs','--src','content'],{stdio:'inherit'});process.exitCode=r.status??1
}
