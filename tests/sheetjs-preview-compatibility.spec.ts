import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const contracts: Array<{ sourceSha256: string; frontendStructureSha256: string }> = JSON.parse(fs.readFileSync(path.resolve('tests/fixtures/sheetjs-template-contracts.json'), 'utf8'));

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable((value as Record<string, unknown>)[key])]));
  return value;
}
const digest = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const directory = path.resolve('../thesis_qed/uploads/grade-templates');
for (const contract of contracts) test(`real Vite SheetJS preview matches historical contract ${contract.sourceSha256.slice(0, 12)}`, async ({ page }) => {
  const file = fs.readdirSync(directory).find(name => name.endsWith('.xlsx') && digest(fs.readFileSync(path.join(directory, name))) === contract.sourceSha256);
  expect(file, 'Reviewed immutable workbook must exist').toBeTruthy();
  const bytes = fs.readFileSync(path.join(directory, file!));
  await page.goto('/loading-harness.html');
  const structure = await page.evaluate(async base64 => {
    const source = '/src/features/profiles/admin/pages/subjects/services/gradeTemplateParser.service.ts';
    const parser = await import(/* @vite-ignore */ source);
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    return parser.parseGradeTemplate(new File([bytes], 'synthetic-review.xlsx'));
  }, bytes.toString('base64'));
  expect(digest(JSON.stringify(stable(structure)))).toBe(contract.frontendStructureSha256);
  expect(digest(fs.readFileSync(path.join(directory, file!)))).toBe(contract.sourceSha256);
});

test('SheetJS preview rejects malformed files without a grading structure', async ({ page }) => {
  await page.goto('/loading-harness.html');
  const rejected = await page.evaluate(async () => {
    const source = '/src/features/profiles/admin/pages/subjects/services/gradeTemplateParser.service.ts';
    const parser = await import(/* @vite-ignore */ source);
    const results = [];
    for (const bytes of [new Uint8Array(), new TextEncoder().encode('not,an,official,workbook'), new Uint8Array([80, 75, 3, 4, 0])]) {
      try { await parser.parseGradeTemplate(new File([bytes], 'invalid.xlsx')); results.push(false); }
      catch { results.push(true); }
    }
    return results;
  });
  expect(rejected).toEqual([true, true, true]);
});
