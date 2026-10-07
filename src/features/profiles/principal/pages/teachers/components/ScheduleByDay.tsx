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
      compact
      action={<span className={`text-xs font-medium ${textMuted}`}>{scheduleByDay.reduce((total, day) => total + day.entries.length, 0)} sessions</span>}
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      darkMode={darkMode}
    >
      {scheduleByDay.length === 0 ? (
        <p className={`text-sm ${textMuted}`}>No schedule entries found.</p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {scheduleByDay.map(({ day, entries }) => (
            <section key={day} className={`overflow-hidden rounded-xl border ${panelBorder}`}>
              <header className="flex items-center justify-between border-b border-white/15 bg-maroon px-3 py-2">
                <h3 className="text-xs font-bold text-white">{day}</h3>
                <span className="text-xs font-medium text-white/80">{entries.length} {entries.length === 1 ? "class" : "classes"}</span>
              </header>
              <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                {entries.map((e, i) => (
                  <div
                    key={`${e.classId}-${e.time}-${e.subject}-${i}`}
                    className="flex flex-col justify-between gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`w-28 shrink-0 pt-0.5 text-xs font-semibold tabular-nums ${textMuted}`}>{e.time}</span>
                      <div className="min-w-0">
                        <p className={`truncate text-xs font-semibold ${textPrimary}`}>{e.subject}</p>
                        <p className={`mt-0.5 truncate text-xs ${textMuted}`}>{e.gradeSection || "Section not assigned"}</p>
                      </div>
                    </div>
                    <div className={`pl-28 text-xs font-medium sm:pl-0 sm:text-right ${textMuted}`}>
                      {e.room || "Room not assigned"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
