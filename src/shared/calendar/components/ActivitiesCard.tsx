import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { CalendarRange, Maximize2 } from "lucide-react";
import { type CalendarActivity, type CalendarTheme } from "../types/Calendar";
import { groupActivitiesByMonth } from "../utils/Groupings";
import { toISODate } from "../data";
import { EntryRowActions } from "./EntryRowsAction";

interface ActivitiesCardProps extends CalendarTheme {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  view?: string;
  activities: CalendarActivity[];
  onExpand: () => void;
  /** Ang buwan na kasalukuyang tinitingnan sa MonthGrid (viewDate) */
  viewDate?: Date;
  /** Piniling araw sa MonthGrid para maipakita lang ang mga activity nito. */
  selectedDate?: Date;
}

interface ActivityGroupListProps {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  view?: string;
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
  loading = false,
  darkMode = false,
  onEdit,
  onDelete,
}: {
  activity: CalendarActivity;
  loading?: boolean;
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
          ? "bg-maroon-dark sk-surface-brand"
          : darkMode
            ? "bg-[#241614]"
            : "bg-surface/60"
      }`}
    >
      <div
        className={`sk-surface-card flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-maroon-dark shadow-sm ${
          darkMode ? "bg-panel-dark" : "bg-white"
        }`}
      >
        <span className="text-base font-extrabold leading-none" data-sk-region="activitiescard-span-field-1">{loading ? <SkeletonText width="2ch" /> : day}</span>
        <span className="text-xs font-bold uppercase leading-none" data-sk-region="activitiescard-span-field-2">
          {loading ? <SkeletonText width="3ch" /> : monthAbbr}
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
          }`} data-sk-region="activitiescard-p-field-3"
        >
          {loading ? <SkeletonText width="16ch" /> : activity.title}
        </p>
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

export function ActivityGroupList({
  activities,
  loading = false, error, retry, view = "calendar-activities",
  darkMode,
  textMuted,
  onEdit,
  onDelete,
  emptyMessage = "No activities yet.",
}: ActivityGroupListProps) {
  const renderGroups = (pending: boolean) => {
    const rows: CalendarActivity[] = pending ? Array.from({ length: skeletonRows(view, undefined, 64) }, (_, index) => ({ id: -index - 1, title: "", date: new Date().toISOString().slice(0, 10) })) : activities;
  const grouped = groupActivitiesByMonth(rows);

  if (grouped.length === 0) {
    return <p className={`py-2 text-xs ${textMuted}`}>{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3" data-sk-region="activitiescard-div-field-4">
      {grouped.map(({ month, items }) => (
        <div key={month} className="mb-3">
          <p className={`mb-1.5 text-xs font-semibold ${textMuted}`} data-sk-region="activitiescard-p-field-5">
            {pending ? <SkeletonText width="14ch" /> : month}
          </p>
          <div className="flex flex-col gap-2">
            {items.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                loading={pending}
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
  };
  return <LoadingRegion name={view + "-rows"} loading={loading} error={error} retry={retry} variable retainPrevious hasContent={activities.length > 0} skeleton={null} frame={renderGroups} onSettled={() => rememberRows(view, activities.length)}>{null}</LoadingRegion>;
}

export function ActivitiesCard({
  activities,
  loading = false, error, retry,
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
          <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`} data-sk-region="activitiescard-activities" data-sk-static="">
            <CalendarRange size={14} className="text-maroon-dark" />
            Activities
          </p>
          {selectedDate && <p className={`mt-1 pl-5 text-xs ${textMuted}`}>{selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>}
        </div>
        <button
          onClick={onExpand}
          aria-label="Expand activities"
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
        <ActivityGroupList
          loading={loading} error={error} retry={retry} view={"calendar-activities" + (selectedDate?.toISOString().slice(0,10) ?? viewDate?.toISOString().slice(0,7) ?? "current")}
          activities={visibleActivities}
          darkMode={darkMode}
          textMuted={textMuted}
          emptyMessage={selectedDate ? "No activities on this date." : undefined}
        />
      </div>
    </div>
  );
}


