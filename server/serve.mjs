import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.gif': 'image/gif',
  '.avif': 'image/avif'
};
export function createServer({
  dist = path.join(root, 'dist'),
  dataDir = path.join(root, 'userdata'),
  limit = 20 * 1024 * 1024,
  clock = () => new Date()
} = {}) {
  let writes = Promise.resolve();
  const atomic = async (file, body) => {
    const temp = file + '.' + randomUUID() + '.tmp';
    try {
      await fs.writeFile(temp, body, {
        flag: 'wx'
      });
      await fs.rename(temp, file);
    } finally {
      await fs.rm(temp, {
        force: true
      });
    }
  };
  const server = http.createServer(async (req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(JSON.stringify(body));
    };
    try {
      const host = req.headers.host,
        expected = '127.0.0.1:' + server.address().port;
      if (host !== expected || req.headers.origin && req.headers.origin !== 'http://' + expected) return reply(403, {
        error: '不接受此來源'
      });
      const route = decodeURIComponent((req.url ?? '/').split('?')[0]);
      if (route === '/api/health' && req.method === 'GET') return reply(200, {
        ok: true,
        dataDir
      });
      const state = path.join(dataDir, 'state.json');
      if (route === '/api/state') {
        if (req.method === 'GET') {
          try {
            const b = await fs.readFile(state);
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            });
            return res.end(b);
          } catch (e) {
            if (e.code === 'ENOENT') return reply(404, {
              error: '尚無存檔'
            });
            throw e;
          }
        }
        if (req.method !== 'PUT') return reply(405, {
          error: '方法不符'
        });
        if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) return reply(415, {
          error: '需要 JSON'
        });
        if (Number(req.headers['content-length']) > limit) return reply(413, {
          error: '檔案過大'
        });
        const chunks = [];
        let size = 0;
        for await (const b of req) {
          size += b.length;
          if (size > limit) return reply(413, {
            error: '檔案過大'
          });
          chunks.push(b);
        }
        const body = Buffer.concat(chunks);
        let snapshot;
        try {
          snapshot = JSON.parse(body);
        } catch {
          return reply(400, {
            error: 'JSON 格式不符'
          });
        }
        if (snapshot?.app !== 'stackway' || snapshot.schemaVersion !== 1 || !snapshot.data || typeof snapshot.data !== 'object') return reply(400, {
          error: '非棧道備份'
        });
        const write = async () => {
          const dir = path.join(dataDir, 'backups');
          await fs.mkdir(dir, {
            recursive: true
          });
          const d = new Date(clock());
          const hour = snapshot.data.settings?.[0]?.dayStartHour ?? 4;
          if (d.getHours() < hour) d.setDate(d.getDate() - 1);
          const day = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
          await atomic(state, body);
          const backup = path.join(dir, day + '.json');
          try {
            await fs.access(backup);
          } catch (e) {
            if (e.code !== 'ENOENT') throw e;
            await atomic(backup, body);
          }
          const old = (await fs.readdir(dir)).filter(n => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort().slice(0, -30);
          for (const n of old) await fs.unlink(path.join(dir, n));
        };
        const job = writes.then(write);
        writes = job.catch(() => {});
        await job;
        return reply(200, {
          ok: true
        });
      }
      if (route.startsWith('/api/')) return reply(404, {
        error: '找不到介面'
      });
      if (!['GET', 'HEAD'].includes(req.method)) return reply(405, {
        error: '方法不符'
      });
      if (route.includes('\\') || route.includes('\0') || route.split('/').includes('..')) return reply(403, {
        error: '無法存取'
      });
      const base = await fs.realpath(dist);
      let p = path.resolve(base, '.' + route);
      if (p !== base && !p.startsWith(base + path.sep)) return reply(403, {
        error: '無法存取'
      });
      if (p === base) p = path.join(base, 'index.html');
      try {
        p = await fs.realpath(p);
      } catch (e) {
        if (e.code !== 'ENOENT' || path.extname(route)) return reply(404, {
          error: '找不到檔案'
        });
        p = await fs.realpath(path.join(base, 'index.html'));
      }
      if (!p.startsWith(base + path.sep) || !(await fs.stat(p)).isFile()) return reply(403, {
        error: '無法存取'
      });
      const bytes = await fs.readFile(p);
      res.writeHead(200, {
        'Content-Type': types[path.extname(p)] ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache'
      });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch {
      if (!res.headersSent) reply(500, {
        error: '無法完成本機讀寫'
      });else res.end();
    }
  });
  return server;
}
export const listen = (server, port = 4318) => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', () => resolve(server.address()));
});
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await listen(createServer());
  console.log('棧道：http://127.0.0.1:4318（關閉視窗即可停止）');
}
