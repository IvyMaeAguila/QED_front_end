// src/features/profiles/principal/pages/dashboard/data/mockData.ts
//
// TODO: replace with real API data. Every export here is consumed only by
// principalDashboardService.ts — components never import from this file
// directly, so deleting/replacing it later only touches the service.
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
} from "./types";

export const CURRENT_TERM: Term = "Term 1"; // TODO: derive from active school year/term context

export const OVERVIEW: OverviewData = {
  totalStudents: 1280,
  totalTeachers: 42,
  attendance: 94,
  academicPerf: 82,
  needsIntervention: 37,
};

export const TODAYS_ATTENDANCE: TodaysAttendance = {
  present: 1178,
  absent: 102,
  concerning: 3,
};

// export const PERFORMANCE_BY_GRADE: GradePerformance[] = [
//   { grade: "Grade 1", score: 88 },
//   { grade: "Grade 2", score: 85 },
//   { grade: "Grade 3", score: 79 },
//   { grade: "Grade 4", score: 81 },
//   { grade: "Grade 5", score: 76 },
//   { grade: "Grade 6", score: 83 },
// ];

// export const PERFORMANCE_TREND: PerformanceTrendPoint[] = [
//   { term: "Term 1", performance: 82, attendance: 94, cognitive: 4.1, emotional: 3.9, behavioral: 4.0, social: 3.8 },
//   { term: "Term 2", performance: 79, attendance: 91, cognitive: 3.9, emotional: 3.8, behavioral: 3.9, social: 3.7 },
//   { term: "Term 3", performance: 85, attendance: 95, cognitive: 4.3, emotional: 4.1, behavioral: 4.2, social: 4.0 },
// ];

// export const ATTENDANCE_BY_GRADE: GradeAttendance[] = [
//   { grade: "Grade 1", attendance: 96 },
//   { grade: "Grade 2", attendance: 95 },
//   { grade: "Grade 3", attendance: 90 },
//   { grade: "Grade 4", attendance: 93 },
//   { grade: "Grade 5", attendance: 88 },
//   { grade: "Grade 6", attendance: 94 },
// ];

// TODO: replace with real API data — the single top-scoring subject for
// each grade, current term
export const TOP_SUBJECT_PER_GRADE: TopSubjectPerGrade[] = [
  { grade: "Grade 1", subject: "Mathematics", score: 94, trend: "up" },
  { grade: "Grade 2", subject: "Filipino", score: 91, trend: "up" },
  { grade: "Grade 3", subject: "Science", score: 88, trend: "flat" },
  { grade: "Grade 4", subject: "English", score: 92, trend: "up" },
  { grade: "Grade 5", subject: "Araling Panlipunan", score: 85, trend: "down" },
  { grade: "Grade 6", subject: "Mathematics", score: 90, trend: "up" },
];

// TODO: replace with real API data per term — full subject ranking across
// the school
export const SUBJECT_RANKING_BY_TERM: SubjectRankingByTerm = {
  "Term 1": [
    { rank: 1, subject: "Mathematics", grade: "Grade 1", score: 94, trend: "up" },
    { rank: 2, subject: "English", grade: "Grade 4", score: 92, trend: "up" },
    { rank: 3, subject: "Science", grade: "Grade 6", score: 90, trend: "flat" },
    { rank: 4, subject: "Araling Panlipunan", grade: "Grade 2", score: 89, trend: "up" },
    { rank: 5, subject: "Filipino", grade: "Grade 1", score: 87, trend: "down" },
  ],
  "Term 2": [
    { rank: 1, subject: "Filipino", grade: "Grade 2", score: 91, trend: "up" },
    { rank: 2, subject: "Mathematics", grade: "Grade 6", score: 90, trend: "flat" },
    { rank: 3, subject: "Science", grade: "Grade 3", score: 86, trend: "up" },
    { rank: 4, subject: "English", grade: "Grade 4", score: 85, trend: "down" },
    { rank: 5, subject: "Araling Panlipunan", grade: "Grade 5", score: 82, trend: "flat" },
  ],
  "Term 3": [
    { rank: 1, subject: "Mathematics", grade: "Grade 1", score: 96, trend: "up" },
    { rank: 2, subject: "Science", grade: "Grade 6", score: 93, trend: "up" },
    { rank: 3, subject: "English", grade: "Grade 4", score: 91, trend: "up" },
    { rank: 4, subject: "Filipino", grade: "Grade 2", score: 89, trend: "flat" },
    { rank: 5, subject: "Araling Panlipunan", grade: "Grade 5", score: 87, trend: "up" },
  ],
};

export const ATTENTION_ITEMS: AttentionItem[] = [
  { label: "Grade 5 Mathematics — below performance threshold", severity: "high" },
  { label: "Grade 3 Multiplication — needs intervention, declining trend", severity: "high" },
  { label: "Grade 5 attendance at 88%, lowest across grades", severity: "medium" },
  { label: "Social domain trending down school-wide", severity: "medium" },
  { label: "12 more students flagged for intervention vs last term", severity: "high" },
];
