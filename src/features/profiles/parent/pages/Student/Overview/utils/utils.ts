import { SCHOOL_YEAR_MONTHS } from "./constants";
 
// Counts Mon–Fri in a given "YYYY-MM" key. In production, swap this for the
// actual school calendar (holidays / suspensions removed) from the backend.
export function countSchoolDays(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}
 
export function currentMonthKey(): string {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return SCHOOL_YEAR_MONTHS.some((m) => m.key === key) ? key : SCHOOL_YEAR_MONTHS[2].key;
}
 