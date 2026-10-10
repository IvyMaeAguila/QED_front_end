import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { useMemo, useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { CalendarDays } from "lucide-react";
import type { SchoolEvent } from "../types/student";
import {
  HOLIDAY_TYPE_LABELS,
  type HolidayType,
} from "@shared/calendar/types/Calendar";
import {
  fetchCalendarActivities,
  fetchCalendarHolidays,
} from "@shared/calendar/services/calendar.service";

interface EventsCardProps {
  panelBg?: string;
  textPrimary?: string;
  textMuted?: string;
  darkMode?: boolean;
}

// --------------------------------------------------------
// "YYYY-MM" ng current month lang, para sa filter.
// --------------------------------------------------------
function getVisibleYearMonths(): string[] {
  const now = new Date();
  const toYearMonth = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  return [toYearMonth(now)];
}

function toDayMonth(dateStr: string) {
  const day = Number(dateStr.slice(8, 10));
  const monthAbbr = new Date(dateStr)
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  return { day, monthAbbr };
}

function EventRow({
  event,
  loading = false,
  darkMode = false,
}: {
  event: SchoolEvent;
  loading?: boolean;
  darkMode?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-2.5 ${darkMode ? "bg-[#1a1a1a]" : "bg-surface/60"}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-maroon-dark shadow-sm ${darkMode ? "bg-[#111827]" : "bg-white"}`}
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
          className={`truncate text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`} data-sk-region="eventscard-p-field-4"
        >
          {loading ? <SkeletonText width="16ch" /> : event.title}
        </p>
        {event.holidayType && (
          <p
            className={`truncate text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`} data-sk-region="eventscard-p-field-5"
          >
            {loading ? <SkeletonText width="12ch" /> : event.holidayType}
          </p>
        )}
      </div>
    </div>
  );
}

export default function EventsCard({
  panelBg = "bg-white",
  textMuted = "text-gray-500",
  darkMode = false,
}: EventsCardProps) {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Explicit discriminated type, para hindi mag-guess si TS
    // sa shape ng combined array (activities walang `type` field,
    // holidays may optional `type`).
    interface RawCalendarRecord {
      id: number;
      title: string;
      _sortKey: string;
      kind: "activity" | "holiday";
      holidayType?: HolidayType;
    }

    Promise.all([fetchCalendarActivities(), fetchCalendarHolidays()])
      .then(([activityData, holidayData]) => {
        if (cancelled) return;

        const visibleYearMonths = new Set(getVisibleYearMonths());

        const filteredActivities: RawCalendarRecord[] = activityData
          .filter((a) => visibleYearMonths.has(a.date.slice(0, 7)))
          .map((a) => ({
            id: a.id,
            title: a.title,
            _sortKey: a.date,
            kind: "activity",
          }));

        const filteredHolidays: RawCalendarRecord[] = holidayData
          .filter((h) => visibleYearMonths.has(h.date.slice(0, 7)))
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

        const combined: SchoolEvent[] = combinedRaw.map((record) => {
          const { day, monthAbbr } = toDayMonth(record._sortKey);

          return {
            id: String(record.id),
            title: record.title,
            day,
            month: monthAbbr,
            type: record.kind,
            holidayType: record.holidayType
              ? HOLIDAY_TYPE_LABELS[record.holidayType]
              : undefined,
          } as SchoolEvent;
        });

        setEvents(combined);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load events.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const activity = useMemo(
    () => events.filter((e) => e.type === "activity"),
    [events],
  );
  const holiday = useMemo(
    () => events.filter((e) => e.type === "holiday"),
    [events],
  );

  const renderGroups = (pending: boolean) => <>
    {([{ type: "activity", label: "Activities", items: activity, empty: "No upcoming activities recorded for this month." }, { type: "holiday", label: "Holidays", items: holiday, empty: "There are no official holidays scheduled for this month." }] as const).map(group => {
      const rows: SchoolEvent[] = pending ? Array.from({ length: skeletonRows(`parent-events:${group.type}`, undefined, 64) }, (_, index) => ({ id: String(index), day: 0, month: "", title: "", holidayType: "", type: group.type })) : group.items;
      return <div key={group.type} className={group.type === "activity" ? "mb-3" : undefined}>
        <p className={`mb-1.5 text-xs font-semibold ${textMuted}`}>{group.label}</p>
        {rows.length > 0 ? <div className="flex flex-col gap-2">{rows.map(event => <EventRow key={event.id} event={event} loading={pending} darkMode={darkMode} />)}</div> : <p className={`py-1 text-xs ${textMuted}`}>{group.empty}</p>}
      </div>;
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

      <LoadingRegion name="parent-school-events" loading={loading} error={error} retry={() => setAttempt(value => value + 1)} variable skeleton={null} frame={renderGroups} onSettled={() => { rememberRows("parent-events:activity", activity.length); rememberRows("parent-events:holiday", holiday.length); }}>{null}</LoadingRegion>
    </div>
  );
}
