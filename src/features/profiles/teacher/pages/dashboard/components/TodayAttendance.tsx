import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { Skeleton, SkeletonText } from "@shared/components/SkeletonLoading";
import { ClipboardCheck } from "lucide-react";

interface TodayAttendanceProps {
  loading?: boolean;
  present: number;
  absent: number;
  late: number;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  darkMode: boolean;
  onViewFull?: () => void;
  hasAdvisoryStudents?: boolean;
  recordedCount?: number;
}

export function TodayAttendance({
  loading = false,
  present,
  absent,
  late,
  panelBg,
  panelBorder,
  textPrimary,
  darkMode,
  onViewFull,
  hasAdvisoryStudents = true,
  recordedCount,
}: TodayAttendanceProps) {
  const total = present + absent + late;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  const mutedColor = darkMode ? "#B8AAA6" : "#6B7280";

  const groups = [
    {
      key: "present",
      count: present,
      label: "Present",
      solid: darkMode ? "#69BC92" : "#2F8F5B",
    },
    {
      key: "late",
      count: late,
      label: "Late",
      solid: darkMode ? "#E0B45D" : "#B7791F",
    },
    {
      key: "absent",
      count: absent,
      label: "Absent",
      solid: darkMode ? "#E08780" : "#C2413C",
    },
  ];

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;
  const segments = groups.map((g) => {
    const fraction = total > 0 ? g.count / total : 0;
    const dash = fraction * circumference;
    const offset = -cursor;
    cursor += dash;
    return { ...g, dash, offset };
  });

  const renderBody = (skeleton: boolean) => (<div className="grid grid-cols-1 items-center gap-6 p-4 sm:grid-cols-2 sm:p-6">
        <div className="flex min-w-0 flex-col items-center justify-center gap-3 py-2">
        <div data-sk-chart="ring" data-sk-region="attendance-plot" data-sk-fixed-region="teacher/attendance/plot" className="relative h-48 w-48 sm:h-52 sm:w-52">
          {skeleton ? <Skeleton className="sk-ring h-full w-full rounded-full"/> : <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`Attendance distribution: ${present} present, ${late} late, ${absent} absent`}>
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={darkMode ? "rgba(255,255,255,0.06)" : "var(--brand-light)"}
              strokeWidth="9"
            />
            {segments.map(
              (s) =>
                s.dash > 0 && (
                  <circle
                    key={s.key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={s.solid}
                    strokeWidth="9"
                    strokeLinecap="butt"
                    strokeDasharray={`${s.dash} ${circumference - s.dash}`}
                    strokeDashoffset={s.offset}
                  />
                )
            )}
          </svg>}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span data-sk-region="attendance-rate" className={`text-[36px] font-bold leading-none tracking-tight tabular-nums ${textPrimary}`}>{skeleton ? <SkeletonText width="4ch" /> : `${rate}%`}</span>
            <span
              className="mt-2 text-xs font-medium"
              style={{ color: mutedColor }} data-sk-region="todayattendance-present-rate" data-sk-static=""
            >
              Present rate
            </span>
          </div>
        </div>
        <p className="text-xs" style={{ color: mutedColor }} data-sk-region="todayattendance-p-field-3">{skeleton ? <SkeletonText width="12rem"/> : <>Attendance summary · {total} {total === 1 ? "student" : "students"}</>}</p>
        </div>

        <div className="min-w-0">
          <div data-sk-region="attendance-table-header" className={`grid grid-cols-[2fr_1fr_1fr] border-b pb-3 text-xs font-medium ${panelBorder}`} style={{ color: mutedColor }}>
            <span data-sk-region="todayattendance-status" data-sk-static="">Status</span>
            <span className="text-right" data-sk-region="todayattendance-students" data-sk-static="">Students</span>
            <span className="text-right" data-sk-region="todayattendance-share" data-sk-static="">Share</span>
          </div>
          <dl aria-label="Attendance counts" data-sk-region="todayattendance-dl-field-4">
          {groups.map((g) => {
            const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
            return (
              <div
                key={g.key}
                data-sk-region={`attendance-row-${g.key}`}
                className={`grid grid-cols-[2fr_1fr_1fr] items-center border-b py-4 last:border-b-0 ${panelBorder}`}
              >
                <dt className={`text-sm font-medium ${textPrimary}`}>
                  <span className="inline-flex items-center gap-2.5">
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.solid }} />
                    {g.label}
                  </span>
                </dt>
                <dd className={`text-right text-2xl font-semibold leading-none tabular-nums ${textPrimary}`} data-sk-region="todayattendance-dd-field-5"><span className="sr-only" data-sk-region="todayattendance-students-" data-sk-static="">Students: </span>{skeleton ? <SkeletonText className="ml-auto" width="2ch"/> : g.count}</dd>
                <dd className="text-right text-sm tabular-nums" style={{ color: mutedColor }} data-sk-region="todayattendance-dd-field-6"><span className="sr-only" data-sk-region="todayattendance-share-" data-sk-static="">Share: </span>{skeleton ? <SkeletonText className="ml-auto" width="3ch"/> : `${pct}%`}</dd>
              </div>
            );
          })}
          </dl>
        </div>
      </div>);

  return (
    <div
      className={`h-full flex flex-col rounded-[12px] border overflow-hidden ${panelBg} ${panelBorder}`}
      style={{ boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05), 0 2px 10px -2px rgba(0,0,0,0.03)" }}
    >
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-6 ${panelBorder}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <ClipboardCheck size={16} className="shrink-0 text-maroon dark:text-brand-light" />
          <h2 className={`text-base font-bold ${textPrimary}`} data-sk-region="todayattendance-today-apos-s-attendance" data-sk-static="">Today&apos;s Attendance</h2>
        </div>
        {onViewFull && (
          <button
            type="button"
            onClick={onViewFull}
            className="shrink-0 text-xs font-semibold uppercase tracking-wider text-maroon hover:underline dark:text-brand-light" data-sk-region="todayattendance-full-report" data-sk-static=""
          >
            Full Report
          </button>
        )}
      </div>

      <LoadingRegion name="attendance-body" loading={loading} variable skeleton={null} frame={pending => pending || total > 0 ? renderBody(pending) : <p className={`p-6 text-sm ${textPrimary}`}>{!hasAdvisoryStudents ? "No advisory class assigned for attendance." : recordedCount ? "Attendance recorded; no present, absent, or late entries today." : "Attendance not recorded today."}</p>}>{null}</LoadingRegion>

    </div>
  );
}
