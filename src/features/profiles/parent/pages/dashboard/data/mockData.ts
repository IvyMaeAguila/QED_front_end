import type {
  DailyUpdate,
  MatchedStudentRecord,
  SchoolEvent,
  Student,
} from "../types/student";

// ---------------------------------------------------------------------------
// Mock "currently enrolled / linked" students for Mavis Uno.
// Swap this out for a fetch to GET /api/parent/:id/students once the
// backend is ready — the shape is already what the UI expects.
// ---------------------------------------------------------------------------
export const mockStudents: Student[] = [
  // {
  //   id: "std-001",
  //   studentNumber: "2026-0001",
  //   firstName: "Juan",
  //   lastName: "Santos",
  //   fullName: "Juan Santos",
  //   gradeLevel: "Grade 2",
  //   section: "Rizal",
  //   adviser: "Mrs. Elena Castro",
  //   attendanceRate: 98,
  //   attendanceStatus: "present",
  //   linked: true,
  // },
  // {
  //   id: "std-002",
  //   studentNumber: "2026-0002",
  //   firstName: "Mark Venneth",
  //   lastName: "Uno",
  //   fullName: "Mark Venneth Uno",
  //   gradeLevel: "Grade 6",
  //   section: "Sampaguita",
  //   adviser: "Ms. Gaille Panganiban",
  //   attendanceRate: null,
  //   attendanceStatus: "pending",
  //   linked: true,
  // },
  // {
  //   id: "std-003",
  //   studentNumber: "2026-0003",
  //   firstName: "Renzoo",
  //   lastName: "Uno",
  //   fullName: "Renzoo Uno",
  //   gradeLevel: "Grade 6",
  //   section: "Sampaguita",
  //   adviser: "Ms. Gaille Panganiban",
  //   attendanceRate: 0,
  //   attendanceStatus: "absent",
  //   linked: false,
  // },
];

export const mockDailyUpdates: DailyUpdate[] = [
  {
    id: "upd-001",
    studentId: "std-001",
    studentName: "Earl",
    time: "7:30 am",
    message: "Earl is present for morning attendance.",
  },
  {
    id: "upd-002",
    studentId: "std-002",
    studentName: "Mark Venneth",
    time: "7:30 am",
    message: "Mark Venneth is present for morning attendance.",
  },
  {
    id: "upd-003",
    studentId: "std-003",
    studentName: "Renzoo",
    time: "7:30 am",
    message: "Renzoo is marked absent for morning attendance.",
  },
];

export const mockEvents: SchoolEvent[] = [
  {
    id: "evt-001",
    day: 10,
    month: "AUG",
    title: "Pta Meeting",
    holidayType: "",
    type: "activity",
  },
  {
    id: "evt-002",
    day: 15,
    month: "AUG",
    title: "Examination",
    holidayType: "",
    type: "activity",
  },
  {
    id: "evt-003",
    day: 31,
    month: "AUG",
    title: "Day Camp",
    holidayType: "Regular Holiday",
    type: "holiday",
  },
];

// Simulates the backend's response once an ID number + name combination
// is looked up. Keyed by ID number so the "Link Student" flow has
// something to match against. In production this becomes a
// GET /api/students/lookup?idNumber=... call.
export const mockDirectory: Record<string, MatchedStudentRecord> = {
  // "2026-0004": {
  //   idNumber: "2026-0004",
  //   fullName: "Earl Uno",
  //   gradeLevel: "Grade 1",
  //   section: "Kalayaan",
  //   adviser: "Mr. Ramon Dela Cruz",
  // },
};
