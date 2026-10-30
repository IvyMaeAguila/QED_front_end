import {test,expect} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
for (const isGraded of [false,true]) test(`subject grading mode: ${isGraded}`,async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-29T04:00:00Z'));
 const release=await mockTeacher(page,false);release();const assessments:string[]=[];let writes=0;
 await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/,async route=>{
  const path=new URL(route.request().url()).pathname;
  if(route.request().method()!=='GET'){writes++;return route.fulfill({json:{success:true}});}
  if(/items|scores|getEffectiveWeights/.test(path))assessments.push(path);
  const data=path.endsWith('/gradingPeriods')?[{id:'1',schoolYearId:'1',termNumber:1,termLabel:'Term 1',isActive:true}]:path.includes('getEffectiveWeights')?{source:'manual',ww:30,pt:50,exam:20}:path.endsWith('/items')?[]:path.endsWith('/scores')||path.endsWith('/holistic')?{}:{isGraded,subjectName:'Math',gradeLevel:'Grade 1',roster:[{id:'1',name:'Student One',gender:'M'}],isOwnAdvisory:true,adviserName:'Teacher'};
  return route.fulfill({json:{success:true,data,weekStartDate:'2026-10-26'}});
 });
 await page.goto('/tests/teacher-readers-query.html?academic');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await page.getByRole('button',{name:'Toggle preview',exact:true}).click();
 await expect(page.getByRole('button',{name:'Holistic',exact:true})).toBeVisible();
 for(const name of ['Written Works','Performance Task','Exams']) await expect(page.getByRole('button',{name,exact:true})).toHaveCount(isGraded?1:0);
 if(isGraded) await page.getByRole('button',{name:'Holistic',exact:true}).click();
 await page.getByRole('button',{name:'Rate Student One Excellent for Cognitive',exact:true}).click();
 await expect(page.getByText('Holistic ratings saved.',{exact:true})).toBeVisible();expect(writes).toBe(1);
 if(!isGraded)expect(assessments).toEqual([]);
});
