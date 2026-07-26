import { ChevronLeft, ChevronRight } from "lucide-react";
import { ACCENT, type CalendarTheme } from "../types/Calendar";
import { toISODate } from "../data";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];

interface MonthGridProps extends CalendarTheme {
  viewDate: Date; 
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  eventDatesISO: Set<string>; 
}

export function MonthGrid({
  viewDate,
  selectedDate,
  onSelectDate,
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
    <section className={`rounded-2xl border shadow-sm p-6 ${panelBg} ${panelBorder}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-3xl font-black tracking-tight ${textPrimary}`}>{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevMonth}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
              darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNextMonth}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
              darkMode ? "border-[#374151] text-[#D1D5DB] hover:bg-white/10" : "border-[#E5E7EB] text-[#374151] hover:bg-[#F6F7FB]"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className={`text-center text-xs font-bold ${textMuted}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const iso = toISODate(date);
          const isSelected = toISODate(selectedDate) === iso;
          const hasEvents = eventDatesISO.has(iso);

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(date)}
              className={`aspect-square rounded-xl border text-sm font-semibold flex flex-col items-start p-2 transition-colors ${
                isSelected
                  ? "text-white"
                  : darkMode
                  ? "border-[#374151] text-[#D1D5DB] hover:bg-white/5"
                  : "border-[#F0DADA] text-[#111827] hover:bg-[#FDF2F2]"
              }`}
              style={isSelected ? { background: ACCENT, borderColor: ACCENT } : undefined}
            >
              <span>{date.getDate()}</span>
              {hasEvents && (
                <span
                  className="mt-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: isSelected ? "#FFFFFF" : ACCENT }}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}