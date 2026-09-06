// Mock-backed today; swap function bodies for real fetch/axios calls
// later without touching hooks/ or components/.
import type { TeacherSummary, TeacherProfile } from "../data/types";
import { TEACHERS, TEACHERS_DETAIL, SCHOOL_YEAR } from "../data/mockData";

const MOCK_DELAY_MS = 300;
function resolveAfterDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export function getSchoolYear(): Promise<string> {
  return resolveAfterDelay(SCHOOL_YEAR);
}

export function getTeachers(): Promise<TeacherSummary[]> {
  // TODO: GET /api/principal/teachers
  return resolveAfterDelay(TEACHERS);
}

// Returns null (never throws) when the teacher isn't found — the page
// treats that as a "not found" state rather than an error state, since a
// bad/stale id in the URL isn't a failed request.
export function getTeacherProfile(teacherId: string): Promise<TeacherProfile | null> {
  // TODO: GET /api/principal/teachers/:teacherId
  const detail = TEACHERS_DETAIL[teacherId];
  if (!detail) return resolveAfterDelay(null);
  return resolveAfterDelay({ teacherId, ...detail });
}
