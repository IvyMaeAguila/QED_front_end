
import type { ScheduleEntry } from "../data/types";

export const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export interface DaySchedule {
  day: string;
  entries: ScheduleEntry[];
}

// Groups a flat schedule into weekday-ordered buckets, each entry list
// sorted by start time, and drops days with no entries.
export function groupScheduleByDay(schedule: ScheduleEntry[]): DaySchedule[] {
  return DAY_ORDER.map((day) => ({
    day,
    entries: schedule.filter((e) => e.day === day).sort((a, b) => a.time.localeCompare(b.time)),
  })).filter((d) => d.entries.length > 0);
}
