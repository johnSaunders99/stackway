import 'fake-indexeddb/auto';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { db, exportAll, settingsUpdate, type Snapshot } from '../src/db';
import { startSync, sync } from '../src/db/sync';
import { defaults } from '../src/lib/model';
let stop: (() => void) | undefined;
const blank = async () => db.transaction('rw', db.tables, async () => {
  for (const t of db.tables) await t.clear();
});
let writes: Snapshot[] = [],
  doc: EventTarget & {
    hidden: boolean;
  };
function endpoint(remote: unknown = null) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, opts: RequestInit = {}) => {
    if (url === '/api/health') return Response.json({
      ok: true,
      dataDir: '隔離測試目錄'
    });
    if (opts.method === 'PUT') {
      writes.push(JSON.parse(String(opts.body)));
      return Response.json({
        ok: true
      });
    }
    return remote === null ? new Response(null, {
      status: 404
    }) : Response.json(remote);
  }));
}
async function snapshot(stamp: string) {
  const base = await exportAll();
  base.data.settings = [{
    ...defaults,
    modifiedAt: stamp,
    focus: 'aiinfra',
    onboarded: true
  }];
  return base;
}
beforeEach(async () => {
  writes = [];
  await blank();
  Object.assign(sync, {
    folder: '',
    label: '只存在瀏覽器',
    notice: ''
  });
  doc = Object.assign(new EventTarget(), {
    hidden: false
  });
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', {
    confirm: vi.fn(() => true)
  });
});
afterEach(() => {
  stop?.();
  stop = undefined;
  vi.unstubAllGlobals();
});
it('static hosting leaves browser-only saving enabled without a state request', async () => {
  const f = vi.fn(async () => new Response('<html>'));
  vi.stubGlobal('fetch', f);
  stop = await startSync();
  expect(sync.label).toBe('只存在瀏覽器');
  expect(f).toHaveBeenCalledTimes(1);
});
it('an empty DB restores the disk snapshot automatically without prompting', async () => {
  endpoint(await snapshot('2026-01-01T10:00:00Z'));
  stop = await startSync();
  expect(window.confirm).not.toHaveBeenCalled();
  expect((await db.settings.get('main'))?.focus).toBe('aiinfra');
  expect(sync.notice).toContain('還原');
});
it.each([true, false])('only a newer disk edit offers restore; accept=%s', async accept => {
  await settingsUpdate({
    focus: 'fullstack'
  });
  const spy = vi.fn(() => accept);
  vi.stubGlobal('window', {
    confirm: spy
  });
  endpoint(await snapshot('2099-01-01T00:00:00Z'));
  stop = await startSync();
  expect(spy).toHaveBeenCalledOnce();
  expect((await db.settings.get('main'))?.focus).toBe(accept ? 'aiinfra' : 'fullstack');
});
it('corrupt disk data never triggers a write or destructive restore', async () => {
  endpoint({
    data: {}
  });
  stop = await startSync();
  expect(sync.notice).toContain('暫停自動覆寫');
  await settingsUpdate({
    focus: 'dual'
  });
  expect(writes).toEqual([]);
});
it('coalesces edits and writes the latest settings after the debounce', async () => {
  endpoint();
  stop = await startSync();
  await settingsUpdate({
    focus: 'fullstack'
  });
  await settingsUpdate({
    focus: 'dual'
  });
  expect(writes).toHaveLength(0);
  await vi.waitFor(() => expect(writes).toHaveLength(1), {
    timeout: 4500,
    interval: 100
  });
  expect(writes[0].data.settings[0].focus).toBe('dual');
  expect(sync.label).toBe('已存到本機');
}, 7000);
it('flushes a pending save when the document becomes hidden', async () => {
  endpoint();
  stop = await startSync();
  await settingsUpdate({
    cap: 12
  });
  doc.hidden = true;
  doc.dispatchEvent(new Event('visibilitychange'));
  await vi.waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0].data.settings[0].cap).toBe(12);
});
