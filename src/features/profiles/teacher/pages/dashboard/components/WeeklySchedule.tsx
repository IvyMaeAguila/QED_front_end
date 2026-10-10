import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { rememberRows, skeletonRows } from "@shared/loading/reservations";
import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import { CalendarDays, Clock3, MapPin, X } from "lucide-react";
import type { WeeklyScheduleItem } from "../services/dashboard.service";
import { SCHOOL_DAYS, PIXELS_PER_MINUTE, layoutDay, timetableBounds, formatMinute, manilaDate } from "./timetable";

interface Props {
  loading?: boolean;
  schedule: WeeklyScheduleItem[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function WeeklySchedule({ loading = false, schedule, panelBg, panelBorder, textPrimary, textMuted, darkMode }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState<WeeklyScheduleItem | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const today = manilaDate(now);
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() + 6) % 7);
  const dates = SCHOOL_DAYS.map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
  const timeParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
  const currentMinute = Number(timeParts.find(part => part.type === "hour")?.value) * 60 + Number(timeParts.find(part => part.type === "minute")?.value);
  const borderColor = darkMode ? "rgba(255,255,255,0.08)" : "var(--border-subtle)";
  const stickyBg = darkMode ? "bg-surface-dark" : "bg-white";
  const dateRange = `${dates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${dates[4].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const renderWeek = (skeleton: boolean) => {
    const rows: WeeklyScheduleItem[] = skeleton ? Array.from({ length: skeletonRows("teacher/weekly-schedule", undefined, 90) }, (_, index) => ({ id: -index - 1, dayOfWeek: SCHOOL_DAYS[index % 5], startTime: `${9 + Math.floor(index / 5)}:00`, endTime: `${10 + Math.floor(index / 5)}:00`, timeLabel: "", subjectName: "", className: "", room: null })) : schedule;
  const days = SCHOOL_DAYS.map(day => layoutDay(rows.filter(item => item.dayOfWeek === day)));
  const entries = days.flat();
  const { start, end } = timetableBounds(entries);
  const hours = Array.from({ length: (end - start) / 60 + 1 }, (_, index) => start + index * 60);
  const height = (end - start) * PIXELS_PER_MINUTE;
    const showNow = today.getDay() >= 1 && today.getDay() <= 5 && currentMinute >= start && currentMinute < end;
    const missingTimes = rows.length - entries.length;
    return (rows.length === 0 ? <p className={`qed-type-body py-4 ${textMuted}`} data-sk-region="weeklyschedule-no-classes-scheduled-for-this-school-year-" data-sk-static="">No classes scheduled for this school year.</p> : <>
      <p className={`qed-type-small-metadata mb-3 sm:hidden ${textMuted}`} data-sk-region="weeklyschedule-scroll-across-to-view-all-weekdays-select-a-c" data-sk-static="">Scroll across to view all weekdays. Select a class for details.</p>
      <div className={`max-h-[620px] overflow-auto ${stickyBg}`} style={{ colorScheme: darkMode ? "dark" : "light" }} tabIndex={0} role="region" aria-label="Weekly class timetable">
        <div className="relative min-w-[780px]">
          <div data-sk-region="schedule-table-header" className={`sticky top-0 z-20 grid grid-cols-[76px_repeat(5,minmax(0,1fr))] border-b ${stickyBg} ${panelBorder}`}>
            <div className={`qed-type-label-compact sticky left-0 z-10 flex items-center justify-center border-r uppercase tracking-wide ${stickyBg} ${panelBorder} ${textMuted}`}>Time</div>
            {SCHOOL_DAYS.map((day, index) => <div key={day} className="flex justify-center border-r px-2 py-3 last:border-r-0" style={{ borderColor }}>
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${dates[index].getTime() === today.getTime() ? "bg-maroon text-white" : textPrimary}`}>
                <span className="text-lg font-bold tabular-nums">{dates[index].getDate()}</span>
                <span className="qed-type-label-compact uppercase tracking-wide">{day.slice(0, 3)}</span>
              </div>
            </div>)}
          </div>
          <div className="relative grid grid-cols-[76px_repeat(5,minmax(0,1fr))]" style={{ height }} data-sk-region="weeklyschedule-div-field-1">
            <div className={`sticky left-0 z-10 border-r ${stickyBg} ${panelBorder}`}>
              {hours.map(minute => <span key={minute} className={`qed-type-small-metadata absolute right-3 tabular-nums ${textMuted}`} style={{ top: minute === end ? height - 19 : (minute - start) * PIXELS_PER_MINUTE + 4 }}>{formatMinute(minute)}</span>)}
            </div>
            {SCHOOL_DAYS.map((day, index) => <div key={day} className="relative border-r last:border-r-0" style={{ borderColor }} aria-label={day} data-sk-region="weeklyschedule-div-field-2">
              {hours.slice(0, -1).map(minute => <div key={minute} className="pointer-events-none absolute inset-x-0 border-t" style={{ top: (minute - start) * PIXELS_PER_MINUTE, height: 60 * PIXELS_PER_MINUTE, borderColor }}><div className="absolute inset-x-0 top-1/2 border-t border-dashed" style={{ borderColor }} /></div>)}
              {!skeleton && days[index].length === 0 && <p className={`qed-type-small-metadata relative p-4 text-center ${textMuted}`} data-sk-region="weeklyschedule-no-classes" data-sk-static="">No classes</p>}
              {days[index].map(entry => {
                const blockHeight = (entry.end - entry.start) * PIXELS_PER_MINUTE;
                const description = `${day}: ${entry.item.subjectName}, ${entry.item.timeLabel}, ${entry.item.className}${entry.item.room ? `, Room ${entry.item.room}` : ""}`;
                const isSelected = selected?.id === entry.item.id && selected.dayOfWeek === day;
                return <button type="button" data-sk-region={`schedule-session-${day}`} data-sk-variable="" key={`${day}-${entry.item.id}`} disabled={skeleton} onClick={() => setSelected(entry.item)} title={description} aria-label={description} aria-pressed={isSelected} className={`absolute z-[2] flex flex-col items-stretch justify-start overflow-hidden rounded-lg border px-2.5 py-2 text-left transition-colors hover:z-[3] focus-visible:z-[3] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-maroon ${panelBorder} ${darkMode ? "bg-surface-dark hover:bg-[#332522]" : "bg-white hover:bg-gray-50"} ${isSelected ? "ring-2 ring-gray-400/40" : ""}`} style={{
                  top: (entry.start - start) * PIXELS_PER_MINUTE + 2,
                  height: Math.max(2, blockHeight - 4),
                  left: `calc(${entry.lane / entry.lanes * 100}% + 4px)`,
                  width: `calc(${100 / entry.lanes}% - 8px)`,
                }}>
                  <span className={`qed-type-label-compact block truncate ${textPrimary}`} style={{ fontWeight: "var(--qed-weight-semibold)" }} data-sk-region="weeklyschedule-span-field-4">{skeleton ? <SkeletonText width="68%"/> : entry.item.subjectName}</span>
                  {blockHeight >= 50 && <span className={`qed-type-small-metadata mt-0.5 block truncate ${textMuted}`} data-sk-region="weeklyschedule-span-field-5">{skeleton ? <SkeletonText width="92%"/> : entry.item.timeLabel}</span>}
                  {blockHeight >= 75 && <span className={`qed-type-small-metadata mt-1 block truncate ${textPrimary}`} data-sk-region="weeklyschedule-span-field-6">{skeleton ? <SkeletonText width="55%"/> : entry.item.className}</span>}
                  {blockHeight >= 100 && entry.item.room && <span className={`qed-type-small-metadata block truncate ${textMuted}`} data-sk-region="weeklyschedule-span-field-7">{skeleton ? <SkeletonText width="42%"/> : <>Room {entry.item.room}</>}</span>}
                </button>;
              })}
            </div>)}
            {!skeleton && showNow && <div className="pointer-events-none absolute right-0 left-[76px] z-[4] border-t border-maroon" style={{ top: (currentMinute - start) * PIXELS_PER_MINUTE }} aria-hidden="true"><span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-maroon" /></div>}
          </div>
        </div>
      </div>
      <div className={`qed-type-small-metadata mt-3 flex flex-wrap items-center justify-between gap-2 ${textMuted}`}><span data-sk-region="schedule-session-total">{skeleton ? <SkeletonText width="20ch" /> : <>{entries.length} class sessions per week</>}</span><span data-sk-region="weeklyschedule-select-a-class-to-view-its-details" data-sk-static="">Select a class to view its details</span></div>
      {missingTimes > 0 && <p className={`qed-type-small-metadata mt-2 ${textMuted}`}>{missingTimes} schedule entr{missingTimes === 1 ? "y has" : "ies have"} missing or invalid times.</p>}
    </>);
  };
  return <section aria-label="Weekly class schedule" className={`overflow-hidden rounded-[12px] border shadow-card ${panelBg} ${panelBorder}`}>
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6 ${panelBorder}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <CalendarDays size={16} className="shrink-0 text-maroon dark:text-brand-light" />
        <h2 className={`text-base font-bold ${textPrimary}`} data-sk-region="weeklyschedule-weekly-class-schedule" data-sk-static="">Weekly Class Schedule</h2>
      </div>
      <span className={`qed-type-small-metadata ${textMuted}`}>{dateRange}</span>
    </div>
    <div className="p-4 sm:p-6">
    <p className={`qed-type-small-metadata mb-4 ${textMuted}`} data-sk-region="weeklyschedule-regular-timetable-philippine-time" data-sk-static="">Regular timetable · Philippine time</p>
    <LoadingRegion name="weekly-timetable" loading={loading} variable skeleton={null} frame={renderWeek} onSettled={() => rememberRows("teacher/weekly-schedule", schedule.length)}>{null}</LoadingRegion>
    {selected && <div className={`mt-4 border-t pt-4 ${panelBorder}`} role="region" aria-label="Selected class details" aria-live="polite">
      <div className="flex items-start justify-between gap-4"><div><p className={`qed-type-small-metadata ${textMuted}`}>{selected.dayOfWeek}</p><h3 className={`qed-type-card-title mt-1 ${textPrimary}`}>{selected.subjectName}</h3></div><button type="button" className={`rounded-lg p-1 hover:bg-maroon/10 ${textMuted}`} aria-label="Close class details" onClick={() => setSelected(null)}><X size={17} /></button></div>
      <div className={`qed-type-metadata mt-3 flex flex-wrap gap-x-6 gap-y-2 ${textMuted}`}><span className="flex items-center gap-2"><Clock3 size={14} />{selected.timeLabel}</span><span>{selected.className}</span>{selected.room && <span className="flex items-center gap-2"><MapPin size={14} />Room {selected.room}</span>}</div>
    </div>}
    </div>
  </section>;
}


