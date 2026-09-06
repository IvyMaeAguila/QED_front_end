// Mock-backed today; swap function bodies for real fetch/axios calls
// later without touching hooks/ or components/.
import type { Term, RankedSubject, HeatmapRow, ViewMode } from "../data/types";
import { TERM_OPTIONS, GRADE_OPTIONS, VIEW_OPTIONS, RANKING_BY_TERM, GRADE_ROWS, SUBJECT_ROWS } from "../data/mockData";

const MOCK_DELAY_MS = 300;
function resolveAfterDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export function getTermOptions(): Promise<Term[]> {
  return resolveAfterDelay(TERM_OPTIONS);
}

export function getGradeOptions(): Promise<string[]> {
  // TODO: GET /api/principal/analytics/grade-options
  return resolveAfterDelay(GRADE_OPTIONS);
}

export function getViewOptions(): Promise<ViewMode[]> {
  return resolveAfterDelay(VIEW_OPTIONS);
}

export function getSubjectRanking(term: Term): Promise<RankedSubject[]> {
  // TODO: GET /api/principal/analytics/subject-ranking?term=...
  return resolveAfterDelay(RANKING_BY_TERM[term]);
}

export function getHolisticRows(term: Term, view: ViewMode): Promise<HeatmapRow[]> {
  // TODO: GET /api/principal/analytics/holistic?term=...&view=...
  return resolveAfterDelay(view === "By Grade Level" ? GRADE_ROWS[term] : SUBJECT_ROWS[term]);
}
