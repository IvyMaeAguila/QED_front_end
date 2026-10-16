import { test, expect, type Page } from "@playwright/test";

// SIMULATED: real auth/client/hook, synthetic read-only endpoint responses.
type Endpoint = "year" | "profile1" | "profile2" | "class1" | "class2";
async function fixture(page: Page, holdAuth = false) {
  const state = Object.fromEntries((["year", "profile1", "profile2", "class1", "class2"] as Endpoint[]).map(e => [e, {
    calls: 0, status: 200, name: e, empty: false,
  }])) as Record<Endpoint, { calls: number; status: number; name: string; empty: boolean }>;
  let yearId = 1, releaseAuth = () => {};
  const authGate = holdAuth ? new Promise<void>(r => { releaseAuth = r; }) : Promise.resolve();
  const gates: Partial<Record<Endpoint, Promise<void>>> = {}, releases: Partial<Record<Endpoint, () => void>> = {};
  await page.route("**/api/**", async route => {
    const p = new URL(route.request().url()).pathname;
    const endpoint: Endpoint | null = p.includes("getAcademicYear") ? "year" : p === "/api/teachers/1" ? "profile1"
      : p === "/api/teachers/2" ? "profile2" : p.endsWith("/class-list/1") ? "class1" : p.endsWith("/class-list/2") ? "class2" : null;
    if (endpoint) {
      const { status, name, empty } = state[endpoint], id = yearId;
      state[endpoint].calls++;
      await gates[endpoint];
      return route.fulfill({ status, json: status !== 200 ? {} : endpoint === "year" ? { data: { id, label: name } }
        : endpoint.startsWith("profile") ? { teacherId: endpoint.slice(-1), fullName: name, gender: "Female", room: "101", advisorySection: "Maroon", gradeLevel: "Grade 1",
          advisories: empty ? [] : [1, 2, 1].map(classId => ({ classId, gradeLevel: "Grade 1", section: "Maroon", room: "101" })), schedule: [] }
        : { classId: Number(endpoint.slice(-1)), grade: "Grade 1", sectionInfo: { section: "Maroon", adviser: "Fixture", room: "101" },
          roster: empty ? [] : [{ studentId: endpoint, firstName: name, lastName: "Fixture", gender: "Female" }] } });
    }
    if (p === "/api/auth/me") { await authGate; return route.fulfill({ json: { user: { id: "1", role: "PRINCIPAL", user_name: "principal" } } }); }
    if (p.includes("user-profile")) return route.fulfill({ json: { id: "1", role: "PRINCIPAL", userName: "principal" } });
    return route.fulfill({ json: { success: true } });
  });
  await page.goto("/tests/profile-query.html");
  await expect(page.getByTestId("auth")).toHaveText(holdAuth ? "pending" : "1");
  return { state, releaseAuth, setYear: (id: number) => { yearId = id; },
    hold: (e: Endpoint) => { gates[e] = new Promise<void>(r => { releases[e] = r; }); },
    release: (e: Endpoint) => { releases[e]?.(); delete gates[e]; },
  };
}
const start = (p: Page) => p.getByRole("button", { name: "Toggle preview", exact: true }).click();
const toggle = (p: Page) => p.getByRole("button", { name: "Toggle profile", exact: true }).click();
const retry = (p: Page) => p.getByRole("button", { name: "Retry query", exact: true }).click();
const loaded = async (p: Page) => { await expect(p.getByTestId("profile")).toHaveText("profile1"); await expect(p.getByTestId("students")).toHaveText("class1,class2"); };

