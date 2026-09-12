export type Term = "T1" | "T2" | "T3";

export type TermFilter = Term | "OVERALL";

export const TERMS: Term[] = ["T1", "T2", "T3"];

export const TERM_LABELS: Record<Term, string> = {
  T1: "1st Term",
  T2: "2nd Term",
  T3: "3rd Term",
};

export const TERM_SHORT_LABELS: Record<Term, string> = {
  T1: "1st",
  T2: "2nd",
  T3: "3rd",
};

export const TERM_FILTER_LABELS: Record<TermFilter, string> = {
  ...TERM_LABELS,
  OVERALL: "Overall",
};

export interface PeriodicRatingRow {
  learningArea: string;
  scores: Partial<Record<Term, number>>;
  finalRating: string;
}

export interface TermAverageEntry {
  term: Term;
  average: number | null;
  ratingLabel: string | null;
  released: boolean;
}

export type HolisticDomainKey = "cognitive" | "emotional" | "social" | "behavioral";

export interface HolisticDomainScore {
  key: HolisticDomainKey;
  label: string;
  score: number;
  maxScore: number;
  subtitle: string;
}

export interface HolisticAssessmentEntry {
  term: TermFilter;
  domains: HolisticDomainScore[];
}

export interface AttendanceMonthRow {
  month: string;
  schoolDays: number;
  present: number;
  absent: number;
  tardy: number;
  excused: number;
}

export interface AttendanceTermEntry {
  term: TermFilter;
  present: number;
  absent: number;
  tardiness: number;
  excused?: number;
  totalDays: number;
  months: AttendanceMonthRow[]; // <-- idinagdag
}

export interface ProgressReportMeta {
  learner: string;
  gradeSection: string;
  classAdviser: string;
  schoolYear: string;
}

export interface ProgressReportData {
  meta: ProgressReportMeta;
  periodicRatings: PeriodicRatingRow[];
  termAverages: TermAverageEntry[];
  holisticAssessments: HolisticAssessmentEntry[];
  attendanceByTerm: AttendanceTermEntry[];
}