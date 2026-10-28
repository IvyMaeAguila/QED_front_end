import { test, expect, type Page } from "@playwright/test";
import { dashboardEndpoints, snapshotEndpoints, dashboardPaths, dashboardPayload, mockDashboard, type DashboardEndpoint } from "./fixtures/dashboard";
import { HOLISTIC_RUBRIC } from "../src/features/profiles/principal/pages/dashboard/utils/HolisticRubrics";
import { ATTENTION_ITEMS } from "../src/features/profiles/principal/pages/dashboard/data/mockData";

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) await info.attach("query-lifecycle", {
    body: JSON.stringify(await page.evaluate(async () => {
      // @ts-expect-error Vite source module, browser only.
      const { queryClient } = await import("/src/shared/query/queryClient.ts");
      return queryClient.getQueryCache().getAll().map(q => ({ key: q.queryKey, fetchStatus: q.state.fetchStatus, updatedAt: q.state.dataUpdatedAt }));
    })), contentType: "application/json" });
});
// MOCKED: actual QueryClient/AuthProvider/hook with deterministic intercepted GETs.
async function fixture(page: Page, holdAuth = false) {
  let releaseAuth = () => {};
  const authGate = holdAuth ? new Promise<void>(r => { releaseAuth = r; }) : Promise.resolve();
  await page.route("**/api/**", async route => {
    const p = new URL(route.request().url()).pathname;
    if (p === "/api/auth/me") { await authGate; return route.fulfill({ json: { user: { id: "1", role: "PRINCIPAL", user_name: "principal" } } }); }
    if (p.includes("user-profile")) return route.fulfill({ json: { id: "1", role: "PRINCIPAL", userName: "principal" } });
    return route.fulfill({ json: { success: true } });
  });
  const f = await mockDashboard(page);
  await page.goto("/tests/dashboard-query.html");
  await expect(page.getByTestId("auth")).toHaveText(holdAuth ? "pending" : "1");
  return { ...f, releaseAuth };
}
const sectionError = (p:Page,e:string) => p.getByTestId(e === "term" ? "error" : e === "year" ? "year-error" : `region-error-${({total:"overview",overview:"overview",today:"attendance",attendance:"attendance",top:"subject",ranking:"subject",holistic:"holistic",grades:"academic",trend:"academic"} as Record<string,string>)[e]}`);
const button = (p: Page, name: string) => p.getByRole("button", { name, exact: true }).click();
const start = (p: Page) => button(p, "Toggle preview");
const toggle = (p: Page) => button(p, "Toggle dashboard");
const retry = (p: Page) => button(p, "Retry query");
const settledQueries = (p: Page) => expect.poll(() => p.evaluate(async () => {
  // @ts-expect-error Vite source module, browser only.
  const { queryClient } = await import("/src/shared/query/queryClient.ts");
  return queryClient.getQueryCache().getAll().filter(q => q.queryKey[5] === "dashboard").every(q => q.state.fetchStatus === "idle");
})).toBe(true);
const loaded = async (p: Page) => {
  await expect(p.getByTestId("data")).toContainText('"totalStudents":1234');
  await expect(p.getByTestId("loading")).toHaveText("false");
};
const keys = (p: Page) => p.evaluate(async () => {
  // @ts-expect-error Vite source module, browser only.
  const { queryClient } = await import("/src/shared/query/queryClient.ts");
  return queryClient.getQueryCache().getAll().filter((q: { state: { data: unknown } }) => q.state.data !== undefined).map((q: { queryKey: unknown[] }) => q.queryKey);
});

