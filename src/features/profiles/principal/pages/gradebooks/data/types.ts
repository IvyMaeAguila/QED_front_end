// src/features/profiles/principal/pages/gradebooks/data/types.ts

export type Gender = "Male" | "Female";
export type GradeSubmissionStatus = "submitted" | "pending" | "not_submitted";

export interface Student {
  studentId: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  gender: Gender;
  grades: Record<string, number>; // subject -> grade
  gradeStatuses: Record<string, GradeSubmissionStatus>;
  ownAdvisorySubjects: Record<string, boolean>;
  overallAverage: number | null;
}

export interface GradeLevelSummary {
  gradeLevelId: number;
  grade: string;
  sectionId?: number;
  section: string;
  totalStudents: number;
  adviserName: string | null;
  isSubmitted: boolean;
  gradingPeriodId: number | null;
}
