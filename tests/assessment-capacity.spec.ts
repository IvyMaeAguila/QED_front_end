import {test,expect} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {assessmentCapacity} from '../src/features/profiles/teacher/pages/subjects/detail/assessmentCapacity';
test('template capacity is term-specific and flat groups do not require domain IDs',()=>{
 const items=Array.from({length:6},(_,i)=>({id:String(i),tab:'writtenWorks' as const,gradingPeriodId:i===5?'2':'1',date:'2026-10-29',activityName:'Item',topic:'Topic',format:'Quiz',maxItems:10}));
 const domains=[{id:'flat',label:'',weightPercent:20,scoreColumns:[1,2,3,4,5]}];
 expect(assessmentCapacity(items,'writtenWorks','1',domains)[0]).toMatchObject({used:5,full:true});
 expect(assessmentCapacity(items.slice(1),'writtenWorks','1',domains)[0].full).toBe(false);
 const split=[{id:'c',label:'Cognitive',weightPercent:10,scoreColumns:[1,2,3,4,5]},{id:'a',label:'Affective',weightPercent:10,scoreColumns:[6,7,8,9,10]}];
 expect(assessmentCapacity(items.map(i=>({...i,templateDomainId:'c'})),'writtenWorks','1',split).map(d=>d.full)).toEqual([true,false]);
});
test('full flat category locks Add Item and explains why on hover',async({page})=>{
 const release=await mockTeacher(page,false);release();const items=Array.from({length:5},(_,i)=>({id:String(i),tab:'writtenWorks',gradingPeriodId:'1',date:'2026-10-29',activityName:'Item',topic:'Topic',format:'Quiz',maxItems:10}));
 await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/,async route=>{
 const path=new URL(route.request().url()).pathname;const data=path.endsWith('/gradingPeriods')?[{id:'1',schoolYearId:'1',termNumber:1,termLabel:'Term 1',isActive:true}]:path.includes('getEffectiveWeights')?{source:'template',ww:20,pt:50,exam:30,templateStructure:{ww:{key:'writtenWorks',weightPercent:20,domains:[{id:'flat',label:'',weightPercent:20,scoreColumns:[1,2,3,4,5]}]},pt:{key:'performanceTask',weightPercent:50,domains:[]},examWeightPercent:30,transmutationTable:[],descriptorTable:[]}}:path.endsWith('/items')?items:path.endsWith('/scores')?{'1':Object.fromEntries(items.map(i=>[i.id,10]))}:path.endsWith('/holistic')?{}:{subjectName:'Math',gradeLevel:'Grade 1',roster:[{id:'1',name:'Student One',gender:'M'}],isOwnAdvisory:true};return route.fulfill({json:{success:true,data,weekStartDate:'2026-10-26'}});
 });
 await page.goto('/tests/teacher-readers-query.html?academic');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await page.getByRole('button',{name:'Toggle preview',exact:true}).click();
 const button=page.getByRole('button',{name:'Add item',exact:true});await expect(button).toBeDisabled();await button.locator('..').hover();await expect(page.getByRole('tooltip')).toContainText('all scoring columns');
});
