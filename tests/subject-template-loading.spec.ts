import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";



async function templateFixture(page: Page, dark: boolean, present = true) {
  const releaseContext = await mockDirectory(page, "ADMIN", dark);
  releaseContext();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let fail = false;
  let requests = 0;
  await page.route("**/api/subject/getActiveGradeTemplate/1", async route => {
    requests++;
    await gate;
    await route.fulfill({ status: fail ? 500 : 200, json: fail ? { success: false, message: "Template temporarily unavailable" } : { success: true, data: present ? { id: 1, subject_id: 1, file_name: "Official DepEd workbook.xlsx", wwWeightPercent: 30, ptWeightPercent: 50, examWeightPercent: 20, examSt1SubweightPercent: 30, examSt2SubweightPercent: 30, examTeSubweightPercent: 40, uploadedAt: "2026-10-01" } : null } });
  });
  return { finish: release, unavailable: () => { fail = true; }, recover: () => { fail = false; }, requests: () => requests };
}


for(const [width,dark] of [[375,true],[1280,false]] as const)test('official template stays read-only '+width,async({page})=>{
 await page.setViewportSize({width,height:1000});const f=await templateFixture(page,dark);await page.goto('/admin/subjects/1');await waitForDataRoute(page);
 await expect(page.getByText('Official DepEd Grade Template',{exact:true})).toBeVisible();await expect(page.locator('input[type="file"]')).toHaveCount(0);await expect(page.getByRole('button',{name:/Upload Template|Replace Template/})).toHaveCount(0);
 f.finish();await expect(page.getByText('Official DepEd workbook.xlsx',{exact:true})).toBeVisible();
});
test('read-only template errors can still be retried',async({page})=>{
 const f=await templateFixture(page,false);f.unavailable();await page.goto('/admin/subjects/1');await waitForDataRoute(page);f.finish();await expect(page.getByRole('alert')).toContainText('Template temporarily unavailable');f.recover();await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByText('Official DepEd workbook.xlsx',{exact:true})).toBeVisible();
});
