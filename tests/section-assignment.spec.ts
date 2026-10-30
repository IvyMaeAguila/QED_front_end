import { test, expect, type Page } from '@playwright/test';
import { mockAdminDashboard } from './fixtures/adminDashboard';
import { matchRoutes } from 'react-router-dom';
import { routeSkeletons } from '../src/shared/loading/routeSkeletons';
import type { AssignmentData } from '../src/features/profiles/admin/pages/classes/services/sectionAssignment.service';

async function fixture(page: Page, dark = false, count = 3) {
  await mockAdminDashboard(page, dark);
  const data: AssignmentData = {
    schoolYear: { id: 2, label: '2026–2027' }, grades: [{ id: 1, grade_level: 'Grade 1' }, { id: 2, grade_level: 'Grade 2' }],
    sections: [{ id: 20, section_name: 'Maroon', grade_level_id: 1, class_id: 2 }, { id: 21, section_name: 'White', grade_level_id: 1, class_id: 3 }],
    students: Array.from({ length: count }, (_, i) => ({ id: i + 101, student_number: `S${i + 101}`, first_name: `Child${i}`, last_name: 'Synthetic', middle_name: '', gender: i % 2 ? 'Male' : 'Female', grade_level_id: 1, grade_level: 'Grade 1', section_id: i === 1 ? 20 : null, section_name: i === 1 ? 'Maroon' : null, assignment_status: i === 1 ? 'Assigned' : 'Unassigned' })),
    counts: { assigned: 1, unassigned: count - 1, needsReview: 0 },
  };
  const state = { reads: 0, writes: [] as unknown[], error: 0, readError: 0, gate: Promise.resolve(), release: () => {} };
  await page.route('**/api/student/section-assignments', async route => {
    state.reads++;
    return route.fulfill({ status: state.readError || 200, json: state.readError ? { message: 'Configure an active school year.' } : { success: true, data } });
  });
  await page.route('**/api/student/bulk-section-assignment', async route => {
    const input = route.request().postDataJSON(); state.writes.push(input); await state.gate;
    if (state.error) return route.fulfill({ status: state.error, json: { message: 'Students changed. Refresh the list.' } });
    for (const student of data.students) if (input.studentIds.includes(student.id)) { student.section_id = input.sectionId; student.section_name = data.sections.find(s => s.id === input.sectionId)!.section_name; student.assignment_status = 'Assigned'; }
    data.counts.assigned += input.studentIds.length; data.counts.unassigned -= input.studentIds.length;
    return route.fulfill({ json: { success: true, data: { assignedCount: input.studentIds.length, schoolYear: data.schoolYear, gradeLevel: { id: 1, label: 'Grade 1' }, section: { id: input.sectionId, label: 'Maroon' } } } });
  });
  return { data, state, hold() { state.gate = new Promise<void>(resolve => { state.release = resolve; }); } };
}
async function open(page: Page) { await page.goto('/admin/classes/section-assignment'); await expect(page.getByLabel('Assignment summary')).toContainText('2026–2027'); }
async function grade(page: Page) { await page.getByLabel('Grade Level', { exact: true }).selectOption('1'); }
const allLabel = 'Select all eligible students on this page';

test('Section Assignment registration preserves dynamic class and unavailable-route matching', () => {
  const routes = Object.keys(routeSkeletons).map(path => ({ path }));
  const matched = (path: string) => matchRoutes(routes, path)?.at(-1)?.route.path ?? null;
  expect(matched('/admin/classes/section-assignment')).toBe('/admin/classes/section-assignment');
  expect(matched('/admin/classes/123')).toBe('/admin/classes/:classId');
  expect(matched('/admin/classes/123/edit')).toBe('/admin/classes/:classId/edit');
  expect(matched('/admin/classes/123/unavailable')).toBeNull();
  expect(matched('/admin/unavailable')).toBeNull();
});

