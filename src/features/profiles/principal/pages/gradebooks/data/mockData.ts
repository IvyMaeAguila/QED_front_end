// // Only ever imported by services/gradebooksService.ts — components and
// // hooks should never reach in here directly.
// import type { GradeLevelSummary, Student } from "./types";

export const SCHOOL_YEAR = "2025-2026"; // TODO: pull from active school year context


// export const SUBJECTS: string[] = [
//   "Filipino",
//   "English",
//   "Mathematics",
//   "Science",
//   "Araling Panlipunan",
//   "MAPEH",
//   "ESP",
// ];

// // TODO: replace with real API data
// // Simplified: one section per grade level for now.
// export const GRADE_LEVELS: GradeLevelSummary[] = [
//   { grade: "Grade 1", section: "Section A", totalStudents: 42 },
//   { grade: "Grade 2", section: "Section A", totalStudents: 41 },
//   { grade: "Grade 3", section: "Section A", totalStudents: 40 },
//   { grade: "Grade 4", section: "Section A", totalStudents: 44 },
//   { grade: "Grade 5", section: "Section A", totalStudents: 43 },
//   { grade: "Grade 6", section: "Section A", totalStudents: 47 },
// ];

// // TODO: replace with real API data, keyed by grade
// export const STUDENTS_BY_GRADE: Record<string, Student[]> = {
//   "Grade 1": [
//     {
//       studentId: "2025-0001",
//       lastName: "Santos",
//       firstName: "Miguel",
//       middleInitial: "R.",
//       gender: "Male",
//       grades: { Filipino: 90, English: 88, Mathematics: 92, Science: 87, "Araling Panlipunan": 89, MAPEH: 91, ESP: 90 },
//     },
//     {
//       studentId: "2025-0002",
//       lastName: "Reyes",
//       firstName: "Josef",
//       middleInitial: "A.",
//       gender: "Male",
//       grades: { Filipino: 85, English: 83, Mathematics: 86, Science: 84, "Araling Panlipunan": 82, MAPEH: 88, ESP: 85 },
//     },
//     {
//       studentId: "2025-0003",
//       lastName: "Cruz",
//       firstName: "Daniel",
//       middleInitial: "M.",
//       gender: "Male",
//       grades: { Filipino: 78, English: 80, Mathematics: 75, Science: 79, "Araling Panlipunan": 77, MAPEH: 82, ESP: 80 },
//     },
//     {
//       studentId: "2025-0004",
//       lastName: "Torres",
//       firstName: "Angelo",
//       middleInitial: "P.",
//       gender: "Male",
//       grades: { Filipino: 91, English: 90, Mathematics: 93, Science: 89, "Araling Panlipunan": 90, MAPEH: 92, ESP: 91 },
//     },
//     {
//       studentId: "2025-0005",
//       lastName: "Garcia",
//       firstName: "Sofia",
//       middleInitial: "L.",
//       gender: "Female",
//       grades: { Filipino: 95, English: 93, Mathematics: 94, Science: 92, "Araling Panlipunan": 94, MAPEH: 93, ESP: 95 },
//     },
//     {
//       studentId: "2025-0006",
//       lastName: "Bautista",
//       firstName: "Isabel",
//       middleInitial: "C.",
//       gender: "Female",
//       grades: { Filipino: 88, English: 86, Mathematics: 84, Science: 85, "Araling Panlipunan": 87, MAPEH: 89, ESP: 86 },
//     },
//     {
//       studentId: "2025-0007",
//       lastName: "Lopez",
//       firstName: "Maria",
//       middleInitial: "D.",
//       gender: "Female",
//       grades: { Filipino: 82, English: 81, Mathematics: 79, Science: 80, "Araling Panlipunan": 83, MAPEH: 85, ESP: 82 },
//     },
//     {
//       studentId: "2025-0008",
//       lastName: "Aquino",
//       firstName: "Andrea",
//       middleInitial: "S.",
//       gender: "Female",
//       grades: { Filipino: 92, English: 90, Mathematics: 91, Science: 88, "Araling Panlipunan": 90, MAPEH: 91, ESP: 92 },
//     },
//   ],
//   // TODO: fill in remaining grades with real data
// };
