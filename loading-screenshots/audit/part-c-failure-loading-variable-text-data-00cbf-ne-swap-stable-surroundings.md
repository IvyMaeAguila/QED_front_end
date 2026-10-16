# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: loading.spec.ts >> variable text, data size 4: one swap, stable surroundings
- Location: tests\loading.spec.ts:30:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#test-region .sk-region')
Expected: "revealed"
Received: "settled"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" locator('#test-region .sk-region') with timeout 5000ms
  - waiting for locator('#test-region .sk-region')
    14 × locator resolved to <div aria-busy="false" class="sk-region " data-sk-variable="" data-sk-phase="settled" data-sk-region="field-_r_0_">…</div>
       - unexpected value "settled"

```

```yaml
- text: Residential address Residential address Residential address Residential address
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | import fs from "node:fs";
  3   | const go = (page: Page, query: string) => page.goto(`/loading-harness.html?${query}`);
  4   | const region = (page: Page) => page.locator("#test-region .sk-region");
  5   | const settled = (page: Page) => expect(region(page)).toHaveAttribute("data-sk-phase", "settled");
  6   | 
  7   | test("60ms never reveals a skeleton", async ({ page }) => {
  8   |   await go(page, "latency=60"); await settled(page);
  9   |   expect(await page.evaluate(() => window.skEvents.some(e => e.phase === "revealed" || e.phase === "swapping"))).toBe(false);
  10  | });
  11  | test("320ms reveals after 200ms and reserves at least 400ms", async ({ page }) => {
  12  |   await go(page, "latency=320"); await settled(page);
  13  |   const timing = await page.evaluate(() => ({ mounted: window.skMountedAt, events: window.skEvents }));
  14  |   const reveal = timing.events.find(e => e.phase === "revealed")!;
  15  |   const swap = timing.events.find(e => e.phase === "swapping")!;
  16  |   expect(reveal.time - timing.mounted).toBeGreaterThanOrEqual(120);
  17  |   expect(reveal.time - timing.mounted).toBeLessThanOrEqual(280);
  18  |   expect(swap.time - reveal.time).toBeGreaterThanOrEqual(390);
  19  | });
  20  | test("1500ms begins showing content within 150ms of data", async ({ page }) => {
  21  |   await go(page, "latency=1500"); await settled(page);
  22  |   expect(await page.evaluate(() => window.skEvents.find(e => e.phase === "swapping")!.time - window.skDataAt)).toBeLessThanOrEqual(150);
  23  | });
  24  | test("fixed region retains height and has zero CLS", async ({ page }) => {
  25  |   await go(page, "latency=900"); await settled(page);
  26  |   const values = await page.evaluate(() => ({ heights: window.skEvents.map(e => e.height), shifts: window.skShifts }));
  27  |   expect(new Set(values.heights).size).toBe(1); expect(values.shifts).toEqual([]);
  28  | });
  29  | for (const mode of ["list", "text"]) for (const count of mode === "list" ? [0, 2, 9] : [1, 4, 24]) {
  30  |   test(`variable ${mode}, data size ${count}: one swap, stable surroundings`, async ({ page }) => {
  31  |     await go(page, `latency=1200&mode=${mode}&count=${count}`);
  32  |     const before = await page.locator("[data-beside]").boundingBox();
  33  |     const above = await page.locator("h1").boundingBox();
> 34  |     await expect(region(page)).toHaveAttribute("data-sk-phase", "revealed");
      |                                ^ Error: expect(locator).toHaveAttribute(expected) failed
  35  |     const columns = mode === "list" ? await page.locator("[data-column]").evaluateAll(es => es.slice(0, 2).map(e => ({ x: e.getBoundingClientRect().x, width: e.getBoundingClientRect().width }))) : [];
  36  |     await settled(page);
  37  |     expect(await page.locator("[data-beside]").boundingBox()).toEqual(before);
  38  |     expect(await page.locator("h1").boundingBox()).toEqual(above);
  39  |     const evidence = await page.evaluate(() => ({ events: window.skEvents, shifts: window.skShifts }));
  40  |     expect(evidence.events.find(e => e.phase === "waiting")!.height).toBe(evidence.events.find(e => e.phase === "revealed")!.height);
  41  |     expect(evidence.shifts.length).toBeLessThanOrEqual(1);
  42  |     if (evidence.shifts.length) expect(Math.abs(evidence.shifts[0].time - evidence.events.find(e => e.phase === "swapping")!.time)).toBeLessThan(80);
  43  |     if (mode === "list" && count) {
  44  |       const after = await page.locator("[data-column]").evaluateAll(es => es.slice(0, 2).map(e => ({ x: e.getBoundingClientRect().x, width: e.getBoundingClientRect().width })));
  45  |       for (let i = 0; i < 2; i++) { expect(Math.abs(after[i].x - columns[i].x)).toBeLessThanOrEqual(1); expect(Math.abs(after[i].width - columns[i].width)).toBeLessThanOrEqual(1); }
  46  |     }
  47  |   });
  48  | }
  49  | test("animation properties, shimmer duration and shared easing", async ({ page }) => {
  50  |   await go(page, "latency=900"); await expect(region(page)).toHaveAttribute("data-sk-phase", "revealed");
  51  |   const shimmer = await page.evaluate(() => document.getAnimations().map(a => ({ timing: a.effect!.getTiming(), keys: a.effect!.getKeyframes().flatMap(k => Object.keys(k)) })));
  52  |   expect(shimmer.length).toBeGreaterThan(0);
  53  |   for (const animation of shimmer) { expect(animation.timing.duration).toBe(1800); expect(animation.timing.easing).toBe("linear"); expect(animation.keys.every(k => ["opacity", "transform", "offset", "computedOffset", "easing", "composite"].includes(k))).toBe(true); }
  54  |   await page.waitForFunction(() => document.querySelector("#test-region .sk-region")?.getAttribute("data-sk-phase") === "swapping");
  55  |   const fades = await page.evaluate(() => document.getAnimations().filter(a => a.effect!.getTiming().iterations !== Infinity).map(a => ({ timing: a.effect!.getTiming(), keys: a.effect!.getKeyframes().flatMap(k => Object.keys(k)) })));
  56  |   expect(fades.length).toBeGreaterThan(0);
  57  |   for (const animation of fades) { expect(animation.timing.duration).toBe(200); expect(animation.timing.easing).toBe("cubic-bezier(0.22, 1, 0.36, 1)"); expect(animation.keys.every(k => ["opacity", "transform", "offset", "computedOffset", "easing", "composite"].includes(k))).toBe(true); }
  58  | });
  59  | test("different mount times share shimmer phase", async ({ page }) => {
  60  |   await go(page, "latency=2000&clock"); await expect(page.locator('[data-clock="second"]')).toBeAttached();
  61  |   const phases = await page.locator("[data-clock] .sk-sweep").evaluateAll(es => es.map(e => e.getAnimations()[0].effect!.getComputedTiming().progress!));
  62  |   expect(Math.abs(phases[0] - phases[1])).toBeLessThanOrEqual(.01);
  63  | });
  64  | for (const count of [5, 12]) test(`${count} items use exact stagger policy`, async ({ page }) => {
  65  |   await go(page, `latency=900&mode=items&count=${count}`); await page.waitForFunction(() => document.querySelector("#test-region .sk-region")?.getAttribute("data-sk-phase") === "swapping");
  66  |   expect(await page.locator("[data-sk-content] [data-sk-item]").evaluateAll(es => es.map(e => Number((e as HTMLElement).dataset.skDelay)))).toEqual(count === 5 ? [0, 40, 80, 120, 160] : Array(12).fill(0));
  67  | });
  68  | test("reduced motion has no shimmer or fade wait", async ({ page }) => {
  69  |   await page.emulateMedia({ reducedMotion: "reduce" }); await go(page, "latency=900");
  70  |   await expect(region(page)).toHaveAttribute("data-sk-phase", "revealed");
  71  |   expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect!.getTiming().iterations === Infinity).length)).toBe(0);
  72  |   expect(await region(page).evaluate(e => parseFloat(getComputedStyle(e).transitionDuration))).toBeLessThanOrEqual(.001);
  73  |   await settled(page);
  74  |   expect(await page.evaluate(() => window.skEvents.find(e => e.phase === "settled")!.time - window.skDataAt)).toBeLessThan(100);
  75  | });
  76  | test("aria busy, hidden reservation, delayed status and complete cleanup", async ({ page }) => {
  77  |   // Hold completion until the revealed state is inspected; observe t=0 in-browser
  78  |   // rather than racing the 200ms delay with several driver round trips.
  79  |   await go(page, "manual"); await expect(region(page)).toHaveAttribute("aria-busy", "true");
  80  |   const initial = await page.evaluate(() => window.skEvents[0]);
  81  |   expect(initial).toMatchObject({ phase: "waiting", busy: "true", hidden: "true", reservationVisibility: "hidden", statusCount: 0 });
  82  |   await expect(page.locator("[data-sk-layer]")).toHaveAttribute("aria-hidden", "true");
  83  |   await expect(region(page)).toHaveAttribute("data-sk-phase", "revealed"); await expect(page.getByRole("status")).toContainText("Loading");
  84  |   await page.evaluate(() => window.skRelease!());
  85  |   await settled(page); await expect(region(page)).toHaveAttribute("aria-busy", "false");
  86  |   await expect(page.locator("[data-sk-layer]")).toHaveCount(0); await expect(page.getByRole("status")).toHaveCount(0);
  87  |   expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect!.getTiming().iterations === Infinity).length)).toBe(0);
  88  | });
  89  | test("error removes skeleton and retry reloads", async ({ page }) => {
  90  |   await go(page, "latency=900&error"); await expect(page.getByRole("alert")).toContainText("Test request failed");
  91  |   await expect(region(page)).toHaveAttribute("aria-busy", "false"); await expect(page.locator("[data-sk-layer]")).toHaveCount(0);
  92  |   await page.getByRole("alert").getByRole("button", { name: "Retry", exact: true }).click();
  93  |   await expect(region(page)).toHaveAttribute("aria-busy", "true");
  94  |   await settled(page); await expect(page.getByRole("alert")).toHaveCount(0);
  95  | });
  96  | test("negative control catches wrong fixed height and CLS", async ({ page }) => {
  97  |   await go(page, "latency=1200&mismatch"); await settled(page);
  98  |   expect(await page.evaluate(() => new Set(window.skEvents.map(e => e.height)).size)).toBeGreaterThan(1);
  99  |   expect(await page.evaluate(() => window.skShifts.reduce((sum, e) => sum + e.value, 0))).toBeGreaterThan(0);
  100 | });
  101 | test("negative control catches unsynchronized shimmer", async ({ page }) => {
  102 |   await go(page, "latency=2000&clock&unsynchronized"); await expect(page.locator('[data-clock="second"]')).toBeAttached();
  103 |   const phases = await page.locator("[data-clock] .sk-sweep").evaluateAll(es => es.map(e => e.getAnimations()[0].effect!.getComputedTiming().progress!));
  104 |   expect(Math.abs(phases[0] - phases[1])).toBeGreaterThan(.05);
  105 | });
  106 | test("skeleton CSS uses tokens for every color", () => {
  107 |   const css = fs.readFileSync("src/shared/loading/skeleton.css", "utf8");
  108 |   expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  109 |   for (const declaration of css.matchAll(/(?:background|color|border-color)\s*:\s*([^;}]+)/g)) expect(declaration[1]).toContain("var(--sk-");
  110 | });
  111 | for (const theme of ["light", "dark"]) test(`${theme}: neutral contrast on every surface`, async ({ page }) => {
  112 |   await go(page, `latency=2000&surfaces&theme=${theme}`);
  113 |   const results = await page.locator("[data-surface]").evaluateAll(es => {
  114 |     const rgb = (color: string) => { const c = document.createElement("canvas").getContext("2d")!; c.fillStyle = color; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3); };
  115 |     const luminance = (color: string) => rgb(color).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  116 |     return es.map(e => { const bg = luminance(getComputedStyle(e).backgroundColor); const base = luminance(getComputedStyle(e.querySelector("[data-sk-primitive]")!).backgroundColor); return { surface: (e as HTMLElement).dataset.surface, contrast: (Math.max(bg, base) + .05) / (Math.min(bg, base) + .05) }; });
  117 |   });
  118 |   for (const result of results) { expect(result.contrast, result.surface).toBeGreaterThanOrEqual(1.1); expect(result.contrast, result.surface).toBeLessThanOrEqual(2); }
  119 | });
  120 | test("text line metrics and adjacent widths", async ({ page }) => {
  121 |   await go(page, "latency=1500&mode=text");
  122 |   const metrics = await page.locator('[data-sk-primitive="text"]').evaluateAll(es => es.map(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, line: parseFloat(getComputedStyle(e).lineHeight) })));
  123 |   for (const [i, metric] of metrics.entries()) { expect(metric.height).toBe(metric.line); if (i) expect(metric.width).not.toBe(metrics[i - 1].width); }
  124 | });
  125 | 
```