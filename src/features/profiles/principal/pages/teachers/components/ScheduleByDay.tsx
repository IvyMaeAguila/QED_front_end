import { lazy, Suspense } from "react";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { parseScheduleTimeRange } from "@shared/schedule/timetable";
import type { DaySchedule } from "../utils/schedule";
const WeeklyTimetable = lazy(() => import("@shared/schedule/WeeklyTimetable"));
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
export function ScheduleByDay({ scheduleByDay, view = "teacher-schedule", ...props }: ScheduleByDayProps) {
  const schedule = scheduleByDay.flatMap(group => group.entries).map((entry, index) => ({
    id: index,
    dayOfWeek: entry.day,
    ...parseScheduleTimeRange(entry.time),
    timeLabel: entry.time,
    subjectName: entry.subject,
    className: entry.gradeSection || "Section not assigned",
    room: entry.room,
  }));
  return <Suspense fallback={<div className={`rounded-xl border p-6 ${props.panelBg} ${props.panelBorder}`}><SkeletonText width="20ch" /></div>}>
    <WeeklyTimetable {...props} schedule={schedule} view={view} emptyMessage="No schedule entries found." />
  </Suspense>;
}
