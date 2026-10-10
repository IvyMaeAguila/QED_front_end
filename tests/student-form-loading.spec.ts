import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { assertNoDataSpinner, captureFixedOverlay, checkRenderedContrast, checkShimmerPixels } from './design-pixels';
import fs from 'node:fs';
async function fixture(page:Page,dark:boolean,missing=false,long=false){
 const context=await mockDirectory(page,'ADMIN',dark);let finish!:()=>void;const gate=new Promise<void>(r=>{finish=r;});let failed=false, choiceFailure=false;
 await page.route('**/api/student/allStudents',async route=>{await gate;if(failed){await route.fulfill({status:500,json:{message:'Students unavailable'}});return;}await route.fulfill({json:{data:missing?[]:[{id:1,grade_level_id:1,section_id:1,student_number:'A23-0001',learner_reference_number:'123456789012',first_name:long?'Maria Alexandra '.repeat(12):'Ana',last_name:'Cruz',middle_name:'A',gender:'Female',grade_level_name:'Grade 1',section_name:'Maroon'}]}});});
 await page.route('**/api/gradeLevel/**',async route=>{await gate;const path=new URL(route.request().url()).pathname;if(choiceFailure){await route.fulfill({status:500,json:{message:'Choices unavailable'}});return;}await route.fulfill({json:path.endsWith('getGradeLevels')?[{id:1,grade_level:'Grade 1'}]:[{id:1,section_name:'Maroon',grade_level:'Grade 1'}]});});
 return Object.assign(()=>{context();finish();},{fail:()=>{failed=true;},recover:()=>{failed=false;choiceFailure=false;},failChoices:()=>{choiceFailure=true;}});
}
for(const width of [375,1280])for(const dark of [false,true])test(`student edit ${width} ${dark?'dark':'light'} keeps actual fields while the record loads`,async({page})=>{
 await page.setViewportSize({width,height:1100});const release=await fixture(page,dark);await page.goto('/admin/students/1/edit');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Edit Student Record',exact:true})).toBeVisible();
 for(const label of ['Student ID','LRN','Last Name','First Name','Middle Name','Gender'])await expect(page.locator('main').getByText(label,{exact:true})).toBeVisible();await expect(page.getByText(/No student found/)).toHaveCount(0);
 await expect(page.locator('[data-sk-region="student-form-studentId"]')).toHaveAttribute('data-sk-phase','revealed');await assertNoDataSpinner(page);
 const verify=await captureFixedOverlay(page,`admin-student-edit-${width}-${dark?'dark':'light'}`,['studentId','lrn','lastName','firstName','middleName','gender'].map(field=>`[data-sk-region="student-form-${field}"]`));
 fs.mkdirSync('loading-screenshots',{recursive:true});const prefix=`loading-screenshots/admin-student-edit-${width}-${dark?'dark':'light'}`;await page.screenshot({path:prefix+'-skeleton.png',fullPage:true});release();
 await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);await expect(page.locator('main input').first()).toHaveValue('A23-0001');await verify();await page.screenshot({path:prefix+'-loaded.png',fullPage:true});
 await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.locator('main select').first()).toHaveValue('1');await expect(page.locator('main select').nth(1)).toHaveValue('1');
});

