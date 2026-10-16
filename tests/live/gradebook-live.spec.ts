import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
const fixture = JSON.parse(fs.readFileSync(process.env.QED_LIVE_FIXTURE!, 'utf8'));
const backendRequire = createRequire(path.resolve('../thesis_qed/package.json'));
const API = 'http://localhost:7411';

test('real frontend → local API → Clever Cloud: grade submissions and release for two advisory classes', async ({ browser }) => {
  const contexts: any[] = [];
  const dotenv = backendRequire('dotenv');
  const env = dotenv.parse(fs.readFileSync('../thesis_qed/.env'));
  const db = await backendRequire('mysql2/promise').createConnection({ host: env.DB_HOST, user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME, port: Number(env.DB_PORT || 3306) });
  const sessions: Record<string, any> = {};
  const A = fixture.students.find((s: any) => s.label === 'A' && s.kind === 'current');
  const B = fixture.students.find((s: any) => s.label === 'B' && s.kind === 'current');
  const externalB = fixture.subjectSections.find((s: any) => s.label === 'B' && s.kind === 'external');
  const period = fixture.periodId;
  const gradeQuery = `gradeLevelId=${fixture.gradeId}&sectionId=${fixture.sections[1].id}&gradingPeriodId=${period}`;
  const getJSON = async (session: any, route: string) => {
    const response = await session.request.get(API + route);
    expect(response.status(), route).toBe(200);
    return response.json();
  };
  try {
    await db.query('DELETE FROM grade_submissions WHERE section_id IN (?)', [fixture.sections.map((s: any) => s.id)]);
    await db.query('DELETE FROM subject_grade_submissions WHERE subject_section_id IN (?)', [fixture.subjectSections.map((s: any) => s.id)]);
    await db.query('DELETE FROM grade_visibility WHERE student_id IN (?)', [fixture.students.map((s: any) => s.id)]);
    await test.step('real login for adviser, subject teacher, principal and parent', async () => {
      console.log('LIVE: real account login');
      for (const key of Object.keys(fixture.accounts)) {
        const context = await browser.newContext({ baseURL: 'http://localhost:5173' }); contexts.push(context);
        const login = await context.request.post(`${API}/api/auth/login`, { data: { userName: fixture.accounts[key].username, password: fixture.password } });
        expect(login.status(), key).toBe(200);
        sessions[key] = await context.newPage();

      }
    });
    await test.step('adviser sees only current students and current subjects in either advisory class', async () => {
      console.log('LIVE: advisory roster and permissions');
      const page = sessions.adviser;
      await page.goto('/teacher/grades');
      await expect(page.getByText(new RegExp(`TestAcurrent`))).toBeVisible();
      await expect(page.getByText('Pending', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: `Section: ${fixture.sections[0].name}`, exact: true }).selectOption(fixture.sections[1].name);
      await expect(page.getByText(new RegExp(`TestBcurrent`))).toBeVisible();
      for (const kind of ['graduate', 'old', 'deleted']) await expect(page.getByText(new RegExp(`TestB${kind}`))).toHaveCount(0);
      await expect(page.getByRole('columnheader', { name: new RegExp('historical') })).toHaveCount(0);
      const principal = await getJSON(sessions.principal, `/api/gradesheets/?${gradeQuery}`);
      expect(principal.data.advisorySubmitted).toBe(false);
      for (const key of ['adviser', 'parent']) {
        for (const route of ['/api/gradesheets/section-grade', '/api/gradesheets/grading-period', `/api/gradesheets/?${gradeQuery}`]) expect((await sessions[key].request.get(API + route)).status()).toBe(403);
      }
    });
    await test.step('subject submission rejects incomplete official cache and accepts complete scores through UI', async () => {
      console.log('LIVE: subject submission');
      await db.query('UPDATE subject_grade_cache SET is_complete=0 WHERE student_id=? AND subject_section_id=? AND grading_period_id=?', [B.id, externalB.id, period]);
      const rejected = await sessions.subject.request.post(`${API}/api/teacherGrading/${externalB.id}/submission`, { data: { gradingPeriodId: period } });
      expect(rejected.status()).toBe(400);
      await db.query('UPDATE subject_grade_cache SET is_complete=1 WHERE student_id=? AND subject_section_id=? AND grading_period_id=?', [B.id, externalB.id, period]);
      const page = sessions.subject;
      await page.goto(`/teacher/subjects/${externalB.id}`);
      await page.getByRole('button', { name: /Records/ }).click();
      await expect(page.getByRole('button', { name: 'Submit Grades', exact: true })).toBeEnabled();
      await page.getByRole('button', { name: 'Submit Grades', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm & Submit', exact: true }).click();
      await expect(page.getByText('Grades submitted', { exact: true })).toBeVisible();
      const [[row]] = await db.query('SELECT COUNT(*) AS n FROM subject_grade_submissions WHERE subject_section_id=? AND grading_period_id=?', [externalB.id, period]);
      expect(row.n).toBe(1);
    });
    await test.step('adviser submits only Class B; principal sees its actual grades', async () => {
      console.log('LIVE: advisory submission and principal grades');
      const page = sessions.adviser;
      await page.reload();
      await page.getByRole('button', { name: `Section: ${fixture.sections[0].name}`, exact: true }).selectOption(fixture.sections[1].name);
      await expect(page.getByText('Official · All subjects submitted', { exact: false })).toBeVisible();
      await page.getByRole('button', { name: 'Submit Class Grades', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Re-submit Class Grades', exact: true })).toBeEnabled();
      const aStatus = await getJSON(page, `/api/advisoryGrading/submission?classId=${fixture.classes[0]}&gradingPeriodId=${period}`);
      expect(aStatus.data.submitted).toBe(false);
      const principal = await getJSON(sessions.principal, `/api/gradesheets/?${gradeQuery}`);
      expect(principal.data.advisorySubmitted).toBe(true);
      expect(principal.data.students).toHaveLength(1);
      const principalPage = sessions.principal;
      await principalPage.goto(`/principal/gradebooks/Grade%201?${gradeQuery}`);
      await expect(principalPage.getByText(new RegExp('TestBcurrent'))).toBeVisible();
      await expect(principalPage.getByText('88', { exact: true }).first()).toBeVisible();
      const [[row]] = await db.query('SELECT COUNT(*) AS n FROM grade_submissions WHERE section_id=? AND grading_period_id=?', [fixture.sections[1].id, period]);
      expect(row.n).toBe(1);
    });
    await test.step('parent stays locked before term end despite visibility; unlocking/hiding works after term end', async () => {
      console.log('LIVE: parent visibility and term-end release');
      const adviser = sessions.adviser;
      await adviser.getByRole('button', { name: 'Parent Visibility', exact: true }).click();
      await expect(adviser.getByText(new RegExp('TestBcurrent'))).toBeVisible();
      await adviser.getByRole('button', { name: 'Select all students', exact: true }).click();
      await adviser.getByRole('button', { name: 'Show to Parents (1)', exact: true }).click();
      await expect(adviser.getByText('Visible', { exact: true })).toBeVisible();
      const parent = sessions.parent;
      const reportURL = `/api/termPerformanceProgress/${B.id}/term-performance`;
      const overviewURL = `/api/termPerformance/students/${B.id}/term-performance`;
      for (const url of [reportURL, overviewURL]) {
        const body = await getJSON(parent, url);
        expect(body.data.find((p: any) => p.key === `term_${period}` || p.key === String(period)).released).toBe(false);
      }
      await parent.goto(`/parent/students/${B.id}?tab=progressReport`);
      await expect(parent.getByText('This progress report is not available yet.', { exact: true })).toBeVisible();
      await expect(parent.getByText('88', { exact: true })).toHaveCount(0);
      // Move only the private test API's MySQL session clock, never real term dates.
      expect((await parent.request.post(`${API}/__test/clock`, { data: { key: fixture.password, ended: true } })).status()).toBe(200);
      for (const url of [reportURL, overviewURL]) {
        const body = await getJSON(parent, url);
        const term = body.data.find((p: any) => p.key === `term_${period}` || p.key === String(period));
        expect(term.released).toBe(true); expect(term.subjects.some((s: any) => s.grade === 88)).toBe(true);
      }
      await parent.goto(`/parent/students/${B.id}?tab=progressReport`);
      await expect(parent.getByText('88', { exact: true }).first()).toBeVisible();
      await adviser.getByRole('button', { name: 'Select all students', exact: true }).click();
      await adviser.getByRole('button', { name: 'Hide from Parents (1)', exact: true }).click();
      await expect(adviser.getByText('Hidden', { exact: true })).toBeVisible();
      for (const url of [reportURL, overviewURL]) {
        const body = await getJSON(parent, url);
        const term = body.data.find((p: any) => p.key === `term_${period}` || p.key === String(period));
        expect(term.released).toBe(false); expect(term.subjects).toHaveLength(0); expect(term.average).toBeUndefined();
      }
      await parent.reload();
      await expect(parent.getByText('This progress report is not available yet.', { exact: true })).toBeVisible();
      await expect(parent.getByText('88', { exact: true })).toHaveCount(0);
      const aVis = await getJSON(adviser, `/api/advisoryGrading/visibility?classId=${fixture.classes[0]}&gradingPeriodId=${period}`);
      expect(aVis.data.students).toHaveLength(1); expect(aVis.data.students[0].isVisible).toBe(false);
    });
  } finally {
    await sessions.parent?.request.post(`${API}/__test/clock`, { data: { key: fixture.password, ended: false } });
    for (const context of contexts) await context.close();
    await db.end();
  }
});
