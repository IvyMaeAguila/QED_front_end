export type AssessmentTabKey = "writtenWorks" | "performanceTask" | "exams";

export const ASSESSMENT_TAB_LABELS: Record<AssessmentTabKey, string> = {
  writtenWorks: "Written Works",
  performanceTask: "Performance Task",
  exams: "Exams",
};

export type ExamType = "ST1" | "ST2" | "TE";
export const EXAM_TYPES: ExamType[] = ["ST1", "ST2", "TE"];
export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  ST1: "Summative Test 1",
  ST2: "Summative Test 2",
  TE: "Term Exam",
};

export interface GradeItem {
  id: string;
  tab: AssessmentTabKey;
  date: string; 
  activityName: string;
  topic: string;
  topicId?: string;
  format: string;
  examType?: ExamType; 
  maxItems: number;
  gradingPeriodId: string | null;
}


export type ScoreMap = Record<string, Record<string, number | null>>;

// ---------- Holistic ratings ----------
export type HolisticAxisKey = "cognitive" | "emotional" | "behavioral" | "social";

export type HolisticMap = Record<string, Partial<Record<HolisticAxisKey, number>>>;

export const HOLISTIC_COLUMNS: { key: HolisticAxisKey; label: string; description: string }[] = [
  { key: "cognitive", label: "Cognitive", description: "understanding" },
  { key: "emotional", label: "Emotional", description: "self-regulation" },
  { key: "behavioral", label: "Behavioral", description: "conduct" },
  { key: "social", label: "Social", description: "collaboration" },
];

export const HOLISTIC_LEVELS: { value: number; label: string; color: string }[] = [
  { value: 5, label: "Excellent", color: "#166534" },
  { value: 4, label: "Good", color: "#15803D" },
  { value: 3, label: "Satisfactory", color: "#CA8A04" },
  { value: 2, label: "Needs Improvement", color: "#EA580C" },
  { value: 1, label: "Poor", color: "#DC2626" },
];

// ---------- Terms  ----------
export interface GradingPeriod {
  id: string;
  termNumber: number;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ---------- Attendance ----------
export type AttendanceStatus = "P" | "A" | "L" | "E" | null;

export const ATTENDANCE_CYCLE: AttendanceStatus[] = ["P", "A", "L", "E", null];

export const ATTENDANCE_META: Record<Exclude<AttendanceStatus, null>, { label: string; color: string; bg: string }> = {
  P: { label: "Present", color: "#166534", bg: "#86EFAC" },
  A: { label: "Absent", color: "#7F1D1D", bg: "#FCA5A5" },
  L: { label: "Late", color: "#78350F", bg: "#FCD34D" },
  E: { label: "Excuse", color: "#1E3A8A", bg: "#93C5FD" },
};

export type AttendanceMap = Record<string, Record<string, AttendanceStatus>>;

export function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}