import type { Trend } from "../../../../shared/components/DashboardUI";

export type Term = "Term 1" | "Term 2" | "Term 3";

export interface RankedSubject {
  subject: string;
  grade: string;
  score: number;
  trend: Trend;
}

// Computed (not fetched) shapes — see utils/ranking.ts. Kept here since
// both the hook and components reference them.
//
// Deliberately NOT extending RankedSubject: an aggregated row is an
// average across every grade for a subject, so it has no single `grade`
// — only `gradeCount` (how many grades were averaged).
export interface AggregatedSubjectRank {
  subject: string;
  score: number;
  trend: Trend;
  gradeCount: number;
  rank: number;
}

export interface FilteredSubjectRank extends RankedSubject {
  rank: number;
}

// --- Holistic heatmap ---
// Hoisted out of HolisticHeatmap.tsx per its own TODO comment, now that
// this is no longer a standalone prototype file.
export type DomainKey = "cognitive" | "emotional" | "behavioral" | "social";

export interface HeatmapRow {
  label: string;
  scores: Record<DomainKey, number | null>; // 1.0–5.0 scale, null = no data yet
}

export type ViewMode = "By Grade Level" | "By Subject";
