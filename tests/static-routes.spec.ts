import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner } from "./design-pixels";
import fs from "node:fs";

for (const width of [375, 1280]) for (const dark of [false, true]) test(`topic support ${width} ${dark ? "dark" : "light"}: known quest choices render immediately`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await mockDirectory(page, "PARENT", dark);
  await page.goto("/parent/students/1/topics/1/support");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "How do we help today?", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Study Quest Learn/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Feed Your Pet Quiz/ })).toBeVisible();
  const region = page.locator('[data-sk-region="topic-support-content"]');
  const before = await region.boundingBox();
  await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
  await assertNoDataSpinner(page);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/topic-support-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release();
  expect(await region.boundingBox()).toEqual(before);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});

for (const role of ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT"] as const) for (const width of [375, 1280]) for (const dark of [false, true]) test(`${role} help ${width} ${dark ? "dark" : "light"}: known page remains real`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await mockDirectory(page, role, dark);
  await page.goto(`/${role.toLowerCase()}/help`);await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Help & Support", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Frequently asked questions", exact: true })).toBeVisible();
  await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
  await assertNoDataSpinner(page);
  const region = page.locator('[data-sk-region="help-content"]');
  const before = await region.boundingBox();
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/${role.toLowerCase()}-help-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release();
  await expect(region).toBeVisible();
  expect(await region.boundingBox()).toEqual(before);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});

for (const route of ["/", "/login"]) for (const width of [375, 1280]) for (const dark of [false, true]) test(`${route} ${width} ${dark ? "dark" : "light"}: static public page needs no invented skeleton`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript(dark => localStorage.setItem("qed.settings", JSON.stringify({ darkMode: dark })), dark);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("**/api/auth/me", route => route.fulfill({ status: 401, json: { message: "Unauthenticated" } }));
  await page.goto(route);await waitForDataRoute(page);
  const region = page.locator(route === "/" ? '[data-sk-region="landing-content"]' : '[data-sk-region="login-content"]');
  await expect(region).toBeVisible();
  await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
  await assertNoDataSpinner(page);
  if (route === "/login") await expect(page.getByRole("button", { name: "Login", exact: true })).toBeVisible();
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/${route === "/" ? "landing" : "login"}-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});
