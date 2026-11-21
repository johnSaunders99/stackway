import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
const {
  join,
  basename,
  relative,
  resolve
} = path;
export function source(args = []) {
  const i = args.indexOf('--src');
  if (i >= 0 && !args[i + 1]) throw Error('--src 需要目錄');
  return resolve(i >= 0 ? args[i + 1] : process.env.STACKWAY_CONTENT || (fs.existsSync('content/tracks.yaml') ? 'content' : 'fixtures/content'));
}
const simp = '这们时个为么说对发会过还学习网络数库软应设计码认识题务资储环线节点书车门问听见长话语讲读记错实战练级进阶场处页组编复测选择项输础资标验显览态间单顺顾愿虑广扩链权访显示图阶层义类传执检请归扫启闭断开关创删载拟态调试译释转换历绩简历档导览顾频率预测缓冲区线绕续继统综维纳级绝终绘缩绿红纸组结给绳纠纷纤纪纺纹纱绕缝绑绪绣绵绞绩绊缆练缀缘缔编缕缴缚缠缤缥缩绽缸证诊词评订讨议讯训讲诠诵诫误诲诱谋谅谊谜谨谦谢谣谱贝负财贡货贩贪贫购贮贯贵贷费贺贼贾贿赂资赚赛赞赠赡赵赶趋跃践踪辆轮轨轰轴轻轿辈辉辑辐辖辙辞迟迁违连迩迈运远适递逻遗邮邻酝酿释钟钢钉钓钞钝钠钙钾铁铃铜银铭铅铝锅键锐锤锥锯镜镀镇镊镭闯闰闲闷闸闹闻阁阀阅阔队阳阴阵阶际陆陈险随隐难雏雾霁顶顷顽顿颁颂预颅领颇颈颊颓颖颗额颠颤风飘飞饥饭饮饲饱饼饿馆馈馒马驭驯驳驴驶驹驻驼驾骂骄骆验骑骗骚骤鱼鲜鲨鲸鸟鸡鸣鸥鸭鸽鹅鹤麦黄齐齿龄龟龙';
const simplified = new Set([...simp].filter(c => !'显示缸辞适率'.includes(c)));
const arr = x => Array.isArray(x) ? x : [];
const present = x => typeof x === 'string' && x.trim().length > 0;
// Inventory regular files only. Hidden directories and links are never followed.
function inventory(src, warn) {
  const found = new Set(), moduleDirs = [];
  function walk(rel) {
    for (const entry of fs.readdirSync(join(src, rel), {withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      const key = rel ? rel + '/' + entry.name : entry.name;
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) {
        warn(key, entry.isDirectory() ? '已忽略隱藏資料夾' : '已忽略非教材檔案');
      } else if (entry.isDirectory()) {
        if (rel === 'modules') moduleDirs.push(entry.name);
        walk(key);
      } else if (entry.isFile()) found.add(key);
    }
  }
  if (fs.existsSync(src)) walk('');
  return {found,moduleDirs};
}
export function inspect(src) {
  const errors = [],
    warnings = [],
    tracks = [],
    roles = [],
    modules = [],
    lessons = [],
    concepts = [],
    projects = [],
    interviews = [],
    bodies = {},
    fileOf = new Map(),
    seen = new Set(),
    practice = [],
    graph = new Map();
  const err = (f, m) => errors.push([f, m]),
    warn = (f, m) => warnings.push([f, m]);
  const {found,moduleDirs} = inventory(src,warn), consumed = new Set(), assets = new Set(), links = [];
  const files = (dir,ext) => [...found].filter(f=>f.startsWith(dir+'/') && !f.slice(dir.length+1).includes('/') && f.endsWith(ext)).sort();
  const read = f => {
    if (!found.has(f)) throw Error('找不到教材檔案 ' + f);
    consumed.add(f);
    return fs.readFileSync(join(src,f),'utf8');
  };
  const collect = (result, f) => {
    for (const a of result.assets) {
      if (found.has(a)) assets.add(a); else err(f, '找不到本機素材 ' + a);
    }
    for (const href of result.links) links.push([f,href]);
  };
  const yaml = p => {
    try {
      return YAML.parse(read(p));
    } catch (e) {
      err(p, e.message);
      return null;
    }
  };
  const list = f => {
    const v = yaml(f);
    if (!Array.isArray(v)) err(f, '必須是清單');
    return arr(v);
  };
  const id = (o, f) => {
    if (!present(o.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(o.id)) err(f, '識別碼格式不符');
    if (seen.has(o.id)) err(f, '重複識別碼 ' + o.id);
    seen.add(o.id);
    fileOf.set(o.id, f);
  };
  const subtitle=(o,f)=>{if(o.subtitle===undefined)return;if(typeof o.subtitle!=='string')err(f,'副標題必須是字串');else if([...o.subtitle].length>30)warn(f,'副標題超過 30 字，建議 26 字以內')};
  const positive = (n, f) => {
    if (!(typeof n === 'number' && Number.isFinite(n) && n > 0)) err(f, '分鐘數必須大於零');
  };
  const hz = (s, f) => {
    let hits = [...new Set([...s].filter(c => simplified.has(c)))];
    if (hits.length) warn(f, '疑似簡體字：' + hits.join('、'));
  };
  const points = (q, f) => {
    if (!Array.isArray(q.points) || q.points.length < 2 || q.points.length > 6 || !q.points.every(present)) err(f, '面試要點須有 2–6 項');
  };
  tracks.push(...list('tracks.yaml'));
  roles.push(...list('roles.yaml'));
  const pathData = found.has('path.yaml') ? yaml('path.yaml') : {
    recommended: []
  };
  for (const d of moduleDirs) {
    const dir = 'modules/' + d, mf = dir + '/module.yaml', lessonFiles = files(dir, '.md');
    // A folder of editor leftovers is not itself a malformed module.
    if (!found.has(mf) && !lessonFiles.length) continue;
    const m = yaml(mf);
    if (!m) continue;
    id(m, mf);subtitle(m,mf);
    modules.push(m);
    if (m.id !== d) err(mf, '資料夾與模組不符');
    for (const f of lessonFiles) {
      const s = read(f).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
      const match = s.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
      if (!match) {
        err(f, '缺少前置資料');
        continue;
      }
      let l;
      try {
        l = YAML.parse(match[1]);
        if (!l) throw Error('空白前置資料');
      } catch (e) {
        err(f, e.message);
        continue;
      }
      const body = match[2].trim(),
        ready = l.status === 'ready';
      id(l, f);subtitle(l,f);
      if (l.module !== d || !String(l.id).startsWith(d + '-')) err(f, '課程識別碼或所屬模組不符');
      positive(l.minutes, f);
      if (!['ready', 'stub', 'draft'].includes(l.status)) err(f, '未知課程狀態');
      if (ready && (!arr(l.objectives).length || !body || arr(l.concepts).length < 3)) err(f, '就緒課程缺少目標、正文或三個知識點');
      const ct = body.replace(/```[\s\S]*?```/g, '').match(/\p{Script=Han}/gu)?.length ?? 0;
      if (ready && (ct < 600 || ct > 1800)) warn(f, '正文漢字數 ' + ct + '（建議 600–1800）');
      if (ready && !arr(l.practice).length) warn(f, '尚無練習');
      if (ready && l.level >= 2 && !arr(l.concepts).some(c => c.interview)) warn(f, '尚無面試問答');
      for (const r of arr(l.resources)) {
        let good = false;
        try {
          good = ['http:', 'https:'].includes(new URL(r.url).protocol);
        } catch {}
        if (!good || !['doc', 'video', 'course', 'book', 'article', 'paper', 'repo', 'interactive', 'tool'].includes(r.kind) || !['en', 'zh-Hant', 'zh-Hans', 'other'].includes(r.lang) || !/^\d{4}-\d{2}-\d{2}$/.test(r.checked)) err(f, '資源網址或分類、語言、查核日期有誤');
        positive(r.minutes, f);
      }
      for (const c of arr(l.concepts)) {
        id(c, f);
        if (!present(c.prompt) || !present(c.answer)) err(f, '知識點缺少問答');
        if (c.mcq) {
          const {
            options,
            answer,
            explain
          } = c.mcq;
          if (!Array.isArray(options) || options.length < 3 || options.length > 5 || new Set(options.map(x => String(x).trim())).size !== options.length || !Number.isInteger(answer) || answer < 0 || answer >= options.length || !present(explain)) err(f, '選擇題選項、解答或解說有誤');
        }
        if (c.interview) points(c.interview, f);
        concepts.push({
          ...c,
          trackId: m.track,
          lessonId: l.id,
          moduleId: d,
          tags: l.tags ?? []
        });
      }
      for (const t of arr(l.practice)) {
        id(t, f);
        positive(t.minutes, f);
        if (t.solution) {
          const solution = render(t.solution, f, err);
          t.solutionHtml = solution.html;
          collect(solution,f);
        }
        practice.push(t);
      }
      const result = render(body, f, err);
      collect(result,f);
      bodies[l.id] = {
        id: l.id,
        html: result.html,
        outline: result.outline
      };
      hz(s, f);
      lessons.push({
        ...l,
        concepts: arr(l.concepts).map(c => c.id),
        prereqs: arr(l.prereqs),
        resources: arr(l.resources),
        tags: arr(l.tags),
        practice: arr(l.practice)
      });
    }
  }
  for (const [dir, dest] of [['projects', projects], ['interview', interviews]]) for (const f of files(dir, '.yaml')) {
    const o = yaml(f);
    if (!o) continue;
    id(o, f);
    hz(JSON.stringify(o), f);
    if (dir === 'interview') for (const q of arr(o.questions)) {
      id(q, f);
      points(q, f);
    }
    dest.push(o);
  }
  const ids = xs => new Set(xs.map(x => x.id)),
    T = ids(tracks),
    M = ids(modules),
    L = ids(lessons),
    R = ids(roles),
    P = ids(projects);
  for (const [file,href] of links) {
    const [,kind,target] = href.match(/^#\/(lesson|module)\/([^?#]*)/);
    if (!(kind === 'lesson' ? L : M).has(target)) err(file, '找不到內部連結 ' + href);
  }
  for (const f of found) if (!consumed.has(f) && !assets.has(f)) warn(f,'已忽略非教材檔案');
  const refs = (f, vs, set) => arr(vs).forEach(v => {
    if (!set.has(v)) err(f, '未知參照 ' + v);
  });
  const ts = ['foundations', 'fullstack', 'aiinfra', 'career'];
  if (tracks.length !== 4 || !ts.every(t => T.has(t))) err('tracks.yaml', '必須包含四條指定路線');
  refs('path.yaml', pathData?.recommended, M);
  for (const r of roles) {
    if (!['fullstack', 'aiinfra'].includes(r.id)) err('roles.yaml', '未知職涯角色');
    for (const s of arr(r.skills)) refs('roles.yaml', s.modules, M);
  }
  for (const t of [...projects, ...interviews]) {
    refs(fileOf.get(t.id), [t.track], T);
    refs(fileOf.get(t.id), t.modules, M);
  }
  for (const m of modules) {
    const f = fileOf.get(m.id);
    refs(f, [m.track], T);
    refs(f, m.prereqs, M);
    refs(f, m.roles, R);
    if (m.project) refs(f, [m.project], P);
    if (!lessons.some(l => l.module === m.id && l.status === 'ready')) warn(f, '模組尚無就緒課程');
    graph.set(m.id, [...arr(m.prereqs), ...lessons.filter(l => l.module === m.id).map(l => l.id)]);
  }
  for (const l of lessons) {
    refs(fileOf.get(l.id), l.prereqs, L);
    graph.set(l.id, [...l.prereqs, ...arr(modules.find(m => m.id === l.module)?.prereqs)]);
  }
  const done = new Set(),
    vis = new Set();
  function visit(n) {
    if (vis.has(n)) {
      err(fileOf.get(n), '先修條件形成循環 ' + n);
      return;
    }
    if (done.has(n)) return;
    vis.add(n);
    for (const v of graph.get(n) ?? []) visit(v);
    vis.delete(n);
    done.add(n);
  }
  for (const n of graph.keys()) visit(n);
  for (const [f, items] of [['tracks.yaml', tracks], ['roles.yaml', roles]]) hz(JSON.stringify(items), f);
  for (const m of modules) hz(JSON.stringify(m), fileOf.get(m.id));
  const counts = {
    tracks: tracks.length,
    modules: modules.length,
    lessons: lessons.length,
    ready: lessons.filter(l => l.status === 'ready').length,
    concepts: concepts.length,
    practice: practice.length,
    projects: projects.length,
    questions: interviews.flatMap(i => i.questions).length + concepts.filter(c => c.interview).length
  };
  const index = {
    tracks,
    roles,
    path: pathData ?? {
      recommended: []
    },
    modules,
    lessons,
    projects,
    counts
  };
  const hash = createHash('sha256').update(JSON.stringify([index, concepts, interviews, bodies]));
  for (const asset of [...assets].sort()) hash.update(asset).update(fs.readFileSync(join(src,asset)));
  return {
    errors,
    warnings,
    index: {
      ...index,
      version: hash.digest('hex').slice(0, 12)
    },
    deck: {
      concepts,
      interviews
    },
    bodies,
    assets: [...assets].sort()
  };
}
function render(s, f, err) {
  const md = new MarkdownIt({
      html: false,
      linkify: false
    }),
    tokens = md.parse(s, {}),
    outline = [],
    assets = [], links = [];
  const esc = md.utils.escapeHtml;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading_open' && ['h2', 'h3'].includes(t.tag)) {
      const id = 'section-' + (outline.length + 1);
      t.attrSet('id', id);
      outline.push({
        id,
        level: Number(t.tag[1]),
        text: tokens[i + 1].content
      });
    }
    if (t.type === 'blockquote_open') {
      const inline = tokens[i + 2],
        first = inline?.children?.[0];
      const m = first?.content.match(/^\[!(TIP|NOTE|WARN)\]\s*/);
      if (m) {
        t.attrSet('class', 'callout ' + m[1].toLowerCase());
        first.content = first.content.slice(m[0].length);
        t.attrSet('data-label', {
          TIP: '小提示',
          NOTE: '筆記',
          WARN: '請留意'
        }[m[1]]);
      }
    }
    for (const c of t.children ?? []) {
      if (c.type !== 'image' && c.type !== 'link_open') continue;
      const image = c.type === 'image', attr = image ? 'src' : 'href', href = c.attrGet(attr) ?? '';
      if (image || href.startsWith('assets/')) {
        let file;
        try { file = decodeURIComponent(href.split(/[?#]/)[0]); } catch {}
        if (!file?.startsWith('assets/') || file.split('/').some(part => !part || part.startsWith('.') || /[\\:]/.test(part))) {
          err(f, '素材須為本機 assets 檔案');
        } else {
          assets.push(file);
          c.attrSet(attr,'./content/' + href);
        }
      }
      if (!image && /^#\/(lesson|module)\//.test(href)) links.push(href);
      if (!image && !href.startsWith('#')) {
        c.attrSet('target','_blank');
        c.attrSet('rel','noopener noreferrer');
      }
    }
  }
  md.renderer.rules.fence = (ts, i) => {
    const t = ts[i],
      lang = t.info.trim().split(/\s+/)[0];
    if (!lang) err(f, '程式碼區塊缺少語言');
    let code = esc(t.content);
    if (lang && hljs.getLanguage(lang)) code = hljs.highlight(t.content, {
      language: lang,
      ignoreIllegals: true
    }).value;
    return `<div class="codebox"><div><span>${esc(lang)}</span><button type="button" data-copy>複製程式碼</button></div><pre><code>${code}</code></pre></div>`;
  };
  return {
    html: md.renderer.render(tokens, md.options, {}),
    outline,
    links,
    assets
  };
}
export function diagnostics(r) {
  for (const [label, xs] of [['警告', r.warnings], ['錯誤', r.errors]]) {
    for (const f of new Set(xs.map(x => x[0]))) console.log(label + ' ' + f + '\n  ' + xs.filter(x => x[0] === f).map(x => x[1]).join('\n  '));
  }
}
export function buildContent(src, out = resolve('public/content')) {
  const r = inspect(src);
  diagnostics(r);
  if (r.errors.length) throw Error('內容未通過檢查');
  fs.mkdirSync(join(out, 'lessons'), {
    recursive: true
  });
  const put = (p, o) => fs.writeFileSync(join(out, p), JSON.stringify(o));
  put('index.json', r.index);
  put('concepts.json', r.deck);
  for (const b of Object.values(r.bodies)) put('lessons/' + b.id + '.json', b);
  // A rebuild must not ship a removed lesson or a previously referenced asset.
  const keep = new Set([...Object.keys(r.bodies).map(id=>'lessons/'+id+'.json'),...r.assets]);
  const prune = (dir) => {
    const base = join(out,dir);
    if (!fs.existsSync(base)) return;
    for (const e of fs.readdirSync(base,{withFileTypes:true})) {
      const key = dir+'/'+e.name;
      if (e.isDirectory()) prune(key);
      else if (!keep.has(key)) fs.unlinkSync(join(out,key));
    }
  };
  prune('assets');
  prune('lessons');
  for (const asset of r.assets) {
    fs.mkdirSync(path.dirname(join(out,asset)),{recursive:true});
    fs.copyFileSync(join(src,asset),join(out,asset));
  }
  console.log('內容來源：' + src, r.index.counts);
  return r;
}
