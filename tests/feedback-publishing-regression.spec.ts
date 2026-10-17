import { waitForDataRoute } from "./fixtures/routeReady";
import { refetchGate, measureFastRefetch } from './fixtures/refetch';
import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {assertNoDataSpinner,captureFixedOverlay} from './design-pixels';
import fs from 'node:fs';
async function fixture(page:Page,dark=false,count=3,long=false){const context=await mockDirectory(page,'TEACHER',dark);let finish!:()=>void;const gate=new Promise<void>(r=>{finish=r;});let failed='';const refetch=refetchGate();const name=long?'Maria Alexandra Isabella '.repeat(7):'Ana';const subjects=[{subjectSectionId:'1',subjectId:1,subjectName:long?'Mathematics and quantitative reasoning '.repeat(5):'Mathematics',submitted:true,isOwnAdvisory:true},{subjectSectionId:'2',subjectId:2,subjectName:'Reading',submitted:true,isOwnAdvisory:true}];const students=Array.from({length:count},(_,i)=>({studentId:String(i+1),firstName:name,lastName:'Cruz'+i,middleName:null,gender:i%2?'F':'M',grades:{'1':{status:'submitted',termGrade:90,average:90,isOwnAdvisory:true},'2':{status:'submitted',termGrade:88,average:88,isOwnAdvisory:true}},overallAverage:89}));await page.route('**/api/gradingPeriods',async route=>{await gate;await route.fulfill({status:failed==='terms'?500:200,json:failed==='terms'?{success:false,message:'Terms unavailable'}:{success:true,data:[{id:'1',termNumber:1,termLabel:'Term 1',isActive:true},{id:'2',termNumber:2,termLabel:'Term 2',isActive:false}]}});});await page.route('**/api/advisoryGrading/**',async route=>{await gate;const endpoint=new URL(route.request().url()).pathname.split('/').pop();if(endpoint==='gradebook')await refetch.wait();let data:unknown=[];if(endpoint==='sections')data=[{classId:'1',sectionName:'Maroon',gradeLevel:'Grade 1'}];if(endpoint==='gradebook')data={sectionName:'Maroon',gradeLevel:'Grade 1',subjects,students};if(endpoint==='submission')data={submitted:false,submittedAt:null};if(endpoint==='logs')data=[{id:1,type:'advisory',label:'Maroon',submittedByName:'Teacher One',submittedAt:'2026-10-09T08:00:00Z'}];if(endpoint==='visibility')data={students:students.map(s=>({...s,parentName:'Parent One',parentContactNumber:'09123456789',isVisible:true,updatedAt:'2026-10-09T08:00:00Z'}))};await route.fulfill({status:failed===endpoint?500:200,json:failed===endpoint?{success:false,message:'Records unavailable'}:{success:true,data}});});return Object.assign(()=>{context();finish();},{fail:(kind:string)=>{failed=kind;},recover:()=>{failed='';},hold:refetch.hold,releaseData:refetch.release});}

test('parent-report visibility confirms scope; cancel writes nothing and failure stays retryable',async({page})=>{
  const release=await fixture(page);release();let writes=0,fail=true;
  await page.route('**/api/advisoryGrading/visibility**',r=>{
    if(r.request().method()==='GET')return r.fallback();writes++;
    return r.fulfill({status:fail?500:200,json:fail?{success:false,message:'Visibility rejected'}:{success:true,data:{updatedCount:3}}});
  });
  await page.goto('/teacher/grades');await waitForDataRoute(page);
  await page.getByRole('button',{name:'Parent Visibility',exact:true}).click();
  await page.getByRole('button',{name:'Select all students',exact:true}).click();
  await page.getByRole('button',{name:'Show to Parents (3)',exact:true}).click();
  const dialog=page.getByRole('alertdialog',{name:'Show reports to parents?',exact:true});
  await expect(dialog).toContainText('Term 1 reports for 3 selected students');
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();expect(writes).toBe(0);
  await page.getByRole('button',{name:'Show to Parents (3)',exact:true}).click();
  await dialog.getByRole('button',{name:'Show reports',exact:true}).click();
  await expect(dialog.getByRole('alert')).toHaveText('Visibility rejected');expect(writes).toBe(1);
  fail=false;await dialog.getByRole('button',{name:'Show reports',exact:true}).click();
  await expect(dialog).toHaveCount(0);await expect(page.getByText('Term 1 reports shown for 3 students.',{exact:true})).toBeVisible();expect(writes).toBe(2);
});
test('complete class grades require confirmation before publishing',async({page})=>{
  const release=await fixture(page);release();let writes=0;
  await page.route('**/api/advisoryGrading/submission**',r=>{if(r.request().method()==='GET')return r.fallback();writes++;return r.fulfill({json:{success:true,data:{}}});});
  await page.goto('/teacher/grades');await waitForDataRoute(page);
  await page.getByRole('button',{name:'Submit Class Grades',exact:true}).click();
  const dialog=page.getByRole('alertdialog',{name:'Submit class grades?',exact:true});
  await expect(dialog).toContainText('3 students');expect(writes).toBe(0);
  await dialog.getByRole('button',{name:'Submit grades',exact:true}).click();
  await expect(dialog).toHaveCount(0);await expect(page.getByText('Class grades submitted.',{exact:true})).toBeVisible();expect(writes).toBe(1);
});
