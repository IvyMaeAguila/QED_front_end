import type { Page } from '@playwright/test';

// Calendar selects a browser-local day. UTC ISO dates can be the previous day
// in Manila, especially when acceptance runs cross local midnight.
export function browserCalendarDate(page: Page): Promise<string> {
  return page.evaluate(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
}
