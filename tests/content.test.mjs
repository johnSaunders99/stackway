import { it, expect, describe, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { execFileSync, spawnSync } from 'node:child_process';
import { inspect, buildContent, source } from '../tools/content.mjs';
import { scratch } from './scratch.mjs';
let box, src;
beforeEach(() => {
  box = scratch();
  src = path.join(box.dir, 'src');
  fs.cpSync('fixtures/content', src, {
    recursive: true
  });
});
afterEach(() => box.clean());
const lesson = 'modules/fd-demo/01-files.md';
const read = p => fs.readFileSync(path.join(src, p), 'utf8');
const write = (p, t) => fs.writeFileSync(path.join(src, p), t);
function change(p, fn) {
  const data = YAML.parse(read(p));
  fn(data);
  write(p, YAML.stringify(data));
}
function edit(fn, bodyFn = b => b) {
  const [, head, body] = read(lesson).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/),
    l = YAML.parse(head);
  fn(l);
  write(lesson, '---\n' + YAML.stringify(l) + '---\n' + bodyFn(body));
}
it('compiles fixture counts, lazy bodies, image, table, callouts, code, stable outline', () => {
  const out = path.join(box.dir, 'out'),
    r = buildContent(src, out),
    b = r.bodies['fd-demo-01-files'];
  expect(r.index.counts).toMatchObject({
    modules: 4,
    ready: 7,
    lessons: 10,
    concepts: 21,
    projects: 1,
    questions: 10
  });
  expect(r.warnings).toEqual([]);
  expect(r.errors).toEqual([]);
  for (const needle of ['<table>', 'data-copy', '<img', './content/assets/worktree.svg', 'callout tip', 'id="section-1"']) expect(b.html).toContain(needle);
  expect(b.outline.some(x => x.level === 3)).toBe(true);
  expect(r.index.lessons[0]).not.toHaveProperty('html');
  expect(fs.existsSync(path.join(out, 'assets/worktree.svg'))).toBe(true);
  expect(JSON.parse(fs.readFileSync(path.join(out, 'lessons', b.id + '.json')))).toEqual(b);
  expect(inspect(src).index.version).toBe(r.index.version);
});
it('validates optional subtitles without altering their text',()=>{
  edit(l=>l.subtitle=42);expect(inspect(src).errors.some(([,msg])=>msg.includes('副標題必須是字串'))).toBe(true)
  edit(l=>l.subtitle='字'.repeat(30));change('modules/fd-demo/module.yaml',m=>m.subtitle='路'.repeat(31))
  const r=inspect(src);expect(r.errors).toEqual([]);expect(r.warnings.filter(([,msg])=>msg.includes('副標題'))).toEqual([['modules/fd-demo/module.yaml','副標題超過 30 字，建議 26 字以內']])
  expect(r.index.lessons.find(l=>l.id==='fd-demo-01-files').subtitle).toHaveLength(30)
});
it('explicit source wins over environment variable', () => {
  const old = process.env.STACKWAY_CONTENT;
  try {
    process.env.STACKWAY_CONTENT = src;
    expect(source([])).toBe(src);
    expect(source(['--src', 'fixtures/content'])).toBe(path.resolve('fixtures/content'));
  } finally {
    if (old) process.env.STACKWAY_CONTENT = old;else delete process.env.STACKWAY_CONTENT;
  }
});
describe('validator rejects invalid authored material', () => {
  it.each([['duplicate lesson', () => write('modules/fd-demo/99-copy.md', read(lesson)), '重複識別碼'], ['duplicate module', () => change('modules/fs-demo/module.yaml', m => m.id = 'fd-demo'), '重複識別碼'], ['duplicate concept', () => edit(l => l.concepts[1].id = l.concepts[0].id), '重複識別碼'], ['duplicate practice', () => edit(l => l.practice.push(l.practice[0])), '重複識別碼'], ['duplicate project', () => write('projects/p2.yaml', read('projects/proj-notebook.yaml')), '重複識別碼'], ['duplicate bank question', () => change('interview/iv-evidence.yaml', s => s.questions[1].id = s.questions[0].id), '重複識別碼'], ['unknown track', () => change('modules/fd-demo/module.yaml', m => m.track = 'unknown'), '未知參照'], ['unknown module', () => edit(l => l.module = 'missing'), '所屬模組'], ['unknown module prerequisite', () => change('modules/fd-demo/module.yaml', m => m.prereqs = ['missing']), '未知參照'], ['unknown lesson prerequisite', () => edit(l => l.prereqs = ['missing']), '未知參照'], ['unknown project', () => change('modules/fd-demo/module.yaml', m => m.project = 'missing'), '未知參照'], ['unknown role', () => change('modules/fd-demo/module.yaml', m => m.roles = ['missing']), '未知參照'], ['unknown skill module', () => change('roles.yaml', r => r[0].skills[0].modules = ['missing']), '未知參照'], ['unknown path module', () => change('path.yaml', p => p.recommended.push('missing')), '未知參照'], ['module cycle', () => change('modules/fd-demo/module.yaml', m => m.prereqs = ['fs-demo']), '循環'], ['lesson cycle', () => edit(l => l.prereqs = [l.id]), '循環'], ['cross-level cycle', () => edit(l => l.prereqs = ['fs-demo-01-headings']), '循環'], ['bad lesson prefix', () => edit(l => l.id = 'other-id'), '識別碼或所屬模組'], ['missing objectives', () => edit(l => l.objectives = []), '就緒課程'], ['missing body', () => edit(() => {}, () => ''), '就緒課程'], ['too few concepts', () => edit(l => l.concepts.length = 2), '就緒課程'], ['too few options', () => edit(l => l.concepts[0].mcq.options.length = 2), '選擇題'], ['too many options', () => edit(l => l.concepts[0].mcq.options.push('d', 'e', 'f')), '選擇題'], ['duplicate options', () => edit(l => l.concepts[0].mcq.options[1] = l.concepts[0].mcq.options[0]), '選擇題'], ['answer outside range', () => edit(l => l.concepts[0].mcq.answer = 8), '選擇題'], ['too few interview points', () => edit(l => l.concepts[0].interview.points = []), '面試要點'], ['too many bank points', () => change('interview/iv-evidence.yaml', s => s.questions[0].points = Array(7).fill('項目')), '面試要點'], ['non-http resource', () => edit(l => l.resources[0].url = 'file:demo'), '資源網址'], ...['kind', 'lang', 'checked'].map(key => ['missing resource ' + key, () => edit(l => delete l.resources[0][key]), '資源網址']), ['non-positive minutes', () => edit(l => l.minutes = 0), '分鐘數'], ['missing fence language', () => edit(() => {}, body => body.replace('```text', '```')), '缺少語言']])('%s', (_, mutate, word) => {
    mutate();
    expect(inspect(src).errors.some(([, e]) => e.includes(word))).toBe(true);
  });
});
it('reports grouped warnings and exits nonzero when validation fails', () => {
  edit(l => {
    l.practice = [];
    l.level = 2;
    l.concepts.forEach(c => delete c.interview);
    l.minutes = 0;
  }, () => '这是短文');
  const r = spawnSync(process.execPath, ['tools/check-content.mjs', '--src', src], {
    encoding: 'utf8'
  });
  expect(r.status).toBe(1);
  for (const t of ['警告 ' + lesson, '疑似簡體字', '尚無練習', '正文漢字數', '尚無面試問答', '錯誤 ' + lesson]) expect(r.stdout).toContain(t);
});

