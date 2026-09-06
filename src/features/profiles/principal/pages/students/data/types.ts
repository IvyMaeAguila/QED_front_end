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

// One row on PrincipalStudentsPage's grade-level grid.
export interface GradeLevelSummary {
  grade: string;
  section: string;
  totalStudents: number;
}

// Everything ClassListPage needs for one grade, assembled by the service
// from SectionInfo + the roster (see studentsService.getClassList).
export interface ClassList {
  grade: string;
  sectionInfo: SectionInfo;
  roster: Student[];
}
