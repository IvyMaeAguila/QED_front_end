import { Plus, Clock, Pencil } from "lucide-react";
import { ACCENT, type CalendarEvent, type CalendarTheme } from "../types/Calendar";
import { formatRelativeDay, formatTimeRange } from "../data";

interface UpcomingEventsPanelProps extends CalendarTheme {
  todayEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[]; // filtered to what the viewer may see, sorted ascending, excludes today
  canPost: boolean;
  onCreateClick: () => void;
  canEditEvent: (event: CalendarEvent) => boolean;
  onEditClick: (event: CalendarEvent) => void;
}

function EventCard({
  event,
  editable,
  onEditClick,
  panelBorder,
  textPrimary,
  textMuted,
}: {
  event: CalendarEvent;
  editable: boolean;
  onEditClick: (event: CalendarEvent) => void;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}) {
  const timeLabel = formatTimeRange(event.startTime, event.endTime);
  return (
    <div className={`rounded-xl border overflow-hidden ${panelBorder}`}>
      <div className="h-1.5" style={{ background: ACCENT }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-bold text-sm leading-snug ${textPrimary}`}>{event.title}</p>
          {editable && (
            <button
              onClick={() => onEditClick(event)}
              aria-label="Edit announcement"
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors border hover:bg-black/5 ${panelBorder}`}
            >
              <Pencil size={13} className={textMuted} />
            </button>
          )}
        </div>
        <p className={`text-xs font-semibold mt-1 ${textMuted}`}>{formatRelativeDay(event.date)}</p>
        {timeLabel && (
          <p className={`text-xs font-semibold mt-1.5 inline-flex items-center gap-1.5 ${textMuted}`}>
            <Clock size={12} />
            {timeLabel}
          </p>
        )}
      </div>
    </div>
  );
}

export function UpcomingEventsPanel({
  todayEvents,
  upcomingEvents,
  canPost,
  onCreateClick,
  canEditEvent,
  onEditClick,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: UpcomingEventsPanelProps) {
  const hasNoEvents = todayEvents.length === 0 && upcomingEvents.length === 0;

  return (
    <div className="space-y-4">
      {/* Header - hiwalay na card, kasama yung add button */}
      {/* Header - maroon card, puti text/icon */}
      <section className="rounded-2xl shadow-sm p-5" style={{ background: ACCENT }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Events</h3>
          {canPost && (
            <button
              onClick={onCreateClick}
              aria-label="Create announcement"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 shrink-0 transition-colors"
            >
              <Plus size={18} className="text-white" />
            </button>
          )}
        </div>
      </section>

      {hasNoEvents && (
        <section className={`rounded-2xl border shadow-sm p-5 ${panelBg} ${panelBorder}`}>
          <p className={`text-sm font-semibold ${textMuted}`}>No events for you right now.</p>
        </section>
      )}

      {/* Today - hiwalay na card */}
      {todayEvents.length > 0 && (
        <section className={`rounded-2xl border shadow-sm p-5 ${panelBg} ${panelBorder}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wide mb-3 ${textMuted}`}>Today</p>
          <div className="space-y-3">
            {todayEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                editable={canEditEvent(event)}
                onEditClick={onEditClick}
                panelBorder={panelBorder}
                textPrimary={textPrimary}
                textMuted={textMuted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming - hiwalay na card */}
      {upcomingEvents.length > 0 && (
        <section className={`rounded-2xl border shadow-sm p-5 ${panelBg} ${panelBorder}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wide mb-3 ${textMuted}`}>Upcoming</p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                editable={canEditEvent(event)}
                onEditClick={onEditClick}
                panelBorder={panelBorder}
                textPrimary={textPrimary}
                textMuted={textMuted}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}