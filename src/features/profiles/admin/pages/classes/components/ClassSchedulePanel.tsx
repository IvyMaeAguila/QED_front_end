import WeeklyTimetable from "@shared/schedule/WeeklyTimetable";
import { SCHOOL_DAYS } from "@shared/schedule/timetable";
import { DAYS_OF_WEEK, formatClassName, formatTimeRange, type SchoolClass } from "../types/Class";
interface Props {
  schoolClass: SchoolClass;
  loading: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}
export default function ClassSchedulePanel({ schoolClass, ...props }: Props) {
  const schedule = schoolClass.schedule.flatMap((period, index) => period.days.map(day => ({
    id: index,
    dayOfWeek: SCHOOL_DAYS[DAYS_OF_WEEK.indexOf(day)],
    startTime: period.startTime,
    endTime: period.endTime,
    timeLabel: formatTimeRange(period.startTime, period.endTime),
    subjectName: period.subject,
    className: formatClassName(schoolClass),
    teacherName: period.teacherName || "Unassigned",
    room: schoolClass.room,
  })));
  return <WeeklyTimetable {...props} schedule={schedule} view={`admin-class:${schoolClass.id}:schedule`} emptyMessage="No schedule set yet." />;
}
