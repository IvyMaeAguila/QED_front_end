import { ChevronLeft, ChevronRight } from "lucide-react";
import { ACCENT, type CalendarTheme } from "../types/Calendar";
import { toISODate } from "../data";
import "../Calendar.css";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

interface MonthGridProps extends CalendarTheme {
  viewDate: Date; 
  selectedDate?: Date;
  onToday?: () => void;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  eventDatesISO: Set<string>; 
}

export function MonthGrid({
  viewDate,
  selectedDate,
  onSelectDate,
  onToday,
  onPrevMonth,
  onNextMonth,
  eventDatesISO,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: MonthGridProps) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <section className={`rounded-[12px] border shadow-sm p-4 sm:p-5 ${panelBg} ${panelBorder}`}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${textPrimary}`}>{monthLabel}</h2>
        <div className="flex items-center gap-2">
          {onToday && <button type="button" onClick={onToday} className={`h-9 rounded-lg border px-3 text-sm font-semibold ${panelBorder} ${textPrimary}`}>Today</button>}
          <button
            aria-label="Previous month"
            onClick={onPrevMonth}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
              darkMode ? "border-border-dark text-[#D1D5DB] hover:bg-white/10" : "border-border-subtle text-[#374151] hover:bg-brand-light"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next month"
            onClick={onNextMonth}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
              darkMode ? "border-border-dark text-[#D1D5DB] hover:bg-white/10" : "border-border-subtle text-[#374151] hover:bg-brand-light"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className={`text-center text-xs font-bold ${textMuted}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const iso = toISODate(date);
          const isSelected = !!selectedDate && toISODate(selectedDate) === iso;
          const isToday = toISODate(new Date()) === iso;
          const hasEvents = eventDatesISO.has(iso);

          return (
            <button
              key={iso}
              aria-label={date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelectDate(date)}
              className={`qed-calendar-day min-h-14 sm:min-h-20 rounded-lg border text-sm font-semibold flex flex-col items-start p-2 transition-colors ${
                isToday
                  ? "text-white"
                  : darkMode
                  ? "border-border-dark text-[#D1D5DB] hover:bg-white/5"
                  : "border-border-subtle text-[#111827] hover:bg-[#FDF2F2]"
              }`}
              style={{ ...(isToday ? { background: ACCENT, borderColor: ACCENT } : {}), ...(isSelected ? { outline: `2px solid ${ACCENT}`, outlineOffset: "2px" } : {}) }}
            >
              <span>{date.getDate()}</span>
              {hasEvents && (
                <span
                  className="mt-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: isToday ? "#FFFFFF" : ACCENT }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className={`mt-4 flex flex-wrap items-center gap-4 text-xs ${textMuted}`}>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-maroon-dark" />Today</span>
        <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-maroon-dark" />Scheduled event</span>
        <span>Choose a date to view its events.</span>
      </div>
    </section>
  );
}
