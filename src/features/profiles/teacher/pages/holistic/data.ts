import type { Student } from "../../../admin/pages/studentrecords/types/Students";
import { RATING_LEVELS, type RatingLevel } from "./types/Holistic";

// Buckets a 1-5 average into the same 5-level vocabulary used for individual
// axis ratings, so a class-wide "Good" means the same thing as a per-axis "Good".
export function getRatingLevelForAverage(average: number): RatingLevel {
  if (average >= 4.5) return RATING_LEVELS[4]; // Excellent
  if (average >= 3.5) return RATING_LEVELS[3]; // Good
  if (average >= 2.5) return RATING_LEVELS[2]; // Fair
  if (average >= 1.5) return RATING_LEVELS[1]; // Needs Improvement
  return RATING_LEVELS[0]; // Critical
}

export interface StudentHolisticOverview {
  student: Student;
  average: number; // 1-5
  level: RatingLevel;
}

// Deterministic mock score per student (stable across re-renders) so the
// roster isn't empty before a real backend exists. Swap buildOverview() for
// a real fetch keyed by class/term once holistic assessments are persisted.
function mockAverageFor(studentId: string): number {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) % 997;
  }
  // Skew toward the 3.8–4.6 "Good" band like the sample roster, with a few
  // outliers, rather than a flat random spread.
  const base = 3.8 + (hash % 100) / 100; // 3.80–4.79
  const isOutlier = hash % 11 === 0;
  if (!isOutlier) return Math.min(5, Math.round(base * 10) / 10);
  const outlierPool = [1.4, 2.7, 4.5];
  return outlierPool[hash % outlierPool.length];
}

export function buildOverview(students: Student[]): StudentHolisticOverview[] {
  return students.map((student) => {
    const average = mockAverageFor(student.id);
    return { student, average, level: getRatingLevelForAverage(average) };
  });
}