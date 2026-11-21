import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload } from 'lucide-react';
import { useWork } from '../../ui/context';
import { Amount, ChoiceFields, Modal, NumberField, Select, Title, focuses } from '../../ui/common';
import { exportAll, validate, resetProgress, settingsUpdate, type Snapshot } from '../../db';
import { restoreUser, sync } from '../../db/sync';
export default function SettingsPage() {
  const {
      s,
      cat,
      notify
    } = useWork(),
    file = useRef<HTMLInputElement>(null),
    [snap, preview] = useState<Snapshot>(),
    [reset, ask] = useState(false),
    [word, type] = useState(''),
    [error, fail] = useState(''),
    [busy, setBusy] = useState(false);
  async function download() {
    const obj = await exportAll(),
      url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], {
        type: 'application/json'
      })),
      a = document.createElement('a');
    a.href = url;
    a.download = 'stackway-' + obj.exportedAt.slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  const labels = {
    settings: '設定',
    lessonProgress: '課程紀錄',
    cards: '知識點卡',
    reviewLogs: '複習紀錄',
    dayPlans: '每日計畫',
    dayStats: '每日統計',
    practice: '實作筆記',
    projects: '作品',
    interviewAnswers: '面試回答'
  };
  return <>
      <Title k="工作桌　 /　偏好設定" title="設定" sub="依自己的習慣調整學習節奏與閱讀空間。" />
      <section className="panel settings">
        <h2>學習</h2>
        <h3>每天預設份量</h3>
        <Amount value={s.budget} onChange={budget => settingsUpdate({
        budget
      })} />
        <div className="fields">
          <Select label="專注路線" value={s.focus} options={focuses} onChange={focus => settingsUpdate({
          focus
        })} />
          <Select label="雙軌比例（全端：AI Infra）" value={s.ratio} options={{
          '1:1': '1：1',
          '2:1': '2：1',
          '1:2': '1：2'
        }} onChange={ratio => settingsUpdate({
          ratio
        })} />
        </div>
        <div className="fields">
          <NumberField label="每日複習上限（個）" value={s.cap} min={1} max={999} onChange={cap => settingsUpdate({
          cap
        })} />
          <NumberField label="學習日從幾點開始（時）" value={s.dayStartHour} min={0} max={23} onChange={dayStartHour => settingsUpdate({
          dayStartHour
        })} />
        </div>
        <h3>預設複習安排</h3>
        <ChoiceFields value={{
        format: s.format,
        scope: s.scope,
        tracks: s.tracks
      }} onChange={v => settingsUpdate(v)} />
        <h3>混合方式的相對權重</h3>
        <div className="fields">{['閃卡回想', '選擇題', '面試問答'].map((label, i) => <NumberField key={label} label={label} value={s.weights[i]} min={0} max={100} onChange={n => {
          const weights: [number, number, number] = [...s.weights];
          weights[i] = n;
          if (weights.some(v => v > 0)) void settingsUpdate({
            weights
          });else notify('至少保留一種複習方式。');
        }} />)}</div>
        <NumberField label="目標保留率（%）" value={Math.round(100 * s.retention)} min={80} max={95} onChange={n => settingsUpdate({
        retention: n / 100
      })} />
        <label className="toggle"><input type="checkbox" checked={s.quizSchedule} onChange={e => settingsUpdate({
          quizSchedule: e.target.checked
        })} /> 小測驗結果影響第一次排程</label>
        <Link to="/onboarding">重新執行首次設定 →</Link>
      </section>
      <section className="panel settings">
        <h2>外觀</h2>
        <div className="fields">
          <Select label="主題" value={s.theme} options={{
          system: '跟隨系統',
          light: '淺色',
          dark: '深色'
        }} onChange={theme => settingsUpdate({
          theme
        })} />
          <Select label="閱讀字級" value={s.font} options={{
          small: '小',
          medium: '中',
          large: '大'
        }} onChange={font => settingsUpdate({
          font
        })} />
          <Select label="閱讀寬度" value={s.width} options={{
          narrow: '窄',
          standard: '標準',
          wide: '寬'
        }} onChange={width => settingsUpdate({
          width
        })} />
        </div>
        <label className="toggle"><input type="checkbox" checked={s.reduceMotion} onChange={e => settingsUpdate({
          reduceMotion: e.target.checked
        })} /> 減少動態效果</label>
      </section>
      <section className="panel">
        <h2>資料</h2>
        <p>
          <b>{sync.label}</b>
          <br />
          {sync.folder || '目前使用瀏覽器儲存空間。使用本機啟動檔，可額外儲存到資料夾。'}
        </p>
        <div className="actions">
          <button onClick={download}><Download size={15} /> 匯出備份</button>
          <button onClick={() => file.current?.click()}><Upload size={15} /> 匯入備份</button>
          <input hidden type="file" ref={file} accept=".json,application/json" onChange={async e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            preview(validate(JSON.parse(await f.text())));
            fail('');
          } catch {
            fail('備份格式不符，未更動原本的進度。');
          }
        }} />
          <button className="ghost danger" onClick={() => {
          type('');
          ask(true);
        }}>重設進度</button>
        </div>
        {error && <p role="alert">{error}</p>}
      </section>
      <section className="panel">
        <h2>關於棧道</h2>
        <Link to="/help">閱讀使用說明 →</Link>
        <p>程式版本 1.0.0 · 教材版本 <code>{cat.version}</code></p>
        <small>{cat.modules.length} 個模組 · {cat.lessons.length} 堂課 · {cat.concepts.length} 個知識點 · {cat.questions.length} 道面試問題</small>
      </section>
      {snap && <Modal title="匯入前確認" close={() => preview(undefined)}>
        <p>這份備份會取代目前所有資料，不會合併。需要保留的話，請先匯出。</p>
        <div className="counts">{(Object.keys(labels) as (keyof typeof labels)[]).map(k => <small key={k}>{labels[k]}：{snap.data[k].length}</small>)}</div>
        <button className="primary" disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          await restoreUser(snap);
          preview(undefined);
          notify('已從備份還原。');
        } catch {
          fail('匯入失敗，原有資料未被取代。');
        } finally {
          setBusy(false);
        }
      }}>取代並還原</button>
      </Modal>}
      {reset && <Modal title="重設所有學習進度？" close={() => ask(false)}>
        <p>課程、複習與個人筆記都會清除，學習與外觀設定會保留。建議先匯出備份。</p>
        <label className="field">輸入「重設」以確認<input value={word} onChange={e => type(e.target.value)} /></label>
        <button disabled={word !== '重設' || busy} onClick={async () => {
        setBusy(true);
        await resetProgress();
        ask(false);
        setBusy(false);
        notify('進度已重設。');
      }}>確定重設</button>
      </Modal>}
    </>;
}
