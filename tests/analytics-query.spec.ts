import { test, expect, type Page } from "@playwright/test";
import { mockAnalytics, analyticsEndpoints, type AnalyticsEndpoint } from "./fixtures/analytics";

// MOCKED: real hooks, singleton QueryClient and AuthProvider; no live backend.
async function fixture(page: Page, holdAuth = false) {
  let releaseAuth = () => {};
  const gate = holdAuth ? new Promise<void>(r => { releaseAuth = r; }) : Promise.resolve();
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me") { await gate; return route.fulfill({ json: { user: { id: "1", role: "PRINCIPAL", user_name: "principal" } } }); }
    return route.fulfill({ json: path.includes("user-profile") ? { id: "1", role: "PRINCIPAL", userName: "principal" } : { success: true } });
  });
  const f = await mockAnalytics(page);
  await page.goto("/tests/analytics-query.html");
  await expect(page.getByTestId("auth")).toHaveText(holdAuth ? "pending" : "1");
  return { ...f, releaseAuth };
}
const click = (p: Page, name: string) => p.getByRole("button", { name, exact: true }).click();
const section = (p: Page, kind = "subjects") => p.getByTestId(kind).first();
const start = (p: Page) => click(p, "Toggle preview");
const toggle = (p: Page) => click(p, "Toggle analytics");
const retry = (p: Page, kind = "subjects") => click(p, `Retry ${kind}`);
const loaded = async (p: Page, kind = "subjects", marker = "Term 1") => {
  await expect(section(p, kind).getByTestId("data")).toContainText(marker);
  await expect(section(p, kind).getByTestId("loading")).toHaveText("false");
};
const keys = (p: Page) => p.evaluate(async () => {
  // @ts-expect-error browser-only Vite import
  const { queryClient } = await import("/src/shared/query/queryClient.ts");
  return queryClient.getQueryCache().getAll().filter((q: { state: { data: unknown } }) => q.state.data !== undefined).map((q: { queryKey: unknown[] }) => q.queryKey);
});

