// src/features/holistic/data/holisticAverageMock.ts

import type { StudentNarrativeSnapshot } from "../types/holisticAverageType";

export const MOCK_STUDENT_SNAPSHOTS: StudentNarrativeSnapshot[] = [
  {
    studentId: "STU-1001",
    studentName: "Juan Dela Cruz",
    termNumber: 1,
    termLabel: "1st Grading",
    reportCardStatus: "released",
    releasedAt: "2026-08-20T09:00:00.000Z",
    domainScores: [
      { domain: "cognitive", score: 4.2 },
      { domain: "emotional", score: 3.6 },
      { domain: "behavioral", score: 4.8 },
    ],
    compositeScore: 4.2,
    previousCompositeScore: 3.9,
  },
  {
    studentId: "STU-1002",
    studentName: "Maria Santos",
    termNumber: 1,
    termLabel: "1st Grading",
    reportCardStatus: "processing",
    releasedAt: null,
    domainScores: [
      { domain: "cognitive", score: 3.8 },
      { domain: "emotional", score: 3.5 },
      { domain: "behavioral", score: 4.0 },
    ],
    compositeScore: 3.8,
    previousCompositeScore: null,
  },
  {
    studentId: "STU-1003",
    studentName: "Pedro Reyes",
    termNumber: 1,
    termLabel: "1st Grading",
    reportCardStatus: "not_released",
    releasedAt: null,
    domainScores: [
      { domain: "cognitive", score: null },
      { domain: "emotional", score: null },
      { domain: "behavioral", score: null },
    ],
    compositeScore: null,
    previousCompositeScore: null,
  },
];

export function getMockSnapshot(
  studentId: string,
  termNumber: number
): StudentNarrativeSnapshot | undefined {
  return MOCK_STUDENT_SNAPSHOTS.find(
    (s) => s.studentId === studentId && s.termNumber === termNumber
  );
}