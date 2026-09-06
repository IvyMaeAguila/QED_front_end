

// Single source of truth for the shape of principal-dashboard data.
// mockData.ts is typed against these interfaces today; when the backend
// is ready, principalDashboardService.ts swaps its mock-backed functions
// for real fetch calls returning the same shapes — nothing in
// components/ or PrincipalDashboardHome.tsx needs to change.

export type Term = "Term 1" | "Term 2" | "Term 3";
export type Trend = "up" | "down" | "flat";

export interface OverviewData {
  totalStudents: number;
  totalTeachers: number;
  attendance: number; 
  academicPerf: number; 
  needsIntervention: number; 
}

export interface TodaysAttendance {
  present: number;
  absent: number;
  concerning: number; 
}

export interface GradePerformance {
  grade: string;
  score: number;
}

export interface PerformanceTrendPoint {
  term: Term;
  performance: number;
  attendance: number;
  cognitive: number;
  emotional: number;
  behavioral: number;
  social: number;
}

export interface GradeAttendance {
  grade: string;
  attendance: number;
}

export interface TopSubjectPerGrade {
  grade: string;
  subject: string;
  score: number;
  trend: Trend;
}

export interface SubjectRankingItem {
  rank: number;
  subject: string;
  grade: string;
  score: number;
  trend: Trend;
}

export type SubjectRankingByTerm = Record<Term, SubjectRankingItem[]>;

export type HolisticDomainName = "Cognitive" | "Emotional" | "Behavioral" | "Social";

export interface HolisticDomain {
  domain: HolisticDomainName;
  score: number; // 1-5 scale
}

// icon + color per domain are a presentation concern, not API data — see
// HOLISTIC_DOMAIN_PRESENTATION in components/HolisticDevelopmentSection.tsx

export type HolisticRubric = Record<HolisticDomainName, string[]>;

export type AttentionSeverity = "high" | "medium";

export interface AttentionItem {
  label: string;
  severity: AttentionSeverity;
}

// Full payload the dashboard needs, as one shape. The service can expose
// this as one call (getPrincipalDashboardData) or split into per-section
// calls (see principalDashboardService.ts) — both return pieces typed
// against this interface.
export interface PrincipalDashboardData {
  currentTerm: Term;
  overview: OverviewData;
  todaysAttendance: TodaysAttendance;
  performanceByGrade: GradePerformance[];
  performanceTrend: PerformanceTrendPoint[];
  attendanceByGrade: GradeAttendance[];
  topSubjectPerGrade: TopSubjectPerGrade[];
  subjectRankingByTerm: SubjectRankingByTerm;
  holisticDomains: HolisticDomain[];
  holisticRubric: HolisticRubric;
  attentionItems: AttentionItem[];
}
