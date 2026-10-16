import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const results = [];
const stage = process.argv[2] ?? 'current';
for (let index = 1; index <= Number(process.argv[3] ?? 10); index++) {
  const prefix = `loading-screenshots/audit/cold-${stage}-${index}`;
  const run = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', 'tests/add-subject-loading.spec.ts', '--grep', 'add subject 375 light keeps known form real without data spinners', '--reporter=list,./scripts/cold-start-reporter.mjs'], { env: { ...process.env, QED_COLD_RESULT: prefix + '.json' }, encoding: 'utf8' });
  fs.writeFileSync(prefix + '.txt', run.stdout + run.stderr);
  const result = JSON.parse(fs.readFileSync(prefix + '.json'));
  const navigation = result.steps.find(step => step.title === 'Navigate');
  const main = result.steps.find(step => step.title.includes('toBeVisible'));
  results.push({ run: index, status: result.status, navigation, main, navigationToMainMs: navigation && main ? new Date(main.start).getTime() + main.durationMs - new Date(navigation.start).getTime() : null });
  fs.writeFileSync(`loading-screenshots/audit/cold-${stage}-summary.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.at(-1)));
}