it('resolves links by route after all lessons are known, including links inside solutions',()=>{
  edit(l=>{l.practice[0].solution='[找模組](#/module/not-a-module)'},b=>b+'\n[下一堂](#/lesson/fs-demo-01-headings) [錯誤類型](#/lesson/fd-demo) [模組](#/module/fs-demo) `[範例](#/lesson/no-example)`')
  const r=inspect(src)
  expect(r.errors).toEqual([[lesson,'找不到內部連結 #/module/not-a-module'],[lesson,'找不到內部連結 #/lesson/fd-demo']])
  expect(r.bodies['fd-demo-01-files'].html).toContain('<a href="#/lesson/fs-demo-01-headings">')
})
it('warns about author scratch and copies only referenced visible assets, including solution links',()=>{
  const out=path.join(box.dir,'output'), file='assets/練習 表.txt'
  write(file,'練習');edit(l=>l.practice[0].solution='[下載](assets/%E7%B7%B4%E7%BF%92%20%E8%A1%A8.txt)')
  const first=buildContent(src,out)
  expect(first.errors).toEqual([]);expect(fs.existsSync(path.join(out,file))).toBe(true)
  fs.mkdirSync(path.join(src,'modules/.archive'));write('modules/.archive/broken.md','ignored')
  write('assets/orphan.svg','not an image');write('editor.tmp','temporary')
  fs.mkdirSync(path.join(src,'modules/editor'));write('modules/editor/notes.bak','temporary')
  const r=inspect(src)
  expect(r.index.version).toBe(first.index.version);expect(r.errors).toEqual([])
  for(const f of ['modules/.archive','modules/editor/notes.bak','assets/orphan.svg','editor.tmp'])expect(r.warnings.map(([name])=>name)).toContain(f)
  edit(l=>l.practice[0].solution='不再使用附件')
  buildContent(src,out)
  for(const f of [file,'assets/orphan.svg','editor.tmp'])expect(fs.existsSync(path.join(out,f))).toBe(false)
})
it('rejects hidden or missing lesson assets rather than copying them',()=>{
  fs.mkdirSync(path.join(src,'assets/.hidden'));write('assets/.hidden/test.svg','test')
  edit(()=>{},b=>b+'\n![圖](assets/.hidden/test.svg) [附件](assets/missing.txt)')
  const r=inspect(src);expect(r.errors.map(x=>x[1])).toEqual(['素材須為本機 assets 檔案','找不到本機素材 assets/missing.txt'])
})
