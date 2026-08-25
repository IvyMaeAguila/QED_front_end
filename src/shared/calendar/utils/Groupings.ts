import type { CalendarActivity, CalendarHoliday } from "../types/Calendar";

function monthLabelOf(monthKey: string): string {
  const d = new Date(`${monthKey}-01T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "long" });
}

export interface MonthGroup<T> {
  month: string;
  items: T[];
}

function groupByMonth<T>(items: T[], getDate: (item: T) => string): MonthGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = getDate(item).slice(0, 7); // YYYY-MM
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupItems]) => ({
      month: monthLabelOf(key),
      items: [...groupItems].sort((a, b) => getDate(a).localeCompare(getDate(b))),
    }));
}

export function groupActivitiesByMonth(activities: CalendarActivity[]) {
  return groupByMonth(activities, (a) => a.date);
}

export function groupHolidaysByMonth(holidays: CalendarHoliday[]) {
  return groupByMonth(holidays, (h) => h.date);
}