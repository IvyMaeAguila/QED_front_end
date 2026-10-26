import {test,expect} from '@playwright/test';
import {mockAdminDashboard} from './fixtures/adminDashboard';
// Actual existing Admin writer/query/services; all API records are synthetic.
for(const kind of ['create','update'] as const)test(`Admin subject ${kind}: uncertain 503 communicates reconciliation without replay or false cache success`,async({page})=>{
 await mockAdminDashboard(page);const writes:{path:string;payload:unknown}[]=[],message=`Subject ${kind==='create'?'creation':'update'} could not be confirmed. Reload subjects to check stored state before trying again.`;
 await page.route('**/api/subject/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  if(req.method()!=='GET'){writes.push({path,payload:req.postDataJSON()});await route.fulfill({status:503,json:{success:false,outcome:'uncertain',message}});return;}
  await route.fulfill({json:{success:true,data:path.includes('getSubjectSections')?[{id:101,subject_id:1,subject_name:'Mathematics',grade_level_id:1,is_graded:1,section_name:'Maroon',teacher_id:7,school_year:'2026–2027',status:'Active',weightDistribution:[]}]:[]}});
 });
 await page.goto('/tests/admin-remaining-subjects.html');await expect(page.getByTestId('auth')).toHaveText('ADMIN:1');await page.getByRole('button',{name:'Preview',exact:true}).click();
 await page.getByRole('button',{name:'Load subjects',exact:true}).click();await expect(page.getByTestId('subjects')).toContainText('Mathematics');
 await page.getByRole('button',{name:kind==='create'?'Create subject':'Update subject',exact:true}).click();await expect(page.getByTestId('result')).toHaveText(message);
 expect(writes).toEqual([{path:kind==='create'?'/api/subject/addSubject':'/api/subject/updateSubjectSection/101',payload:kind==='create'?{gradeLevelId:1,isGraded:false,subjectName:'Arts',schoolYear:'2026–2027',weightDistribution:[]}:{isGraded:true,weightDistribution:[{assessment_type_id:1,weight_percent:30,order_index:0}],subjectName:'Math',gradeLevelId:1,sectionName:'Maroon',teacherId:'7',schoolYear:'2026–2027'}}]);
 await page.getByRole('button',{name:'Cache',exact:true}).click();expect(JSON.parse(await page.getByTestId('cache').innerText()).filter((q:{invalidated:boolean})=>q.invalidated)).toEqual([]);
 await page.getByRole('button',{name:'Mount',exact:true}).click();await page.getByRole('button',{name:'Mount',exact:true}).click();await page.getByRole('button',{name:'Load subjects',exact:true}).click();await expect(page.getByTestId('subjects')).toContainText('Mathematics');
 expect(writes).toHaveLength(1);await expect(page.getByTestId('result')).toHaveText(message);
});
