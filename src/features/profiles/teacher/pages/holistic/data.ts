import type { Student } from "../../../admin/pages/studentrecords/types/Students";
import { RATING_LEVELS, type RatingLevel } from "./types/Holistic";


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


function mockAverageFor(studentId: string): number {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) % 997;
  }
  
  const base = 3.8 + (hash % 100) / 100; 
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