import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
const go = (page: Page, query: string) => page.goto(`/loading-harness.html?${query}`);
const region = (page: Page) => page.locator("#test-region .sk-region");
const settled = (page: Page) => expect(region(page)).toHaveAttribute("data-sk-phase", "settled");

test("60ms never reveals a skeleton", async ({ page }) => {
  await go(page, "latency=60"); await settled(page);
  expect(await page.evaluate(() => window.skEvents.some(e => e.phase === "revealed" || e.phase === "swapping"))).toBe(false);
});
test("320ms reveals after 200ms and reserves at least 400ms", async ({ page }) => {
  await go(page, "latency=320"); await settled(page);
  const timing = await page.evaluate(() => ({ mounted: window.skMountedAt, events: window.skEvents }));
  const reveal = timing.events.find(e => e.phase === "revealed")!;
  const swap = timing.events.find(e => e.phase === "swapping")!;
  expect(reveal.time - timing.mounted).toBeGreaterThanOrEqual(120);
  expect(reveal.time - timing.mounted).toBeLessThanOrEqual(280);
  expect(swap.time - reveal.time).toBeGreaterThanOrEqual(390);
});
test("1500ms begins showing content within 150ms of data", async ({ page }) => {
  await go(page, "latency=1500"); await settled(page);
  expect(await page.evaluate(() => window.skEvents.find(e => e.phase === "swapping")!.time - window.skDataAt)).toBeLessThanOrEqual(150);
});
test("fixed region retains height and has zero CLS", async ({ page }) => {
  await go(page, "latency=900"); await settled(page);
  const values = await page.evaluate(() => ({ heights: window.skEvents.map(e => e.height), shifts: window.skShifts }));
  expect(new Set(values.heights).size).toBe(1); expect(values.shifts).toEqual([]);
});
for (const mode of ["list", "text"]) for (const count of mode === "list" ? [0, 2, 9] : [1, 4, 24]) {
  test(`variable ${mode}, data size ${count}: one swap, stable surroundings`, async ({ page }) => {
    await go(page, `latency=1200&mode=${mode}&count=${count}`);
    const before = await page.locator("[data-beside]").boundingBox();
    const above = await page.locator("h1").boundingBox();
    await expect(region(page)).toHaveAttribute("data-sk-phase", "revealed");
    const columns = mode === "list" ? await page.locator("[data-column]").evaluateAll(es => es.slice(0, 2).map(e => ({ x: e.getBoundingClientRect().x, width: e.getBoundingClientRect().width }))) : [];
    await settled(page);
    expect(await page.locator("[data-beside]").boundingBox()).toEqual(before);
    expect(await page.locator("h1").boundingBox()).toEqual(above);
    const evidence = await page.evaluate(() => ({ events: window.skEvents, shifts: window.skShifts }));
    expect(evidence.events.find(e => e.phase === "waiting")!.height).toBe(evidence.events.find(e => e.phase === "revealed")!.height);
    expect(evidence.shifts.length).toBeLessThanOrEqual(1);
    if (evidence.shifts.length) expect(Math.abs(evidence.shifts[0].time - evidence.events.find(e => e.phase === "swapping")!.time)).toBeLessThan(80);
    if (mode === "list" && count) {
      const after = await page.locator("[data-column]").evaluateAll(es => es.slice(0, 2).map(e => ({ x: e.getBoundingClientRect().x, width: e.getBoundingClientRect().width })));
      for (let i = 0; i < 2; i++) { expect(Math.abs(after[i].x - columns[i].x)).toBeLessThanOrEqual(1); expect(Math.abs(after[i].width - columns[i].width)).toBeLessThanOrEqual(1); }
    }
  });
}
test("animation properties, shimmer duration and shared easing", async ({ page }) => {
  await go(page, "latency=900"); await expect(region(page)).toHaveAttribute("data-sk-phase", "revealed");
  const shimmer = await page.evaluate(() => document.getAnimations().map(a => ({ timing: a.effect!.getTiming(), keys: a.effect!.getKeyframes().flatMap(k => Object.keys(k)) })));
  expect(shimmer.length).toBeGreaterThan(0);
  for (const animation of shimmer) { expect(animation.timing.duration).toBe(1800); expect(animation.timing.easing).toBe("linear"); expect(animation.keys.every(k => ["opacity", "transform", "offset", "computedOffset", "easing", "composite"].includes(k))).toBe(true); }
  await page.waitForFunction(() => document.querySelector("#test-region .sk-region")?.getAttribute("data-sk-phase") === "swapping");
  const fades = await page.evaluate(() => document.getAnimations().filter(a => a.effect!.getTiming().iterations !== Infinity).map(a => ({ timing: a.effect!.getTiming(), keys: a.effect!.getKeyframes().flatMap(k => Object.keys(k)) })));
  expect(fades.length).toBeGreaterThan(0);
  for (const animation of fades) { expect(animation.timing.duration).toBe(200); expect(animation.timing.easing).toBe("cubic-bezier(0.22, 1, 0.36, 1)"); expect(animation.keys.every(k => ["opacity", "transform", "offset", "computedOffset", "easing", "composite"].includes(k))).toBe(true); }
});
test("different mount times share shimmer phase", async ({ page }) => {
  await go(page, "latency=2000&clock"); await expect(page.locator('[data-clock="second"]')).toBeAttached();
  const phases = await page.locator("[data-clock] .sk-sweep").evaluateAll(es => es.map(e => e.getAnimations()[0].effect!.getComputedTiming().progress!));
  expect(Math.abs(phases[0] - phases[1])).toBeLessThanOrEqual(.01);
});
for (const count of [5, 12]) test(`${count} items use exact stagger policy`, async ({ page }) => {
  await go(page, `latency=900&mode=items&count=${count}`); await page.waitForFunction(() => document.querySelector("#test-region .sk-region")?.getAttribute("data-sk-phase") === "swapping");
  expect(await page.locator("[data-sk-content] [data-sk-item]").evaluateAll(es => es.map(e => Number((e as HTMLElement).dataset.skDelay)))).toEqual(count === 5 ? [0, 40, 80, 120, 160] : Array(12).fill(0));
});
test("reduced motion has no shimmer or fade wait", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await go(page, "latency=900");
  await expect(region(page)).toHaveAttribute("data-sk-phase", "revealed");
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect!.getTiming().iterations === Infinity).length)).toBe(0);
  expect(await region(page).evaluate(e => parseFloat(getComputedStyle(e).transitionDuration))).toBeLessThanOrEqual(.001);
  await settled(page);
  expect(await page.evaluate(() => window.skEvents.find(e => e.phase === "settled")!.time - window.skDataAt)).toBeLessThan(100);
});
test("aria busy, hidden reservation, delayed status and complete cleanup", async ({ page }) => {
  // Hold completion until the revealed state is inspected; observe t=0 in-browser
  // rather than racing the 200ms delay with several driver round trips.
  await go(page, "manual"); await expect(region(page)).toHaveAttribute("aria-busy", "true");
  const initial = await page.evaluate(() => window.skEvents[0]);
  expect(initial).toMatchObject({ phase: "waiting", busy: "true", hidden: "true", reservationVisibility: "hidden", statusCount: 0 });
  await expect(page.locator("[data-sk-layer]")).toHaveAttribute("aria-hidden", "true");
  await expect(region(page)).toHaveAttribute("data-sk-phase", "revealed"); await expect(page.getByRole("status")).toContainText("Loading");
  await page.evaluate(() => window.skRelease!());
  await settled(page); await expect(region(page)).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("[data-sk-layer]")).toHaveCount(0); await expect(page.getByRole("status")).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect!.getTiming().iterations === Infinity).length)).toBe(0);
});
test("error removes skeleton and retry reloads", async ({ page }) => {
  await go(page, "latency=900&error"); await expect(page.getByRole("alert")).toContainText("Test request failed");
  await expect(region(page)).toHaveAttribute("aria-busy", "false"); await expect(page.locator("[data-sk-layer]")).toHaveCount(0);
  await page.getByRole("alert").getByRole("button", { name: "Retry", exact: true }).click();
  await expect(region(page)).toHaveAttribute("aria-busy", "true");
  await settled(page); await expect(page.getByRole("alert")).toHaveCount(0);
});
test("negative control catches wrong fixed height and CLS", async ({ page }) => {
  await go(page, "latency=1200&mismatch"); await settled(page);
  expect(await page.evaluate(() => new Set(window.skEvents.map(e => e.height)).size)).toBeGreaterThan(1);
  expect(await page.evaluate(() => window.skShifts.reduce((sum, e) => sum + e.value, 0))).toBeGreaterThan(0);
});
test("negative control catches unsynchronized shimmer", async ({ page }) => {
  await go(page, "latency=2000&clock&unsynchronized"); await expect(page.locator('[data-clock="second"]')).toBeAttached();
  const phases = await page.locator("[data-clock] .sk-sweep").evaluateAll(es => es.map(e => e.getAnimations()[0].effect!.getComputedTiming().progress!));
  expect(Math.abs(phases[0] - phases[1])).toBeGreaterThan(.05);
});
test("skeleton CSS uses tokens for every color", () => {
  const css = fs.readFileSync("src/shared/loading/skeleton.css", "utf8");
  expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  for (const declaration of css.matchAll(/(?:background|color|border-color)\s*:\s*([^;}]+)/g)) expect(declaration[1]).toContain("var(--sk-");
});
for (const theme of ["light", "dark"]) test(`${theme}: neutral contrast on every surface`, async ({ page }) => {
  await go(page, `latency=2000&surfaces&theme=${theme}`);
  const results = await page.locator("[data-surface]").evaluateAll(es => {
    const rgb = (color: string) => { const c = document.createElement("canvas").getContext("2d")!; c.fillStyle = color; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3); };
    const luminance = (color: string) => rgb(color).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    return es.map(e => { const bg = luminance(getComputedStyle(e).backgroundColor); const base = luminance(getComputedStyle(e.querySelector("[data-sk-primitive]")!).backgroundColor); return { surface: (e as HTMLElement).dataset.surface, contrast: (Math.max(bg, base) + .05) / (Math.min(bg, base) + .05) }; });
  });
  for (const result of results) { expect(result.contrast, result.surface).toBeGreaterThanOrEqual(1.1); expect(result.contrast, result.surface).toBeLessThanOrEqual(2); }
});
test("text line metrics and adjacent widths", async ({ page }) => {
  await go(page, "latency=1500&mode=text");
  const metrics = await page.locator('[data-sk-primitive="text"]').evaluateAll(es => es.map(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, line: parseFloat(getComputedStyle(e).lineHeight) })));
  for (const [i, metric] of metrics.entries()) { expect(metric.height).toBe(metric.line); if (i) expect(metric.width).not.toBe(metrics[i - 1].width); }
});
