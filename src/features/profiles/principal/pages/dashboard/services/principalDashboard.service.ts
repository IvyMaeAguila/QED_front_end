import { boundedFetch as fetch, type BufferedHttpReply } from '@shared/http/boundedFetch';
import { API_CONFIG } from '../../../../../../config/api.config';

import { QueryHttpError } from "@shared/http/QueryHttpError";

const BASE_URL = `${API_CONFIG.baseURL}/api`;

import type {
  Term,
  OverviewData,
  TodaysAttendance,
  GradePerformance,
  PerformanceTrendPoint,
  GradeAttendance,
  TopSubjectPerGrade,
  SubjectRankingByTerm,
  HolisticDomain,
  HolisticRubric,
  AttentionItem,
  PrincipalDashboardData,
} from "../data/types";
import { ATTENTION_ITEMS } from "../data/mockData";
import { HOLISTIC_RUBRIC } from "../utils/HolisticRubrics";
import type { AcademicYearRow } from "../../../../admin/pages/subjects/services/academicyear.service";
import type { ApiResponse } from "../../../../admin/pages/subjects/services/academicyear.service";

export interface DashboardRequestOptions {
  signal?: AbortSignal;
  onUnauthorized?: () => void;
  activeTerm?: ActiveTermRow;
}

// Guard each response before aggregation: a sibling rejection must not mask 401.
async function request(path: string, options: DashboardRequestOptions, init: RequestInit): Promise<BufferedHttpReply> {
  // Let a same-tick StrictMode cleanup cancel before dispatching transport.
  await Promise.resolve();
  options.signal?.throwIfAborted();
  const response = await fetch(`${BASE_URL}${path}`, { ...init, signal: options.signal });
  if (response.status === 401 && !options.signal?.aborted) options.onUnauthorized?.();
  return response;
}

export async function fetchActiveTerm(options: DashboardRequestOptions = {}): Promise<ActiveTermRow> {
  const res = await request(`/principal-dashboard/active-term`, options, {
    credentials: "include",
  });
  if (!res.ok) {
    const failure = await res.json().catch(() => null);
    throw new QueryHttpError(failure?.message || "Failed to fetch active term.", res.status, undefined, {requestId: res.requestId});
  }
  const json: ApiResponse<ActiveTermRow> = await res.json();
  if (!res.ok || !json.data) {
    throw new QueryHttpError(json.message || "Failed to fetch active term.", res.status, undefined, {requestId: res.requestId});
  }
  return json.data;
}
// Total ng lahat ng enrolled na estudyante (hindi kasama ang deleted at graduated)
export async function getTotalStudents(options: DashboardRequestOptions = {}): Promise<number> {
  const res = await request(`/student/total-student`, options, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch total students (${res.status})`, res.status, undefined, {requestId: res.requestId});
  }
  const json: { total: number } = await res.json();
  return Number(json.total) || 0;
}

export function mapToTerm(name: string): Term {
  if (name === "Term 1" || name === "Term 2" || name === "Term 3") return name;
  throw new Error(`Unexpected term name from API: ${name}`);
}

interface ApiIntegrationResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PerformanceTrendResponse {
  success: boolean;
  data: PerformanceTrendPoint[];
  message?: string;
}

export interface ActiveTermRow {
  id: number;
  schoolYearId: number;
  schoolYear: string;
  termNumber: number;
  name: string; 
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Active" | "Completed";
}

export async function getOverview(options: DashboardRequestOptions = {}): Promise<OverviewData> {
  const [totalStudents, summary] = await Promise.all([
    getTotalStudents(options),
    getOverviewSummary(options),
  ]);
  return { totalStudents, ...summary, needsIntervention: 0 };
}

export async function getOverviewSummary(options: DashboardRequestOptions = {}):Promise<Pick<OverviewData,"totalTeachers"|"attendance"|"academicPerf">> {
  const response=await request(`/principal-dashboard/overview-summary`, options, { credentials: "include" });
  if (!response.ok) throw new QueryHttpError(`Failed to fetch overview (${response.status})`, response.status, undefined, {requestId: response.requestId});
  return response.json();
}

export async function fetchActiveAcademicYear(options: DashboardRequestOptions = {}): Promise<AcademicYearRow> {
  const res = await request(`/academic-year/getAcademicYear`, options, {credentials: "include"});
  if (!res.ok) {
    const failure = await res.json().catch(() => null);
    throw new QueryHttpError(failure?.message || "Failed to fetch academic year.", res.status, undefined, {requestId: res.requestId});
  }
  const json: ApiResponse<AcademicYearRow> = await res.json();
  if (!res.ok || !json.data) throw new QueryHttpError(json.message || "Failed to fetch academic year.", res.status, undefined, {requestId: res.requestId});
  return json.data;
}

export async function getTodaysAttendance(options: DashboardRequestOptions = {}): Promise<TodaysAttendance> {
  const res = await request(`/principal-dashboard/getTodaysAttendance`, options, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch today's attendance (${res.status})`, res.status, undefined, {requestId: res.requestId});
  }
  return res.json();
}

