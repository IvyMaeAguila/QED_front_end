import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { assertNoDataSpinner, captureFixedOverlay, checkRenderedContrast, checkShimmerPixels } from './design-pixels';
import fs from 'node:fs';
async function accounts(page:Page,dark:boolean,missing=false){
 const context=await mockDirectory(page,'ADMIN',dark); let resolve!:()=>void;const gate=new Promise<void>(r=>{resolve=r;});let fail=false;
 await page.route('**/api/user/usersList',async route=>{await gate;if(fail){await route.fulfill({status:500,json:{message:'Accounts unavailable'}});return;}await route.fulfill({json:{success:true,data:missing?[]:[{id:'1',role:'PARENT',firstName:'Ana',lastName:'Cruz',middleName:'A',email:'ana@example.test',contactNumber:'09123456789',status:'Active',gender:'Female'}]}});});
 return Object.assign(()=>{context();resolve();},{fail:()=>{fail=true;},recover:()=>{fail=false;}});
}
for(const width of [375,1280])for(const dark of [false,true])test(`edit user ${width} ${dark?'dark':'light'} keeps real form labels and controls`,async({page})=>{
 await page.setViewportSize({width,height:1000});const release=await accounts(page,dark);await page.goto('/admin/users/parent/1/edit');await waitForDataRoute(page);
 await expect(page.getByRole('heading',{name:'Edit User Record',exact:true})).toBeVisible();
 for(const label of ['Last Name','First Name','M.I.','Role','Gender','Email Address','Contact Number','Status'])await expect(page.getByRole('region',{name:'User account form'}).getByText(label,{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Save Changes',exact:true})).toBeVisible();await expect(page.getByText(/No user found/)).toHaveCount(0);
 await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute('data-sk-phase','revealed');await assertNoDataSpinner(page);
 const fieldSelectors=['lastName','firstName','middleName','gender','email','contactNumber','status'].map(field=>`[data-sk-region="user-form-${field}"]`);
 const verify=await captureFixedOverlay(page,`admin-user-edit-${width}-${dark?'dark':'light'}`,fieldSelectors);
 const fieldBoxes=await page.evaluate(selectors=>selectors.map(selector=>{const element=document.querySelector(selector);if(!element)throw new Error(`Missing field ${selector}`);const box=element.getBoundingClientRect();return {x:box.x,y:box.y,width:box.width,height:box.height};}),fieldSelectors);
 fs.mkdirSync('loading-screenshots',{recursive:true});const prefix=`loading-screenshots/admin-user-edit-${width}-${dark?'dark':'light'}`;await page.screenshot({path:prefix+'-skeleton.png',fullPage:true});
 release();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);await expect(page.getByRole('region',{name:'User account form'}).locator('input').first()).toHaveValue('Cruz');
 await expect(page.getByRole('button',{name:'Save Changes',exact:true})).toBeEnabled();await page.screenshot({path:prefix+'-loaded.png',fullPage:true});
 await verify();const loadedBoxes=await page.evaluate(selectors=>selectors.map(selector=>{const element=document.querySelector(selector);if(!element)throw new Error(`Missing field ${selector}`);const box=element.getBoundingClientRect();return {x:box.x,y:box.y,width:box.width,height:box.height};}),fieldSelectors);loadedBoxes.forEach((box,index)=>expect(box).toEqual(fieldBoxes[index]));
});
test('edit user failure clears value placeholders and retries accounts',async({page})=>{
 const release=await accounts(page,false);release.fail();await page.goto('/admin/users/parent/1/edit');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Edit User Record',exact:true})).toBeVisible();
 release();await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
 release.recover();await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('region',{name:'User account form'}).locator('input').first()).toHaveValue('Cruz');await expect(page.getByRole('button',{name:'Save Changes',exact:true})).toBeEnabled();
});
test('edit user not found waits for the accounts result',async({page})=>{
 const release=await accounts(page,false,true);await page.goto('/admin/users/parent/1/edit');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Edit User Record',exact:true})).toBeVisible();
 await expect(page.getByText(/No user found/)).toHaveCount(0);release();await expect(page.getByText(/No user found with ID/)).toBeVisible();await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
});
for(const width of [375,1280])for(const dark of [false,true])test(`new user ${width} ${dark?'dark':'light'} renders known fields and workflow immediately`,async({page})=>{
 await page.setViewportSize({width,height:1000});const release=await accounts(page,dark);await page.goto('/admin/users/new');await waitForDataRoute(page);
 await expect(page.getByRole('heading',{name:'Add New User Account',exact:true})).toBeVisible();await expect(page.getByText('Last Name',{exact:true})).toBeVisible();
 await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);await assertNoDataSpinner(page);await page.getByRole('region',{name:'User account form'}).locator('input').first().fill('Santos');
 const prefix=`loading-screenshots/admin-user-new-${width}-${dark?'dark':'light'}`;await page.screenshot({path:prefix+'-skeleton.png',fullPage:true});release();
 await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeEnabled();await expect(page.getByRole('region',{name:'User account form'}).locator('input').first()).toHaveValue('Santos');await page.screenshot({path:prefix+'-loaded.png',fullPage:true});
});
test('editing a loaded user preserves the existing endpoint and payload',async({page})=>{
 const release=await accounts(page,false);await page.goto('/admin/users/parent/1/edit');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Edit User Record',exact:true})).toBeVisible();release();
 await expect(page.getByRole('region',{name:'User account form'}).locator('input').first()).toHaveValue('Cruz');await page.getByRole('region',{name:'User account form'}).locator('input').nth(1).fill('Alicia');
 let payload:unknown;await page.route('**/api/user/editUser/1',async route=>{payload=route.request().postDataJSON();await route.fulfill({json:{success:true,message:'Saved'}});});
 await page.getByRole('button',{name:'Save Changes',exact:true}).click();await expect.poll(()=>payload).toMatchObject({userId:'1',firstName:'Alicia',lastName:'Cruz',role:'PARENT',email:'ana@example.test',gender:'Female'});
 expect(payload).not.toHaveProperty('generatedPassword');expect(payload).not.toHaveProperty('userName');
});
test('new principal optional conflict reserves wrapping text then shrinks once without resetting input',async({page})=>{
 const release=await accounts(page,false);await page.goto('/admin/users/new');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Add New User Account',exact:true})).toBeVisible();
 await page.getByRole('region',{name:'User account form'}).locator('select').first().selectOption('PRINCIPAL');await expect(page.locator('[data-sk-region="principal-conflict-notice"]')).toHaveAttribute('data-sk-phase','revealed');
 await page.getByRole('region',{name:'User account form'}).locator('input').first().fill('Santos');release();await expect(page.locator('[data-sk-region="principal-conflict-notice"]')).toHaveCount(0);await expect(page.getByRole('region',{name:'User account form'}).locator('input').first()).toHaveValue('Santos');
});
for(const dark of [false,true])test(`principal conflict ${dark?'dark':'light'} reserves visible paragraph bars on warning surface`,async({page})=>{
 const release=await accounts(page,dark);await page.goto('/admin/users/new');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Add New User Account',exact:true})).toBeVisible();
 await page.getByRole('region',{name:'User account form'}).locator('select').first().selectOption('PRINCIPAL');const region=page.locator('[data-sk-region="principal-conflict-notice"]');await expect(region).toHaveAttribute('data-sk-phase','revealed');
 const bars=region.locator('[data-sk-primitive="text"]');await expect(bars).toHaveCount(3);expect((await bars.first().boundingBox())!.width).toBeGreaterThan(40);
 await checkRenderedContrast(bars.first(),`principal-conflict-${dark?'dark':'light'}`);await checkShimmerPixels(bars.first(),`principal-conflict-${dark?'dark':'light'}`);release();
});
for(const dark of [false,true])test(`edit user ${dark?'dark':'light'} values contrast against actual input surface`,async({page})=>{
 const release=await accounts(page,dark);await page.goto('/admin/users/parent/1/edit');await waitForDataRoute(page);const region=page.locator('[data-sk-region="user-form-lastName"]');await expect(region).toHaveAttribute('data-sk-phase','revealed');
 const bar=region.locator('[data-sk-primitive="text"]');await checkRenderedContrast(bar,`user-form-input-${dark?'dark':'light'}`);await checkShimmerPixels(bar,`user-form-input-${dark?'dark':'light'}`);release();
});
test('pending user selects never show a fallback selected value behind the skeleton',async({page})=>{
 const release=await accounts(page,false);await page.goto('/admin/users/parent/1/edit');await waitForDataRoute(page);const status=page.locator('[data-sk-region="user-form-status"]');await expect(status).toHaveAttribute('data-sk-phase','revealed');
 await expect(status.locator('select')).toHaveValue('');await expect(page.locator('[data-sk-region="user-form-gender"] select')).toHaveValue('');release();
});
