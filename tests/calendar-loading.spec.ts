import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { mockDirectory } from "./fixtures/directory";

for (const role of ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT"] as const)
  for (const width of [375, 1280]) for (const dark of [false, true]) test(`${role} calendar ${width}px ${dark ? "dark" : "light"}: real month and shared event rows`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const release = await mockDirectory(page, role, dark);
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/${role.toLowerCase()}/calendar`);await waitForDataRoute(page);
    const title = page.getByRole("heading", { name: "Calendar", exact: true });
    await expect(title).toBeVisible();
    const before = await title.boundingBox();
    await expect(page.getByRole("button", { name: "Expand activities" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Expand holidays" })).toBeVisible();
    await page.waitForFunction(() => [...document.querySelectorAll(".sk-region")].some(region => region.getAttribute("data-sk-phase") === "revealed"));
    const prefix = `loading-screenshots/${role.toLowerCase()}-calendar-${width}-${dark ? "dark" : "light"}`;
    fs.mkdirSync("loading-screenshots", { recursive: true });
    await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
    release();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(await title.boundingBox()).toEqual(before);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  });
