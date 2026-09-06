export interface SubjectGradeEntry {
  subjectSectionId: string;
  subjectName: string;
  average: number | null | undefined;
}

/**
 * Computes an overall average across a set of subjects for a single term.
 * Returns null if there are no completed/graded subjects yet.
 *
 * Shared between the teacher-side gradebook (GradesPage) and the
 * parent-side term performance chart (StudentDetailPage) — both need the
 * exact same computation so the numbers a parent sees always match what
 * the teacher's gradebook shows.
 */
export function computeOverallAverage(
  subjectGrades: SubjectGradeEntry[]
): number | null {
  const vals = subjectGrades
    .map((s) => s.average)
    .filter((v): v is number => v !== null && v !== undefined);

  if (vals.length === 0) return null;

  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / vals.length) * 100) / 100;
}

/** Grade color-coding thresholds, shared across both account types. */
export function gradeClasses(grade: number | null | undefined) {
  if (grade === null || grade === undefined)
    return "text-gray-500 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-400";
  if (grade >= 90) return "text-[#157F3B] bg-[#EAF8EF] dark:bg-[#157F3B]/20 dark:text-[#157F3B]";
  if (grade >= 80) return "text-[#1D70D6] bg-[#EAF2FF] dark:bg-[#1D70D6]/20 dark:text-[#1D70D6]";
  if (grade >= 75) return "text-[#B45309] bg-[#FFF4DB] dark:bg-[#B45309]/20 dark:text-[#B45309]";
  return "text-[#C2255C] bg-[#FCE7F1] dark:bg-[#C2255C]/20 dark:text-[#C2255C]";
}