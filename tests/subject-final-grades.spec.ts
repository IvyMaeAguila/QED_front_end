import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';

async function fixture(page: Page, dark = false) {
  const requests: string[] = [];
  const release = await mockDirectory(page, 'TEACHER', dark); release();
  const roster = [{ id: '9', name: 'Female Learner', gender: 'F' }, { id: '2', name: 'Male Learner', gender: 'M' }];
  const periods = [1, 2, 3].map(n => ({ id: String(n), schoolYearId: '2026', termNumber: n, termLabel: `Term ${n}`, isActive: n === 1 }));
  await page.addInitScript(({ roster, periods }) => history.replaceState({ usr: {
    queryOwner: { session: 1, role: 'TEACHER', user: '1' }, subjectName: 'Math', tab: 'writtenWorks',
    roster, items: [], scores: {}, terms: periods.map(p => ({ ...p, label: p.termLabel })), selectedTerm: '1', isOwnAdvisory: true,
  }, key: 'final-test', idx: 0 }, '', location.href), { roster, periods });
  await page.route('**/api/gradingPeriods', r => r.fulfill({ json: { success: true, data: periods } }));
  await page.route('**/api/teacherGrading/**', r => {
    const url = new URL(r.request().url()); const period = url.searchParams.get('term') ?? '1';
    if (url.pathname.endsWith('/items') || url.pathname.endsWith('/scores')) requests.push(url.pathname + url.search);
    const data = url.pathname.endsWith('/scores') ? { '2': { '1': 9, '2': 8, '3': 7 }, '9': { '1': 8, '2': 9 } }
      : url.pathname.endsWith('/items') ? [{ id: period, tab: 'writtenWorks', date: '2026-10-01', maxItems: 10, gradingPeriodId: period, activityName: `Term ${period} work` }]
      : { subjectName: 'Math', gradeLevel: 'Grade 1', roster, isOwnAdvisory: true };
    return r.fulfill({ json: { success: true, data } });
  });
  await page.route('**/api/subject/getEffectiveWeights/**', r => { requests.push(new URL(r.request().url()).pathname + new URL(r.request().url()).search); return r.fulfill({ json: { success: true, data: {
    source: 'template', templateId: 1, ww: 100, pt: 0, exam: 0,
    templateStructure: { ww: { domains: [] }, pt: { domains: [] }, examinations: { enabled: false, components: [] },
      transmutationTable: [{ igMin: 90, igMax: 100, transmuted: 95 }, { igMin: 80, igMax: 89.99, transmuted: 85 }, { igMin: 0, igMax: 79.99, transmuted: 75 }],
      descriptorTable: [{ numericalGrade: 85, descriptor: 'Template-specific label' }] },
  } } }); });
  await page.goto('/teacher/subjects/1/records'); await waitForDataRoute(page);
  return requests;
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`final grades navigation and layout ${width} ${dark}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); const requests = await fixture(page, dark);
  const control = page.getByRole('group', { name: 'Class record view' });
  for (const n of [1, 2, 3]) {
    await control.getByRole('button', { name: `Term ${n}`, exact: true }).click();
    await expect(control.getByRole('button', { name: `Term ${n}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase', 'settled');
    await expect(page.getByRole('button', { name: 'Edit Records', exact: true })).toBeVisible();
  }
  const fullRecordWeights = await page.locator('[data-sk-region="subject-record-student"]').first().evaluate(row => {
    const cells = row.querySelectorAll('td');
    return { name: getComputedStyle(cells[1]).fontWeight, grade: getComputedStyle(cells[cells.length - 2]).fontWeight };
  });
  await control.getByRole('button', { name: 'Final Grades', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Final Grades', exact: true });
  const male = summary.locator('tr[data-student-id="2"]'), female = summary.locator('tr[data-student-id="9"]');
  await expect(male).toBeVisible();
  expect(await male.locator('[data-learner-name]').evaluate(element => getComputedStyle(element).fontWeight)).toBe(fullRecordWeights.name);
  expect(await male.locator('td').nth(2).evaluate(element => getComputedStyle(element).fontWeight)).toBe(fullRecordWeights.grade);
  await expect(male.locator('[data-learner-number]')).toHaveText('1');
  await expect(female.locator('[data-learner-number]')).toHaveText('1');
  await expect(summary.getByRole('columnheader', { name: 'Term Grades', exact: true })).toHaveAttribute('colspan', '3');
  await expect(summary.getByRole('columnheader', { name: 'Final Grade', exact: true })).toHaveAttribute('rowspan', '2');
  for (const label of ['Male', 'Female']) {
    const groupHeader = summary.getByRole('rowheader', { name: label, exact: true });
    await expect(groupHeader).toHaveClass(dark ? /bg-white\/10/ : /bg-brand-light/);
    expect(await groupHeader.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  }
  await expect(male.locator('td:not([data-learner-name])')).toHaveText(['1', '95', '85', '75', '85', 'Template-specific label', '']);
  await expect(female.locator('td:not([data-learner-name])')).toHaveText(['1', '85', '95', '', '', '', '']);
  expect(await summary.locator('tr[data-student-id]').first().getAttribute('data-student-id')).toBe('2');
  await expect(page.getByRole('button', { name: 'Edit Records', exact: true })).toHaveCount(0);
  expect(requests.filter(url => url.endsWith('/scores'))).toHaveLength(1);
  expect(new Set(requests).size).toBe(requests.length);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const box = await control.boundingBox(); expect(box!.width).toBeLessThanOrEqual(width);
  const downloadPromise = page.waitForEvent('download');
  await summary.getByRole('button', { name: 'Export Final Grades', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('QED-FINAL-GRADES-1.xlsx');
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await download.path())!);
  const exported = workbook.getWorksheet('FINAL GRADES')!;
  expect(exported.getRow(4).values).toEqual([, 1, 'Male Learner', 95, 85, 75, 85, 'Template-specific label', '']);
  expect(exported.getRow(6).getCell(2).value).toBe('Female Learner');
  expect(exported.getRow(6).getCell(6).value).toBeNull();
  await page.getByRole('dialog', { name: 'Export final grades', exact: true }).getByRole('button', { name: 'Done', exact: true }).click();
  await page.screenshot({ path: test.info().outputPath('final-grades.png'), fullPage: true });
  await control.getByRole('button', { name: 'Term 1', exact: true }).click();
  await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase', 'settled');
  await expect(page.getByRole('button', { name: 'Export DepEd Class Record', exact: true })).toBeVisible();
});

test('rounding and template descriptors never invent missing results', async ({ page }) => {
  await page.goto('/loading-harness.html');
  const results = await page.evaluate(async () => {
    // Resolve via Vite so the tests exercise the same module as the live UI.
    const path = '/src/features/profiles/teacher/pages/subjects/detail/utils/finalGrades.ts';
    const { finalGrade, finalDescriptor, groupLearners } = await import(/* @vite-ignore */ path);
    return {
      missing: [finalGrade([80, null, 90]), finalGrade([80, NaN, 90]), finalGrade([80, Infinity, 90]), finalGrade([80, 90])],
      rounded: [finalGrade([80, 81, 81]), finalGrade([80, 80, 81]), finalGrade([80.5, 80.5, 80.5])],
      descriptors: [finalDescriptor(85, { source: 'template', templateStructure: { descriptorTable: [{ numericalGrade: 85, descriptor: 'Advancing' }] } }),
        finalDescriptor(85, { source: 'template', templateStructure: { descriptorTable: [{ numericalGrade: 85, descriptor: 'Different family' }] } }),
        finalDescriptor(84, { source: 'template', templateStructure: { descriptorTable: [{ numericalGrade: 85, descriptor: 'Advancing' }] } })],
      groups: groupLearners([{ id: 'f', gender: 'F' }, { id: 'm2', gender: 'M' }, { id: 'm1', gender: 'M' }]).map((g: { students: { id: string }[] }) => g.students.map(s => s.id)),
    };
  });
  expect(results).toEqual({ missing: [null, null, null, null], rounded: [81, 80, 81], descriptors: ['Advancing', 'Different family', ''], groups: [['m2', 'm1'], ['f']] });
});

test('a missing period stays blank and navigation is guarded during score editing', async ({ page }) => {
  await fixture(page);
  await page.route('**/api/gradingPeriods', r => r.fulfill({ json: { success: true, data: [1, 2].map(n => ({ id: String(n), schoolYearId: '2026', termNumber: n, termLabel: `Term ${n}`, isActive: n === 1 })) } }));
  await page.reload(); await waitForDataRoute(page);
  const control = page.getByRole('group', { name: 'Class record view' });
  await expect(control.getByRole('button', { name: 'Term 3', exact: true })).toBeDisabled();
  await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase', 'settled');
  await page.getByRole('button', { name: 'Edit Records', exact: true }).click();
  await expect(control.getByRole('button', { name: 'Final Grades', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await control.getByRole('button', { name: 'Final Grades', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Final Grades', exact: true }).locator('tr[data-student-id="2"] td:not([data-learner-name])'))
    .toHaveText(['1', '95', '85', '', '', '', '']);
});

test('switching subject classes cannot reuse the previous roster or grades', async ({ page }) => {
  await fixture(page);
  await page.getByRole('group', { name: 'Class record view' }).getByRole('button', { name: 'Final Grades', exact: true }).click();
  await expect(page.locator('tr[data-student-id="2"]')).toBeVisible();
  await page.route('**/api/teacherGrading/2', r => r.fulfill({ json: { success: true, data: {
    subjectName: 'Science', gradeLevel: 'Grade 1', roster: [{ id: '100', name: 'Other Class Learner', gender: 'M' }], isOwnAdvisory: true,
  } } }));
  await page.goto('/teacher/subjects/2/records'); await waitForDataRoute(page);
  await page.getByRole('group', { name: 'Class record view' }).getByRole('button', { name: 'Final Grades', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Final Grades', exact: true });
  await expect(summary.locator('tr[data-student-id="100"] td:not([data-learner-name])')).toHaveText(['1', '', '', '', '', '', '']);
  await expect(summary.locator('tr[data-student-id="2"]')).toHaveCount(0);
});
