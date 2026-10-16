import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect } from "@playwright/test";
import { captureFixedOverlay } from "./design-pixels";

test.beforeEach(async ({ page }) => { await page.route("https://fonts.googleapis.com/**", route => route.abort()); });

for (const width of [375, 1280]) for (const theme of ["light", "dark"]) test(`fixed overlay ${width} ${theme}: shared field keeps its matching box`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`/loading-harness.html?latency=2200&theme=${theme}`);await waitForDataRoute(page);
  await expect(page.locator('.sk-region')).toHaveAttribute("data-sk-phase", "revealed");
  const verify = await captureFixedOverlay(page, `harness-${width}-${theme}`, ['[data-match="number"]']);
  await expect(page.locator('.sk-region')).toHaveAttribute("data-sk-phase", "settled");
  await verify();
});

test("fixed overlay rejects a shape extending outside its matching loaded field", async ({ page }) => {
  await page.goto("/loading-harness.html?latency=2200");await waitForDataRoute(page);
  await expect(page.locator('.sk-region')).toHaveAttribute("data-sk-phase", "revealed");
  await page.locator('[data-match="number"] [data-sk-primitive]').evaluate(element => { (element as HTMLElement).style.width = "calc(100% + 64px)"; });
  const verify = await captureFixedOverlay(page, "negative-outside-field", ['[data-match="number"]']);
  await expect(page.locator('.sk-region')).toHaveAttribute("data-sk-phase", "settled");
  let failure = "";
  try { await verify(); } catch (error) { failure = String(error); }
  expect(failure).toContain("fixed shape pixels outside the matching loaded box");
});
