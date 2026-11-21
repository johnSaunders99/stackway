import fs from 'node:fs';
import path from 'node:path';
export function scratch() {
  const tag = process.env.STACKWAY_TASK_TAG || 'tests';
  if (!/^[a-z0-9-]+$/.test(tag)) throw Error('Invalid task tag');
  const root = path.resolve('.cache', tag);
  fs.mkdirSync(root, {recursive:true});
  const dir = fs.mkdtempSync(path.join(root, '.stackway-test-'));
  return {
    dir,
    clean() {
      if (path.dirname(dir) !== root || !/^\.stackway-test-[\w-]+$/.test(path.basename(dir))) throw Error('Unexpected test directory');
      fs.rmSync(dir, {
        recursive: true,
        force: true
      });
    }
  };
}
