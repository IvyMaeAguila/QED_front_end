import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Loader2, User } from "lucide-react";
import type { RosterStudent } from "../subjects/detail/data";
import {
  ATTENDANCE_CYCLE,
  ATTENDANCE_META,
  formatDisplayDate,
  type AttendanceMap,
  type GradingPeriod,
} from "../subjects/detail/types/Grading";
import { fetchAdvisoryAttendance, saveAdvisoryAttendance } from "./services/attendance.service.ts";
import { StudentAttendanceSummaryModal } from "./StudentAttendanceSummaryModal";


const ACCENT = "#6B0000";
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

interface AttendanceCalendarSectionProps {
  sectionId: string;
  roster: RosterStudent[];
  terms: GradingPeriod[];
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  editable?: boolean;
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISO(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function yearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function defaultViewDate(term: GradingPeriod | undefined): Date {
  if (!term) return new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISODate(today);
  if (todayISO >= term.startDate && todayISO <= term.endDate) {
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }
  return parseISO(term.startDate);
}

function enumerateDates(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  let cursor = parseISO(startISO);
  const end = parseISO(endISO);
  while (cursor <= end) {
    out.push(toISODate(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }
  return out;
}

function isFemale(student: RosterStudent): boolean {
  const g = String((student as { gender?: string }).gender ?? "").trim().toUpperCase();
  return g === "F" || g === "FEMALE";
}

export function AttendanceCalendarSection({
  sectionId,
  roster,
  terms,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  editable = true,
}: AttendanceCalendarSectionProps) {
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [loading, setLoading] = useState(true);
  const [selectedTermId, setSelectedTermId] = useState<string>(() => terms.find((t) => t.isActive)?.id ?? terms[0]?.id ?? "");
  const [viewDate, setViewDate] = useState<Date>(() => {
    const t = terms.find((t) => t.id === selectedTermId) ?? terms[0];
    return defaultViewDate(t);
  });

  const [summaryStudent, setSummaryStudent] = useState<RosterStudent | null>(null);

  const term = terms.find((t) => t.id === selectedTermId) ?? terms[0];

  useEffect(() => {
    fetchAdvisoryAttendance(sectionId)
      .then((res) => setAttendance(res.data))
      .catch((err) => console.error("Failed to load attendance:", err))
      .finally(() => setLoading(false));
  }, [sectionId]);

  useEffect(() => {
    if (term) setViewDate(defaultViewDate(term));
  }, [selectedTermId]);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return { date: d, iso: toISODate(d), dayOfWeek: d.getDay() };
    });
  }, [viewDate]);

  const termDates = useMemo(() => (term ? enumerateDates(term.startDate, term.endDate) : []), [term]);

  const termSummary = useMemo(() => {
    const summary: Record<string, { present: number; total: number }> = {};
    if (!term) return summary;

    const markedDates = new Set<string>();
    for (const iso of termDates) {
      const hasMark = roster.some((student) => attendance[student.id]?.[iso]);
      if (hasMark) markedDates.add(iso);
    }
    const total = markedDates.size;

    for (const student of roster) {
      let present = 0;
      for (const iso of termDates) {
        if (attendance[student.id]?.[iso] === "P") present += 1;
      }
      summary[student.id] = { present, total };
    }
    return summary;
  }, [roster, termDates, attendance, term]);

  const groupedRoster = useMemo(() => {
    const male = roster.filter((s) => !isFemale(s));
    const female = roster.filter((s) => isFemale(s));
    return { male, female };
  }, [roster]);

