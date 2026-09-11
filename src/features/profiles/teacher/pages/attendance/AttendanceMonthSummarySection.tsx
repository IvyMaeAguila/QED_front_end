import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CalendarX2, Loader2 } from "lucide-react";
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

function dateLabel(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
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

  const months = useMemo(() => enumerateMonths(terms), [terms]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const current = monthKey(new Date());
    return months.includes(current)
      ? current
      : (months[months.length - 1] ?? current);
  });

  useEffect(() => {
    fetchAdvisoryAttendance(sectionId)
      .then((res) => setAttendance(res.data))
      .catch((err) => console.error("Failed to load attendance:", err))
      .finally(() => setLoading(false));
  }, [sectionId]);

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  const monthDates = useMemo(
    () => allDatesInMonth(selectedMonth),
    [selectedMonth],
  );

  const { schoolDays, absencesByDate, totalAbsences } = useMemo(() => {
    // A "school day" is a distinct date the teacher has marked attendance
    // for this section. Marking more students (or re-marking) on a date
    // that's already counted does not add another day — only a date the
    // teacher hasn't touched yet increments the total.
    const markedDates = new Set<string>();
    const absentStudentsByDate: Record<string, RosterStudent[]> = {};

    for (const iso of monthDates) {
      let dayHasMark = false;
      const absentToday: RosterStudent[] = [];
      for (const student of roster) {
        const status = attendance[student.id]?.[iso];
        if (!status) continue;
        dayHasMark = true;
        if (status === "A") absentToday.push(student);
      }
      if (dayHasMark) markedDates.add(iso);
      if (absentToday.length > 0) absentStudentsByDate[iso] = absentToday;
    }

    const dateList = Object.entries(absentStudentsByDate)
      .map(([iso, students]) => ({ iso, students }))
      .sort((a, b) => a.iso.localeCompare(b.iso));

    return {
      schoolDays: markedDates.size,
      absencesByDate: dateList,
      totalAbsences: dateList.reduce((sum, d) => sum + d.students.length, 0),
    };
  }, [roster, monthDates, attendance]);

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
          className={`h-10 rounded-xl border px-2.5 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
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
      ) : (
        <div className="p-5 space-y-6">
          <div
            className={`flex items-center gap-4 rounded-xl border p-4 ${panelBorder}`}
            style={{ background: darkMode ? "transparent" : "#F8FAFC" }}
          >
            <CalendarCheck
              size={35}
              style={{ color: "#7A0022" }}
              className="shrink-0"
            />
            <div>
               <p
                className={`mt-1 text-xs font-bold uppercase tracking-wider ${textMuted}`}
              >
                Total school day{schoolDays === 1 ? "" : "s"} marked in{" "}
                {monthLabel(selectedMonth)}
              </p>
              <p
                className={`text-3xl font-black tabular-nums leading-none ${textPrimary}`}
              >
                {schoolDays}
              </p>
            </div>
          </div>

          {/* Absence list, one row per date, with a running total */}
          <div className={`rounded-xl border ${panelBorder} overflow-hidden`}>
            <div
              className={`flex items-center gap-2 border-b px-4 py-2.5 ${panelBorder} ${darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}`}
            >
              <CalendarX2 size={14} className={textMuted} />
              <h3
                className={`text-xs font-extrabold uppercase tracking-wider ${textPrimary}`}
              >
                Absences This Month
              </h3>
            </div>

            {absencesByDate.length > 0 ? (
              <>
                <ul
                  className={`divide-y ${darkMode ? "divide-white/10" : "divide-black/10"}`}
                >
                  {absencesByDate.map(({ iso, students }) => (
                    <li key={iso} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider ${textMuted}`}
                        >
                          {dateLabel(iso)}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums"
                          style={{
                            color: ATTENDANCE_META.A.color,
                            backgroundColor: darkMode
                              ? `${ATTENDANCE_META.A.color}22`
                              : `${ATTENDANCE_META.A.color}14`,
                          }}
                        >
                          {students.length} absent
                        </span>
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {students.map((s) => (
                          <li
                            key={s.id}
                            className={`text-sm font-bold ${textPrimary}`}
                          >
                            {s.name}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
                <div
                  className={`flex items-center justify-between gap-4 border-t px-4 py-2.5 ${panelBorder} ${darkMode ? "bg-white/5" : "bg-[#F8FAFC]"}`}
                >
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wider ${textPrimary}`}
                  >
                    Total
                  </span>
                  <span
                    className="text-sm font-black tabular-nums"
                    style={{ color: ATTENDANCE_META.A.color }}
                  >
                    {totalAbsences}
                  </span>
                </div>
              </>
            ) : (
              <p
                className={`px-4 py-6 text-center text-xs font-medium ${textMuted}`}
              >
                No absences recorded this month.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
