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

for (const width of [375, 1280]) for (const dark of [false, true]) test(`class record export ${width} ${dark}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 800 });
  await fixture(page, dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let calls = 0;
  await page.route('**/exportGradeTemplateBySection/**', async route => {
    calls++;
    await gate;
    await route.fulfill({ contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: 'workbook', headers: { 'content-disposition': 'attachment; filename="QED-TERM-1.xlsx"' } });
  });
  const button = page.getByRole('button', { name: 'Export DepEd Class Record', exact: true });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Export class record', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Preparing your class record');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(el => el.getBoundingClientRect().right <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('export-loading.png') });
  const download = page.waitForEvent('download');
  release();
  expect((await download).suggestedFilename()).toBe('QED-TERM-1.xlsx');
  await expect(dialog).toContainText('Your class record is ready');
  await page.screenshot({ path: test.info().outputPath('export-success.png') });
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(calls).toBe(1);
  await page.route('**/exportGradeTemplateBySection/**', route => route.fulfill({ status: 500, json: { message: 'Export unavailable' } }));
  await button.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Export unavailable', { exact: true })).toBeVisible();
});
