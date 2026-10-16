import { CalendarDays } from "lucide-react";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";

export interface EventItem {
  id: string;
  title: string;
  type: "activity" | "holiday";
  day: number;
  month: string; // e.g. "SEP"
  holidayType?: string;
}

interface UpcomingEventsProps {
  loading?: boolean;
  events: EventItem[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

function EventRow({
  event,
  darkMode,
  loading = false,
}: {
  event: EventItem;
  darkMode: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-2.5 ${darkMode ? "bg-[#241614]" : "bg-surface/60"}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-maroon-dark shadow-sm ${darkMode ? "bg-panel-dark" : "bg-white"}`}
      >
        <span className="text-base font-extrabold leading-none" data-sk-region="upcomingevents-span-field-1">
          {loading ? <SkeletonText width="2ch"/> : event.day}
        </span>
        <span className="text-xs font-bold uppercase leading-none" data-sk-region="upcomingevents-span-field-2">
          {loading ? <SkeletonText width="3ch"/> : event.month}
        </span>
      </div>
      <div className="min-w-0" data-sk-region="upcomingevents-div-field-3">
        <p
          className={`truncate text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`} data-sk-region="upcomingevents-p-field-4"
        >
          {loading ? <SkeletonText width="10rem"/> : event.title}
        </p>
        {event.holidayType && (
          <p className="truncate text-xs text-gray-500" data-sk-region="upcomingevents-p-field-5">
            {loading ? <SkeletonText width="7rem"/> : event.holidayType}
          </p>
        )}
      </div>
    </div>
  );
}

export function UpcomingEvents({
  loading = false,
  events,
  panelBg,
  textMuted,
  darkMode,
}: UpcomingEventsProps) {
  const activities = events.filter((e) => e.type === "activity");
  const holidays = events.filter((e) => e.type === "holiday");
  if (!loading) { rememberRows("teacher/events/activities", activities.length); rememberRows("teacher/events/holidays", holidays.length); }
  const renderRows = (items: EventItem[], skeleton = false, type: "activity" | "holiday" = "activity") => (
    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
      {(skeleton ? Array.from({ length: Math.min(3, skeletonRows(`teacher/events/${type === "activity" ? "activities" : "holidays"}`, undefined, 64)) }, (_, i) => ({ id: `pending-${i}`, title: "", type, day: 0, month: "", holidayType: undefined })) : items).map(event => (
        <EventRow key={event.id} event={event} darkMode={darkMode} loading={skeleton}/>
      ))}
    </div>
  );

  return (
    <div className={`rounded-[12px] p-4 sm:p-5 shadow-card ${panelBg}`}>
      <p
        className={`mb-2.5 sm:mb-3 flex items-center gap-1.5 text-xs sm:text-xs font-bold uppercase tracking-wide ${textMuted}`} data-sk-region="upcomingevents-school-calendar" data-sk-static=""
      >
        <CalendarDays size={13} className="text-maroon-dark shrink-0 sm:hidden" />
        <CalendarDays size={14} className="text-maroon-dark shrink-0 hidden sm:block" />
        School Calendar
      </p>

      <div className="mb-3">
        <p className={`mb-1.5 text-xs sm:text-xs font-semibold ${textMuted}`} data-sk-region="upcomingevents-activities" data-sk-static="">
          Activities
        </p>
        <LoadingRegion loading={loading} variable skeleton={renderRows([], true)}>
        {activities.length > 0 ? (
          renderRows(activities)
        ) : (
          <p className={`py-1 text-xs sm:text-xs ${textMuted}`} data-sk-region="upcomingevents-no-upcoming-activities-recorded-for-this-mont" data-sk-static="">
            No upcoming activities recorded for this month.
          </p>
        )}
        </LoadingRegion>
      </div>

      <div>
        <p className={`mb-1.5 text-xs sm:text-xs font-semibold ${textMuted}`} data-sk-region="upcomingevents-holidays" data-sk-static="">
          Holidays
        </p>
        <LoadingRegion loading={loading} variable skeleton={renderRows([], true, "holiday")}>
        {holidays.length > 0 ? (
          renderRows(holidays)
        ) : (
          <p className={`py-1 text-xs sm:text-xs ${textMuted}`} data-sk-region="upcomingevents-there-are-no-official-holidays-scheduled-for-" data-sk-static="">
            There are no official holidays scheduled for this month.
          </p>
        )}
        </LoadingRegion>
      </div>
    </div>
  );
}
