import Dexie from 'dexie';
import { db, exportAll, importAll, settingsUpdate, validate, realStamp, type Snapshot } from './index';
import { defaults } from '../lib/model';
type Status = {
  label: string;
  folder: string;
  notice: string;
};
export const sync: Status = {
  label: '只存在瀏覽器',
  folder: '',
  notice: ''
};
const listeners = new Set<() => void>();
function update(v: Partial<Status>) {
  Object.assign(sync, v);
  listeners.forEach(f => f());
}
export function observeSync(f: () => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}
// Compare the last actual edit, not the time somebody downloaded a copy.
const stamp = (snapshot: Snapshot) => snapshot.data.settings[0]?.modifiedAt || snapshot.exportedAt;
export async function startSync() {
  let folder: string;
  try {
    const r = await fetch('/api/health', {
      cache: 'no-store'
    });
    if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) return;
    const health = await r.json();
    if (health.ok !== true || typeof health.dataDir !== 'string') return;
    folder = health.dataDir;
  } catch {
    return;
  }
  update({
    folder,
    label: '比對存檔中'
  });
  try {
    const r = await fetch('/api/state', {
      cache: 'no-store'
    });
    const local = await exportAll();
    const empty = Object.values(local.data).every(rows => !rows.length);
    let remote: Snapshot | undefined;
    if (r.ok) remote = validate(await r.json());else if (r.status !== 404) throw Error('無法確認存檔狀態');
    let dirty = !empty && (!remote || stamp(local) > stamp(remote));
    if (remote && (empty || stamp(remote) > stamp(local))) {
      if (empty || window.confirm('本機存檔比瀏覽器資料新，要還原嗎？取消則保留瀏覽器資料。')) {
        await importAll(remote);
        update({
          notice: '已從本機存檔還原學習紀錄。'
        });
      } else {
        await settingsUpdate({});
        dirty = true;
      }
    }
    let busy = false,
      stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function later(delay: number) {
      clearTimeout(timer);
      if (!stopped) timer = setTimeout(flush, delay);
    }
    function changed(parts: Record<string, unknown>) {
      if (!Object.keys(parts).some(k => k.startsWith('idb://' + db.name + '/'))) return;
      dirty = true;
      update({
        label: '等待儲存'
      });
      later(document.hidden ? 0 : 3000);
    }
    async function flush() {
      clearTimeout(timer);
      if (stopped || busy || !dirty) return;
      busy = true;
      dirty = false;
      let retry = false;
      try {
        const snapshot = await exportAll();
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(snapshot)
        });
        if (!res.ok) throw Error('寫入失敗');
        update({
          label: dirty ? '等待儲存' : '已存到本機'
        });
      } catch {
        dirty = retry = true;
        update({
          label: '本機存檔未更新',
          notice: '瀏覽器仍保留進度。請確認本機伺服器正在執行。'
        });
      } finally {
        busy = false;
        if (dirty) later(retry ? 5000 : document.hidden ? 0 : 3000);
      }
    }
    const onVisibility = () => {
      if (document.hidden) void flush();
    };
    Dexie.on('storagemutated', changed);
    document.addEventListener('visibilitychange', onVisibility);
    if (dirty) {
      update({
        label: '等待儲存'
      });
      later(3000);
    } else update({
      label: remote ? '已存到本機' : '本機儲存就緒'
    });
    return () => {
      stopped = true;
      clearTimeout(timer);
      Dexie.on('storagemutated').unsubscribe(changed);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  } catch {
    // Never auto-write if a read failed: an unreadable file is not an empty file.
    update({
      label: '僅儲存於瀏覽器',
      notice: '無法讀取本機存檔，已暫停自動覆寫。可先在設定匯出備份。'
    });
  }
}
export function restoreUser(snapshot: Snapshot) {
  const s = snapshot.data.settings[0] ?? defaults;
  return importAll({
    ...snapshot,
    data: {
      ...snapshot.data,
      settings: [{
        ...s,
        modifiedAt: realStamp()
      }]
    }
  });
}
