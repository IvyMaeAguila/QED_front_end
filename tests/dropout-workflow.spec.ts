import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
import fs from 'node:fs';
async function fixture(page:Page,dark=false){
 await page.clock.setFixedTime(new Date('2026-10-15T04:00:00Z'));
 const release=await mockDirectory(page,'TEACHER',dark);release();
 let dropped=false,fail=false;const writes:{url:string;body:any}[]=[];
 const marks={'1':{'2026-10-05':'P','2026-10-06':'A','2026-10-07':'A','2026-10-08':'A','2026-10-09':'A','2026-10-12':'A'},'2':{'2026-10-15':'P'}};
 await page.route('**/api/teacherAttendance/advisory-sections',route=>route.fulfill({json:[{classId:'1',sectionId:'1',schoolYearId:'1',schoolYearLabel:'2026-2027',sectionName:'Maroon',gradeLevel:'Grade 1',terms:[{id:'1',label:'Term 1',startDate:'2026-10-01',endDate:'2026-10-31',isActive:true}],roster:[{id:'1',name:'Anas, Renzo Parago',gender:'M'},{id:'2',name:'Mendoza, Joniel Cruz',gender:'M'}]}]}));
 await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,route=>route.fulfill({json:{data:marks}}));
 await page.route('**/api/teacherAttendance/1/dropouts',route=>route.fulfill({json:{success:true,data:{classId:'1',schoolYearId:'1',today:'2026-10-15',asOf:'2026-10-12',students:{'1':{lastAttended:'2026-10-05',risk:{count:5,since:'2026-10-06'}},'2':{lastAttended:'2026-10-15',risk:{count:0,since:null}}},dropouts:dropped?[{id:'11',studentId:'1',lastAttended:'2026-10-05',effectiveDate:'2026-10-13',reason:'Prolonged absence',remarks:'Contacted guardian'}]:[]}}}));
 await page.route('**/api/teacherAttendance/1/students/1/dropout**',route=>{writes.push({url:route.request().url(),body:route.request().postDataJSON()});if(fail)return route.fulfill({status:409,json:{message:'Declaration changed. Refresh attendance.'}});dropped=!route.request().url().endsWith('/reverse');return route.fulfill({status:dropped?201:200,json:{success:true}});});
 await page.goto('/teacher/attendance/records');await waitForDataRoute(page);
 await expect(page.getByRole('button',{name:'Actions for Anas, Renzo Parago'})).toBeEnabled();
 return {writes,fail:()=>{fail=true;},setDropped:()=>{dropped=true;}};
}
async function open(page:Page){await page.getByRole('button',{name:'Actions for Anas, Renzo Parago'}).click();await page.getByRole('menuitem',{name:'Declare dropout',exact:true}).click();}
for(const [width,dark] of [[1280,false],[390,true]] as const)test(`dropout menu and system dialog ${width} ${dark?'dark':'light'} are readable, cancellable and keyboard accessible`,async({page})=>{
 await page.setViewportSize({width,height:950});const state=await fixture(page,dark);
 await expect(page.getByText('At risk: 5 consecutive absences',{exact:true})).toBeVisible();
 await expect(page.getByRole('columnheader',{name:'Actions',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Actions for Anas, Renzo Parago'}).click();
 await expect(page.getByRole('menuitem',{name:'View attendance summary'})).toBeVisible();
 await page.keyboard.press('Escape');await expect(page.getByRole('menu')).toHaveCount(0);
 await open(page);const modal=page.getByRole('dialog',{name:'Declare dropout',exact:true});await expect(modal).toBeVisible();await expect(modal.getByLabel('Last day attended')).toHaveValue('2026-10-05');
 const box=await modal.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);
 fs.mkdirSync('monthly-report-review',{recursive:true});await page.screenshot({path:`monthly-report-review/dropout-declare-${width}.png`,fullPage:true});
 await modal.getByRole('button',{name:'Cancel',exact:true}).click();expect(state.writes).toEqual([]);
});
test('adviser declaration preserves past marks, locks effective/later cells, retains summary and records reversal reason',async({page})=>{
 const state=await fixture(page);await open(page);
 const modal=page.getByRole('dialog',{name:'Declare dropout',exact:true});await modal.getByLabel('Effective dropout date').fill('2026-10-13');await modal.getByLabel('Dropout reason').selectOption('Prolonged absence');await modal.getByLabel('Dropout remarks').fill('Contacted guardian');await modal.getByRole('button',{name:'Declare dropout',exact:true}).click();
 await expect(modal).toHaveCount(0);await expect(page.locator('[data-sk-region="attendance-records-table"]')).toHaveAttribute('data-sk-phase','settled');await expect(page.getByText('Dropped',{exact:true})).toBeVisible();expect(state.writes[0].body.effectiveDate).toBe('2026-10-13');
 const cell=(date:string)=>page.locator(`button[data-attendance-date="${date}"][data-attendance-student="1"]`);
 await expect(cell('2026-10-05')).toHaveText('P');await expect(cell('2026-10-12')).toHaveText('A');await expect(cell('2026-10-13')).toBeDisabled();await expect(cell('2026-10-15')).toBeDisabled();
 fs.mkdirSync('monthly-report-review',{recursive:true});await page.screenshot({path:'monthly-report-review/dropout-records-declared.png',fullPage:true});
 await page.getByRole('button',{name:'Actions for Anas, Renzo Parago'}).click();await page.getByRole('menuitem',{name:'View attendance summary'}).click();await expect(page.getByRole('dialog',{name:'Attendance Summary for Anas, Renzo Parago'})).toBeVisible();await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('button',{name:'Actions for Anas, Renzo Parago'}).click();await page.getByRole('menuitem',{name:'Reverse dropout declaration'}).click();const reverse=page.getByRole('dialog',{name:'Reverse dropout declaration',exact:true});await reverse.getByLabel('Reversal reason').fill('Incorrect classification');await reverse.getByRole('button',{name:'Reverse dropout declaration',exact:true}).click();await expect(reverse).toHaveCount(0);await expect(page.locator('[data-sk-region="attendance-records-table"]')).toHaveAttribute('data-sk-phase','settled');await expect(page.getByText('Dropped',{exact:true})).toHaveCount(0);await expect(cell('2026-10-15')).toBeEnabled();expect(state.writes.at(-1)!.body.reason).toBe('Incorrect classification');
});
test('server rejection leaves the declaration open and does not show a dropped student',async({page})=>{
 const state=await fixture(page);state.fail();await open(page);const modal=page.getByRole('dialog',{name:'Declare dropout',exact:true});await modal.getByLabel('Dropout reason').selectOption('Prolonged absence');await modal.getByRole('button',{name:'Declare dropout',exact:true}).click();await expect(modal.getByRole('alert')).toContainText('Declaration changed');await expect(page.getByText('Dropped',{exact:true})).toHaveCount(0);
});


test('today roster and Mark All Present exclude a dropped student from the effective date',async({page})=>{
 const state=await fixture(page);state.setDropped();
 await page.goto('/teacher/attendance');await waitForDataRoute(page);
 await expect(page.locator('[data-sk-region="today-attendance-roster"]')).toHaveAttribute('data-sk-phase','settled');
 await expect(page.getByText('Mendoza, Joniel Cruz',{exact:true})).toBeVisible();await expect(page.getByText('Anas, Renzo Parago',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Mark All Present',exact:true})).toBeDisabled();
});
