import type { HolisticAxisKey, HolisticMap } from "../../subjects/detail/types/Grading";

const BASE_URL = "http://localhost:7400/api/teacherHolistic";

async function handleJsonResponse(res: Response) {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

function authedFetch(path: string, init?: RequestInit) {
  return fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

// ---------------------------------------------------------------------------
// Per-class weekly ratings (used by the Holistic tab on SubjectDetailPage)
// ---------------------------------------------------------------------------

export async function fetchHolistic(
  subjectSectionId: string,
  options?: { allWeeks?: boolean }
): Promise<{ data: HolisticMap; weekStartDate: string }> {
  const query = options?.allWeeks ? "?allWeeks=true" : "";
  const res = await authedFetch(`/${subjectSectionId}${query}`);
  const json = await handleJsonResponse(res);
  return { data: json.data, weekStartDate: json.weekStartDate };
}

export async function saveHolistic(
  subjectSectionId: string,
  studentId: string,
  axis: HolisticAxisKey,
  value: number,
  overrides?: { weekStartDate?: string; termNumber?: number }
): Promise<void> {
  const res = await authedFetch(`/${subjectSectionId}`, {
    method: "PUT",
    body: JSON.stringify({ studentId, axis, value, ...overrides }),
  });
  await handleJsonResponse(res);
}


export interface WeeklyScorePoint {
  week: string;
  score: number;
}

export interface HolisticTrend {
  weeksCount: number;
  weeklyScores: WeeklyScorePoint[];
  pastAverage: number | null;
  recentAverage: number | null;
  currentWeekAverage: number | null;
  trend: "Improving" | "Declining" | "Stable" | "Insufficient Data" | "No Data";
}

export interface HolisticOverviewSubject extends HolisticTrend {
  subjectSectionId: string;
  subjectName: string;
}

export interface HolisticOverviewStudent {
  studentId: string;
  studentName: string;
  isAdvisory: boolean;
  subjects: HolisticOverviewSubject[];
  overall: HolisticTrend | null;
}

export async function fetchHolisticOverview(termNumber: number): Promise<HolisticOverviewStudent[]> {
  const res = await authedFetch(`/overview?termNumber=${termNumber}`);
  const data = await handleJsonResponse(res);
  return data.data;
}

export interface WeeklyAxisScores {
  weekStartDate: string; 
  cognitive: number | null;
  emotional: number | null;
  social: number | null;
  behavioral: number | null;
  average: number | null;
}

export interface StudentWeeklyHolisticRecord {
  weeks: WeeklyAxisScores[];
  trend: HolisticTrend;
}

export type HolisticWeeklyMap = Record<string, StudentWeeklyHolisticRecord>;

export async function fetchHolisticWeekly(
  subjectSectionId: string,
  termNumber?: number
): Promise<{ data: HolisticWeeklyMap; weekStartDate: string }> {
  const params = new URLSearchParams({ allWeeks: "true" });
  if (termNumber !== undefined) params.set("termNumber", String(termNumber));
  const res = await authedFetch(`/${subjectSectionId}?${params.toString()}`);
  const json = await handleJsonResponse(res);
  return { data: json.data, weekStartDate: json.weekStartDate };
}


const GRADING_PERIODS_BASE_URL = "http://localhost:7400/api/gradingPeriods";

export interface GradingPeriod {
  id: string;
  schoolYearId: string;
  termNumber: number;
  termLabel: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export async function fetchGradingPeriodsGlobal(): Promise<GradingPeriod[]> {
  const res = await fetch(GRADING_PERIODS_BASE_URL, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const data = await handleJsonResponse(res);
  return data.data;
}

export interface DomainAverages {
  cognitive: number | null;
  emotional: number | null;
  social: number | null;
  behavioral: number | null;
}

export interface HolisticRisk {
  domain: keyof DomainAverages;
  score: number;
  level: "Critical" | "Needs Improvement";
}

export interface HolisticRecommendation {
  domain: keyof DomainAverages;
  message: string;
  priority: "High" | "Medium";
}

export interface SubjectDomainProfile extends HolisticTrend {
  subjectSectionId: string;
  subjectName: string;
  domainAverages: DomainAverages;
  evaluationCount: number;
  lastEvaluation: string | null;
  riskLevel: "HIGH" | "MEDIUM" | "NONE";
  risks: HolisticRisk[];
  recommendations: HolisticRecommendation[];
}

export interface OverallDomainSnapshot {
  domainAverages: DomainAverages;
  evaluationCount: number;
  lastEvaluation: string | null;
}

export interface StudentHolisticProfile {
  studentId: string;
  studentName: string;
  isAdvisory: boolean;
  overall: OverallDomainSnapshot;
  highestRiskLevel: "HIGH" | "MEDIUM" | "NONE";
  subjects: SubjectDomainProfile[];
}

export async function fetchStudentHolisticProfile(
  studentId: string,
  termNumber: number
): Promise<StudentHolisticProfile> {
  const res = await authedFetch(`/profile/${studentId}?termNumber=${termNumber}`);
  const data = await handleJsonResponse(res);
  return data.data;
}