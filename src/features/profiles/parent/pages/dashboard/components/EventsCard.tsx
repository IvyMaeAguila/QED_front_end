import { useEffect, useMemo, useState } from "react";
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
  darkMode = false,
}: {
  event: SchoolEvent;
  darkMode?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-2.5 ${darkMode ? "bg-[#1a1a1a]" : "bg-surface/60"}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-maroon-dark shadow-sm ${darkMode ? "bg-[#111827]" : "bg-white"}`}
      >
        <span className="text-base font-extrabold leading-none">
          {event.day}
        </span>
        <span className="text-[9px] font-bold uppercase leading-none">
          {event.month}
        </span>
      </div>
      <div className="min-w-0">
        <p
          className={`truncate text-xs font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}
        >
          {event.title}
        </p>
        {event.holidayType && (
          <p
            className={`truncate text-[11px] ${darkMode ? "text-gray-500" : "text-gray-500"}`}
          >
            {event.holidayType}
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
  }, []);

  const activity = useMemo(
    () => events.filter((e) => e.type === "activity"),
    [events],
  );
  const holiday = useMemo(
    () => events.filter((e) => e.type === "holiday"),
    [events],
  );

  return (
    <div className={`rounded-xl2 p-5 shadow-card ${panelBg}`}>
      <p
        className={`mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${textMuted}`}
      >
        <CalendarDays size={14} className="text-maroon-dark" />
        School Calendar
      </p>

      {loading && (
        <p className={`py-2 text-xs ${textMuted}`}>Loading events…</p>
      )}

      {!loading && error && (
        <p className="py-2 text-xs font-semibold text-[#B91C1C]">{error}</p>
      )}

      {!loading && !error && (
        <>
          <div className="mb-3">
            <p className={`mb-1.5 text-[11px] font-semibold ${textMuted}`}>
              Activities
            </p>
            {activity.length > 0 ? (
              <div className="flex flex-col gap-2">
                {activity.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            ) : (
              <p className={`py-1 text-xs ${textMuted}`}>
                Walang activity ngayong buwan.
              </p>
            )}
          </div>

          <div>
            <p className={`mb-1.5 text-[11px] font-semibold ${textMuted}`}>
              Holidays
            </p>
            {holiday.length > 0 ? (
              <div className="flex flex-col gap-2">
                {holiday.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            ) : (
              <p className={`py-1 text-xs ${textMuted}`}>
                Walang holiday ngayong buwan.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}