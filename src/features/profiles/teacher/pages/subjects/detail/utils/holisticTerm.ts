import type { GradingPeriod } from "../types/Grading";

export function currentHolisticPeriod(periods: GradingPeriod[], now = new Date()): GradingPeriod | undefined {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)?.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const matching = periods.filter(period => period.startDate?.slice(0, 10) <= today && period.endDate?.slice(0, 10) >= today);
  if (matching.length === 1) return matching[0];
  // Legacy responses may not include dates; the backend still validates every write.
  if (periods.every(period => !period.startDate || !period.endDate)) return periods.find(period => period.isActive);
  return undefined;
}
