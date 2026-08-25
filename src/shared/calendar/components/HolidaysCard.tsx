import { CalendarHeart, Maximize2 } from "lucide-react";
import { HOLIDAY_TYPE_LABELS, type CalendarHoliday, type CalendarTheme } from "../types/Calendar";
import { groupHolidaysByMonth } from "../utils/Groupings";
import { toISODate } from "../data";
import { EntryRowActions } from "./EntryRowsAction";

interface HolidaysCardProps extends CalendarTheme {
  holidays: CalendarHoliday[];
  onExpand: () => void;
  /** Ang buwan na kasalukuyang tinitingnan sa MonthGrid (viewDate) */
  viewDate?: Date;
}

interface HolidayGroupListProps {
  holidays: CalendarHoliday[];
  darkMode: boolean;
  textMuted: string;
  onEdit?: (holiday: CalendarHoliday) => void;
  onDelete?: (holiday: CalendarHoliday) => void;
}

// --------------------------------------------------------
// Keep lang ang mga holiday na nasa buwan+taon ng `referenceDate`
// (yung viewDate mula sa MonthGrid, hindi laging "today").
// Ginagamit ang toISODate() para consistent ang comparison sa
// "YYYY-MM-DD" format ng holiday.date.
// --------------------------------------------------------
function filterHolidaysForMonth(
  holidays: CalendarHoliday[],
  referenceDate: Date
): CalendarHoliday[] {
  const referenceYearMonth = toISODate(referenceDate).slice(0, 7); // "YYYY-MM"

  return holidays.filter((h) => h.date.slice(0, 7) === referenceYearMonth);
}

function isToday(dateStr: string): boolean {
  return dateStr.slice(0, 10) === toISODate(new Date());
}

function HolidayRow({
  holiday,
  darkMode = false,
  onEdit,
  onDelete,
}: {
  holiday: CalendarHoliday;
  darkMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const day = Number(holiday.date.slice(8, 10));
  const monthAbbr = new Date(holiday.date)
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const showActions = Boolean(onEdit || onDelete);
  const safeOnEdit = onEdit ?? (() => undefined);
  const safeOnDelete = onDelete ?? (() => undefined);
  const happeningToday = isToday(holiday.date);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-2.5 ${
        happeningToday
          ? "bg-maroon-dark"
          : darkMode
            ? "bg-[#1a1a1a]"
            : "bg-surface/60"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-maroon-dark shadow-sm ${
          darkMode ? "bg-[#111827]" : "bg-white"
        }`}
      >
        <span className="text-base font-extrabold leading-none">{day}</span>
        <span className="text-[9px] font-bold uppercase leading-none">
          {monthAbbr}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-semibold ${
            happeningToday
              ? "text-white"
              : darkMode
                ? "text-gray-200"
                : "text-gray-800"
          }`}
        >
          {holiday.title}
        </p>
        {holiday.type && (
          <p
            className={`truncate text-[11px] ${
              happeningToday
                ? "text-white/80"
                : darkMode
                  ? "text-gray-500"
                  : "text-gray-500"
            }`}
          >
            {HOLIDAY_TYPE_LABELS[holiday.type]}
          </p>
        )}
      </div>

      {showActions && (
        <EntryRowActions
          darkMode={darkMode}
          onEdit={safeOnEdit}
          onDelete={safeOnDelete}
          highlighted={happeningToday}
        />
      )}
    </div>
  );
}

export function HolidayGroupList({
  holidays,
  darkMode,
  textMuted,
  onEdit,
  onDelete,
}: HolidayGroupListProps) {
  const grouped = groupHolidaysByMonth(holidays);

  if (grouped.length === 0) {
    return <p className={`py-2 text-xs ${textMuted}`}>No holidays yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {grouped.map(({ month, items }) => (
        <div key={month} className="mb-3">
          <p className={`mb-1.5 text-[11px] font-semibold ${textMuted}`}>
            {month}
          </p>
          <div className="flex flex-col gap-2">
            {items.map((h) => (
              <HolidayRow
                key={h.id}
                holiday={h}
                darkMode={darkMode}
                onEdit={onEdit ? () => onEdit(h) : undefined}
                onDelete={onDelete ? () => onDelete(h) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HolidaysCard({
  holidays,
  onExpand,
  viewDate,
  darkMode,
  panelBg,
  textPrimary,
  textMuted,
}: HolidaysCardProps) {
  // Ipapakita lang dito sa card ang mga holiday ng buwang
  // kasalukuyang tinitingnan sa MonthGrid (viewDate), hindi
  // laging "this month" base sa totoong petsa ngayon.
  // Fallback sa "today" kung sakaling hindi naipasa ang viewDate.
  const currentMonthHolidays = filterHolidaysForMonth(
    holidays,
    viewDate ?? new Date()
  );

  return (
    <div className={`rounded-xl2 p-5 shadow-card ${panelBg}`}>
      <div className="mb-3 flex items-center justify-between">
        <p
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`}
        >
          <CalendarHeart size={14} className="text-maroon-dark" />
          Holidays
        </p>
        <button
          onClick={onExpand}
          aria-label="Expand holidays"
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
            darkMode
              ? "text-[#D1D5DB] hover:bg-white/10"
              : "text-[#374151] hover:bg-[#F6F7FB]"
          }`}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto pr-1">
        {/* No onEdit/onDelete here — actions only appear in the expanded modal */}
        <HolidayGroupList
          holidays={currentMonthHolidays}
          darkMode={darkMode}
          textMuted={textMuted}
        />
      </div>
    </div>
  );
}