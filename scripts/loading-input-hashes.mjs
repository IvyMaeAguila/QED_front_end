import fs from 'node:fs';
import crypto from 'node:crypto';
const files = [];
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const name = `${folder}/${entry.name}`;
    if (entry.isDirectory()) walk(name); else files.push(name);
  }
}
walk('src'); walk('tests');
files.push('playwright.config.ts', 'package.json', 'package-lock.json', 'vite.config.ts');
const current = Object.fromEntries(files.filter(file => fs.existsSync(file)).sort().map(file =>
  [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const target = 'loading-screenshots/audit/followup-input-hashes.json';
if (process.argv.includes('--check')) {
  const saved = JSON.parse(fs.readFileSync(target, 'utf8'));
  const changed = [...new Set([...Object.keys(saved), ...Object.keys(current)])].filter(file => saved[file] !== current[file]);
  console.log(JSON.stringify({ files: files.length, changed }));
  if (changed.length) process.exitCode = 1;
} else {
  fs.writeFileSync(target, JSON.stringify(current, null, 2) + '\n');
  console.log(`Recorded ${files.length} source/test/config hashes.`);
}
