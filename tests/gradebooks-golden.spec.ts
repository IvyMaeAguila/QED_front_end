import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { gradebookSummaries, gradebookSheet } from './fixtures/gradebooks';
import { computeAverage, averageColorVar } from '../src/features/profiles/principal/pages/gradebooks/utils/gradeSheetUtils';
export async function gradebookPage(page: Page, path = '/principal/gradebooks', dark = false) {
    const release = await mockDirectory(page, 'PRINCIPAL', dark);
    release();
    await page.route('**/api/gradesheets/**', route => { const p = new URL(route.request().url()).pathname; return route.fulfill({ json: p.endsWith('section-grade') ? gradebookSummaries : p.endsWith('grading-period') ? { success: true, defaultGradingPeriodId: 1, data: [1, 2, 3].map(id => ({ id, term_number: id, term_label: `Term ${id}`, is_active: id === 1, is_submitted: id === 1 })) } : { success: true, data: gradebookSheet } }); });
    await page.goto(path);
}
test('golden: overview keeps submitted, pending and incomplete cards locked appropriately', async ({ page }) => {
    await gradebookPage(page);
    await expect(page.locator('article')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'View gradebook ›', exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Not yet submitted', exact: true })).toHaveCount(3);
    for (const b of await page.getByRole('button', { name: 'Not yet submitted', exact: true }).all())
        await expect(b).toBeDisabled();
    await page.getByRole('button', { name: 'View gradebook ›', exact: true }).click();
    await expect(page).toHaveURL(/gradeLevelId=1&gradingPeriodId=1&sectionId=11/);
    await expect(page.locator('[data-sk-region="grade-sheet-student-row"]')).toHaveCount(1);
});
test('golden: submitted values, pending secrecy, missing grades, overall rounding and unsubmitted term remain unchanged', async ({ page }) => {
    await gradebookPage(page, '/principal/gradebooks/Grade%201?gradeLevelId=1&sectionId=11&gradingPeriodId=1');
    const row = page.locator('[data-sk-region="grade-sheet-student-row"]');
    await expect(row).toHaveCount(1);
    await expect(row.locator('td')).toHaveText(['Fixture, Synthetic A.', '89.94', 'Pending', '', '', '89.9']);
    await page.getByRole('combobox', { name: 'Select grading term', exact: true }).selectOption('2');
    await expect(page.getByRole('heading', { name: 'Grades Unavailable', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Select grading term', exact: true })).toHaveValue('1');
});
test('golden: missing subjects excluded, zero retained, rounding and color boundaries', () => {
    expect(computeAverage({ A: 89.94, B: 80, C: 0 }, ['A', 'B', 'C', 'Missing'])).toBe(56.6);
    expect(computeAverage({}, ['A'])).toBe(0);
    expect([90, 89.99, 80, 79.99, 75, 74.99].map(averageColorVar)).toEqual(['var(--color-green)', 'var(--color-maroon)', 'var(--color-maroon)', 'var(--color-gold)', 'var(--color-gold)', 'var(--color-red)']);
});

test('principal gradebook keeps gender headers pinned while scrolling horizontally',async({page})=>{
 await page.setViewportSize({width:375,height:1000});await gradebookPage(page,'/principal/gradebooks/Grade%201?gradeLevelId=1&sectionId=11&gradingPeriodId=1');
 const label=page.getByRole('cell',{name:/^Female ·/});await expect(label).toBeVisible();const before=(await label.boundingBox())!.x;
 await label.evaluate(element=>{let parent=element.parentElement;while(parent&&parent.scrollWidth<=parent.clientWidth)parent=parent.parentElement;if(parent)parent.scrollLeft=300;});
 await expect(label).toHaveCSS('position','sticky');expect(Math.abs((await label.boundingBox())!.x-before)).toBeLessThan(3);
});
