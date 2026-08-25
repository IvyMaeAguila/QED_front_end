import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Search, Sparkles, User } from "lucide-react";
import type { RosterStudent } from "../data";
import {
  HOLISTIC_COLUMNS,
  HOLISTIC_LEVELS,
  type HolisticAxisKey,
  type HolisticMap,
} from "../types/Grading";

const ACCENT = "#6B0000";

interface HolisticTabProps {
  roster: RosterStudent[];
  ratings: HolisticMap;
  weekStartDate: string; 
  termNumber: number;
  locked: boolean;
  onRate: (studentId: string, axis: HolisticAxisKey, value: number) => void;
  onOpenRecords: () => void;
  darkMode: boolean;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
}

function formatWeekRange(weekStartISO: string): string {
  const start = new Date(weekStartISO + "T00:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 4); 

  const startLabel = start.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { day: "numeric", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export function HolisticTab({
  roster,
  ratings,
  weekStartDate,
  locked,
  onRate,
  onOpenRecords,
  darkMode,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
}: HolisticTabProps) {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(
    () =>
      roster.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [roster, search],
  );

  const cardClasses = `overflow-hidden rounded-2xl border shadow-sm ${panelBg} ${panelBorder}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            {HOLISTIC_LEVELS.slice()
              .reverse()
              .map((level) => (
                <div key={level.value} className="flex items-center gap-2">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white"
                    style={{ background: level.color }}
                  >
                    {level.value}
                  </span>
                  <span className={`text-sm font-semibold ${textMuted}`}>{level.label}</span>
                </div>
              ))}
          </div>
          <p className={`mt-2 text-xs font-medium ${textMuted}`}>
            Click cells to rate · This week's observation only
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onOpenRecords}
            className="h-11 shrink-0 rounded-xl px-6 text-sm font-extrabold text-white transition-opacity hover:opacity-90"
            style={{ background: ACCENT }}
          >
            Records
          </button>
        </div>
      </div>

      <section className={cardClasses} aria-label="Holistic assessment">
        <div
          className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${panelBorder}`}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className={`font-extrabold ${textPrimary}`}>Holistic assessment</h2>
              <p className={`mt-0.5 text-xs font-medium ${textMuted}`}>
                Week of {formatWeekRange(weekStartDate)} · {filtered.length} student{filtered.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student"
                className={`h-10 w-full rounded-xl border py-2 pl-9 pr-3 text-xs font-bold outline-none transition focus:ring-2 sm:w-44 ${panelBg} ${panelBorder} ${textPrimary}`}
                style={{ "--tw-ring-color": `${ACCENT}55` } as CSSProperties}
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className={`font-bold ${textPrimary}`}>No students found</p>
            <p className={`mt-1 text-sm ${textMuted}`}>Try a different search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={darkMode ? "bg-white/3" : "bg-[#F8FAFC]"}>
                  <th
                    className={`sticky left-0 z-10 min-w-60 px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider ${
                      darkMode ? "bg-[#111827]" : "bg-[#F8FAFC]"
                    } ${textMuted}`}
                  >
                    Student
                  </th>
                  {HOLISTIC_COLUMNS.map((col) => (
                    <th key={col.key} className="min-w-32 px-3 py-4 text-center">
                      <p className={`text-xs font-extrabold ${textPrimary}`}>
                        {col.label}
                      </p>
                      <p
                        className={`mt-0.5 text-[10px] font-semibold ${textMuted}`}
                      >
                        ({col.description})
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`border-t transition-colors ${panelBorder} ${
                      index % 2 === 1
                        ? darkMode
                          ? "bg-white/1.5"
                          : "bg-black/[0.012]"
                        : ""
                    } ${darkMode ? "hover:bg-white/5" : "hover:bg-[#FFF8F8]"}`}
                  >
                    <td
                      className={`sticky left-0 z-10 px-5 py-4 ${darkMode ? "bg-[#111827]" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? "bg-[#3A2222]" : "bg-[#F8EDEE]"}`}
                        >
                          <User size={16} style={{ color: ACCENT }} />
                        </span>
                        <div className="min-w-0">
                          <p className={`truncate font-extrabold ${textPrimary}`}>
                            {student.name}
                          </p>
                          <p
                            className={`mt-0.5 text-xs font-medium ${textMuted}`}
                          >
                            Student ID: {student.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    {HOLISTIC_COLUMNS.map((col) => {
                      const current = ratings[student.id]?.[col.key] ?? null;
                      return (
                        <td key={col.key} className="px-3 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {HOLISTIC_LEVELS.slice()
                              .reverse()
                              .map((level) => {
                                const selected = current === level.value;
                                return (
                                  <button
                                    key={level.value}
                                    type="button"
                                    disabled={locked}
                                    aria-disabled={locked}
                                    onClick={() => {
                                      onRate(student.id, col.key, level.value);
                                      setToast("Weekly holistic records saved.");
                                    }}
                                    className={`h-7 w-7 rounded-md text-xs font-black transition-all ${
                                      selected
                                        ? "scale-105 text-white"
                                        : darkMode
                                        ? "bg-white/6 text-[#9CA3AF] hover:bg-white/10"
                                        : "bg-black/4 text-[#6B7280] hover:bg-black/[0.07]"
                                    }`}
                                    style={
                                      selected
                                        ? { backgroundColor: level.color }
                                        : undefined
                                    }
                                  >
                                    {level.value}
                                  </button>
                                );
                              })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {toast && <div role="status" className="fixed bottom-5 right-5 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl">{toast}</div>}
    </div>
  );
}
