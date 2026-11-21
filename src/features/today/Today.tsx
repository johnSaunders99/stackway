import {catalogIndex,curriculumTitle} from '../../content/catalog';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, Flag, Layers3, Leaf, Repeat2 } from 'lucide-react';
import { useWork } from '../../ui/context';
import { Amount, Select, focuses, formats, scopes, Modal, Title } from '../../ui/common';
import {ReviewPicker} from '../../ui/ReviewPicker';
import {CloseDay,DayTotals} from './CloseDay';
import {NoNewLessons} from './NoNewLessons';
import {usedSlots} from '../../lib/reviewPlan';
import { Trail } from '../../ui/Trail';
import { available, blockers, planCandidates, buildDayPlan, preferenceFor, moduleDone } from '../../lib/planner';
import { estimate, present, queue } from '../../lib/scheduler';
import { now, shiftDay } from '../../lib/clock';
import { editPlan, putPlan, settingsUpdate } from '../../db';
import { emptyStats, type Budget, type Choice, type Tomorrow } from '../../lib/model';
import { streaks } from '../../lib/metrics';
export default function Today() {
  const {
    data,
    s,
    day
  } = useWork();
  return <DailyDesk key={day + JSON.stringify(preferenceFor(data.dayPlans, s, day) ?? null)} />;
}
function DailyDesk() {
  const {
      cat,
      data,
      s,
      day,
      done,
      notify
    } = useWork(),
    nav = useNavigate(),
    p = data.dayPlans.find(x => x.day === day),
    prior = preferenceFor(data.dayPlans, s, day),
    st = data.dayStats.find(x => x.day === day) ?? emptyStats(day);
  const savedTom = p?.nextReview ?? (s.nextReview?.day === shiftDay(day, 1) ? s.nextReview : undefined);
  const [budget, setBudget] = useState(prior?.budget ?? s.budget),
    [focus, setFocus] = useState(s.focus),
    [choice, setChoice] = useState<Choice>({
      format: prior?.format ?? s.format,
      scope: prior?.scope ?? s.scope,
      tracks: prior?.tracks ?? s.tracks
    }),
    [force, setForce] = useState(false),
    [modal, setModal] = useState(''),
    [swap, setSwap] = useState(''),
    [tom, setTom] = useState<Choice>(savedTom ?? {
      format: s.format,
      scope: s.scope,
      tracks: s.tracks
    }),
    [tb, setTb] = useState<Budget | undefined>(savedTom?.budget);
  const q = queue(data.cards, choice, now(), s, false, usedSlots(data,day)),
    rm = estimate(present(q.ids, choice, cat, day, s.weights)),
    preview = p ?? buildDayPlan({
      catalog: cat,
      done,
      day,
      at: now().toISOString(),
      budget,
      focus,
      choice,
      ratio: s.ratio,
      reviewIds: q.ids,
      reviewMinutes: rm,
      forceOne: force
    });
  const title = (id: string) => curriculumTitle(cat,id);
  const tomorrow = (): Tomorrow => ({
    ...tom,
    budget: tb,
    day: shiftDay(day, 1)
  });
  const pending = p?.reviewIds.filter(id => !p.reviewDone.includes(id)) ?? [],
    left = pending.slice(0, Math.max(0, s.cap - usedSlots(data,day))),
    next = p?.items.find(id => !done.has(id)),
    extra = p && !p.closedAt ? planCandidates(cat, done, p, s.ratio) : [],
    choices = modal==='swap' && swap && p ? planCandidates(cat, done, p, s.ratio, p.items.indexOf(swap)) : extra;
  const weekAnchor = new Date(day + 'T12:00:00').getDay(),
    week = Array.from({
      length: 7
    }, (_, i) => shiftDay(day, i - (weekAnchor + 6) % 7));
  const nextModule = available(cat, done, s.focus, s.ratio)[0]?.module,
    milestone = cat.modules.find(m => m.id === nextModule) ?? catalogIndex(cat).ordered.find(m => !moduleDone(m.id, cat, done)),
    streak = streaks(data.dayStats, day).current;
  async function start() {
    await putPlan({
      ...preview,
      nextReview: tomorrow()
    });
    notify('今天的計畫已排好。');
  }
  async function saveTomorrow() {
    if (p) await editPlan(day, x => ({
      ...x,
      nextReview: tomorrow(),
      ...(modal === 'close' ? {
        closedAt: now().toISOString()
      } : {})
    }));else await settingsUpdate({
      nextReview: tomorrow()
    });
    setModal('');
    notify(modal === 'close' ? '今天的份量完成了，明天見。' : '已儲存明天的安排。');
  }
  function dismiss() {
    setTom(savedTom ?? {
      format: s.format,
      scope: s.scope,
      tracks: s.tracks
    });
    setTb(savedTom?.budget);
    setModal('');
  }
  function progress() {
    if (left.length) nav('/session?plan=1');else if (next) nav('/lesson/' + next);else setModal('close');
  }
  const lessonSum = preview.items.reduce((n, id) => n + (cat.lessons.find(l => l.id === id)?.minutes ?? 0), 0);
  return <>
      <Title k="學習手帳　 /　每日計畫" title="今天" sub={new Date(day + 'T12:00:00').toLocaleDateString('zh-TW', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })} action={<span className="status"><Leaf size={15} /> 連續 {streak} 天 · {Math.round(st.activeMinutes)?'今日 '+Math.round(st.activeMinutes)+' 分':'今天還沒開始'}</span>} />
      <div className="today-grid">
        <div>
          <div className="desk">
            <div>
              <div className="eyebrow">棧道學習誌</div>
              <h2>{p?.closedAt ? '今天收工了。' : p ? '照自己的步伐走。' : '今天，鋪哪一塊？'}</h2>
              <p>{p?.closedAt ? '留下今天的收穫，明天在這裡接著走。' : '一塊一塊鋪到上岸'}</p>
            </div>
            <Trail />
          </div>
          {!p ? <section className="panel composer">
            <div className="section-head">
              <span className="index">01</span>
              <h2>今天想學多少？</h2>
            </div>
            <Amount value={budget} onChange={setBudget} />
            <hr />
            <Select label="專注路線" value={focus} options={focuses} onChange={setFocus} />
            <details>
              <summary>今天的複習 · {formats[choice.format]} ／ {scopes[choice.scope]}</summary>
              <ReviewPicker value={choice} onChange={setChoice} />
            </details>
            <section className="preview">
              <div className="eyebrow">今日份量預覽</div>
              <b>複習 {q.ids.length} 個知識點（約 {Math.ceil(rm)} 分）</b>
              <br />
              <b>＋ 新課 {preview.items.length} 堂（約 {lessonSum} 分）</b>
              <ol>{preview.items.map(id => <li key={id}>{title(id)}<small className="row-subtitle">{cat.lessons.find(l=>l.id===id)?.subtitle}</small></li>)}</ol>
              {q.carry > 0 && <p>還有 {q.carry} 個延到明天</p>}
              {budget.mode === 'time' && rm > budget.value && !force && <p>今天複習量偏多，建議先複習。 <button onClick={() => setForce(true)}>仍然加一堂</button></p>}
              {!preview.items.length && !available(cat,done,focus,s.ratio).length && <NoNewLessons/>}
            </section>
            <button className="primary" onClick={start}>開始今天 <ArrowRight size={16} /></button>
          </section> : p.closedAt ? <section className="panel">
            <span className="eyebrow">今日回顧</span>
            <h2>今天的份量完成了，明天見。</h2>
            <DayTotals/>
            <Link to="/stats">查看學習統計 →</Link>
          </section> : <section className="panel">
            <div className="between">
              <h2>今日清單</h2>
              <span className="muted">{p.items.filter(id => done.has(id)).length} / {p.items.length} 堂</span>
            </div>
            <div className="plan-row">
              <Repeat2 />
              <div>
                <b>先複習 · {formats[p.format]}</b>
                <small>{p.reviewDone.length} / {p.reviewIds.length} 個知識點{pending.length > left.length ? ' · 還有 ' + (pending.length - left.length) + ' 個延到明天' : ''}</small>
              </div>
              {!left.length && <Check />}
            </div>
            {p.items.map((id, i) => {
              const lesson=catalogIndex(cat).lessons.get(id);
              const missing=lesson ? blockers(lesson,cat,done) : [];
              return <div key={id} className="plan-row">
              <span className="index">{done.has(id) ? <Check /> : String(i + 1).padStart(2, '0')}</span>
              <Link to={'/lesson/' + id}>{title(id)}<small className="row-subtitle">{lesson?.subtitle}</small>
                {missing.length>0 && <small className="row-subtitle">建議先完成：{missing.map(title).join('、')}</small>}
              </Link>
              {!done.has(id) && <div className="row-tools">
                <button className="ghost" onClick={() => {
                setSwap(id);
                setModal('swap');
              }}>替換</button>
                <button className="ghost" onClick={() => editPlan(day, x => ({
                ...x,
                items: x.items.filter(v => v !== id)
              }))}>移除</button>
              </div>}
            </div>})}
            {!p.items.length&&available(cat,done,p.focus,s.ratio).length>0&&<p>這份計畫只安排複習。想加課時，可以選「再來一堂」。</p>}
            {!next&&!available(cat,done,p.focus,s.ratio).length&&<NoNewLessons/>}
            <div className="plan-row">
              <Flag />
              <div>收工<small>留下明天的複習方式</small></div>
            </div>
            <div className="actions">
              <button className="primary" onClick={progress}>{left.length || next ? '繼續' : '收工'} <ArrowRight size={16} /></button>
              {extra.length > 0 && <button onClick={() => {
              setSwap('');
              setModal('swap');
            }}>再來一堂</button>}
              <Link to="/map">從地圖選課</Link>
              {(!!left.length || next) && <button className="ghost" onClick={() => setModal('close')}>提早收工</button>}
            </div>
          </section>}
        </div>
        <aside className="side-stack">
          <section className="panel">
            <Repeat2 className="feature-icon" />
            <h3>明天複習方式</h3>
            <b>{formats[tom.format]}</b>
            <small>{scopes[tom.scope]}</small>
            <button className="text-btn" onClick={() => setModal('tomorrow')}>調整安排 →</button>
          </section>
          <section className="panel">
            <div className="eyebrow">這一週</div>
            <h3>學習足跡</h3>
            <div className="week">{week.map((d, i) => <div key={d}>
                <small>{'一二三四五六日'[i]}</small>
                <i className={(data.dayStats.some(r => r.day === d && r.activeMinutes > 0) ? 'active ' : '') + (day === d ? 'current' : '')} title={d} />
              </div>)}</div>
          </section>
          <section className="panel">
            <Layers3 className="feature-icon" />
            <h3>下一個里程碑</h3>
            {milestone ? <Link to={'/module/' + milestone.id}>{milestone.title} →</Link> : <Link to="/projects">整理你的作品集 →</Link>}
          </section>
        </aside>
      </div>
      {modal === 'swap' && <Modal title={swap ? '替換成哪一堂？' : '再選一堂'} close={() => setModal('')}>
        {choices.map(l => <button className="list-button" key={l.id} onClick={async () => {
        await editPlan(day, x => ({
          ...x,
          items: swap ? x.items.map(i => i === swap ? l.id : i) : [...x.items, l.id]
        }));
        setModal('');
      }}>
          <BookOpen size={16} />
          {l.title}
          <small>{l.minutes} 分</small>
        </button>)}
        {!choices.length && <p>這個位置沒有其他可選的課。可以保留原課程，或從學習地圖選課。</p>}
      </Modal>}
      {(modal==='tomorrow'||modal==='close')&&<CloseDay closing={modal==='close'} choice={tom} setChoice={setTom} budget={tb} setBudget={setTb} close={dismiss} save={saveTomorrow}/>}
    </>;
}