test("profile readiness, preview and missing target issue no private requests", async ({ page }) => {
  const f = await fixture(page, true); await start(page);
  expect(f.state.year.calls).toBe(0); f.releaseAuth(); await loaded(page);
  await page.getByRole("button", { name: "Missing target" }).click();
  await expect(page.getByTestId("not-found")).toHaveText("true"); await expect(page.getByTestId("profile")).toBeEmpty();
  expect(f.state.profile1.calls).toBe(1);
});
test("loading, deduplicated advisories/observers and fresh navigation reuse cached data", async ({ page }) => {
  const f = await fixture(page); f.hold("profile1"); await start(page);
  await expect(page.getByTestId("loading")).toHaveText("true"); f.release("profile1"); await loaded(page);
  await page.getByRole("button", { name: "Toggle second observer" }).click();
  await expect(page.getByTestId("secondary")).toHaveText("profile1");
  await toggle(page); await toggle(page); await loaded(page);
  for (const e of ["year", "profile1", "class1", "class2"] as Endpoint[]) expect(f.state[e].calls).toBe(1);
});
test("empty advisories/schedule cause no class-list requests", async ({ page }) => {
  const f = await fixture(page); f.state.profile1.empty = true; await start(page);
  await expect(page.getByTestId("profile")).toHaveText("profile1");
  await expect(page.getByTestId("rosters-loading")).toHaveText("false"); expect(f.state.class1.calls).toBe(0);
});
test("profile 404 is cached null, including offline, and explicit retry can recover", async ({ page }) => {
  const f = await fixture(page); f.state.profile1.status = 404; await start(page);
  await expect(page.getByTestId("not-found")).toHaveText("true"); await toggle(page); await toggle(page);
  expect(f.state.profile1.calls).toBe(1); await page.context().setOffline(true);
  await expect(page.getByTestId("error")).toContainText("offline"); await expect(page.getByTestId("not-found")).toHaveText("true");
  await page.context().setOffline(false); f.state.profile1.status = 200; await retry(page); await loaded(page);
});
test("partial class failures and cached class null preserve available sections; retry recovers", async ({ page }) => {
  const f = await fixture(page); f.state.class2.status = 404; await start(page);
  await expect(page.getByTestId("students")).toHaveText("class1"); await expect(page.getByTestId("rosters-error")).toHaveText("true");
  await toggle(page); await toggle(page); expect(f.state.class2.calls).toBe(1);
  f.state.class2.status = 200; await page.getByRole("button", { name: "Retry rosters" }).click(); await loaded(page);
});
for (const endpoint of ["year", "profile1"] as Endpoint[]) test(`${endpoint} 500 stops loading and recovers through explicit retry`, async ({ page }) => {
  const f = await fixture(page); f.state[endpoint].status = 500; await start(page);
  await expect(page.getByTestId("error")).not.toBeEmpty(); await expect(page.getByTestId("loading")).toHaveText("false");
  expect(f.state[endpoint].calls).toBe(1); f.state[endpoint].status = 200; await retry(page); await loaded(page);
});
test("initial offline stops loading and reconnect resumes once without queued retries", async ({ page }) => {
  const f = await fixture(page); await page.context().setOffline(true); await start(page);
  await expect(page.getByTestId("error")).toContainText("offline"); await expect(page.getByTestId("loading")).toHaveText("false");
  for (let i = 0; i < 3; i++) await retry(page); expect(f.state.year.calls).toBe(0);
  await page.context().setOffline(false); await loaded(page); expect(f.state.year.calls).toBe(1); expect(f.state.profile1.calls).toBe(1);
});
test("stale offline cached profile/sections stay visible and resume bounded refresh", async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page);
  await toggle(page); await page.clock.fastForward(31_000); await page.context().setOffline(true); await toggle(page);
  await expect(page.getByTestId("error")).toContainText("offline"); await loaded(page);
  for (let i = 0; i < 3; i++) await retry(page);
  await page.context().setOffline(false); await expect(page.getByTestId("error")).toBeEmpty();
  await expect.poll(() => f.state.profile1.calls).toBe(2); expect(f.state.class1.calls).toBe(2); expect(f.state.year.calls).toBe(2);
});
test("stale navigation resolves changed year to new profile/roster keys without old-year placeholders", async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await toggle(page);
  f.setYear(2); f.state.year.name = "New year"; f.state.profile1.name = "New year teacher"; f.hold("profile1"); await page.clock.fastForward(31_000); await toggle(page);
  await expect(page.getByTestId("year")).toHaveText("New year"); await expect(page.getByTestId("profile")).toBeEmpty();
  f.state.profile1.name = "New year teacher"; f.release("profile1");
  await expect(page.getByTestId("profile")).toHaveText("New year teacher");
});
test("rapid teacher switch aborts old request and excludes late results", async ({ page }) => {
  const f = await fixture(page); let aborted = 0;
  page.on("requestfailed", r => { if (r.url().endsWith("/api/teachers/1") && /abort/i.test(r.failure()?.errorText ?? "")) aborted++; });
  f.hold("profile1"); await start(page); await expect.poll(() => f.state.profile1.calls).toBe(1);
  await page.getByRole("button", { name: "Teacher 2" }).click(); await expect(page.getByTestId("profile")).toHaveText("profile2");
  f.release("profile1"); await expect.poll(() => aborted).toBe(1); await expect(page.getByTestId("profile")).toHaveText("profile2");
});
for (const endpoint of ["year", "profile1", "class1"] as Endpoint[]) {
  test(`${endpoint} 401 expires the owning profile session`, async ({ page }) => {
    const f = await fixture(page); f.state[endpoint].status = 401; await start(page);
    await expect(page.getByTestId("auth")).toHaveText("signed-out"); await expect(page.getByTestId("profile")).toBeEmpty(); await expect(page.getByTestId("students")).toBeEmpty();
  });
  test(`${endpoint} 403 hides affected cached private data and preserves auth without auto retry`, async ({ page }) => {
    const f = await fixture(page); await start(page); await loaded(page); f.state[endpoint].status = 403; await retry(page);
    if (endpoint === "class1") { await expect(page.getByTestId("rosters-error")).toHaveText("true"); await expect(page.getByTestId("students")).toBeEmpty(); }
    else { await expect(page.getByTestId("error")).not.toBeEmpty(); await expect(page.getByTestId("profile")).toBeEmpty(); }
    await expect(page.getByTestId("auth")).toHaveText("1"); expect(f.state[endpoint].calls).toBe(2);
    f.state[endpoint].status = 200; await retry(page); await loaded(page);
  });
}
for (const transition of ["switch", "logout-login"]) test(`late profile 401 after year 500 cannot expire newer session on ${transition}`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page);
  f.state.profile1.status = 401; f.state.year.status = 500; f.hold("profile1"); await retry(page);
  await expect(page.getByTestId("error")).not.toBeEmpty();
  f.state.profile1.status = 200; f.state.year.status = 200;
  if (transition === "switch") await page.getByRole("button", { name: "Switch account" }).click();
  else { await page.getByRole("button", { name: "Logout", exact: true }).click(); await page.getByRole("button", { name: "Log out", exact: true }).click(); await page.getByRole("button", { name: "Login again" }).click(); }
  f.release("profile1"); await loaded(page); await expect(page.getByTestId("auth")).toHaveText(transition === "switch" ? "2" : "1");
});
test("pending retry deduplicates; unmount cancels year, profile and both class requests", async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); const endpoints: Endpoint[] = ["year", "profile1", "class1", "class2"];
  let aborted = 0; page.on("requestfailed", r => { if (/getAcademicYear|teachers\/1$|class-list\/[12]$/.test(r.url()) && /abort/i.test(r.failure()?.errorText ?? "")) aborted++; });
  endpoints.forEach(e => f.hold(e)); await retry(page); for (let i = 0; i < 3; i++) await retry(page);
  for (const e of endpoints) expect(f.state[e].calls).toBe(2);
  await toggle(page); await expect.poll(() => aborted).toBe(4); endpoints.forEach(e => f.release(e));
});
test("logout clears populated query cache; same-account login and account switch fetch fresh", async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page);
  await page.getByRole("button", { name: "Logout", exact: true }).click(); await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByTestId("students")).toBeEmpty();
  f.state.profile1.name = "New login"; await page.getByRole("button", { name: "Login again" }).click(); await expect(page.getByTestId("profile")).toHaveText("New login");
  f.state.profile1.name = "New account"; await page.getByRole("button", { name: "Switch account" }).click(); await expect(page.getByTestId("profile")).toHaveText("New account");
  expect(f.state.profile1.calls).toBe(3);
  const keys = await page.evaluate(async () => {
    // @ts-expect-error Vite source module, browser only.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().filter((q: { state: { data: unknown } }) => q.state.data !== undefined).map((q: { queryKey: unknown[] }) => q.queryKey);
  });
  expect(keys.length).toBeGreaterThan(0); expect(keys.every((k: unknown[]) => k[2] === "PRINCIPAL" && k[3] === "2")).toBe(true);
});
for (const role of ["ADMIN", "TEACHER", "PARENT"]) test(`${role} cannot read or fetch Principal profile queries`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await page.getByRole("button", { name: `Switch ${role}` }).click();
  await expect(page.getByTestId("profile")).toBeEmpty(); await expect(page.getByTestId("students")).toBeEmpty(); await retry(page);
  expect(f.state.profile1.calls).toBe(1);
});

