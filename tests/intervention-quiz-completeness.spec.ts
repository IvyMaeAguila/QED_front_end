import {test,expect,type Page} from '@playwright/test';
import {mockParent} from './fixtures/parent';
import {waitForDataRoute} from './fixtures/routeReady';
async function fixture(page:Page,options:{status?:number;bonus?:boolean;intro?:boolean;remedial?:boolean}={}){
 await page.emulateMedia({reducedMotion:'reduce'});await mockParent(page);await page.addInitScript(intro=>{if(!intro)localStorage.setItem('ed-intro-seen:101:1','1');},options.intro??false);
 let status=options.status??200,remedialStatus=500;const writes:{path:string;body:any}[]=[],reads:string[]=[];
 const questions=Array.from({length:10},(_,i)=>({id:i+1,question_text:`Numbers question ${i+1}?`,choice_a:`Right ${i+1}`,choice_b:`Other B ${i+1}`,choice_c:`Other C ${i+1}`,choice_d:`Other D ${i+1}`,order_index:i}));
 await page.route('**/api/pet/**',async route=>{const req=route.request(),path=new URL(req.url()).pathname;
  if(req.method()==='POST'){
   const body=req.postDataJSON();writes.push({path,body});
   if(path.endsWith('grade-single')){const correct=!(options.remedial&&body.questionId===1&&writes.filter(w=>w.path.endsWith('grade-single')&&w.body.questionId===1).length===1);await route.fulfill({json:{isCorrect:correct,correctAnswer:'A',explanation:'Count the numbers carefully.'}});return;}
   if(body.mode==='remedial'&&remedialStatus!==200){await route.fulfill({status:remedialStatus,json:{message:'Could not verify completion.'}});return;}
   const cleared=body.mode==='remedial'||!options.remedial;await route.fulfill({json:{results:questions.map(q=>({questionId:q.id,selected:'A',correctAnswer:'A',isCorrect:cleared||q.id!==1,explanation:'Count carefully.'})),score:cleared?10:9,totalQuestions:10,fullyCleared:cleared,unlockedNext:cleared?'Medium':null,hungerFilled:cleared?1:0,hungerTotal:5}});return;
  }
  reads.push(path);
  if(path.includes('/intervention/')){await route.fulfill({json:{levels:options.bonus?{easy:'completed',medium:'completed',hard:'completed'}:{easy:'available',medium:'locked',hard:'locked'},bonus:{match:false,memory:false},hungerFilled:options.bonus?3:0,hungerTotal:5,interventionCompleted:false}});return;}
  if(status!==200){await route.fulfill({status,json:{message:'Generated content is incomplete. Retry loading.',...(status===503?{outcome:'uncertain'}:{})}});return;}
  await route.fulfill({json:path.includes('/bonus/')?{match:Array.from({length:5},(_,i)=>({id:i+1,left:`Number ${i+1}`,right:`${i+1} objects`})),memory:Array.from({length:4},(_,i)=>({id:i+1,a:`Number ${i+1}`,b:`${i+1} objects`}))}:{practiceSetId:17,title:'Numbers',difficulty:'Easy',gradeLevel:'Grade 1',questions}});
 });
 await page.goto('/parent/students/101/topics/1/quiz');await waitForDataRoute(page);await expect(page.locator('[data-sk-region="pet-quiz-content"]')).toHaveAttribute('data-sk-phase','settled');
 return {writes,reads,recover:()=>{status=200;},confirmRemedial:()=>{remedialStatus=200;}};
}
for(const status of [500,502,503])test(`quiz generation ${status}: no playable partial content or progress write; explicit retry loads ten questions`,async({page})=>{
 const f=await fixture(page,{status});await page.getByRole('button',{name:'Easy level, available',exact:true}).click();await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();await expect(page.getByText('Numbers question 1?',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Medium level, locked',exact:true})).toBeVisible();expect(f.writes).toEqual([]);expect(f.reads.filter(p=>p.includes('/quiz/'))).toHaveLength(1);
 f.recover();await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByText('Numbers question 1?',{exact:true})).toBeVisible();await expect(page.getByText('Question 1 of 10 · Easy',{exact:true})).toBeVisible();expect(f.reads.filter(p=>p.includes('/quiz/'))).toHaveLength(2);expect(f.writes).toEqual([]);
});
for(const game of ['Match','Memory'])test(`${game} failure cannot complete an empty board; recovery preserves five/four pairs`,async({page})=>{
 const f=await fixture(page,{status:502,bonus:true});await page.getByRole('button',{name:game+' bonus round, available',exact:true}).click();await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();expect(f.writes).toEqual([]);await expect(page.getByRole('button',{name:/^Done/})).toHaveCount(0);
 f.recover();await page.getByRole('button',{name:'Retry',exact:true}).click();if(game==='Memory')await expect(page.getByRole('button',{name:'Hidden card',exact:true})).toHaveCount(8);else for(let i=1;i<=5;i++){await expect(page.getByRole('button',{name:`Number ${i}`,exact:true})).toBeVisible();await expect(page.getByRole('button',{name:`${i} objects`,exact:true})).toBeVisible();}expect(f.writes).toEqual([]);
});
test('failed remedial completion never marks Easy completed or unlocks Medium; retry preserves server progress',async({page})=>{
 test.setTimeout(90000);const f=await fixture(page,{remedial:true});await page.getByRole('button',{name:'Easy level, available',exact:true}).click();
 for(let i=1;i<=10;i++){await page.getByRole('button',{name:new RegExp(`Right ${i}$`)}).click();await page.getByRole('button',{name:i===10?'See Round Results':'Next Question',exact:true}).click();}
 await page.getByRole('button',{name:'Practice Missed Questions',exact:true}).click();await expect(page.getByText('Practice round — just the ones you missed',{exact:true})).toBeVisible();await page.getByRole('button',{name:/Right 1$/}).click();await page.getByRole('button',{name:'See Round Results',exact:true}).click();await expect(page.getByRole('alert')).toHaveText('Could not confirm practice completion. Please retry the activity; your saved progress is retained.');
 await expect(page.getByText('Easy Completed!',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Continue to Medium',exact:true})).toHaveCount(0);expect(f.writes.filter(w=>w.body.mode==='remedial')).toHaveLength(1);expect(f.writes.filter(w=>w.path.includes('/mastery/'))).toEqual([]);
 await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByText('Numbers question 1?',{exact:true})).toBeVisible();expect(f.writes.filter(w=>w.body.mode==='remedial')).toHaveLength(1);expect(f.reads.filter(p=>p.includes('/quiz/'))).toHaveLength(2);
});
test('ED story remains available and does not generate content or completion writes',async({page})=>{const f=await fixture(page,{intro:true});await expect(page.getByText("ED's Story",{exact:true})).toBeVisible();expect(f.writes).toEqual([]);expect(f.reads.filter(p=>p.includes('/quiz/')||p.includes('/bonus/'))).toEqual([]);});
