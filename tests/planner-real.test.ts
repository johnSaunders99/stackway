import {existsSync} from 'node:fs'
import {it,expect} from 'vitest'
import {inspect} from '../tools/content.mjs'
import {assembleCatalog} from '../src/content/catalog'
import {buildDayPlan} from '../src/lib/planner'
import {defaults} from '../src/lib/model'

it.skipIf(process.env.STACKWAY_FIXTURE_ONLY==='1' || !existsSync('content/tracks.yaml'))(
  'starts a fresh real plan with the Windows lessons in sequence',()=>{
    const {index,deck}=inspect('content')
    const catalog=assembleCatalog(index,deck)
    const input={catalog,done:new Set<string>(),day:'2026-11-20',at:'2026-11-20T08:00:00Z',
      choice:{format:defaults.format,scope:defaults.scope,tracks:defaults.tracks},ratio:defaults.ratio,reviewIds:[],reviewMinutes:0}
    const start=['fd-computer-01-folder','fd-computer-02-note','fd-computer-03-editor']
    const recommended=buildDayPlan({...input,focus:'recommended',budget:{mode:'time',value:120}})
    expect(recommended.items.slice(0,3)).toEqual(start)
    const dual=buildDayPlan({...input,focus:'dual',budget:{mode:'time',value:60}})
    expect(dual.items.slice(0,2)).toEqual(start.slice(0,2))
  },30000)
