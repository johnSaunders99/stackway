import { beforeEach, afterEach, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createServer, listen } from '../server/serve.mjs';
import { scratch } from './scratch.mjs';
let box, dir, dist, server, url, sim;
const payload = v => ({
  app: 'stackway',
  schemaVersion: 1,
  data: {
    settings: [{
      dayStartHour: 4
    }],
    value: v
  }
});
const put = (v, headers = {}) => fetch(url + '/api/state', {
  method: 'PUT',
  headers: {
    'content-type': 'application/json',
    ...headers
  },
  body: JSON.stringify(payload(v))
});
beforeEach(async () => {
  box = scratch();
  dir = path.join(box.dir, 'isolated-state');
  dist = path.join(box.dir, 'dist');
  await fs.mkdir(dist);
  await fs.writeFile(path.join(dist, 'index.html'), 'study desk');
  await fs.writeFile(path.join(dist, 'entry.js'), 'void 0');
  sim = new Date('2026-11-20T12:00:00');
  server = createServer({
    dist,
    dataDir: dir,
    limit: 512,
    clock: () => sim
  });
  const addr = await listen(server, 0);
  url = 'http://127.0.0.1:' + addr.port;
});
afterEach(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  box.clean();
});
it('binds loopback only and reports its configured data directory', async () => {
  expect(server.address().address).toBe('127.0.0.1');
  expect(await (await fetch(url + '/api/health')).json()).toEqual({
    ok: true,
    dataDir: dir
  });
  expect((await fetch(url + '/api/state')).status).toBe(404);
  await expect(fs.access(dir)).rejects.toThrow();
});
it('serves the SPA fallback and real MIME types, but not missing scripts', async () => {
  expect(await (await fetch(url + '/study')).text()).toBe('study desk');
  expect((await fetch(url + '/entry.js')).headers.get('content-type')).toBe('text/javascript');
  expect((await fetch(url + '/missing.js')).status).toBe(404);
});
it('atomically replaces state and keeps the first daily checkpoint', async () => {
  expect((await put(1)).status).toBe(200);
  expect((await put(2)).status).toBe(200);
  expect(await (await fetch(url + '/api/state')).json()).toEqual(payload(2));
  expect(JSON.parse(await fs.readFile(path.join(dir, 'backups', '2026-11-20.json'), 'utf8'))).toEqual(payload(1));
  expect((await fs.readdir(dir)).sort()).toEqual(['backups', 'state.json']);
});
it('keeps 30 backup days and honours the study-day boundary', async () => {
  for (let i = 0; i < 32; i++) {
    sim = new Date(2026, 0, i + 1, 3);
    expect((await put(i)).status).toBe(200);
  }
  const files = await fs.readdir(path.join(dir, 'backups'));
  expect(files).toHaveLength(30);
  expect(files.sort()[0]).toBe('2026-01-02.json');
  expect(files.at(-1)).toBe('2026-01-31.json');
});
it('rejects a body over the limit without replacing the good state', async () => {
  await put('keep');
  expect((await put('z'.repeat(600))).status).toBe(413);
  expect(await (await fetch(url + '/api/state')).json()).toEqual(payload('keep'));
});
it('limits streamed bodies without a content-length', async () => {
  const status = await new Promise((resolve, reject) => {
    const req = http.request(url + '/api/state', {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      }
    }, r => {
      r.resume();
      resolve(r.statusCode);
    });
    req.on('error', reject);
    req.write('z'.repeat(300));
    req.end('z'.repeat(300));
  });
  expect(status).toBe(413);
});
it('rejects wrong MIME, malformed JSON, invalid envelope and foreign origins', async () => {
  expect((await put(1, {
    'content-type': 'text/plain'
  })).status).toBe(415);
  for (const body of ['broken', 'null', '{}']) expect((await fetch(url + '/api/state', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json'
    },
    body
  })).status).toBe(400);
  expect((await put(1, {
    Origin: 'https://example.invalid'
  })).status).toBe(403);
});
