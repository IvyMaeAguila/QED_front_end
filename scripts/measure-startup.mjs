import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { serveBuild, prepareLogin, login } from './startup-harness.mjs';
const stage = process.argv[2];
if (!['before', 'after', 'current', 'fixed'].includes(stage)) throw new Error('Specify before, after, current or fixed');
const server = await serveBuild(5193);
const browser = await chromium.launch();
const samples = [];
try {
  for (let index = 0; index < 3; index++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await prepareLogin(page, 'TEACHER', false);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8, connectionType: 'cellular4g' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.startup = {};
      document.addEventListener('click', event => {
        if (event.target.closest('button')?.textContent.trim() === 'Login') window.startup.login = performance.now();
      }, true);
      function frame() {
        const visible = element => element && element.getBoundingClientRect().height > 0 && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).opacity !== '0';
        if (!window.startup.content && visible(document.querySelector('input[placeholder="e.g. TC_maria.delacruz"]'))) window.startup.content = performance.now();
        if (window.startup.login) {
          if (!window.startup.skeleton && [...document.querySelectorAll('[data-sk-region]:not([data-sk-region="auth-bootstrap"]) [data-sk-primitive]')].some(element => visible(element) && !element.closest('[data-sk-reserved]'))) window.startup.skeleton = performance.now();
          const stats = document.querySelector('[data-sk-region="stat-value-Advisory Students"]');
          if (!window.startup.data && visible(stats) && stats.getAttribute('aria-busy') === 'false' && stats.textContent.includes('21')) window.startup.data = performance.now();
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    await page.goto(server.url + '/login');
    await login(page);
    await page.waitForFunction(() => window.startup?.data && window.startup?.skeleton, { timeout: 60000 });
    samples.push(await page.evaluate(() => ({ loginVisibleMs: window.startup.content, loginToSkeletonMs: window.startup.skeleton - window.startup.login, loginToDataMs: window.startup.data - window.startup.login })));
    await context.close();
  }
  const median = key => [...samples].sort((a, b) => a[key] - b[key])[1][key];
  const result = { stage, profile: { latencyMs: 150, downloadBitsPerSecond: 1600000, uploadBitsPerSecond: 750000, cpuSlowdown: 4, dataResponseDelayMs: 320, samples: 3, coldBrowserContexts: true }, samples, median: Object.fromEntries(Object.keys(samples[0]).map(key => [key, median(key)])) };
  fs.writeFileSync(`loading-screenshots/audit/startup-${stage}.json`, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); await server.close(); }