test("auth readiness and preview prevent all private dashboard requests", async ({ page }) => {
  const f = await fixture(page, true); await start(page);
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(0)); f.releaseAuth(); await loaded(page);
  await start(page); await expect(page.getByTestId("data")).toBeEmpty(); await expect(page.getByTestId("year")).toBeEmpty();
});
test("initial loading, concurrent observers and fresh navigation deduplicate all eleven requests", async ({ page }) => {
  const f = await fixture(page); f.hold("overview"); await start(page);
  await expect(page.getByTestId("loading")).toHaveText("true"); await expect(page.getByTestId("year")).toHaveText("Year 1");
  await button(page, "Toggle second observer"); f.release("overview"); await loaded(page);
  await expect(page.getByTestId("secondary")).toHaveText("17"); await button(page, "Toggle second observer");
  await toggle(page); await toggle(page); await loaded(page); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
});
test("aggregate preserves every field, numeric conversion, null score, ranking order and static rubric", async ({ page }) => {
  await fixture(page); await start(page); await loaded(page);
  const result = JSON.parse((await page.getByTestId("data").textContent())!);
  expect(result).toEqual({ overview: { totalStudents: 1234, ...dashboardPayload.overview, needsIntervention: 0 },
    todaysAttendance: dashboardPayload.today, performanceByGrade: dashboardPayload.grades.data, performanceTrend: dashboardPayload.trend.data,
    attendanceByGrade: dashboardPayload.attendance, topSubjectPerGrade: dashboardPayload.top, subjectRankingByTerm: dashboardPayload.ranking,
    holisticDomains: dashboardPayload.holistic.data, holisticRubric: HOLISTIC_RUBRIC, attentionItems: ATTENTION_ITEMS, currentTerm: "Term 2" });
  await expect(page.getByTestId("ranking-term")).toHaveText("Term 2");
});
test("empty snapshot remains successful rather than an error", async ({ page }) => {
  const f = await fixture(page); f.setEmpty(); await start(page);
  await expect(page.getByTestId("data")).toContainText('"totalStudents":0'); await expect(page.getByTestId("error")).toBeEmpty();
  const result = JSON.parse((await page.getByTestId("data").textContent())!);
  expect(result.performanceByGrade).toEqual([]); expect(result.holisticDomains).toEqual([]); expect(result.subjectRankingByTerm["Term 2"]).toEqual([]);
});
test("independent year failure leaves the snapshot usable and year Retry does not refetch sections", async ({ page }) => {
  const f = await fixture(page); f.state.year.status = 500; await start(page); await loaded(page);
  await expect(page.getByTestId("year-error")).toContainText("500"); await expect(page.getByTestId("error")).toBeEmpty();
  f.state.year.status = 200; await button(page, "Retry year"); await expect(page.getByTestId("year")).toHaveText("Year 1");
  snapshotEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
});
for (const endpoint of ["term", "overview", "trend"] as DashboardEndpoint[]) test(`${endpoint} failure preserves independent data, bounded retry and recovery`, async ({ page }) => {
  const f = await fixture(page); f.state[endpoint].status = 500; await start(page);
  await expect(sectionError(page,endpoint)).not.toBeEmpty(); await expect(page.getByTestId("loading")).toHaveText("false");
  if(endpoint === "term") await expect(page.getByTestId("data")).toBeEmpty(); else await expect(page.getByTestId("data")).toContainText("Fixture Mathematics");
  expect(f.state[endpoint].calls).toBe(2);
  f.state[endpoint].status = 200; await retry(page);
  await expect.poll(() => f.state[endpoint].calls).toBe(3); await settledQueries(page);
  await loaded(page); await expect(sectionError(page,endpoint)).toBeEmpty(); expect(f.state[endpoint].calls).toBe(3);
});
test("all snapshot and year requests failing stops both loading states after one bounded read retry", async ({ page }) => {
  const f = await fixture(page); [...snapshotEndpoints, "year" as const].forEach(e => { f.state[e].status = 500; }); await start(page);
  await expect(page.getByTestId("error")).not.toBeEmpty(); await expect(page.getByTestId("year-error")).not.toBeEmpty();
  await expect(page.getByTestId("loading")).toHaveText("false"); await expect(page.getByTestId("year-loading")).toHaveText("false");
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(e === "term" ? 1 : 2)); dashboardEndpoints.forEach(e => { f.state[e].status = 200; });
  await retry(page); await loaded(page);
});
test("stale remount refetches once; selected terms are local and survive explicit refresh", async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page);
  for (const term of ["Term 3", "Term 1", "Term 2", "Term 3"]) await button(page, term);
  await expect(page.getByTestId("ranking-term")).toHaveText("Term 3"); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
  await retry(page); await expect.poll(() => f.state.overview.calls).toBe(2); await loaded(page); await f.settled(2); await settledQueries(page); await expect(page.getByTestId("ranking-term")).toHaveText("Term 3");
  await toggle(page); await page.clock.fastForward(31_000); await toggle(page); await loaded(page);
  await f.settled(3); await settledQueries(page); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(3));
});

