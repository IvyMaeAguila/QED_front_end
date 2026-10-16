import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect } from "@playwright/test";
import { mockTeacher } from "./fixtures/teacher";

test.beforeEach(async ({ page }) => { await page.route("https://fonts.googleapis.com/**", route => route.abort()); });

test("session identity and fixed attendance labels are real before dashboard fetch", async ({ page }) => {
  const release = await mockTeacher(page, false);
  await page.goto("/teacher");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: /Good .*, Marie Dela Cruz!/ })).toBeVisible();
  for (const label of ["Status", "Students", "Share", "Present", "Late", "Absent", "Present rate"])
    await expect(page.getByText(label, { exact: true }).last()).toBeVisible();
  release();
});

test("attendance skeleton retains the real ring chart shape", async ({ page }) => {
  const release = await mockTeacher(page, false);
  await page.goto("/teacher");await waitForDataRoute(page);
  const chart = page.locator('[data-sk-chart="ring"]');
  await expect(chart).toBeVisible();
  await expect(chart.locator('[data-sk-primitive="block"]')).toHaveCSS("mask-image", /radial-gradient/);
  release(); await expect(page.locator("[data-sk-layer]")).toHaveCount(0);
  await expect(chart.locator("svg circle").first()).toHaveAttribute("fill", "none");
});

test("table refetch keeps old rows until delay then dims without a spinner", async ({ page }) => {
  let release!: () => void;
  let gate = Promise.resolve();
  await page.route("**/api/audit-logs?**", async route => {
    await gate;
    await route.fulfill({ json: { success: true, data: { total: 1, page: 1, limit: 20, entries: [{ id: 1, createdAt: "2026-10-08T02:00:00Z", actorFullName: "Existing Teacher", actorUsername: "teacher", actorRole: "TEACHER", action: "LOGIN", resource: "student", resourceId: "1", httpMethod: "GET", endpoint: "/api/me", statusCode: 200 }] } } });
  });
  await page.goto("/loading-harness.html?mode=auto");await waitForDataRoute(page);
  const region = page.locator("[data-sk-auto-columns]");
  await expect(region).toHaveAttribute("data-sk-phase", "settled");
  gate = new Promise<void>(resolve => { release = resolve; });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByText("Existing Teacher", { exact: true })).toBeVisible();
  await expect(region).toHaveAttribute("data-sk-phase", "dimmed");
  await expect(region.locator("[data-sk-stale]")).toHaveCSS("opacity", "0.6");
  await expect(region.locator("[data-sk-layer]")).toHaveCount(0);
  release(); await expect(region).toHaveAttribute("data-sk-phase", "settled");
});

for (const theme of ["light", "dark"]) test(`${theme}: shine is distinct from every surface`, async ({ page }) => {
  await page.goto(`/loading-harness.html?latency=1500&surfaces&theme=${theme}`);await waitForDataRoute(page);
  const results = await page.locator("[data-surface]").evaluateAll(surfaces => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    const luminance = (color: string) => {
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
    };
    return surfaces.map(surface => {
      const primitive = surface.querySelector<HTMLElement>("[data-sk-primitive]")!;
      const probe = document.createElement("span"); primitive.append(probe); probe.style.background = "var(--sk-shine)";
      const shine = luminance(getComputedStyle(probe).backgroundColor); probe.remove();
      const background = luminance(getComputedStyle(surface).backgroundColor);
      const base = luminance(getComputedStyle(primitive).backgroundColor);
      return { surface: (surface as HTMLElement).dataset.surface, ratio: (Math.max(shine, background) + .05) / (Math.min(shine, background) + .05), base, shine, background };
    });
  });
  for (const result of results) {
    expect(result.ratio, result.surface).toBeGreaterThanOrEqual(1.03);
    if (theme === "light" && !["brand", "sidebar"].includes(result.surface!)) {
      expect(result.shine).toBeGreaterThan(result.base); expect(result.shine).toBeLessThan(result.background);
    } else expect(result.shine).toBeGreaterThan(result.base);
  }
});
