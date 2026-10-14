import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { mockGradebooks, gradebookEndpoints } from './fixtures/gradebooks-query';
import { gradebookSheet } from './fixtures/gradebooks';
// MOCKED API responses. Actual routes and fresh dist in production suite.
const region = (p: Page) => p.locator('[data-sk-region="principal-gradebook-collection"]');
async function ready(p: Page) { await expect(p.getByRole('button', { name: 'View gradebook ›', exact: true })).toBeVisible(); await expect(p.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); }
async function fixture(p: Page, dark = false) { const release = await mockDirectory(p, 'PRINCIPAL', dark); release(); const f = await mockGradebooks(p); await p.route('**/api/gradesheets/grading-period?**', r => r.fulfill({ json: { success: true, defaultGradingPeriodId: 1, data: [{ id: 1, term_number: 1, term_label: 'Term 1', is_active: true, is_submitted: true }, { id: 2, term_number: 2, term_label: 'Term 2', is_active: false, is_submitted: false }] } })); await p.route('**/api/gradesheets/?**', r => r.fulfill({ json: { success: true, data: gradebookSheet } })); return f; }
for (const width of [375, 1280])
    for (const dark of [false, true])
        test(`Gradebooks ${width} ${dark ? 'dark' : 'light'}: loading, filters, locks, navigation, cache, offline, stale refresh and recovery`, async ({ page }, info) => {
            await page.setViewportSize({ width, height: 1000 });
            const f = await fixture(page, dark);
            f.hold('summaries');
            const errors: string[] = [];
            page.on('pageerror', e => errors.push(e.name));
            const consoleErrors: string[] = [];
            page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Failed to load resource'))
                consoleErrors.push(m.text()); });
            const capture = async (name: string) => { const path = info.outputPath(name + '.png'); await page.screenshot({ path, fullPage: true }); await info.attach(name, { path, contentType: 'image/png' }); };
            await page.goto('/principal/gradebooks');
            await expect(page.getByRole('heading', { name: 'Gradebook', exact: true })).toBeVisible();
            await expect(region(page)).toHaveAttribute('aria-busy', 'true');
            await capture('loading');
            f.release('summaries');
            await ready(page);
            await expect(page.locator('article')).toHaveCount(2);
            await expect(page.getByRole('button', { name: 'Not yet submitted', exact: true })).toBeDisabled();
            await expect(page.locator('.qed-account-ui')).toHaveClass(dark ? /\bdark\b/ : /qed-account-ui/);
            if (!dark)
                await expect(page.locator('.qed-account-ui')).not.toHaveClass(/\bdark\b/);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
            await capture('loaded');
            await page.getByPlaceholder('Search grade or section...').fill('Pending');
            await expect(page.locator('article')).toHaveCount(1);
            await expect(page.getByRole('button', { name: 'Not yet submitted', exact: true })).toBeDisabled();
            await page.getByPlaceholder('Search grade or section...').fill('');
            await page.getByRole('combobox', { name: 'Section filter' }).selectOption('Maroon');
            await expect(page.locator('article')).toHaveCount(1);
            await page.getByRole('button', { name: 'All', exact: true }).click();
            expect(f.state.summaries.calls).toBe(1);
            await page.getByRole('button', { name: 'View gradebook ›', exact: true }).click();
            await expect(page).toHaveURL(/gradeLevelId=1&gradingPeriodId=1&sectionId=11/);
            await expect(page.locator('[data-sk-region="grade-sheet-student-row"]')).toHaveCount(1);
            await page.getByRole('combobox', { name: 'Select grading term' }).selectOption('2');
            await expect(page.getByRole('heading', { name: 'Grades Unavailable', exact: true })).toBeVisible();
            await page.goBack();
            await ready(page);
            expect(f.state.summaries.calls).toBe(1);
            await page.context().setOffline(true);
            await expect(page.getByRole('alert')).toContainText('offline');
            await ready(page);
            await expect(page.locator('article')).toHaveCount(2);
            await capture('cached-offline');
            for (let i = 0; i < 3; i++)
                await page.getByRole('button', { name: 'Retry', exact: true }).click();
            expect(f.state.summaries.calls).toBe(1);
            await page.context().setOffline(false);
            await expect(page.getByRole('alert')).toHaveCount(0);
            expect(f.state.summaries.calls).toBe(1);
            await page.clock.install();
            const menu = page.getByRole('button', { name: 'Open menu', exact: true });
            if (await menu.isVisible())
                await menu.click();
            await page.getByRole('link', { name: 'Help & Support', exact: true }).click();
            await expect(page.getByRole('heading', { name: 'Help & Support', exact: true })).toBeVisible();
            await page.clock.fastForward(31000);
            await page.goBack();
            await ready(page);
            await expect.poll(() => f.state.summaries.calls).toBe(2);
            f.state.summaries.status = 500;
            await page.reload();
            await expect(page.getByRole('alert')).toContainText('Failed to fetch grade level summaries.');
            await capture('error');
            f.state.summaries.status = 200;
            await page.getByRole('button', { name: 'Retry', exact: true }).click();
            await ready(page);
            expect(f.state.summaries.calls).toBe(4);
            expect(errors).toEqual([]);
            expect(consoleErrors).toEqual([]);
            await info.attach('mocked-request-counts', { body: JSON.stringify(f.state), contentType: 'application/json' });
        });
for (const endpoint of gradebookEndpoints)
    for (const status of [401, 403])
        test(`built Gradebooks ${endpoint} ${status} session and privacy`, async ({ page }) => { const f = await fixture(page); f.state[endpoint].status = status; await page.goto('/principal/gradebooks'); if (status === 401)
            await expect(page).toHaveURL(/\/login/);
        else {
            await expect(page.getByRole('alert')).toBeVisible();
            await expect(page.locator('article')).toHaveCount(0);
            await expect(page).toHaveURL(/\/principal\/gradebooks/);
        } });
test('built empty overview remains readable offline', async ({ page }) => { const f = await fixture(page); f.setEmpty(); await page.goto('/principal/gradebooks'); await expect(page.getByText('No gradebooks match your search or filters.', { exact: true })).toBeVisible(); await page.context().setOffline(true); await expect(page.getByRole('alert')).toContainText('offline'); await expect(page.getByText('No gradebooks match your search or filters.', { exact: true })).toBeVisible(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await page.context().setOffline(false); await expect(page.getByRole('alert')).toHaveCount(0); expect(f.state.summaries.calls).toBe(1); });
test('built unmounted provider reconciles offline state; expired caches resume once on reconnect', async ({ page }) => { const f = await fixture(page); await page.goto('/principal/gradebooks'); await ready(page); await page.clock.install(); await page.getByRole('link', { name: 'Help & Support', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Help & Support', exact: true })).toBeVisible(); await page.clock.fastForward(601000); await page.context().setOffline(true); await page.goBack(); await expect(page.getByRole('alert')).toContainText('offline'); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await page.context().setOffline(false); await ready(page); expect(f.state.summaries.calls).toBe(2); });
