import { expect, type Page } from '@playwright/test';
import { requestLedger } from './requestLedger';
export const parentPaths = {
  children:'/api/linkedChildren/',daily:'/api/parent-dashboard/parent',year:'/api/sy_term',
  academic:'/api/termPerformanceProgress/101/term-performance',visibility:'/api/termPerformanceProgress/101/visibility',
  holistic:'/api/termHolisticProgress/101',attendance:'/api/attendanceSummary/summary/101',
  monthly:'/api/attendance',profile:'/api/studentProfile/101',schedule:'/api/classSchedule/101',
  missed:'/api/missedActivities/101',flags:'/api/lowGradeTopics/101',weekly:'/api/weeklyHolisticEvaluation/students/101',
  activities:'/api/calendar/activities',holidays:'/api/calendar/holidays',allActivities:'/api/calendar/all-activities',allHolidays:'/api/calendar/all-holidays',
};
export type ParentResource=keyof typeof parentPaths;
export const parentResources=Object.keys(parentPaths) as ParentResource[];
export async function mockParent(page:Page,dark=false,holdAuth=false) {
  await page.addInitScript(dark=>localStorage.setItem('qed.settings',JSON.stringify({darkMode:dark})),dark);
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('**/socket.io/**',r=>r.abort());
  let unlockAuth=()=>{};const authGate=holdAuth?new Promise<void>(resolve=>{unlockAuth=resolve;}):Promise.resolve();
  const state={account:801,year:7,empty:false,locked:false,linked:false,notificationRead:false,writeStatus:200,writeGate:Promise.resolve(),releaseWrite:()=>{},writes:[] as {path:string;method:string;payload:unknown}[]};
  const resources=Object.fromEntries(parentResources.map(r=>[r,{status:200,calls:0,body:undefined as unknown,gate:Promise.resolve(),release:()=>{}}])) as Record<ParentResource,{status:number;calls:number;body:unknown;gate:Promise<void>;release:()=>void}>;
  const requests:{path:string;params:Record<string,string>;account:number;year:number}[]=[];
  const ledger=requestLedger(page,path=>path.startsWith('/api/')&&!/auth|user-profile|notification/.test(path));
  const notificationLedger=requestLedger(page,path=>path.startsWith('/api/notification/'));
  function user(){return{id:String(state.account),role:'PARENT',user_name:'synthetic_parent',userName:'synthetic_parent',name:'Synthetic Parent '+state.account,email:'parent@example.invalid'};}
  const child=(id:number)=>({id,student_number:'S'+id,first_name:'Synthetic',last_name:'Child'+id,gender:'Female',grade_level:'Grade 1',section_name:'Maroon',adviser_name:'Teacher One',overall_score:88,performance_status:'good'});
  function body(resource:ParentResource,id:number,account:number,year:number):unknown {
    const domains={cognitive:4,emotional:3,social:4,behavioral:3};
    const terms=[1,2,3].map(termNumber=>({key:'T'+termNumber,label:'Term '+termNumber,termNumber,released:!state.locked,average:88+termNumber-1,subjects:state.empty?[]:[{subject:'Mathematics '+id,grade:88+termNumber-1},{subject:'English '+id,grade:85+termNumber-1}]}));
    const date=new Date().toISOString().slice(0,7)+'-12';
    if(resource==='children')return {success:true,students:state.empty?[]:(account===801?(state.linked?[101,102,103]:[101,102]):[201]).map(child)};
    if(resource==='daily')return state.empty?[]:[{id:'daily'+account,studentId:String(account===801?101:201),studentName:'Synthetic Child'+(account===801?101:201),time:'8:00 AM',message:'Synthetic attendance update'}];
    if(resource==='year')return {success:true,data:{school_year_id:year,term1_start:'2026-09-01',last_term_end:'2027-03-31',months:[{month:9,year:2026},{month:10,year:2026},{month:1,year:2027}]}};
    if(resource==='academic')return {success:true,meta:{learner:'Synthetic Child'+id,gradeSection:'Grade 1 Maroon',classAdviser:'Teacher One',schoolYear:String(year)},data:state.empty?[]:terms};
    if(resource==='visibility')return {success:true,data:[1,2,3].map(termNumber=>({termNumber,termLabel:'Term '+termNumber,gradingPeriodId:termNumber,isVisible:!state.locked,termEnded:!state.locked,available:!state.locked}))};
    if(resource==='holistic')return {success:true,data:state.empty?[]:[{termNumber:1,termLabel:'Term 1',domainAverages:domains,evaluationCount:3,riskLevel:'NONE'}]};
    if(resource==='attendance')return {student:{id,firstName:'Synthetic',lastName:'Child'+id},gradingPeriods:state.empty?[]:[1,2,3].map(termNumber=>({termNumber,gradingPeriodId:termNumber,termLabel:'Term '+termNumber,startDate:'2026-09-01',endDate:'2027-03-31',isActive:termNumber===1,months:[{monthKey:'2026-10',monthLabel:'October 2026',present:18,absent:1,tardiness:1,excused:0,totalDays:20}],totals:{present:18,absent:1,tardiness:1,excused:0,totalDays:20}}))};
    if(resource==='monthly')return {success:true,data:{student:{id,student_number:'S'+id,full_name:'Synthetic Child'+id,grade_level_id:1,section_id:11},month:10,year:2026,school_days:20,status_summary:{present:18,absent:1,late:1,excused:0},total_records:20}};
    if(resource==='profile')return {id:String(id),firstName:'Synthetic',lastName:'Child'+id,studentId:'S'+id,lrn:'SYNTHETIC-'+id,gender:'Female',gradeLevel:'Grade 1',section:'Maroon',status:'Active',personalInformation:{dateOfBirth:'2018-01-01',residentialAddress:'Synthetic address '+id,currentClass:'Grade 1 - Maroon'}};
    if(resource==='schedule')return state.empty?[]:[{id:'1',subject:'Mathematics '+id,teacher:'Teacher One',startTime:'8:00 AM',endTime:'9:00 AM',days:['Mon','Wed']}];
    if(resource==='missed')return {missedActivities:state.empty?[]:[{item_id:1,item_date:'2026-10-01',topic:'Synthetic fractions '+id,activity_name:'Worksheet',tab:'writtenWorks',max_items:20,subject_name:'Mathematics',score:null}]};
    if(resource==='flags')return {lowGradeTopics:state.empty?[]:[{topic_id:1,topic_name:'Synthetic fractions '+id,subject_name:'Mathematics',average_percent:60,items_scored:1,developing_threshold:75,mastery_threshold:85}]};
    if(resource==='weekly')return {success:true,data:{current:{domainAverages:domains,evaluationCount:3,lastEvaluation:null,riskLevel:'NONE'},history:[],subjects:state.empty?[]:[{subjectSectionId:1,subjectName:'Mathematics '+id,current:{domainAverages:domains,evaluationCount:3,lastEvaluation:null}}]}};
    return {success:true,data:state.empty?[]:[{id:1,title:'Synthetic calendar '+account,date}]};
  }
  await page.route('**/api/**',async route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname;
    if(path==='/api/auth/me'){await authGate;return route.fulfill({json:{user:user()}});}
    if(path.includes('user-profile'))return route.fulfill({json:user()});
    if(path==='/api/auth/login'){state.account=802;return route.fulfill({json:{user:user()}});}
    if(path==='/api/auth/logout')return route.fulfill({json:{success:true}});
    if(path.startsWith('/api/notification/')){
      if(request.method()==='GET'){notificationLedger.intercept(request);return route.fulfill({json:{success:true,data:[{id:state.account,user_id:state.account,title:'Synthetic notice '+state.account,message:'Synthetic',type:'info',is_read:state.notificationRead,created_at:new Date().toISOString()}]}});}
      state.writes.push({path,method:request.method(),payload:null});const status=state.writeStatus;await state.writeGate;if(status===200)state.notificationRead=true;
      return route.fulfill({status,json:{success:status===200,message:'Synthetic notification write '+status}});
    }
    if(path.startsWith('/api/linkedChildren')&&request.method()==='POST'){
      state.writes.push({path,method:request.method(),payload:request.postDataJSON()});const status=state.writeStatus;await state.writeGate;
      if(path.endsWith('/confirm')&&status===200)state.linked=true;
      return route.fulfill({status,json:{success:status===200,message:status===200?'Information Matched!':'No information matched',student:status===200?child(103):undefined}});
    }
    const normalized=path.replace(/\/(?:102|201)(?=\/|$)/g,'/101');
    const resource=parentResources.find(r=>parentPaths[r]===normalized || r==='children'&&path==='/api/linkedChildren');
    if(!resource)return route.fulfill({json:{success:true,data:[]}});
    const match=path.match(/\/(101|102|201)(?:\/|$)/),id=Number(url.searchParams.get('student_id')??match?.[1]??101),account=state.account,year=state.year;
    const r=resources[resource],status=r.status,payload=r.body??body(resource,id,account,year);r.calls++;ledger.intercept(request);requests.push({path,params:Object.fromEntries(url.searchParams),account,year});await r.gate;
    return route.fulfill({status,json:status===200?payload:{success:false,message:`Synthetic ${resource} ${status}`}});
  });
  return {state,resources,ledger,notificationLedger,requests,releaseAuth:()=>unlockAuth(),
    hold(r:ParentResource){resources[r].gate=new Promise<void>(resolve=>{resources[r].release=resolve;});},
    release(r:ParentResource){resources[r].release();resources[r].gate=Promise.resolve();},
    async settled(){await expect.poll(()=>ledger.snapshot().every(r=>r.terminal!==undefined)).toBe(true);},
  };
}
