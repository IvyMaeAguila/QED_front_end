import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { DaySchedule } from "../utils/schedule";

interface ScheduleByDayProps {
  scheduleByDay: DaySchedule[];
  loading?: boolean;
  view?: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function ScheduleByDay({
  scheduleByDay,
  loading = false,
  view = "teacher-schedule",
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: ScheduleByDayProps) {
  const renderDays = (pending: boolean) => {
    const days: DaySchedule[] = pending ? Array.from({ length: Math.min(5, skeletonRows(view)) }, (_, index) => ({ day: `day-${index}`, entries: [{ classId: index, day: "", time: "", subject: "", gradeSection: null, room: null }] })) : scheduleByDay;
    return days.length === 0 ? <p className={`text-sm ${textMuted}`} data-sk-region="schedulebyday-no-schedule-entries-found-" data-sk-static="">No schedule entries found.</p> : (
      <div className="grid gap-3 xl:grid-cols-2" data-sk-region="schedulebyday-div-field-1">
        {days.map(({ day, entries }) => <section data-sk-item key={day} className={`overflow-hidden rounded-xl border ${panelBorder}`}>
          <header className="flex items-center justify-between border-b border-white/15 bg-maroon px-3 py-2">
            <h3 className="text-xs font-bold text-white" data-sk-region="schedulebyday-h3-field-2">{pending ? <SkeletonText width="9ch" /> : day}</h3>
            <span className="text-xs font-medium text-white/80" data-sk-region="schedulebyday-span-field-3">{pending ? <SkeletonText width="7ch" /> : <>{entries.length} {entries.length === 1 ? "class" : "classes"}</>}</span>
          </header>
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]" data-sk-region="schedulebyday-div-field-4">
            {entries.map((entry, index) => <div key={`${entry.classId}-${entry.time}-${entry.subject}-${index}`} className="flex flex-col justify-between gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`w-28 shrink-0 pt-0.5 text-xs font-semibold tabular-nums ${textMuted}`} data-sk-region="schedulebyday-span-field-5">{pending ? <SkeletonText width="100%" /> : entry.time}</span>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-semibold ${textPrimary}`} data-sk-region="schedulebyday-p-field-6">{pending ? <SkeletonText width="14ch" /> : entry.subject}</p>
                  <p className={`mt-0.5 truncate text-xs ${textMuted}`} data-sk-region="schedulebyday-p-field-7">{pending ? <SkeletonText width="12ch" /> : entry.gradeSection || "Section not assigned"}</p>
                </div>
              </div>
              <div className={`pl-28 text-xs font-medium sm:pl-0 sm:text-right ${textMuted}`} data-sk-region="schedulebyday-div-field-8">{pending ? <><SkeletonText width="12ch" /><SkeletonText width="8ch" /></> : entry.room || "Room not assigned"}</div>
            </div>)}
          </div>
        </section>)}
      </div>
    );
  };
  return (
    <SectionCard
      title="Class Schedule"
      compact
      action={<span className={`text-xs font-medium ${textMuted}`}><LoadingRegion as="span" loading={loading} skeleton={<SkeletonText width="10ch" />}>{scheduleByDay.reduce((total, day) => total + day.entries.length, 0)} sessions</LoadingRegion></span>}
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      darkMode={darkMode}
    >
      <LoadingRegion loading={loading} variable skeleton={renderDays(true)} onSettled={() => rememberRows(view, scheduleByDay.length)}>{renderDays(false)}</LoadingRegion>
    </SectionCard>
  );
}

