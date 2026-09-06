// src/features/profiles/principal/pages/gradebooks/data/types.ts

export type Gender = "Male" | "Female";

export interface Student {
  studentId: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  gender: Gender;
  grades: Record<string, number>; // subject -> grade
}

export interface GradeLevelSummary {
  grade: string;
  section: string;
  totalStudents: number;
}
