import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, NavLink, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarDays, ChartNoAxesColumnIncreasing, Ellipsis, Flame, FolderOpen, Map as MapIcon, MessageSquare, Repeat2, Settings as Gear } from 'lucide-react';
import { loadCatalog } from './content/loader';
import type { Catalog } from './content/types';
import { defaults } from './lib/model';
import { finished } from './lib/planner';
import { now, onClock, overridden, studyDay } from './lib/clock';
import { streaks } from './lib/metrics';
import { db, readData } from './db';
import { startSync, sync, observeSync } from './db/sync';
import { activity } from './db/activity';
import { Context } from './ui/context';
import { Modal } from './ui/common';
import Today from './features/today/Today';
import Onboarding from './features/onboarding/Onboarding';
import { MapPage, ModulePage } from './features/map/Map';
import Lesson from './features/lesson/Lesson';
import { ReviewPage, Session } from './features/review/Review';
import Bank from './features/bank/Bank';
import Projects from './features/projects/Projects';
import Stats from './features/stats/Stats';
import Help from './features/help/Help';
import Settings from './features/settings/Settings';
import './styles/tokens.css';
import './styles/app.css';
import './styles/m2.css';
const links = [['/today', '今天', CalendarDays], ['/map', '學習地圖', MapIcon], ['/review', '複習', Repeat2], ['/bank', '題庫', MessageSquare], ['/projects', '作品集', FolderOpen], ['/stats', '統計', ChartNoAxesColumnIncreasing], ['/settings', '設定', Gear]] as const;
function Mark() {
  return <svg viewBox="0 0 36 36" width="35" height="35" aria-hidden="true">
      <rect x="2" y="23" width="20" height="5" rx="1" />
      <rect x="8" y="15" width="20" height="5" rx="1" />
      <rect x="14" y="7" width="20" height="5" rx="1" />
    </svg>;
}
function App({
  cat,
  debug
}: {
  cat: Catalog;
  debug: boolean;
}) {
  const data = useLiveQuery(readData, []),
    s = data?.settings[0] ?? defaults,
    clockHour = useRef(s.dayStartHour);
  clockHour.current = s.dayStartHour;
  const [tick, refresh] = useState(0),
    [toast, notify] = useState(''),
    [sheet, show] = useState(''),
    loc = useLocation(),
    nav = useNavigate(),
    day = studyDay(now(), s.dayStartHour),
    session = s.onboarded && loc.pathname === '/session',
    lesson = loc.pathname.startsWith('/lesson/'),
    active = links.find(([p]) => p === loc.pathname),
    mins = Math.round(data?.dayStats.find(x => x.day === day)?.activeMinutes ?? 0);
  useEffect(() => {
    const update = () => refresh(n => n + 1),
      t = setInterval(update, 30000),
      off = onClock(update),
      obs = observeSync(update);
    if (debug) void import('./debug').then(m => m.installDebug(cat, () => clockHour.current));
    return () => {
      off();
      obs();
      clearInterval(t);
    };
  }, [cat, debug]);
  useEffect(() => {
    if (data && s.onboarded) return activity(() => clockHour.current);
  }, [!!data, s.onboarded]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => notify(''), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  useLayoutEffect(() => {
    const root = document.documentElement;
    Object.assign(root.dataset, {
      theme: s.theme,
      font: s.font,
      width: s.width,
      motion: s.reduceMotion ? 'reduce' : 'normal'
    });
  }, [s.theme, s.font, s.width, s.reduceMotion]);
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    show('');
    document.title = (active?.[1] ?? (loc.pathname === '/help' ? '使用說明' : lesson ? (cat.lessons.find(l=>'/lesson/'+l.id===loc.pathname)?.title??'課程筆記') : session ? '複習練習' : '學習手帳')) + ' · 棧道';
  }, [loc.pathname, loc.search]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) || document.querySelector('dialog[open]')) return;
      if (e.key === '?') {
        e.preventDefault();
        show('keys');
      }
      if (e.key === '/' && !session && s.onboarded) {
        e.preventDefault();
        nav('/map');
        requestAnimationFrame(() => document.getElementById('map-search')?.focus());
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [nav, session, s.onboarded]);
  if (!data) return <p className="boot">正在打開學習手帳…</p>;
  const done = finished(data.lessonProgress),
    st = streaks(data.dayStats, day);
  return <Context.Provider value={{
    cat,
    data,
    s,
    day,
    done,
    notify
  }}>
      {!session && <>
        <aside className="sidebar">
          <Link className="logo" to="/today">
            <Mark />
            <span>棧道 <small>Stackway</small></span>
          </Link>
          <div className="nav-label">學習工作桌</div>
          <nav>{links.map(([p, t, I]) => <NavLink key={p} to={p} className={({
            isActive
          }) => isActive || p === '/map' && (lesson || loc.pathname.startsWith('/module/')) ? 'active' : ''}>
              <I />
              {t}
            </NavLink>)}</nav>
          <div className="side-bottom">
            <div className="side-metrics">
              <div><Flame size={16} /> 連續 {st.current} 天<small>今天已學 {mins} 分鐘</small></div>
              <svg viewBox="0 0 40 40" width="40" height="40" aria-label="今日學習時間">
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--brand)" strokeWidth="3" pathLength="100" strokeDasharray={Math.min(100, 100 * mins / (s.budget.mode === 'time' ? s.budget.value : 60)) + ' 100'} transform="rotate(-90 20 20)" />
              </svg>
            </div>
            <Link className="save-chip" to="/settings">
              <i />
              {sync.label}
            </Link>
          </div>
        </aside>
        <nav className="bottom-nav">
          {[links[0], links[1], links[2], links[5]].map(([p, t, I]) => <NavLink key={p} to={p}>
            <I />
            {p === '/map' ? '地圖' : t}
          </NavLink>)}
          <button onClick={() => show('more')}><Ellipsis />更多</button>
        </nav>
      </>}
      <main className={session ? 'focus-main' : 'main'}>
        <div className={session ? '' : 'workspace'}>
          {sync.notice && <div className="notice">
            {sync.notice}
            <button aria-label="關閉通知" onClick={() => {
            sync.notice = '';
            refresh(tick + 1);
          }}>關閉</button>
          </div>}
          {!s.onboarded && loc.pathname !== '/help' ? <Onboarding /> : <Routes>
            <Route path="/help" element={<Help />} />
            <Route path="/today" element={<Today key={day} />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/module/:id" element={<ModulePage />} />
            <Route path="/lesson/:id" element={<Lesson key={loc.pathname} />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/session" element={<Session key={day + loc.search} />} />
            <Route path="/bank" element={<Bank />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>}
        </div>
      </main>
      {sheet && <Modal title={sheet === 'keys' ? '鍵盤快速鍵' : '更多功能'} close={() => show('')}>{sheet === 'keys' ? <div className="shortcut-list">{[['/', '搜尋學習地圖'], ['?', '查看快速鍵'], ['Space / Enter', '顯示複習答案'], ['1–4', '為回想評分'], ['A–E / 1–5', '選擇答案'], ['Ctrl+Z', '復原最後評分'], ['Esc', '離開練習或關閉視窗']].map(([k, v]) => <div className="row" key={k}>
            <kbd>{k}</kbd>
            {v}
          </div>)}<Link to="/help" onClick={() => show('')}>閱讀使用說明 →</Link></div> : links.map(([p, t, I]) => <Link key={p} className="list-button" to={p} onClick={() => show('')}>
          <I size={16} />
          {t}
        </Link>)}</Modal>}
      {debug && overridden() && <div className="debug-chip">除錯 · 模擬日期 {day}</div>}
      <div className={'toast' + (toast ? ' visible' : '')} role="status">{toast}</div>
    </Context.Provider>;
}
async function boot() {
  const root = createRoot(document.getElementById('root')!);
  try {
    const p = new URLSearchParams(location.search).get('debug');
    if (p === '1') localStorage.setItem('stackwayDebug', '1');else if (p === '0') localStorage.removeItem('stackwayDebug');
    const debug = localStorage.getItem('stackwayDebug') === '1';
    const [cat] = await Promise.all([loadCatalog(), db.open().then(startSync)]);
    root.render(<HashRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <App cat={cat} debug={debug} />
    </HashRouter>);
  } catch {
    root.render(<section className="boot panel">
      <h1>學習手帳未能開啟</h1>
      <p>請確認瀏覽器允許本機儲存，並已建置課程內容。</p>
      <button onClick={() => location.reload()}>重新開啟</button>
    </section>);
  }
}
void boot();
