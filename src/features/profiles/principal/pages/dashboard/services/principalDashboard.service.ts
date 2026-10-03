import { API_CONFIG } from '../../../../../../config/api.config';

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

export async function fetchActiveTerm(): Promise<ActiveTermRow> {
  const res = await fetch(`${BASE_URL}/principal-dashboard/active-term`, {
    credentials: "include",
  });
  const json: ApiResponse<ActiveTermRow> = await res.json();
  if (!res.ok || !json.data) {
    throw new Error(json.message || "Failed to fetch active term.");
  }
  return json.data;
}
// Total ng lahat ng enrolled na estudyante (hindi kasama ang deleted at graduated)
async function getTotalStudents(): Promise<number> {
  const res = await fetch(`${BASE_URL}/student/total-student`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch total students (${res.status})`);
  }
  const json: { total: number } = await res.json();
  return Number(json.total) || 0;
}

function mapToTerm(name: string): Term {
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

export async function getOverview(): Promise<OverviewData> {
  const [totalStudents, response] = await Promise.all([
    getTotalStudents(),
    fetch(`${BASE_URL}/principal-dashboard/overview-summary`, { credentials: "include" }),
  ]);
  if (!response.ok) throw new Error(`Failed to fetch overview (${response.status})`);
  const summary: Pick<OverviewData, "totalTeachers" | "attendance" | "academicPerf"> = await response.json();
  return { totalStudents, ...summary, needsIntervention: 0 };
}

export async function fetchActiveAcademicYear(): Promise<AcademicYearRow> {
  const res = await fetch(`${BASE_URL}/academic-year/getAcademicYear`, {credentials: "include"});
  const json: ApiResponse<AcademicYearRow> = await res.json();
  if (!res.ok || !json.data) throw new Error(json.message || "Failed to fetch academic year.");
  return json.data;
}

export async function getTodaysAttendance(): Promise<TodaysAttendance> {
  const res = await fetch(`${BASE_URL}/principal-dashboard/getTodaysAttendance`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch today's attendance (${res.status})`);
  }
  return res.json();
}

export async function getAttendanceByGrade(): Promise<GradeAttendance[]> {
  const res = await fetch(`${BASE_URL}/principal-dashboard/getAttendanceByGrade`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch attendance by grade (${res.status})`);
  }
  return res.json();
}

export async function getTopSubjectPerGrade(): Promise<TopSubjectPerGrade[]> {
  const res = await fetch(`${BASE_URL}/principal-dashboard/topSubjectPerGrade`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch top subject per grade (${res.status})`);
  }
  return res.json();
}

export async function getSubjectRankingByTerm(): Promise<SubjectRankingByTerm> {
  const res = await fetch(`${BASE_URL}/principal-dashboard/subjectRankingByTerm`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch subject ranking (${res.status})`);
  }
  return res.json();
}

export async function getHolisticOverview(): Promise<HolisticDomain[]> {
  const res = await fetch(`${BASE_URL}/principal-dashboard/holisticDomain`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch holistic overview: ${res.status}`);
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

export async function getHolisticDevelopmentData(): Promise<{
  holisticDomains: HolisticDomain[];
  holisticRubric: HolisticRubric;
}> {
  const [holisticDomains, holisticRubric] = await Promise.all([
    getHolisticOverview(),
    getHolisticRubric(),
  ]);

  return { holisticDomains, holisticRubric };
}

export async function getPerformanceByGrade(): Promise<GradePerformance[]> {
  const res = await fetch(`${BASE_URL}/principal-dashboard/performanceByGrade`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch performance by grade: ${res.status}`);
  }

  const json: ApiIntegrationResponse<GradePerformance[]> = await res.json();

  if (!json.success) {
    throw new Error(json.message ?? "Failed to fetch performance by grade");
  }

  return json.data;
}

export async function getPerformanceTrend(): Promise<PerformanceTrendPoint[]> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/principal-dashboard/performanceTrend`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.message ?? `Failed to fetch performance trend (status ${response.status})`
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

export async function getPrincipalDashboardData(): Promise<PrincipalDashboardData> {
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
    getOverview(),
    getTodaysAttendance(),
    getPerformanceByGrade(),
    getPerformanceTrend(),
    getAttendanceByGrade(),
    getTopSubjectPerGrade(),
    getHolisticOverview(),
    getHolisticRubric(),
    getAttentionItems(),
    getSubjectRankingByTerm(),
    fetchActiveTerm(), 
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