import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {mockTeacher} from './fixtures/teacher';
const structure=JSON.parse(fs.readFileSync('tests/fixtures/mapeh-structure.json','utf8'));
const bytes=fs.readFileSync('tests/fixtures/mapeh-3term.xlsx');
async function setup(page:import('@playwright/test').Page,existing=false){
 const release=await mockTeacher(page,false);release();const writes:Record<string,unknown>[]=[];
 const items:Record<string,unknown>[]=[];const scores:Record<string,number>={};let id=0;
 if(existing)for(const [c,value] of [['music_arts',80],['pe_health',60]] as const)for(const [tab,examType]of [['writtenWorks',null],['performanceTask',null],['exams','ST1'],['exams','ST2'],['exams','TE']]){items.push({id:String(++id),tab,examType,templateDomainId:tab==='exams'?c:c+'__default',maxItems:100,date:'2026-10-01',gradingPeriodId:'1',activityName:c+' '+tab});scores[String(id)]=value;}
 await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/,async route=>{
  const path=new URL(route.request().url()).pathname;
  if(route.request().method()!=='GET'){const body=route.request().postDataJSON();writes.push(body);return route.fulfill({json:{success:true,id:'new-item'}});}
  const data=path.endsWith('/gradingPeriods')?[{id:'1',schoolYearId:'1',termNumber:1,termLabel:'Term 1',isActive:true}]:path.includes('getEffectiveWeights')?{source:'template',ww:20,pt:60,exam:20,examinations:structure.examinations,templateStructure:structure}:path.endsWith('/items')?items:path.endsWith('/scores')?{'1':scores}:path.endsWith('/holistic')?{}:{isGraded:true,subjectName:'MAPEH',gradeLevel:'Grade 2',roster:[{id:'1',name:'Student One',gender:'M'}],isOwnAdvisory:true};
  return route.fulfill({json:{success:true,data}});
 });
 await page.goto('/tests/teacher-readers-query.html?academic');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await page.getByRole('button',{name:'Toggle preview',exact:true}).click();
 return writes;
}
test('browser upload parser reads the actual six-sheet MAPEH workbook',async({page})=>{
 await setup(page);
 const result=await page.evaluate(async values=>{const {parseGradeTemplate}=await import('/src/features/profiles/admin/pages/subjects/services/gradeTemplateParser.service.ts');const x=await parseGradeTemplate(new File([new Uint8Array(values)],'mapeh.xlsx'));return x;},Array.from(bytes));
 expect(result.components?.map(c=>c.id)).toEqual(['music_arts','pe_health']);expect(Object.keys(result.termConfigurations??{})).toEqual(['1','2','3']);expect(result.components?.[1].pt.weightPercent).toBe(60);
});
test('teacher chooses PE and Health and records its examination separately',async({page})=>{
 const writes=await setup(page);
 await page.getByRole('combobox',{name:'MAPEH component',exact:true}).selectOption('pe_health');
 await page.getByRole('button',{name:'Exams',exact:true}).click();
 await page.getByRole('button',{name:'Add item',exact:true}).click();
 await page.getByPlaceholder('e.g. 25').fill('25');await page.getByRole('button',{name:'Confirm',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);expect(writes[0]).toMatchObject({tab:'exams',examType:'ST1',templateDomainId:'pe_health'});
 await page.getByRole('combobox',{name:'MAPEH component',exact:true}).selectOption('music_arts');
 await expect(page.getByText('Summative Test 1',{exact:true})).toHaveCount(0);
});
test('records show separate component grades and Final Grades shows the combined MAPEH grade',async({page})=>{
 await setup(page,true);await page.getByRole('button',{name:'Full Records',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'MAPEH component',exact:true})).toHaveValue('music_arts');
 const row=page.locator('[data-sk-region="subject-record-student"]').first();await expect(row).toContainText('83');
 await page.getByRole('combobox',{name:'MAPEH component',exact:true}).selectOption('pe_health');await expect(row).toContainText('72');
 await page.getByRole('button',{name:'Final Grades',exact:true}).click();
 const summary=page.getByRole('region',{name:'Final Grades',exact:true});await expect(summary.locator('tr[data-student-id="1"]')).toContainText('78');
});
