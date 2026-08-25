import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarCheck2 } from "lucide-react";

interface MiniCalendarProps {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MiniCalendar({ panelBg, panelBorder, textPrimary, textMuted, darkMode }: MiniCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonthView = month === today.getMonth() && year === today.getFullYear();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isWeekend = (index: number) => index % 7 === 0 || index % 7 === 6;

  const goToMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  const goToToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <div
      className={`h-full flex flex-col rounded-2xl border overflow-hidden ${panelBg} ${panelBorder}`}
      style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
    >
      {/* Header band */}
      <div
        className="relative px-6 pt-5 pb-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #8B0D0D 0%, #6B0000 100%)" }}
      >
        <div
          className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
        />
        <div className="relative flex items-center justify-between">
          <button
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
              {year}
            </p>
            <p className="text-[16px] font-black text-white leading-tight">
              {MONTH_NAMES[month]}
            </p>
          </div>

          <button
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {!isCurrentMonthView && (
          <button
            onClick={goToToday}
            className="relative mt-3 mx-auto flex items-center gap-1.5 text-[10px] font-bold text-white/90 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
          >
            <CalendarCheck2 size={11} />
            Jump to today
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 flex flex-col px-6 pt-5 pb-6">
        <div className="grid grid-cols-7 mb-3">
          {WEEKDAYS.map((d, i) => (
            <span
              key={`${d}-${i}`}
              className={`text-center text-[10px] font-bold ${
                i === 0 || i === 6 ? "text-[#8B0D0D]/60" : textMuted
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 gap-y-2 content-center">
          {cells.map((day, i) =>
            day === null ? (
              <span key={`empty-${i}`} />
            ) : (
              <div key={day} className="flex items-center justify-center">
                <button
                  className={`relative w-8 h-8 flex items-center justify-center rounded-full text-[12.5px] font-bold transition-all ${
                    isToday(day)
                      ? "text-white scale-100"
                      : isWeekend(i)
                      ? "text-[#8B0D0D]/70 hover:bg-black/5"
                      : `${textPrimary} hover:bg-black/5`
                  }`}
                  style={
                    isToday(day)
                      ? {
                          background: "linear-gradient(135deg, #8B0D0D 0%, #6B0000 100%)",
                          boxShadow: "0 4px 10px -2px rgba(139,13,13,0.5)",
                        }
                      : undefined
                  }
                >
                  {day}
                  {isToday(day) && (
                    <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-[#8B0D0D]" />
                  )}
                </button>
              </div>
            )
          )}
        </div>

        {/* Footer legend */}
        <div
          className="mt-5 pt-4 flex items-center justify-between border-t"
          style={{ borderColor: darkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: "linear-gradient(135deg, #8B0D0D 0%, #6B0000 100%)" }}
            />
            <span className={`text-[10.5px] font-semibold ${textMuted}`}>Today</span>
          </div>
          <span className={`text-[10.5px] font-bold ${textPrimary}`}>
            {today.toLocaleDateString(undefined, { weekday: "long" })}
          </span>
        </div>
      </div>
    </div>
  );
}