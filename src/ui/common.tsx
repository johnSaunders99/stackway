import {catalogIndex} from '../content/catalog';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Mountain, SlidersHorizontal } from 'lucide-react';
import type { Budget, Choice, Focus, Format, Scope } from '../lib/model';
import type { TrackId } from '../content/types';
import { useWork } from './context';
import { projection } from '../lib/planner';
export const formats: Record<Format, string> = {
  flashcard: '閃卡回想',
  quiz: '選擇題',
  interview: '面試問答',
  'hands-on': '動手練習',
  mixed: '混合'
};
export const scopes: Record<Scope, string> = {
  due: '全部到期',
  yesterday: '只複習昨天學的',
  tracks: '指定路線',
  weak: '弱點優先'
};
export const focuses: Record<Focus, string> = {
  recommended: '跟著建議',
  fullstack: '全端',
  aiinfra: 'AI Infra',
  dual: '雙軌'
};
export const levels = ['', '入門', '基礎', '進階', '面試級'];
export function Title({
  k,
  title,
  sub,
  action
}: {
  k: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return <header className="page-title">
      <div>
        <div className="eyebrow">
          <i />
          {k}
        </div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </header>;
}
export function Empty({
  children,
  to = '/map',
  action = '打開學習地圖'
}: {
  children: ReactNode;
  to?: string;
  action?: string;
}) {
  return <div className="empty">
      <Mountain size={23} />
      <p>{children}</p>
      <Link to={to}>{action} <ArrowRight size={14} /></Link>
    </div>;
}
export function Pill({
  track
}: {
  track: TrackId;
}) {
  const {
    cat
  } = useWork();
  const t = cat.tracks.find(t => t.id === track);
  return <span className={'pill tone-' + track}>
      <i />
      {t?.short}
    </span>;
}
export function Select<T extends string>({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return <label className="field">
      {label}
      <select value={value} onChange={e => onChange(e.target.value as T)}>{Object.entries<string>(options).map(([v, s]) => <option key={v} value={v}>{s}</option>)}</select>
    </label>;
}
export function Seg<T extends string>({
  value,
  options,
  onChange,
  label
}: {
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
  label: string;
}) {
  return <div className="seg" role="group" aria-label={label}>{Object.entries<string>(options).map(([v, t]) => <button type="button" key={v} aria-pressed={value === v} onClick={() => onChange(v as T)}>{t}</button>)}</div>;
}
export function Amount({
  value,
  onChange
}: {
  value: Budget;
  onChange: (v: Budget) => void;
}) {
  const [custom, set] = useState(false);
  const vals = value.mode === 'time' ? [15, 30, 45, 60, 90, 120] : [1, 2, 3, 4, 5];
  return <div className="amount">
      <Seg label="計畫單位" value={value.mode} options={{
      time: '按時間',
      count: '按堂數'
    }} onChange={mode => {
      set(false);
      onChange({
        mode,
        value: mode === 'time' ? 60 : 2
      });
    }} />
      <div className="chips">
        {vals.map(n => <button key={n} aria-pressed={!custom && n === value.value} onClick={() => {
        set(false);
        onChange({
          ...value,
          value: n
        });
      }}>
          {n}
          <small>{value.mode === 'time' ? ' 分' : ' 堂'}</small>
        </button>)}
        <button aria-pressed={custom || !vals.includes(value.value)} onClick={() => set(true)}>自訂</button>
      </div>
      {(custom || !vals.includes(value.value)) && <NumberField label={value.mode === 'time' ? '自訂分鐘' : '自訂堂數'} value={value.value} min={1} max={value.mode === 'time' ? 1440 : 100} onChange={n => onChange({
      ...value,
      value: n
    })} />}
    </div>;
}
export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  const [buf, set] = useState(String(value));
  useEffect(() => set(String(value)), [value]);
  return <label className="field">
      {label}
      <input type="number" value={buf} min={min} max={max} step={step} onChange={e => {
      set(e.target.value);
      if (e.target.value && e.target.validity.valid) onChange(e.target.valueAsNumber);
    }} onBlur={() => set(String(value))} />
    </label>;
}
export function ChoiceFields({
  value,
  onChange
}: {
  value: Choice;
  onChange: (v: Choice) => void;
}) {
  const {
    cat
  } = useWork();
  return <div>
      <div className="fields">
        <Select label="複習方式" value={value.format} options={formats} onChange={format => onChange({
        ...value,
        format
      })} />
        <Select label="複習範圍" value={value.scope} options={scopes} onChange={scope => onChange({
        ...value,
        scope
      })} />
      </div>
      {value.scope === 'tracks' && <div className="checks">{catalogIndex(cat).tracks.map(t => <label key={t.id}>
          <input type="checkbox" checked={value.tracks.includes(t.id)} onChange={e => onChange({
          ...value,
          tracks: e.target.checked ? [...value.tracks, t.id] : value.tracks.filter(x => x !== t.id)
        })} />
          {t.short}
        </label>)}</div>}
    </div>;
}
export function Modal({
  title,
  children,
  close
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return <dialog ref={ref} onCancel={close} aria-labelledby={id}>
      <div className="between">
        <h2 id={id}>{title}</h2>
        <button className="ghost" onClick={close}>關閉</button>
      </div>
      {children}
    </dialog>;
}
export function Projection({
  budget,
  skipped = []
}: {
  budget?: Budget;
  skipped?: string[];
}) {
  const {
      cat,
      done,
      s,
      day
    } = useWork(),
    b = budget ?? s.budget,
    p = projection(cat, new Set([...done, ...cat.lessons.filter(l => skipped.includes(l.module)).map(l => l.id)]), b, day);
  return <div className="projection">
      <Mountain />
      <div>
        <b>{p.days ? `預計 ${p.end.slice(0, 4)} 年 ${Number(p.end.slice(5, 7))} 月學完核心內容` : '已走完目前的核心內容'}</b>
        <small>每天 {b.value} {b.mode === 'count' ? '堂' : '分鐘，保留三成時間複習'} · 依現有課程估算</small>
      </div>
    </div>;
}
export function CheckList({
  list,
  checked,
  toggle
}: {
  list: string[];
  checked: boolean[];
  toggle: (i: number) => void;
}) {
  return <div className="checks vertical">{list.map((x, i) => <label key={i}>
        <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)} />
        {x}
      </label>)}</div>;
}
export const mark = <Check size={16} />,
  sliders = <SlidersHorizontal size={16} />;
