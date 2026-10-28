import { test, expect, type Page } from "@playwright/test";
import { mockAdminDashboard, adminEndpoints } from "./fixtures/adminDashboard";
const click = (page: Page, name: string) => page.getByRole("button", { name, exact: true }).click();
async function fixture(page: Page, holdAuth = false, clock = false, stationary = false) {
  if (stationary) {
    // Freeze on the blank page before the application owns any timers. A fixed
    // start avoids the cross-process Date.now()+1ms pauseAt race entirely.
    await page.clock.install({ time: new Date('2026-10-11T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-12T00:00:00Z'));
  } else if (clock) await page.clock.install();
  const f = await mockAdminDashboard(page, false, holdAuth);
  await page.goto("/tests/admin-dashboard-query.html");
  await expect(page.getByTestId("auth")).toHaveText(holdAuth ? "pending" : "1");
  return f;
}
async function loaded(page: Page) {
  await expect(page.getByTestId("counts-data")).toHaveText('{"totalUsers":120,"totalTeachers":12,"totalParents":100,"totalStudents":240}');
  await expect(page.getByTestId("frequency-data")).toContainText('"averageDaily":3');
  await expect(page.getByTestId("audit-data")).toContainText("Synthetic Actor p1");
  for (const e of ["counts", "frequency", "audit"]) await expect(page.getByTestId(`${e}-loading`)).toHaveText("false");
}
test("authentication initialization and preview block all four readers", async ({ page }) => {
  const f = await fixture(page, true); await click(page, "Toggle preview");
  for (const e of adminEndpoints) expect(f.state[e].calls).toBe(0);
  f.releaseAuth(); await loaded(page); await click(page, "Toggle preview");
  for (const e of ["counts", "frequency", "audit"]) await expect(page.getByTestId(`${e}-data`)).toBeEmpty();
});
test("initial loading, concurrent observers and fresh remount reuse exactly four GETs", async ({ page }) => {
  const f = await fixture(page); f.hold("users"); await click(page, "Toggle preview");
  await expect(page.getByTestId("counts-loading")).toHaveText("true");
  await expect(page.getByTestId("audit-data")).toContainText("Synthetic Actor p1");
  await click(page, "Toggle observer"); f.release("users"); await loaded(page);
  await click(page, "Toggle observer"); await click(page, "Toggle dashboard"); await click(page, "Toggle dashboard"); await loaded(page);
  for (const e of adminEndpoints) expect(f.state[e].calls, e).toBe(1);
});
test("stale remount after thirty seconds revalidates each resource once", async ({ page }) => {
  const f = await fixture(page, false, true); await click(page, "Toggle preview"); await loaded(page);
  await f.settled();
  const marks = Object.fromEntries(adminEndpoints.map(e => [e, f.ledgers[e].mark()]));
  await click(page, "Toggle dashboard"); await page.clock.fastForward(30_001); await click(page, "Toggle dashboard"); await loaded(page);
  for (const e of adminEndpoints) {
    const batch = await f.ledgers[e].successfulBatch(marks[e]);
    const probes = batch.filter(r => r.terminal === "aborted" && r.intercepted);
    expect(probes.length).toBeLessThanOrEqual(1);
    expect(f.state[e].calls, e).toBe(2 + probes.length);
  }
});
test("only login frequency polls every thirty seconds and explicit refresh stays bounded", async ({ page }) => {
  const f = await fixture(page, false, true, true); await click(page, "Toggle preview");
  for (const endpoint of adminEndpoints) await f.ledgers[endpoint].successfulBatch();
  // Query batches completed request notifications on a zero-delay timer.
  // Drain that queue explicitly now that virtual time starts paused.
  await page.clock.runFor(1); await loaded(page);
  // Stationary virtual time gives every post-commit interval re-arm the same
  // deadline. It was established before navigation, without an arbitrary wait.
  // Read the actual interval deadline, rather than assuming loaded() is the
  // timer's start. Wall time spent awaiting DOM/network work otherwise drifts.
  await page.evaluate(() => {
    const runtime = window as Window & { frequencyDeadline?: number };
    const original = window.setInterval.bind(window);
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      if (timeout === 30_000) runtime.frequencyDeadline = Date.now() + timeout;
      return original(handler, timeout, ...args);
    }) as typeof window.setInterval;
  });
  // The explicit refetch resets the same existing interval after settling.
  await click(page, "Retry frequency"); await expect.poll(() => f.state.frequency.calls).toBe(2);
  await f.ledgers.frequency.successfulBatch(0, 2); await page.clock.runFor(1);
  await expect(page.getByTestId("frequency-loading")).toHaveText("false");
  const deadline = await page.evaluate(() => (window as Window & { frequencyDeadline: number }).frequencyDeadline);
  await page.clock.pauseAt(new Date(deadline - 1)); expect(f.state.frequency.calls).toBe(2);
  // Date deadlines are integer milliseconds; cross the boundary rather than
  // stopping at its rounded timestamp. This advances virtual time, not wall time.
  await page.clock.runFor(2); await expect.poll(() => f.state.frequency.calls).toBe(3);
  await f.ledgers.frequency.successfulBatch(0, 3);
  await page.clock.runFor(1);
  await expect(page.getByTestId("frequency-loading")).toHaveText("false");
  for (const e of ["users", "students", "audit"] as const) expect(f.state[e].calls).toBe(1);
  f.hold("frequency"); await click(page, "Retry frequency"); await expect.poll(() => f.state.frequency.calls).toBe(4);
  await click(page, "Retry frequency"); await click(page, "Retry frequency"); expect(f.state.frequency.calls).toBe(4);
  const finished = page.waitForResponse(r => new URL(r.url()).pathname === "/api/analytics/login-frequency" && r.status() === 200);
  f.release("frequency"); await finished; await f.ledgers.frequency.successfulBatch(0, 4); await page.clock.runFor(1); await expect(page.getByTestId("frequency-loading")).toHaveText("false");
});
for (const endpoint of adminEndpoints) test(`${endpoint} failure stays independent and explicit retry recovers`, async ({ page }) => {
  const f = await fixture(page); f.state[endpoint].status = 500; await click(page, "Toggle preview");
  const resource = endpoint === "users" || endpoint === "students" ? "counts" : endpoint;
  await expect(page.getByTestId(`${resource}-error`)).toHaveText(`Synthetic ${endpoint} 500`);
  await expect(page.getByTestId(`${resource}-loading`)).toHaveText("false"); expect(f.state[endpoint].calls).toBe(endpoint === "audit" ? 1 : 2);
  f.state[endpoint].status = 200; await click(page, `Retry ${resource}`); await loaded(page);
  expect(f.state[endpoint].calls).toBe(endpoint === "audit" ? 2 : 3);
});
for (const endpoint of adminEndpoints) test(`${endpoint} 401 expires session independently`, async ({ page }) => {
  const f = await fixture(page); f.state[endpoint].status = 401;
  if (endpoint === "users") f.state.students.status = 500;
  if (endpoint === "students") f.state.users.status = 500;
  await click(page, "Toggle preview"); await expect(page.getByTestId("auth")).toHaveText("signed-out");
  for (const e of ["counts", "frequency", "audit"]) await expect(page.getByTestId(`${e}-data`)).toBeEmpty();
});
for (const endpoint of adminEndpoints) test(`${endpoint} 403 hides cached private data without logout`, async ({ page }) => {
  const f = await fixture(page); await click(page, "Toggle preview"); await loaded(page);
  f.state[endpoint].status = 403; const resource = endpoint === "users" || endpoint === "students" ? "counts" : endpoint;
  await click(page, `Retry ${resource}`); await expect(page.getByTestId(`${resource}-error`)).toHaveText(`Synthetic ${endpoint} 403`);
  await expect(page.getByTestId(`${resource}-data`)).toBeEmpty(); await expect(page.getByTestId("auth")).toHaveText("1");
  f.state[endpoint].status = 200; await click(page, `Retry ${resource}`); await loaded(page);
});
test("audit pagination and every server filter have separate keys and exact parameters", async ({ page }) => {
  const f = await fixture(page); await click(page, "Toggle preview"); await loaded(page);
  await click(page, "Page 2"); await expect(page.getByTestId("audit-data")).toContainText("Synthetic Actor p2");
  await click(page, "Apply filters"); await expect(page.getByTestId("audit-data")).toContainText("Filtered p1");
  expect(f.records.filter(r => r.endpoint === "audit").map(r => r.params)).toEqual([
    { page: "1", search: "", role: "", action: "", from: "", to: "", limit: "20" },
    { page: "2", search: "", role: "", action: "", from: "", to: "", limit: "20" },
    { page: "1", search: "Filtered", role: "TEACHER", action: "LOGIN", from: "2026-10-01", to: "2026-10-11", limit: "20" },
  ]);
  for (const e of ["users", "students", "frequency"] as const) expect(f.state[e].calls).toBe(1);
});
for (const resource of ["frequency", "audit"] as const) test(`rapid ${resource} switching cancels obsolete request and rejects late response`, async ({ page }) => {
  const f = await fixture(page); await click(page, "Toggle preview"); await loaded(page); f.hold(resource);
  await click(page, resource === "frequency" ? "monthly" : "Page 2");
  await expect.poll(() => f.state[resource].calls).toBe(2);
  await click(page, resource === "frequency" ? "yearly" : "Apply filters");
  await expect.poll(() => f.state[resource].calls).toBe(3);
  await expect.poll(() => f.ledgers[resource].snapshot().filter(r => r.terminal === "aborted").length).toBe(1);
  f.release(resource);
  await expect(page.getByTestId(`${resource}-data`)).toContainText(resource === "frequency" ? '"period":"yearly"' : "Filtered p1");
  expect(f.state[resource].calls).toBe(3);
});
for (const cached of [false, true]) test(`offline ${cached ? "cached" : "initial"} state ends loading and resumes once`, async ({ page, context }) => {
  const f = await fixture(page); if (cached) { await click(page, "Toggle preview"); await loaded(page); }
  await context.setOffline(true);
  if (!cached) await click(page, "Toggle preview");
  for (const e of ["counts", "frequency", "audit"]) {
    await expect(page.getByTestId(`${e}-loading`)).toHaveText("false");
    await expect(page.getByTestId(`${e}-error`)).toContainText("offline");
    await click(page, `Retry ${e}`);
    if (!cached) await expect(page.getByTestId(`${e}-data`)).toBeEmpty();
  }
  if (cached) await expect(page.getByTestId("counts-data")).toContainText('"totalUsers":120');
  await context.setOffline(false); await loaded(page);
  for (const e of adminEndpoints) expect(f.state[e].calls, e).toBe(1);
});
for (const role of ["PRINCIPAL", "TEACHER", "PARENT"]) test(`switching to ${role} clears cache and blocks Admin readers`, async ({ page }) => {
  const f = await fixture(page); await click(page, "Toggle preview"); await loaded(page); await click(page, `Switch ${role}`);
  for (const e of ["counts", "frequency", "audit"]) await expect(page.getByTestId(`${e}-data`)).toBeEmpty();
  const cache = await page.evaluate(async () => {
    // @ts-expect-error Browser Vite source harness only.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().filter(q => q.state.data !== undefined).length;
  });
  expect(cache).toBe(0); for (const e of adminEndpoints) expect(f.state[e].calls).toBe(1);
});
for (const status of [200, 401]) test(`account switch cancels pending ${status} without overwriting or expiring new account`, async ({ page }) => {
  const f = await fixture(page); await click(page, "Toggle preview"); await loaded(page);
  f.state.audit.status = status; f.hold("audit"); await click(page, "Retry audit"); await expect.poll(() => f.state.audit.calls).toBe(2);
  const oldRequest = f.ledgers.audit.snapshot().at(-1)!.id;
  f.state.audit.status = 200; await click(page, "Switch account"); await expect(page.getByTestId("auth")).toHaveText("2");
  await expect.poll(() => f.ledgers.audit.snapshot().find(r => r.id === oldRequest)?.terminal).toBe("aborted");
  f.release("audit"); await loaded(page); await expect(page.getByTestId("auth")).toHaveText("2");
});
test("logout clears populated data; same-account login fetches again", async ({ page }) => {
  const f = await fixture(page); await click(page, "Toggle preview"); await loaded(page);
  await click(page, "Logout"); await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByTestId("auth")).toHaveText("signed-out");
  for (const e of ["counts", "frequency", "audit"]) await expect(page.getByTestId(`${e}-data`)).toBeEmpty();
  const marks = Object.fromEntries(adminEndpoints.map(e => [e, f.ledgers[e].mark()]));
  await click(page, "Login again"); await loaded(page);
  for (const e of adminEndpoints) {
    const batch = await f.ledgers[e].successfulBatch(marks[e]);
    const probes = batch.filter(r => r.terminal === "aborted" && r.intercepted);
    expect(probes.length).toBeLessThanOrEqual(1); expect(f.state[e].calls).toBe(2 + probes.length);
  }
});
test("empty and null responses retain existing zero/empty mappings", async ({ page }) => {
  const f = await fixture(page); f.state.users.body = null; f.state.students.body = { total: null };
  f.state.frequency.body = null; f.state.audit.body = { success: true, data: null };
  await click(page, "Toggle preview");
  await expect(page.getByTestId("counts-data")).toHaveText('{"totalStudents":null}');
  await expect(page.getByTestId("frequency-data")).toHaveText("null"); await expect(page.getByTestId("audit-data")).toHaveText("null");
  for (const e of ["counts", "frequency", "audit"]) await expect(page.getByTestId(`${e}-error`)).toBeEmpty();
});
for (const endpoint of ["users", "students"] as const) test(`${endpoint} late 401 is not masked by the other count endpoint's earlier 500`, async ({ page }) => {
  const f = await fixture(page), other = endpoint === "users" ? "students" : "users";
  f.state[endpoint].status = 401; f.hold(endpoint); f.state[other].status = 500;
  await click(page, "Toggle preview"); await expect(page.getByTestId("counts-error")).toHaveText(`Synthetic ${other} 500`);
  await expect(page.getByTestId("auth")).toHaveText("1"); f.release(endpoint);
  await expect(page.getByTestId("auth")).toHaveText("signed-out");
});
test("inactive resources are collected after five minutes", async ({ page }) => {
  const f = await fixture(page, false, true); await click(page, "Toggle preview"); await loaded(page); await f.settled();
  await click(page, "Toggle dashboard");
  await expect(page.getByTestId("counts-data")).toHaveCount(0);
  await expect.poll(() => page.evaluate(async () => {
    // @ts-expect-error Browser Vite source harness only.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    const queries = queryClient.getQueryCache().getAll();
    return { populated: queries.filter(q => q.state.data !== undefined).length,
      observed: queries.filter(q => q.getObserversCount() !== 0).length };
  })).toEqual({ populated: 4, observed: 0 });
  await page.clock.fastForward(5 * 60_000 + 1);
  const remaining = await page.evaluate(async () => {
    // @ts-expect-error Browser Vite source harness only.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().length;
  });
  expect(remaining).toBe(0);
});
test('F01: audit GET with table initialization is excluded from automatic retries and pure-read metadata',async({page})=>{
 const f=await fixture(page);f.state.audit.status=503;await click(page,'Toggle preview');await expect(page.getByTestId('audit-error')).toContainText('503');expect(f.state.audit.calls).toBe(1);
 const policy=await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');const query=queryClient.getQueryCache().getAll().find(q=>q.queryKey[6]==='audit');return {retry:query?.options.retry,pureRead:query?.meta?.pureRead??false};});expect(policy).toEqual({retry:false,pureRead:false});
 for(const endpoint of ['users','students','frequency'] as const)expect(f.state[endpoint].calls).toBe(1);f.state.audit.status=200;await click(page,'Retry audit');await loaded(page);expect(f.state.audit.calls).toBe(2);
});
