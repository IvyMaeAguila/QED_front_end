// Mock-backed today; swap function bodies for real fetch/axios calls
// later without touching hooks/ or components/.
import type { GradeLevelSummary, ClassList } from "../data/types";
import { GRADE_LEVELS, SECTION_BY_GRADE, ROSTER_BY_GRADE, SCHOOL_YEAR } from "../data/mockData";

const MOCK_DELAY_MS = 300;
function resolveAfterDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export function getSchoolYear(): Promise<string> {
  return resolveAfterDelay(SCHOOL_YEAR);
}

export function getGradeLevels(): Promise<GradeLevelSummary[]> {
  // TODO: GET /api/principal/students/grade-levels
  return resolveAfterDelay(GRADE_LEVELS);
}

// Returns null (never throws) when there's no section record for the
// grade — the page treats that as a "not found" state, not an error
// state, since a bad/stale grade in the URL isn't a failed request.
// Roster defaults to [] when a section exists but has no roster data yet.
export function getClassList(grade: string): Promise<ClassList | null> {
  // TODO: GET /api/principal/students/class-list/:grade
  const sectionInfo = SECTION_BY_GRADE[grade];
  if (!sectionInfo) return resolveAfterDelay(null);
  return resolveAfterDelay({ grade, sectionInfo, roster: ROSTER_BY_GRADE[grade] ?? [] });
}
