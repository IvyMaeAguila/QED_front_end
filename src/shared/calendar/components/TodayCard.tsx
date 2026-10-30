import { toISODate } from "../data";
import "../Calendar.css";

export function TodayCard() {
  const today = new Date();

  return (
    <section aria-label="Today" className="qed-calendar-today flex items-center gap-3 rounded-[12px] p-4 shadow-sm">
      <div className="qed-calendar-today-date flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg">
        <span className="text-xs font-semibold uppercase leading-tight">
          {today.toLocaleDateString(undefined, { weekday: "short" })}
        </span>
        <span className="text-2xl font-bold leading-none">{today.getDate()}</span>
      </div>
      <div className="min-w-0">
        <p className="qed-calendar-today-label text-xs font-semibold uppercase tracking-wide">Today</p>
        <time dateTime={toISODate(today)} className="qed-calendar-today-value mt-1 block text-base font-semibold leading-snug">
          {today.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </time>
      </div>
    </section>
  );
}