  function cycle(studentId: string, dateISO: string) {
    if (!editable) return;
    const current = attendance[studentId]?.[dateISO] ?? null;
    const idx = ATTENDANCE_CYCLE.indexOf(current);
    const next = ATTENDANCE_CYCLE[(idx + 1) % ATTENDANCE_CYCLE.length];

    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [dateISO]: next },
    }));

    saveAdvisoryAttendance(sectionId, studentId, dateISO, next).catch((err) => {
      console.error("Failed to save attendance:", err);
      setAttendance((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], [dateISO]: current },
      }));
    });
  }

  const canGoPrev = term ? yearMonth(viewDate) > yearMonth(parseISO(term.startDate)) : true;
  const canGoNext = term ? yearMonth(viewDate) < yearMonth(parseISO(term.endDate)) : true;

  function goToPrevMonth() {
    if (!canGoPrev) return;
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    if (!canGoNext) return;
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;
  const stickyRightBg = darkMode ? "bg-[#111827]" : "bg-white";
  // Student name + one column per day + Present/School Days + Summary link.
  const columnCount = 3 + days.length;

  function renderStudentRow(student: RosterStudent, index: number) {
    const { present, total } = termSummary[student.id] ?? { present: 0, total: 0 };
    const rowStripe = index % 2 === 1 ? (darkMode ? "bg-white/[0.015]" : "bg-black/[0.012]") : "";
    return (
      <tr key={student.id} className={`border-t ${panelBorder} ${rowStripe}`}>
        <td className={`sticky left-0 z-10 px-5 py-2 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
          <span className={`text-xs font-bold ${textPrimary}`}>{student.name}</span>
        </td>
        {days.map(({ iso, dayOfWeek }) => {
          const status = attendance[student.id]?.[iso] ?? null;
          const meta = status ? ATTENDANCE_META[status] : null;
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const inTerm = term ? iso >= term.startDate && iso <= term.endDate : false;
          const clickable = editable && inTerm;
          return (
            <td key={iso} className="p-1 text-center">
              <button
                onClick={() => clickable && cycle(student.id, iso)}
                disabled={!clickable}
                title={inTerm ? formatDisplayDate(iso) : `${formatDisplayDate(iso)} — outside ${term?.label ?? ""}`}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-black tabular-nums transition-transform ${
                  clickable ? "hover:scale-105 cursor-pointer" : "cursor-not-allowed opacity-25"
                } ${isWeekend && !status ? "opacity-60" : ""}`}
                style={
                  meta
                    ? { backgroundColor: darkMode ? `${meta.color}25` : meta.bg, color: meta.color }
                    : { backgroundColor: darkMode ? "#ffffff10" : "#F3F4F6", color: "#9CA3AF" }
                }
              >
                {status ?? "·"}
              </button>
            </td>
          );
        })}
        <td className={`sticky right-28 z-10 border-l px-3 py-2 text-center ${panelBorder} ${stickyRightBg}`}>
          <span className="text-xs font-black tabular-nums" style={{ color: ACCENT }}>
            {present}/{total}
          </span>
        </td>
        <td className={`sticky right-0 z-10 border-l px-3 py-2 text-center ${panelBorder} ${stickyRightBg}`}>
          <button
            onClick={() => setSummaryStudent(student)}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
              darkMode ? "hover:bg-white/10" : "hover:bg-[#F6F7FB]"
            }`}
            style={{ color: ACCENT }}
          >
            View 
          </button>
        </td>
      </tr>
    );
  }

  if (!term) {
    return (
      <div className={`${cardClasses} px-5 py-16 text-center`}>
        <p className={`font-bold ${textPrimary}`}>No terms set up yet</p>
        <p className={`mt-1 text-sm ${textMuted}`}>Add a grading period before recording attendance.</p>
      </div>
    );
  }

  return (
    <section className={cardClasses} aria-label="Attendance records">
      <div className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}>
        <div className="flex items-start gap-3">
          <div>
            <h2 className={`font-extrabold ${textPrimary}`}>Attendance Records</h2>
            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
              {roster.length} student{roster.length === 1 ? "" : "s"}
              {editable ? " · click a cell to edit" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className={`h-10 rounded-xl border px-2.5 text-xs font-bold outline-none ${panelBg} ${panelBorder} ${textPrimary}`}
            aria-label="Term"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

          <div className={`flex items-center gap-1 rounded-xl border px-1.5 py-1 ${panelBorder}`}>
            <button
              onClick={goToPrevMonth}
              disabled={!canGoPrev}
              aria-label="Previous month"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${
                darkMode ? "hover:bg-white/10" : "hover:bg-[#F6F7FB]"
              } ${textMuted}`}
            >
              <ChevronLeft size={16} />
            </button>
            <span className={`min-w-32 px-2 py-1 text-center text-xs font-extrabold ${textPrimary}`}>{monthLabel(viewDate)}</span>
            <button
              onClick={goToNextMonth}
              disabled={!canGoNext}
              aria-label="Next month"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${
                darkMode ? "hover:bg-white/10" : "hover:bg-[#F6F7FB]"
              } ${textMuted}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className={`flex flex-wrap gap-3 border-b px-5 py-3 ${panelBorder}`}>
        {(Object.keys(ATTENDANCE_META) as (keyof typeof ATTENDANCE_META)[]).map((key) => {
          const meta = ATTENDANCE_META[key];
          return (
            <span key={key} className="flex items-center gap-1.5 text-xs font-bold" style={{ color: meta.color }}>
              <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
              {key} — {meta.label}
            </span>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 px-5 py-16">
          <Loader2 size={16} className={`animate-spin ${textMuted}`} />
          <p className={`text-sm font-semibold ${textMuted}`}>Loading attendance...</p>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                <th
                  className={`sticky left-0 z-20 min-w-60 px-5 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider ${
                    darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                  } ${textMuted}`}
                >
                  Student
                </th>
                {days.map(({ date, iso, dayOfWeek }) => {
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const inTerm = iso >= term.startDate && iso <= term.endDate;
                  return (
                    <th key={iso} className="px-0 py-2.5">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-[9px] font-bold uppercase ${isWeekend || !inTerm ? "opacity-30" : ""} ${textMuted}`}>
                          {WEEKDAY_LETTERS[dayOfWeek]}
                        </span>
                        <span className={`text-xs font-black tabular-nums ${isWeekend || !inTerm ? "opacity-30" : ""} ${textPrimary}`}>
                          {date.getDate()}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th
                  className={`sticky right-28 z-20 min-w-28 border-l px-3 py-3 text-center text-[11px] font-extrabold uppercase tracking-wider ${panelBorder} ${
                    darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                  } ${textMuted}`}
                >
                  Present / School Days
                  <br />
                  <span className="normal-case font-semibold">({term.label})</span>
                </th>
                <th
                  className={`sticky right-0 z-20 min-w-28 border-l px-3 py-3 text-center text-[11px] font-extrabold uppercase tracking-wider ${panelBorder} ${
                    darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                  } ${textMuted}`}
                >
                  Summary
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedRoster.male.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={columnCount}
                      className={`px-5 py-3 text-left text-sm font-black uppercase tracking-wider ${
                        darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
                      } ${textPrimary}`}
                    >
                      Male
                    </td>
                  </tr>
                  {groupedRoster.male.map((student, index) => renderStudentRow(student, index))}
                </>
              )}

              {groupedRoster.female.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={columnCount}
                      className={`px-5 py-3 text-left text-sm font-black uppercase tracking-wider ${
                        darkMode ? "bg-white/10" : "bg-[#F1F2F4]"
                      } ${textPrimary}`}
                    >
                      Female
                    </td>
                  </tr>
                  {groupedRoster.female.map((student, index) => renderStudentRow(student, index))}
                </>
              )}

              {roster.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className={`px-5 py-12 text-center text-sm font-semibold ${textMuted}`}>
                    No students enrolled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {summaryStudent && (
        <StudentAttendanceSummaryModal
          student={summaryStudent}
          roster={roster}
          attendance={attendance}
          terms={terms}
          darkMode={darkMode}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
          onClose={() => setSummaryStudent(null)}
        />
      )}
    </section>
  );
}