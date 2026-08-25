// Swap this for the real `Student` type from "../../types/student" once
// this folder is dropped into the actual repo — kept local here so the
// split files are self-contained and easy to preview. The real `Student`
// type has more fields (id, attendanceRate, etc.) — that's fine, this is
// just the subset the detail page actually reads.

export interface MonthOption {
  key: string; // "YYYY-MM"
  label: string; // "August 2026"
}

export interface AttendanceTally {
  present: number;
  absent: number;
  late: number;
}

export interface SubjectGrade {
  subject: string;
  grade: number;
}

export interface Term {
  key: string;
  label: string;
  released: boolean;
  releaseDate?: string;
  average?: number;
  subjects: SubjectGrade[];
}

export interface HolisticValue {
  trait: string;
  score: number;
}

export interface HolisticEntry {
  hasUpdate: boolean;
  lastUpdated?: string;
  adviser?: string;
  note?: string;
  values: HolisticValue[];
}

