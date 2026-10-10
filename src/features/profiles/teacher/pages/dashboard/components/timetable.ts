import type { WeeklyScheduleItem } from "../services/dashboard.service";

export const SCHOOL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const PIXELS_PER_MINUTE = 1.5;

export function timeInMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

export interface TimetableEntry {
  item: WeeklyScheduleItem;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

// Overlapping classes share the available day width instead of hiding one another.
export function layoutDay(items: WeeklyScheduleItem[]): TimetableEntry[] {
  const entries = items.flatMap(item => {
    const start = timeInMinutes(item.startTime);
    const end = timeInMinutes(item.endTime);
    return start !== null && end !== null && end > start
      ? [{ item, start, end, lane: 0, lanes: 1 }]
      : [];
  }).sort((a, b) => a.start - b.start || a.end - b.end || a.item.id - b.item.id);
  let group: TimetableEntry[] = [];
  let groupEnd = -1;
  let laneEnds: number[] = [];
  const finishGroup = () => group.forEach(entry => { entry.lanes = laneEnds.length; });
  for (const entry of entries) {
    if (entry.start >= groupEnd) {
      finishGroup();
      group = [];
      laneEnds = [];
    }
    let lane = laneEnds.findIndex(end => end <= entry.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = entry.end;
    entry.lane = lane;
    group.push(entry);
    groupEnd = Math.max(...group.map(value => value.end));
  }
  finishGroup();
  return entries;
}

export function timetableBounds(entries: TimetableEntry[]): { start: number; end: number } {
  return {
    start: Math.floor(Math.min(7 * 60, ...entries.map(entry => entry.start)) / 60) * 60,
    end: Math.ceil(Math.max(17 * 60, ...entries.map(entry => entry.end)) / 60) * 60,
  };
}

export function formatMinute(minute: number): string {
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12}${minute % 60 ? `:${String(minute % 60).padStart(2, "0")}` : ""} ${hour >= 12 && hour < 24 ? "PM" : "AM"}`;
}

export function manilaDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(now);
  const number = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return new Date(number("year"), number("month") - 1, number("day"));
}
