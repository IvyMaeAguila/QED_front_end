import { test, expect } from '@playwright/test';
import { mockParent, parentPaths } from './fixtures/parent';
import { waitForDataRoute } from './fixtures/routeReady';

// HTTP fixtures only; no production account, database or PDF download is used.
for (const submitted of [false, true]) for (const termEnded of [false, true]) for (const isVisible of [false, true]) {
  test(`formal report follows backend availability: submitted=${submitted}, ended=${termEnded}, visible=${isVisible}`, async ({ page }) => {
    const f = await mockParent(page);
    const available = submitted && termEnded && isVisible;
    f.resources.visibility.body = { success: true, data: [1, 2, 3].map(termNumber => ({
      gradingPeriodId: termNumber, termNumber, termLabel: `Term ${termNumber}`,
      submitted, termEnded, isVisible, available,
    })) };
    await page.goto('/parent/students/101?tab=progressReport');
    await waitForDataRoute(page);
    await expect.poll(() => f.resources.visibility.calls).toBeGreaterThan(0);
    const pdf = page.getByRole('button', { name: 'Download PDF', exact: true });
    if (available) {
      await expect(pdf).toBeEnabled();
      await expect(page.getByText('This progress report is not available yet.', { exact: true })).toHaveCount(0);
    } else {
      await expect(pdf).toBeDisabled();
      await expect(page.getByText('This progress report is not available yet.', { exact: true })).toBeVisible();
    }
    expect(f.requests.some(r => r.path === parentPaths.visibility)).toBe(true);
  });
}

test('frontend does not recompute availability from visible and ended flags', async ({ page }) => {
  const f = await mockParent(page);
  f.resources.visibility.body = { success: true, data: [1, 2, 3].map(termNumber => ({
    gradingPeriodId: termNumber, termNumber, termLabel: `Term ${termNumber}`,
    submitted: false, termEnded: true, isVisible: true, available: false,
  })) };
  // Academic fixture deliberately contains grades; the authoritative gate still locks the PDF.
  await page.goto('/parent/students/101?tab=progressReport'); await waitForDataRoute(page);
  await expect(page.getByText('This progress report is not available yet.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeDisabled();
});

for (const allSubmitted of [false, true]) test(`Overall PDF requires every backend term available: allSubmitted=${allSubmitted}`, async ({ page }) => {
  const f = await mockParent(page);
  f.resources.visibility.body = { success: true, data: [1, 2, 3].map(termNumber => ({
    gradingPeriodId: termNumber, termNumber, termLabel: `Term ${termNumber}`,
    submitted: termNumber !== 1 || allSubmitted, termEnded: true, isVisible: true,
    available: termNumber !== 1 || allSubmitted,
  })) };
  await page.goto('/parent/students/101?tab=progressReport'); await waitForDataRoute(page);
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Overall', exact: true }).click();
  const pdf = page.getByRole('button', { name: 'Download PDF', exact: true });
  if (allSubmitted) await expect(pdf).toBeEnabled(); else {
    await expect(pdf).toBeDisabled();
    await expect(page.getByText('This progress report is not available yet.', { exact: true })).toBeVisible();
  }
});

test('empty backend visibility fails closed for formal report and PDF', async ({ page }) => {
  const f = await mockParent(page);
  f.resources.visibility.body = { success: true, data: [] };
  await page.goto('/parent/students/101?tab=progressReport'); await waitForDataRoute(page);
  await expect(page.getByText('This progress report is not available yet.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download PDF', exact: true })).toBeDisabled();
});
