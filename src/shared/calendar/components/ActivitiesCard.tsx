import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { CalendarRange, Maximize2 } from "lucide-react";
import { type CalendarActivity, type CalendarTheme } from "../types/Calendar";
import { groupActivitiesByMonth } from "../utils/Groupings";
import { toISODate, visibleCalendarEntries } from "../data";
import "../Calendar.css";
import { EntryRowActions } from "./EntryRowsAction";

interface ActivitiesCardProps extends CalendarTheme {
  loading?: boolean;
  error?: unknown;
  hasData?: boolean;
  retry?: () => void;
  view?: string;
  activities: CalendarActivity[];
  onExpand: () => void;
  viewDate?: Date;
  selectedDate?: Date;
}

interface ActivityGroupListProps {
  loading?: boolean;
  error?: unknown;
  hasData?: boolean;
  retry?: () => void;
  view?: string;
  activities: CalendarActivity[];
  darkMode: boolean;
  textMuted: string;
  onEdit?: (activity: CalendarActivity) => void;
  onDelete?: (activity: CalendarActivity) => void;
  emptyMessage?: string;
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
  const monthAbbr = new Date(activity.date.slice(0, 10) + "T00:00:00")
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  const showActions = Boolean(onEdit || onDelete);
  const safeOnEdit = onEdit ?? (() => undefined);
  const safeOnDelete = onDelete ?? (() => undefined);
  const happeningToday = isToday(activity.date);

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
        <span className="text-base font-extrabold leading-none" data-sk-region="activitiescard-span-field-1">{loading ? <SkeletonText width="2ch" /> : day}</span>
        <span className="text-xs font-bold uppercase leading-none" data-sk-region="activitiescard-span-field-2">
          {loading ? <SkeletonText width="3ch" /> : monthAbbr}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`qed-calendar-entry-title break-words text-sm font-semibold ${
            happeningToday
              ? "text-white"
              : darkMode
                ? "text-gray-200"
                : "text-gray-800"
          }`} data-sk-region="activitiescard-p-field-3"
        >
          {loading ? <SkeletonText width="16ch" /> : activity.title}
        </p>
        {happeningToday && !loading && <p className="qed-calendar-entry-meta mt-1 text-xs text-white/80">Today</p>}
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
  loading = false, error, retry, hasData, view = "calendar-activities",
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
  return <LoadingRegion name={view + "-rows"} loading={loading} error={error} retry={retry} variable retainPrevious retainOnError={hasData} hasContent={hasData ?? activities.length > 0} skeleton={null} frame={renderGroups} onSettled={() => rememberRows(view, activities.length)}>{null}</LoadingRegion>;
}

export function ActivitiesCard({
  activities,
  loading = false, error, retry, hasData,
  onExpand,
  selectedDate,
  darkMode,
  panelBg,
  panelBorder,
  textMuted,
}: ActivitiesCardProps) {
  const visibleActivities = visibleCalendarEntries(activities, selectedDate);

  return (
    <div className={`rounded-[12px] border p-5 shadow-sm ${panelBg} ${panelBorder}`}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`} data-sk-region="activitiescard-activities" data-sk-static="">
            <CalendarRange size={14} className={darkMode ? "text-[#F3B5B5]" : "text-maroon-dark"} />
            Activities
          </p>
          <p className={`mt-1 pl-5 text-xs ${textMuted}`}>{selectedDate ? selectedDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "Today and upcoming"}</p>
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
          loading={loading} error={error} retry={retry} hasData={hasData} view={"calendar-activities" + (selectedDate ? toISODate(selectedDate) : "upcoming")}
          activities={visibleActivities}
          darkMode={darkMode}
          textMuted={textMuted}
          emptyMessage={selectedDate ? "No activities on this date." : "No upcoming activities."}
        />
      </div>
    </div>
  );
}


