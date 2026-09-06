import { Clock, DoorOpen } from "lucide-react";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { DaySchedule } from "../utils/schedule";

interface ScheduleByDayProps {
  scheduleByDay: DaySchedule[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function ScheduleByDay({
  scheduleByDay,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: ScheduleByDayProps) {
  return (
    <SectionCard
      title="Class Schedule"
      icon={Clock}
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      darkMode={darkMode}
    >
      {scheduleByDay.length === 0 ? (
        <p className={`text-sm ${textMuted}`}>No schedule entries found.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {scheduleByDay.map(({ day, entries }) => (
            <div key={day}>
              <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2.5 ${textMuted}`}>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-maroon" />
                {day}
              </p>
              <div className="flex flex-col gap-1.5">
                {entries.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-lg px-3.5 py-2.5"
                    style={{ backgroundColor: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold tabular-nums shrink-0 text-maroon">{e.time}</span>
                      <span className={`text-sm truncate ${textPrimary}`}>{e.subject}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className={textMuted}>{e.gradeSection}</span>
                      <span className={`inline-flex items-center gap-1 ${textMuted}`}>
                        <DoorOpen className="h-3 w-3" /> {e.room}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
