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
  /** Piniling araw sa MonthGrid para maipakita lang ang mga holiday nito. */
  selectedDate?: Date;
}

interface HolidayGroupListProps {
  holidays: CalendarHoliday[];
  darkMode: boolean;
  textMuted: string;
  onEdit?: (holiday: CalendarHoliday) => void;
  onDelete?: (holiday: CalendarHoliday) => void;
  emptyMessage?: string;
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

function filterHolidaysForDate(
  holidays: CalendarHoliday[],
  selectedDate: Date,
): CalendarHoliday[] {
  const selectedISO = toISODate(selectedDate);
  return holidays.filter((holiday) => holiday.date.slice(0, 10) === selectedISO);
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
            ? "bg-[#241614]"
            : "bg-surface/60"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-maroon-dark shadow-sm ${
          darkMode ? "bg-[#2A1A18]" : "bg-white"
        }`}
      >
        <span className="text-base font-extrabold leading-none">{day}</span>
        <span className="text-xs font-bold uppercase leading-none">
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
            className={`truncate text-xs ${
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
  emptyMessage = "No holidays yet.",
}: HolidayGroupListProps) {
  const grouped = groupHolidaysByMonth(holidays);

  if (grouped.length === 0) {
    return <p className={`py-2 text-xs ${textMuted}`}>{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {grouped.map(({ month, items }) => (
        <div key={month} className="mb-3">
          <p className={`mb-1.5 text-xs font-semibold ${textMuted}`}>
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
  selectedDate,
  darkMode,
  panelBg,
  textMuted,
}: HolidaysCardProps) {
  // Use the selected date when available; otherwise preserve the month view
  // for calendar card consumers that do not provide selectedDate.
  const visibleHolidays = selectedDate
    ? filterHolidaysForDate(holidays, selectedDate)
    : filterHolidaysForMonth(holidays, viewDate ?? new Date());

  return (
    <div className={`rounded-[12px] p-5 shadow-card ${panelBg}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`}>
            <CalendarHeart size={14} className="text-maroon-dark" />
            Holidays
          </p>
          {selectedDate && <p className={`mt-1 pl-5 text-xs ${textMuted}`}>{selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>}
        </div>
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
          holidays={visibleHolidays}
          darkMode={darkMode}
          textMuted={textMuted}
          emptyMessage={selectedDate ? "No holidays on this date." : undefined}
        />
      </div>
    </div>
  );
}