test("cached content readiness does not imply a pending refresh has completed", async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page);
  await f.settled(1); await settledQueries(page);
  const checkpoint = f.ledger.mark(); f.hold("overview"); await retry(page);
  await expect.poll(() => f.state.overview.calls).toBe(2); await loaded(page);
  const snapshotFetching = () => page.evaluate(async () => {
    // @ts-expect-error Vite source module, browser only.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().some(q => q.queryKey[6] === "snapshot" && q.state.fetchStatus === "fetching");
  });
  await expect.poll(snapshotFetching).toBe(true);
  // Pending retries remain deduplicated even though the UI is already readable.
  for (let i = 0; i < 3; i++) await retry(page);
  expect(f.state.overview.calls).toBe(2);
  f.release("overview"); await f.settled(2); await settledQueries(page);
  expect(f.ledger.snapshot(checkpoint).filter(r => r.terminal === "aborted")).toEqual([]);
  await toggle(page); await page.clock.fastForward(31_000); await toggle(page);
  await loaded(page); await f.settled(3); await settledQueries(page);
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(3));
});
for (const change of ["year", "term"]) test(`${change} rollover selects a new key without a stale snapshot or duplicate section requests`, async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await button(page, "Term 3"); await toggle(page);
  f.setContext(change === "year" ? 2 : 1, 13, 1); f.setMarker(29); f.hold("overview"); await page.clock.fastForward(31_000); await toggle(page);
  await expect(page.getByTestId("data")).not.toContainText('"totalTeachers":17'); await expect(page.getByTestId("loading")).toHaveText("true");
  f.release("overview"); await expect(page.getByTestId("data")).toContainText('"totalTeachers":29');
  await expect(page.getByTestId("ranking-term")).toHaveText("Term 1");
  expect((await keys(page)).some((k: unknown[]) => k[6] === "snapshot" && k[7] === (change === "year" ? 2 : 1) && k[8] === 13 && k[9] === 1)).toBe(true);
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(2));
});
test("explicit context rollover while mounted preserves the selected term within the same year", async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await button(page, "Term 3");
  f.setContext(1, 13, 1); f.setMarker(29); await retry(page);
  await expect(page.getByTestId("data")).toContainText('"totalTeachers":29'); await expect(page.getByTestId("ranking-term")).toHaveText("Term 3");
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(2));
});
test("five-minute inactive garbage collection removes snapshots; next visit fetches again", async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await toggle(page);
  await page.clock.fastForward(301_000); expect(await keys(page)).toEqual([]);
  await toggle(page); await loaded(page); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(2));
});
test("initial offline stops loading and reconnect resumes once without queued retries", async ({ page }) => {
  const f = await fixture(page); await page.context().setOffline(true); await start(page);
  await expect(page.getByTestId("error")).toContainText("offline"); await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("year-loading")).toHaveText("false");
  for (let i = 0; i < 3; i++) await retry(page); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(0));
  await page.context().setOffline(false); await loaded(page); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
});
for (const stale of [false, true]) test(`${stale ? "stale" : "fresh"} cached offline snapshot remains readable and reconnect is bounded`, async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await toggle(page);
  if (stale) await page.clock.fastForward(31_000);
  await page.context().setOffline(true); await toggle(page); await loaded(page); await expect(page.getByTestId("error")).toContainText("offline");
  for (let i = 0; i < 3; i++) await retry(page);
  await page.context().setOffline(false); await expect(page.getByTestId("error")).toBeEmpty();
  await loaded(page); await f.settled(stale ? 2 : 1); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(stale ? 2 : 1));
});
for (const endpoint of dashboardEndpoints) {
  test(`${endpoint} 401 independently expires its owning session`, async ({ page }) => {
    const f = await fixture(page); f.state[endpoint].status = 401; await start(page);
    await expect(page.getByTestId("auth")).toHaveText("signed-out"); await expect(page.getByTestId("data")).toBeEmpty(); expect(await keys(page)).toEqual([]);
  });
  test(`${endpoint} 403 hides private cached data, preserves auth and recovers without automatic retry`, async ({ page }) => {
    const f = await fixture(page); await start(page); await loaded(page); f.state[endpoint].status = 403; await retry(page);
    await expect(page.getByTestId("error")).not.toBeEmpty(); await expect(page.getByTestId("data")).toBeEmpty();
    await expect(page.getByTestId("auth")).toHaveText("1"); expect(f.state[endpoint].calls).toBe(2);
    f.state[endpoint].status = 200; await retry(page); await loaded(page);
  });
}
for (const [first, late] of [["total", "overview"], ["overview", "holistic"], ["year", "trend"], ["overview", "year"], ["year", "term"]] as [DashboardEndpoint, DashboardEndpoint][]) test(`${first} 500 cannot mask late ${late} 401`, async ({ page }) => {
  const f = await fixture(page); f.state[first].status = 500; f.state[late].status = 401; f.hold(late); await start(page);
  await expect(sectionError(page,first)).not.toBeEmpty();
  f.release(late); await expect(page.getByTestId("auth")).toHaveText("signed-out");
});
test("Retry targets a failed section without unnecessarily refreshing healthy context", async ({ page }) => {
  const f = await fixture(page); f.state.overview.status = 500; await start(page); await expect(sectionError(page,"overview")).not.toBeEmpty();
  const contextCalls=f.state.term.calls;f.state.overview.status = 200; f.hold("term"); await retry(page);
  await expect(sectionError(page,"overview")).toBeEmpty();await loaded(page);expect(f.state.term.calls).toBe(contextCalls);f.release("term");
});
for (const e of ["term", "year"] as const) test(`${e} malformed 403 still hides cached private data without logout`, async ({ page }) => {
  await fixture(page); await start(page); await loaded(page);
  await page.route(`**/api${dashboardPaths[e]}`, r => r.fulfill({ status: 403, contentType: "text/html", body: "Forbidden" }));
  await retry(page); await expect(page.getByTestId("error")).not.toBeEmpty(); await expect(page.getByTestId("data")).toBeEmpty(); await expect(page.getByTestId("auth")).toHaveText("1");
});
test("new calendar day has a separate snapshot key even within the context freshness window", async ({ page }) => {
  // Install before the first hook render so its memoized date uses test time.
  await page.clock.install({ time: new Date(2026, 9, 11, 23, 59, 55) }); const f = await fixture(page); await start(page); await loaded(page);
  await toggle(page); await page.clock.fastForward(10_000); await toggle(page); await loaded(page);
  expect(f.state.term.calls).toBe(1); expect(f.state.year.calls).toBe(1); snapshotEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(2));
  const snapshots = (await keys(page)).filter((k: unknown[]) => k[6] === "snapshot"); expect([...new Set(snapshots.map((k: unknown[]) => k[10]))].sort()).toEqual(["2026-10-11", "2026-10-12"]);
});
test("account switching cancels a pending aggregate and ignores old successful or 401 responses", async ({ page }) => {
  const f = await fixture(page); snapshotEndpoints.forEach(e => f.hold(e)); f.state.holistic.status = 401;
  let aborted = 0; page.on("requestfailed", r => { if (snapshotEndpoints.some(e => r.url().endsWith(dashboardPaths[e])) && /abort/i.test(r.failure()?.errorText ?? "")) aborted++; });
  await start(page); await expect.poll(() => snapshotEndpoints.reduce((n, e) => n + f.state[e].calls, 0)).toBe(9);
  f.state.holistic.status = 200; f.setMarker(29); await button(page, "Switch account");
  await expect.poll(() => aborted).toBe(9); snapshotEndpoints.forEach(e => f.release(e));
  await expect(page.getByTestId("data")).toContainText('"totalTeachers":29'); await expect(page.getByTestId("auth")).toHaveText("2");
  expect((await keys(page)).every((k: unknown[]) => k[3] === "2")).toBe(true);
});
for (const transition of ["switch", "logout-login"]) test(`late rejected snapshot cannot overwrite or expire newer session on ${transition}`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page);
  f.state.overview.status = 500; f.state.holistic.status = 401; f.hold("holistic"); await retry(page);
  await expect(sectionError(page,"overview")).not.toBeEmpty(); f.state.overview.status = 200; f.state.holistic.status = 200; f.setMarker(29);
  if (transition === "switch") await button(page, "Switch account");
  else { await button(page, "Logout"); await button(page, "Log out"); await expect(page.getByTestId("data")).toBeEmpty(); expect(await keys(page)).toEqual([]); await button(page, "Login again"); }
  f.release("holistic"); await expect(page.getByTestId("data")).toContainText('"totalTeachers":29');
  await expect(page.getByTestId("auth")).toHaveText(transition === "switch" ? "2" : "1");
  const populated = await keys(page); expect(populated.length).toBeGreaterThan(0); expect(populated.every((k: unknown[]) => k[2] === "PRINCIPAL" && k[3] === (transition === "switch" ? "2" : "1"))).toBe(true);
});
test("pending context retries deduplicate and unmount cancels both before sections start", async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.hold("term"); f.hold("year"); let aborted = 0;
  page.on("requestfailed", r => { if (/active-term|getAcademicYear/.test(r.url()) && /abort/i.test(r.failure()?.errorText ?? "")) aborted++; });
  await retry(page); for (let i = 0; i < 3; i++) await retry(page);
  expect(f.state.term.calls).toBe(2); expect(f.state.year.calls).toBe(2); expect(f.state.overview.calls).toBe(1);
  await toggle(page); await expect.poll(() => aborted).toBe(2); f.release("term"); f.release("year");
  await page.waitForTimeout(100); expect(f.state.overview.calls).toBe(1);
});
test("unmount cancels all nine aggregate HTTP requests and retries cannot duplicate pending work", async ({ page }) => {
  const f = await fixture(page); snapshotEndpoints.forEach(e => f.hold(e)); let aborted = 0;
  page.on("requestfailed", r => { if (snapshotEndpoints.some(e => r.url().endsWith(dashboardPaths[e])) && /abort/i.test(r.failure()?.errorText ?? "")) aborted++; });
  await start(page); await expect.poll(() => snapshotEndpoints.reduce((n, e) => n + f.state[e].calls, 0)).toBe(9);
  for (let i = 0; i < 3; i++) await retry(page); snapshotEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
  await toggle(page); await expect.poll(() => aborted).toBe(9); snapshotEndpoints.forEach(e => f.release(e));
});
for (const role of ["ADMIN", "TEACHER", "PARENT"]) test(`${role} switch cannot expose or fetch Principal cached data`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await button(page, `Switch ${role}`);
  await expect(page.getByTestId("data")).toBeEmpty(); await expect(page.getByTestId("year")).toBeEmpty(); expect(await keys(page)).toEqual([]);
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
});
