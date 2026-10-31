import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { lazy,Suspense,useMemo } from "react";
import { useParentDashboard } from "../context/ParentDashboardContext";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import type { CalendarViewData } from "@shared/calendar/CalendarPageView.loading-view";
import { CalendarDays } from "lucide-react";
import type { SchoolEvent } from "../types/student";
import { toISODate, visibleCalendarEntries } from "@shared/calendar/data";
import "@shared/calendar/Calendar.css";
type DatedSchoolEvent = SchoolEvent & { date?: string };
import {
  HOLIDAY_TYPE_LABELS,
  type HolidayType,
} from "@shared/calendar/types/Calendar";

export interface EventsCardProps {
  panelBg?: string;
  textPrimary?: string;
  textMuted?: string;
  darkMode?: boolean;
}

function toDayMonth(dateStr: string) {
  const day = Number(dateStr.slice(8, 10));
  const monthAbbr = new Date(dateStr.slice(0, 10) + "T00:00:00")
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  return { day, monthAbbr };
}

function EventRow({
  event,
  loading = false,
  darkMode = false,
}: {
  event: DatedSchoolEvent;
  loading?: boolean;
  darkMode?: boolean;
}) {
  const happeningToday = !loading && event.date?.slice(0, 10) === toISODate(new Date());
  return (
    <div
      data-calendar-entry={happeningToday ? "today" : "upcoming"}
      className={`qed-calendar-entry flex items-center gap-3 rounded-lg border p-2.5 ${happeningToday ? "bg-maroon border-maroon" : darkMode ? "border-border-dark bg-panel-dark" : "border-border-subtle bg-white"}`}
    >
      <div
        className={`qed-calendar-date flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-maroon-dark shadow-sm ${darkMode ? "bg-[#111827]" : "bg-white"}`}
      >
        <span className="text-base font-extrabold leading-none" data-sk-region="eventscard-span-field-1">
          {loading ? <SkeletonText width="2ch" /> : event.day}
        </span>
        <span className="text-xs font-bold uppercase leading-none" data-sk-region="eventscard-span-field-2">
          {loading ? <SkeletonText width="3ch" /> : event.month}
        </span>
      </div>
      <div className="min-w-0" data-sk-region="eventscard-div-field-3">
        <p
          className={`qed-calendar-entry-title break-words text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`} data-sk-region="eventscard-p-field-4"
        >
          {loading ? <SkeletonText width="16ch" /> : event.title}
        </p>
        {(event.holidayType || happeningToday) && (
          <p
            className={`qed-calendar-entry-meta text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`} data-sk-region="eventscard-p-field-5"
          >
            {loading ? <SkeletonText width="12ch" /> : [happeningToday ? "Today" : "", event.holidayType].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

export function EventsCardView({
  panelBg = "bg-white",
  textMuted = "text-gray-500",
  darkMode = false, calendar,
}: EventsCardProps & {calendar:Pick<CalendarViewData,"activities"|"holidays"|"loading"|"error"|"retry"|"reads">}) {
  const loading=calendar.loading,error=calendar.error;
  const events=useMemo(()=>{
    interface RawCalendarRecord {id:number;title:string;_sortKey:string;kind:'activity'|'holiday';holidayType?:HolidayType}
    const activityData=calendar.activities,holidayData=calendar.holidays;

        const filteredActivities: RawCalendarRecord[] = visibleCalendarEntries(activityData)
          .map((a) => ({
            id: a.id,
            title: a.title,
            _sortKey: a.date,
            kind: "activity",
          }));

        const filteredHolidays: RawCalendarRecord[] = visibleCalendarEntries(holidayData)
          .map((h) => ({
            id: h.id,
            title: h.title,
            _sortKey: h.date,
            kind: "holiday",
            holidayType: h.type,
          }));

        const combinedRaw: RawCalendarRecord[] = [
          ...filteredActivities,
          ...filteredHolidays,
        ].sort((a, b) => a._sortKey.localeCompare(b._sortKey));

        const combined: DatedSchoolEvent[] = combinedRaw.map((record) => {
          const { day, monthAbbr } = toDayMonth(record._sortKey);

          return {
            id: String(record.id),
            title: record.title,
            date: record._sortKey,
            day,
            month: monthAbbr,
            type: record.kind,
            holidayType: record.holidayType
              ? HOLIDAY_TYPE_LABELS[record.holidayType]
              : undefined,
          } as DatedSchoolEvent;
        });


    return combined;
  },[calendar.activities,calendar.holidays]);

  const activity = useMemo(
    () => events.filter((e) => e.type === "activity"),
    [events],
  );
  const holiday = useMemo(
    () => events.filter((e) => e.type === "holiday"),
    [events],
  );

  const renderGroups = (pending: boolean) => <>
    {([{ type: "activity", label: "Activities", items: activity, empty: "No upcoming activities." }, { type: "holiday", label: "Holidays", items: holiday, empty: "No upcoming holidays." }] as const).map(group => {
      const rows: DatedSchoolEvent[] = pending ? Array.from({ length: skeletonRows(`parent-events:${group.type}`, undefined, 64) }, (_, index) => ({ id: String(index), day: 0, month: "", title: "", holidayType: "", type: group.type })) : group.items;
      const read=calendar.reads?.[group.type==='activity'?'activities':'holidays'];
      return <LoadingRegion key={group.type} name={'parent-events-'+group.type} loading={false} error={pending?null:read?.error} retry={read?.retry} hasContent={read?.hasData??false} retainOnError={read?.hasData??false} skeleton={null}><div className={group.type === "activity" ? "mb-3" : undefined}>
        <p className={`mb-1.5 text-xs font-semibold ${textMuted}`}>{group.label}</p>
        {rows.length > 0 ? <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">{rows.map(event => <EventRow key={event.id} event={event} loading={pending} darkMode={darkMode} />)}</div> : <p className={`py-1 text-xs ${textMuted}`}>{group.empty}</p>}
      </div></LoadingRegion>;
    })}
  </>;
  return (
    <div className={`rounded-xl2 p-5 shadow-card ${panelBg}`}>
      <p
        className={`mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`} data-sk-region="eventscard-school-calendar" data-sk-static=""
      >
        <CalendarDays size={14} className="text-maroon-dark" />
        School Calendar
      </p>

      <LoadingRegion name="parent-school-events" loading={loading} error={calendar.reads?null:error} retry={calendar.retry} variable skeleton={null} frame={renderGroups} onSettled={() => { rememberRows("parent-events:activity", activity.length); rememberRows("parent-events:holiday", holiday.length); }}>{null}</LoadingRegion>
    </div>
  );
}

const Queries=lazy(()=>import('../../../query/ParentEventsQueries'));
const pendingCalendar={activities:[],holidays:[],loading:true,error:null,retry:()=>{}};
export default function EventsCard(props:EventsCardProps){
 const {isLoadingStudents,isLoadingDailyUpdates}=useParentDashboard(),preview=useRoutePreview();
 const fallback=<EventsCardView {...props} calendar={pendingCalendar}/>;
 return !preview&&!isLoadingStudents&&!isLoadingDailyUpdates?<Suspense fallback={fallback}><Queries {...props}/></Suspense>:fallback;
}
