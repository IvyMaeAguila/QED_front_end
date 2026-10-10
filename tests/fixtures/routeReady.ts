import { expect, type Page } from "@playwright/test";

/** Page-data tests begin after auth and lazy-code handoff. Bootstrap/lazy tests
 * deliberately omit this helper and exercise both gates themselves. */
export async function waitForDataRoute(page: Page) {
  if (!/^\/(admin|principal|teacher|parent)(\/|$)/.test(new URL(page.url()).pathname)) return;
  await expect(page.locator(".qed-account-ui")).toBeVisible();
  await expect(page.locator("[data-route-skeleton]")).toHaveCount(0);
}
