import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { waitForDataRoute } from "./fixtures/routeReady";

type Endpoint = "teachers" | "year";
async function fixture(page: Page) {
  const state = {
    teachers: { status: 200, calls: 0, name: "Current teacher" },
    year: { status: 200, calls: 0, name: "2026–2027" },
  };
  const gates: Partial<Record<Endpoint, Promise<void>>> = {};
  const releases: Partial<Record<Endpoint, () => void>> = {};
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const endpoint = path === "/api/teachers" ? "teachers" : path.includes("academic-year") ? "year" : null;
    if (endpoint) {
      const { status, name } = state[endpoint]; // Capture the old session's response.
      state[endpoint].calls++;
      await gates[endpoint];
      return route.fulfill({ status, json: status === 200
        ? endpoint === "teachers" ? [{ teacherId: "1", fullName: name, advisories: [] }] : { data: { label: name } }
        : { message: `Endpoint failed (${status})` } });
    }
    if (path === "/api/auth/me") return route.fulfill({ json: { user: { id: "1", role: "PRINCIPAL", user_name: "principal" } } });
    if (path.includes("user-profile")) return route.fulfill({ json: { id: "1", role: "PRINCIPAL", userName: "principal" } });
    return route.fulfill({ json: { success: true } });
  });
  await page.goto("/tests/query-pilot.html");
  await expect(page.getByTestId("auth")).toHaveText("1");
  return {
    state,
    hold: (endpoint: Endpoint) => { gates[endpoint] = new Promise<void>(resolve => { releases[endpoint] = resolve; }); },
    release: (endpoint: Endpoint) => { releases[endpoint]?.(); delete gates[endpoint]; },
  };
}
const start = (page: Page) => page.getByRole("button", { name: "Toggle preview" }).click();

test("offline initial request stops loading and resumes once without queued retries", async ({ page }) => {
  const { state } = await fixture(page);
  await page.context().setOffline(true);
  await start(page);
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("error")).toContainText("You're offline");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry query" }).click();
  expect(state.teachers.calls).toBe(0);
  await page.context().setOffline(false);
  await expect(page.getByTestId("teachers")).toHaveText("Current teacher");
  await expect(page.getByTestId("error")).toBeEmpty();
  expect(state.teachers.calls).toBe(1);
  expect(state.year.calls).toBe(1);
  await page.evaluate(() => { window.dispatchEvent(new Event("online")); window.dispatchEvent(new Event("online")); });
  expect(state.teachers.calls).toBe(1);
});

test("offline cached directory keeps real rows and uses the existing error/retry UI", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false);
  let calls = 0;
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/teachers") calls++; });
  await page.goto("/principal/teachers");
  release();
  await waitForDataRoute(page);
  await expect(page.getByText("Ana", { exact: true }).first()).toBeVisible();
  const before = calls;
  await page.context().setOffline(true);
  await expect(page.getByRole("alert")).toContainText("You're offline");
  await expect(page.getByText("Ana", { exact: true }).first()).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  expect(calls).toBe(before);
  await page.context().setOffline(false);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("Ana", { exact: true }).first()).toBeVisible();
  expect(calls).toBe(before);
});

test("a stale cached query paused offline retains data and refreshes once on reconnect", async ({ page }) => {
  const { state } = await fixture(page);
  await page.clock.install();
  await start(page);
  await expect(page.getByTestId("teachers")).toHaveText("Current teacher");
  await page.getByRole("button", { name: "Toggle directory" }).click();
  await page.clock.fastForward(301_000);
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Toggle directory" }).click();
  await expect(page.getByTestId("teachers")).toHaveText("Current teacher");
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("error")).toContainText("You're offline");
  state.teachers.name = "Refreshed teacher";
  await page.context().setOffline(false);
  await expect(page.getByTestId("teachers")).toHaveText("Refreshed teacher");
  expect(state.teachers.calls).toBe(2);
});

for (const late of ["teachers", "year"] as const) {
  test(`late ${late} 401 expires auth even after the other endpoint's 500`, async ({ page }) => {
    const data = await fixture(page);
    const early = late === "teachers" ? "year" : "teachers";
    data.state[early].status = 500;
    data.state[late].status = 401;
    data.hold(late);
    await start(page);
    await expect(page.getByTestId("error")).not.toBeEmpty();
    await expect(page.getByTestId("auth")).toHaveText("1");
    data.release(late);
    await expect(page.getByTestId("auth")).toHaveText("signed-out");
    await expect(page.getByTestId("teachers")).toBeEmpty();
  });
  test(`${late} 403 remains a permission error without expiring auth`, async ({ page }) => {
    const { state } = await fixture(page);
    state[late].status = 403;
    await start(page);
    await expect(page.getByTestId("error")).not.toBeEmpty();
    await expect(page.getByTestId("auth")).toHaveText("1");
    expect(state[late].calls).toBe(1);
  });
}

test("both endpoint failures show an error and recover through one explicit retry", async ({ page }) => {
  const { state } = await fixture(page);
  state.teachers.status = state.year.status = 500;
  await start(page);
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("error")).not.toBeEmpty();
  await expect(page.getByTestId("auth")).toHaveText("1");
  expect(state.teachers.calls).toBe(1);
  expect(state.year.calls).toBe(1);
  state.teachers.status = state.year.status = 200;
  await page.getByRole("button", { name: "Retry query" }).click();
  await expect(page.getByTestId("teachers")).toHaveText("Current teacher");
  expect(state.teachers.calls).toBe(2);
  expect(state.year.calls).toBe(2);
});

for (const transition of ["switch", "logout-login"] as const) {
  test(`old 401 after an early 500 cannot expire a new session during ${transition}`, async ({ page }) => {
    const data = await fixture(page);
    data.state.teachers.status = 500;
    data.state.year.status = 401;
    data.hold("year");
    await start(page);
    await expect(page.getByTestId("error")).not.toBeEmpty();
    data.state.teachers.status = data.state.year.status = 200;
    if (transition === "switch") await page.getByRole("button", { name: "Switch account" }).click();
    else {
      await page.getByRole("button", { name: "Logout", exact: true }).click();
      await page.getByRole("button", { name: "Log out", exact: true }).click();
      await expect(page.getByTestId("auth")).toHaveText("signed-out");
      await page.getByRole("button", { name: "Login again" }).click();
    }
    await expect.poll(() => data.state.year.calls).toBe(2);
    data.release("year");
    await expect(page.getByTestId("teachers")).toHaveText("Current teacher");
    await expect(page.getByTestId("auth")).toHaveText(transition === "switch" ? "2" : "1");
  });
}