test('cold Section Assignment route keeps its own loading composition until the module arrives', async ({ page }) => {
  const f = await fixture(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requested = 0;
  await page.route(/\/src\/features\/profiles\/admin\/pages\/classes\/SectionAssignmentPage\.tsx(?:\?.*)?$/, async route => {
    requested++; await gate; await route.continue();
  });
  try {
    await page.goto('/admin/classes/section-assignment');
    await expect.poll(() => requested).toBe(1);
    const preview = page.locator('[data-route-skeleton]');
    await expect(preview).toHaveAttribute('data-route-skeleton', '/admin/classes/section-assignment');
    await expect(preview.getByRole('heading', { name: 'Section Assignment', exact: true })).toBeVisible();
    await expect(preview.getByText('Loading section assignments…', { exact: true })).toBeAttached();
    expect(f.state.reads).toBe(0); expect(f.state.writes).toEqual([]);
    release();
    await expect(preview).toHaveCount(0);
    await expect(page.getByLabel('Assignment summary')).toContainText('2026–2027');
    expect(f.state.writes).toEqual([]);
  } finally { release(); }
});

test('Classes navigation opens dedicated page without another sidebar item', async ({ page }) => {
  await fixture(page); await page.goto('/admin/classes'); await page.getByRole('button', { name: 'Assign Sections', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Section Assignment', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Go back', exact: true }).click(); await expect(page).toHaveURL(/\/admin\/classes$/);
});
test('explicit grade, eligible-only selection, confirmation and fresh counts', async ({ page }) => {
  const f = await fixture(page); await open(page);
  await expect(page.getByRole('button', { name: 'Assign Selected Students' })).toBeDisabled();
  await expect(page.getByLabel(allLabel)).toBeDisabled(); await grade(page);
  await page.getByLabel(allLabel).check(); await expect(page.getByText('2 students selected', { exact: true })).toBeVisible();
  await page.getByLabel('Target Section', { exact: true }).selectOption('20');
  await page.getByRole('button', { name: 'Assign Selected Students' }).click();
  await expect(page.getByRole('alertdialog')).toContainText('2 Grade 1 students'); expect(f.state.writes).toHaveLength(0);
  await page.screenshot({path:'section-assignment-review/confirmation.png',fullPage:true});
  await page.getByRole('button', { name: 'Confirm Assignment', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0); await expect(page.getByText('No students awaiting section assignment.')).toBeVisible();
  expect(f.state.writes).toEqual([{ schoolYearId: 2, gradeLevelId: 1, sectionId: 20, studentIds: [101, 103] }]);
  expect(f.state.reads).toBeGreaterThan(1); await expect(page.getByLabel('Assignment summary')).toContainText('Assigned 3');
});
test('search and status changes clear selection; assigned rows cannot be selected', async ({ page }) => {
  await fixture(page); await open(page); await grade(page); await page.getByLabel(allLabel).check();
  await page.getByPlaceholder('Search student...').fill('S101'); await expect(page.getByText('0 students selected', { exact: true })).toBeVisible();
  await expect(page.locator('tbody tr').filter({ hasText: 'S103' })).toHaveCount(0);
  await page.getByPlaceholder('Search student...').fill(''); await page.getByLabel('Assignment Status', { exact: true }).selectOption('Assigned');
  await expect(page.getByRole('checkbox', { name: 'Select Synthetic, Child1', exact: true })).toBeDisabled();
  await page.getByLabel('Grade Level', { exact: true }).selectOption('2');
  await expect(page.getByText('Create or configure a class first')).toBeVisible(); await expect(page.getByLabel('Target Section', { exact: true })).toBeDisabled();
});
test('page select-all excludes hidden pages and clears on pagination', async ({ page }) => {
  await fixture(page, false, 62); await open(page); await grade(page);
  await page.getByLabel(allLabel).check(); await expect(page.getByText('50 students selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click(); await expect(page.getByText('0 students selected', { exact: true })).toBeVisible();
  await page.getByLabel(allLabel).check(); await expect(page.getByText('11 students selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click(); await expect(page.getByLabel(allLabel)).not.toBeChecked();
});
test('concurrent conflict refreshes without retrying; pending confirmation prevents duplicates', async ({ page }) => {
  const f = await fixture(page); await open(page); await grade(page); await page.getByLabel(allLabel).check(); await page.getByLabel('Target Section', { exact: true }).selectOption('20');
  await page.getByRole('button', { name: 'Assign Selected Students' }).click(); f.hold(); f.state.error = 409;
  await page.getByRole('button', { name: 'Confirm Assignment', exact: true }).click();
  await expect(page.getByRole('alertdialog').getByRole('button', { name: /Confirm|Working/ })).toBeDisabled();
  await expect.poll(() => f.state.writes.length).toBe(1); f.state.release();
  await expect(page.getByRole('alertdialog')).toContainText('Students changed.'); expect(f.state.writes).toHaveLength(1);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(page.getByText('0 students selected', { exact: true })).toBeVisible();
});
test('no active year and network errors use explicit recovery', async ({ page }) => {
  const f = await fixture(page); f.state.readError = 409; await page.goto('/admin/classes/section-assignment');
  await expect(page.getByRole('alert')).toContainText('Configure an active school year.'); f.state.readError = 0;
  await page.getByRole('button', { name: 'Retry', exact: true }).click(); await expect(page.getByLabel('Assignment summary')).toBeVisible();
});
test('cached offline view disables assignment without queuing writes', async ({ page }) => {
  const f = await fixture(page); await open(page); await grade(page); await page.getByLabel(allLabel).check();
  await page.getByLabel('Target Section', { exact: true }).selectOption('20');
  await page.context().setOffline(true);
  await expect(page.getByRole('button', { name: 'Assign Selected Students' })).toBeDisabled();
  await expect(page.getByRole('status').filter({ hasText: "You're offline" })).toBeVisible();
  expect(f.state.writes).toHaveLength(0); await page.context().setOffline(false);
  await expect(page.getByRole('button', { name: 'Assign Selected Students' })).toBeEnabled();
});
test('invalid non-null placement is visible for review and cannot be selected', async ({ page }) => {
  const f = await fixture(page); f.data.students[0].assignment_status = 'Needs review'; f.data.students[0].section_id = 10; f.data.students[0].section_name = 'Old section';
  f.data.counts.needsReview = 1; f.data.counts.unassigned = 1;
  await open(page); await grade(page); await page.getByLabel('Assignment Status', { exact: true }).selectOption('All Students');
  await expect(page.getByLabel('Assignment summary')).toContainText('Needs review 1');
  await expect(page.getByRole('checkbox', { name: 'Select Synthetic, Child0', exact: true })).toBeDisabled();
});
test('year conflict refresh clears the grade, target and previous selections', async ({ page }) => {
  const f = await fixture(page); await open(page); await grade(page); await page.getByLabel(allLabel).check();
  await page.getByLabel('Target Section', { exact: true }).selectOption('20');
  await page.getByRole('button', { name: 'Assign Selected Students' }).click();
  f.data.schoolYear = { id: 3, label: '2027–2028' }; f.state.error = 409;
  await page.getByRole('button', { name: 'Confirm Assignment', exact: true }).click();
  await expect(page.getByLabel('Assignment summary')).toContainText('2027–2028');
  await expect(page.getByLabel('Grade Level', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Target Section', { exact: true })).toHaveValue('');
  await expect(page.getByText('0 students selected', { exact: true })).toBeVisible();
});
for (const width of [375, 1440]) for (const dark of [false, true]) test(`responsive keyboard selection ${width} ${dark ? 'dark' : 'light'}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await fixture(page, dark); await open(page); await grade(page);
  const checkbox = page.getByRole('checkbox', { name: 'Select Synthetic, Child0', exact: true }); await checkbox.focus(); await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked(); await expect(page.getByLabel(allLabel)).toHaveAttribute('aria-checked', 'mixed');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByLabel('Target Section', { exact: true }).selectOption('20');
  await page.screenshot({ path: `section-assignment-review/section-assignment-${width}-${dark ? 'dark' : 'light'}.png`, fullPage: true });
});
for (const choice of ['Later', 'Assign Sections']) test(`transition success preserves optional ${choice} navigation`, async ({ page }) => {
  await fixture(page);
  await page.route('**/api/academic-year/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes('getTerms')) return route.fulfill({ json: { status: 'success', data: [] } });
    const year = { id: 2, label: '2026–2027', status: 'Active', startDate: null, endDate: null };
    return route.fulfill({ json: { status: 'success', data: year, ...(route.request().method() === 'POST' ? { transition: { promoted: 2, retained: 0, pending: 1, graduated: 0 } } : {}) } });
  });
  await page.goto('/admin/academic-year'); await page.getByRole('button', { name: 'Change Academic Year', exact: true }).click();
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await page.getByRole('button', { name: 'Save academic year', exact: true }).click();
  await expect(page.getByRole('alertdialog', { name: 'School Year Transition Completed', exact: true })).toBeVisible();
  await page.getByRole('button', { name: choice, exact: true }).click();
  await expect(page).toHaveURL(choice === 'Later' ? /\/admin\/academic-year$/ : /\/admin\/classes\/section-assignment$/);
});

test('header action matches Add Subject sizing', async ({page}) => {
 await fixture(page); await page.goto('/admin/subjects');
 const subject=await page.getByRole('button',{name:'Add Subject',exact:true}).evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {width:r.width,height:r.height,font:s.fontSize,radius:s.borderRadius,padding:s.padding};});
 await page.goto('/admin/classes');
 const assignment=await page.getByRole('button',{name:'Assign Sections',exact:true}).evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {width:r.width,height:r.height,font:s.fontSize,radius:s.borderRadius,padding:s.padding};});
 expect(assignment.height).toBe(subject.height);
 expect(assignment.font).toBe(subject.font);
 expect(assignment.radius).toBe(subject.radius);
 expect(assignment.padding).toBe(subject.padding);
 expect(Math.abs(assignment.width-subject.width)).toBeLessThan(1);
});
