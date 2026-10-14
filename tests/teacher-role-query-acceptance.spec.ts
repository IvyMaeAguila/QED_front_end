import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';
// Mocked APIs, real application routes. Also runs against fresh dist on 5193.
const modules={
 subject:{url:'/teacher/subjects/1',region:'assessment-roster',count:6,age:301_000,prerequisite:'/api/gradingPeriods'},
 grades:{url:'/teacher/grades',region:'teacher-grades-table:table-body',count:5,age:31_000,prerequisite:'/api/advisoryGrading/sections'},
 attendance:{url:'/teacher/attendance',region:'today-attendance-roster',count:2,age:31_000,prerequisite:'/api/teacherAttendance/advisory-sections'},
 holistic:{url:'/teacher/holistic',region:'holistic-overview-roster',count:3,age:31_000,prerequisite:'/api/gradingPeriods'},
} as const;
type Module=keyof typeof modules;
async function fixture(page:Page,module:Module){
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));const release=await mockTeacher(page,false);release();
 const owns=(path:string)=>module==='subject'?path.startsWith('/api/teacherGrading/')||path.startsWith('/api/subject/getEffectiveWeights/')||path==='/api/gradingPeriods':module==='grades'?path.startsWith('/api/advisoryGrading/')||path==='/api/gradingPeriods':module==='attendance'?path.startsWith('/api/teacherAttendance/'):path.startsWith('/api/teacherHolistic/')||path==='/api/gradingPeriods'||path==='/api/teacherAttendance/advisory-sections';
 const ledger=requestLedger(page,owns);const statuses=new Map<string,number>();let held='',unlock:(()=>void)|undefined,gate:Promise<void>|undefined;
 const roster=[{id:'1',name:'Synthetic Learner',gender:'F'}];
 const periods=[1,2].map(id=>({id:String(id),schoolYearId:'7',termNumber:id,termLabel:`Term ${id}`,label:`Term ${id}`,startDate:'2026-01-01',endDate:'2026-12-31',isActive:id===1}));
 await page.route('**/api/student/allStudents',r=>r.fulfill({json:{data:[{id:1,student_number:'S1',first_name:'Learner',last_name:'Synthetic',middle_name:'',gender:'Female',grade_level_id:1,grade_level_name:'Grade 1',section_id:11,section_name:'Maroon'}]}}));
 await page.route(/\/api\/(gradingPeriods|teacherGrading|subject\/getEffectiveWeights|teacherAttendance|teacherHolistic|advisoryGrading)/,async r=>{
  const path=new URL(r.request().url()).pathname;ledger.intercept(r.request());const status=statuses.get(path)??200;if(path===held)await gate;
  let data:unknown=[];
  if(path==='/api/gradingPeriods')data=periods;
  else if(path==='/api/teacherAttendance/advisory-sections'){await r.fulfill({status,json:status===200?[{classId:'1',sectionId:'11',sectionName:'Maroon',gradeLevel:'Grade 1',roster,terms:periods}]:{message:'Synthetic failure'}});return;}
  else if(path==='/api/teacherAttendance/1'){await r.fulfill({status,json:status===200?{data:{}}:{message:'Synthetic failure'}});return;}
  else if(path==='/api/teacherGrading/1')data={subjectName:'Mathematics',gradeLevel:'Grade 1',roster,isOwnAdvisory:true,adviserName:'Synthetic Teacher'};
  else if(path.startsWith('/api/subject/getEffectiveWeights/'))data={source:'manual',ww:30,pt:50,exam:20};
  else if(path.endsWith('/scores')||path.endsWith('/holistic'))data={};
  else if(path==='/api/advisoryGrading/sections')data=[{classId:'1',sectionName:'Maroon',gradeLevel:'Grade 1'}];
  else if(path==='/api/advisoryGrading/gradebook')data={sectionName:'Maroon',gradeLevel:'Grade 1',subjects:[{subjectSectionId:'1',subjectId:1,subjectName:'Math',submitted:true,isOwnAdvisory:true}],students:[{studentId:'1',firstName:'Learner',lastName:'Synthetic',middleName:null,gender:'F',grades:{'1':{status:'submitted',termGrade:90,average:90}},overallAverage:90}]};
  else if(path==='/api/advisoryGrading/submission')data={submitted:false,submittedAt:null};
  else if(path==='/api/teacherHolistic/overview')data=[{studentId:'1',studentName:'Synthetic Learner',isAdvisory:true,subjects:[],overall:{weeksCount:0,weeklyScores:[],pastAverage:null,recentAverage:null,currentWeekAverage:null,trend:'No Data'}}];
  await r.fulfill({status,json:status===200?{success:true,data,weekStartDate:'2026-10-05'}:{success:false,message:'Synthetic failure'}});
 });
 return {ledger,status:(path:string,code:number)=>statuses.set(path,code),hold:(path:string)=>{held=path;gate=new Promise(r=>{unlock=r;});},release:()=>{unlock?.();held='';gate=undefined;}};
}
async function ready(page:Page,module:Module){await expect(page.locator(`[data-sk-region="${modules[module].region}"]`)).toHaveAttribute('data-sk-phase','settled');}
async function leave(page:Page){await page.getByRole('link',{name:'Help & Support',exact:true}).click();await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();}
for(const module of Object.keys(modules) as Module[])test(`Teacher ${module}: production-capable fresh reuse and exact stale request counts`,async({page},info)=>{
 const f=await fixture(page,module);await page.clock.install();await page.goto(modules[module].url);await ready(page,module);await f.ledger.successfulBatch(0,modules[module].count);const mark=f.ledger.mark();await leave(page);await page.goBack();await ready(page,module);expect(f.ledger.snapshot(mark)).toEqual([]);await leave(page);await page.clock.fastForward(modules[module].age);await page.goBack();await ready(page,module);await f.ledger.successfulBatch(mark,modules[module].count);await info.attach('sanitized-request-lifecycle',{body:JSON.stringify(f.ledger.snapshot()),contentType:'application/json'});
});
for(const module of Object.keys(modules) as Module[])test(`Teacher ${module}: offline prerequisite recovery resumes exactly once`,async({page,context})=>{
 const f=await fixture(page,module);f.hold(modules[module].prerequisite);await page.goto(modules[module].url);await expect.poll(()=>f.ledger.snapshot().filter(r=>r.path===modules[module].prerequisite&&r.intercepted&&!r.terminal).length).toBe(1);await context.setOffline(true);f.release();await expect(page.getByRole('alert').first()).toContainText("You're offline");await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);await context.setOffline(false);await ready(page,module);await f.ledger.successfulBatch(0,modules[module].count);
});
test('Teacher subject: independent score401 expires session even when another reader fails500',async({page})=>{
 const f=await fixture(page,'subject');f.status('/api/teacherGrading/1/scores',401);f.status('/api/teacherGrading/1/holistic',500);await page.goto(modules.subject.url);await expect(page).toHaveURL(/\/login/);await expect(page.locator('[data-sk-region="assessment-student-row"]')).toHaveCount(0);
});
test('Teacher grades:403 removes cached grades and retains authenticated route',async({page})=>{
 const f=await fixture(page,'grades');await page.clock.install();await page.goto(modules.grades.url);await ready(page,'grades');await expect(page.getByText('90',{exact:true}).first()).toBeVisible();await f.ledger.successfulBatch(0,5);f.status('/api/advisoryGrading/gradebook',403);await leave(page);await page.clock.fastForward(31_000);await page.goBack();await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByText('90',{exact:true})).toHaveCount(0);await expect(page).toHaveURL(/\/teacher\/grades$/);
});
