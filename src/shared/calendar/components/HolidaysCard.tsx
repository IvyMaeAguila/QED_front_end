import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { CalendarHeart, Maximize2 } from "lucide-react";
import { HOLIDAY_TYPE_LABELS, type CalendarHoliday, type CalendarTheme } from "../types/Calendar";
import { groupHolidaysByMonth } from "../utils/Groupings";
import { toISODate, visibleCalendarEntries } from "../data";
import "../Calendar.css";
import { EntryRowActions } from "./EntryRowsAction";

interface HolidaysCardProps extends CalendarTheme {
  loading?: boolean;
  error?: unknown;
  hasData?: boolean;
  retry?: () => void;
  view?: string;
  holidays: CalendarHoliday[];
  onExpand: () => void;
  viewDate?: Date;
  selectedDate?: Date;
}

interface HolidayGroupListProps {
  loading?: boolean;
  error?: unknown;
  hasData?: boolean;
  retry?: () => void;
  view?: string;
  holidays: CalendarHoliday[];
  darkMode: boolean;
  textMuted: string;
  onEdit?: (holiday: CalendarHoliday) => void;
  onDelete?: (holiday: CalendarHoliday) => void;
  emptyMessage?: string;
}

function isToday(dateStr: string): boolean {
  return dateStr.slice(0, 10) === toISODate(new Date());
}

function HolidayRow({
  holiday,
  loading = false,
  darkMode = false,
  onEdit,
  onDelete,
}: {
  holiday: CalendarHoliday;
  loading?: boolean;
  darkMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const day = Number(holiday.date.slice(8, 10));
  const monthAbbr = new Date(holiday.date.slice(0, 10) + "T00:00:00")
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const showActions = Boolean(onEdit || onDelete);
  const safeOnEdit = onEdit ?? (() => undefined);
  const safeOnDelete = onDelete ?? (() => undefined);
  const happeningToday = isToday(holiday.date);

  return (
    <div
      data-calendar-entry={happeningToday ? "today" : "upcoming"}
      className={`qed-calendar-entry flex items-center gap-3 rounded-lg border p-3 ${
        happeningToday
          ? "border-maroon-dark bg-maroon-dark sk-surface-brand"
          : darkMode
            ? "border-border-dark bg-panel-dark"
            : "border-border-subtle bg-white"
      }`}
    >
      <div
        className={`qed-calendar-date sk-surface-card flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-maroon-dark shadow-sm ${
          darkMode ? "bg-panel-dark" : "bg-white"
        }`}
      >
        <span className="text-base font-extrabold leading-none" data-sk-region="holidayscard-span-field-1">{loading ? <SkeletonText width="2ch" /> : day}</span>
        <span className="text-xs font-bold uppercase leading-none" data-sk-region="holidayscard-span-field-2">
          {loading ? <SkeletonText width="3ch" /> : monthAbbr}
        </span>
      </div>

      <div className="min-w-0 flex-1" data-sk-region="holidayscard-div-field-3">
        <p
          className={`qed-calendar-entry-title break-words text-sm font-semibold ${
            happeningToday
              ? "text-white"
              : darkMode
                ? "text-gray-200"
                : "text-gray-800"
          }`} data-sk-region="holidayscard-p-field-4"
        >
          {loading ? <SkeletonText width="16ch" /> : holiday.title}
        </p>
        {holiday.type && (
          <p
            className={`qed-calendar-entry-meta text-xs ${
              happeningToday
                ? "text-white/80"
                : darkMode
                  ? "text-gray-500"
                  : "text-gray-500"
            }`} data-sk-region="holidayscard-p-field-5"
          >
            {loading ? <SkeletonText width="12ch" /> : `${happeningToday ? "Today · " : ""}${HOLIDAY_TYPE_LABELS[holiday.type] ?? holiday.type}`}
          </p>
        )}
      </div>

      {showActions && (
        <EntryRowActions
          darkMode={darkMode}
          onEdit={() => { if (!loading) safeOnEdit(); }}
          onDelete={() => { if (!loading) safeOnDelete(); }}
          highlighted={happeningToday}
        />
      )}
    </div>
  );
}

export function HolidayGroupList({
  holidays,
  loading = false, error, retry, hasData, view = "calendar-holidays",
  darkMode,
  textMuted,
  onEdit,
  onDelete,
  emptyMessage = "No holidays yet.",
}: HolidayGroupListProps) {
  const renderGroups = (pending: boolean) => {
    const rows: CalendarHoliday[] = pending ? Array.from({ length: skeletonRows(view, undefined, 64) }, (_, index) => ({ id: -index - 1, title: "", date: new Date().toISOString().slice(0, 10), type: "regular" })) : holidays;
  const grouped = groupHolidaysByMonth(rows);

  if (grouped.length === 0) {
    return <p className={`py-2 text-xs ${textMuted}`}>{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3" data-sk-region="holidayscard-div-field-6">
      {grouped.map(({ month, items }) => (
        <div key={month} className="mb-3">
          <p className={`mb-1.5 text-xs font-semibold ${textMuted}`} data-sk-region="holidayscard-p-field-7">
            {pending ? <SkeletonText width="14ch" /> : month}
          </p>
          <div className="flex flex-col gap-2">
            {items.map((h) => (
              <HolidayRow
                key={h.id}
                holiday={h}
                loading={pending}
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
  };
  return <LoadingRegion name={view + "-rows"} loading={loading} error={error} retry={retry} variable retainPrevious retainOnError={hasData} hasContent={hasData ?? holidays.length > 0} skeleton={null} frame={renderGroups} onSettled={() => rememberRows(view, holidays.length)}>{null}</LoadingRegion>;
}

export function HolidaysCard({
  holidays,
  loading = false, error, retry, hasData,
  onExpand,
  selectedDate,
  darkMode,
  panelBg,
  panelBorder,
  textMuted,
}: HolidaysCardProps) {
  const visibleHolidays = visibleCalendarEntries(holidays, selectedDate);

  return (
    <div className={`rounded-[12px] border p-5 shadow-sm ${panelBg} ${panelBorder}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`} data-sk-region="holidayscard-holidays" data-sk-static="">
            <CalendarHeart size={14} className={darkMode ? "text-[#F3B5B5]" : "text-maroon-dark"} />
            Holidays
          </p>
          <p className={`mt-1 pl-5 text-xs ${textMuted}`}>{selectedDate ? selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "Today and upcoming"}</p>
        </div>
        <button
          onClick={onExpand}
          aria-label="Expand holidays"
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
            darkMode
              ? "text-[#D1D5DB] hover:bg-white/10"
              : "text-[#374151] hover:bg-brand-light"
          }`}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto pr-1">
        {/* No onEdit/onDelete here — actions only appear in the expanded modal */}
        <HolidayGroupList
          loading={loading} error={error} retry={retry} hasData={hasData} view={"calendar-holidays" + (selectedDate ? toISODate(selectedDate) : "upcoming")}
          holidays={visibleHolidays}
          darkMode={darkMode}
          textMuted={textMuted}
          emptyMessage={selectedDate ? "No holidays on this date." : "No upcoming holidays."}
        />
      </div>
    </div>
  );
}


