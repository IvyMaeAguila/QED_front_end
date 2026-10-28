import { test, expect } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';

for (const last of ['rules', 'scores'] as const) {
  test(`subject data reveals together when ${last} arrives last`, async ({ page }) => {
    const releaseDirectory = await mockDirectory(page, 'TEACHER', false);
    releaseDirectory();
    let releaseRules!: () => void;
    let releaseScores!: () => void;
    const rules = new Promise<void>(resolve => { releaseRules = resolve; });
    const scores = new Promise<void>(resolve => { releaseScores = resolve; });
    let requestedRules = false, requestedScores = false;
    await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/, async route => {
      const path = new URL(route.request().url()).pathname;
      let data: unknown = {};
      if (path.endsWith('/gradingPeriods')) data = [{ id: '1', schoolYearId: '1', termNumber: 1, termLabel: 'Term 1', isActive: true }];
      else if (path.includes('getEffectiveWeights')) {
        requestedRules = true;
        await rules;
        data = { source: 'manual', ww: 40, pt: 40, exam: 20 };
      } else if (path.endsWith('/items')) data = [{ id: 'item1', tab: 'writtenWorks', date: '2026-10-07', activityName: 'Practice', topic: 'Numbers', format: 'Quiz', maxItems: 20, gradingPeriodId: '1' }];
      else if (path.endsWith('/scores')) {
        requestedScores = true;
        await scores;
      } else if (!path.endsWith('/holistic')) data = { subjectName: 'Mathematics', gradeLevel: 'Grade 1', roster: [{ id: '1', name: 'Student One', gender: 'M' }], isOwnAdvisory: true };
      await route.fulfill({ json: { success: true, data, weekStartDate: '2026-10-05' } });
    });
    await page.goto('/teacher/subjects/1');
    await waitForDataRoute(page);
    await expect.poll(() => requestedRules && requestedScores).toBe(true);
    const roster = page.locator('[data-sk-region="assessment-roster"]');
    await expect(roster).toHaveAttribute('data-sk-phase', 'revealed');
    const firstResponse = page.waitForResponse(response => last === 'rules' ? new URL(response.url()).pathname.endsWith('/scores') : new URL(response.url()).pathname.includes('getEffectiveWeights'));
    if (last === 'rules') releaseScores(); else releaseRules();
    await (await firstResponse).finished();
    await expect(page.locator('[data-sk-region="subject-title"]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByText('Student One', { exact: true })).toHaveCount(0);
    await expect(page.getByText('No items yet — tap Add Item', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Add item', exact: true })).toBeDisabled();
    if (last === 'rules') releaseRules(); else releaseScores();
    await expect(roster).toHaveAttribute('data-sk-phase', 'settled');
    await expect(page.getByRole('heading', { name: 'MATHEMATICS', exact: true })).toBeVisible();
    await expect(page.getByText('Student One', { exact: true })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: /Student One score for Practice/ })).toBeVisible();
    await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
  });
}
