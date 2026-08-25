export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: "1st Quarter",
  Q2: "2nd Quarter",
  Q3: "3rd Quarter",
  Q4: "4th Quarter",
};

export const QUARTER_SHORT_LABELS: Record<Quarter, string> = {
  Q1: "1st",
  Q2: "2nd",
  Q3: "3rd",
  Q4: "4th",
};

export interface PeriodicRatingRow {
  learningArea: string;
  scores: Partial<Record<Quarter, number>>;
  finalRating: string;
}

export interface QuarterlyAverageEntry {
  quarter: Quarter;
  average: number | null;
  ratingLabel: string | null;
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
  quarter: Quarter;
  domains: HolisticDomainScore[];
}

export interface AttendanceMonthRow {
  month: string;
  schoolDays: number;
  present: number;
  absent: number;
  tardy: number;
}

export interface AttendanceQuarterEntry {
  quarter: Quarter;
  months: AttendanceMonthRow[];
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
  quarterlyAverages: QuarterlyAverageEntry[];
  holisticAssessments: HolisticAssessmentEntry[];
  attendanceByQuarter: AttendanceQuarterEntry[];
}