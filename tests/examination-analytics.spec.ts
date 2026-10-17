import { test, expect } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { mockAnalytics } from './fixtures/analytics';
for (const width of [375,1280]) for (const dark of [false,true]) test(`examination statistics ${width} ${dark}: filters, views, empty and error`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});
 const release=await mockDirectory(page,'PRINCIPAL',dark);release();await mockAnalytics(page);
 const requests: URL[]=[];
 let failed=false;
 await page.route('**/api/reports/examination-performance?**',async route=>{
  const url=new URL(route.request().url());requests.push(url);
  if(failed) return route.fulfill({status:500,json:{success:false}});
  const empty=url.searchParams.get('examination')==='TE';
  const data={schoolYear:'1',summary:{count:empty?0:2,students:empty?0:2,mean:empty?null:85,sd:empty?null:5},
   rows:empty?[]:[{subjectId:1,subject:'Mathematics',examination:url.searchParams.get('examination'),students:2,count:2,mean:85,sd:5}],
   distribution:Array.from({length:10},(_,i)=>({interval:i===9?'90–100%':`${i*10}–<${(i+1)*10}%`,count:empty?0:i>=8?1:0})),
   options:{years:[{id:'1',label:'2026–2027'},{id:'2',label:'2025–2026'}],terms:['Term 1','Term 2'],sections:[{id:'3',label:'Section A'}],subjects:[{id:'4',label:'Mathematics'}]}};
  await route.fulfill({json:{success:true,data}});
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/principal/reports');
 await expect(page.locator('[data-sk-region="report-metric-value-1"]')).toHaveText('88%');
 await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
 const panel=page.getByRole('region',{name:'Examination performance',exact:true});
 await expect(panel.getByText('85.00',{exact:true})).toHaveCount(2);
 await expect(panel.getByText('5.00',{exact:true})).toHaveCount(2);
 await expect(panel.locator('svg.recharts-surface')).toBeVisible();
 await panel.getByLabel('School Year',{exact:true}).selectOption('2');
 await panel.getByLabel('Examination Term',{exact:true}).selectOption('Term 2');
 await panel.getByLabel('Grade Level',{exact:true}).selectOption('Grade 1');
 await panel.getByLabel('Section',{exact:true}).selectOption('3');
 await panel.getByLabel('Subject',{exact:true}).selectOption('4');
 await panel.getByLabel('Examination',{exact:true}).selectOption('ST2');
 await expect.poll(()=>requests.at(-1)?.searchParams.get('examination')).toBe('ST2');
 for(const [key,value] of Object.entries({schoolYear:'2',term:'Term 2',grade:'Grade 1',section:'3',subject:'4'})) expect(requests.at(-1)?.searchParams.get(key)).toBe(value);
 await expect(panel.getByRole('cell',{name:'ST2',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await panel.screenshot({path:info.outputPath('examination-results.png')});
 await panel.getByLabel('Examination',{exact:true}).selectOption('TE');
 await expect(panel.getByText('No valid examination scores for these filters.')).toBeVisible();
 await expect(panel.locator('table')).toHaveCount(0);
 failed=true;await panel.getByLabel('Examination Term',{exact:true}).selectOption('Term 1');
 await expect(panel.getByRole('alert')).toContainText('500');
 expect(errors).toEqual([]);
});


