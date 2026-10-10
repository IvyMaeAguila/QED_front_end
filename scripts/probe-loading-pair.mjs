import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.join(process.env.TEMP, 'qed-part-d/a94f3d0');
const out = path.resolve('loading-screenshots/audit');
const hook = `
test.beforeEach(async ({ page }) => {
  if (process.env.QED_PROBE_SLOW_CSS) await page.route('https://fonts.googleapis.com/**', async route => {
    await new Promise(resolve => setTimeout(resolve, 2200));
    await route.continue();
  });
  const boxes: unknown[] = [];
  const navigate = page.goto.bind(page);
  page.goto = async (...args) => {
    const result = await navigate(...args);
    boxes.push({navigationReady:await page.evaluate(() => ({time:performance.now(),phase:document.querySelector('#test-region .sk-region')?.getAttribute('data-sk-phase')}))});
    return result;
  };
  const original = page.locator.bind(page);
  page.locator = ((...args: Parameters<typeof page.locator>) => {
    const locator = original(...args);
    if (args[0].includes('article')) {
      const first = locator.first.bind(locator);
      locator.first = () => {
        const result = first(); const box = result.boundingBox.bind(result);
        result.boundingBox = async (...params) => {
          const value = await box(...params);
          boxes.push({ selector: args[0], value, detail: await page.evaluate(() => ({time:performance.now(), fonts:document.fonts.status, nodes:[...document.querySelectorAll('h1,h4,[data-sk-region="teacher-subject-collection"],main > div,article')].slice(0,12).map(e=>({tag:e.tagName,text:e.textContent?.slice(0,80),box:e.getBoundingClientRect().toJSON(),font:getComputedStyle(e).font,line:getComputedStyle(e).lineHeight,transform:getComputedStyle(e).transform}))})) });
          return value;
        };
        return result;
      };
    }
    return locator;
  }) as typeof page.locator;
  await page.addInitScript(() => {
    Object.assign(window, { pairProbe: [] });
    const record = (event: string) => (window as any).pairProbe.push({ event, time:performance.now(), fonts:document.fonts.status, ready:document.readyState });
    document.fonts.addEventListener('loading', () => record('fonts-loading'));
    document.fonts.addEventListener('loadingdone', () => record('fonts-done'));
    window.addEventListener('load', () => record('window-load'));
    document.addEventListener('DOMContentLoaded', () => record('dom-ready'));
  });
  (page as any).pairBoxes = boxes;
});
test.afterEach(async ({page}, info) => {
  const data = await page.evaluate(() => ({ events:(window as any).skEvents, mounted:(window as any).skMountedAt, data:(window as any).skDataAt, probe:(window as any).pairProbe, resources:performance.getEntriesByType('resource').filter(e=>/fonts|google/.test(e.name)).map(e=>e.toJSON()) }));
  fs.writeFileSync(process.env.QED_PAIR_PROBE! + '-' + info.repeatEachIndex + '.json', JSON.stringify({title:info.title,status:info.status,boxes:(page as any).pairBoxes,data},null,2));
});
`;
for (const [name, file, title] of [
  ['subjects', 'tests/teacher-subjects.spec.ts', 'teacher subjects 375px dark: real shell, card geometry and screenshots'],
  ['text', 'tests/loading.spec.ts', 'variable text, data size 4: one swap, stable surroundings'],
]) {
  if (process.env.QED_PROBE_CASE && process.env.QED_PROBE_CASE !== name) continue;
  const target = path.join(root, file), original = fs.readFileSync(target, 'utf8');
  try {
    fs.writeFileSync(target, original + hook);
    const prefix = `part-d-${process.env.QED_PROBE_STAGE ?? 'probe'}-${name}`;
    const run = spawnSync(process.execPath, [path.resolve('node_modules/@playwright/test/cli.js'), 'test', file, '--grep', title, '--repeat-each='+ (process.env.QED_PROBE_REPEATS ?? '10'), '--workers=1', '--retries=0', '--reporter=list'], {cwd:root,encoding:'utf8',env:{...process.env,QED_PAIR_PROBE:path.join(out,prefix)},maxBuffer:20*1024*1024});
    fs.writeFileSync(path.join(out,prefix+'.txt'),run.stdout+run.stderr);
    console.log(name,run.status);
  } finally { fs.writeFileSync(target, original); }
}
