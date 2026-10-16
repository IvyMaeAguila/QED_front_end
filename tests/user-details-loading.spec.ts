import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner } from "./design-pixels";
import fs from "node:fs";

async function userFixture(page: Page, dark = false, accountRole = "PARENT", long = false, missing = false) {
  const context = await mockDirectory(page, "ADMIN", dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let failed = false, requests = 0;
  await page.route("**/api/user/usersList", async route => {
    requests++; await gate;
    if (failed) { await route.fulfill({ status: 500, json: { message: "Accounts unavailable" } }); return; }
    await route.fulfill({ json: { success: true, data: missing ? [] : [{ id: "1", role: accountRole, firstName: long ? "Maria Alexandra Isabella ".repeat(8) : "Ana", lastName: "Cruz", middleName: "", email: long ? "long.email.address.for.school.accounts@example.test" : "ana@example.test", contactNumber: "09123456789", status: "Active", lastLogin: null }] } });
  });
  await page.route("**/api/section/getTeachers", async route => {
    await gate; await route.fulfill({ json: { status: "success", data: [{ id: 7, user_id: 1, first_name: "Ana", last_name: "Cruz", middle_name: null, email_address: "ana@example.test", contact_number: "09123456789", gender: "Female" }] } });
  });
  return Object.assign(() => { context(); release(); }, { fail: () => { failed = true; }, recover: () => { failed = false; }, requests: () => requests });
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`user details ${width} ${dark ? "dark" : "light"}: real field labels and actions`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await userFixture(page, dark);
  await page.goto("/admin/users/parent/1");await waitForDataRoute(page);
  await expect(page.getByText("Full Name", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit User", exact: true })).toBeVisible();
  await expect(page.getByText("Parent account details", { exact: true })).toBeVisible();
  await expect(page.getByText(/No user found/)).toHaveCount(0);
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/admin-user-details-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Cruz, Ana", exact: true })).toBeVisible();
  await expect(page.locator("[data-sk-primitive], [data-sk-layer], [role=status]")).toHaveCount(0);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});
for (const accountRole of ["ADMIN", "PRINCIPAL", "PARENT"]) test(`${accountRole} details preserve short and wrapping fields`, async ({ page }) => {
  for (const long of [false, true]) {
    const release = await userFixture(page, false, accountRole, long);
    await page.goto(`/admin/users/${accountRole.toLowerCase()}/1`);await waitForDataRoute(page);
    await expect(page.getByText("Full Name", { exact: true })).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    await expect(page.getByRole("heading", { name: long ? /Cruz, Maria Alexandra/ : "Cruz, Ana" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove User", exact: true })).toBeEnabled();
    await page.unroute("**/api/**"); await page.unroute("**/api/user/usersList"); await page.unroute("**/api/section/getTeachers");
  }
});

test("user details error removes shapes and retries the account request", async ({ page }) => {
  const release = await userFixture(page); release.fail();
  await page.goto("/admin/users/parent/1");await waitForDataRoute(page);
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  release(); await expect(page.getByRole("alert")).toBeVisible();
  expect(await page.locator("[data-sk-primitive]").count()).toBe(0);
  const before = release.requests(); release.recover();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cruz, Ana", exact: true })).toBeVisible();
  expect(release.requests()).toBe(before + 1);
});

test("missing user uses the real not-found state only after the request", async ({ page }) => {
  const release = await userFixture(page, false, "PARENT", false, true);
  await page.goto("/admin/users/parent/1");await waitForDataRoute(page);
  await expect(page.getByText("Full Name", { exact: true })).toBeVisible();
  release(); await expect(page.getByText(/No user found with ID/)).toBeVisible();
  await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
});

test("teacher user details wait for the teacher ID mapping and preserve real profile controls", async ({ page }) => {
  const release = await userFixture(page, false, "TEACHER");
  const profileRequests: string[] = [];
  page.on("request", request => { const path = new URL(request.url()).pathname; if (path.startsWith("/api/teachers/")) profileRequests.push(path); });
  await page.goto("/admin/users/teacher/1");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Teacher Profile", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit User", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Class schedule", exact: true })).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  expect(profileRequests).toEqual([]);
  await assertNoDataSpinner(page);
  release(); await expect(page.getByRole("heading", { name: "Ana", exact: true })).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  expect(profileRequests).toContain("/api/teachers/7");
  expect(profileRequests).not.toContain("/api/teachers/1");
});
