export type Gender = "Male" | "Female";

export interface Student {
  studentId: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  gender: Gender;
}

export interface SectionInfo {
  section: string;
  adviser: string;
  room: string;
}

export interface GradeLevelSummary {
  gradeId: number;
  grade: string;
  section: string | null;
  classId: number | null;
  totalStudents: number;
}

export interface ClassList {
  classId: number | null;
  grade: string;
  sectionInfo: SectionInfo;
  roster: Student[];
}