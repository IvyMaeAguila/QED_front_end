import { useMemo, useState, type CSSProperties } from "react";
import { Filter, SlidersHorizontal, User } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useStudents } from "../../../admin/pages/studentrecords/context/StudentsContext";
import { formatFullName } from "../../../admin/pages/studentrecords/types/Students";
import type { AdminThemeContext } from "../../../admin/pages/AdminLayout";
import { buildOverview } from "./data";
import { RATING_LEVELS } from "./types/Holistic";

const ACCENT = "#6B0000";

const evaluationFor = (average: number) => {
  if (average >= 4.5) return { remark: "Excellent", range: "4.5 – 5.0" };
  if (average >= 3.5) return { remark: "Good", range: "3.5 – 4.4" };
  if (average >= 2.5) return { remark: "Average", range: "2.5 – 3.4" };
  if (average >= 1.5) return { remark: "Needs Improvement", range: "1.5 – 2.4" };
  return { remark: "Critical", range: "1.0 – 1.4" };
};

const TRENDS = ["Improving", "Consistent", "Stable", "Emerging", "Declining"];

export function HolisticOverviewPage() {
  const { darkMode, panelBg, panelBorder, textPrimary, textMuted } = useOutletContext<AdminThemeContext>();
  const { students } = useStudents();
  const [statusFilter, setStatusFilter] = useState("all");

  const overview = useMemo(() => buildOverview(students), [students]);
  const counts = useMemo(() => {
    const tally: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    overview.forEach(({ level }) => {
      tally[level.value] += 1;
    });
    return tally;
  }, [overview]);

  const filtered = overview.filter((row) => statusFilter === "all" || row.level.value === Number(statusFilter));
  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
            Student development
          </p>
          <h1 className={`mt-1 text-3xl font-black tracking-tight ${textPrimary}`}>Holistic overview</h1>
          <p className={`mt-2 max-w-2xl text-sm font-medium ${textMuted}`}>
            Monitor each student&apos;s cognitive, emotional, social, and behavioral development.
          </p>
        </div>
        <p className={`text-sm font-bold ${textMuted}`}>
          {overview.length} student{overview.length === 1 ? "" : "s"} assessed
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {RATING_LEVELS.slice()
          .reverse()
          .map((level) => {
            const active = statusFilter === String(level.value);
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => setStatusFilter(active ? "all" : String(level.value))}
                className={`rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  active ? "shadow-md" : ""
                } ${darkMode ? "border-white/10" : "border-black/6"}`}
                style={{
                  backgroundColor: active ? `${level.color}38` : `${level.color}18`,
                  borderColor: active ? level.color : `${level.color}45`,
                  // @ts-expect-error -- Tailwind reads the custom focus-ring property at runtime.
                  "--tw-ring-color": level.color,
                }}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${textMuted}`}>{level.label}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: level.color }} />
                </span>
                <strong className={`mt-3 block text-3xl font-black tabular-nums ${textPrimary}`}>{counts[level.value]}</strong>
                <span className={`mt-1 block text-[11px] font-semibold ${textMuted}`}>students</span>
              </button>
            );
          })}
      </div>

      <section className={cardClasses} aria-label="Student holistic assessment roster">
        <div className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: ACCENT }}>
              <SlidersHorizontal size={18} />
            </span>
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>Assessment roster</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>Review each student&apos;s current holistic evaluation.</p>
            </div>
          </div>

          <div className="relative shrink-0">
            <Filter size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`h-10 w-full appearance-none rounded-xl border py-2 pl-9 pr-9 text-xs font-bold outline-none transition focus:ring-2 sm:w-48 ${panelBg} ${panelBorder} ${textPrimary}`}
              aria-label="Filter students by assessment status"
              style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties}
            >
              <option value="all">All assessment levels</option>
              {RATING_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className={`font-bold ${textPrimary}`}>No students found</p>
            <p className={`mt-1 text-sm ${textMuted}`}>Try selecting a different assessment level.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                    {['Student', 'Average score', 'Remarks'].map((heading) => (
                      <th key={heading} className={`px-5 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-wider ${textMuted}`}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, index) => {
                    const evaluation = evaluationFor(row.average);
                    return (
                    <tr
                      key={row.student.id}
                      className={`border-t transition-colors ${panelBorder} ${
                        index % 2 === 1 ? (darkMode ? "bg-white/1.5" : "bg-black/[0.012]") : ""
                      } ${darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}>
                            <User size={16} style={{ color: ACCENT }} />
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate font-extrabold ${textPrimary}`}>{formatFullName(row.student)}</p>
                            <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>Student ID: {row.student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-lg font-black tabular-nums ${textPrimary}`}>{row.average.toFixed(1)}</span>
                        <span className={`ml-1 text-xs font-semibold ${textMuted}`}>/ 5.0</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ backgroundColor: `${row.level.color}18`, color: row.level.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: row.level.color }} />
                          {evaluation.remark}
                        </span>
                        <p className={`mt-1 text-[11px] font-semibold ${textMuted}`}>{evaluation.range}</p>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={`divide-y md:hidden ${panelBorder}`}>
              {filtered.map((row) => {
                const evaluation = evaluationFor(row.average);
                return (
                <div
                  key={row.student.id}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}>
                        <User size={16} style={{ color: ACCENT }} />
                      </span>
                      <div className="min-w-0">
                        <p className={`truncate font-extrabold ${textPrimary}`}>{formatFullName(row.student)}</p>
                        <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>ID: {row.student.id}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-black ${textPrimary}`}>{row.average.toFixed(1)} <span className={`text-xs font-semibold ${textMuted}`}>/ 5.0</span></span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 pl-12">
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-extrabold" style={{ backgroundColor: `${row.level.color}18`, color: row.level.color }}>
                      {evaluation.remark}
                    </span>
                    <span className={`text-[11px] font-semibold ${textMuted}`}>{evaluation.range}</span>
                  </div>
                </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className={`${cardClasses} p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>Holistic evaluation guide</h2>
              <p className={`mt-1 text-xs font-medium ${textMuted}`}>Remarks are assigned from each student&apos;s average score.</p>
            </div>
            <span className="rounded-lg px-2.5 py-1 text-xs font-black text-white" style={{ backgroundColor: ACCENT }}>1.0 – 5.0</span>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-5">
            {[5, 4, 3, 2, 1].map((level) => {
              const exemplar = evaluationFor(level === 5 ? 5 : level);
              const rating = RATING_LEVELS.find((item) => item.value === level);
              return (
                <div key={level} className="rounded-xl p-3" style={{ backgroundColor: `${rating?.color ?? ACCENT}18` }}>
                  <p className="text-[11px] font-black" style={{ color: rating?.color ?? ACCENT }}>{exemplar.remark}</p>
                  <p className={`mt-1 text-[11px] font-semibold ${textMuted}`}>{exemplar.range}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${cardClasses} p-5 sm:p-6`}>
          <h2 className={`font-extrabold ${textPrimary}`}>Development trends</h2>
          <p className={`mt-1 text-xs font-medium ${textMuted}`}>Use these labels when recording progress over time.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TRENDS.map((trend, index) => (
              <span key={trend} className={`rounded-full px-3 py-1.5 text-xs font-bold ${darkMode ? "bg-white/[0.07]" : "bg-[#F8FAFC]"} ${textPrimary}`}>
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ["#2F9E44", "#228BE6", "#6C757D", "#F08C00", "#E03131"][index] }} />
                {trend}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
