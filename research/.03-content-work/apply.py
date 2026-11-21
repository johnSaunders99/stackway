from pathlib import Path
import json, yaml, re, csv, math
R=Path.cwd().resolve()
assert R==Path(r'E:\ClaudeProjects\stackway').resolve()
C=R/'content'; W=R/'research'/'.03-content-work'
parts=[m for f in sorted(W.glob('part*.json')) for m in json.loads(f.read_text(encoding='utf-8'))]
z=json.loads((W/'meta.json').read_text(encoding='utf-8'))
def read(p): return yaml.safe_load(p.read_text(encoding='utf-8-sig'))
def put(p,s):
    with p.open('w',encoding='utf-8',newline='\n') as h: h.write(s)
class Block(yaml.SafeDumper):
    def increase_indent(self,flow=False,indentless=False):return super().increase_indent(flow,False)
def dump(v):return yaml.dump(v,Dumper=Block,sort_keys=False,allow_unicode=True,width=1000,default_flow_style=False)
def ordered(o,keys):
    return {k:o[k] for k in dict.fromkeys(keys.split()+list(o)) if k in o}
def detail(l):
    v=ordered(l['v'],'id module order title subtitle status minutes level prereqs objectives tags resources concepts practice')
    return '---\n'+dump(v)+'---\n'+('\n'+l['body'].strip()+'\n' if l['body'].strip() else '')
assert len(parts)==len(z['path'])
assert sorted(z['baseline']['path'])==sorted(read(C/'path.yaml')['recommended'])
assert z['baseline']['roles']==read(C/'roles.yaml')
assert all(p==read(C/'projects'/(p['id']+'.yaml')) for p in z['baseline']['projects'])
with (R/'research'/'resource-checks.csv').open(encoding='utf-8-sig',newline='') as f: assert list(csv.DictReader(f))==z['baseline']['ledger']
ids=set(); paths=set(); oldfiles=set(); newfiles=set()
for rec in parts:
    m=rec['m'];mid=m['id']; md=C/'modules'/mid
    if rec['oldM'] is None: assert not md.exists(),md
    else: assert read(md/'module.yaml')==rec['oldM'],md
    for l in rec['lessons']:
        v=l['v'];f=(R/l['f']).resolve();old=l['baseline']
        assert f.parent==md.resolve() and f not in paths and v['id'] not in ids
        assert 1<=len(v['title'])<=18 and 1<=len(v['subtitle'])<=26
        ids.add(v['id']);paths.add(f)
        if old:
            src=(R/old['f']).resolve();assert src.parent==f.parent
            a=re.fullmatch(r'---\n(.*?)\n---(?:\n(.*))?',src.read_text(encoding='utf-8-sig'),re.S)
            assert a and yaml.safe_load(a[1])==old['v'] and (a[2] or '').strip()==old['body'].strip(),src
            oldfiles.add(src)
            if src!=f: assert not f.exists(),f
        else:
            assert not f.exists(),f
        newfiles.add(f)
assert oldfiles==set((C/'modules').glob('*/*.md')) and len(oldfiles)==203
assert len(newfiles)==373 and len(parts)==49
for rec in parts:
    m=rec['m'];md=C/'modules'/m['id'];md.mkdir(exist_ok=True)
    put(md/'module.yaml',dump(ordered(m,'id track stage order title subtitle summary outcomes prereqs roles hours project')))
    for l in rec['lessons']:
        dst=R/l['f']
        if l['old'] and l['old']!=l['f']: (R/l['old']).rename(dst)
        put(dst,detail(l))
put(C/'path.yaml',dump({'recommended':z['path']}));put(C/'roles.yaml',dump(z['roles']))
for p in z['projects']:put(C/'projects'/(p['id']+'.yaml'),dump(p))
with (R/'research'/'resource-checks.csv').open('w',encoding='utf-8',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(z['ledger'][0]),lineterminator='\n');w.writeheader();w.writerows(sorted(z['ledger'],key=lambda r:r['url']))
print(len(oldfiles),'previous lessons retained;',len(ids),'lessons written;',len(parts),'modules;',len(z['ledger']),'evidence URLs')

