# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-subject-loading.spec.ts >> add subject 375 light keeps known form real without data spinners
- Location: tests\add-subject-loading.spec.ts:14:62

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('main') with timeout 5000ms
  - waiting for locator('main')

```

```yaml
- status: Loading…
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | import { mockDirectory } from './fixtures/directory';
  3  | import { assertNoDataSpinner } from './design-pixels';
  4  | import { DEFAULT_ASSESSMENT_TYPES } from '../src/features/profiles/admin/pages/subjects/types/assessmentTypes';
  5  | import fs from 'node:fs';
  6  | 
  7  | async function fixture(page:Page,dark:boolean){
  8  |  const context=await mockDirectory(page,'ADMIN',dark);let finish!:()=>void;const gate=new Promise<void>(r=>{finish=r;});let failYear=false,failGrade=false,failCatalog=false;
  9  |  await page.route('**/api/classes/gradeLevels',async route=>{await gate;await route.fulfill({status:failGrade?500:200,json:failGrade?{message:'Grade choices unavailable'}:{success:true,data:[{id:1,grade_level:'Grade 1'}]}});});
  10 |  await page.route('**/api/academic-year/getAcademicYear',async route=>{await gate;await route.fulfill({status:failYear?500:200,json:failYear?{message:'School year unavailable'}:{status:'success',data:{id:1,label:'2026–2027',status:'Active'}}});});
  11 |  await page.route('**/api/subject/',async route=>{await gate;await route.fulfill({status:failCatalog?500:200,json:{data:DEFAULT_ASSESSMENT_TYPES.map((type,index)=>({id:index+1,assessmentName:type.name}))}});});
  12 |  return Object.assign(()=>{context();finish();},{fail:(kind:string)=>{failYear=kind==='year';failGrade=kind==='grade';failCatalog=kind==='catalog';},recover:()=>{failYear=false;failGrade=false;failCatalog=false;}});
  13 | }
  14 | for(const width of [375,1280])for(const dark of [false,true])test(`add subject ${width} ${dark?'dark':'light'} keeps known form real without data spinners`,async({page})=>{
> 15 |  await page.setViewportSize({width,height:1100});const release=await fixture(page,dark);await page.goto('/admin/subjects/new');await expect(page.locator('main')).toBeVisible();await expect(page.locator('[data-route-skeleton]')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Add New Subject',exact:true})).toBeVisible();await expect(page.getByText('Subject Name',{exact:true})).toBeVisible();await expect(page.locator('[data-sk-region="subject-form-prerequisites"]')).toHaveAttribute('data-sk-phase','revealed');await assertNoDataSpinner(page);await expect(page.locator('main [data-sk-primitive]')).toHaveCount(0);
     |                                                                                                                                                                   ^ Error: expect(locator).toBeVisible() failed
  16 |  expect(await page.locator('main [role=status]').evaluate(element=>{const style=getComputedStyle(element);return {width:style.width,height:style.height,clip:style.clipPath};})).toEqual({width:'1px',height:'1px',clip:'inset(50%)'});
  17 |  const boxes=()=>page.locator('main h1, main input, main select').evaluateAll(elements=>elements.map(element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};}));const before=await boxes();fs.mkdirSync('loading-screenshots',{recursive:true});const prefix=`loading-screenshots/admin-add-subject-${width}-${dark?'dark':'light'}`;await page.screenshot({path:prefix+'-skeleton.png',fullPage:true});release();await expect(page.locator('main select')).toBeEnabled();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);expect(await boxes()).toEqual(before);await page.screenshot({path:prefix+'-loaded.png',fullPage:true});
  18 | });
  19 | for(const kind of ['year','grade','catalog'])test(`add subject ${kind} failure exposes retry and preserves local input`,async({page})=>{
  20 |  const release=await fixture(page,false);release.fail(kind);await page.goto('/admin/subjects/new');await expect(page.locator('main')).toBeVisible();await expect(page.locator('[data-route-skeleton]')).toHaveCount(0);release();await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('main [data-sk-primitive]')).toHaveCount(0);release.recover();await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);await page.locator('main select').selectOption('Grade 1');await page.getByPlaceholder('e.g. Filipino, MAPEH').fill('Language Arts');await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('button',{name:'Non-graded',exact:true})).toBeVisible();
  21 | });
  22 | test('non-graded subject retains its original endpoint and creation payload',async({page})=>{
  23 |  const release=await fixture(page,false);let payload:unknown;await page.route('**/api/subject/addSubject',async route=>{payload=route.request().postDataJSON();await route.fulfill({json:{success:true,data:{id:12}}});});await page.goto('/admin/subjects/new');await expect(page.locator('main')).toBeVisible();await expect(page.locator('[data-route-skeleton]')).toHaveCount(0);release();await expect(page.locator('main select')).toBeEnabled();await page.locator('main select').selectOption('Grade 1');await page.getByPlaceholder('e.g. Filipino, MAPEH').fill('Language Arts');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Non-graded',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:/Add Subject/}).click();await expect.poll(()=>payload).toEqual({gradeLevelId:1,subjectName:'Language Arts',isGraded:false,schoolYear:'2026–2027',weightDistribution:[]});
  24 | });
  25 | 
```