import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { mockGradeSheets, sheetEndpoints } from './fixtures/grade-sheets-query';
// MOCKED API/auth responses; actual registered route and fresh dist in artifact suite.
const url = '/principal/gradebooks/Grade%201?gradeLevelId=1&sectionId=11&gradingPeriodId=1';
const rows = (p: Page) => p.locator('[data-sk-region="grade-sheet-student-row"]');
const region = (p: Page) => p.locator('[data-sk-region="principal-grade-sheet-table"]');
async function fixture(p: Page, dark=false) { const release=await mockDirectory(p,'PRINCIPAL',dark); release(); return mockGradeSheets(p); }
async function ready(p: Page) { await expect(rows(p)).toHaveCount(1); await expect(region(p)).toHaveAttribute('data-sk-phase','settled'); await expect(p.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); }
async function away(p: Page) {
  const menu=p.getByRole('button',{name:'Open menu',exact:true});if(await menu.isVisible())await menu.click();
  await p.getByRole('link',{name:'Help & Support',exact:true}).click(); await expect(p.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();
}
for(const width of [375,1280])for(const dark of [false,true])test(`Grade Sheet ${width} ${dark?'dark':'light'}: goldens, selection, navigation, cache, offline and retry`,async({page},info)=>{
  await page.setViewportSize({width,height:1000});const f=await fixture(page,dark);f.hold('sheet');const errors:string[]=[];page.on('pageerror',e=>errors.push(e.name));
  const consoleErrors:string[]=[];page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('Failed to load resource'))consoleErrors.push(m.text());});
  const capture=async(name:string)=>{const path=info.outputPath(name+'.png');await page.screenshot({path,fullPage:true});await info.attach(name,{path,contentType:'image/png'});};
  await page.goto(url);await expect(region(page)).toHaveAttribute('aria-busy','true');await capture('loading');f.release('sheet');await ready(page);await f.settled({year:1,periods:1,sheet:1});
  await expect(rows(page).locator('td')).toHaveText(['Fixture, Synthetic A.','89.94','Pending','No grades yet','—','89.9']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await capture('loaded');
  const term=page.getByRole('combobox',{name:'Select grading term',exact:true});await term.selectOption('3');await expect(page.getByRole('heading',{name:'Grades Unavailable',exact:true})).toBeVisible();await expect(term).toHaveValue('1');
  await page.getByRole('button',{name:'Okay',exact:true}).click();expect(f.state.sheet.calls).toBe(1);
  await term.selectOption('2');await ready(page);await f.settled({year:1,periods:1,sheet:2});await expect(page).toHaveURL(/gradingPeriodId=2/);
  await term.selectOption('1');await ready(page);expect(f.state.sheet.calls).toBe(2);
  await page.getByPlaceholder('Search student name or ID...').fill('missing');await expect(page.getByText('No students found.',{exact:true})).toBeVisible();await page.getByPlaceholder('Search student name or ID...').fill('');await ready(page);expect(f.state.sheet.calls).toBe(2);
  await away(page);await page.goBack();await ready(page);await f.settled({year:1,periods:1,sheet:2});
  await page.context().setOffline(true);await expect(page.getByRole('alert')).toContainText('offline');await ready(page);await capture('cached-offline');for(let i=0;i<3;i++)await page.getByRole('button',{name:'Retry',exact:true}).click();expect(f.state.sheet.calls).toBe(2);
  await page.context().setOffline(false);await expect(page.getByRole('alert')).toHaveCount(0);await ready(page);expect(f.state.sheet.calls).toBe(2);
  await page.clock.install();await away(page);await page.clock.fastForward(31000);await page.goBack();await ready(page);await f.settled({year:2,periods:2,sheet:3});
  f.state.sheet.status=500;await page.reload();await expect(page.getByRole('alert')).toContainText('Synthetic sheet 500');await expect(rows(page)).toHaveCount(0);await capture('error');f.state.sheet.status=200;
  await page.getByRole('button',{name:'Retry',exact:true}).click();await ready(page);await f.settled({year:4,periods:4,sheet:5});
  expect(errors).toEqual([]);expect(consoleErrors).toEqual([]);await info.attach('synthetic-request-counts',{body:JSON.stringify({state:f.state,requests:f.requests}),contentType:'application/json'});
});
for(const endpoint of sheetEndpoints)for(const status of [401,403])test(`artifact sheet ${endpoint} ${status} independently protects auth and privacy`,async({page})=>{
  const f=await fixture(page);f.state[endpoint].status=status;await page.goto(url);
  if(status===401)await expect(page).toHaveURL(/\/login/);else{await expect(page.getByRole('alert')).toBeVisible();await expect(rows(page)).toHaveCount(0);await expect(page).toHaveURL(/\/principal\/gradebooks/);expect(f.state[endpoint].calls).toBe(1);}
});
for(const mode of ['default','explicit','none'])test(`artifact ${mode} server default preserves grade/section URL behavior`,async({page})=>{
  const f=await fixture(page);f.setDefault(2);if(mode==='none')f.setNoPeriods();await page.goto(mode==='explicit'?url:url.replace('&gradingPeriodId=1',''));
  if(mode==='none'){await expect(page.getByText('No grade records found for Grade 1.',{exact:true})).toBeVisible();expect(f.state.sheet.calls).toBe(0);}
  else{await ready(page);await expect(page).toHaveURL(new RegExp(`gradeLevelId=1&sectionId=11&gradingPeriodId=${mode==='default'?2:1}`));expect(f.requests.find(r=>r.endpoint==='sheet')?.period).toBe(mode==='default'?'2':'1');}
});
for(const mode of ['empty','null'])test(`artifact ${mode} sheet keeps empty/Not Found and cached offline presentation`,async({page})=>{
  const f=await fixture(page);if(mode==='null')f.setNull();else f.setEmpty();await page.goto(url);const text=mode==='null'?'No grade records found for Grade 1.':'No students found.';
  await expect(page.getByText(text,{exact:true})).toBeVisible();await f.settled({year:1,periods:1,sheet:1});await away(page);await page.goBack();await expect(page.getByText(text,{exact:true})).toBeVisible();expect(f.state.sheet.calls).toBe(1);
  await page.context().setOffline(true);await expect(page.getByRole('alert')).toContainText('offline');await expect(page.getByText(text,{exact:true})).toBeVisible();await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
});
test('artifact offline expired-cache navigation settles; reconnect resumes exactly once',async({page})=>{
  const f=await fixture(page);await page.goto(url);await ready(page);await f.settled({year:1,periods:1,sheet:1});await page.clock.install();await away(page);await page.clock.fastForward(601000);await page.context().setOffline(true);await page.goBack();
  await expect(page.getByRole('alert')).toContainText('offline');await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);await expect(rows(page)).toHaveCount(0);for(let i=0;i<3;i++)await page.getByRole('button',{name:'Retry',exact:true}).click();expect(f.state.sheet.calls).toBe(1);
  await page.context().setOffline(false);await ready(page);await f.settled({year:2,periods:2,sheet:2});
});
test('artifact year rollover remount removes retained old-year content before loading the new sheet',async({page})=>{
  const f=await fixture(page);await page.goto(url);await ready(page);await f.settled({year:1,periods:1,sheet:1});await page.clock.install();await away(page);await page.clock.fastForward(31000);f.setYear(2);f.setMarker('New Year');f.hold('sheet');await page.goBack();
  await expect.poll(()=>f.state.sheet.calls).toBe(2);await expect(page.getByText('Fixture, Synthetic A.',{exact:true})).toHaveCount(0);f.release('sheet');await ready(page);await expect(rows(page)).toContainText('New Year');await f.settled({year:2,periods:2,sheet:2});
});
test('artifact missing grade target makes no private readers and preserves Not Found',async({page})=>{
  const f=await fixture(page);await page.goto('/principal/gradebooks/Grade%201');await expect(page.getByText('No grade records found for Grade 1.',{exact:true})).toBeVisible();expect(f.state.year.calls).toBe(0);expect(f.state.periods.calls).toBe(0);expect(f.state.sheet.calls).toBe(0);
});

test('artifact rollover preserves an explicit old term and shows its server rejection without substituting a default',async({page})=>{
 const f=await fixture(page);await page.goto(url);await ready(page);await f.settled({year:1,periods:1,sheet:1});await page.clock.install();await away(page);await page.clock.fastForward(31000);f.setYear(2);
 await page.route('**/api/gradesheets/grading-period?**',r=>r.fulfill({json:{success:true,defaultGradingPeriodId:4,data:[{id:4,term_number:1,term_label:'Term 1',is_active:true,is_submitted:true}]}}));
 await page.route('**/api/gradesheets/?**',r=>r.fulfill({status:400,json:{message:'The selected grading period is not part of the active school year.'}}));
 await page.goBack();await expect(page.getByRole('alert')).toContainText('not part of the active school year');await expect(page).toHaveURL(/gradingPeriodId=1/);await expect(rows(page)).toHaveCount(0);await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
});
