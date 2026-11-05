// src/features/profiles/principal/pages/analytics/utils/ranking.ts
import type { RankedSubject, AggregatedSubjectRank, FilteredSubjectRank } from "../data/types";
import type { Trend } from "../../../../shared/components/DashboardUI";

// Strip a grade suffix only when it agrees with the row's actual grade.
// Distinct learning areas and numbers belonging to a different grade stay intact.
function departmentSubjectName(item: RankedSubject): string {
  const name = item.subject.trim().replace(/\s+/g, " ");
  const grade = item.grade.trim().match(/^(?:grade\s*)?([1-6])$/i)?.[1];
  const suffix = name.match(/\s+(?:[-\u2013\u2014]\s*)?(?:grade\s*)?([1-6])$/i);
  return grade && suffix?.[1] === grade ? name.slice(0, suffix.index).trim() : name;
}

// One department row per learning area, averaging the eligible grade-level rows.
export function aggregateWholeElementary(rawList: RankedSubject[]): AggregatedSubjectRank[] {
  const bySubject = new Map<string, { subject: string; total: number; count: number; trendCounts: Record<string, number> }>();
  for (const item of rawList) {
    const subject = departmentSubjectName(item);
    const key = subject.toLocaleLowerCase("en");
    let group = bySubject.get(key);
    if (!group) {
      group = { subject, total: 0, count: 0, trendCounts: { up: 0, down: 0, flat: 0 } };
      bySubject.set(key, group);
    }
    group.total += item.score;
    group.count += 1;
    group.trendCounts[item.trend] += 1;
  }
  return [...bySubject.values()]
    .map(({ subject, total, count, trendCounts }) => {
      const avg = Math.round(total / count);
      const dominantTrend = (Object.entries(trendCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Trend) ?? "flat";
      return { subject, score: avg, trend: dominantTrend, gradeCount: count };
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
