import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect } from "@playwright/test";
import fs from "node:fs";

import { mockTeacher } from "./fixtures/teacher";

for (const width of [375, 1280]) for (const dark of [false, true]) test(`teacher dashboard ${width}px ${dark ? "dark" : "light"}: real route, stable stat geometry and screenshots`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await mockTeacher(page, dark);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/teacher");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Weekly Class Schedule" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today's Attendance" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Full Report" })).toBeVisible();
  await expect(page.getByText("School Calendar", { exact: true })).toBeAttached();
  await expect(page.locator(".qed-splash")).toHaveCount(0);
  await page.waitForFunction(() => [...document.querySelectorAll(".sk-region")].some(e => e.getAttribute("data-sk-phase") === "revealed"));
  const stats = page.locator(".sk-region:not([data-sk-variable])");
  const before = await stats.evaluateAll(es => es.map(e => ({ x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y, height: e.getBoundingClientRect().height })));
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/teacher-dashboard-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release();
  await expect(page.locator("[data-sk-layer]")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
  const after = await stats.evaluateAll(es => es.map(e => ({ x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y, height: e.getBoundingClientRect().height })));
  expect(after.length).toBe(before.length);
  for (let i = 0; i < before.length; i++) { expect(Math.abs(after[i].x - before[i].x)).toBeLessThanOrEqual(1); expect(Math.abs(after[i].height - before[i].height)).toBeLessThanOrEqual(1); }
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect!.getTiming().iterations === Infinity).length)).toBe(0);
});

test("classification rejects fixed regions whose loaded height depends on data size", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 1000 });
  const heights: Record<string, number>[] = [];
  for (const [index, name] of ["Ana", "Marie Dela Cruz", "Maria Alexandra Isabella ".repeat(8)].entries()) {
    const release = await mockTeacher(page, false, name, false, [1, 21, 987654][index]);
    await page.goto("/teacher");await waitForDataRoute(page);
    await expect(page.getByText("Welcome back", { exact: true })).toBeVisible();
    release(); await expect(page.locator("[data-sk-layer]")).toHaveCount(0);
    heights.push(await page.locator("[data-sk-fixed-region]").evaluateAll(es => Object.fromEntries(es.map(e => [(e as HTMLElement).dataset.skFixedRegion!, e.getBoundingClientRect().height]))));
  }
  expect(Object.keys(heights[0]).length).toBe(4);
  for (const key of Object.keys(heights[0])) for (const result of heights) expect(result[key], `${key} incorrectly classified fixed`).toBe(heights[0][key]);
});

for (const name of ["Ana", "Marie Dela Cruz", "Maria Alexandra Isabella " .repeat(8)]) test(`teacher wrapping name classification: ${name.length} characters`, async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 1000 });
  const release = await mockTeacher(page, false, name);
  await page.goto("/teacher");await waitForDataRoute(page);
  await expect(page.getByText("Welcome back", { exact: true })).toBeVisible();
  const banner = page.locator("[data-sk-variable].sk-surface-brand");
  await expect(banner).toHaveCount(1);
  release(); await expect(page.locator("[data-sk-layer]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: new RegExp(name.slice(0, 10)) })).toBeVisible();
});

