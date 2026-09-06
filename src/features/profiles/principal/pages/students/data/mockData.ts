// TODO: replace with real API data. Consumed only by studentsService.ts.
import type { GradeLevelSummary, SectionInfo, Student } from "./types";

export const SCHOOL_YEAR = "2025-2026"; // TODO: pull from active school year context

// TODO: replace with real API data
// Simplified: one section per grade level for now.
export const GRADE_LEVELS: GradeLevelSummary[] = [
  { grade: "Grade 1", section: "Section A", totalStudents: 42 },
  { grade: "Grade 2", section: "Section A", totalStudents: 41 },
  { grade: "Grade 3", section: "Section A", totalStudents: 40 },
  { grade: "Grade 4", section: "Section A", totalStudents: 44 },
  { grade: "Grade 5", section: "Section A", totalStudents: 43 },
  { grade: "Grade 6", section: "Section A", totalStudents: 47 },
];

// TODO: replace with real API data — one section per grade for now.
export const SECTION_BY_GRADE: Record<string, SectionInfo> = {
  "Grade 1": { section: "Section A", adviser: "Ms. Reyes", room: "Room 101" },
  "Grade 2": { section: "Section A", adviser: "Ms. Lopez", room: "Room 201" },
  "Grade 3": { section: "Section A", adviser: "Ms. Dela Cruz", room: "Room 301" },
  "Grade 4": { section: "Section A", adviser: "Ms. Castillo", room: "Room 401" },
  "Grade 5": { section: "Section A", adviser: "Ms. Salazar", room: "Room 501" },
  "Grade 6": { section: "Section A", adviser: "Ms. Marquez", room: "Room 601" },
};

// TODO: replace with real API data, keyed by grade
export const ROSTER_BY_GRADE: Record<string, Student[]> = {
  "Grade 1": [
    { studentId: "2025-0001", lastName: "Santos", firstName: "Miguel", middleInitial: "R.", gender: "Male" },
    { studentId: "2025-0002", lastName: "Reyes", firstName: "Josef", middleInitial: "A.", gender: "Male" },
    { studentId: "2025-0003", lastName: "Cruz", firstName: "Daniel", middleInitial: "M.", gender: "Male" },
    { studentId: "2025-0004", lastName: "Torres", firstName: "Angelo", middleInitial: "P.", gender: "Male" },
    { studentId: "2025-0005", lastName: "Garcia", firstName: "Sofia", middleInitial: "L.", gender: "Female" },
    { studentId: "2025-0006", lastName: "Bautista", firstName: "Isabel", middleInitial: "C.", gender: "Female" },
    { studentId: "2025-0007", lastName: "Lopez", firstName: "Maria", middleInitial: "D.", gender: "Female" },
    { studentId: "2025-0008", lastName: "Aquino", firstName: "Andrea", middleInitial: "S.", gender: "Female" },
  ],
  // TODO: fill in remaining grades with real data
};
