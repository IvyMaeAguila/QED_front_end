// src/features/profiles/principal/pages/analytics/utils/ranking.ts
import type { RankedSubject, AggregatedSubjectRank, FilteredSubjectRank } from "../data/types";
import type { Trend } from "../../../../shared/components/DashboardUI";

// Aggregates a term's raw grade+subject rows to one row per subject
// (average score across grades, dominant trend), ranked descending.
export function aggregateWholeElementary(rawList: RankedSubject[]): AggregatedSubjectRank[] {
  const bySubject: Record<string, { total: number; count: number; trendCounts: Record<string, number> }> = {};
  for (const item of rawList) {
    if (!bySubject[item.subject]) {
      bySubject[item.subject] = { total: 0, count: 0, trendCounts: { up: 0, down: 0, flat: 0 } };
    }
    bySubject[item.subject].total += item.score;
    bySubject[item.subject].count += 1;
    bySubject[item.subject].trendCounts[item.trend] += 1;
  }
  return Object.entries(bySubject)
    .map(([subject, data]) => {
      const avg = Math.round(data.total / data.count);
      const dominantTrend = (Object.entries(data.trendCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Trend) ?? "flat";
      return { subject, score: avg, trend: dominantTrend, gradeCount: data.count };
    })
    .sort((a, b) => b.score - a.score)
    .map((item, i) => ({ ...item, rank: i + 1 }));
}

// Filters a term's raw rows to one grade (or keeps them all for "All
// Grades"), re-ranked descending by score.
export function filterAndRankByGrade(rawList: RankedSubject[], gradeFilter: string): FilteredSubjectRank[] {
  const list = gradeFilter === "All Grades" ? rawList : rawList.filter((r) => r.grade === gradeFilter);
  return [...list].sort((a, b) => b.score - a.score).map((item, i) => ({ ...item, rank: i + 1 }));
}

export function getLowestPerforming(ranking: AggregatedSubjectRank[], count: number): AggregatedSubjectRank[] {
  return [...ranking].sort((a, b) => a.score - b.score).slice(0, count);
}

// Score tiers mapped to the app's actual palette (green / gold / red).
export function scoreVar(score: number): string {
  if (score >= 85) return "var(--color-green)";
  if (score >= 70) return "var(--color-gold)";
  return "var(--color-red)";
}
