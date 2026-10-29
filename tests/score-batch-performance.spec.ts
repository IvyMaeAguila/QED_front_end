import {test,expect} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
test('class save uses one atomic batch and Full Records confirms edits by toast',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));const release=await mockTeacher(page,false);release();
 const scores:Record<string,Record<string,number>>={},writes:string[]=[];let failSecond=true;
 await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/,async route=>{
  const path=new URL(route.request().url()).pathname;
  if(route.request().method()!=='GET'){
   const body=route.request().postDataJSON();
   if(body.edits){expect(path).toContain('/scores/batch');writes.push('batch');
    if(failSecond){failSecond=false;return route.fulfill({status:500,json:{success:false,outcome:'not_saved',message:'Temporary save failure'}});}
    for(const edit of body.edits)scores[edit.studentId]={item1:edit.value};
   }else{writes.push(body.studentId);scores[body.studentId]={item1:body.value};}
   return route.fulfill({json:{success:true}});
  }
  const data=path.endsWith('/gradingPeriods')?[{id:'1',schoolYearId:'1',termNumber:1,termLabel:'Term 1',isActive:true}]:path.includes('getEffectiveWeights')?{source:'manual',ww:30,pt:50,exam:20}:path.endsWith('/items')?[{id:'item1',tab:'writtenWorks',date:'2026-10-09',activityName:'Practice',topic:'Numbers',format:'Quiz',maxItems:20,gradingPeriodId:'1'}]:path.endsWith('/scores')?scores:path.endsWith('/holistic')?{}:{subjectName:'Math',gradeLevel:'Grade 1',roster:[{id:'1',name:'Student One',gender:'M'},{id:'2',name:'Student Two',gender:'F'}],isOwnAdvisory:true,adviserName:'Teacher'};
  return route.fulfill({json:{success:true,data,weekStartDate:'2026-10-05'}});
 });
 await page.goto('/tests/teacher-readers-query.html?academic');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await page.getByRole('button',{name:'Toggle preview',exact:true}).click();
 const one=page.getByRole('spinbutton',{name:'Student One score for Practice, out of 20',exact:true}),two=page.getByRole('spinbutton',{name:'Student Two score for Practice, out of 20',exact:true});
 await one.fill('17');await two.fill('18');await page.getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByText('Could not save scores. Please try again.',{exact:true})).toBeVisible();await expect(one).toHaveValue('17');await expect(two).toHaveValue('18');expect(writes).toEqual(['batch']);
 await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByText('Grades saved to Records.',{exact:true})).toBeVisible();expect(writes).toEqual(['batch','batch']);await expect(page.getByText('No items yet — tap Add Item',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Full Records',exact:true}).click();await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase','settled');
 await page.getByRole('button',{name:'Edit Records',exact:true}).click();await page.getByRole('spinbutton').first().fill('19');
 await expect(page.getByText('Score changes saved.',{exact:true})).toBeVisible();await expect(page.getByText('All changes saved.',{exact:true})).toHaveCount(0);
});
