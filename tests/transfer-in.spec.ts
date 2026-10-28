import {test,expect} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
import fs from 'node:fs';
for(const width of [390,1440])test(`admin transferee checkbox and required joining date ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});const release=await mockDirectory(page,'ADMIN',width===390);release();let payload:any;
 await page.route('**/api/student/allStudents',r=>r.fulfill({json:{data:[]}}));
 await page.route('**/api/gradeLevel/**',r=>r.fulfill({json:r.request().url().includes('getGradeLevels')?[{id:1,grade_level:'Grade 1'}]:[{id:1,section_name:'Maroon',grade_level:'Grade 1'}]}));
 await page.route('**/api/student/addNewStudent',r=>{payload=r.request().postDataJSON();return r.fulfill({json:{success:true,data:{id:9}}});});
 await page.goto('/admin/students/new');await waitForDataRoute(page);
 await page.getByPlaceholder('A23-0001').fill('A26-1234');await page.getByPlaceholder('123456789012').fill('123456789012');await page.getByPlaceholder('Dela Cruz').fill('Transfer');await page.getByPlaceholder('Juan').fill('October');
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('main select').first().selectOption('1');await page.locator('main select').nth(1).selectOption('1');
 const check=page.getByRole('checkbox',{name:'This student is a transferee'});await expect(check).not.toBeChecked();await expect(page.locator('#student-joined-date')).toHaveCount(0);await check.check();
 await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByText('Date joined this school is required.',{exact:true})).toBeVisible();await page.getByLabel('Date joined this school').fill('2026-10-15');
 fs.mkdirSync('monthly-report-review',{recursive:true});await page.locator('[data-sk-region="student-form"]').screenshot({path:`monthly-report-review/transfer-form-${width}.png`});
 await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('heading',{name:'Review student record',exact:true})).toBeVisible();await expect(page.locator('main')).toContainText('2026-10-15');await page.getByRole('button',{name:'Add Student',exact:true}).click();await expect.poll(()=>payload?.isTransferee).toBe(true);expect(payload.joinedDate).toBe('2026-10-15');
});

test('teacher records lock prejoin dates, exclude them from totals, and allow joining-date backfill',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T04:00:00Z'));const release=await mockDirectory(page,'TEACHER',false);release();let saved:any;
 await page.route('**/api/teacherAttendance/advisory-sections',r=>r.fulfill({json:[{classId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',terms:[{id:'1',label:'Term 1',startDate:'2026-10-01',endDate:'2026-10-31',isActive:true}],roster:[{id:'1',name:'October Transferee',gender:'M',joinedDate:'2026-10-15'},{id:'2',name:'Existing Student',gender:'F'}]}]}));
 await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,r=>{if(r.request().method()==='POST'){saved=r.request().postDataJSON();return r.fulfill({json:{success:true}});}return r.fulfill({json:{data:{'1':{'2026-10-16':'P'},'2':{'2026-10-01':'P','2026-10-16':'P'}}}});});
 await page.goto('/teacher/attendance/records');await waitForDataRoute(page);
 const before=page.locator('[data-attendance-student="1"][data-attendance-date="2026-10-14"]'),joined=page.locator('[data-attendance-student="1"][data-attendance-date="2026-10-15"]');await expect(before).toBeDisabled();await expect(before).toHaveAttribute('title',/Not yet enrolled/);await expect(joined).toBeEnabled();await expect(page.getByRole('row').filter({hasText:'October Transferee'})).toContainText('1/1');await joined.click();await expect.poll(()=>saved?.date).toBe('2026-10-15');expect(saved.studentId).toBe('1');
});
