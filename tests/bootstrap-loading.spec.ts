import { test, expect } from "@playwright/test";
import { mockTeacher } from "./fixtures/teacher";

async function bootstrap(page: import("@playwright/test").Page, quick = false) {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  const releaseData = await mockTeacher(page, false);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/teacherDashboard")) requests.push(request.url()); });
  await page.addInitScript(() => {
    Object.assign(window, { bootstrapFrames: [] });
    const record = () => {
      const root = document.querySelector('[data-sk-region="auth-bootstrap"], .qed-fill');
      const logo = root?.querySelector('[data-bootstrap-loader], .qed-wrap');
      if (root) (window as unknown as { bootstrapFrames: unknown[] }).bootstrapFrames.push({
        time: performance.now(), busy: root.getAttribute("aria-busy"),
        visible: !!logo && getComputedStyle(logo).visibility !== "hidden" && logo.getBoundingClientRect().height > 0,
        status: root.querySelectorAll(':scope > [role="status"]').length,
      });
    };
    new MutationObserver(record).observe(document, { subtree: true, childList: true, attributes: true });
  });
  await page.route("**/api/auth/me", async route => {
    if (quick) await new Promise(resolve => setTimeout(resolve, 60)); else await gate;
    await route.fulfill({ json: { user: { id: "1", role: "TEACHER", name: "Marie Dela Cruz", user_name: "teacher" } } });
  });
  await page.goto("/teacher");
  return { release, releaseData, requests };
}
test("bootstrap 60ms never shows the brand loader or status", async ({ page }) => {
  // Explicit fast-code fixture: preload the known fixture role before mounting
  // the real app. This isolates the 60ms auth path from cold dev compilation.
  // Application login/session imports still start only after receiving the role;
  // role-bundles.spec.ts separately exercises cold and 1500ms role imports.
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  const releaseData = await mockTeacher(page, false);
  await page.addInitScript(() => {
    Object.assign(window, { bootstrapFrames: [] });
    new MutationObserver(() => {
      const root = document.querySelector('[data-sk-region="auth-bootstrap"], .qed-fill');
      const logo = root?.querySelector('[data-bootstrap-loader], .qed-wrap');
      if (root) (window as unknown as { bootstrapFrames: unknown[] }).bootstrapFrames.push({
        visible: !!logo && getComputedStyle(logo).visibility !== "hidden" && logo.getBoundingClientRect().height > 0,
        status: root.querySelectorAll(':scope > [role="status"]').length,
      });
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
  await page.route("**/api/auth/me", async route => {
    await new Promise(resolve => setTimeout(resolve, 60));
    await route.fulfill({ json: { user: { id: "1", role: "TEACHER", name: "Marie Dela Cruz", user_name: "teacher" } } });
  });
  await page.route("**/bootstrap-fast-role.html", route => route.fulfill({ contentType: "text/html", body: '<!doctype html><html><body><div id="root"></div></body></html>' }));
  await page.goto("/bootstrap-fast-role.html");
  await page.evaluate(async () => {
    const refresh = await import(/* @vite-ignore */ "/@react-refresh");
    refresh.default.injectIntoGlobalHook(window);
    Object.assign(window, { $RefreshReg$: () => {}, $RefreshSig$: () => (type: unknown) => type, __vite_plugin_react_preamble_installed__: true });
    await import(/* @vite-ignore */ "/src/routes/roles/TeacherRoutes.tsx");
    history.replaceState(null, "", "/teacher");
    await import(/* @vite-ignore */ "/src/main.tsx");
  });
  await expect(page.getByRole("heading", { name: /Good .*, Marie Dela Cruz!/ })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { bootstrapFrames: { visible: boolean; status: number }[] }).bootstrapFrames.some(x => x.visible || x.status))).toBe(false);
  await expect(page.locator('[data-bootstrap-loader], .qed-wrap')).toHaveCount(0);
  releaseData();
});
test("revealed bootstrap animates only the real logo opacity, never rotation", async ({ page }) => {
  const { release, releaseData } = await bootstrap(page);
  await expect(page.locator('[data-bootstrap-loader], .qed-wrap')).toBeVisible();
  const frames = await page.evaluate(() => document.getAnimations().flatMap(animation => animation.effect?.getKeyframes() ?? []));
  expect(frames.length).toBeGreaterThan(0);
  for (const frame of frames) {
    expect(Object.keys(frame).filter(key => !["offset", "computedOffset", "easing", "composite", "opacity"].includes(key))).toEqual([]);
  }
  await expect(page.locator('[data-bootstrap-loader] img')).toHaveAttribute("src", /QED_Logo/);
  release(); releaseData();
});
test("bootstrap reduced motion has no running animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { release, releaseData } = await bootstrap(page);
  await expect(page.locator('[data-bootstrap-loader], .qed-wrap')).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.playState === "running").map(a => ({
    name: (a as CSSAnimation).animationName,
    target: ((a.effect as KeyframeEffect)?.target as Element)?.outerHTML,
    timing: a.effect?.getTiming(),
  })))).toEqual([]);
  release(); releaseData();
});
test("bootstrap busy and status follow reveal, minimum duration, and DOM cleanup", async ({ page }) => {
  const { release, releaseData } = await bootstrap(page);
  const root = page.locator('[data-sk-region="auth-bootstrap"], .qed-fill');
  await expect(root).toHaveAttribute("aria-busy", "true");
  await expect(root.getByRole("status")).toHaveText("Loading…");
  release();
  await expect(page.getByRole("heading", { name: /Good .*, Marie Dela Cruz!/ })).toBeVisible();
  const evidence = await page.evaluate(() => (window as unknown as { bootstrapFrames: { time: number; busy: string; visible: boolean; status: number }[] }).bootstrapFrames);
  const visible = evidence.find(x => x.visible)!;
  const done = evidence.find(x => x.busy === "false")!;
  expect(done.time - visible.time).toBeGreaterThanOrEqual(390);
  for (const frame of evidence) if (!frame.visible) expect(frame.status).toBe(0);
  await expect(page.locator('[data-bootstrap-loader], .qed-wrap')).toHaveCount(0);
  await expect(root).toHaveCount(0);
  releaseData();
});
test("protected components and page requests never render before auth resolves", async ({ page }) => {
  const { release, releaseData, requests } = await bootstrap(page);
  await expect(page.locator('[data-bootstrap-loader], .qed-wrap')).toBeVisible();
  await expect(page.locator(".qed-account-ui, main, [data-sk-chart]")).toHaveCount(0);
  expect(requests).toEqual([]);
  release(); releaseData();
  await expect(page.locator(".qed-account-ui")).toBeVisible();
});
for (const width of [375, 1280]) test(`lazy route ${width}: registered composition inside real shell with stable surroundings`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  const releaseData = await mockTeacher(page, false);
  const pageRequests: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/teacherDashboard")) pageRequests.push(request.url()); });
  let releaseChunk!: () => void;
  const chunk = new Promise<void>(resolve => { releaseChunk = resolve; });
  await page.route("**/src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.tsx", async route => { await chunk; await route.continue(); });
  await page.goto("/teacher", { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-route-skeleton="/teacher"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: /Good .*, Marie Dela Cruz!/ })).toBeVisible();
  await expect(page.locator('[data-sk-chart="ring"]')).toBeAttached();
  await expect(page.locator(".qed-wrap, .qed-spinner, [data-bootstrap-loader]")).toHaveCount(0);
  expect(pageRequests, "the fallback is a layout preview, not a second page fetch").toEqual([]);
  await page.evaluate(() => document.fonts.ready);
  const positions = await page.locator("header, aside").evaluateAll(elements => elements.map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
  expect(positions.length).toBeGreaterThan(0);
  releaseChunk();
  await expect(page.locator('[data-route-skeleton]')).toHaveCount(0);
  expect(await page.locator("header, aside").evaluateAll(elements => elements.map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }))).toEqual(positions);
  releaseData();
});
