import type { ExaminationAnalytics } from "../services/reports.service";

export interface ExaminationInsight { title: string; text: string; kind: "observation" | "action" }
const insufficient = "Insufficient examination data are available to generate meaningful performance insights.";
const valid = (row: ExaminationAnalytics["rows"][number]) => row.count >= 2 && row.students >= 2 && row.mean !== null && Number.isFinite(row.mean) && row.mean >= 0 && row.mean <= 100 && row.sd !== null && Number.isFinite(row.sd) && row.sd >= 0;

export function distributionDescription(data: ExaminationAnalytics | undefined): string | null {
  if (!data || data.summary.count < 2 || !data.distribution.length) return null;
  const bins = data.distribution;
  if (bins.some(bin => !Number.isInteger(bin.count) || bin.count < 0) || bins.reduce((sum, bin) => sum + bin.count, 0) !== data.summary.count) return null;
  const peak = bins.reduce((a, b) => b.count > a.count ? b : a);
  return peak.count > data.summary.count / 2 ? `${peak.count === data.summary.count ? "All" : "Most"} recorded examination results fall within the ${peak.interval} range.` : null;
}

/** Describes the selected recorded sample only; never classifies SD or infers completion. */
export function examinationInsights(data: ExaminationAnalytics | undefined): ExaminationInsight[] {
  if (!data || data.summary.count < 2 || data.summary.students < 2) return [{ title: "Data availability", text: insufficient, kind: "observation" }];
  const rows = data.rows.filter(valid);
  if (!rows.length) return [{ title: "Data availability", text: insufficient, kind: "observation" }];
  const insights: ExaminationInsight[] = [];
  // Equal counts alone do not establish comparable cohorts. The server assigns
  // this anonymous group only after matching exact student-section memberships.
  let comparison: { lower: typeof rows[number]; higher: typeof rows[number]; gap: number } | undefined;
  for (const a of rows) for (const b of rows) {
    if (a.subjectId === b.subjectId || !a.comparisonCohort || a.comparisonCohort !== b.comparisonCohort || a.examination !== b.examination || a.count !== b.count || a.students !== b.students) continue;
    const gap = b.mean! - a.mean!;
    if (gap > 0 && a.mean!.toFixed(2) !== b.mean!.toFixed(2) && (!comparison || gap > comparison.gap)) comparison = { lower: a, higher: b, gap };
  }
  if (comparison) {
    const { lower, higher } = comparison;
    insights.push({ title: "Subject comparison", text: `${lower.subject} has a lower recorded average (${lower.mean!.toFixed(2)}%) than ${higher.subject} (${higher.mean!.toFixed(2)}%)${lower.sd! > higher.sd! && lower.sd!.toFixed(2) !== higher.sd!.toFixed(2) ? " and greater score variation" : ""} for the same recorded student-section group and examination. This describes these results only; assessments may differ.`, kind: "observation" });
  }
  const uniform = rows.filter(row => row.sd === 0).sort((a, b) => b.count - a.count)[0];
  const varied = rows.filter(row => row.sd! > 0).sort((a, b) => b.sd! - a.sd!)[0];
  if (uniform) insights.push({ title: uniform.subject, text: `All ${uniform.count} recorded ${uniform.examination} results in ${uniform.subject} have the same normalized score (${uniform.mean!.toFixed(2)}% to two decimal places), resulting in zero score variation.`, kind: "observation" });
  if (varied && insights.length < 2) insights.push({ title: varied.subject, text: `${varied.subject} has an average of ${varied.mean!.toFixed(2)}% and a population SD of ${varied.sd!.toFixed(2)} percentage points across ${varied.count} recorded ${varied.examination} results. These recorded scores differ; SD alone does not indicate poor performance.`, kind: "observation" });
  if (insights.length < 2 && !uniform) {
    const distribution = distributionDescription(data);
    if (distribution) insights.push({ title: "Score distribution", text: distribution, kind: "observation" });
  }
  const review = comparison?.lower ?? varied;
  if (review) insights.push({ title: "Suggested action", text: `Review individual and topic-level examination results in ${review.subject} to understand the recorded differences and assess whether additional learning support is needed.`, kind: "action" });
  return insights.slice(0, 3);
}
