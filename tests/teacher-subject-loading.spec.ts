import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { assertNoDataSpinner, checkRenderedContrast, checkShimmerPixels } from './design-pixels';
import fs from 'node:fs';
async function fixture(page: Page, dark: boolean, count = 3, long = false) {
  const context = await mockDirectory(page, 'TEACHER', dark);
  let finish!: () => void; const gate = new Promise<void>(r => { finish = r; });
  let failure = false, requests = 0; let nextGate = Promise.resolve(); let nextFinish = () => {};
  await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/, async route => {
    requests++; await gate; await nextGate;
    if (failure) { await route.fulfill({ status: 500, json: { success: false, message: 'Class unavailable' } }); return; }
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/gradingPeriods')) data = [{ id: '1', termNumber: 1, termLabel: 'Term 1', isActive: true }];
    else if (path.includes('getEffectiveWeights')) data = { source: 'manual', ww: 40, pt: 40, exam: 20 };
    else if (path.endsWith('/items')) data = [{ id: 'item1', tab: 'writtenWorks', date: '2026-10-07', activityName: 'Practice', topic: long ? 'Numeracy and reasoning '.repeat(10) : 'Numbers', format: 'Quiz', maxItems: 20, gradingPeriodId: '1' }];
    else if (path.endsWith('/scores') || path.endsWith('/holistic')) data = {};
    else data = { subjectName: long ? 'Mathematical reasoning and elementary foundations' : 'Mathematics', gradeLevel: 'Grade 1', roster: Array.from({length: count}, (_, i) => ({ id: String(i + 1), name: long ? `Maria ${'Alexandra Villanueva '.repeat(8)}${i}` : `Student ${i + 1}`, gender: i % 2 ? 'F' : 'M' })), isOwnAdvisory: true, adviserName: 'School User' };
    await route.fulfill({ json: { success: true, data, weekStartDate: '2026-10-05' } });
  });
  return Object.assign(() => { context(); finish(); }, { fail: () => { failure = true; }, recover: () => { failure = false; }, requests: () => requests, hold: () => { nextGate = new Promise<void>(resolve => { nextFinish = resolve; }); }, finish: () => nextFinish() });
}
for (const width of [375,1280]) for (const dark of [false,true]) test(`teacher subject ${width} ${dark ? 'dark' : 'light'} keeps real score sheet and controls`, async ({page}) => {
  await page.setViewportSize({width,height:1000}); const release = await fixture(page,dark);
  await page.goto('/teacher/subjects/1');await waitForDataRoute(page);
  await expect(page.getByText('Score Sheet',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Full Records',exact:true})).toBeVisible();
  await expect(page.getByText('90% and up',{exact:true})).toBeVisible();
  await expect(page.getByRole('columnheader',{name:'Student',exact:true})).toBeVisible();
  await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','revealed');
  await assertNoDataSpinner(page);
  fs.mkdirSync('loading-screenshots',{recursive:true}); const prefix=`loading-screenshots/teacher-subject-${width}-${dark ? 'dark' : 'light'}`;
  await page.screenshot({path:prefix+'-skeleton.png',fullPage:true});
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="assessment-student-row"]')).toHaveCount(3);
  await expect(page.getByRole('heading',{name:'MATHEMATICS',exact:true})).toBeVisible();
  await expect(page.locator('[data-sk-primitive], [data-sk-layer], .sk-status')).toHaveCount(0);
  await page.screenshot({path:prefix+'-loaded.png',fullPage:true});
});
for (const count of [0,1,9]) test(`teacher subject ${count} students keeps original empty and full rosters`, async ({page}) => {
  const release=await fixture(page,false,count,count===9); await page.goto('/teacher/subjects/1');await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','revealed'); release();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="assessment-student-row"]')).toHaveCount(count);
  if (!count) await expect(page.getByText('No students found matching "".',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Holistic',exact:true}).click();
  await expect(page.locator('[data-sk-region="holistic-student-row"]')).toHaveCount(count);
});
test('teacher subject record failure clears placeholders and retries its real requests',async ({page})=>{
  const release=await fixture(page,false); release.fail(); await page.goto('/teacher/subjects/1');await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','revealed');release();
  await expect(page.getByRole('alert')).toBeVisible(); await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
  const before=release.requests();release.recover(); await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(page.locator('[data-sk-region="assessment-student-row"]')).toHaveCount(3);
  await expect(page.getByRole('alert')).toHaveCount(0); expect(release.requests()).toBeGreaterThanOrEqual(before+5);
});
for (const width of [375,1280]) for (const dark of [false,true]) test(`teacher holistic ${width} ${dark ? 'dark' : 'light'} keeps actual rating controls and domain headers`, async ({page})=>{
  await page.setViewportSize({width,height:1000});const release=await fixture(page,dark);await page.goto('/teacher/subjects/1');await waitForDataRoute(page);
  await page.getByRole('button',{name:'Holistic',exact:true}).click();
  await expect(page.getByText("This Week's Ratings",{exact:true})).toBeVisible();
  await expect(page.getByRole('columnheader',{name:'Student',exact:true})).toBeVisible();
  await expect(page.locator('[data-sk-region="holistic-roster"]')).toHaveAttribute('data-sk-phase','revealed');
  await assertNoDataSpinner(page);
  const prefix=`loading-screenshots/teacher-subject-holistic-${width}-${dark ? 'dark' : 'light'}`;
  await page.screenshot({path:prefix+'-skeleton.png',fullPage:true});release();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="holistic-student-row"]')).toHaveCount(3);
  await expect(page.locator('[data-sk-primitive], [data-sk-layer], .sk-status')).toHaveCount(0);
  await page.screenshot({path:prefix+'-loaded.png',fullPage:true});
});
test('teacher grading tables are auto-column only because native widths vary with returned names',async({browser})=>{
  const measurements:number[][][]=[];
  for (const long of [false,true]) {
    const page=await browser.newPage({viewport:{width:1280,height:1000}}); const release=await fixture(page,false,3,long);
    await page.goto('/teacher/subjects/1');await waitForDataRoute(page);release();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    const tables:number[][]=[];
    for(const tab of ['Written Works','Holistic']) {
      await page.getByRole('button',{name:tab,exact:true}).click();
      tables.push(await page.locator('table.teacher-user-table thead th').evaluateAll(cells=>cells.map(cell=>cell.getBoundingClientRect().width)));
    }
    measurements.push(tables);await page.close();
  }
  for(let table=0;table<2;table++) expect(measurements[0][table].some((width,i)=>Math.abs(width-measurements[1][table][i])>2)).toBe(true);
});
test('teacher score saving retains the existing request payload and working-item handoff',async({page})=>{
  const release=await fixture(page,false);await page.goto('/teacher/subjects/1');await waitForDataRoute(page);release();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  let payload:unknown;await page.route('**/api/teacherGrading/1/scores',async route=>{payload=route.request().postDataJSON();await route.fulfill({json:{success:true,data:{}}});});
  await page.getByRole('spinbutton',{name:'Student 1 score for Practice, out of 20',exact:true}).fill('17');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect.poll(()=>payload).toEqual({studentId:'1',itemId:'item1',value:17});
  await expect(page.getByText('No items yet — tap Add Item',{exact:true})).toBeVisible();
});
for (const dark of [false,true]) test(`teacher score sheet ${dark ? 'dark' : 'light'} placeholders stay visible on header and row surfaces`,async({page})=>{
  const release=await fixture(page,dark);await page.goto('/teacher/subjects/1');await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','revealed');
  for(const selector of ['thead [data-sk-primitive="text"]','tbody [data-sk-primitive="avatar"]','tbody [data-sk-primitive="control"]']) {
    const shape=page.locator('[data-sk-region="assessment-roster"] '+selector).first();
    await checkRenderedContrast(shape,`teacher-score-${dark ? 'dark' : 'light'}-${selector.includes('thead') ? 'header' : selector.includes('avatar') ? 'avatar' : 'control'}`);
    await checkShimmerPixels(shape,`teacher-score-${dark ? 'dark' : 'light'}-${selector.includes('thead') ? 'header' : selector.includes('avatar') ? 'avatar' : 'control'}`);
  }
  release();
});
test('teacher working table reuses measured pending column widths on repeat load',async({page})=>{
  const release=await fixture(page,false,3,true);await page.goto('/teacher/subjects/1');await waitForDataRoute(page);await expect(page.getByText('Score Sheet',{exact:true})).toBeVisible();release();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  const widths=await page.locator('table.teacher-user-table thead th').evaluateAll(cells=>cells.map(cell=>cell.getBoundingClientRect().width));
  await page.getByRole('button',{name:'Full Records',exact:true}).click();await expect(page).toHaveURL(/\/records$/); await expect(page.getByRole('heading',{name:/— Class Record$/})).toBeVisible();
  await page.evaluate(async()=>{ const url=performance.getEntriesByType('resource').map(entry=>entry.name).find(url=>url.includes('/subjectDetailCache.service.ts')); if (!url) throw new Error('Application cache module was not loaded'); const cache=await import(/* @vite-ignore */ url); cache.invalidateCachedSubjectDetail('1'); if(cache.getCachedSubjectDetail('1')) throw new Error('Cache invalidation failed'); });
  release.hold();await page.goBack();
  await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','revealed');
  const pending=await page.locator('table.teacher-user-table thead th').evaluateAll(cells=>cells.map(cell=>cell.getBoundingClientRect().width));
  expect(pending).toHaveLength(widths.length);pending.forEach((value,index)=>expect(Math.abs(value-widths[index])).toBeLessThanOrEqual(2));
  release.finish();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
});

