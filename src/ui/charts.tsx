import { useWork } from './context';
import { forecast } from '../lib/metrics';
import { shiftDay } from '../lib/clock';
export function Forecast() {
  const {
      data,
      s,
      day
    } = useWork(),
    xs = forecast(data.cards, day, s.dayStartHour),
    max = Math.max(1, ...xs.map(x => x.count));
  return <section className="panel chart">
      <div className="eyebrow">複習節奏</div>
      <h2>未來 14 天</h2>
      <div className="chart-scroll">
        <svg viewBox="0 0 620 148" role="img" aria-label={'未來十四天到期數量：' + xs.map(x => x.count).join('、')}>
          {[40, 75, 110].map(y => <path key={y} d={'M0 ' + y + 'H620'} stroke="var(--border)" />)}
          {xs.map((x, i) => {
          const h = 74 * x.count / max;
          return <g key={x.day}>
            <title>{x.day + '：' + x.count + ' 個到期'}</title>
            <rect x={i * 44 + 8} y={110 - h} width="25" height={Math.max(2, h)} rx="3" fill={i === 0 ? 'var(--brand)' : 'var(--chart-fill)'} />
            <text x={i * 44 + 20} y={101 - h} textAnchor="middle">{x.count}</text>
            <text x={i * 44 + 20} y="134" textAnchor="middle">{i === 0 ? '今天' : x.day.slice(5).replace('-', '/')}</text>
          </g>;
        })}
        </svg>
      </div>
      <small>今天包含先前未複習的知識點。</small>
    </section>;
}
export function Heatmap() {
  const {
      day,
      data
    } = useWork(),
    last = shiftDay(day, 6 - (new Date(day + 'T12:00:00').getDay() + 6) % 7),
    first = shiftDay(last, -181);
  return <div className="panel chart">
      <div className="eyebrow">學習足跡</div>
      <h2>最近 26 週</h2>
      <svg viewBox="0 0 552 166" role="img" aria-label="近二十六週每日學習分鐘熱圖">{[0,2,4].map((r,i)=><text key={r} x="1" y={34+r*20}>{['一','三','五'][i]}</text>)}{Array.from({length:26},(_,w)=>{const d=shiftDay(first,w*7);return w===0||d.slice(0,7)!==shiftDay(d,-7).slice(0,7)?<text key={w} textAnchor={w===25?'end':'start'} x={29+20*w} y="13">{Number(d.slice(5,7))}月</text>:null})}{Array.from({
        length: 182
      }, (_, i) => {
        const d = shiftDay(first, i),
          n = data.dayStats.find(s => s.day === d)?.activeMinutes ?? 0;
        return <rect key={d} x={Math.floor(i / 7) * 20 + 28} y={i % 7 * 20 + 22} width="16" height="16" rx="3" fill={n ? 'var(--brand)' : 'var(--border)'} opacity={n ? Math.min(1, .3 + n / 100) : d > day ? .25 : .75}>
          <title>{d + ' · ' + Math.round(n) + ' 分鐘'}</title>
        </rect>;
      })}</svg>
      <div className="between">
        <small>{first} — {day}</small>
        <small>色階越深，學習時間越長</small>
      </div>
    </div>;
}
