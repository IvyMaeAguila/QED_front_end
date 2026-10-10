import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
const evidence = 'loading-screenshots/audit/';
const baseline = '417100aa76a51a0571ceecd2ee1e148e63d7ad05';
function git(args) { const result = spawnSync('git', args); if (result.status) throw new Error(result.stderr.toString()); return result.stdout; }
if (git(['branch', '--show-current']).toString().trim() !== 'codex/finish-loading-verification') throw new Error('Wrong branch');
const files = git(['diff', '--name-only', baseline, '--', 'src']).toString().trim().split(/\r?\n/).filter(Boolean);
const baselineFiles = new Set(git(['ls-tree', '-r', '--name-only', baseline, '--', 'src']).toString().trim().split(/\r?\n/));
const backup = fs.mkdtempSync(path.join(os.tmpdir(), 'qed-part-a-source-'));
const saved = files.map(file => ({ file, contents: fs.existsSync(file) ? fs.readFileSync(file) : null }));
fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify(saved.map(({file, contents}) => ({ file, present: contents !== null })), null, 2));
for (const {file, contents} of saved) if (contents) { fs.mkdirSync(path.dirname(path.join(backup, file)), {recursive:true}); fs.writeFileSync(path.join(backup, file), contents); }
function command(script, args, output) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  fs.writeFileSync(evidence + output, result.stdout + result.stderr);
  console.log(output, 'exit', result.status);
  return result;
}
try {
  for (const file of files) {
    if (baselineFiles.has(file)) fs.writeFileSync(file, git(['show', `${baseline}:${file}`]));
    else if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  if (command('node_modules/typescript/bin/tsc', ['-b'], 'part-a-baseline-types.txt').status) throw new Error('Baseline type check failed');
  if (command('node_modules/vite/bin/vite.js', ['build'], 'part-a-baseline-build.txt').status) throw new Error('Baseline build failed');
  const audit = JSON.parse(fs.readFileSync('dist/bundle-audit.json', 'utf8'));
  fs.writeFileSync(evidence + 'bundles-before.json', JSON.stringify(audit, null, 2));
  const entry = audit.find(chunk => chunk.isEntry), bytes = fs.readFileSync('dist/' + entry.fileName);
  fs.writeFileSync(evidence + 'bundle-before-size.json', JSON.stringify({ baseline, fileName:entry.fileName, rawBytes:bytes.length, gzipBytes:gzipSync(bytes).length }, null, 2));
  const before = command('node_modules/@playwright/test/cli.js', ['test', 'tests/bundle-budget.spec.ts'], 'part-a-budget-before-tests.txt');
  if (!before.status || !before.stdout.includes('Entry gzip')) throw new Error('Budget test did not reject the old oversized entry');
  const roles = command('node_modules/@playwright/test/cli.js', ['test', 'tests/role-bundles.spec.ts'], 'part-a-before-tests.txt');
  if (!roles.status || !roles.stdout.includes('7 failed')) throw new Error('All seven role/chart regressions must fail on the baseline');
} finally {
  for (const {file, contents} of saved) {
    if (contents) fs.writeFileSync(file, contents); else if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  console.log('Current source restored; recovery copy:', backup);
}
const registryFile = 'src/shared/loading/routeSkeletons.ts';
const registry = fs.readFileSync(registryFile);
try {
  fs.writeFileSync(registryFile, 'import { TeacherLayout } from "../../features/profiles/teacher/pages/TeacherLayout";\n' + registry.toString());
  const mutation = command('scripts/check-bundle-budget.mjs', [], 'part-a-registry-mutation.txt');
  if (!mutation.status || !mutation.stderr.includes('eager imports are forbidden')) throw new Error('Registry mutation was not rejected');
  const test = command('node_modules/@playwright/test/cli.js', ['test', 'tests/bundle-budget.spec.ts', '--grep', 'registry'], 'part-a-registry-mutation-test.txt');
  if (!test.status || !test.stdout.includes('1 failed')) throw new Error('Registry test did not reject the implementation mutation');
} finally { fs.writeFileSync(registryFile, registry); }
if (command('node_modules/typescript/bin/tsc', ['-b'], 'part-a-restored-types.txt').status) throw new Error('Restored type check failed');
if (command('node_modules/vite/bin/vite.js', ['build'], 'part-a-restored-build.txt').status) throw new Error('Restored build failed');
if (command('scripts/check-bundle-budget.mjs', [], 'part-a-budget-restored.txt').status) throw new Error('Restored guards failed');
if (command('node_modules/@playwright/test/cli.js', ['test', 'tests/bundle-budget.spec.ts'], 'part-a-budget-restored-tests.txt').status) throw new Error('Restored budget family failed');
console.log('Baseline and mutation fail; restored implementation passes.');
