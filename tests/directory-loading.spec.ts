import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect } from "@playwright/test";
import fs from "node:fs";

import { mockDirectory } from "./fixtures/directory";

for (const [route, role, title] of [["/principal/teachers", "PRINCIPAL", "Teachers"], ["/principal/teachers/1", "PRINCIPAL", "Teacher Profile"], ["/principal/students", "PRINCIPAL", "Students"], ["/principal/students/class/1", "PRINCIPAL", "Class List"], ["/principal/students/grade/1", "PRINCIPAL", "Class List"], ["/parent/enrolled-children", "PARENT", "Enrolled Children"], ["/parent", "PARENT", "parent-greeting"]] as const)
  for (const width of [375, 1280]) for (const dark of [false, true]) test(`${route} ${width}px ${dark ? "dark" : "light"}: real controls and screenshots`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const release = await mockDirectory(page, role, dark);
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(route);await waitForDataRoute(page);
    const heading = title === "parent-greeting" ? page.getByRole("heading", { name: /Good .*, School User!/ }) : page.getByRole("heading", { name: title, exact: true });
    await expect(heading).toBeVisible();
    await expect(page.locator(".qed-splash")).toHaveCount(0);
    await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
    // Class-list Back retains its fixed dimensions but is vertically centered beside variable text.
    const anchor = title === "Class List" ? page.getByRole("button", { name: "Go back", exact: true }) : heading;
    const before = await anchor.boundingBox();
    const headerBefore = title === "Class List" ? await anchor.evaluate(el => el.parentElement!.getBoundingClientRect().height) : 0;
    await page.waitForTimeout(100);
    expect(await anchor.boundingBox()).toEqual(before); // No movement while the reservation is visible.
    fs.mkdirSync("loading-screenshots", { recursive: true });
    const prefix = `loading-screenshots/${route.slice(1).replaceAll("/", "-")}-${width}-${dark ? "dark" : "light"}`;
    await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
    const after = await anchor.boundingBox();
    if (title === "Class List") {
      expect(before).not.toBeNull(); expect(after).not.toBeNull();
      for (const key of ["x", "width", "height"] as const) expect(after![key]).toBeCloseTo(before![key], 1);
      const headerAfter = await anchor.evaluate(el => el.parentElement!.getBoundingClientRect().height);
      expect(after!.y - before!.y).toBeCloseTo((headerAfter - headerBefore) / 2, 1);
      await expect(anchor).toHaveText(""); await expect(anchor).toHaveAccessibleName("Go back");
    } else expect(after).toEqual(before);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
    expect(errors).toEqual([]);
  });

test("principal directory auto-column classification requires observed variation", async ({ page }) => {
  const widths: number[][] = [];
  for (const long of [false, true]) {
    const release = await mockDirectory(page, "PRINCIPAL", false, 1, long);
    await page.goto("/principal/teachers");await waitForDataRoute(page);
    await expect(page.getByRole("heading", { name: "Teachers", exact: true })).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
    widths.push(await page.locator("thead th").evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width)));
    await page.unroute("**/api/**");
  }
  expect(widths[0].some((width, index) => Math.abs(width - widths[1][index]) > 1)).toBe(true);
});

