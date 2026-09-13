import type {
  GradeItem,
  GradingPeriod,
  HolisticMap,
  ScoreMap,
} from "../detail/types/Grading";
import type { RosterStudent } from "../detail/data";

export interface CachedSubjectDetail {
  subjectName: string;
  subjectCode: string;
  subjectCategory: string | null;
  gradeLevel: string;
  roster: RosterStudent[];
  items: GradeItem[];
  scores: ScoreMap;
  holistic: HolisticMap;
  holisticWeekStartDate: string;
  terms: GradingPeriod[];
  selectedTerm: string;
  // Whether the logged-in teacher is this section's own adviser. Comes
  // straight from fetchSubjectSectionInfo (backend-derived), cached here
  // alongside everything else so a cache hit doesn't lose it and cause
  // the Submit Grades button to flash back on for advisory subjects.
  isOwnAdvisory: boolean;
  // Display name of this section's adviser, used only in the confirm-
  // submit copy when isOwnAdvisory is false. Null if none is assigned.
  adviserName: string | null;
  cachedAt: number;
}

const cache = new Map<string, CachedSubjectDetail>();

const TTL_MS = 5 * 60 * 1000; 

export function getCachedSubjectDetail(subjectId: string): CachedSubjectDetail | null {
  const entry = cache.get(subjectId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    cache.delete(subjectId);
    return null;
  }
  return entry;
}

export function setCachedSubjectDetail(subjectId: string, data: Omit<CachedSubjectDetail, "cachedAt">): void {
  cache.set(subjectId, { ...data, cachedAt: Date.now() });
}

export function patchCachedSubjectDetail(subjectId: string, patch: Partial<Omit<CachedSubjectDetail, "cachedAt">>): void {
  const existing = cache.get(subjectId);
  if (!existing) return; 
  cache.set(subjectId, { ...existing, ...patch, cachedAt: Date.now() });
}

export function invalidateCachedSubjectDetail(subjectId: string): void {
  cache.delete(subjectId);
}