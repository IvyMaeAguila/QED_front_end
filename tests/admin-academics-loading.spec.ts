import { test, expect } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';

for (const width of [375, 1280]) for (const dark of [false, true]) {
  test(`Academics ${width} ${dark ? 'dark' : 'light'} keeps counts and assignment actions truthful during loading`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const releaseDirectory = await mockDirectory(page, 'ADMIN', dark);
    let releaseGrades!: () => void;
    const grades = new Promise<void>(resolve => { releaseGrades = resolve; });
    let releaseTeachers!: () => void;
    const teachers = new Promise<void>(resolve => { releaseTeachers = resolve; });
    await page.route('**/api/section/getTeachers', async route => {
      await teachers;
      await route.fulfill({ json: { status: 'success', data: [{ id: 7, user_id: 7, first_name: 'Marie', last_name: 'Cruz', middle_name: null, email_address: '', contact_number: '' }] } });
    });
    await page.route('**/api/subject/getSubjectSectionsByGrade/*', async route => {
      const grade = Number(new URL(route.request().url()).pathname.split('/').at(-1));
      if (grade !== 1) await grades;
      await route.fulfill({ json: { success: true, data: grade === 1 ? Array.from({ length: 5 }, (_, index) => ({
        id: index + 1, subject_id: index + 1, subject_name: `Subject ${index + 1}`, grade_level_id: 1,
        section_name: 'Maroon', is_graded: 1, teacher_id: index === 4 ? null : 7,
        school_year: '2026-2027', status: 'Active', weightDistribution: [],
      })) : [] } });
    });
    await page.goto('/admin/subjects');
    await waitForDataRoute(page);
    await expect(page.getByRole('heading', { name: 'Academics', exact: true })).toBeVisible();
    const collection = page.locator('[data-sk-region="admin-subject-collection"]');
    await expect(collection).toHaveAttribute('data-sk-phase', 'revealed');
    await expect(collection.getByRole('button')).toHaveCount(0);
    await expect(page.getByText(/\d+ of \d+ subjects shown/)).toHaveCount(0);
    await expect(collection.getByText(/\(\d+ subjects\)/)).toHaveCount(0);
    await page.screenshot({ path: `loading-screenshots/admin-academics-${width}-${dark ? 'dark' : 'light'}-loading.png`, fullPage: true });
    releaseGrades();
    await expect(collection).toHaveAttribute('data-sk-phase', 'settled');
    await expect(page.getByText('5 of 5 subjects shown', { exact: true })).toBeVisible();
    await expect(collection.locator('article')).toHaveCount(5);
    // Teacher names are still pending, but assigned subjects must never offer reassignment as unassigned.
    await expect(collection.getByRole('button', { name: 'Assign teacher', exact: true })).toHaveCount(1);
    await expect(collection.locator('article').first().locator('[data-sk-region="subjectassignmentcard-p-field-6"] [data-sk-primitive]')).toHaveCount(1);
    releaseTeachers();
    releaseDirectory();
    await expect(collection.getByText('Teacher · Marie Cruz', { exact: true })).toHaveCount(4);
    await expect(collection.locator('[data-sk-primitive]')).toHaveCount(0);
    await page.screenshot({ path: `loading-screenshots/admin-academics-${width}-${dark ? 'dark' : 'light'}-loaded.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
