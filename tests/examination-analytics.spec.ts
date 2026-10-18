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
  const uniform=url.searchParams.get('examination')==='ST2';
  const data={schoolYear:'1',summary:{count:empty?0:2,students:empty?0:2,mean:empty?null:uniform?100:85,sd:empty?null:uniform?0:5},
   rows:empty?[]:[{subjectId:1,subject:'Mathematics',examination:url.searchParams.get('examination'),students:2,count:2,mean:uniform?100:85,sd:uniform?0:5}],
   distribution:Array.from({length:10},(_,i)=>({interval:i===9?'90–100%':`${i*10}–<${(i+1)*10}%`,count:empty?0:uniform?(i===9?2:0):i>=8?1:0})),
   options:{years:[{id:'1',label:'2026–2027'},{id:'2',label:'2025–2026'}],terms:['Term 1','Term 2'],sections:[{id:'3',label:'Section A'}],subjects:[{id:'4',label:'Mathematics'}]}};
  await route.fulfill({json:{success:true,data}});
 });
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/principal/reports');
 await expect(page.locator('[data-sk-region="report-metric-value-1"]')).toHaveText('88%');
 await expect(page.getByRole('region',{name:'Examination performance',exact:true})).toHaveCount(0);
 const tabs=page.getByRole('navigation',{name:'Report type'});
 await expect(tabs.getByRole('link')).toHaveText(['Subject Performance','Examination Performance','Holistic Development']);
 await tabs.getByRole('link',{name:'Examination Performance',exact:true}).click();
 await expect(page).toHaveURL(/examination-performance$/);
 await expect(page.getByRole('heading',{name:'Examination Performance Analytics',exact:true})).toBeVisible();
 await expect(tabs.getByRole('link',{name:'Examination Performance',exact:true})).toHaveAttribute('aria-current','page');
 const panel=page.getByRole('region',{name:'Examination performance',exact:true});
 const highlights=panel.getByRole('region',{name:'Report highlights'});
 for(const label of ['Average Exam Score','Score Variation (SD)','Students Assessed','Results Coverage']) {
  const icon=highlights.getByRole('button',{name:`About ${label}`,exact:true});
  await icon.focus();
  await expect(icon).toHaveAccessibleDescription(/Calculation:/);
  const tooltip=page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  const box=await tooltip.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x+box!.width).toBeLessThanOrEqual(width);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(await tooltip.evaluate(el=>el.parentElement?.tagName)).toBe('BODY');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);
  await icon.click();
  await expect(tooltip).toBeVisible();
  await page.getByRole('heading',{name:'Examination Performance Analytics',exact:true}).click();
  await expect(tooltip).toHaveCount(0);
 }
 await expect(highlights.getByText('Unavailable',{exact:true})).toBeVisible();
 const averageInfo=highlights.getByRole('button',{name:'About Average Exam Score',exact:true});
 await averageInfo.hover();
 await expect(page.getByRole('tooltip')).toContainText('arithmetic mean');
 await page.screenshot({path:info.outputPath('examination-card-tooltip.png')});
 await page.getByRole('heading',{name:'Examination Performance Analytics',exact:true}).hover();
 await expect(page.getByRole('tooltip')).toHaveCount(0);
 await expect(panel.getByText('85.00%',{exact:true})).toHaveCount(2);
 await expect(highlights.getByText('5.00 pp',{exact:true})).toBeVisible();
 await expect(panel.getByText('5.00',{exact:true})).toHaveCount(1);
 await expect(panel.locator('svg.recharts-surface')).toBeVisible();
 const insights=panel.getByRole('region',{name:'Examination Insights',exact:true});
 await expect(insights).toContainText('These recorded scores differ');
 await expect(insights).toContainText('Suggested action');
 await panel.getByRole('button',{name:'About examination score methodology',exact:true}).click();
 await expect(page.getByRole('tooltip')).toContainText('Missing examination items are excluded');
 await page.keyboard.press('Escape');
 await panel.getByLabel('School Year',{exact:true}).selectOption('2');
 await panel.getByLabel('Examination Term',{exact:true}).selectOption('Term 2');
 await panel.getByLabel('Grade Level',{exact:true}).selectOption('Grade 1');
 await panel.getByLabel('Section',{exact:true}).selectOption('3');
 await panel.getByLabel('Subject',{exact:true}).selectOption('4');
 await panel.getByLabel('Examination',{exact:true}).selectOption('ST2');
 await expect.poll(()=>requests.at(-1)?.searchParams.get('examination')).toBe('ST2');
 for(const [key,value] of Object.entries({schoolYear:'2',term:'Term 2',grade:'Grade 1',section:'3',subject:'4'})) expect(requests.at(-1)?.searchParams.get(key)).toBe(value);
 await expect(panel.getByRole('cell',{name:'ST2',exact:true})).toBeVisible();
 await expect(highlights.getByText('100.00%',{exact:true})).toBeVisible();
 await expect(highlights.getByText('0.00 pp',{exact:true})).toBeVisible();
 await expect(insights).toContainText('All 2 recorded ST2 results');
 await expect(insights).not.toContainText('These recorded scores differ');
 await expect(panel.getByText('All recorded examination results fall within the 90–100% range.',{exact:false})).toBeVisible();
 const bars=panel.locator('.recharts-bar-rectangle');
 await bars.last().hover();
 await expect(panel.locator('.recharts-tooltip-wrapper')).toContainText('2 results (100.0%)');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await panel.screenshot({path:info.outputPath('examination-results.png')});
 await panel.getByLabel('Examination',{exact:true}).selectOption('TE');
 await expect(panel.getByText('No valid examination scores for these filters.')).toBeVisible();
 await expect(panel.locator('table')).toHaveCount(0);
 await expect(insights).toContainText('Insufficient examination data');
 await expect(insights).not.toContainText('same normalized score');
 failed=true;await panel.getByLabel('Examination Term',{exact:true}).selectOption('Term 1');
 await expect(panel.getByRole('alert')).toContainText('500');
 expect(errors).toEqual([]);
});



test('examination card information supports touch', async ({ browser }) => {
 const context=await browser.newContext({hasTouch:true,viewport:{width:375,height:811}});
 const page=await context.newPage();
 try {
  const release=await mockDirectory(page,'PRINCIPAL',false);release();await mockAnalytics(page);
  await page.route('**/api/reports/examination-performance?**',route=>route.fulfill({json:{success:true,data:{schoolYear:'1',summary:{count:0,students:0,mean:null,sd:null},rows:[],distribution:[],options:{years:[],terms:['Term 1'],sections:[],subjects:[]}}}}));
  await page.goto('/principal/examination-performance');
  await page.getByRole('button',{name:'About Results Coverage',exact:true}).tap();
  await expect(page.getByRole('tooltip')).toContainText('cannot yet be calculated reliably');
  await page.getByRole('heading',{name:'Examination Performance Analytics',exact:true}).tap();
  await expect(page.getByRole('tooltip')).toHaveCount(0);
 } finally { await context.close(); }
});
