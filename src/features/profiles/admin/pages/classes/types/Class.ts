import type { GradeLevel } from "../../studentrecords/types/Students";

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export const DAYS_OF_WEEK: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export interface SchedulePeriod {
  id: string;
  subject: string;
  teacherId: string; 
  days: DayOfWeek[];
  startTime: string; 
  endTime: string; 
}

export interface SchoolClass {
  id: string; 
  gradeLevel: GradeLevel;
  section: string;
  adviserId: string; 
  schedule: SchedulePeriod[];
}

export function formatClassName(c: Pick<SchoolClass, "gradeLevel" | "section">) {
  return `${c.gradeLevel} • ${c.section}`;
}

export function formatTimeRange(startTime: string, endTime: string) {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
  };
  return `${fmt(startTime)} - ${fmt(endTime)}`;
}