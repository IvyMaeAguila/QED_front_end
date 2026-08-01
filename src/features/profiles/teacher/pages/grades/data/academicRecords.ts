import type { Student } from "../../../../admin/pages/studentrecords/types/Students";

// TODO: replace seedAcademicRecords with a real fetch, e.g.
// useQuery(["academic-records", gradeLevel, section], () => fetchAcademicRecords(...))
// Grades/holistic are academic records, not part of the core Student roster record,
// so they're kept in their own map keyed by studentId rather than on Student itself.

export type SubjectKey =
  | "math"
  | "english"
  | "mtongue"
  | "filipino"
  | "ap"
  | "esp"
  | "mapeh";

export interface Subject {
  key: SubjectKey;
  label: string;
}

export const SUBJECTS: Subject[] = [
  { key: "math", label: "Mathematics" },
  { key: "english", label: "English" },
  { key: "mtongue", label: "Mother Tongue" },
  { key: "filipino", label: "Filipino" },
  { key: "ap", label: "AP" },
  { key: "esp", label: "ESP" },
  { key: "mapeh", label: "MAPEH" },
];

export type GradeRecord = Partial<Record<SubjectKey, number | null>>;

export interface AcademicRecord {
  studentId: string;
  grades: GradeRecord;
  holistic: number;
}

// Deterministic seed so the same student always gets the same mock values
// across re-renders, without needing a backend yet.
function seededRandom(seedStr: string) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function seedAcademicRecords(
  students: Student[]
): Record<string, AcademicRecord> {
  const result: Record<string, AcademicRecord> = {};

  students.forEach((student) => {
    const rand = seededRandom(student.id);
    const grades: GradeRecord = {};
    SUBJECTS.forEach((subj) => {
      grades[subj.key] = Math.round(75 + rand() * 24);
    });
    const holistic = Math.round((1 + rand() * 4) * 10) / 10;

    result[student.id] = { studentId: student.id, grades, holistic };
  });

  return result;
}

export function genAvg(grades: GradeRecord): number | null {
  const vals = SUBJECTS.map((s) => grades[s.key]).filter(
    (v): v is number => v !== null && v !== undefined
  );
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / vals.length) * 10) / 10;
}

export type Remark = "Excellent" | "Good" | "Average" | "Needs Improvement" | "Critical";

export function remarkFor(score: number): Remark {
  if (score >= 4.5) return "Excellent";
  if (score >= 3.5) return "Good";
  if (score >= 2.5) return "Average";
  if (score >= 1.5) return "Needs Improvement";
  return "Critical";
}

export const REMARK_COLORS: Record<
  Remark,
  { light: { bg: string; text: string }; dark: { bg: string; text: string }; accent: string }
> = {
  Excellent: {
    light: { bg: "bg-[#166534]", text: "text-white" },
    dark: { bg: "bg-[#166534]", text: "text-white" },
    accent: "#16A34A",
  },
  Good: {
    light: { bg: "bg-[#DCFCE7]", text: "text-[#15803D]" },
    dark: { bg: "bg-[#14532D]", text: "text-[#86EFAC]" },
    accent: "#4ADE80",
  },
  Average: {
    light: { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
    dark: { bg: "bg-[#78350F]", text: "text-[#FDE68A]" },
    accent: "#F59E0B",
  },
  "Needs Improvement": {
    light: { bg: "bg-[#FCE7F1]", text: "text-[#9D174D]" },
    dark: { bg: "bg-[#831843]", text: "text-[#FBCFE8]" },
    accent: "#EC4899",
  },
  Critical: {
    light: { bg: "bg-[#DC2626]", text: "text-white" },
    dark: { bg: "bg-[#DC2626]", text: "text-white" },
    accent: "#EF4444",
  },
};

export function studentFullName(student: Student): string {
  const middleInitial = student.middleName ? `${student.middleName.charAt(0)}.` : "";
  return [student.firstName, middleInitial, student.lastName].filter(Boolean).join(" ");
}

export function studentSectionLabel(student: Student): string {
  return `${student.gradeLevel} - ${student.section}`;
}