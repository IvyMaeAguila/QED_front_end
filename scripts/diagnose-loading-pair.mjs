import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const base = path.join(process.env.TEMP, 'qed-part-d');
const out = path.resolve('loading-screenshots/audit');
const cli = path.resolve('node_modules/@playwright/test/cli.js');
for (const revision of ['a94f3d0', '67a3c5b', '417100a']) {
  for (const [name, file, title] of [
    ['subjects', 'tests/teacher-subjects.spec.ts', 'teacher subjects 375px dark: real shell, card geometry and screenshots'],
    ['text', 'tests/loading.spec.ts', 'variable text, data size 4: one swap, stable surroundings'],
  ]) {
    if (revision === 'a94f3d0' && name === 'subjects') continue;
    const prefix = path.join(out, `part-d-${revision}-${name}`);
    console.log(`START ${revision} ${name} ${new Date().toISOString()}`);
    const run = spawnSync(process.execPath, [cli, 'test', file, '--grep', title, '--repeat-each=10', '--workers=1', '--retries=0', '--reporter=list,json'], {
      cwd: revision === 'a94f3d0' ? process.cwd() : path.join(base, revision), encoding: 'utf8', maxBuffer: 30 * 1024 * 1024,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: `${prefix}.json` },
    });
    fs.writeFileSync(`${prefix}.txt`, (run.stdout ?? '') + (run.stderr ?? ''));
    fs.writeFileSync(`${prefix}-exit.txt`, String(run.status));
    const report = JSON.parse(fs.readFileSync(`${prefix}.json`, 'utf8'));
    console.log(`END ${revision} ${name} ${JSON.stringify(report.stats)}`);
  }
}
