import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarDays, Loader2 } from "lucide-react";
import type { RosterStudent } from "../subjects/detail/data.ts";
import {
  ATTENDANCE_META,
  type AttendanceMap,
  type GradingPeriod,
} from "../subjects/detail/types/Grading.ts";
import { fetchAdvisoryAttendance } from "./services/attendance.service.ts";

interface AttendanceMonthSummarySectionProps {
  sectionId: string;
  roster: RosterStudent[];
  terms: GradingPeriod[];
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

function parseISO(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Every distinct calendar month touched by any term, in order. This is what
// populates the month dropdown — the school year's months, not just "this
// month" or the currently active term.
function enumerateMonths(terms: GradingPeriod[]): string[] {
  if (terms.length === 0) return [];
  const starts = terms.map((t) => parseISO(t.startDate).getTime());
  const ends = terms.map((t) => parseISO(t.endDate).getTime());
  const earliest = new Date(Math.min(...starts));
  const latest = new Date(Math.max(...ends));

  const keys: string[] = [];
  let cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const stop = new Date(latest.getFullYear(), latest.getMonth(), 1);
  while (cursor <= stop) {
    keys.push(monthKey(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return keys;
}

function allDatesInMonth(monthKeyStr: string): string[] {
  const [year, month] = monthKeyStr.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) =>
    toISODate(new Date(year, month - 1, i + 1)),
  );
}

export function AttendanceMonthSummarySection({
  sectionId,
  roster,
  terms,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: AttendanceMonthSummarySectionProps) {
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const months = useMemo(() => enumerateMonths(terms), [terms]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const current = monthKey(new Date());
    return months.includes(current)
      ? current
      : (months[months.length - 1] ?? current);
  });

  useEffect(() => {
    if (months.length === 0) return;
    setSelectedMonth((current) => months.includes(current) ? current : months[months.length - 1]);
  }, [months]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAttendanceError(null);
    fetchAdvisoryAttendance(sectionId, { allPeriods: true })
      .then((res) => { if (!cancelled) setAttendance(res.data); })
      .catch((err) => {
        console.error("Failed to load attendance:", err);
        if (!cancelled) setAttendanceError("Couldn't load attendance history. Please try again.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [sectionId]);

  const cardClasses = `overflow-hidden rounded-[12px] border shadow-sm ${panelBg} ${panelBorder}`;

  const monthDates = useMemo(
    () => allDatesInMonth(selectedMonth),
    [selectedMonth],
  );

  const { schoolDays, absences, totalPresent, totalLate, totalExcused, daySummaries, absencesByDate } = useMemo(() => {
    // A "school day" is a distinct date the teacher has marked attendance
    // for this section. Marking more students (or re-marking) on a date
    // that's already counted does not add another day — only a date the
    // teacher hasn't touched yet increments the total.
    const markedDates = new Set<string>();
    const summaries: Record<string, { present: number; absent: number; late: number; excused: number }> = {};
    const absentStudents: Record<string, RosterStudent[]> = {};

    for (const iso of monthDates) {
      let dayHasMark = false;
      const summary = { present: 0, absent: 0, late: 0, excused: 0 };
      for (const student of roster) {
        const status = attendance[student.id]?.[iso];
        if (!status) continue;
        dayHasMark = true;
        if (status === "P") summary.present += 1;
        if (status === "A") summary.absent += 1;
        if (status === "L") summary.late += 1;
        if (status === "E") summary.excused += 1;
      }
      if (dayHasMark) markedDates.add(iso);
      summaries[iso] = summary;
      const absentOnDate = roster.filter((student) => attendance[student.id]?.[iso] === "A");
      if (absentOnDate.length > 0) absentStudents[iso] = absentOnDate;
    }

    return {
      schoolDays: markedDates.size,
      absences: Object.values(summaries).reduce((sum, day) => sum + day.absent, 0),
      totalPresent: Object.values(summaries).reduce((sum, day) => sum + day.present, 0),
      totalLate: Object.values(summaries).reduce((sum, day) => sum + day.late, 0),
      totalExcused: Object.values(summaries).reduce((sum, day) => sum + day.excused, 0),
      daySummaries: summaries,
      absencesByDate: Object.entries(absentStudents).map(([iso, students]) => ({ iso, students })),
    };
  }, [roster, monthDates, attendance]);

  const calendarCells = useMemo(() => {
    const firstDate = monthDates[0] ? parseISO(monthDates[0]).getDay() : 0;
    const leading = Array.from({ length: firstDate }, () => null);
    const cells: (string | null)[] = [
      ...leading,
      ...monthDates,
    ];
    const trailing = (7 - (cells.length % 7)) % 7;
    return [...cells, ...Array.from({ length: trailing }, () => null)];
  }, [monthDates]);

  if (months.length === 0) {
    return (
      <div className={`${cardClasses} px-5 py-16 text-center`}>
        <p className={`font-bold ${textPrimary}`}>No terms set up yet</p>
        <p className={`mt-1 text-sm ${textMuted}`}>
          Add a grading period before viewing a monthly summary.
        </p>
      </div>
    );
  }

  return (
    <section className={cardClasses} aria-label="Monthly attendance summary">
      <div
        className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}
      >
        <div>
          <h2 className={`font-extrabold ${textPrimary}`}>Monthly Summary</h2>
          <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
            {roster.length} student{roster.length === 1 ? "" : "s"}
          </p>
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ borderRadius: "8px" }}
          className={`h-10 rounded-lg border px-2.5 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
          aria-label="Month"
        >
          {months.map((key) => (
            <option key={key} value={key}>
              {monthLabel(key)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-5 py-16">
          <Loader2 size={16} className={`animate-spin ${textMuted}`} />
          <p className={`text-sm font-semibold ${textMuted}`}>
            Loading attendance...
          </p>
        </div>
      ) : attendanceError ? (
        <p className="px-5 py-10 text-center text-sm font-semibold text-red-500" role="alert">{attendanceError}</p>
      ) : (
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "School days", value: schoolDays, color: "#7A0022", icon: CalendarCheck },
              { label: "Present", value: totalPresent, color: ATTENDANCE_META.P.color },
              { label: "Absent", value: absences, color: ATTENDANCE_META.A.color },
              { label: "Late / Excused", value: `${totalLate} / ${totalExcused}`, color: ATTENDANCE_META.L.color },
            ].map((metric) => (
              <div key={metric.label} className={`flex min-h-20 items-center gap-3 rounded-xl border px-3 py-3 ${panelBorder} ${darkMode ? "bg-white/[0.03]" : "bg-[#FAFAF9]"}`}>
                {metric.icon ? <metric.icon size={20} className="shrink-0" style={{ color: metric.color }} /> : <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: metric.color }} />}
                <div className="min-w-0">
                  <p className={`truncate text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>{metric.label}</p>
                  <p className={`text-xl font-extrabold tabular-nums leading-tight ${textPrimary}`}>{metric.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`overflow-hidden rounded-xl border ${panelBorder}`}>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 ${panelBorder} ${darkMode ? "bg-white/5" : "bg-[#FAFAF9]"}`}>
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-[#7A0022]" />
                <h3 className={`text-sm font-bold ${textPrimary}`}>{monthLabel(selectedMonth)}</h3>
              </div>
              <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold ${textMuted}`}>
                {(["P", "A", "L", "E"] as const).map((status) => (
                  <span key={status} className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: ATTENDANCE_META[status].color }} />{ATTENDANCE_META[status].label}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-7">
              {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map((weekday) => (
                <div key={weekday} className={`border-b px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wide ${panelBorder} ${textMuted} ${darkMode ? "bg-white/[0.03]" : "bg-[#FAFAF9]"}`}>{weekday}</div>
              ))}
              {calendarCells.map((iso, index) => {
                if (!iso) return <div key={`blank-${index}`} className={`min-h-20 border-b border-r ${panelBorder} sm:min-h-24`} />;
                const summary = daySummaries[iso];
                const isMarked = summary.present + summary.absent + summary.late + summary.excused > 0;
                const isToday = iso === toISODate(new Date());
                const date = parseISO(iso);
                return (
                  <div key={iso} className={`min-h-20 border-b border-r p-1.5 sm:min-h-24 sm:p-2 ${panelBorder} ${darkMode ? "bg-[#1A1110]" : "bg-white"}`}>
                    <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums ${isToday ? "bg-[#800000] text-white" : isMarked ? textPrimary : textMuted}`}>{date.getDate()}</span>
                    {isMarked && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(["P", "A", "L", "E"] as const).map((status) => {
                          const count = status === "P" ? summary.present : status === "A" ? summary.absent : status === "L" ? summary.late : summary.excused;
                          if (!count) return null;
                          return <span key={status} title={`${count} ${ATTENDANCE_META[status].label.toLowerCase()}`} className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold tabular-nums" style={{ color: ATTENDANCE_META[status].color, backgroundColor: `${ATTENDANCE_META[status].color}${darkMode ? "24" : "12"}` }}>{status} {count}</span>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className={`px-3 py-2 text-[10px] ${textMuted}`}>Days without marks are left blank. Counts show students by attendance status.</p>
          </div>

          <div className={`overflow-hidden rounded-xl border ${panelBorder}`}>
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${panelBorder} ${darkMode ? "bg-white/5" : "bg-[#FAFAF9]"}`}>
              <h3 className={`text-sm font-bold ${textPrimary}`}>Absences this month</h3>
              <span className={`text-xs font-semibold ${textMuted}`}>{absences} absent {absences === 1 ? "record" : "records"}</span>
            </div>
            {absencesByDate.length > 0 ? (
              <ul className={`divide-y ${darkMode ? "divide-white/10" : "divide-black/10"}`}>
                {absencesByDate.map(({ iso, students }) => (
                  <li key={iso} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wide ${textMuted}`}>
                        {parseISO(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        {students.map((student) => <li key={student.id} className={`text-sm font-semibold ${textPrimary}`}>{student.name}</li>)}
                      </ul>
                    </div>
                    <span className="w-fit shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ color: ATTENDANCE_META.A.color, backgroundColor: `${ATTENDANCE_META.A.color}${darkMode ? "22" : "14"}` }}>
                      {students.length} absent
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`px-4 py-6 text-center text-xs font-medium ${textMuted}`}>No absences recorded this month.</p>
            )}
            <div className={`flex items-center justify-between border-t px-4 py-2.5 ${panelBorder} ${darkMode ? "bg-white/5" : "bg-[#FAFAF9]"}`}>
              <span className={`text-xs font-bold uppercase tracking-wide ${textPrimary}`}>Total absent</span>
              <span className="text-sm font-extrabold tabular-nums" style={{ color: ATTENDANCE_META.A.color }}>{absences}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