test("auth readiness and preview suppress analytics requests and private values", async ({ page }) => {
  const f = await fixture(page, true); await start(page);
  analyticsEndpoints.forEach(e => expect(f.state[e].calls).toBe(0)); f.releaseAuth(); await loaded(page);
  await start(page); await expect(section(page).getByTestId("data")).toHaveText("[]");
});
test("initial loading, same-key observers, navigation and shared term/year reads deduplicate", async ({ page }) => {
  const f = await fixture(page); f.hold("subjects"); await click(page, "Toggle holistic"); await start(page);
  await expect(section(page).getByTestId("loading")).toHaveText("true"); await loaded(page, "holistic");
  await click(page, "Toggle second observer"); f.release("subjects"); await loaded(page);
  await expect(page.getByTestId("secondary").getByTestId("data")).toContainText("Term 1 Mathematics");
  await toggle(page); await toggle(page); await loaded(page); await loaded(page, "holistic");
  analyticsEndpoints.forEach(e => expect(f.state[e].calls).toBe(1));
});
for (const kind of ["subjects", "holistic"]) test(`${kind} empty arrays remain successful`, async ({ page }) => {
  const f = await fixture(page); f.setEmpty(); if (kind === "holistic") await click(page, "Toggle holistic"); await start(page);
  await expect(section(page, kind).getByTestId("loading")).toHaveText("false"); await expect(section(page, kind).getByTestId("data")).toHaveText("[]");
  await expect(section(page, kind).getByTestId("error")).toBeEmpty();
});
for (const endpoint of analyticsEndpoints) test(`${endpoint} independent 500 stops loading, preserves sibling view and explicitly recovers`, async ({ page }) => {
  const f = await fixture(page); f.state[endpoint].status = 500; await click(page, "Toggle holistic"); await start(page);
  const kind = endpoint === "views" || endpoint === "holistic" ? "holistic" : "subjects";
  await expect(section(page, kind).getByTestId("error")).toContainText(endpoint === "year" ? "Failed to fetch academic year." : "500"); await expect(section(page, kind).getByTestId("loading")).toHaveText("false");
  if (endpoint === "subjects" || endpoint === "grades") await loaded(page, "holistic");
  if (endpoint === "holistic" || endpoint === "views") await loaded(page);
  expect(f.state[endpoint].calls).toBe(1); f.state[endpoint].status = 200; await retry(page, kind);
  await expect.poll(() => f.state[endpoint].calls).toBe(2); await expect(section(page, kind).getByTestId("error")).toBeEmpty(); await loaded(page, kind);
  expect(f.state[endpoint].calls).toBe(2);
});
test("complete reports failure has no automatic retries; explicit Retry recovers all three readers", async ({ page }) => {
  const f = await fixture(page); for (const e of ["terms", "grades", "subjects"] as const) f.state[e].status = 500;
  await start(page); await expect(section(page).getByTestId("error")).not.toBeEmpty(); await expect(section(page).getByTestId("loading")).toHaveText("false");
  await page.waitForTimeout(150); for (const e of ["terms", "grades", "subjects"] as const) { expect(f.state[e].calls).toBe(1); f.state[e].status = 200; }
  await retry(page); await loaded(page); for (const e of ["terms", "grades", "subjects"] as const) expect(f.state[e].calls).toBe(2);
});
test("Retry clears ordinary errors and restores loading during pending context revalidation", async ({ page }) => {
  const f = await fixture(page); f.state.subjects.status = 500; await start(page);
  await expect(section(page).getByTestId("error")).toContainText("500"); f.state.subjects.status = 200; f.hold("year"); await retry(page);
  await expect(section(page).getByTestId("loading")).toHaveText("true"); await expect(section(page).getByTestId("error")).toBeEmpty();
  f.release("year"); await loaded(page); expect(f.state.subjects.calls).toBe(2);
});
test("retrying one failed view preserves successful sibling cache without redundant sibling requests", async ({ page }) => {
  const f = await fixture(page); f.state.subjects.status = 500; await click(page, "Toggle holistic"); await start(page); await loaded(page, "holistic");
  await expect(section(page).getByTestId("error")).toContainText("500"); f.state.subjects.status = 200; await retry(page); await loaded(page);
  await expect(section(page, "holistic").getByTestId("error")).toBeEmpty(); expect(f.state.holistic.calls).toBe(1); expect(f.state.views.calls).toBe(1);
});
for (const endpoint of ["year", "subjects", "holistic"] as const) test(`${endpoint} malformed 403 retains privacy and never expires session`, async ({ page }) => {
  const f = await fixture(page); await click(page, "Toggle holistic"); await start(page); await loaded(page); await loaded(page, "holistic");
  const path = endpoint === "year" ? "/academic-year/getAcademicYear" : `/reports/${endpoint === "subjects" ? "subject-ranking" : "holistic"}?**`;
  await page.route(`**/api${path}`, route => route.fulfill({ status: 403, contentType: "text/html", body: "Forbidden" }));
  const kind = endpoint === "holistic" ? "holistic" : "subjects"; await retry(page, kind);
  await expect(section(page, kind).getByTestId("error")).not.toBeEmpty(); await expect(section(page, kind).getByTestId("data")).toHaveText("[]");
  await expect(page.getByTestId("auth")).toHaveText("1"); await page.context().setOffline(true);
  await expect(section(page, kind).getByTestId("data")).toHaveText("[]");
  expect(f.state.subjects.calls).toBe(1);
});
test("success-false API envelope preserves the existing error and explicit recovery", async ({ page }) => {
  await fixture(page); let broken = true;
  await page.route("**/api/reports/subject-ranking?**", route => broken ? route.fulfill({ json: { success: false, message: "Synthetic report unavailable", data: [] } }) : route.fallback());
  await start(page); await expect(section(page).getByTestId("error")).toHaveText("Synthetic report unavailable"); await expect(section(page).getByTestId("loading")).toHaveText("false");
  broken = false; await retry(page); await loaded(page); await expect(section(page).getByTestId("error")).toBeEmpty();
});
test("lookup freshness is five minutes; analytics/year freshness is thirty seconds", async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await toggle(page); await toggle(page); await loaded(page);
  expect(f.state.subjects.calls).toBe(1); await toggle(page); await page.clock.fastForward(31_000); await toggle(page); await loaded(page);
  expect(f.state.year.calls).toBe(2); expect(f.state.subjects.calls).toBe(2); expect(f.state.terms.calls).toBe(1); expect(f.state.grades.calls).toBe(1);
  await toggle(page); await page.clock.fastForward(270_000); await toggle(page); await loaded(page);
  expect(f.state.terms.calls).toBe(2); expect(f.state.grades.calls).toBe(2);
});
test("inactive analytics GC removes data after five minutes; lookup GC is ten minutes", async ({ page }) => {
  await fixture(page); await page.clock.install(); await start(page); await loaded(page); await toggle(page); await page.clock.fastForward(301_000);
  const remaining = await keys(page); expect(remaining.some((k: unknown[]) => k.includes("subjects"))).toBe(false); expect(remaining.some((k: unknown[]) => k.includes("terms"))).toBe(true);
  await page.clock.fastForward(300_000); expect(await keys(page)).toEqual([]);
});
test("grade changes stay local; rapid terms cancel older requests and returning to fresh term reuses it", async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await click(page, "Grade 1"); expect(f.state.subjects.calls).toBe(1);
  f.hold("subjects"); await section(page).getByRole("button", { name: "Term 2", exact: true }).click(); await expect.poll(() => f.state.subjects.calls).toBe(2);
  await section(page).getByRole("button", { name: "Term 3", exact: true }).click(); await expect.poll(() => f.state.subjects.calls).toBe(3);
  f.release("subjects"); await loaded(page, "subjects", "Term 3 Mathematics");
  await section(page).getByRole("button", { name: "Term 1", exact: true }).click(); await loaded(page); expect(f.state.subjects.calls).toBe(3);
  expect(f.requests.filter(r => r.endpoint === "subjects").map(r => r.term)).toEqual(["Term 1", "Term 2", "Term 3"]);
  expect(f.state.year.calls).toBe(1);
});
test("holistic term/view keys separate responses and rapid view switching cannot overwrite current results", async ({ page }) => {
  const f = await fixture(page); await click(page, "Toggle holistic"); await start(page); await loaded(page, "holistic");
  f.hold("holistic"); await click(page, "By Subject"); await expect.poll(() => f.state.holistic.calls).toBe(2);
  await section(page, "holistic").getByRole("button", { name: "Term 2", exact: true }).click(); await expect.poll(() => f.state.holistic.calls).toBe(3);
  f.release("holistic"); await loaded(page, "holistic", "Term 2 By Subject");
  await click(page, "By Grade Level"); await loaded(page, "holistic", "Term 2 By Grade Level");
  expect(f.requests.filter(r => r.endpoint === "holistic").map(r => [r.term, r.view])).toEqual([["Term 1", "By Grade Level"], ["Term 1", "By Subject"], ["Term 2", "By Subject"], ["Term 2", "By Grade Level"]]);
});
for (const mounted of [false, true]) test(`year rollover ${mounted ? "explicit" : "stale remount"} separates all keys without old-year placeholder or duplicate calls`, async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); if (!mounted) await toggle(page);
  f.setYear(2); f.setMarker("New year"); f.hold("subjects");
  if (mounted) await retry(page); else { await page.clock.fastForward(31_000); await toggle(page); }
  await expect.poll(() => f.state.subjects.calls).toBe(2); await expect(section(page).getByTestId("data")).toHaveText("[]");
  f.release("subjects"); await loaded(page, "subjects", "New year");
  expect(f.state.year.calls).toBe(2); expect(f.state.terms.calls).toBe(2); expect(f.state.grades.calls).toBe(2); expect(f.state.subjects.calls).toBe(2);
  expect((await keys(page)).some((k: unknown[]) => k.includes("analytics") && k[6] === 2)).toBe(true);
});
for (const kind of ["subjects", "holistic"] as const) test(`${kind} filter change revalidates stale year before any new-filter HTTP read`, async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await click(page, "Toggle holistic"); await start(page); await loaded(page); await loaded(page, "holistic");
  await page.clock.fastForward(31_000); f.setYear(2); f.setMarker("New year"); f.hold("year");
  await section(page, kind).getByRole("button", { name: "Term 2", exact: true }).click(); await expect.poll(() => f.state.year.calls).toBe(2);
  expect(f.state[kind].calls).toBe(1); f.release("year"); await loaded(page, kind, "New year");
  expect(f.state[kind].calls).toBe(2); expect(f.state.year.calls).toBe(2);
  expect(f.requests.filter(r => r.endpoint === kind && r.term === "Term 2")).toEqual([{ endpoint: kind, term: "Term 2", view: kind === "holistic" ? "By Grade Level" : null, year: 2 }]);
  expect((await keys(page)).some((k: unknown[]) => k.includes("analytics") && k[6] === 1 && k[7] === kind && k[8] === "Term 2")).toBe(false);
});
test("initial offline settles with connection error and resumes once; repeated Retry queues no work", async ({ page }) => {
  const f = await fixture(page); await page.context().setOffline(true); await start(page);
  await expect(section(page).getByTestId("loading")).toHaveText("false"); await expect(section(page).getByTestId("error")).toContainText("offline");
  for (let i = 0; i < 3; i++) await retry(page); analyticsEndpoints.forEach(e => expect(f.state[e].calls).toBe(0));
  await page.context().setOffline(false); await loaded(page); for (const e of ["year", "terms", "grades", "subjects"] as const) expect(f.state[e].calls).toBe(1);
});
test("offline filter change never labels previous-term placeholders as current data; reconnect fetches once", async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await page.context().setOffline(true);
  await section(page).getByRole("button", { name: "Term 2", exact: true }).click();
  await expect(section(page).getByTestId("term")).toHaveText("Term 2"); await expect(section(page).getByTestId("data")).toHaveText("[]");
  await expect(section(page).getByTestId("loading")).toHaveText("false"); await expect(section(page).getByTestId("error")).toContainText("offline"); expect(f.state.subjects.calls).toBe(1);
  await page.context().setOffline(false); await loaded(page, "subjects", "Term 2 Mathematics"); expect(f.state.subjects.calls).toBe(2);
});
for (const stale of [false, true]) test(`${stale ? "stale" : "fresh"} cached offline analytics survives unmounted connectivity events`, async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await toggle(page);
  if (stale) await page.clock.fastForward(31_000); await page.context().setOffline(true); await toggle(page); await loaded(page);
  await expect(section(page).getByTestId("error")).toContainText("offline"); for (let i = 0; i < 3; i++) await retry(page);
  await page.context().setOffline(false); await expect(section(page).getByTestId("error")).toBeEmpty(); await loaded(page);
  await expect.poll(() => f.state.subjects.calls).toBe(stale ? 2 : 1); expect(f.state.terms.calls).toBe(1);
});
for (const endpoint of analyticsEndpoints) {
  test(`${endpoint} 401 independently expires session and clears private cache`, async ({ page }) => {
    const f = await fixture(page); f.state[endpoint].status = 401; await click(page, "Toggle holistic"); await start(page);
    await expect(page.getByTestId("auth")).toHaveText("signed-out"); expect(await keys(page)).toEqual([]);
    await expect(section(page).getByTestId("data")).toHaveText("[]"); await expect(section(page, "holistic").getByTestId("data")).toHaveText("[]");
  });
  test(`${endpoint} 403 hides affected private analytics, keeps login and recovers`, async ({ page }) => {
    const f = await fixture(page); await click(page, "Toggle holistic"); await start(page); await loaded(page); await loaded(page, "holistic");
    f.state[endpoint].status = 403; const kind = endpoint === "holistic" || endpoint === "views" ? "holistic" : "subjects";
    await retry(page, kind); await expect(section(page, kind).getByTestId("error")).toContainText(endpoint === "year" ? "Failed to fetch academic year." : "403");
    await expect(section(page, kind).getByTestId("data")).toHaveText("[]"); await expect(page.getByTestId("auth")).toHaveText("1");
    f.state[endpoint].status = 200; await retry(page, kind); await loaded(page, kind);
  });
}
for (const [first, late] of [["subjects", "terms"], ["terms", "subjects"], ["holistic", "views"], ["views", "holistic"]] as [AnalyticsEndpoint, AnalyticsEndpoint][]) test(`${first} 500 cannot mask delayed ${late} 401`, async ({ page }) => {
  const f = await fixture(page); f.state[first].status = 500; f.state[late].status = 401; f.hold(late); await click(page, "Toggle holistic"); await start(page);
  const kind = first === "holistic" || first === "views" ? "holistic" : "subjects";
  await expect(section(page, kind).getByTestId("error")).toContainText("500"); f.release(late); await expect(page.getByTestId("auth")).toHaveText("signed-out");
});
for (const status of [200, 401]) for (const transition of ["switch", "logout-login"]) test(`old ${status} responses cannot overwrite or expire session after ${transition}`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.state.subjects.status = status; f.hold("subjects");
  await retry(page); await expect.poll(() => f.state.subjects.calls).toBe(2);
  f.state.subjects.status = 200; f.setMarker("New account");
  if (transition === "switch") await click(page, "Switch account");
  else { await click(page, "Logout"); await click(page, "Log out"); await expect(page.getByTestId("auth")).toHaveText("signed-out"); expect(await keys(page)).toEqual([]); await click(page, "Login again"); }
  await expect.poll(() => f.state.subjects.calls).toBe(3); f.release("subjects"); await loaded(page, "subjects", "New account");
  const id = transition === "switch" ? "2" : "1"; await expect(page.getByTestId("auth")).toHaveText(id);
  expect((await keys(page)).every((k: unknown[]) => k[2] === "PRINCIPAL" && k[3] === id)).toBe(true);
});
test("pending readers cancel on unmount; repeated retry does not duplicate requests", async ({ page }) => {
  const f = await fixture(page); for (const e of ["terms", "grades", "subjects"] as const) f.hold(e); let aborted = 0;
  page.on("requestfailed", r => { if (r.url().includes("/reports/") && /abort/i.test(r.failure()?.errorText ?? "")) aborted++; });
  await start(page); await expect.poll(() => f.state.subjects.calls).toBe(1); for (let i = 0; i < 3; i++) await retry(page);
  await toggle(page); await expect.poll(() => aborted).toBe(3); for (const e of ["terms", "grades", "subjects"] as const) { expect(f.state[e].calls).toBe(1); f.release(e); }
});
test("pending year Retry cannot refresh an old filter after term changes or unmount", async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.hold("year"); await retry(page);
  await section(page).getByRole("button", { name: "Term 2", exact: true }).click(); await toggle(page); f.release("year"); await page.waitForTimeout(100);
  expect(f.state.subjects.calls).toBe(1);
});
test("term switching during year Retry starts only the new filter after context resolves", async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.hold("year"); await retry(page);
  await section(page).getByRole("button", { name: "Term 2", exact: true }).click(); f.release("year"); await loaded(page, "subjects", "Term 2 Mathematics");
  expect(f.requests.filter(r => r.endpoint === "subjects").map(r => r.term)).toEqual(["Term 1", "Term 2"]);
});
for (const transition of ["switch", "logout-login"]) test(`old year 401 cannot expire newer session after ${transition}`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.state.year.status = 401; f.hold("year"); await retry(page);
  await expect.poll(() => f.state.year.calls).toBe(2); f.state.year.status = 200; f.setMarker("New account");
  if (transition === "switch") await click(page, "Switch account"); else { await click(page, "Logout"); await click(page, "Log out"); await expect(page.getByTestId("auth")).toHaveText("signed-out"); await click(page, "Login again"); }
  await expect.poll(() => f.state.year.calls).toBe(3); f.release("year"); await loaded(page, "subjects", "New account");
  await expect(page.getByTestId("auth")).toHaveText(transition === "switch" ? "2" : "1");
});
for (const role of ["ADMIN", "TEACHER", "PARENT"]) test(`${role} cannot fetch or expose Principal analytics`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await click(page, `Switch ${role}`);
  await expect(section(page).getByTestId("data")).toHaveText("[]"); expect(await keys(page)).toEqual([]); expect(f.state.subjects.calls).toBe(1);
});
