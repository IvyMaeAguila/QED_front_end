export type Gender = "Male" | "Female";

export type GradeLevel =
  | "Grade 1"
  | "Grade 2"
  | "Grade 3"
  | "Grade 4"
  | "Grade 5"
  | "Grade 6";

export interface Student {
  id: string; 
  dbId: number; 
  gradeLevelId: number;  // 👈 para sa pag-preselect ng dropdown pag nag-e-edit
  sectionId: number;
  studentId: string;
  lrn: string;
  lastName: string;
  firstName: string;
  middleName: string; 
  gender: Gender;
  gradeLevel: GradeLevel;
  section: string; 
}

export function formatFullName(s: Pick<Student, "lastName" | "firstName" | "middleName">) {
  const middle = s.middleName ? ` ${s.middleName}` : "";
  return `${s.lastName}, ${s.firstName}${middle}`;
}

export const GRADE_LEVELS: GradeLevel[] = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

export const GENDERS: Gender[] = ["Male", "Female"];