export async function getAttendanceByGrade(options: DashboardRequestOptions = {}): Promise<GradeAttendance[]> {
  const res = await request(`/principal-dashboard/getAttendanceByGrade`, options, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch attendance by grade (${res.status})`, res.status, undefined, {requestId: res.requestId});
  }
  return res.json();
}

export async function getTopSubjectPerGrade(options: DashboardRequestOptions = {}): Promise<TopSubjectPerGrade[]> {
  const res = await request(`/principal-dashboard/topSubjectPerGrade`, options, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch top subject per grade (${res.status})`, res.status, undefined, {requestId: res.requestId});
  }
  return res.json();
}

export async function getSubjectRankingByTerm(options: DashboardRequestOptions = {}): Promise<SubjectRankingByTerm> {
  const res = await request(`/principal-dashboard/subjectRankingByTerm`, options, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch subject ranking (${res.status})`, res.status, undefined, {requestId: res.requestId});
  }
  return res.json();
}

export async function getHolisticOverview(options: DashboardRequestOptions = {}): Promise<HolisticDomain[]> {
  const res = await request(`/principal-dashboard/holisticDomain`, options, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch holistic overview: ${res.status}`, res.status, undefined, {requestId: res.requestId});
  }
  const json: ApiIntegrationResponse<HolisticDomain[]> = await res.json();
  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch holistic overview");
  }
  return json.data;
}

export function getHolisticRubric(): Promise<HolisticRubric> {
  return Promise.resolve(HOLISTIC_RUBRIC);
}

export async function getHolisticDevelopmentData(options: DashboardRequestOptions = {}): Promise<{
  holisticDomains: HolisticDomain[];
  holisticRubric: HolisticRubric;
}> {
  const [holisticDomains, holisticRubric] = await Promise.all([
    getHolisticOverview(options),
    getHolisticRubric(),
  ]);

  return { holisticDomains, holisticRubric };
}

export async function getPerformanceByGrade(options: DashboardRequestOptions = {}): Promise<GradePerformance[]> {
  const res = await request(`/principal-dashboard/performanceByGrade`, options, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new QueryHttpError(`Failed to fetch performance by grade: ${res.status}`, res.status, undefined, {requestId: res.requestId});
  }

  const json: ApiIntegrationResponse<GradePerformance[]> = await res.json();

  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch performance by grade");
  }

  return json.data;
}

export async function getPerformanceTrend(options: DashboardRequestOptions = {}): Promise<PerformanceTrendPoint[]> {
  const token = localStorage.getItem("token");

  const response = await request(`/principal-dashboard/performanceTrend`, options, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new QueryHttpError(
      errorBody?.message ?? `Failed to fetch performance trend (status ${response.status})`, response.status, undefined, {requestId: response.requestId}
    );
  }

  const result: PerformanceTrendResponse = await response.json();

  if (!result.success) {
    throw new Error(result.message ?? "Failed to fetch performance trend.");
  }

  return result.data;
}

export function getAttentionItems(): Promise<AttentionItem[]> {
  // TODO: GET /api/principal/attention-items
  return Promise.resolve(ATTENTION_ITEMS);
}

export async function getPrincipalDashboardData(options: DashboardRequestOptions = {}): Promise<PrincipalDashboardData> {
  const [
    overview,
    todaysAttendance,
    performanceByGrade,
    performanceTrend,
    attendanceByGrade,
    topSubjectPerGrade,
    holisticDomains,
    holisticRubric,
    attentionItems,
    subjectRankingByTerm,
    activeTerm
  ] = await Promise.all([
    getOverview(options),
    getTodaysAttendance(options),
    getPerformanceByGrade(options),
    getPerformanceTrend(options),
    getAttendanceByGrade(options),
    getTopSubjectPerGrade(options),
    getHolisticOverview(options),
    getHolisticRubric(),
    getAttentionItems(),
    getSubjectRankingByTerm(options),
    options.activeTerm ?? fetchActiveTerm(options),
  ]);

  return {
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
    currentTerm: mapToTerm(activeTerm.name),
  };
}
