import {test,expect} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
import fs from 'node:fs';
for(const dark of [false,true])test('attendance initial loading has compact aligned placeholders '+(dark?'dark':'light'),async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));
 const release=await mockDirectory(page,'TEACHER',dark);release();let show!:()=>void;const gate=new Promise<void>(r=>{show=r;});
 await page.route('**/api/teacherAttendance/advisory-sections',async route=>{await gate;await route.fulfill({json:[{classId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',roster:[{id:'1',name:'Student One',gender:'M'},{id:'2',name:'Student Two',gender:'F'}],terms:[{id:'1',label:'Term 1',termNumber:1,startDate:'2026-10-01',endDate:'2026-10-31',isActive:true}]}]});});
 await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,route=>route.fulfill({json:{data:{}}}));
 await page.goto('/teacher/attendance/records');await waitForDataRoute(page);
 const region=page.locator('[data-sk-region="attendance-records-table"]').last();await expect(region).toHaveAttribute('data-sk-phase','revealed');
 await expect(page.locator('[data-sk-region="attendance-records-term-notice"]')).toHaveCount(0);
 const head=page.locator('[data-sk-region="attendance-records-header"]').last();const loadingHeight=(await head.boundingBox())!.height;
 const term=head.getByRole('columnheader',{name:/Present \/ School Days/});await expect(term.locator('[data-sk-primitive]')).toHaveCount(1);expect((await term.locator('[data-sk-primitive]').boundingBox())!.height).toBeLessThan(20);
 fs.mkdirSync('monthly-report-review',{recursive:true});await page.screenshot({path:'monthly-report-review/attendance-clean-loading-'+(dark?'dark':'light')+'.png',fullPage:true});
 show();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
 const loadedHead=page.locator('[data-sk-region="attendance-records-header"]').last();expect(Math.abs((await loadedHead.boundingBox())!.height-loadingHeight)).toBeLessThan(2);
 await expect(page.getByRole('button',{name:'Term',exact:true})).toHaveCount(0);
});

for(const dark of [false,true])test('today attendance keeps known student details visible while marks load '+(dark?'dark':'light'),async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));
 const release=await mockDirectory(page,'TEACHER',dark);release();let showRoster!:()=>void,showMarks!:()=>void;
 const rosterGate=new Promise<void>(resolve=>{showRoster=resolve;}),marksGate=new Promise<void>(resolve=>{showMarks=resolve;});
 await page.route('**/api/teacherAttendance/advisory-sections',async route=>{await rosterGate;await route.fulfill({json:[{classId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',roster:[{id:'1',name:'Student One',gender:'M'},{id:'2',name:'Student Two',gender:'F'}],terms:[{id:'1',label:'Term 1',termNumber:1,startDate:'2026-10-01',endDate:'2026-10-31',isActive:true}]}]});});
 await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,async route=>{await marksGate;await route.fulfill({json:{data:{'1':{'2026-10-09':'P'}}}});});
 await page.goto('/teacher/attendance');await waitForDataRoute(page);
 await expect(page.locator('[data-sk-region="attendance-term-notice"]')).toHaveCount(0);
 showRoster();await expect(page.getByRole('heading',{name:'Attendance — Maroon',exact:true})).toBeVisible();
 const region=page.locator('[data-sk-region="today-attendance-roster"]');await expect(region).toHaveAttribute('aria-busy','true');
 await expect(region.getByText('Student One',{exact:true})).toBeVisible();await expect(region.getByText('Student Two',{exact:true})).toBeVisible();
 await expect(region.getByRole('img',{name:'Boy profile for Student One'})).toBeVisible();
 const widths=await region.locator('thead th').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().width));
 await page.screenshot({path:'monthly-report-review/today-clean-loading-'+(dark?'dark':'light')+'.png',fullPage:true});
 showMarks();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
 const loaded=await region.locator('thead th').evaluateAll(elements=>elements.map(e=>e.getBoundingClientRect().width));expect(loaded).toEqual(widths);
 await expect(page.getByText('All changes saved.',{exact:true})).toHaveCount(0);
});
