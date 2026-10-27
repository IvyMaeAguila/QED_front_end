import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
import fs from 'node:fs';
async function fixture(page:Page,dark=false){
 await page.clock.setFixedTime(new Date('2026-10-27T04:00:00Z'));const release=await mockDirectory(page,'TEACHER',dark);release();
 let removed=false,failed=false;let writes=0,reads=0;
 const entries=[{id:'11',studentId:'1',studentName:'Anas, Renzo Parago',lastAttended:'2026-10-05',effectiveDate:'2026-10-14',reason:'Prolonged absence',remarks:'Guardian contacted by adviser.',declaredByName:'Marie Dela Cruz',declaredAt:'2026-10-27'},{id:'12',studentId:'2',studentName:'Villanueva, Sam Reyes',lastAttended:'2026-09-18',effectiveDate:'2026-09-21',reason:'Financial difficulties',remarks:'Parent informed the school.',declaredByName:'Marie Dela Cruz',declaredAt:'2026-09-22'}];
 await page.route('**/api/teacherAttendance/advisory-sections',route=>route.fulfill({json:[{classId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',terms:[{id:'1',label:'Term 1',startDate:'2026-09-01',endDate:'2026-10-31',isActive:true}],roster:[{id:'1',name:'Anas, Renzo Parago',gender:'M'},{id:'2',name:'Villanueva, Sam Reyes',gender:'M'},{id:'3',name:'Student Three',gender:'F'}]}]}));
 await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,route=>route.fulfill({json:{data:{'1':{'2026-10-06':'A','2026-10-09':'A'},'3':{'2026-10-06':'P','2026-10-09':'P','2026-09-21':'P'}}}}));
 await page.route('**/api/teacherAttendance/1/dropouts',route=>{reads++;return route.fulfill(failed?{status:503,json:{message:'Unavailable'}}:{json:{success:true,data:{classId:'1',schoolYearId:'1',today:'2026-10-27',asOf:'2026-10-09',students:{},transferIns:[{studentId:'3',studentName:'October Transferee',joinedDate:'2026-10-15'},{studentId:'4',studentName:'September Transferee',joinedDate:'2026-09-15'}],dropouts:removed?[entries[1]]:entries}}});});
 await page.route('**/api/teacherAttendance/1/students/1/dropout/reverse',route=>{writes++;removed=true;return route.fulfill({json:{success:true}});});
 await page.goto('/teacher/attendance/records');await waitForDataRoute(page);await page.getByRole('button',{name:'Summary',exact:true}).click();await expect(page.getByRole('tab',{name:'All',exact:true})).toBeVisible();
 return {writes:()=>writes,reads:()=>reads,fail:()=>{failed=true;},recover:()=>{failed=false;}};
}
for(const [width,dark] of [[1440,false],[390,true]] as const)test(`monthly summary ${width} ${dark?'dark':'light'} defaults to All, keeps calendar visible and filters record tables`,async({page})=>{
 await page.setViewportSize({width,height:1000});const state=await fixture(page,dark);
 const absence=page.getByRole('region',{name:'Absences this month',exact:true}),dropout=page.getByRole('region',{name:'Dropouts this month',exact:true});
 await expect(page.getByRole('tab',{name:'All',exact:true})).toHaveAttribute('aria-selected','true');await expect(absence).toBeVisible();await expect(dropout).toBeVisible();
 await expect(dropout).toContainText('Anas, Renzo Parago');await expect(dropout).toContainText('Marie Dela Cruz');await expect(dropout).toContainText('Oct 14, 2026');await expect(dropout).not.toContainText('Villanueva');
 const before=state.reads();await page.getByRole('tab',{name:'Dropouts',exact:true}).click();await expect(absence).toHaveCount(0);await expect(dropout).toBeVisible();await expect(page.getByRole('heading',{name:'October 2026',exact:true})).toBeVisible();
 await page.getByRole('tab',{name:'Absences',exact:true}).click();await expect(dropout).toHaveCount(0);await expect(absence).toBeVisible();await expect(absence).toContainText('2 absence records');expect(state.reads()).toBe(before);
 await page.getByRole('tab',{name:'All',exact:true}).click();await page.getByRole('combobox',{name:'Month',exact:true}).selectOption('2026-09');await expect(dropout).toContainText('Villanueva, Sam Reyes');await expect(dropout).not.toContainText('Anas, Renzo');
 await page.getByRole('combobox',{name:'Month',exact:true}).selectOption('2026-10');await expect(dropout).toContainText('Anas, Renzo Parago');
 fs.mkdirSync('monthly-report-review',{recursive:true});await page.locator('[data-monthly-attendance-details]').scrollIntoViewIfNeeded();await page.screenshot({path:`monthly-report-review/monthly-summary-details-${width}.png`,fullPage:true});
 const overflow=await page.getByRole('region',{name:'Monthly attendance summary'}).evaluate(e=>e.scrollWidth-e.clientWidth);expect(overflow).toBeLessThanOrEqual(1);expect(state.writes()).toBe(0);
});
test('monthly dropout table reverses through the standard dialog and remains on the selected details view',async({page})=>{
 const state=await fixture(page);const table=page.getByRole('region',{name:'Dropouts this month',exact:true});await expect(table).toContainText('Anas, Renzo');await page.getByRole('tab',{name:'Dropouts',exact:true}).click();
 await table.getByRole('button',{name:'Reverse dropout declaration for Anas, Renzo Parago'}).click();const dialog=page.getByRole('dialog',{name:'Reverse dropout declaration',exact:true});await dialog.getByLabel('Reversal reason').fill('Incorrect classification');await dialog.getByRole('button',{name:'Reverse dropout declaration',exact:true}).click();await expect(dialog).toHaveCount(0);await expect(table).toContainText('No dropout declarations effective this month.');await expect(page.getByRole('tab',{name:'Dropouts',exact:true})).toHaveAttribute('aria-selected','true');expect(state.writes()).toBe(1);
});
test('detail tabs work with keyboard and a dropout read failure is unavailable rather than empty',async({page})=>{
 const state=await fixture(page);state.fail();await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');await queryClient.invalidateQueries({predicate:(query:any)=>query.queryKey.includes('dropouts')});});
 const table=page.getByRole('region',{name:'Dropouts this month',exact:true});await expect(table.getByRole('alert')).toBeVisible();await expect(table).not.toContainText('No dropout declarations');
 await page.getByRole('tab',{name:'All',exact:true}).focus();await page.keyboard.press('End');await expect(page.getByRole('tab',{name:'Transfer-ins',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.getByRole('region',{name:'Absences this month',exact:true})).toHaveCount(0);await page.getByRole('tab',{name:'Dropouts',exact:true}).click();
 state.recover();await table.getByRole('button',{name:'Retry',exact:true}).click();await expect(table).toContainText('Anas, Renzo Parago');expect(state.writes()).toBe(0);
});

for(const width of [390,1440])test(`incoming transfers filter by joining month and use responsive summary ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});await fixture(page,width===390);
 await page.getByRole('tab',{name:'Transfer-ins',exact:true}).click();const table=page.getByRole('region',{name:'Transfer-ins this month',exact:true});await expect(table).toContainText('October Transferee');await expect(table).toContainText('Oct 15, 2026');await expect(table).not.toContainText('September Transferee');await expect(page.getByRole('region',{name:'Dropouts this month',exact:true})).toHaveCount(0);
 await page.locator('[data-monthly-attendance-details]').scrollIntoViewIfNeeded();fs.mkdirSync('monthly-report-review',{recursive:true});await page.locator('[data-monthly-attendance-details]').screenshot({path:`monthly-report-review/transfer-summary-${width}.png`});
 expect(await table.evaluate(e=>e.scrollWidth-e.clientWidth)).toBeLessThanOrEqual(1);
 await page.getByRole('combobox',{name:'Month',exact:true}).selectOption('2026-09');await expect(table).toContainText('September Transferee');await expect(table).not.toContainText('October Transferee');
});
