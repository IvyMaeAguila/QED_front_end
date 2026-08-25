import type { AttendanceTally, HolisticEntry, Term } from "./../types/types";

export const MOCK_ATTENDANCE_BY_MONTH: Record<string, AttendanceTally> = {
  "2026-06": { present: 19, absent: 1, late: 2 },
  "2026-07": { present: 21, absent: 0, late: 1 },
  "2026-08": { present: 8, absent: 1, late: 0 },
};

export const MOCK_TERMS: Term[] = [
  {
    key: "q1",
    label: "1st Quarter",
    released: true,
    releaseDate: "August 8, 2026",
    average: 91.4,
    subjects: [
      { subject: "Filipino", grade: 90 },
      { subject: "English", grade: 92 },
      { subject: "Math", grade: 89 },
      { subject: "Science", grade: 93 },
      { subject: "Araling Panlipunan", grade: 91 },
      { subject: "MAPEH", grade: 94 },
    ],
  },
  {
    key: "q2",
    label: "2nd Quarter",
    released: false,
    subjects: [],
  },
];

export const MOCK_HOLISTIC: HolisticEntry = {
  hasUpdate: true,
  lastUpdated: "August 10, 2026",
  adviser: "Mrs. Elena Castro",
  note:
    "Juan is participating more in group activities and consistently helps classmates during seatwork.",
  values: [
    { trait: "Cognitive", score: 4.5 },
    { trait: "Behavioral", score: 4 },
    { trait: "Emotional", score: 4.8 },
    { trait: "Social", score: 3.8 },
  ],
};