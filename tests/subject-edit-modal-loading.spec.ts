import { waitForDataRoute } from "./fixtures/routeReady";
import {test,expect} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {assertNoDataSpinner} from './design-pixels';
import {DEFAULT_ASSESSMENT_TYPES} from '../src/features/profiles/admin/pages/subjects/types/assessmentTypes';

for(const width of [375,1280])for(const dark of [false,true])test(`edit subject template ${width} ${dark?'dark':'light'} settles errors and retries`,async({page})=>{
  await page.setViewportSize({width,height:1100});const release=await mockDirectory(page,'ADMIN',dark);release();
  await page.route('**/api/subject/getSubjectSectionsByGrade/**',async route=>{
    const grade=Number(new URL(route.request().url()).pathname.split('/').at(-1));
    await route.fulfill({json:{success:true,data:grade===1?[{id:101,subject_id:1,subject_name:'Mathematics',grade_level_id:1,section_name:'Maroon',is_graded:1,teacher_id:null,school_year:'2026–2027',status:'Active',weightDistribution:[]}]:[]}});
  });
  await page.route('**/api/subject/getAssessmentTypes',route=>route.fulfill({json:{success:true,data:DEFAULT_ASSESSMENT_TYPES.map((type,index)=>({id:index+1,assessmentName:type.name}))}}));
  await page.route('**/api/academic-year/getAllSy',route=>route.fulfill({json:{success:true,data:[{id:1,school_year:'2026–2027'}]}}));
  let finish!:()=>void;const gate=new Promise<void>(r=>finish=r);let failed=true,requests=0;
  await page.route('**/getActiveGradeTemplate/*',async route=>{requests++;await gate;await route.fulfill({status:failed?500:200,json:failed?{success:false,message:'Template unavailable'}:{success:true,data:null}});});
  await page.goto('/admin/subjects');await waitForDataRoute(page);await page.getByRole('button',{name:'Edit',exact:true}).first().click();
  const region=page.locator('[data-sk-region="edit-subject-template"]');await expect(region).toHaveAttribute('data-sk-phase','revealed');await assertNoDataSpinner(page);
  finish();await expect(region.getByRole('alert')).toBeVisible();await expect(region.locator('[data-sk-primitive]')).toHaveCount(0);
  const beforeRetry=requests;expect(beforeRetry).toBeGreaterThan(0);failed=false;await region.getByRole('button',{name:'Retry',exact:true}).click();await expect(region).toHaveAttribute('data-sk-phase','settled');await expect(region.getByRole('alert')).toHaveCount(0);expect(requests).toBe(beforeRetry+1);
});
