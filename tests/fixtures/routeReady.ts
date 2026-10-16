import { expect, type Page } from "@playwright/test";

/** Page-data tests begin after auth and lazy-code handoff. Bootstrap/lazy tests
 * deliberately omit this helper and exercise both gates themselves. */
export async function waitForDataRoute(page: Page) {
  if (!/^\/(admin|principal|teacher|parent)(\/|$)/.test(new URL(page.url()).pathname)) return;
  await expect(page.locator(".qed-account-ui")).toBeVisible();
  await expect(page.locator("[data-route-skeleton]")).toHaveCount(0);
  // Subject geometry must compare the same typography on both sides of swap.
  // Its screenshot already waits for fonts; the preceding measurement must too.
  if (new URL(page.url()).pathname === "/teacher/subjects") {
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
  }
}
