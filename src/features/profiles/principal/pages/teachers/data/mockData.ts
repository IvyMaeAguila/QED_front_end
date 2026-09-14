// // TODO: replace with real API data. Consumed only by teachersService.ts —
// // components never import from here directly.
// import type { TeacherSummary, TeacherProfile } from "./types";

// export const SCHOOL_YEAR = "2025-2026"; // TODO: pull from active school year context

// // export const TEACHERS: TeacherSummary[] = [
// //   { teacherId: "T-0001", fullName: "Reyes, Maria S.", advisorySection: "Section A", gradeLevel: "Grade 1", room: "Room 101" },
// //   { teacherId: "T-0002", fullName: "Santos, Josef A.", advisorySection: "Section B", gradeLevel: "Grade 1", room: "Room 102" },
// //   { teacherId: "T-0003", fullName: "Cruz, Isabel M.", advisorySection: "Section C", gradeLevel: "Grade 1", room: "Room 103" },
// //   { teacherId: "T-0004", fullName: "Lopez, Marco T.", advisorySection: "Section A", gradeLevel: "Grade 2", room: "Room 201" },
// //   { teacherId: "T-0005", fullName: "Ramos, Andrea D.", advisorySection: "Section B", gradeLevel: "Grade 2", room: "Room 202" },
// //   { teacherId: "T-0006", fullName: "Dela Cruz, Daniel P.", advisorySection: "Section A", gradeLevel: "Grade 3", room: "Room 301" },
// //   { teacherId: "T-0007", fullName: "Mendoza, Clarisse V.", advisorySection: "Section B", gradeLevel: "Grade 3", room: "Room 302" },
// //   { teacherId: "T-0008", fullName: "Castillo, Angelo R.", advisorySection: "Section A", gradeLevel: "Grade 4", room: "Room 401" },
// //   { teacherId: "T-0009", fullName: "Navarro, Sofia L.", advisorySection: "Section B", gradeLevel: "Grade 4", room: "Room 402" },
// //   { teacherId: "T-0010", fullName: "Salazar, Ethan J.", advisorySection: "Section A", gradeLevel: "Grade 5", room: "Room 501" },
// //   { teacherId: "T-0011", fullName: "Domingo, Bea N.", advisorySection: "Section B", gradeLevel: "Grade 5", room: "Room 502" },
// //   { teacherId: "T-0012", fullName: "Marquez, Miguel C.", advisorySection: "Section A", gradeLevel: "Grade 6", room: "Room 601" },
// // ];

// // TODO: replace with real API data, keyed by teacherId. fullName/advisorySection/
// // gradeLevel/room intentionally duplicate TEACHERS above for now — once this is a
// // real endpoint it'll likely be one record per teacher rather than two mock sources.
// export const TEACHERS_DETAIL: Record<string, Omit<TeacherProfile, "teacherId">> = {
//   "T-0001": {
//     fullName: "Reyes, Maria S.",
//     advisorySection: "Section A",
//     gradeLevel: "Grade 1",
//     room: "Room 101",
//     schedule: [
//       { day: "Monday", time: "7:30 - 8:30 AM", subject: "Mathematics", gradeSection: "Grade 1 - A", room: "Room 101" },
//       { day: "Monday", time: "8:30 - 9:30 AM", subject: "Filipino", gradeSection: "Grade 1 - A", room: "Room 101" },
//       { day: "Monday", time: "9:45 - 10:45 AM", subject: "English", gradeSection: "Grade 1 - B", room: "Room 102" },
//       { day: "Tuesday", time: "7:30 - 8:30 AM", subject: "Science", gradeSection: "Grade 1 - A", room: "Room 101" },
//       { day: "Tuesday", time: "8:30 - 9:30 AM", subject: "Mathematics", gradeSection: "Grade 1 - B", room: "Room 102" },
//       { day: "Wednesday", time: "7:30 - 8:30 AM", subject: "Mathematics", gradeSection: "Grade 1 - A", room: "Room 101" },
//       { day: "Wednesday", time: "8:30 - 9:30 AM", subject: "Araling Panlipunan", gradeSection: "Grade 1 - A", room: "Room 101" },
//       { day: "Thursday", time: "7:30 - 8:30 AM", subject: "Filipino", gradeSection: "Grade 1 - A", room: "Room 101" },
//       { day: "Friday", time: "7:30 - 8:30 AM", subject: "English", gradeSection: "Grade 1 - A", room: "Room 101" },
//     ],
//   },
//   // TODO: fill in remaining teachers
// };
