import { CalendarRange, Maximize2 } from "lucide-react";
import { type CalendarActivity, type CalendarTheme } from "../types/Calendar";
import { groupActivitiesByMonth } from "../utils/Groupings";
import { toISODate } from "../data";
import { EntryRowActions } from "./EntryRowsAction";

interface ActivitiesCardProps extends CalendarTheme {
  activities: CalendarActivity[];
  onExpand: () => void;
  /** Ang buwan na kasalukuyang tinitingnan sa MonthGrid (viewDate) */
  viewDate?: Date;
  /** Piniling araw sa MonthGrid para maipakita lang ang mga activity nito. */
  selectedDate?: Date;
}

interface ActivityGroupListProps {
  activities: CalendarActivity[];
  darkMode: boolean;
  textMuted: string;
  onEdit?: (activity: CalendarActivity) => void;
  onDelete?: (activity: CalendarActivity) => void;
  emptyMessage?: string;
}

// --------------------------------------------------------
// Keep lang ang mga activity na nasa buwan+taon ng `referenceDate`
// (yung viewDate mula sa MonthGrid, hindi laging "today").
// Ginagamit ang toISODate() para consistent ang comparison sa
// "YYYY-MM-DD" format ng activity.date.
// --------------------------------------------------------
function filterActivitiesForMonth(
  activities: CalendarActivity[],
  referenceDate: Date
): CalendarActivity[] {
  const referenceYearMonth = toISODate(referenceDate).slice(0, 7); // "YYYY-MM"

  return activities.filter((a) => a.date.slice(0, 7) === referenceYearMonth);
}

function filterActivitiesForDate(
  activities: CalendarActivity[],
  selectedDate: Date,
): CalendarActivity[] {
  const selectedISO = toISODate(selectedDate);
  return activities.filter((activity) => activity.date.slice(0, 10) === selectedISO);
}

function isToday(dateStr: string): boolean {
  return dateStr.slice(0, 10) === toISODate(new Date());
}

function ActivityRow({
  activity,
  darkMode = false,
  onEdit,
  onDelete,
}: {
  activity: CalendarActivity;
  darkMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const day = Number(activity.date.slice(8, 10));
  const monthAbbr = new Date(activity.date)
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const showActions = Boolean(onEdit || onDelete);
  const safeOnEdit = onEdit ?? (() => undefined);
  const safeOnDelete = onDelete ?? (() => undefined);
  const happeningToday = isToday(activity.date);

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
          {activity.title}
        </p>
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

export function ActivityGroupList({
  activities,
  darkMode,
  textMuted,
  onEdit,
  onDelete,
  emptyMessage = "No activities yet.",
}: ActivityGroupListProps) {
  const grouped = groupActivitiesByMonth(activities);

  if (grouped.length === 0) {
    return <p className={`py-2 text-xs ${textMuted}`}>{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {grouped.map(({ month, items }) => (
        <div key={month} className="mb-3">
          <p className={`mb-1.5 text-[11px] font-semibold ${textMuted}`}>
            {month}
          </p>
          <div className="flex flex-col gap-2">
            {items.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                darkMode={darkMode}
                onEdit={onEdit ? () => onEdit(a) : undefined}
                onDelete={onDelete ? () => onDelete(a) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivitiesCard({
  activities,
  onExpand,
  viewDate,
  selectedDate,
  darkMode,
  panelBg,
  textMuted,
}: ActivitiesCardProps) {
  // Use the selected date when available; otherwise preserve the month view
  // for calendar card consumers that do not provide selectedDate.
  const visibleActivities = selectedDate
    ? filterActivitiesForDate(activities, selectedDate)
    : filterActivitiesForMonth(activities, viewDate ?? new Date());

  return (
    <div className={`rounded-[12px] p-5 shadow-card ${panelBg}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`}>
            <CalendarRange size={14} className="text-maroon-dark" />
            Activities
          </p>
          {selectedDate && <p className={`mt-1 pl-5 text-[11px] ${textMuted}`}>{selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>}
        </div>
        <button
          onClick={onExpand}
          aria-label="Expand activities"
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
        <ActivityGroupList
          activities={visibleActivities}
          darkMode={darkMode}
          textMuted={textMuted}
          emptyMessage={selectedDate ? "No activities on this date." : undefined}
        />
      </div>
    </div>
  );
}
