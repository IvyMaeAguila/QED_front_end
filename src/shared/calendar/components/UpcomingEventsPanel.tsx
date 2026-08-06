import { Plus, Clock } from "lucide-react";
import { ACCENT, type CalendarEvent, type CalendarTheme } from "../types/Calendar";
import { formatRelativeDay, formatTimeRange } from "../data";

interface UpcomingEventsPanelProps extends CalendarTheme {
  events: CalendarEvent[]; // filtered to what the viewer may see, sorted ascending
  canPost: boolean;
  onCreateClick: () => void;
}

export function UpcomingEventsPanel({
  events,
  canPost,
  onCreateClick,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: UpcomingEventsPanelProps) {
  return (
    <section className={`rounded-2xl border shadow-sm p-5 ${panelBg} ${panelBorder}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${textPrimary}`}>Upcoming Events</h3>
        {canPost && (
          <button
            onClick={onCreateClick}
            aria-label="Create announcement"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <p className={`text-sm font-semibold ${textMuted}`}>No upcoming events for you right now.</p>
      ) : (
        <div className="space-y-3 max-h-130 overflow-y-auto pr-1">
          {events.map((event) => {
            const timeLabel = formatTimeRange(event.startTime, event.endTime);
            return (
              <div key={event.id} className={`rounded-xl border overflow-hidden ${panelBorder}`}>
                <div className="h-1.5" style={{ background: ACCENT }} />
                <div className="p-4">
                  <p className={`font-bold text-sm leading-snug ${textPrimary}`}>{event.title}</p>
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
          })}
        </div>
      )}
    </section>
  );
}