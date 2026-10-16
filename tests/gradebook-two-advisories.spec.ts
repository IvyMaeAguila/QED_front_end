import { test, expect } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';

test('two advisory classes keep gradebook, submissions, history and parent visibility scoped to the selected class', async ({ page }) => {
  const release = await mockDirectory(page, 'TEACHER', false);
  release();
  const submitted = new Set<string>();
  const writes: { endpoint: string; body: Record<string, unknown> }[] = [];
  await page.route('**/api/gradingPeriods', route => route.fulfill({ json: { success: true, data: [{ id: '5', termNumber: 1, termLabel: 'Term 1', isActive: true }] } }));
  await page.route('**/api/advisoryGrading/**', async route => {
    const url = new URL(route.request().url());
    const endpoint = url.pathname.split('/').pop()!;
    const body = route.request().method() === 'POST' ? route.request().postDataJSON() : null;
    const classId = String(body?.classId ?? url.searchParams.get('classId'));
    if (body) {
      writes.push({ endpoint, body });
      if (endpoint === 'submission') submitted.add(classId);
      await route.fulfill({ json: { success: true, data: { updatedCount: 1 } } });
      return;
    }
    const second = classId === '12';
    const student = { studentId: second ? '202' : '201', firstName: second ? 'Beta' : 'Alpha', lastName: 'Learner', middleName: null, gender: 'F', grades: { '301': { status: 'submitted', termGrade: 88, average: 88, isOwnAdvisory: true } }, overallAverage: 88 };
    let data: unknown = [];
    if (endpoint === 'sections') data = [{ classId: '11', sectionName: 'Class A', gradeLevel: 'Grade 1' }, { classId: '12', sectionName: 'Class B', gradeLevel: 'Grade 1' }];
    if (endpoint === 'gradebook') data = { sectionName: second ? 'Class B' : 'Class A', gradeLevel: 'Grade 1', subjects: [{ subjectSectionId: '301', subjectId: 401, subjectName: 'Math', submitted: true, isOwnAdvisory: true }], students: [student] };
    if (endpoint === 'submission') data = { submitted: submitted.has(classId), submittedAt: submitted.has(classId) ? '2026-10-10T08:00:00Z' : null };
    if (endpoint === 'logs') data = submitted.has(classId) ? [{ id: 1, type: 'advisory', label: second ? 'Class B submission' : 'Class A submission', submittedByName: 'Teacher Fixture', submittedAt: '2026-10-10T08:00:00Z' }] : [];
    if (endpoint === 'visibility') data = { students: [{ ...student, parentName: 'Guardian Fixture', isVisible: false, updatedAt: null }] };
    await route.fulfill({ json: { success: true, data } });
  });

  await page.goto('/teacher/grades');
  await waitForDataRoute(page);
  await expect(page.getByText('Learner, Alpha', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Section: Class A', exact: true }).selectOption('Class B');
  await expect(page.getByText('Learner, Beta', { exact: true })).toBeVisible();
  await expect(page.getByText('Learner, Alpha', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit Class Grades', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Re-submit Class Grades', exact: true })).toBeEnabled();
  expect(writes[0]).toEqual({ endpoint: 'submission', body: { gradingPeriodId: '5', classId: '12' } });
  await page.getByRole('button', { name: 'Submission History', exact: true }).click();
  await expect(page.getByText('Class B submission', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Parent Visibility', exact: true }).click();
  await expect(page.getByText('Learner, Beta', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Select all students', exact: true }).click();
  await page.getByRole('button', { name: 'Show to Parents (1)', exact: true }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect(writes[1].body).toMatchObject({ gradingPeriodId: '5', classId: '12', visible: true, applyToAll: true });
  await page.getByRole('button', { name: 'Gradebook', exact: true }).click();
  await page.getByRole('button', { name: 'Section: Class B', exact: true }).selectOption('Class A');
  await expect(page.getByText('Learner, Alpha', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit Class Grades', exact: true })).toBeVisible();
  expect(submitted.has('11')).toBe(false);
});