test('student edit error clears all shapes and retries the record request',async({page})=>{
 const release=await fixture(page,false);release.fail();await page.goto('/admin/students/1/edit');await waitForDataRoute(page);await expect(page.locator('[data-sk-region="student-form-studentId"]')).toHaveAttribute('data-sk-phase','revealed');release();
 await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('[data-sk-primitive], [data-sk-layer], [role=status]')).toHaveCount(0);release.recover();await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('main input').first()).toHaveValue('A23-0001');await expect(page.getByRole('alert')).toHaveCount(0);
});
test('student not found is rendered only after a completed empty response',async({page})=>{
 const release=await fixture(page,false,true);await page.goto('/admin/students/1/edit');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Edit Student Record',exact:true})).toBeVisible();await expect(page.getByText(/No student found/)).toHaveCount(0);release();await expect(page.getByText(/No student found/)).toBeVisible();await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
});
for(const width of [375,1280])for(const dark of [false,true])test(`student new ${width} ${dark?'dark':'light'} keeps known input and workflow real`,async({page})=>{
 await page.setViewportSize({width,height:1100});const release=await fixture(page,dark);await page.goto('/admin/students/new');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Add New Student Record',exact:true})).toBeVisible();await expect(page.locator('main [data-sk-primitive]')).toHaveCount(0);await assertNoDataSpinner(page);
 await page.getByPlaceholder('Dela Cruz').fill('Santos');await page.screenshot({path:`loading-screenshots/admin-student-new-${width}-${dark?'dark':'light'}-skeleton.png`,fullPage:true});release();await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeEnabled();await expect(page.getByPlaceholder('Dela Cruz')).toHaveValue('Santos');await page.screenshot({path:`loading-screenshots/admin-student-new-${width}-${dark?'dark':'light'}-loaded.png`,fullPage:true});
});
test('placement errors are retryable without losing edited student fields',async({page})=>{
 const release=await fixture(page,false);release.failChoices();await page.goto('/admin/students/1/edit');await waitForDataRoute(page);release();await expect(page.locator('main input').first()).toHaveValue('A23-0001');await page.getByPlaceholder('Juan').fill('Alicia');await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();release.recover();await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('main select').first()).toHaveValue('1');await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByPlaceholder('Juan')).toHaveValue('Alicia');
});
test('student edit retains the existing update endpoint and payload',async({page})=>{
 const release=await fixture(page,false);let payload:unknown;let requests=0;let finishSave!:()=>void;const saveGate=new Promise<void>(resolve=>finishSave=resolve);
 await page.route('**/api/student/updateStudent/1',async route=>{requests++;payload=route.request().postDataJSON();await saveGate;await route.fulfill({json:{success:true}});});
 await page.goto('/admin/students/1/edit');await waitForDataRoute(page);release();await expect(page.locator('main input').first()).toHaveValue('A23-0001');await page.getByPlaceholder('Juan').fill('Alicia');
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Review student record',exact:true})).toBeVisible();
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 expect(requests,'Continue must enter Review without submitting the form').toBe(0);
 await page.getByRole('button',{name:/Save/}).click();
 await expect.poll(()=>payload).toEqual({studentId:'A23-0001',lrn:'123456789012',lastName:'Cruz',firstName:'Alicia',middleName:'A',gender:'Female',gradeLevel:'1',section:'1'});
 expect(requests,'one explicit Save produces one update').toBe(1);finishSave();await expect(page).toHaveURL(/\/admin\/students$/);
});
for(const dark of [false,true])test(`student input ${dark?'dark':'light'} contrast and shimmer pixels`,async({page})=>{
 await fixture(page,dark);await page.goto('/admin/students/1/edit');await waitForDataRoute(page);const shape=page.locator('[data-sk-region="student-form-firstName"] [data-sk-primitive]');await expect(page.locator('[data-sk-region="student-form-firstName"]')).toHaveAttribute('data-sk-phase','revealed');await checkRenderedContrast(shape,`student-form-${dark?'dark':'light'}`);await checkShimmerPixels(shape,`student-form-${dark?'dark':'light'}`);
});
test('single-line form controls remain fixed across short and long student values',async({page})=>{
 const sizes:unknown[]=[];for(const long of [false,true]){const release=await fixture(page,false,false,long);await page.goto('/admin/students/1/edit');await waitForDataRoute(page);release();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);sizes.push(await page.locator('[data-sk-region="student-form-firstName"]').evaluate(element=>{const r=element.getBoundingClientRect();return{width:r.width,height:r.height};}));await page.unroute('**/api/**');await page.unroute('**/api/student/allStudents');await page.unroute('**/api/gradeLevel/**');}expect(sizes[0]).toEqual(sizes[1]);
});
