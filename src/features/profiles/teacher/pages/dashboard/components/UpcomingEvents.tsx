import { CalendarDays } from "lucide-react";

export interface EventItem {
  id: string;
  title: string;
  type: "activity" | "holiday";
  day: number;
  month: string; // e.g. "SEP"
  holidayType?: string;
}

interface UpcomingEventsProps {
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
}: {
  event: EventItem;
  darkMode: boolean;
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
          <p className="truncate text-[11px] text-gray-500">
            {event.holidayType}
          </p>
        )}
      </div>
    </div>
  );
}

export function UpcomingEvents({
  events,
  panelBg,
  textMuted,
  darkMode,
}: UpcomingEventsProps) {
  const activities = events.filter((e) => e.type === "activity");
  const holidays = events.filter((e) => e.type === "holiday");

  return (
    <div className={`rounded-xl2 p-4 sm:p-5 shadow-card ${panelBg}`}>
      <p
        className={`mb-2.5 sm:mb-3 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide ${textMuted}`}
      >
        <CalendarDays size={13} className="text-maroon-dark shrink-0 sm:hidden" />
        <CalendarDays size={14} className="text-maroon-dark shrink-0 hidden sm:block" />
        School Calendar
      </p>

      <div className="mb-3">
        <p className={`mb-1.5 text-[10.5px] sm:text-[11px] font-semibold ${textMuted}`}>
          Activities
        </p>
        {activities.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {activities.map((event) => (
              <EventRow key={event.id} event={event} darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <p className={`py-1 text-[11px] sm:text-xs ${textMuted}`}>
            No upcoming activities recorded for this month.
          </p>
        )}
      </div>

      <div>
        <p className={`mb-1.5 text-[10.5px] sm:text-[11px] font-semibold ${textMuted}`}>
          Holidays
        </p>
        {holidays.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {holidays.map((event) => (
              <EventRow key={event.id} event={event} darkMode={darkMode} />
            ))}
          </div>
        ) : (
          <p className={`py-1 text-[11px] sm:text-xs ${textMuted}`}>
            There are no official holidays scheduled for this month.
          </p>
        )}
      </div>
    </div>
  );
}