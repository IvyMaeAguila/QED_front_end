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
import { HOLISTIC_RUBRIC } from "../utils/HolisticRubrics";
import {
  CURRENT_TERM,
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


interface GradingPeriodRow {
  id: number;
  school_year_id: number;
  term_number: number;
  term_label: string;
  start_date: string;
  end_date: string;
}

interface SchoolWideStudentRow {
  student_id: number;
  student_number: string;
  last_name: string;
  first_name: string;
  overall_average: number | null;
}

interface SchoolWideSectionRow {
  section_id: number | null;
  section_name: string;
  students: SchoolWideStudentRow[];
}

interface SchoolWideGradeLevelRow {
  grade_level_id: number | null;
  grade_level: string;
  sections: SchoolWideSectionRow[];
}

interface SchoolWideAcademicPerformanceResponse {
  success: boolean;
  term: GradingPeriodRow;
  grade_levels: SchoolWideGradeLevelRow[];
  message?: string;
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

async function getSchoolWideAcademicPerformance(): Promise<SchoolWideAcademicPerformanceResponse> {
  const res = await fetch(`${BASE_URL}/dashboard/academicPerformance`, {
    credentials: "include",
  });

  const json: SchoolWideAcademicPerformanceResponse = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || `Failed to fetch school-wide academic performance (${res.status})`);
  }

  return json;
}

function computeAcademicPerf(data: SchoolWideAcademicPerformanceResponse): number {
  const averages: number[] = [];

  for (const grade of data.grade_levels) {
    for (const section of grade.sections) {
      for (const student of section.students) {
        const value = Number(student.overall_average);
        if (student.overall_average !== null && student.overall_average !== undefined && !Number.isNaN(value)) {
          averages.push(value);
        }
      }
    }
  }

  if (averages.length === 0) return 0;

  const mean = averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
  return Math.round(mean * 100) / 100;
}

export async function getOverview(): Promise<OverviewData> {
  const [gradeLevels, teachers, attendanceRate, schoolWidePerf] = await Promise.all([
    getGradeLevels(),
    getTeachers(),
    getOverviewAttendance(),
    getSchoolWideAcademicPerformance(),
  ]);

  const totalStudents = gradeLevels.reduce((sum, g) => sum + g.totalStudents, 0);
  const totalTeachers = teachers.length;
  const attendance = attendanceRate.attendance;
  const academicPerf = computeAcademicPerf(schoolWidePerf);

  return {
    totalStudents,
    totalTeachers,
    attendance,
    academicPerf,
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

export async function getHolisticOverview(): Promise<HolisticDomain[]> {
  const res = await fetch(`${BASE_URL}/dashboard/holisticDomain`, {
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
  return resolveAfterDelay(HOLISTIC_RUBRIC);
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
  const res = await fetch(`${BASE_URL}/dashboard/performanceByGrade`, {
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

  const response = await fetch(`${BASE_URL}/dashboard/performanceTrend`, {
    method: "GET",
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
    getHolisticOverview(),
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