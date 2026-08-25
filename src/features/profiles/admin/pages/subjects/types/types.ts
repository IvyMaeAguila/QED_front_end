export type GradeLevel = "Grade 1" | "Grade 2" | "Grade 3" | "Grade 4" | "Grade 5" | "Grade 6";

export const GRADE_LEVELS: GradeLevel[] = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

export const GRADE_LEVEL_IDS: Record<GradeLevel, number> = {
  "Grade 1": 1,
  "Grade 2": 2,
  "Grade 3": 3,
  "Grade 4": 4,
  "Grade 5": 5,
  "Grade 6": 6,
};

export const GRADE_LEVEL_BY_ID: Record<number, GradeLevel> = {
  1: "Grade 1",
  2: "Grade 2",
  3: "Grade 3",
  4: "Grade 4",
  5: "Grade 5",
  6: "Grade 6",
};

export interface Subject {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  section: string;
  teacherId: string | null;
  schoolYear: string;
  status: "Active" | "Inactive";
}

export interface Section {
  id: string;
  gradeLevel: GradeLevel;
  name: string;
}

export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  contactNumber: string;
}

export function formatTeacherName(
  teacher: Pick<Teacher, "firstName" | "lastName">
) {
  return `${teacher.firstName} ${teacher.lastName}`;
}

export interface SubjectsTheme {
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

export const ACCENT = "#8B0D0D";
export const SCHOOL_YEAR = "2026–2027";

export const PALETTE = {
  gradientFrom: "#550000",
  gradientTo: "#9D0000",
  white: "#F2F4F7",
  goldMuted: "#9C8248",
  gray: "#9CA3AF",
};