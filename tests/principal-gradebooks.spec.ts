import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner } from "./design-pixels";
import fs from "node:fs";

async function gradebooksFixture(page: Page, dark: boolean, count = 3) {
  const releaseContext = await mockDirectory(page, "PRINCIPAL", dark);
  let release!: () => void;
  let gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/gradesheets/section-grade", async route => {
    await gate;
    await route.fulfill({ json: Array.from({ length: count }, (_, index) => ({ gradeLevelId: 1, gradeLevel: "Grade 1", sections: [{ sectionId: index + 1, section: `Maroon ${index + 1}`, studentCount: 20, isSubmitted: index % 2 === 0, gradingPeriodId: index % 2 === 0 ? 1 : null }] })) });
  });
  return { finish: () => { releaseContext(); release(); }, holdAgain: () => { gate = new Promise<void>(resolve => { release = resolve; }); } };
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`principal gradebooks ${width} ${dark ? "dark" : "light"}: real shell and existing cards`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const fixture = await gradebooksFixture(page, dark);
  await page.goto("/principal/gradebooks");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Gradebook", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "By Grade Level", exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Search grade or section...")).toBeVisible();
  const region = page.locator('[data-sk-region="principal-gradebook-collection"]');
  await expect(region).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  const title = await page.getByRole("heading", { name: "Gradebook", exact: true }).boundingBox();
  const card = await region.locator("article").first().boundingBox();
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/principal-gradebooks-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  fixture.finish(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  expect(await page.getByRole("heading", { name: "Gradebook", exact: true }).boundingBox()).toEqual(title);
  const loaded = await region.locator("article").first().boundingBox();
  expect(loaded!.height).toBe(card!.height); expect(loaded!.width).toBe(card!.width);
  await expect(page.locator("[data-sk-primitive], [data-sk-frame], [role=status]")).toHaveCount(0);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});

test("repeat gradebook visit displays cached cards and school year immediately", async ({ page }) => {
  const fixture = await gradebooksFixture(page, false);
  await page.goto("/principal/gradebooks");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Gradebook", exact: true })).toBeVisible();
  fixture.finish(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await page.getByText("Help & Support", { exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Help & Support", exact: true })).toBeVisible();
  fixture.holdAgain(); await page.goBack();
  const region = page.locator('[data-sk-region="principal-gradebook-collection"]');
  await expect(region.locator("[data-sk-stale]")).toBeVisible();
  await expect(region.locator("article")).toHaveCount(3);
  await expect(region.locator("[data-sk-primitive]")).toHaveCount(0);
  await expect(region).toHaveAttribute("data-sk-phase", "dimmed");
  fixture.finish(); await expect(region).toHaveAttribute("data-sk-phase", "settled");
});

test("inline school year preserves the original paragraph flow", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const fixture = await gradebooksFixture(page, false);
  await page.goto("/principal/gradebooks");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Gradebook", exact: true })).toBeVisible();
  fixture.finish(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  const lines = await page.locator('[data-sk-region="gradebook-school-year"]').evaluate(element => {
    const paragraph = element.closest("p")!;
    const prefix = [...paragraph.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent!.includes("School Year"))!;
    const value = document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode()!;
    const range = document.createRange(); range.selectNodeContents(prefix);
    const prefixTop = [...range.getClientRects()].at(-1)!.top;
    range.selectNodeContents(value);
    return { prefixTop, valueTop: range.getBoundingClientRect().top };
  });
  expect(Math.abs(lines.prefixTop - lines.valueTop), "an inline loader must not insert a new paragraph line").toBeLessThanOrEqual(1);
});
