import {catalogIndex} from '../../content/catalog';
import { Link } from 'react-router-dom';
import { useWork } from '../../ui/context';
import { Pill, Projection, Title } from '../../ui/common';
import { Heatmap, Forecast } from '../../ui/charts';
import { accuracy, streaks } from '../../lib/metrics';
import { shiftDay } from '../../lib/clock';
import { moduleDone } from '../../lib/planner';
export default function Stats() {
  const {
      cat,
      data,
      day,
      done
    } = useWork(),
    st = streaks(data.dayStats, day),
    pct = accuracy(data.reviewLogs.filter(l => l.day >= shiftDay(day, -29) && l.day <= day));
  return <>
      <Title k="學習觀察　 /　進度統計" title="統計" sub="看長期的足跡，不只看今天的一格。" />
      <div className="panel metrics">
        <strong>
          {st.current}
          <small>目前連續天數</small>
        </strong>
        <strong>
          {st.longest}
          <small>最長連續天數</small>
        </strong>
        <strong>
          {(data.dayStats.reduce((n, s) => n + s.activeMinutes, 0) / 60).toFixed(1)}
          <small>總學習時數</small>
        </strong>
        <strong>
          {pct === null ? '—' : pct + '%'}
          <small>近 30 天記得率</small>
        </strong>
      </div>
      <Heatmap />
      <Forecast />
      <section className="panel">
        <h2>各路線完成堂數</h2>
        <div className="track-grid">{catalogIndex(cat).tracks.map(t => <div key={t.id}>
            <Pill track={t.id} />
            <strong className="figure">{data.lessonProgress.filter(p => p.status === 'done' && cat.modules.find(m => m.id === cat.lessons.find(l => l.id === p.lessonId)?.module)?.track === t.id).length}</strong>
          </div>)}</div>
      </section>
      <div className="panel">
        <h2>模組熟練度</h2>
        <p>進度計入已完成與已跳過的課程；熟練卡是已進入長期間隔的知識點。</p>
        {catalogIndex(cat).ordered.map(m => {
        const ls = (catalogIndex(cat).rows.get(m.id)??[]).map(r=>r.lesson),
          cs = data.cards.filter(c => ls.some(l => l.id === c.lessonId));
        return <div className="row" key={m.id}>
          <Link to={'/module/' + m.id}>{m.title}</Link>
          <small>{ls.filter(l => l.status==='ready' && done.has(l.id)).length} / {ls.length} 堂{ls.some(l=>l.status!=='ready')?' · 另有 '+ls.filter(l=>l.status!=='ready').length+' 堂內容準備中':''} · 熟練卡 {cs.filter(c => c.card.state === 2).length} / {cs.length}</small>
        </div>;
      })}
      </div>
      <h2 className="sub-title">求職準備度</h2>
      <div className="card-grid">{cat.roles.map(r => {
        const has = (ms: string[]) => ms.length > 0 && ms.every(id => moduleDone(id, cat, done)),
          sum = r.skills.reduce((n, x) => n + x.weight, 0),
          pct = Math.round(100 * r.skills.reduce((n, x) => n + (has(x.modules) ? x.weight : 0), 0) / (sum || 1));
        return <section className="panel" key={r.id}>
          <h3>{r.title}</h3>
          <strong className="figure">{pct}%</strong>
          <div className="progress-track">
            <i style={{
              width: pct + '%'
            }} />
          </div>
          <details>
            <summary>查看技能與權重</summary>
            {r.skills.map(x => <p key={x.id}>{has(x.modules) ? '已涵蓋' : '待完成'} · {x.title}（權重 {x.weight}）</p>)}
          </details>
        </section>;
      })}</div>
      <Projection />
    </>;
}
