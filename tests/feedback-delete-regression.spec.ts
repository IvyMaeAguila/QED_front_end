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

test('failed assessment deletion remains open and never reports success', async ({page})=>{
  const release=await fixture(page,false); release();
  let attempts=0;
  await page.route('**/api/teacherGrading/1/items/item1',r=>{attempts++;return r.fulfill({status:500,json:{success:false,message:'Assessment delete rejected'}})});
  await page.goto('/teacher/subjects/1'); await waitForDataRoute(page);
  await expect(page.getByRole('radio',{name:/Select Practice on/})).toBeEnabled();
  await page.getByRole('radio',{name:/Select Practice on/}).click();
  await page.getByRole('button',{name:'Delete Practice',exact:true}).click();
  const dialog=page.getByRole('alertdialog',{name:'Delete this item?',exact:true});
  await dialog.getByRole('button',{name:'Delete',exact:true}).click();
  await expect(dialog.getByRole('alert')).toHaveText('Assessment delete rejected');
  await expect(page.getByText('Item deleted.',{exact:true})).toHaveCount(0);
  expect(attempts).toBe(1);
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.getByRole('radio',{name:/Select Practice on/})).toBeVisible();
});
