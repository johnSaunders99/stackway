import { inspect, source, diagnostics } from './content.mjs';
const src = source(process.argv.slice(2)),
  r = inspect(src);
diagnostics(r);
console.log('內容來源：' + src, r.index.counts);
if (r.errors.length) process.exitCode = 1;
