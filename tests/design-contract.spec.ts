import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect } from "@playwright/test";
import { checkShimmerPixels, staticText, assertNoDataSpinner } from "./design-pixels";
import { mockTeacher } from "./fixtures/teacher";
import fs from "node:fs";

test("skeleton CSS has token-only colors", () => {
  const css = fs.readFileSync("src/shared/loading/skeleton.css", "utf8");
  expect(css).not.toMatch(/#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|lab)a?\(/i);
  for (const declaration of css.matchAll(/(?:background|color|border-color)\s*:\s*([^;}]+)/g)) expect(declaration[1]).toMatch(/var\(--sk-/);
  const primitive = fs.readFileSync("src/shared/components/SkeletonLoading.tsx", "utf8");
  expect(primitive, "the active primitive must use the audited token stylesheet").toContain("sk-primitive");
  expect(primitive).not.toMatch(/animate-pulse|bg-(?:gray|slate|zinc|neutral)-\d+/);
});

for (const theme of ["light", "dark"]) test(`${theme}: pixel area survives all four shimmer phases on every surface`, async ({ page }) => {
  await page.goto(`/loading-harness.html?latency=60000&surfaces&theme=${theme}`);await waitForDataRoute(page);
  for (const surface of ["page", "card", "modal", "raised", "sidebar", "brand"]) await checkShimmerPixels(page.locator(`[data-surface="${surface}"] [data-sk-primitive]`), `${theme}-${surface}`);
});

for (const width of [375, 1280]) for (const dark of [false, true]) test(`teacher ${width} ${dark ? "dark" : "light"}: static content and spinner guard`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await mockTeacher(page, dark);
  await page.goto("/teacher");await waitForDataRoute(page);
  await expect(page.locator('[data-sk-chart="ring"]')).toBeAttached();
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  const pending = await staticText(page);
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  const loaded = await staticText(page);
  expect(loaded.length).toBeGreaterThan(10);
  for (const item of loaded.filter(item => item.readable)) expect(pending.some(prior => prior.name === item.name && prior.text === item.text && prior.readable), `static text absent/unreadable before fetch: ${item.name} ${item.text}`).toBe(true);
  await expect(page.getByRole("heading", { name: /Good .*, Marie Dela Cruz!/ })).toBeVisible();
});

test("negative control: shine blending into the surface is caught by the pixel guard", async ({ page }) => {
  await page.goto("/loading-harness.html?latency=60000&surfaces");await waitForDataRoute(page);
  const shape = page.locator('[data-surface="card"] [data-sk-primitive]');
  await shape.evaluate(element => {
    (element as HTMLElement).style.setProperty("--sk-shine", "var(--surface-card)");
    (element.querySelector("[data-sk-shimmer]") as HTMLElement).style.background = "linear-gradient(90deg,var(--sk-transparent),var(--sk-shine) 25%,var(--sk-shine) 75%,var(--sk-transparent))";
  });
  let failure = "";
  try { await checkShimmerPixels(shape, "negative-blended-shine"); } catch (error) { failure = String(error); }
  expect(failure, "guard must reject the washed-out area itself").toContain("visible area");
});

test("negative control: a hard shimmer edge is caught independently of visible area", async ({ page }) => {
  await page.goto("/loading-harness.html?latency=60000&surfaces");await waitForDataRoute(page);
  const shape = page.locator('[data-surface="card"] [data-sk-primitive]');
  await shape.locator("[data-sk-shimmer]").evaluate(element => { (element as HTMLElement).style.background = "linear-gradient(90deg,var(--sk-transparent) 49%,var(--sk-shine) 49%,var(--sk-shine) 75%,var(--sk-transparent) 75%)"; });
  let failure = "";
  try { await checkShimmerPixels(shape, "negative-hard-edge"); } catch (error) { failure = String(error); }
  expect(failure).toContain("hard interior sweep edge");
});