for (const expired of ["year", "profile1"] as Endpoint[]) test(`independent ${expired} 401 expires auth after the sibling 500 settles`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page);
  const sibling = expired === "year" ? "profile1" : "year";
  f.state[sibling].status = 500; f.state[expired].status = 401; f.hold(expired); await retry(page);
  await expect(page.getByTestId("error")).not.toBeEmpty(); f.release(expired);
  await expect(page.getByTestId("auth")).toHaveText("signed-out");
});
test("Principal bypasses legacy Admin profile/year caches without deleting or populating them", async ({ page }) => {
  const f = await fixture(page);
  await page.evaluate(async () => {
    // @ts-expect-error Vite source module, browser only.
    const service = await import("/src/features/profiles/principal/pages/teachers/services/teachers.service.ts");
    await service.getTeacherProfile("1"); await service.getSchoolYear();
  });
  f.state.profile1.name = "Fresh Principal"; f.state.year.name = "Fresh year";
  await start(page); await expect(page.getByTestId("profile")).toHaveText("Fresh Principal"); await expect(page.getByTestId("year")).toHaveText("Fresh year");
  const legacy = await page.evaluate(async () => {
    // @ts-expect-error Vite source module, browser only.
    const service = await import("/src/features/profiles/principal/pages/teachers/services/teachers.service.ts");
    return [(await service.getTeacherProfile("1")).fullName, await service.getSchoolYear()];
  });
  expect(legacy).toEqual(["profile1", "year"]); expect(f.state.profile1.calls).toBe(2); expect(f.state.year.calls).toBe(2);
});
