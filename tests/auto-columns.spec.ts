import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";

// External font delivery is independent of table data; keep metrics constant throughout each measurement.
test.beforeEach(async ({ page }) => { await page.route("https://fonts.googleapis.com/**", route => route.abort()); });

const widths = (page: Page) => page.locator("thead th").evaluateAll(cells => cells.map(cell => ({ x: cell.getBoundingClientRect().x, width: cell.getBoundingClientRect().width })));
const fixture = (long: boolean, count: number) => ({ success: true, data: { page: 1, limit: 20, total: count, entries: Array.from({ length: count }, (_, id) => ({ id, createdAt: "2026-10-08T02:00:00Z", actorFullName: long ? "Maria Alexandra Isabella Delos Santos Villanueva" : "Li", actorUsername: "teacher", actorRole: "TEACHER", action: long ? "UPDATE_STUDENT_PROFILE_DETAILS" : "LOGIN", resource: "student", resourceId: "1", httpMethod: "GET", endpoint: long ? "/api/students/123/profile/academic-history" : "/api/me", statusCode: 200 })) } });

for (const count of [0, 1, 9]) test(`auto columns: ${count} rows, one swap, stable shell and cached repeat`, async ({ page }) => {
  let release!: () => void;
  let gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/audit-logs?**", async route => { await gate; await route.fulfill({ json: fixture(true, count) }); });
  await page.goto("/loading-harness.html?mode=auto");await waitForDataRoute(page);
  const region = page.locator("[data-sk-auto-columns]");
  await expect(region).toHaveAttribute("data-sk-phase", "waiting");
  const initial = await widths(page);
  const above = await page.locator("h1").boundingBox();
  const beside = await page.locator("[data-beside]").boundingBox();
  const toolbar = await page.getByPlaceholder("Search user, action, endpoint, ID").boundingBox();
  await expect(region).toHaveAttribute("data-sk-phase", "revealed");
  expect(await widths(page)).toEqual(initial);
  await expect(page.getByRole("columnheader", { name: "Who", exact: true })).toBeVisible();
  release(); await expect(region).toHaveAttribute("data-sk-phase", "settled");
  const loaded = await widths(page);
  expect(await page.locator("h1").boundingBox()).toEqual(above);
  expect(await page.locator("[data-beside]").boundingBox()).toEqual(beside);
  expect(await page.getByPlaceholder("Search user, action, endpoint, ID").boundingBox()).toEqual(toolbar);
  const evidence = await page.evaluate(() => ({ shifts: window.skShifts, events: window.skEvents }));
  expect(evidence.shifts.length).toBeLessThanOrEqual(1);
  if (evidence.shifts.length) expect(Math.abs(evidence.shifts[0].time - evidence.events.find(event => event.phase === "swapping")!.time)).toBeLessThan(80);
  gate = new Promise<void>(resolve => { release = resolve; });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(region).toHaveAttribute("data-sk-phase", "revealed");
  const repeated = await widths(page);
  for (let i = 0; i < loaded.length; i++) expect(Math.abs(repeated[i].width - loaded[i].width)).toBeLessThanOrEqual(2);
  const properties = await region.evaluate(element => [...element.querySelectorAll("*")].map(child => parseFloat(getComputedStyle(child).transitionDuration) > 0 ? getComputedStyle(child).transitionProperty : "none"));
  expect(properties.every(property => !/(^|,\s*)(width|height|left|top|all)(,|$)/.test(property))).toBe(true);
  const animated = await page.evaluate(() => document.getAnimations().flatMap(animation => animation.effect!.getKeyframes().flatMap(frame => Object.keys(frame))));
  expect(animated.every(property => ["opacity", "transform", "offset", "computedOffset", "easing", "composite"].includes(property))).toBe(true);
  release(); await expect(region).toHaveAttribute("data-sk-phase", "settled");
  await expect(page.locator("[data-sk-layer]")).toHaveCount(0);
});

test("auto-column classification requires observed data-dependent widths", async ({ page }) => {
  const results: number[][] = [];
  for (const long of [false, true]) {
    await page.route("**/api/audit-logs?**", route => route.fulfill({ json: fixture(long, 1) }));
    await page.goto("/loading-harness.html?mode=auto");await waitForDataRoute(page);
    await expect(page.locator("[data-sk-auto-columns]")).toHaveAttribute("data-sk-phase", "settled");
    results.push((await widths(page)).map(column => column.width));
    await page.unroute("**/api/audit-logs?**");
  }
  expect(results[0].some((width, index) => Math.abs(width - results[1][index]) > 1), "AUTO-COLUMN classification must be justified by measured width changes").toBe(true);
});
