import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { academicGolden, expectedWhole, holisticGolden, analyticsMetrics } from "./fixtures/analytics";
import { aggregateWholeElementary, filterAndRankByGrade, getLowestPerforming, scoreVar } from "../src/features/profiles/principal/pages/reports/utils/ranking";

test("academic golden: rounding, ties, dominant trends, row counts, filtering, zero and empty", () => {
  const original = structuredClone(academicGolden);
  expect(aggregateWholeElementary(academicGolden)).toEqual(expectedWhole);
  expect(filterAndRankByGrade(academicGolden, "Grade 1")).toEqual([academicGolden[1], academicGolden[0], academicGolden[4]].map((r, i) => ({ ...r, rank: i + 1 })));
  expect(aggregateWholeElementary([academicGolden[0], academicGolden[0]])[0].gradeCount).toBe(2);
  expect(filterAndRankByGrade(academicGolden, "All Grades").map(r => r.score)).toEqual([85.5, 85, 85, 84.5, 70.5, 69.5, 0]);
  expect(getLowestPerforming(aggregateWholeElementary(academicGolden), 3).map(r => r.subject)).toEqual(["Arts", "Reading", "Mathematics"]);
  expect(aggregateWholeElementary([])).toEqual([]);
  expect(filterAndRankByGrade(academicGolden, "Missing")).toEqual([]);
  expect([85, 84.99, 70, 69.99, 0].map(scoreVar)).toEqual(["var(--color-green)", "var(--color-gold)", "var(--color-gold)", "var(--color-red)", "var(--color-red)"]);
  expect(academicGolden).toEqual(original);
});

async function goldenPage(page: Page, path: string) {
  const release = await mockDirectory(page, "PRINCIPAL", false); release();
  await page.route("**/api/reports/**", route => {
    const path = new URL(route.request().url()).pathname;
    const data = path.endsWith("term-options") ? ["Term 1", "Term 2", "Term 3"] : path.endsWith("grade-options") ? ["All Grades", "Grade 1", "Grade 2"] : path.endsWith("view-options") ? ["By Grade Level", "By Subject"] : path.endsWith("subject-ranking") ? academicGolden : holisticGolden;
    return route.fulfill({ json: { success: true, data } });
  });
  await page.goto(path);
}
test("mocked academic golden: displayed metric rounding, ordering and local grade filter", async ({ page }) => {
  await goldenPage(page, "/principal/reports");
  for (const [i, value] of analyticsMetrics.academic.entries()) await expect(page.locator(`[data-sk-region="report-metric-value-${i}"]`)).toHaveText(value);
  await expect(page.locator('[data-sk-region="leading-subject-row"]')).toHaveCount(4);
  await expect(page.locator('[data-sk-region="report-metric-detail-3"]')).toHaveText("0% · review recommended");
  await page.getByRole("combobox").nth(1).selectOption("Grade 1");
  const rows = await page.locator('[data-sk-region="per-grade-ranking-row"]').allTextContents();
  expect(rows.map(text => text.includes("Science") ? "Science" : text.includes("Mathematics") ? "Mathematics" : "Reading")).toEqual(["Science", "Mathematics", "Reading"]);
});
test("mocked holistic golden: null exclusion, raw cell mean, band boundaries and interpretations", async ({ page }) => {
  await goldenPage(page, "/principal/holistic-performance-analytics");
  for (const [i, value] of analyticsMetrics.holistic.entries()) await expect(page.locator(`[data-sk-region="report-metric-value-${i}"]`)).toHaveText(value);
  await expect(page.locator('[data-sk-region="report-metric-detail-2"]')).toHaveText("4.8 / 5 average");
  await expect(page.locator('[data-sk-region="report-metric-detail-3"]')).toHaveText("Of 12 possible ratings");
  await expect(page.locator('[data-sk-region="holistic-heatmap-row-label"]')).toHaveText(["Grade 1", "Grade 2", "Grade 3"]);
  for (const [cell, band, meaning] of [
    ["Grade 1, Cognitive: 4.5", "4.5 · Excellent", "Consistently understands and applies concepts independently"],
    ["Grade 1, Emotional: 3.5", "3.5 · Good", "Generally positive and engaged"],
    ["Grade 1, Behavioral: 2.5", "2.5 · Average", "Sometimes distracted"],
    ["Grade 1, Social: 1.5", "1.5 · Needs Improvement", "Rarely interacts"],
    ["Grade 2, Behavioral: 1.0", "1.0 · Critical", "Consistently problematic behavior"],
    ["Grade 2, Social: 4.5", "4.5 · Good", "Works well with peers"],
  ]) {
    await page.getByRole("button", { name: cell, exact: true }).focus();
    await expect(page.getByText(band, { exact: true })).toBeVisible();
    await expect(page.getByText(meaning, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Grade 3, Cognitive: no score", exact: true }).focus();
  await expect(page.getByText("No data recorded yet for this cell.", { exact: true })).toBeVisible();
});
