// src/features/profiles/principal/pages/dashboard/services/principalDashboardService.ts
//
// Every function here is async and mock-backed for now. When the backend
// is ready, replace each function body with a real fetch/axios call that
// resolves to the same shape (defined in data/types.ts) — nothing in
// hooks/ or components/ needs to change.
//
// Kept as separate per-section functions (rather than one giant
// getPrincipalDashboardData call) because the real endpoints will likely
// be separate too (e.g. subject ranking is paginated/term-filtered
// server-side, attendance is a different service than academics).
import type {
  Term,
  OverviewData,
  TodaysAttendance,
  GradePerformance,
  PerformanceTrendPoint,
  GradeAttendance,
  TopSubjectPerGrade,
  SubjectRankingItem,
  HolisticDomain,
  HolisticRubric,
  AttentionItem,
  PrincipalDashboardData,
} from "../data/types";
import {
  CURRENT_TERM,
  OVERVIEW,
  TODAYS_ATTENDANCE,
  PERFORMANCE_BY_GRADE,
  PERFORMANCE_TREND,
  ATTENDANCE_BY_GRADE,
  TOP_SUBJECT_PER_GRADE,
  SUBJECT_RANKING_BY_TERM,
  HOLISTIC_DOMAINS,
  HOLISTIC_RUBRIC,
  ATTENTION_ITEMS,
} from "../data/mockData";

// Simulates network latency so loading states are visible/testable during
// development. Remove once real calls are wired in — real requests won't
// need an artificial delay.
const MOCK_DELAY_MS = 300;
function resolveAfterDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export function getCurrentTerm(): Promise<Term> {
  return resolveAfterDelay(CURRENT_TERM);
}

export function getOverview(): Promise<OverviewData> {
  // TODO: GET /api/principal/overview
  return resolveAfterDelay(OVERVIEW);
}

export function getTodaysAttendance(): Promise<TodaysAttendance> {
  // TODO: GET /api/principal/attendance/today
  return resolveAfterDelay(TODAYS_ATTENDANCE);
}

export function getAttendanceByGrade(): Promise<GradeAttendance[]> {
  // TODO: GET /api/principal/attendance/by-grade?term=...
  return resolveAfterDelay(ATTENDANCE_BY_GRADE);
}

export function getPerformanceByGrade(): Promise<GradePerformance[]> {
  // TODO: GET /api/principal/performance/by-grade?term=...
  return resolveAfterDelay(PERFORMANCE_BY_GRADE);
}

export function getPerformanceTrend(): Promise<PerformanceTrendPoint[]> {
  // TODO: GET /api/principal/performance/trend
  return resolveAfterDelay(PERFORMANCE_TREND);
}

export function getTopSubjectPerGrade(): Promise<TopSubjectPerGrade[]> {
  // TODO: GET /api/principal/subjects/top-per-grade?term=...
  return resolveAfterDelay(TOP_SUBJECT_PER_GRADE);
}

export function getSubjectRanking(term: Term): Promise<SubjectRankingItem[]> {
  // TODO: GET /api/principal/subjects/ranking?term=...
  return resolveAfterDelay(SUBJECT_RANKING_BY_TERM[term]);
}

export function getHolisticDomains(): Promise<HolisticDomain[]> {
  // TODO: GET /api/principal/holistic/domains?term=...
  return resolveAfterDelay(HOLISTIC_DOMAINS);
}

export function getHolisticRubric(): Promise<HolisticRubric> {
  // Rubric text is close to static reference data (unlikely to change per
  // term) — still served async so the hook doesn't special-case it.
  return resolveAfterDelay(HOLISTIC_RUBRIC);
}

export function getAttentionItems(): Promise<AttentionItem[]> {
  // TODO: GET /api/principal/attention-items
  return resolveAfterDelay(ATTENTION_ITEMS);
}

// Convenience aggregate for the hook: fetches every section in parallel.
// subjectRankingByTerm is fetched for all three terms up front so the
// term dropdown in SubjectPerformanceSection can switch instantly without
// a refetch — revisit if the real endpoint makes that expensive.
export async function getPrincipalDashboardData(): Promise<PrincipalDashboardData> {
  const terms: Term[] = ["Term 1", "Term 2", "Term 3"];

  const [
    currentTerm,
    overview,
    todaysAttendance,
    performanceByGrade,
    performanceTrend,
    attendanceByGrade,
    topSubjectPerGrade,
    holisticDomains,
    holisticRubric,
    attentionItems,
    rankingsByTerm,
  ] = await Promise.all([
    getCurrentTerm(),
    getOverview(),
    getTodaysAttendance(),
    getPerformanceByGrade(),
    getPerformanceTrend(),
    getAttendanceByGrade(),
    getTopSubjectPerGrade(),
    getHolisticDomains(),
    getHolisticRubric(),
    getAttentionItems(),
    Promise.all(terms.map((t) => getSubjectRanking(t))),
  ]);

  const subjectRankingByTerm = terms.reduce((acc, term, i) => {
    acc[term] = rankingsByTerm[i];
    return acc;
  }, {} as PrincipalDashboardData["subjectRankingByTerm"]);

  return {
    currentTerm,
    overview,
    todaysAttendance,
    performanceByGrade,
    performanceTrend,
    attendanceByGrade,
    topSubjectPerGrade,
    subjectRankingByTerm,
    holisticDomains,
    holisticRubric,
    attentionItems,
  };
}
