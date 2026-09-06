
// swap the body of each function for a real fetch when the endpoint
// exists — callers (hooks) don't need to change.
import { GRADE_LEVELS, SCHOOL_YEAR, STUDENTS_BY_GRADE, SUBJECTS } from "../data/mockData";
import type { GradeLevelSummary, Student } from "../data/types";

const MOCK_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

// TODO: GET /api/principal/gradebooks
export function fetchGradeLevels(): Promise<GradeLevelSummary[]> {
  return delay(GRADE_LEVELS);
}

// TODO: GET /api/school-year/active
export function fetchSchoolYear(): Promise<string> {
  return delay(SCHOOL_YEAR);
}

// TODO: GET /api/principal/gradebooks/subjects
export function fetchSubjects(): Promise<string[]> {
  return delay(SUBJECTS);
}

// TODO: GET /api/principal/gradebooks/:grade/students
// Returns null when the grade has no record at all (a bad/unknown grade
// param), so the hook can distinguish a genuine not-found from an empty
// but valid roster.
export function fetchStudentsByGrade(grade: string): Promise<Student[] | null> {
  const students = STUDENTS_BY_GRADE[grade];
  return delay(students ?? null);
}
