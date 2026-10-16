import { waitForDataRoute } from "./fixtures/routeReady";
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";

async function subjectsFixture(page: Page, count: number, dark = false) {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.addInitScript(dark => localStorage.setItem("qed.settings", JSON.stringify({ darkMode: dark })), dark);
  await page.route("**/socket.io/**", route => route.abort());
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/api/auth/me") body = { user: { id: "1", user_name: "teacher", role: "TEACHER", name: "Marie Dela Cruz" } };
    else if (path.startsWith("/api/user-profile")) body = { id: "1", userName: "teacher", role: "TEACHER", name: "Marie Dela Cruz", email: "teacher@example.test" };
    else if (path.startsWith("/api/classes")) body = { success: true, data: [] };
    else if (path.includes("notifications")) body = { notifications: [], unreadCount: 0 };
    else if (path === "/api/mySubjects/subjects") {
      await gate;
      body = { data: Array.from({ length: count }, (_, i) => ({ subject_section_id: i + 1, subject_id: i + 1, subject_code: `S${i}`, subject_name: `Mathematics ${i + 1}`, grade_level_id: 1, grade_level: "Grade 1", section_id: 1, section_name: "Maroon" })) };
    }
    await route.fulfill({ json: body });
  });
  return release;
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`teacher subjects ${width}px ${dark ? "dark" : "light"}: real shell, card geometry and screenshots`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await subjectsFixture(page, 6, dark);
  await page.goto("/teacher/subjects");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Subjects", exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Search subject...")).toBeVisible();
  await expect(page.getByRole("button", { name: "By Section" })).toBeVisible();
  await expect(page.getByText("Grade Level", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "All Grades", exact: true })).toBeVisible();
  await expect(page.locator(".qed-splash")).toHaveCount(0);
  const skeletonCard = page.locator("[data-sk-layer] article, [data-sk-frame] article").first();
  const before = await skeletonCard.boundingBox();
  expect(before).not.toBeNull();
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/teacher-subjects-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
  const after = await page.locator("[data-sk-content] article").first().boundingBox();
  for (const key of ["x", "y", "width", "height"] as const) expect(Math.abs(after![key] - before![key]), key).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  const filter = page.getByRole("button", { name: "All Grades", exact: true });
  const filterBox = (await filter.boundingBox())!;
  const viewBox = (await page.getByRole("button", { name: "By Section" }).boundingBox())!;
  expect(Math.abs(filterBox.y - viewBox.y)).toBeLessThanOrEqual(1);
  expect(filterBox.x + filterBox.width).toBeLessThan(viewBox.x);
  await filter.click();
  await page.getByRole("option", { name: "Grade 2", exact: true }).click();
  await expect(page.locator("[data-sk-content] article")).toHaveCount(0);
  await page.getByRole("button", { name: "Grade 2", exact: true }).click();
  await page.getByRole("option", { name: "All Grades", exact: true }).click();
  await expect(page.locator("[data-sk-content] article")).toHaveCount(6);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

for (const count of [0, 1, 9]) test(`teacher subjects variable result: ${count} rows, stable actions and filters`, async ({ page }) => {
  const release = await subjectsFixture(page, count);
  await page.goto("/teacher/subjects");await waitForDataRoute(page);
  const controls = page.getByRole("button", { name: "By Section" });
  await expect(controls).toBeVisible();
  const before = await controls.boundingBox();
  const heading = await page.getByRole("heading", { name: "Subjects", exact: true }).boundingBox();
  const loadingRegion = page.locator(".sk-region[data-sk-variable]");
  await expect(loadingRegion).toHaveAttribute("data-sk-phase", "revealed");
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
  expect(await controls.boundingBox()).toEqual(before);
  expect(await page.getByRole("heading", { name: "Subjects", exact: true }).boundingBox()).toEqual(heading);
  await expect(page.locator("[data-sk-content] article")).toHaveCount(count);
  if (!count) await expect(page.getByText("No subjects assigned to you yet.")).toBeVisible();
});
