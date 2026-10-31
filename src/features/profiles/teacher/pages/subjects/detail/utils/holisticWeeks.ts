export interface HolisticTermWeek {
  key: string; // Monday used by the saved weekly rating, even for partial weeks.
  startDate: string;
  endDate: string;
  number: number;
}
const iso = (date: Date) => date.toISOString().slice(0, 10);
function validDate(value?: string): string | undefined {
  const date = value?.slice(0, 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const parsed = new Date(date + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && iso(parsed) === date ? date : undefined;
}
export function holisticTermWeeks(startValue?: string, endValue?: string): HolisticTermWeek[] {
  const start = validDate(startValue), end = validDate(endValue);
  if (!start || !end || start > end) return [];
  const monday = new Date(start + 'T00:00:00Z');
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const weeks: HolisticTermWeek[] = [];
  while (iso(monday) <= end) {
    const friday = new Date(monday); friday.setUTCDate(friday.getUTCDate() + 4);
    const key = iso(monday), first = key > start ? key : start, last = iso(friday) < end ? iso(friday) : end;
    if (first <= last) weeks.push({ key, startDate: first, endDate: last, number: weeks.length + 1 });
    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return weeks;
}
export function holisticWeeksInMonth(weeks: HolisticTermWeek[], month: string): HolisticTermWeek[] {
  const first = validDate(month + '-01');
  if (!first) return [];
  const next = new Date(first + 'T00:00:00Z'); next.setUTCMonth(next.getUTCMonth() + 1); next.setUTCDate(0);
  const last = iso(next);
  return weeks.flatMap(week => {
    const startDate = week.startDate > first ? week.startDate : first;
    const endDate = week.endDate < last ? week.endDate : last;
    return startDate <= endDate ? [{ ...week, startDate, endDate }] : [];
  });
}
export function holisticWeekLabel(key: string, segment?: Pick<HolisticTermWeek, 'startDate' | 'endDate'>): string {
  const start = new Date((segment?.startDate ?? key) + 'T00:00:00Z');
  const end = segment ? new Date(segment.endDate + 'T00:00:00Z') : new Date(start);
  if (!segment) end.setUTCDate(end.getUTCDate() + 4);
  const format = (date: Date) => date.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  return `${format(start)}-${start.getUTCMonth() === end.getUTCMonth() ? end.getUTCDate() : format(end)}`;
}
