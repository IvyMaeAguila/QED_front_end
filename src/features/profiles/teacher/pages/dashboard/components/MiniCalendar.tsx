import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MiniCalendar({ panelBg, panelBorder, textPrimary, textMuted }: MiniCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const goToMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  return (
    <div
      className={`rounded-2xl border p-6 ${panelBg} ${panelBorder}`}
      style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
    >
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => goToMonth(-1)}
          aria-label="Previous month"
          className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors ${textMuted}`}
        >
          <ChevronLeft size={16} />
        </button>
        <p className={`text-[15px] font-bold ${textPrimary}`}>
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors ${textMuted}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className={`text-[10px] font-bold ${textMuted}`}>
            {d}
          </span>
        ))}

        {cells.map((day, i) =>
          day === null ? (
            <span key={`empty-${i}`} />
          ) : (
            <span
              key={day}
              className={`mx-auto w-7 h-7 flex items-center justify-center rounded-full text-[13px] font-semibold transition-colors ${
                isToday(day) ? "text-white" : `${textPrimary} hover:bg-black/5`
              }`}
              style={isToday(day) ? { background: "#8B0D0D" } : undefined}
            >
              {day}
            </span>
          )
        )}
      </div>
    </div>
  );
}