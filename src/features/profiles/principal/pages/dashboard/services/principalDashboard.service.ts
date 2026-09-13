// src/features/profiles/principal/pages/dashboard/services/principalDashboardService.ts
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
  SubjectRankingItem,
  SubjectRankingByTerm,
  HolisticDomain,
  HolisticRubric,
  AttentionItem,
  PrincipalDashboardData,
} from "../data/types";
import {
  CURRENT_TERM,
  PERFORMANCE_BY_GRADE,
  PERFORMANCE_TREND,
  HOLISTIC_DOMAINS,
  HOLISTIC_RUBRIC,
  ATTENTION_ITEMS,
} from "../data/mockData";
import { getGradeLevels } from "../../students/services/students.service";
import { getTeachers } from "../../teachers/services/teachers.service";
import type { AcademicYearRow } from "../../../../admin/pages/subjects/services/academicyear.service";
import type { ApiResponse } from "../../../../admin/pages/subjects/services/academicyear.service";

const MOCK_DELAY_MS = 300;
function resolveAfterDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

export function getCurrentTerm(): Promise<Term> {
  return resolveAfterDelay(CURRENT_TERM);
}

async function getOverviewAttendance(): Promise<{ attendance: number }> {
  const res = await fetch(`${BASE_URL}/dashboard/attendanceRate`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch overview attendance (${res.status})`);
  }
  return res.json();
}

export async function getOverview(): Promise<OverviewData> {
  const [gradeLevels, teachers, attendanceRate] = await Promise.all([
    getGradeLevels(),
    getTeachers(),
    getOverviewAttendance(),
  ]);

  const totalStudents = gradeLevels.reduce((sum, g) => sum + g.totalStudents, 0);
  const totalTeachers = teachers.length;
  const attendance = attendanceRate.attendance;

  // TODO: academicPerf and needsIntervention still need real endpoints.
  // Wiring them to 0 for now instead of pulling from mock data so the
  // overview object doesn't silently mix real + fake numbers.
  return {
    totalStudents,
    totalTeachers,
    attendance,
    academicPerf: 0,
    needsIntervention: 0,
  };
}

export async function fetchActiveAcademicYear(): Promise<AcademicYearRow> {
  const res = await fetch(`${BASE_URL}/academic-year/getAcademicYear`);
  const json: ApiResponse<AcademicYearRow> = await res.json();
  if (!res.ok || !json.data) throw new Error(json.message || "Failed to fetch academic year.");
  return json.data;
}

export async function getTodaysAttendance(): Promise<TodaysAttendance> {
  const res = await fetch(`${BASE_URL}/dashboard/getTodaysAttendance`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch today's attendance (${res.status})`);
  }
  return res.json();
}

export async function getAttendanceByGrade(): Promise<GradeAttendance[]> {
  const res = await fetch(`${BASE_URL}/dashboard/getAttendanceByGrade`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch attendance by grade (${res.status})`);
  }
  return res.json();
}

export function getPerformanceByGrade(): Promise<GradePerformance[]> {
  // TODO: GET /api/principal/performance/by-grade?term=...
  return resolveAfterDelay(PERFORMANCE_BY_GRADE);
}

export function getPerformanceTrend(): Promise<PerformanceTrendPoint[]> {
  // TODO: GET /api/principal/performance/trend
  return resolveAfterDelay(PERFORMANCE_TREND);
}

export async function getTopSubjectPerGrade(): Promise<TopSubjectPerGrade[]> {
  const res = await fetch(`${BASE_URL}/dashboard/topSubjectPerGrade`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch top subject per grade (${res.status})`);
  }
  return res.json();
}

export async function getSubjectRankingByTerm(): Promise<SubjectRankingByTerm> {
  const res = await fetch(`${BASE_URL}/dashboard/subjectRankingByTerm`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch subject ranking (${res.status})`);
  }
  return res.json();
}

export function getHolisticDomains(): Promise<HolisticDomain[]> {
  // TODO: GET /api/principal/holistic/domains?term=...
  return resolveAfterDelay(HOLISTIC_DOMAINS);
}

export function getHolisticRubric(): Promise<HolisticRubric> {
  return resolveAfterDelay(HOLISTIC_RUBRIC);
}

export function getAttentionItems(): Promise<AttentionItem[]> {
  // TODO: GET /api/principal/attention-items
  return resolveAfterDelay(ATTENTION_ITEMS);
}

export async function getPrincipalDashboardData(): Promise<PrincipalDashboardData> {
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
    subjectRankingByTerm,
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
    getSubjectRankingByTerm(),
  ]);

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