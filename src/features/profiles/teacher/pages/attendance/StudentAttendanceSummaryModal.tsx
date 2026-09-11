import { User, X } from "lucide-react";
import type { RosterStudent } from "../subjects/detail/data";
import {
  type AttendanceMap,
  type GradingPeriod,
} from "../subjects/detail/types/Grading";

const ACCENT = "#6B0000";

interface StudentAttendanceSummaryModalProps {
  student: RosterStudent;
  roster: RosterStudent[];
  attendance: AttendanceMap;
  terms: GradingPeriod[];
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  onClose: () => void;
}

function parseISO(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function yearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shortMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

// Every calendar date in a given YYYY-MM month, clipped to the term's start/end range.
function datesInMonthWithinTerm(ym: string, term: GradingPeriod): string[] {
  const [y, m] = ym.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const out: string[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (iso >= term.startDate && iso <= term.endDate) out.push(iso);
  }
  return out;
}


function monthsInTerm(term: GradingPeriod): string[] {
  const months: string[] = [];
  let cursor = parseISO(term.startDate);
  const endYM = yearMonth(parseISO(term.endDate));
  while (yearMonth(cursor) <= endYM) {
    months.push(yearMonth(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
}

export function StudentAttendanceSummaryModal({
  student,
  roster,
  attendance,
  terms,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  onClose,
}: StudentAttendanceSummaryModalProps) {
  const cellBase = `px-3 py-2.5 text-center text-xs font-bold tabular-nums ${textPrimary}`;
  const headBase = `px-3 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider ${textMuted}`;
  const subtleBg = darkMode ? "bg-white/5" : "bg-[#F8FAFC]";
  const zebraBg = darkMode ? "bg-white/[0.02]" : "bg-black/[0.012]";

  // Precompute every term's month-by-month stats once, then derive the
  // overall (all-terms) totals from that same data so the top summary
  // cards and the per-term tables never disagree.
  const perTermStats = terms.map((term) => {
    const months = monthsInTerm(term);
    let termClassDays = 0;
    let termPresent = 0;

    const monthStats = months.map((ym) => {
      const dates = datesInMonthWithinTerm(ym, term);
      let classDays = 0;
      let present = 0;
      for (const iso of dates) {
        // A "class day" is any date someone on the roster was marked for —
        // same rule the main calendar's Present/School Days total uses.
        const marked = roster.some((s) => attendance[s.id]?.[iso]);
        if (!marked) continue;
        classDays += 1;
        if (attendance[student.id]?.[iso] === "P") present += 1;
      }
      termClassDays += classDays;
      termPresent += present;
      return { ym, classDays, present, absent: classDays - present };
    });

    return {
      term,
      monthStats,
      termClassDays,
      termPresent,
      termAbsent: termClassDays - termPresent,
    };
  });

  const overall = perTermStats.reduce(
    (acc, t) => ({
      classDays: acc.classDays + t.termClassDays,
      present: acc.present + t.termPresent,
      absent: acc.absent + t.termAbsent,
    }),
    { classDays: 0, present: 0, absent: 0 },
  );
  const attendanceRate =
    overall.classDays > 0
      ? Math.round((overall.present / overall.classDays) * 1000) / 10
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${panelBg} ${panelBorder}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — accent bar + large student identity */}
        <div className="relative shrink-0">
          <div className="h-1.5 w-full" style={{ backgroundColor: ACCENT }} />
          <div
            className={`flex items-center justify-between gap-4 border-b px-8 py-6 ${panelBorder}`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700 shadow-sm">
                <User size={28} />
              </div>
              <div>
                <p
                  className={`text-[11px] font-extrabold uppercase tracking-widest ${textMuted}`}
                >
                  Attendance Summary
                </p>
                <h3
                  className={`mt-0.5 text-2xl font-black leading-tight ${textPrimary}`}
                >
                  {student.name}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${panelBorder} ${
                darkMode ? "hover:bg-white/10" : "hover:bg-[#F6F7FB]"
              } ${textMuted}`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          {/* Overall totals across every term, at a glance */}
          <div
            className={`grid grid-cols-2 gap-3 border-b px-8 py-6 sm:grid-cols-4 ${panelBorder}`}
          >
            <div
              className={`rounded-xl border px-4 py-3 ${panelBorder} ${subtleBg}`}
            >
              <p
                className={`text-[10px] font-extrabold uppercase tracking-wider ${textMuted}`}
              >
                Total School Days
              </p>
              <p
                className={`mt-1 text-2xl font-black tabular-nums ${textPrimary}`}
              >
                {overall.classDays}
              </p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${panelBorder} ${subtleBg}`}
            >
              <p
                className={`text-[10px] font-extrabold uppercase tracking-wider ${textMuted}`}
              >
                Days Present
              </p>
              <p
                className="mt-1 text-2xl font-black tabular-nums"
                style={{ color: "#15803D" }}
              >
                {overall.present}
              </p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${panelBorder} ${subtleBg}`}
            >
              <p
                className={`text-[10px] font-extrabold uppercase tracking-wider ${textMuted}`}
              >
                Days Absent
              </p>
              <p
                className="mt-1 text-2xl font-black tabular-nums"
                style={{ color: ACCENT }}
              >
                {overall.absent}
              </p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${panelBorder} ${subtleBg}`}
            >
              <p
                className={`text-[10px] font-extrabold uppercase tracking-wider ${textMuted}`}
              >
                Attendance Rate
              </p>
              <p
                className={`mt-1 text-2xl font-black tabular-nums ${textPrimary}`}
              >
                {attendanceRate !== null ? `${attendanceRate}%` : "—"}
              </p>
            </div>
          </div>

          {/* Per-term, per-month breakdown */}
          <div className="flex flex-col gap-7 px-8 py-6">
            {perTermStats.map(
              ({
                term,
                monthStats,
                termClassDays,
                termPresent,
                termAbsent,
              }) => (
                <div key={term.id}>
                  <div className="mb-2.5 flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: ACCENT }}
                    />
                    <p className={`text-sm font-extrabold ${textPrimary}`}>
                      {term.label}
                    </p>
                  </div>
                  <div
                    className={`overflow-hidden rounded-xl border ${panelBorder}`}
                  >
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={subtleBg}>
                          <th className={`${headBase} min-w-40 text-left`}>
                            Month
                          </th>
                          {monthStats.map(({ ym }) => (
                            <th key={ym} className={headBase}>
                              {shortMonthLabel(ym)}
                            </th>
                          ))}
                          <th
                            className={`${headBase} border-l ${panelBorder}`}
                            style={{ color: ACCENT }}
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={`border-t ${panelBorder}`}>
                          <td
                            className={`px-3 py-2.5 text-left text-xs font-bold ${textPrimary}`}
                          >
                            No. of Class Days
                          </td>
                          {monthStats.map(({ ym, classDays }) => (
                            <td key={ym} className={cellBase}>
                              {classDays}
                            </td>
                          ))}
                          <td
                            className={`${cellBase} border-l ${panelBorder} ${subtleBg}`}
                            style={{ color: ACCENT }}
                          >
                            {termClassDays}
                          </td>
                        </tr>
                        <tr className={`border-t ${panelBorder} ${zebraBg}`}>
                          <td
                            className={`px-3 py-2.5 text-left text-xs font-bold ${textPrimary}`}
                          >
                            No. of Days Present
                          </td>
                          {monthStats.map(({ ym, present }) => (
                            <td key={ym} className={cellBase}>
                              {present}
                            </td>
                          ))}
                          <td
                            className={`${cellBase} border-l ${panelBorder} ${subtleBg}`}
                            style={{ color: ACCENT }}
                          >
                            {termPresent}
                          </td>
                        </tr>
                        <tr className={`border-t ${panelBorder}`}>
                          <td
                            className={`px-3 py-2.5 text-left text-xs font-bold ${textPrimary}`}
                          >
                            No. of Days Absent
                          </td>
                          {monthStats.map(({ ym, absent }) => (
                            <td key={ym} className={cellBase}>
                              {absent}
                            </td>
                          ))}
                          <td
                            className={`${cellBase} border-l ${panelBorder} ${subtleBg}`}
                            style={{ color: ACCENT }}
                          >
                            {termAbsent}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
            )}

            {terms.length === 0 && (
              <p className={`text-center text-sm font-semibold ${textMuted}`}>
                No terms set up yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
