// utils/transformAttendance.ts
import type { AttendanceSummaryResponse } from "../service/AttendanceSummary.service";
import type { AttendanceTermEntry, Term } from "../types/types";

const TERM_NUMBER_MAP: Record<number, Term> = {
  1: "T1",
  2: "T2",
  3: "T3",
};

/**
 * Converts the backend's per-grading-period attendance summary into the
 * AttendanceTermEntry[] shape the ProgressReport UI expects — both the
 * term-level totals (for quick stat boxes) and the monthly breakdown
 * (for the table) are populated from the same source data.
 */
export function toAttendanceByTerm(
  response: AttendanceSummaryResponse,
): AttendanceTermEntry[] {
  const entries: AttendanceTermEntry[] = [];

  for (const gp of response.gradingPeriods) {
    const term = TERM_NUMBER_MAP[gp.termNumber];
    if (!term) continue;

    entries.push({
      term,
      present: gp.totals.present,
      absent: gp.totals.absent,
      tardiness: gp.totals.tardiness,
      excused: gp.totals.excused,
      totalDays: gp.totals.totalDays,
      months: gp.months.map((m) => ({
        month: m.monthLabel,
        schoolDays: m.totalDays,
        present: m.present,
        absent: m.absent,
        tardy: m.tardiness,
        excused: m.excused,
      })),
    });
  }

  return entries;
}