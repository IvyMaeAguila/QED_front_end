import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { RosterStudent } from "../data";
import {
  ASSESSMENT_TAB_LABELS,
  ATTENDANCE_META,
  formatDisplayDate,
  HOLISTIC_COLUMNS,
  type AssessmentTabKey,
  type AttendanceMap,
  type GradeItem,
  type HolisticMap,
  type ScoreMap,
} from "../types/Grading";
import type { SubjectDetailTab } from "./TabNav";

const ACCENT = "#6B0000";
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

interface RecordsModalProps {
  tab: SubjectDetailTab;
  roster: RosterStudent[];
  items: GradeItem[];
  scores: ScoreMap;
  attendance: AttendanceMap;
  holistic: HolisticMap;
  onClose: () => void;
  darkMode: boolean;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function countElapsedWeekdaysInMonth(days: { date: Date; dayOfWeek: number }[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return days.filter(({ date, dayOfWeek }) => dayOfWeek !== 0 && dayOfWeek !== 6 && date <= today).length;
}

export function RecordsModal({
  tab,
  roster,
  items,
  scores,
  attendance,
  holistic,
  onClose,
  darkMode,
  panelBorder,
  textPrimary,
  textMuted,
}: RecordsModalProps) {
  const tabItems = items.filter((i) => i.tab === (tab as AssessmentTabKey));
  const [viewDate, setViewDate] = useState(() => new Date());

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return { date: d, iso: toISODate(d), dayOfWeek: d.getDay() };
    });
  }, [viewDate]);

  const monthSummary = useMemo(() => {
    const summary: Record<string, { present: number; total: number }> = {};
    const total = countElapsedWeekdaysInMonth(days);
    for (const student of roster) {
      let present = 0;
      for (const { iso } of days) {
        if (attendance[student.id]?.[iso] === "P") present += 1;
      }
      summary[student.id] = { present, total };
    }
    return summary;
  }, [roster, days, attendance]);

  function goToPrevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function goToToday() {
    setViewDate(new Date());
  }

  const stickyRightBg = darkMode ? "bg-[#111827]" : "bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`w-full ${tab === "attendance" ? "max-w-4xl" : "max-w-2xl"} max-h-[85vh] rounded-2xl overflow-hidden shadow-xl flex flex-col ${
          darkMode ? "bg-[#111827]" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: ACCENT }}>
          <span className="text-white font-bold text-sm">Records Sheet</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {tab === "attendance" && (
          <div className={`flex items-center justify-between px-5 py-3 border-b shrink-0 ${panelBorder}`}>
            <div className="flex flex-wrap items-center gap-3">
              {(Object.keys(ATTENDANCE_META) as (keyof typeof ATTENDANCE_META)[]).map((key) => {
                const meta = ATTENDANCE_META[key];
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {key}
                    </span>
                    <span className={`text-[11px] font-semibold ${textMuted}`}>{meta.label}</span>
                  </div>
                );
              })}
            </div>

            <div className={`flex items-center gap-1 rounded-xl border px-1.5 py-1 ${panelBorder}`}>
              <button
                onClick={goToPrevMonth}
                aria-label="Previous month"
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  darkMode ? "hover:bg-white/10" : "hover:bg-[#F6F7FB]"
                } ${textMuted}`}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={goToToday}
                className={`min-w-28 rounded-lg px-2 py-1 text-center text-xs font-extrabold transition-colors ${
                  darkMode ? "hover:bg-white/10" : "hover:bg-[#F6F7FB]"
                } ${textPrimary}`}
              >
                {monthLabel(viewDate)}
              </button>
              <button
                onClick={goToNextMonth}
                aria-label="Next month"
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  darkMode ? "hover:bg-white/10" : "hover:bg-[#F6F7FB]"
                } ${textMuted}`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        <div className={tab === "attendance" ? "overflow-auto" : "p-5 overflow-y-auto"}>
          {tab === "attendance" && (
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                  <th
                    className={`sticky left-0 z-20 min-w-48 px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider ${
                      darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                    } ${textMuted}`}
                  >
                    Student
                  </th>
                  {days.map(({ date, iso, dayOfWeek }) => {
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <th key={iso} className="px-0 py-2.5">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-[8px] font-bold uppercase ${isWeekend ? "opacity-40" : ""} ${textMuted}`}>
                            {WEEKDAY_LETTERS[dayOfWeek]}
                          </span>
                          <span className={`text-[11px] font-black tabular-nums ${isWeekend ? "opacity-40" : ""} ${textPrimary}`}>
                            {date.getDate()}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th
                    className={`sticky right-0 z-20 min-w-24 border-l px-3 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-wider ${panelBorder} ${
                      darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                    } ${textMuted}`}
                  >
                    Present / School Days
                  </th>
                </tr>
              </thead>
              <tbody>
                {roster.map((student, index) => {
                  const { present, total } = monthSummary[student.id] ?? { present: 0, total: 0 };
                  const rowStripe = index % 2 === 1 ? (darkMode ? "bg-white/[0.015]" : "bg-black/[0.012]") : "";
                  return (
                    <tr key={student.id} className={`border-t ${panelBorder} ${rowStripe}`}>
                      <td className={`sticky left-0 z-10 px-4 py-2 ${darkMode ? "bg-[#111827]" : "bg-white"}`}>
                        <span className={`text-xs font-bold ${textPrimary}`}>{student.name}</span>
                      </td>
                      {days.map(({ iso, dayOfWeek }) => {
                        const status = attendance[student.id]?.[iso] ?? null;
                        const meta = status ? ATTENDANCE_META[status] : null;
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        return (
                          <td key={iso} className="p-1 text-center">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black tabular-nums ${
                                isWeekend && !status ? "opacity-30" : ""
                              }`}
                              style={
                                meta
                                  ? { backgroundColor: darkMode ? `${meta.color}25` : meta.bg, color: meta.color }
                                  : { backgroundColor: darkMode ? "#ffffff10" : "#F3F4F6", color: "#9CA3AF" }
                              }
                            >
                              {status ?? "·"}
                            </span>
                          </td>
                        );
                      })}
                      <td className={`sticky right-0 z-10 border-l px-3 py-2 text-center ${panelBorder} ${stickyRightBg}`}>
                        <span className="text-xs font-black tabular-nums" style={{ color: ACCENT }}>
                          {present}/{total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {tab === "holistic" && (
            <div className="space-y-3">
              {roster.map((student) => (
                <div key={student.id} className={`py-2 border-b ${panelBorder}`}>
                  <p className={`text-sm font-bold mb-1 ${textPrimary}`}>{student.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {HOLISTIC_COLUMNS.map((col) => (
                      <span key={col.key} className={`text-xs font-semibold ${textMuted}`}>
                        {col.label}: {holistic[student.id]?.[col.key] ?? "—"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(tab === "writtenWorks" || tab === "performanceTask" || tab === "exams") && (
            <div className="space-y-4">
              {tabItems.length === 0 ? (
                <p className={`text-sm font-semibold ${textMuted}`}>No {ASSESSMENT_TAB_LABELS[tab]} items recorded yet.</p>
              ) : (
                tabItems.map((item) => {
                  const itemScores = roster.map((s) => scores[s.id]?.[item.id] ?? null).filter((v): v is number => v !== null);
                  const avg = itemScores.length ? itemScores.reduce((a, b) => a + b, 0) / itemScores.length : null;
                  return (
                    <div key={item.id} className={`rounded-xl border p-3.5 ${panelBorder}`}>
                      <div className="flex items-center justify-between">
                        <p className={`font-bold text-sm ${textPrimary}`}>{item.activityName}</p>
                        <span className={`text-xs font-bold ${textMuted}`}>{formatDisplayDate(item.date)}</span>
                      </div>
                      <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>
                        Topic: {item.topic} &middot; {item.format} &middot; out of {item.maxItems}
                      </p>
                      <p className={`text-xs font-bold mt-1.5`} style={{ color: ACCENT }}>
                        Class average: {avg !== null ? avg.toFixed(1) : "No scores yet"}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}