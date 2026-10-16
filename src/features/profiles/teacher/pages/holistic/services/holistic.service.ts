import { API_CONFIG } from '../../../../../../config/api.config';
import type { HolisticAxisKey, HolisticMap } from "../../subjects/detail/types/Grading";
import type { TeacherRequestOptions } from "../../../query/teacherQueryScope";
import { QueryHttpError } from "@shared/http/QueryHttpError";

const BASE_URL = `${API_CONFIG.baseURL}/api/teacherHolistic`;

async function handleJsonResponse(res: Response) {
  const data = await res.json().catch(error => { if(!res.ok)throw new QueryHttpError('Request failed.',res.status);throw error; });
  if (!res.ok || !data.success) {
    if(!res.ok)throw new QueryHttpError(data.message || "Request failed.",res.status);
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

async function authedFetch(path: string, init?: RequestInit, options: TeacherRequestOptions = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
    signal: options.signal ?? init?.signal,
  });
  if(response.status===401)options.onUnauthorized?.();
  return response;
}

// ---------------------------------------------------------------------------
// Per-class weekly ratings (used by the Holistic tab on SubjectDetailPage)
// ---------------------------------------------------------------------------

export async function fetchHolistic(
  subjectSectionId: string,
  options?: { allWeeks?: boolean },
  request:TeacherRequestOptions={}
): Promise<{ data: HolisticMap; weekStartDate: string }> {
  const query = options?.allWeeks ? "?allWeeks=true" : "";
  const res = await authedFetch(`/${subjectSectionId}${query}`,undefined,request);
  const json = await handleJsonResponse(res);
  return { data: json.data, weekStartDate: json.weekStartDate };
}

export async function saveHolistic(
  subjectSectionId: string,
  studentId: string,
  axis: HolisticAxisKey,
  value: number,
  overrides?: { weekStartDate?: string; termNumber?: number },
  request:TeacherRequestOptions={}
): Promise<void> {
  const res = await authedFetch(`/${subjectSectionId}`, {
    method: "PUT",
    body: JSON.stringify({ studentId, axis, value, ...overrides }),
  },request);
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

export async function fetchHolisticOverview(termNumber: number, options: TeacherRequestOptions = {}): Promise<HolisticOverviewStudent[]> {
  const res = await authedFetch(`/overview?termNumber=${termNumber}`, undefined, options);
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
  termNumber?: number,
  request:TeacherRequestOptions={}
): Promise<{ data: HolisticWeeklyMap; weekStartDate: string }> {
  const params = new URLSearchParams({ allWeeks: "true" });
  if (termNumber !== undefined) params.set("termNumber", String(termNumber));
  const res = await authedFetch(`/${subjectSectionId}?${params.toString()}`,undefined,request);
  const json = await handleJsonResponse(res);
  return { data: json.data, weekStartDate: json.weekStartDate };
}


const GRADING_PERIODS_BASE_URL = `${API_CONFIG.baseURL}/api/gradingPeriods`;

export interface GradingPeriod {
  id: string;
  schoolYearId: string;
  termNumber: number;
  termLabel: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export async function fetchGradingPeriodsGlobal(options: TeacherRequestOptions = {}): Promise<GradingPeriod[]> {
  const res = await fetch(GRADING_PERIODS_BASE_URL, {
    credentials: "include",
    signal: options.signal,
    headers: { "Content-Type": "application/json" },
  });
  if(res.status===401)options.onUnauthorized?.();
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
  termNumber: number,
  options: TeacherRequestOptions = {},
): Promise<StudentHolisticProfile> {
  const res = await authedFetch(`/profile/${studentId}?termNumber=${termNumber}`, undefined, options);
  const data = await handleJsonResponse(res);
  return data.data;
}
