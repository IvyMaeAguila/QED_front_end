import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { assertNoDataSpinner } from "./design-pixels";

test.beforeEach(async ({ page }) => { await page.route("https://fonts.googleapis.com/**", route => route.abort()); });

async function auditFixture(page: Page, initialCount = 3) {
  let gate = Promise.resolve();
  let release = () => {};
  let count = initialCount;
  let version = 1;
  await page.route("**/api/audit-logs?**", async route => {
    await gate;
    await route.fulfill({ json: { success: true, data: { total: count, page: 1, limit: 20, entries: Array.from({ length: count }, (_, index) => ({ id: index + 1, createdAt: "2026-10-08T02:00:00Z", actorFullName: `Teacher ${version} ${index}`, actorUsername: "teacher", actorRole: "TEACHER", action: "LOGIN", resource: "student", resourceId: "1", httpMethod: "GET", endpoint: "/api/me", statusCode: 200 })) } } });
  });
  await page.goto("/loading-harness.html?mode=auto");await waitForDataRoute(page);
  const region = page.locator("[data-sk-auto-columns]");
  await expect(region).toHaveAttribute("data-sk-phase", "settled");
  return {
    region,
    start: async (nextCount = initialCount) => {
      count = nextCount; version++;
      gate = new Promise<void>(resolve => { release = resolve; });
      await region.evaluate(element => {
        (window as Window & { refetchPhases?: string[] }).refetchPhases = [element.getAttribute("data-sk-phase")!];
        new MutationObserver(() => (window as Window & { refetchPhases?: string[] }).refetchPhases!.push(element.getAttribute("data-sk-phase")!)).observe(element, { attributes: true, attributeFilter: ["data-sk-phase"] });
      });
      await page.getByRole("button", { name: "Refresh", exact: true }).click();
    },
    finish: () => release(),
  };
}

test("60ms refetch never dims or mounts visible skeleton rows", async ({ page }) => {
  const fixture = await auditFixture(page);
  await fixture.start();
  await expect(page.getByText("Teacher 1 0", { exact: true })).toBeVisible();
  await page.waitForTimeout(60); fixture.finish();
  await expect(fixture.region).toHaveAttribute("data-sk-phase", "settled");
  const phases = await page.evaluate(() => (window as Window & { refetchPhases?: string[] }).refetchPhases!);
  expect(phases).not.toContain("dimmed"); expect(phases).not.toContain("revealed");
  await expect(page.getByText("Teacher 2 0", { exact: true })).toBeVisible();
  await assertNoDataSpinner(page);
});

test("slow refetch dims old rows, then falls back after two seconds without moving surroundings", async ({ page }) => {
  const fixture = await auditFixture(page);
  const above = await page.locator("[data-static]").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
  const beside = await page.locator("[data-beside]").boundingBox();
  await fixture.start();
  await expect(fixture.region).toHaveAttribute("data-sk-phase", "waiting");
  await expect(fixture.region.locator("[data-sk-stale]")).toHaveCSS("opacity", "1");
  await expect(fixture.region).toHaveAttribute("data-sk-phase", "dimmed");
  await expect(page.getByText("Teacher 1 0", { exact: true })).toBeVisible();
  await expect(fixture.region.locator("[data-sk-stale]")).toHaveCSS("opacity", "0.6");
  await assertNoDataSpinner(page);
  await expect(fixture.region).toHaveAttribute("data-sk-phase", "revealed", { timeout: 2500 });
  await expect(fixture.region.locator("[data-sk-primitive]").first()).toBeVisible();
  await expect(fixture.region.locator("[data-sk-stale]")).toHaveCount(0);
  fixture.finish();
  await expect(fixture.region).toHaveAttribute("data-sk-phase", "settled");
  expect(await page.locator("[data-static]").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()))).toEqual(above);
  expect(await page.locator("[data-beside]").boundingBox()).toEqual(beside);
  await expect(fixture.region.locator("[data-sk-layer], [role=status], [data-sk-primitive]")).toHaveCount(0);
});

test("refetch after empty results uses initial skeleton reservation", async ({ page }) => {
  const fixture = await auditFixture(page, 0);
  await fixture.start(3);
  await expect(fixture.region).toHaveAttribute("data-sk-phase", "revealed");
  await expect(fixture.region.locator("[data-sk-stale]")).toHaveCount(0);
  await expect(fixture.region.locator("[data-sk-primitive]").first()).toBeVisible();
  fixture.finish();
  await expect(fixture.region).toHaveAttribute("data-sk-phase", "settled");
  await expect(page.getByText("Teacher 2 0", { exact: true })).toBeVisible();
});
