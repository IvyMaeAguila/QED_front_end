import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { gzipSync } from 'node:zlib';
import { serveBuild, prepareLogin, login, rolesInChunks, bundleAudit } from './startup-harness.mjs';
const stage = process.argv[2];
const output = process.env.QED_DOWNLOAD_OUTPUT ?? `loading-screenshots/audit/role-network-${stage}.json`;
const server = await serveBuild(5194), browser = await chromium.launch();
const result = {};
try {
  for (const role of ['ADMIN', 'TEACHER', 'PRINCIPAL', 'PARENT']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const fixture = await prepareLogin(page, role);
    const requests = [];
    page.on('request', request => requests.push({ url: request.url(), type: request.resourceType(), at: Date.now() }));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8, connectionType: 'cellular4g' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      function frame() {
        if (!window.firstSkeletonAt && [...document.querySelectorAll('[data-sk-primitive]')].some(element => {
          const style = getComputedStyle(element);
          return element.getBoundingClientRect().height > 0 && style.visibility !== 'hidden' && style.opacity !== '0' && !element.closest('[data-sk-reserved]');
        })) window.firstSkeletonAt = performance.timeOrigin + performance.now();
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    await page.goto(server.url + '/login');
    await login(page);
    await page.waitForFunction(() => window.firstSkeletonAt, { timeout: 60000 });
    const cutoff = await page.evaluate(() => window.firstSkeletonAt);
    const files = requests.filter(request => request.at <= cutoff && request.url.startsWith(server.url + '/assets/')).map(request => {
      const file = new URL(request.url).pathname.slice(1), bytes = fs.readFileSync('dist/' + file);
      const chunk = bundleAudit().find(chunk => chunk.fileName === file);
      return { ...request, file, rawBytes: bytes.length, gzipBytes: gzipSync(bytes).length, compositions: chunk?.modules.filter(module => module.endsWith('.loading-view.tsx')) ?? [], imports: chunk?.imports ?? [] };
    });
    const sum = files => files.reduce((total, file) => ({ rawBytes: total.rawBytes + file.rawBytes, gzipBytes: total.gzipBytes + file.gzipBytes }), { rawBytes: 0, gzipBytes: 0 });
    result[role] = { cutoff, rolesRequested: rolesInChunks(files.map(file => file.url)), scriptTotal: sum(files.filter(file => file.type === 'script')), allAssetTotal: sum(files), files, note: 'All assets requested by first visible skeleton, including any still in flight. Uncompressed HTTP harness; gzip totals are calculated, not transferred.' };
    fixture.release();
    await context.close();
  }
  fs.writeFileSync(output, JSON.stringify({ stage, roles: result }, null, 2));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result).map(([role, data]) => [role, { scripts: data.scriptTotal, assets: data.allAssetTotal, rolesRequested: data.rolesRequested }])), null, 2));
} finally { await browser.close(); await server.close(); }
